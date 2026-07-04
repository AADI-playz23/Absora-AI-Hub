import catalogModels from '../../catalog/models.json' with { type: 'json' };
import { getColabState, getLoadedModels } from '../db.js';

export function handleModelRoutes(app) {
  // GET /models — Catalog of 10 SLMs merged with live state
  app.get('/models', async (c) => {
    const db = c.env.DB;
    const state = await getColabState(db);
    const loaded = await getLoadedModels(db);
    const loadedIds = new Set(loaded.map(m => m.model_id));

    const enrichedCatalog = catalogModels.map(m => {
      let status = 'IDLE';
      if (loadedIds.has(m.id)) {
        status = 'ACTIVE';
      } else if (state.status === 'STARTING') {
        status = 'LOADING';
      } else if (state.vram_free_gb < m.vram_gb && state.status === 'ACTIVE') {
        status = 'QUEUED';
      }
      return { ...m, status };
    });

    return c.json({
      colab_status: state.status,
      vram: {
        total: 16.0,
        used: state.vram_used_gb || 0.0,
        free: state.vram_free_gb || 16.0
      },
      models: enrichedCatalog
    });
  });

  // GET /models/status — Live VRAM usage detail
  app.get('/models/status', async (c) => {
    const db = c.env.DB;
    const state = await getColabState(db);
    const loaded = await getLoadedModels(db);
    return c.json({
      colab_status: state.status,
      tunnel_url: state.tunnel_url,
      vram_used_gb: state.vram_used_gb,
      vram_free_gb: state.vram_free_gb,
      loaded_models: loaded
    });
  });
}
