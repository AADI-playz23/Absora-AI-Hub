import { getColabState, getLoadedModels } from '../db.js';

export function handleSseRoutes(app) {
  // GET /sse/status — Server-Sent Events stream for live model & VRAM updates
  app.get('/sse/status', async (c) => {
    const db = c.env.DB;

    const stream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder();

        const sendEvent = async () => {
          try {
            const state = await getColabState(db);
            const loaded = await getLoadedModels(db);
            const data = JSON.stringify({
              timestamp: Date.now(),
              colab_status: state.status,
              vram: {
                used: state.vram_used_gb || 0,
                free: state.vram_free_gb || 16,
                total: 16
              },
              loaded_models: loaded
            });
            controller.enqueue(encoder.encode(`data: ${data}\n\n`));
          } catch (e) {
            console.error('SSE send error:', e);
          }
        };

        // Initial event
        await sendEvent();

        // Repeat every 5 seconds
        const intervalId = setInterval(async () => {
          await sendEvent();
        }, 5000);

        c.req.raw.signal.addEventListener('abort', () => {
          clearInterval(intervalId);
          try { controller.close(); } catch {}
        });
      }
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*'
      }
    });
  });
}
