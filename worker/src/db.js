// Cloudflare D1 database helpers

export async function getColabState(db) {
  const stmt = db.prepare('SELECT * FROM colab_state WHERE id = 1');
  const res = await stmt.first();
  return res || { status: 'IDLE', tunnel_url: null, vram_used_gb: 0, vram_free_gb: 16 };
}

export async function updateColabState(db, state) {
  const { status, tunnel_url, vram_used_gb, vram_free_gb } = state;
  const now = Math.floor(Date.now() / 1000);
  await db.prepare(`
    UPDATE colab_state 
    SET status = COALESCE(?, status),
        tunnel_url = COALESCE(?, tunnel_url),
        vram_used_gb = COALESCE(?, vram_used_gb),
        vram_free_gb = COALESCE(?, vram_free_gb),
        last_heartbeat = ?
    WHERE id = 1
  `).bind(status, tunnel_url, vram_used_gb, vram_free_gb, now).run();
}

export async function getLoadedModels(db) {
  const res = await db.prepare('SELECT * FROM loaded_models').all();
  return res.results || [];
}

export async function addLoadedModel(db, { model_id, hf_id, vram_allocated_gb, port }) {
  const now = Math.floor(Date.now() / 1000);
  await db.prepare(`
    INSERT OR REPLACE INTO loaded_models (model_id, hf_id, vram_allocated_gb, port, loaded_at, last_request)
    VALUES (?, ?, ?, ?, ?, ?)
  `).bind(model_id, hf_id, vram_allocated_gb, port, now, now).run();
}

export async function removeLoadedModel(db, model_id) {
  await db.prepare('DELETE FROM loaded_models WHERE model_id = ?').bind(model_id).run();
}

export async function getActiveSessions(db, userId = null) {
  const now = Math.floor(Date.now() / 1000);
  let query = 'SELECT * FROM sessions WHERE expires_at > ? AND status = "ACTIVE"';
  let params = [now];
  if (userId) {
    query += ' AND user_id = ?';
    params.push(userId);
  }
  const res = await db.prepare(query).bind(...params).all();
  return res.results || [];
}

export async function createSession(db, { id, user_id, model_id, status, queue_position = 0 }) {
  const now = Math.floor(Date.now() / 1000);
  const expiresAt = status === 'ACTIVE' ? now + 7200 : null; // 2 hours = 7200s
  await db.prepare(`
    INSERT INTO sessions (id, user_id, model_id, status, queue_position, created_at, activated_at, expires_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(id, user_id, model_id, status, queue_position, now, status === 'ACTIVE' ? now : null, expiresAt).run();
}
