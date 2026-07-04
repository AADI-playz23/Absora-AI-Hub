const API_BASE = import.meta.env.VITE_API_URL || '/api';

export async function fetchCatalog() {
  const res = await fetch(`${API_BASE}/models`);
  if (!res.ok) throw new Error('Failed to fetch model catalog');
  return res.json();
}

export async function fetchLiveVram() {
  const res = await fetch(`${API_BASE}/models/status`);
  if (!res.ok) throw new Error('Failed to fetch VRAM status');
  return res.json();
}

export async function loginUser(username, password) {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password })
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Login failed');
  return data;
}

export async function registerUser(username, email, password) {
  const res = await fetch(`${API_BASE}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, email, password })
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Registration failed');
  return data;
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
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Session request failed');
  return data;
}

export async function fetchMySessions(token) {
  const res = await fetch(`${API_BASE}/sessions/mine`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  if (!res.ok) throw new Error('Failed to fetch active sessions');
  return res.json();
}

export async function regenerateApiKey(token) {
  const res = await fetch(`${API_BASE}/auth/api-key/regenerate`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to regenerate API key');
  return data;
}
