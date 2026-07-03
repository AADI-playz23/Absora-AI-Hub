import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { handleAuthRoutes } from './routes/auth.js';
import { handleModelRoutes } from './routes/models.js';
import { handleSessionRoutes } from './routes/sessions.js';
import { handleWebhookRoutes } from './routes/webhook.js';
import { handleSseRoutes } from './routes/sse.js';

const app = new Hono();

// Global CORS middleware
app.use('*', cors({
  origin: '*',
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization']
}));

// Health check
app.get('/', (c) => c.json({ service: 'Absora AI Hub API Gateway', status: 'operational', timestamp: Date.now() }));

// Register route modules
handleAuthRoutes(app);
handleModelRoutes(app);
handleSessionRoutes(app);
handleWebhookRoutes(app);
handleSseRoutes(app);

export default app;
