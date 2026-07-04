import catalogModels from '../../catalog/models.json' with { type: 'json' };
import { verifyJWT } from '../jwt.js';
import { getColabState, getLoadedModels, createSession, getActiveSessions } from '../db.js';
import { triggerGitHubColabLaunch } from '../github.js';

export function handleSessionRoutes(app) {
  // Middleware to authenticate JWT
  const authMiddleware = async (c, next) => {
    const authHeader = c.req.header('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return c.json({ error: 'Unauthorized. Bearer token required.' }, 401);
    }
    const token = authHeader.split(' ')[1];
    const payload = await verifyJWT(token, c.env.JWT_SECRET || 'absora-secret');
    if (!payload) {
      return c.json({ error: 'Invalid or expired token' }, 401);
    }
    c.set('user', payload);
    await next();
  };

  // POST /sessions/request — Launch or join an SLM session
  app.post('/sessions/request', authMiddleware, async (c) => {
    const { model_id } = await c.req.json();
    const user = c.get('user');
    const db = c.env.DB;

    const targetModel = catalogModels.find(m => m.id === model_id);
    if (!targetModel) {
      return c.json({ error: 'Model not found in catalog' }, 404);
    }

    const colabState = await getColabState(db);
    const loadedModels = await getLoadedModels(db);
    const isLoaded = loadedModels.some(m => m.model_id === model_id);

    const sessionId = 'ses_' + crypto.randomUUID().slice(0, 8);

    // Case 1: Model is already active in VRAM → instant session creation
    if (isLoaded && colabState.status === 'ACTIVE' && colabState.tunnel_url) {
      await createSession(db, {
        id: sessionId,
        user_id: user.userId,
        model_id,
        status: 'ACTIVE'
      });
      return c.json({
        success: true,
        session_id: sessionId,
        status: 'ACTIVE',
        model_id,
        tunnel_url: colabState.tunnel_url,
        expires_in_seconds: 7200,
        message: 'Joined active model session. Endpoint is ready!'
      });
    }

    // Case 2: Colab worker is active and has enough VRAM free to load mid-session
    if (colabState.status === 'ACTIVE' && colabState.tunnel_url && colabState.vram_free_gb >= targetModel.vram_gb) {
      // Trigger load endpoint on Colab Orchestrator
      try {
        const loadRes = await fetch(`${colabState.tunnel_url}/load`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model_id: targetModel.id,
            hf_id: targetModel.hf_id,
            vram_gb: targetModel.vram_gb
          })
        });
        if (loadRes.ok) {
          await createSession(db, {
            id: sessionId,
            user_id: user.userId,
            model_id,
            status: 'ACTIVE'
          });
          return c.json({
            success: true,
            session_id: sessionId,
            status: 'ACTIVE',
            model_id,
            tunnel_url: colabState.tunnel_url,
            expires_in_seconds: 7200,
            message: `Model ${targetModel.name} dynamically loaded into VRAM!`
          });
        }
      } catch (err) {
        console.error('Mid-session load error:', err);
      }
    }

    // Case 3: Colab worker is IDLE → trigger GitHub Actions to launch Colab
    if (colabState.status === 'IDLE' || !colabState.tunnel_url) {
      await createSession(db, {
        id: sessionId,
        user_id: user.userId,
        model_id,
        status: 'LOADING'
      });

      // Mark state as STARTING
      await db.prepare('UPDATE colab_state SET status = "STARTING" WHERE id = 1').run();

      // Trigger GitHub Actions workflow dispatch
      const ghResult = await triggerGitHubColabLaunch(c.env, {
        session_id: sessionId,
        model_id: targetModel.id,
        hf_id: targetModel.hf_id,
        vram_gb: targetModel.vram_gb
      });

      return c.json({
        success: true,
        session_id: sessionId,
        status: 'STARTING',
        model_id,
        github_triggered: ghResult.success,
        message: 'GitHub Actions triggered to boot Colab T4 GPU worker. Endpoint will be ready in 2-3 minutes.'
      });
    }

    // Case 4: VRAM is full or worker busy → Queue user
    const activeQueue = await db.prepare('SELECT COUNT(*) as count FROM sessions WHERE status = "QUEUED"').first();
    const queuePos = (activeQueue?.count || 0) + 1;

    await createSession(db, {
      id: sessionId,
      user_id: user.userId,
      model_id,
      status: 'QUEUED',
      queue_position: queuePos
    });

    return c.json({
      success: true,
      session_id: sessionId,
      status: 'QUEUED',
      model_id,
      queue_position: queuePos,
      message: `VRAM currently full. Placed in queue position #${queuePos}.`
    });
  });

  // GET /sessions/mine — List current active sessions for the user with tunnel URL
  app.get('/sessions/mine', authMiddleware, async (c) => {
    const user = c.get('user');
    const db = c.env.DB;
    const now = Math.floor(Date.now() / 1000);

    const colabState = await getColabState(db);

    const res = await db.prepare(`
      SELECT * FROM sessions 
      WHERE user_id = ? AND status IN ('ACTIVE', 'LOADING', 'QUEUED')
      ORDER BY created_at DESC
    `).bind(user.userId).all();

    const activeSessions = (res.results || []).map(s => {
      const isExpired = s.expires_at && s.expires_at < now;
      return {
        ...s,
        tunnel_url: (s.status === 'ACTIVE' && !isExpired) ? colabState.tunnel_url : null,
        status: isExpired ? 'EXPIRED' : s.status,
        seconds_remaining: s.expires_at ? Math.max(0, s.expires_at - now) : null
      };
    });

    return c.json({ sessions: activeSessions, colab_status: colabState.status });
  });
}
