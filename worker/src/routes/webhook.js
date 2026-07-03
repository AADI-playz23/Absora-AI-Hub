import { updateColabState, addLoadedModel, removeLoadedModel } from '../db.js';

export function handleWebhookRoutes(app) {
  // POST /webhook/tunnel — Colab registers its Cloudflare Quick Tunnel URL
  app.post('/webhook/tunnel', async (c) => {
    const { session_id, tunnel_url, initial_model_id } = await c.req.json();
    if (!tunnel_url) {
      return c.json({ error: 'tunnel_url is required' }, 400);
    }

    const db = c.env.DB;
    await updateColabState(db, {
      status: 'ACTIVE',
      tunnel_url,
      vram_used_gb: 3.0,
      vram_free_gb: 13.0
    });

    // Update session status to ACTIVE and set 2-hour expiration
    const now = Math.floor(Date.now() / 1000);
    const expiresAt = now + 7200; // 2 hours

    await db.prepare(`
      UPDATE sessions
      SET status = 'ACTIVE', activated_at = ?, expires_at = ?
      WHERE status IN ('STARTING', 'LOADING')
    `).bind(now, expiresAt).run();

    if (initial_model_id) {
      await addLoadedModel(db, {
        model_id: initial_model_id,
        hf_id: 'auto',
        vram_allocated_gb: 3.0,
        port: 8001
      });
    }

    console.log(`[Webhook] Tunnel registered successfully: ${tunnel_url}`);
    return c.json({ success: true, message: 'Tunnel registered successfully' });
  });

  // POST /webhook/status — Periodic heartbeat from Colab worker
  app.post('/webhook/status', async (c) => {
    const data = await c.req.json();
    const db = c.env.DB;

    const allocated = data.allocated_vram_gb || 0;
    const free = data.free_vram_gb || 16.0;

    await updateColabState(db, {
      status: 'ACTIVE',
      vram_used_gb: allocated,
      vram_free_gb: free,
      tunnel_url: data.tunnel_url
    });

    if (Array.isArray(data.loaded_models)) {
      // Clear and refresh loaded_models table
      await db.prepare('DELETE FROM loaded_models').run();
      for (const m of data.loaded_models) {
        await addLoadedModel(db, {
          model_id: m.model_id,
          hf_id: m.hf_id || 'unknown',
          vram_allocated_gb: m.vram_gb || 3.0,
          port: m.port || 8001
        });
      }
    }

    return c.json({ success: true });
  });

  // POST /webhook/stopped — Colab worker shutting down
  app.post('/webhook/stopped', async (c) => {
    const db = c.env.DB;
    await updateColabState(db, {
      status: 'IDLE',
      tunnel_url: null,
      vram_used_gb: 0,
      vram_free_gb: 16
    });
    await db.prepare('DELETE FROM loaded_models').run();
    await db.prepare("UPDATE sessions SET status = 'EXPIRED' WHERE status = 'ACTIVE'").run();

    return c.json({ success: true, message: 'Colab worker marked IDLE' });
  });
}
