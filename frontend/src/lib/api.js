const API_BASE = import.meta.env.VITE_API_URL || '/api';

async function safeParseResponse(res, fallbackErrorMsg) {
  const text = await res.text();
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error(`Server Error (${res.status}): ${text.slice(0, 100) || fallbackErrorMsg}`);
  }
  if (!res.ok) {
    throw new Error(data.error || fallbackErrorMsg);
  }
  return data;
}

export async function fetchCatalog() {
  const res = await fetch(`${API_BASE}/models`);
  return safeParseResponse(res, 'Failed to fetch model catalog');
}

export async function fetchLiveVram() {
  const res = await fetch(`${API_BASE}/models/status`);
  return safeParseResponse(res, 'Failed to fetch VRAM status');
}

export async function loginUser(username, password) {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password })
  });
  return safeParseResponse(res, 'Login failed');
}

export async function registerUser(username, email, password) {
  const res = await fetch(`${API_BASE}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, email, password })
  });
  return safeParseResponse(res, 'Registration failed');
}

export async function requestSession(modelId, token) {
  const res = await fetch(`${API_BASE}/sessions/request`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ model_id: modelId })
  });
  return safeParseResponse(res, 'Session request failed');
}

export async function fetchMySessions(token) {
  const res = await fetch(`${API_BASE}/sessions/mine`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  return safeParseResponse(res, 'Failed to fetch active sessions');
}

export async function regenerateApiKey(token) {
  const res = await fetch(`${API_BASE}/auth/api-key/regenerate`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  return safeParseResponse(res, 'Failed to regenerate API key');
}
