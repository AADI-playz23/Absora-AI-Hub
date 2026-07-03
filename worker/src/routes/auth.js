import { signJWT, hashPassword, verifyJWT } from '../jwt.js';

export function handleAuthRoutes(app) {
  // POST /auth/register
  app.post('/auth/register', async (c) => {
    const { username, email, password } = await c.req.json();
    if (!username || !email || !password) {
      return c.json({ error: 'Username, email, and password are required' }, 400);
    }

    const db = c.env.DB;
    const passHash = await hashPassword(password);
    const userId = 'usr_' + crypto.randomUUID().slice(0, 8);
    const now = Math.floor(Date.now() / 1000);

    try {
      await db.prepare(`
        INSERT INTO users (id, username, email, password_hash, created_at)
        VALUES (?, ?, ?, ?, ?)
      `).bind(userId, username, email, passHash, now).run();

      const token = await signJWT({ userId, username, email }, c.env.JWT_SECRET || 'absora-secret');
      return c.json({ success: true, user: { id: userId, username, email }, token });
    } catch (err) {
      if (err.message.includes('UNIQUE')) {
        return c.json({ error: 'Username or email already exists' }, 409);
      }
      return c.json({ error: 'Registration failed: ' + err.message }, 500);
    }
  });

  // POST /auth/login
  app.post('/auth/login', async (c) => {
    const { username, password } = await c.req.json();
    if (!username || !password) {
      return c.json({ error: 'Username and password are required' }, 400);
    }

    const db = c.env.DB;
    const passHash = await hashPassword(password);

    const user = await db.prepare(`
      SELECT * FROM users WHERE username = ? AND password_hash = ?
    `).bind(username, passHash).first();

    if (!user) {
      return c.json({ error: 'Invalid username or password' }, 401);
    }

    const token = await signJWT({ userId: user.id, username: user.username, email: user.email }, c.env.JWT_SECRET || 'absora-secret');
    return c.json({ success: true, user: { id: user.id, username: user.username, email: user.email }, token });
  });

  // GET /auth/me
  app.get('/auth/me', async (c) => {
    const authHeader = c.req.header('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return c.json({ error: 'Unauthorized' }, 401);
    }
    const token = authHeader.split(' ')[1];
    const payload = await verifyJWT(token, c.env.JWT_SECRET || 'absora-secret');
    if (!payload) {
      return c.json({ error: 'Invalid or expired token' }, 401);
    }
    return c.json({ user: payload });
  });
}
