import { getColabState } from '../db.js';

export function handleGatewayRoutes(app) {
  // GET /absora/v1/models — OpenAI-compatible models list
  app.get('/absora/v1/models', async (c) => {
    return c.json({
      object: 'list',
      data: [
        { id: 'qwen2.5-7b', object: 'model', created: 1700000000, owned_by: 'absora-ai-hub' },
        { id: 'deepseek-r1-7b', object: 'model', created: 1700000000, owned_by: 'absora-ai-hub' },
        { id: 'phi3.5-mini', object: 'model', created: 1700000000, owned_by: 'absora-ai-hub' }
      ]
    });
  });

  // POST /absora/v1/chat/completions — Reverse Proxy to Kaggle T4x2 Tunnel
  app.post('/absora/v1/chat/completions', async (c) => {
    const authHeader = c.req.header('Authorization') || c.req.header('x-api-key');
    if (!authHeader) {
      return c.json({ error: 'Unauthorized. Bearer token or x-api-key header required.' }, 401);
    }

    const db = c.env.DB;
    const colabState = await getColabState(db);

    if (colabState.status !== 'ACTIVE' || !colabState.tunnel_url) {
      return c.json({
        error: {
          message: "Models are currently IDLE. Please click 'Launch Session' to use them",
          type: 'service_unavailable',
          code: 503
        }
      }, 503);
    }

    const targetUrl = `${colabState.tunnel_url}/v1/chat/completions`;
    const body = await c.req.json();

    try {
      const resp = await fetch(targetUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': c.env.ABSORA_SECRET_KEY || 'absora-secret-key-2026'
        },
        body: JSON.stringify(body)
      });

      return new Response(resp.body, {
        status: resp.status,
        headers: resp.headers
      });
    } catch (err) {
      return c.json({ error: { message: 'Kaggle GPU proxy error: ' + err.message, code: 502 } }, 502);
    }
  });
}
