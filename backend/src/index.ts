import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import type { D1Database } from '@cloudflare/workers-types';
import { initializeDb, createTables } from './db';
import { createTaskRoutes } from './routes/tasks';
import { createScheduleRoutes } from './routes/schedule';
import { createAnalyticsRoutes } from './routes/analytics';
import { createSettingsRoutes } from './routes/settings';

interface Env {
  DB: D1Database;
}

const app = new Hono<{ Bindings: Env }>();

// Middleware
app.use('*', logger());
app.use('*', cors());

// Health check
app.get('/health', (c) => {
  return c.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Initialize database and routes
app.all('*', async (c, next) => {
  const db = initializeDb(c.env.DB);
  c.set('db', db);

  // Initialize tables on first request (idempotent)
  try {
    await createTables(c.env.DB);
  } catch (e) {
    // Tables may already exist
    console.log('Tables initialization:', e);
  }

  await next();
});

// API Routes
const apiRouter = new Hono();

// Task management
apiRouter.route('/tasks', (c) => {
  const db = c.get('db');
  return createTaskRoutes(db);
});

// Schedule optimization
apiRouter.route('/schedule', (c) => {
  const db = c.get('db');
  return createScheduleRoutes(db);
});

// Analytics and learning
apiRouter.route('/analytics', (c) => {
  const db = c.get('db');
  return createAnalyticsRoutes(db);
});

// User settings
apiRouter.route('/settings', (c) => {
  const db = c.get('db');
  return createSettingsRoutes(db);
});

// Mount API router
app.route('/api', apiRouter);

// 404 handler
app.notFound((c) => {
  return c.json(
    {
      success: false,
      error: 'Not found',
      timestamp: new Date().toISOString(),
    },
    404,
  );
});

// Error handler
app.onError((err, c) => {
  console.error('Error:', err);
  return c.json(
    {
      success: false,
      error: err.message || 'Internal server error',
      timestamp: new Date().toISOString(),
    },
    500,
  );
});

export default app;
