import { Hono } from 'hono';
import type { Database } from '../db';
import { v4 as uuidv4 } from 'uuid';
import { calculateTaskPriorities } from '../lib/ahp-priority';
import { solveScheduleCSP, calculateScheduleQuality } from '../lib/csp-solver';
import { optimizeScheduleWithPSO, generateScheduleFromOrder } from '../lib/pso-optimizer';
import { generateInsights } from '../lib/behavior-learning';
import { eq, and, gte, lte } from 'drizzle-orm';
import { tasks as tasksTable, storedSchedules, completionLogs } from '../db/schema';
import type { DailySchedule, ScheduleConstraints } from '@gsi-planner/shared';

export function createScheduleRoutes(db: Database) {
  const router = new Hono<{ Bindings: { DB: D1Database } }>();

  /**
   * POST /api/schedule/generate - Generate optimized schedule for a date
   */
  router.post('/generate', async (c) => {
    try {
      const userId = c.req.header('X-User-ID');
      if (!userId) return c.json({ success: false, error: 'Unauthorized' }, 401);

      const { date = new Date().toISOString().split('T')[0] } = await c.req.json();

      // Fetch user tasks for the date
      const userTasks = await db.query.tasks.findMany({
        where: and(
          eq(tasksTable.userId, userId),
          eq(tasksTable.status, 'pending'),
          lte(tasksTable.dueDate, new Date(date).toISOString()),
        ),
      });

      if (userTasks.length === 0) {
        return c.json(
          {
            success: true,
            data: { date, blocks: [], optimizationScore: 0 },
            timestamp: new Date().toISOString(),
          },
          200,
        );
      }

      // Fetch completion logs for better priority calculation
      const logs = await db.query.completionLogs.findMany({
        where: eq(completionLogs.userId, userId),
      });

      // Calculate priorities using AHP
      const prioritizedTasks = calculateTaskPriorities(userTasks, logs);

      // Fetch user settings for constraints
      const userSettings = await db.query.userSettings.findFirst({
        where: eq(userSettings.userId, userId),
      });

      const constraints: ScheduleConstraints = {
        workHoursStart: userSettings?.workStartHour || 9,
        workHoursEnd: userSettings?.workEndHour || 17,
        noOverlaps: true,
        respectDeadlines: true,
        minBreakTime: 15,
      };

      // Use PSO for optimization
      const insights = generateInsights(logs, userTasks);
      const optimizationParams = {
        swarmSize: Math.min(20, userTasks.length * 2),
        iterations: 50,
        inertiaWeight: 0.7,
        cognitiveCoefficient: 1.5,
        socialCoefficient: 1.5,
        peakHours: insights.peakProductivityHours,
      };

      const optimalOrder = optimizeScheduleWithPSO(prioritizedTasks, optimizationParams);
      const schedule = generateScheduleFromOrder(
        optimalOrder,
        prioritizedTasks,
        constraints.workHoursStart,
      );

      // Calculate quality score
      const totalDuration = prioritizedTasks.reduce((sum, t) => sum + t.estimatedDuration, 0);
      const workDayLength = (constraints.workHoursEnd - constraints.workHoursStart) * 60;
      const qualityScore = calculateScheduleQuality(schedule, totalDuration, workDayLength);

      // Store schedule
      const scheduleId = uuidv4();
      await db.insert(storedSchedules).values({
        id: scheduleId,
        userId,
        date,
        scheduleData: JSON.stringify(schedule),
        optimizationScore: qualityScore,
        createdAt: new Date().toISOString(),
      });

      const result: DailySchedule = {
        date,
        blocks: schedule,
        optimizationScore: qualityScore,
      };

      return c.json(
        {
          success: true,
          data: result,
          timestamp: new Date().toISOString(),
        },
        200,
      );
    } catch (error) {
      console.error('Error generating schedule:', error);
      return c.json(
        {
          success: false,
          error: 'Failed to generate schedule',
          timestamp: new Date().toISOString(),
        },
        500,
      );
    }
  });

  /**
   * GET /api/schedule/:date - Get stored schedule for a date
   */
  router.get('/:date', async (c) => {
    try {
      const userId = c.req.header('X-User-ID');
      const date = c.req.param('date');

      if (!userId) return c.json({ success: false, error: 'Unauthorized' }, 401);

      const schedule = await db.query.storedSchedules.findFirst({
        where: and(
          eq(storedSchedules.userId, userId),
          eq(storedSchedules.date, date),
        ),
      });

      if (!schedule) {
        return c.json(
          {
            success: false,
            error: 'Schedule not found',
            timestamp: new Date().toISOString(),
          },
          404,
        );
      }

      return c.json(
        {
          success: true,
          data: {
            date,
            blocks: JSON.parse(schedule.scheduleData),
            optimizationScore: schedule.optimizationScore,
          },
          timestamp: new Date().toISOString(),
        },
        200,
      );
    } catch (error) {
      console.error('Error fetching schedule:', error);
      return c.json(
        {
          success: false,
          error: 'Failed to fetch schedule',
          timestamp: new Date().toISOString(),
        },
        500,
      );
    }
  });

  /**
   * GET /api/schedule/week/:startDate - Get week's schedules
   */
  router.get('/week/:startDate', async (c) => {
    try {
      const userId = c.req.header('X-User-ID');
      const startDate = c.req.param('startDate');

      if (!userId) return c.json({ success: false, error: 'Unauthorized' }, 401);

      const endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + 6);

      const schedules = await db.query.storedSchedules.findMany({
        where: and(
          eq(storedSchedules.userId, userId),
          gte(storedSchedules.date, startDate),
          lte(storedSchedules.date, endDate.toISOString().split('T')[0]),
        ),
      });

      const weekSchedules = schedules.map((s) => ({
        date: s.date,
        blocks: JSON.parse(s.scheduleData),
        optimizationScore: s.optimizationScore,
      }));

      return c.json(
        {
          success: true,
          data: weekSchedules,
          timestamp: new Date().toISOString(),
        },
        200,
      );
    } catch (error) {
      console.error('Error fetching week schedules:', error);
      return c.json(
        {
          success: false,
          error: 'Failed to fetch schedules',
          timestamp: new Date().toISOString(),
        },
        500,
      );
    }
  });

  return router;
}

export type ScheduleRouter = ReturnType<typeof createScheduleRoutes>;
