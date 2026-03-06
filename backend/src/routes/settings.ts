import { Hono } from 'hono';
import type { Database } from '../db';
import { v4 as uuidv4 } from 'uuid';
import { eq } from 'drizzle-orm';
import { users, userSettings as userSettingsTable } from '../db/schema';
import type { UserSettings } from '@gsi-planner/shared';

export function createSettingsRoutes(db: Database) {
  const router = new Hono<{ Bindings: { DB: D1Database } }>();

  /**
   * GET /api/settings - Get user settings
   */
  router.get('/', async (c) => {
    try {
      const userId = c.req.header('X-User-ID');
      if (!userId) return c.json({ success: false, error: 'Unauthorized' }, 401);

      let settings = await db.query.userSettings.findFirst({
        where: eq(userSettingsTable.userId, userId),
      });

      // Create default settings if not found
      if (!settings) {
        const settingsId = uuidv4();
        const now = new Date().toISOString();

        // Ensure user exists
        const user = await db.query.users.findFirst({
          where: eq(users.id, userId),
        });

        if (!user) {
          await db.insert(users).values({
            id: userId,
            email: `user-${userId}@gsi-planner.local`,
            createdAt: now,
            updatedAt: now,
          });
        }

        // Create default settings
        await db.insert(userSettingsTable).values({
          id: settingsId,
          userId,
          workStartHour: 9,
          workEndHour: 17,
          theme: 'light',
          notificationsEnabled: true,
          weekStartsOn: 'monday',
          createdAt: now,
          updatedAt: now,
        });

        settings = {
          id: settingsId,
          userId,
          workStartHour: 9,
          workEndHour: 17,
          theme: 'light' as const,
          notificationsEnabled: true,
          weekStartsOn: 'monday' as const,
          createdAt: now,
          updatedAt: now,
        };
      }

      return c.json(
        {
          success: true,
          data: settings,
          timestamp: new Date().toISOString(),
        },
        200,
      );
    } catch (error) {
      console.error('Error fetching settings:', error);
      return c.json(
        {
          success: false,
          error: 'Failed to fetch settings',
          timestamp: new Date().toISOString(),
        },
        500,
      );
    }
  });

  /**
   * PATCH /api/settings - Update user settings
   */
  router.patch('/', async (c) => {
    try {
      const userId = c.req.header('X-User-ID');
      if (!userId) return c.json({ success: false, error: 'Unauthorized' }, 401);

      const body = await c.req.json();

      await db
        .update(userSettingsTable)
        .set({
          ...body,
          updatedAt: new Date().toISOString(),
        })
        .where(eq(userSettingsTable.userId, userId));

      // Fetch updated settings
      const updatedSettings = await db.query.userSettings.findFirst({
        where: eq(userSettingsTable.userId, userId),
      });

      return c.json(
        {
          success: true,
          data: updatedSettings,
          timestamp: new Date().toISOString(),
        },
        200,
      );
    } catch (error) {
      console.error('Error updating settings:', error);
      return c.json(
        {
          success: false,
          error: 'Failed to update settings',
          timestamp: new Date().toISOString(),
        },
        400,
      );
    }
  });

  /**
   * GET /api/settings/theme - Get user theme preference
   */
  router.get('/theme', async (c) => {
    try {
      const userId = c.req.header('X-User-ID');
      if (!userId) return c.json({ success: false, error: 'Unauthorized' }, 401);

      const settings = await db.query.userSettings.findFirst({
        where: eq(userSettingsTable.userId, userId),
      });

      const theme = settings?.theme || 'light';

      return c.json(
        {
          success: true,
          data: { theme },
          timestamp: new Date().toISOString(),
        },
        200,
      );
    } catch (error) {
      console.error('Error fetching theme:', error);
      return c.json(
        {
          success: false,
          error: 'Failed to fetch theme',
          timestamp: new Date().toISOString(),
        },
        500,
      );
    }
  });

  /**
   * GET /api/settings/work-hours - Get work hours setting
   */
  router.get('/work-hours', async (c) => {
    try {
      const userId = c.req.header('X-User-ID');
      if (!userId) return c.json({ success: false, error: 'Unauthorized' }, 401);

      const settings = await db.query.userSettings.findFirst({
        where: eq(userSettingsTable.userId, userId),
      });

      return c.json(
        {
          success: true,
          data: {
            workStartHour: settings?.workStartHour || 9,
            workEndHour: settings?.workEndHour || 17,
          },
          timestamp: new Date().toISOString(),
        },
        200,
      );
    } catch (error) {
      console.error('Error fetching work hours:', error);
      return c.json(
        {
          success: false,
          error: 'Failed to fetch work hours',
          timestamp: new Date().toISOString(),
        },
        500,
      );
    }
  });

  return router;
}

export type SettingsRouter = ReturnType<typeof createSettingsRoutes>;
