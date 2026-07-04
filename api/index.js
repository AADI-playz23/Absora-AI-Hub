import express from 'express';
import cors from 'cors';
import crypto from 'crypto';

const app = express();
app.use(cors());
app.use(express.json());

// Inlined Catalog Models (Guarantees zero file resolution / bundle errors on Vercel)
const catalogModels = [
  {
    id: "deepseek-r1-1.5b",
    name: "DeepSeek R1 Distill 1.5B",
    hf_id: "deepseek-ai/DeepSeek-R1-Distill-Qwen-1.5B",
    vram_gb: 3.0,
    context: "8192",
    category: "Reasoning",
    badge: "R1 Distill",
    description: "DeepSeek R1 chain-of-thought reasoning model distilled into a compact 1.5B size."
  },
  {
    id: "phi3.5-mini",
    name: "Phi 3.5 Mini Instruct",
    hf_id: "microsoft/Phi-3.5-mini-instruct",
    vram_gb: 7.5,
    context: "128000",
    category: "SLM",
    badge: "128K Ctx",
    description: "Microsoft's 3.8B parameter model with a 128K token context window."
  },
  {
    id: "qwen2.5-7b",
    name: "Qwen 2.5 7B Instruct",
    hf_id: "Qwen/Qwen2.5-7B-Instruct-AWQ",
    vram_gb: 8.0,
    context: "32768",
    category: "SLM",
    badge: "AWQ 7B",
    description: "Alibaba Cloud's flagship 7B model in 4-bit AWQ quantization."
  }
];

// Global In-Memory State for Vercel Serverless execution
let globalState = {
  colab_status: 'IDLE',
  tunnel_url: null,
  vram_used_gb: 0.0,
  vram_free_gb: 32.0,
  loaded_models: [],
  sessions: [],
  users: []
};

const JWT_SECRET = process.env.JWT_SECRET || 'absora-vercel-jwt-secret-2026';
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const GITHUB_OWNER = process.env.GITHUB_OWNER || 'AADI-playz23';
const GITHUB_REPO = process.env.GITHUB_REPO || 'Absora-AI-Hub';

function hashPassword(pass) {
  return crypto.createHash('sha256').update(pass).digest('hex');
}

function generateApiKey() {
  return 'absora_sk_' + crypto.randomBytes(16).toString('hex');
}

function generateToken(user) {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const payload = Buffer.from(JSON.stringify({ userId: user.id, username: user.username, email: user.email, api_key: user.api_key, exp: Date.now() + 86400000 })).toString('base64url');
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

// Auth Middleware (Accepts both JWT tokens & absora_sk_... API Keys)
function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization || req.headers['x-api-key'];
  if (!authHeader) {
    return res.status(401).json({ error: 'Unauthorized. Bearer token or x-api-key header required.' });
  }

  let token = authHeader;
  if (authHeader.startsWith('Bearer ')) {
    token = authHeader.split(' ')[1];
  }

  // Check API Key match
  if (token.startsWith('absora_sk_') || token.startsWith('sk-absora-')) {
    const user = globalState.users.find(u => u.api_key === token);
    if (user) {
      req.user = { userId: user.id, username: user.username, email: user.email, api_key: user.api_key };
      return next();
    }
    req.user = { userId: 'usr_guest', api_key: token };
    return next();
  }

  const payload = verifyToken(token);
  if (!payload) return res.status(401).json({ error: 'Invalid or expired token' });
  req.user = payload;
  next();
}

// ── AUTH ROUTES ──

app.post('/api/auth/register', (req, res) => {
  try {
    const { username, email, password } = req.body || {};
    if (!username || !email || !password) {
      return res.status(400).json({ error: 'All fields required' });
    }

    if (globalState.users.some(u => u.username === username || u.email === email)) {
      return res.status(409).json({ error: 'Username or email already taken' });
    }

    const apiKey = generateApiKey();
    const user = { id: 'usr_' + crypto.randomBytes(4).toString('hex'), username, email, api_key: apiKey, passHash: hashPassword(password) };
    globalState.users.push(user);
    const token = generateToken(user);
    return res.json({ success: true, user: { id: user.id, username: user.username, email: user.email, api_key: user.api_key }, token });
  } catch (err) {
    console.error('Register error:', err);
    return res.status(500).json({ error: 'Registration server error: ' + err.message });
  }
});

app.post('/api/auth/login', (req, res) => {
  try {
    const { username, password } = req.body || {};
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password required' });
    }
    const passHash = hashPassword(password);
    const user = globalState.users.find(u => u.username === username && u.passHash === passHash);

    if (!user) return res.status(401).json({ error: 'Invalid credentials' });
    
    if (!user.api_key) user.api_key = generateApiKey();
    const token = generateToken(user);
    return res.json({ success: true, user: { id: user.id, username: user.username, email: user.email, api_key: user.api_key }, token });
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({ error: 'Login server error: ' + err.message });
  }
});

app.post('/api/auth/api-key/regenerate', authMiddleware, (req, res) => {
  const user = globalState.users.find(u => u.id === req.user.userId);
  const newKey = generateApiKey();
  if (user) {
    user.api_key = newKey;
  }
  res.json({ success: true, api_key: newKey });
});

app.get('/api/auth/me', authMiddleware, (req, res) => {
  const user = globalState.users.find(u => u.id === req.user.userId);
  res.json({ user: user ? { id: user.id, username: user.username, email: user.email, api_key: user.api_key } : req.user });
});

// ── CATALOG & STATUS ──

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
    vram: { total: 32.0, used: globalState.vram_used_gb, free: globalState.vram_free_gb },
    models
  });
});

app.get('/api/models/status', (req, res) => {
  res.json({
    colab_status: globalState.colab_status,
    vram_used_gb: globalState.vram_used_gb,
    vram_free_gb: globalState.vram_free_gb,
    loaded_models: globalState.loaded_models,
    tunnel_url: globalState.tunnel_url
  });
});

// SSE Event Stream for Live VRAM updates
app.get('/api/sse/status', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  const sendData = () => {
    const data = JSON.stringify({
      timestamp: Date.now(),
      colab_status: globalState.colab_status,
      vram: { used: globalState.vram_used_gb, free: globalState.vram_free_gb, total: 32.0 },
      loaded_models: globalState.loaded_models
    });
    res.write(`data: ${data}\n\n`);
  };

  sendData();
  const intervalId = setInterval(sendData, 5000);
  req.on('close', () => clearInterval(intervalId));
});

// ── SESSION MANAGEMENT & LAUNCH DISPATCH ──

app.post('/api/sessions/request', authMiddleware, async (req, res) => {
  const { model_id } = req.body || {};
  const targetModel = catalogModels.find(m => m.id === model_id) || catalogModels[0];

  const sessionId = 'ses_' + crypto.randomBytes(4).toString('hex');
  const userApiKey = req.user.api_key || generateApiKey();
  const host = req.headers.host || 'absora-ai-hub.vercel.app';
  const proxyEndpoint = `https://${host}/api/absora/v1/chat/completions`;

  if (globalState.colab_status === 'ACTIVE' && globalState.tunnel_url) {
    const session = {
      id: sessionId,
      user_id: req.user.userId,
      model_id: targetModel.id,
      status: 'ACTIVE',
      api_key: userApiKey,
      proxy_endpoint: proxyEndpoint,
      expires_at: Math.floor(Date.now() / 1000) + 7200
    };
    globalState.sessions.push(session);
    return res.json({
      success: true,
      session_id: sessionId,
      status: 'ACTIVE',
      model_id: targetModel.id,
      api_key: userApiKey,
      proxy_endpoint: proxyEndpoint,
      tunnel_url: globalState.tunnel_url,
      message: 'Joined active Kaggle T4x2 cluster! Endpoint is ready.'
    });
  }

  globalState.colab_status = 'STARTING';

  try {
    const ghUrl = `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/actions/workflows/launch_session.yml/dispatches`;
    await fetch(ghUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${GITHUB_TOKEN}`,
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'Absora-Vercel',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        ref: 'main',
        inputs: {
          session_id: sessionId,
          model_id: targetModel.id,
          hf_id: targetModel.hf_id,
          vram_gb: String(targetModel.vram_gb),
          webhook_url: `https://${host}/api/webhook`
        }
      })
    });
  } catch (err) {
    console.error('[Vercel Dispatch Exception]', err);
  }

  const session = {
    id: sessionId,
    user_id: req.user.userId,
    model_id: targetModel.id,
    status: 'STARTING',
    api_key: userApiKey,
    proxy_endpoint: proxyEndpoint
  };
  globalState.sessions.push(session);

  res.json({
    success: true,
    session_id: sessionId,
    status: 'STARTING',
    model_id: targetModel.id,
    api_key: userApiKey,
    proxy_endpoint: proxyEndpoint,
    message: 'GitHub Actions triggered Kaggle T4x2 cluster launch. Cluster will be active in 1-2 minutes.'
  });
});

app.get('/api/sessions/mine', authMiddleware, (req, res) => {
  const now = Math.floor(Date.now() / 1000);
  const host = req.headers.host || 'absora-ai-hub.vercel.app';
  const proxyEndpoint = `https://${host}/api/absora/v1/chat/completions`;

  const userSessions = globalState.sessions
    .filter(s => s.user_id === req.user.userId)
    .map(s => ({
      ...s,
      proxy_endpoint: proxyEndpoint,
      seconds_remaining: s.expires_at ? Math.max(0, s.expires_at - now) : null
    }));

  res.json({ sessions: userSessions, colab_status: globalState.colab_status, tunnel_url: globalState.tunnel_url });
});

// ── UNIFIED API GATEWAY: /api/absora/v1/chat/completions & /api/absora/v1/models ──

app.get('/api/absora/v1/models', authMiddleware, (req, res) => {
  res.json({
    object: 'list',
    data: catalogModels.map(m => ({
      id: m.id,
      object: 'model',
      created: 1700000000,
      owned_by: 'absora-ai-hub'
    }))
  });
});

app.post('/api/absora/v1/chat/completions', authMiddleware, async (req, res) => {
  if (globalState.colab_status !== 'ACTIVE' || !globalState.tunnel_url) {
    return res.status(503).json({
      error: {
        message: "Models are currently IDLE. Please click 'Launch Session' to use them",
        type: 'service_unavailable',
        code: 503
      }
    });
  }

  const backendUrl = `${globalState.tunnel_url}/v1/chat/completions`;

  try {
    const fetchRes = await fetch(backendUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ABSORA_SECRET_KEY || 'absora-secret-key-2026'
      },
      body: JSON.stringify(req.body)
    });

    res.status(fetchRes.status);
    for (const [key, value] of fetchRes.headers.entries()) {
      if (key.toLowerCase() !== 'content-encoding' && key.toLowerCase() !== 'content-length') {
        res.setHeader(key, value);
      }
    }

    const data = await fetchRes.arrayBuffer();
    res.send(Buffer.from(data));
  } catch (err) {
    console.error('Unified Gateway Proxy Error:', err);
    res.status(502).json({ error: { message: 'Failed to proxy request to active Kaggle GPU worker.', code: 502 } });
  }
});

// Endpoint to unload specific model on worker
app.post('/api/models/unload', authMiddleware, async (req, res) => {
  const { model_id } = req.body || {};
  if (!globalState.tunnel_url || globalState.colab_status !== 'ACTIVE') {
    return res.status(503).json({ error: 'No active AI worker currently running' });
  }

  try {
    const unloadRes = await fetch(`${globalState.tunnel_url}/unload`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ABSORA_SECRET_KEY || 'absora-secret-key-2026'
      },
      body: JSON.stringify({ model_id })
    });
    const data = await unloadRes.json();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: 'Unload request failed: ' + err.message });
  }
});

// ── WEBHOOKS FROM KAGGLE COMPUTING WORKER ──

app.post('/api/webhook/tunnel', (req, res) => {
  const { session_id, tunnel_url, initial_model_id } = req.body || {};
  if (!tunnel_url) return res.status(400).json({ error: 'tunnel_url required' });

  globalState.colab_status = 'ACTIVE';
  globalState.tunnel_url = tunnel_url;
  globalState.vram_used_gb = 18.5;
  globalState.vram_free_gb = 13.5;

  if (initial_model_id) {
    globalState.loaded_models = [{ model_id: initial_model_id, hf_id: 'auto', vram_gb: 3.0, port: 8001, gpu: 0 }];
  }

  const now = Math.floor(Date.now() / 1000);
  globalState.sessions.forEach(s => {
    if (s.status === 'STARTING') {
      s.status = 'ACTIVE';
      s.expires_at = now + 7200;
    }
  });

  res.json({ success: true, message: 'Kaggle Tunnel registered successfully!' });
});

app.post('/api/webhook/status', (req, res) => {
  const data = req.body || {};
  globalState.colab_status = data.status || 'ACTIVE';
  if (data.allocated_vram_gb !== undefined) globalState.vram_used_gb = data.allocated_vram_gb;
  if (data.free_vram_gb !== undefined) globalState.vram_free_gb = data.free_vram_gb;
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
  globalState.vram_free_gb = 32.0;
  globalState.loaded_models = [];
  res.json({ success: true, message: 'Kaggle cluster marked IDLE.' });
});

// Global Express Error Handler
app.use((err, req, res, next) => {
  console.error('[Global API Error]', err);
  res.status(500).json({ error: 'Internal Server Error: ' + err.message });
});

export default app;
