import { Hono } from 'hono';
import type { Database } from '../db';
import { v4 as uuidv4 } from 'uuid';
import { generateInsights } from '../lib/behavior-learning';
import { eq } from 'drizzle-orm';
import { completionLogs, tasks as tasksTable } from '../db/schema';
import type { ProductivityStats } from '@gsi-planner/shared';

export function createAnalyticsRoutes(db: Database) {
  const router = new Hono<{ Bindings: { DB: D1Database } }>();

  /**
   * GET /api/analytics/stats - Get productivity statistics
   */
  router.get('/stats', async (c) => {
    try {
      const userId = c.req.header('X-User-ID');
      if (!userId) return c.json({ success: false, error: 'Unauthorized' }, 401);

      // Fetch all tasks for this user
      const userTasks = await db.query.tasks.findMany({
        where: eq(tasksTable.userId, userId),
      });

      // Fetch completion logs
      const logs = await db.query.completionLogs.findMany({
        where: eq(completionLogs.userId, userId),
      });

      const totalTasks = userTasks.length;
      const completedTasks = userTasks.filter((t) => t.status === 'completed').length;
      const completionRate = totalTasks > 0 ? completedTasks / totalTasks : 0;

      let avgDuration = 0;
      if (logs.length > 0) {
        avgDuration = logs.reduce((sum, log) => sum + log.actualDuration, 0) / logs.length;
      }

      // Calculate estimate accuracy
      let avgEstimateAccuracy = 0.85; // default
      if (logs.length > 0) {
        const accuracies = logs.map((log) => {
          if (log.estimatedDuration === 0) return 1;
          const ratio = log.actualDuration / log.estimatedDuration;
          return 1 - Math.abs(ratio - 1);
        });
        avgEstimateAccuracy = accuracies.reduce((a, b) => a + b, 0) / accuracies.length;
      }

      // Get peak hours
      const insights = generateInsights(logs, userTasks);

      const stats: ProductivityStats = {
        totalTasks,
        completedTasks,
        completionRate,
        avgDuration,
        avgEstimateAccuracy,
        peakHours: insights.peakProductivityHours,
      };

      return c.json(
        {
          success: true,
          data: stats,
          timestamp: new Date().toISOString(),
        },
        200,
      );
    } catch (error) {
      console.error('Error fetching stats:', error);
      return c.json(
        {
          success: false,
          error: 'Failed to fetch statistics',
          timestamp: new Date().toISOString(),
        },
        500,
      );
    }
  });

  /**
   * GET /api/analytics/insights - Get learning insights
   */
  router.get('/insights', async (c) => {
    try {
      const userId = c.req.header('X-User-ID');
      if (!userId) return c.json({ success: false, error: 'Unauthorized' }, 401);

      const userTasks = await db.query.tasks.findMany({
        where: eq(tasksTable.userId, userId),
      });

      const logs = await db.query.completionLogs.findMany({
        where: eq(completionLogs.userId, userId),
      });

      const insights = generateInsights(logs, userTasks);

      return c.json(
        {
          success: true,
          data: {
            peakProductivityHours: insights.peakProductivityHours,
            focusStyles: insights.focusStyles,
            averageDailyTaskCompletion: insights.averageDailyTaskCompletion,
            estimateAccuracy: insights.estimateAccuracy,
            difficultyCorrectionFactors: insights.difficultyCorrectionFactors,
            categoryPatterns: insights.categoryPatterns,
          },
          timestamp: new Date().toISOString(),
        },
        200,
      );
    } catch (error) {
      console.error('Error fetching insights:', error);
      return c.json(
        {
          success: false,
          error: 'Failed to fetch insights',
          timestamp: new Date().toISOString(),
        },
        500,
      );
    }
  });

  /**
   * POST /api/analytics/log-completion - Log task completion
   */
  router.post('/log-completion', async (c) => {
    try {
      const userId = c.req.header('X-User-ID');
      if (!userId) return c.json({ success: false, error: 'Unauthorized' }, 401);

      const { taskId, actualDuration, estimatedDuration, difficulty } = await c.req.json();

      const logId = uuidv4();

      await db.insert(completionLogs).values({
        id: logId,
        userId,
        taskId,
        completedAt: new Date().toISOString(),
        actualDuration: actualDuration || estimatedDuration,
        estimatedDuration,
        difficulty,
      });

      // Update task status
      await db
        .update(tasksTable)
        .set({
          status: 'completed',
          completedAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        })
        .where(eq(tasksTable.id, taskId));

      return c.json(
        {
          success: true,
          data: { logId },
          timestamp: new Date().toISOString(),
        },
        201,
      );
    } catch (error) {
      console.error('Error logging completion:', error);
      return c.json(
        {
          success: false,
          error: 'Failed to log completion',
          timestamp: new Date().toISOString(),
        },
        400,
      );
    }
  });

  /**
   * GET /api/analytics/completion-logs - Get recent completion logs
   */
  router.get('/completion-logs', async (c) => {
    try {
      const userId = c.req.header('X-User-ID');
      const limit = c.req.query('limit') ? parseInt(c.req.query('limit')!) : 50;

      if (!userId) return c.json({ success: false, error: 'Unauthorized' }, 401);

      const logs = await db.query.completionLogs.findMany({
        where: eq(completionLogs.userId, userId),
        limit,
      });

      return c.json(
        {
          success: true,
          data: logs,
          timestamp: new Date().toISOString(),
        },
        200,
      );
    } catch (error) {
      console.error('Error fetching logs:', error);
      return c.json(
        {
          success: false,
          error: 'Failed to fetch logs',
          timestamp: new Date().toISOString(),
        },
        500,
      );
    }
  });

  return router;
}

export type AnalyticsRouter = ReturnType<typeof createAnalyticsRoutes>;
