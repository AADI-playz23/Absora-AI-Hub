import express from 'express';
import cors from 'cors';
import crypto from 'crypto';
import catalogModels from '../catalog/models.json' assert { type: 'json' };

const app = express();
app.use(cors());
app.use(express.json());

// In-Memory & File Persistence Store for Vercel Serverless execution
let globalState = {
  colab_status: 'IDLE',
  tunnel_url: null,
  vram_used_gb: 0.0,
  vram_free_gb: 16.0,
  loaded_models: [],
  sessions: [],
  users: []
};

// Secret key for JWT
const JWT_SECRET = process.env.JWT_SECRET || 'absora-vercel-jwt-secret-2026';

function hashPassword(pass) {
  return crypto.createHash('sha256').update(pass).digest('hex');
}

function generateToken(user) {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const payload = Buffer.from(JSON.stringify({ userId: user.id, username: user.username, email: user.email, exp: Date.now() + 86400000 })).toString('base64url');
  const signature = crypto.createHmac('sha256', JWT_SECRET).update(`${header}.${payload}`).digest('base64url');
  return `${header}.${payload}.${signature}`;
}

function verifyToken(token) {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const signature = crypto.createHmac('sha256', JWT_SECRET).update(`${parts[0]}.${parts[1]}`).digest('base64url');
    if (signature !== parts[2]) return null;
    const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString('utf8'));
    if (payload.exp && Date.now() > payload.exp) return null;
    return payload;
  } catch {
    return null;
  }
}

// Auth Middleware
function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  const payload = verifyToken(authHeader.split(' ')[1]);
  if (!payload) return res.status(401).json({ error: 'Invalid token' });
  req.user = payload;
  next();
}

// ── ROUTES ──

// Auth
app.post('/api/auth/register', (req, res) => {
  const { username, email, password } = req.body;
  if (!username || !email || !password) return res.status(400).json({ error: 'All fields required' });

  if (globalState.users.some(u => u.username === username || u.email === email)) {
    return res.status(409).json({ error: 'Username or email already taken' });
  }

  const user = { id: 'usr_' + crypto.randomBytes(4).toString('hex'), username, email, passHash: hashPassword(password) };
  globalState.users.push(user);
  const token = generateToken(user);
  res.json({ success: true, user: { id: user.id, username: user.username, email: user.email }, token });
});

app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body;
  const passHash = hashPassword(password);
  const user = globalState.users.find(u => u.username === username && u.passHash === passHash);

  if (!user) return res.status(401).json({ error: 'Invalid credentials' });
  const token = generateToken(user);
  res.json({ success: true, user: { id: user.id, username: user.username, email: user.email }, token });
});

// Catalog & VRAM Status
app.get('/api/models', (req, res) => {
  const loadedIds = new Set(globalState.loaded_models.map(m => m.model_id));
  const models = catalogModels.map(m => {
    let status = 'IDLE';
    if (loadedIds.has(m.id)) status = 'ACTIVE';
    else if (globalState.colab_status === 'STARTING') status = 'LOADING';
    else if (globalState.vram_free_gb < m.vram_gb && globalState.colab_status === 'ACTIVE') status = 'QUEUED';
    return { ...m, status };
  });

  res.json({
    colab_status: globalState.colab_status,
    vram: { total: 16.0, used: globalState.vram_used_gb, free: globalState.vram_free_gb },
    models
  });
});

app.get('/api/models/status', (req, res) => {
  res.json({
    colab_status: globalState.colab_status,
    tunnel_url: globalState.tunnel_url,
    vram_used_gb: globalState.vram_used_gb,
    vram_free_gb: globalState.vram_free_gb,
    loaded_models: globalState.loaded_models
  });
});

// Sessions
app.post('/api/sessions/request', authMiddleware, (req, res) => {
  const { model_id } = req.body;
  const targetModel = catalogModels.find(m => m.id === model_id);
  if (!targetModel) return res.status(404).json({ error: 'Model not found' });

  const sessionId = 'ses_' + crypto.randomBytes(4).toString('hex');
  const colabLink = `https://colab.research.google.com/github/AADI-playz23/Absora-AI-Hub/blob/main/notebooks/vllm_orchestrator.ipynb`;

  // Active tunnel exists
  if (globalState.colab_status === 'ACTIVE' && globalState.tunnel_url) {
    const isLoaded = globalState.loaded_models.some(m => m.model_id === model_id);
    const session = {
      id: sessionId,
      user_id: req.user.userId,
      model_id,
      status: 'ACTIVE',
      tunnel_url: globalState.tunnel_url,
      expires_at: Math.floor(Date.now() / 1000) + 7200
    };
    globalState.sessions.push(session);
    return res.json({
      success: true,
      session_id: sessionId,
      status: 'ACTIVE',
      model_id,
      tunnel_url: globalState.tunnel_url,
      colab_url: colabLink,
      message: 'Joined active endpoint session!'
    });
  }

  // Colab not running yet → return direct one-click Colab deep-link
  globalState.colab_status = 'STARTING';
  const session = {
    id: sessionId,
    user_id: req.user.userId,
    model_id,
    status: 'STARTING',
    colab_url: colabLink
  };
  globalState.sessions.push(session);

  res.json({
    success: true,
    session_id: sessionId,
    status: 'STARTING',
    model_id,
    colab_url: colabLink,
    message: 'Colab worker starting. Click "Open in Colab" to run the one-click single-cell worker.'
  });
});

app.get('/api/sessions/mine', authMiddleware, (req, res) => {
  const now = Math.floor(Date.now() / 1000);
  const userSessions = globalState.sessions
    .filter(s => s.user_id === req.user.userId)
    .map(s => ({
      ...s,
      tunnel_url: s.status === 'ACTIVE' ? globalState.tunnel_url : null,
      seconds_remaining: s.expires_at ? Math.max(0, s.expires_at - now) : null
    }));

  res.json({ sessions: userSessions, colab_status: globalState.colab_status });
});

// Webhooks from Colab
app.post('/api/webhook/tunnel', (req, res) => {
  const { session_id, tunnel_url, initial_model_id } = req.body;
  if (!tunnel_url) return res.status(400).json({ error: 'tunnel_url required' });

  globalState.colab_status = 'ACTIVE';
  globalState.tunnel_url = tunnel_url;
  globalState.vram_used_gb = 3.0;
  globalState.vram_free_gb = 13.0;

  if (initial_model_id) {
    globalState.loaded_models = [{ model_id: initial_model_id, hf_id: 'auto', vram_gb: 3.0, port: 8001 }];
  }

  const now = Math.floor(Date.now() / 1000);
  globalState.sessions.forEach(s => {
    if (s.status === 'STARTING') {
      s.status = 'ACTIVE';
      s.tunnel_url = tunnel_url;
      s.expires_at = now + 7200;
    }
  });

  res.json({ success: true, message: 'Tunnel registered on Vercel API Serverless gateway!' });
});

app.post('/api/webhook/status', (req, res) => {
  const data = req.body;
  globalState.colab_status = 'ACTIVE';
  globalState.vram_used_gb = data.allocated_vram_gb || 0;
  globalState.vram_free_gb = data.free_vram_gb || 16.0;
  if (data.tunnel_url) globalState.tunnel_url = data.tunnel_url;
  if (Array.isArray(data.loaded_models)) {
    globalState.loaded_models = data.loaded_models;
  }
  res.json({ success: true });
});

app.post('/api/webhook/stopped', (req, res) => {
  globalState.colab_status = 'IDLE';
  globalState.tunnel_url = null;
  globalState.vram_used_gb = 0;
  globalState.vram_free_gb = 16.0;
  globalState.loaded_models = [];
  res.json({ success: true });
});

export default app;
