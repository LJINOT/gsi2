import { Hono } from 'hono';
import { v4 as uuidv4 } from 'uuid';
import type { Database } from '../db';
import type { Task, CreateTaskInput } from '@gsi-planner/shared';
import { createTaskSchema, taskSchema } from '@gsi-planner/shared';
import { analyzeTask } from '../lib/nlp-analyzer';
import { calculateTaskPriorities } from '../lib/ahp-priority';
import { eq, and } from 'drizzle-orm';
import { tasks as tasksTable, taskDependencies } from '../db/schema';

export function createTaskRoutes(db: Database) {
  const router = new Hono<{ Bindings: { DB: D1Database } }>();

  /**
   * GET /api/tasks - List all tasks for user
   */
  router.get('/', async (c) => {
    try {
      const userId = c.req.header('X-User-ID');
      if (!userId) return c.json({ success: false, error: 'Unauthorized' }, 401);

      const allTasks = await db.query.tasks
        .findMany({
          where: eq(tasksTable.userId, userId),
          with: {
            dependencies: true,
          },
        });

      // Fetch completion logs for priority calculation
      // For now, return with current priorities
      const tasksWithDeps = allTasks.map((task) => ({
        ...task,
        dependencies: task.dependencies?.map((d) => d.dependsOnTaskId) || [],
      }));

      return c.json(
        {
          success: true,
          data: tasksWithDeps,
          timestamp: new Date().toISOString(),
        },
        200,
      );
    } catch (error) {
      console.error('Error fetching tasks:', error);
      return c.json(
        { success: false, error: 'Failed to fetch tasks', timestamp: new Date().toISOString() },
        500,
      );
    }
  });

  /**
   * POST /api/tasks - Create new task
   */
  router.post('/', async (c) => {
    try {
      const userId = c.req.header('X-User-ID');
      if (!userId) return c.json({ success: false, error: 'Unauthorized' }, 401);

      const body = await c.req.json();
      const validated = createTaskSchema.parse(body);

      // Analyze task using NLP
      const analysis = analyzeTask(validated.title, validated.description);

      const taskId = uuidv4();
      const now = new Date().toISOString();

      // Insert task
      await db.insert(tasksTable).values({
        id: taskId,
        userId,
        title: validated.title,
        description: validated.description,
        dueDate: validated.dueDate,
        estimatedDuration: analysis.estimatedDuration,
        difficulty: analysis.difficulty,
        category: analysis.category,
        priority: 50, // Will be recalculated
        status: 'pending',
        createdAt: now,
        updatedAt: now,
      });

      const newTask: Task = {
        id: taskId,
        ...validated,
        estimatedDuration: analysis.estimatedDuration,
        difficulty: analysis.difficulty,
        category: analysis.category,
        priority: 50,
        status: 'pending',
        dependencies: [],
        createdAt: now,
        updatedAt: now,
      };

      return c.json(
        {
          success: true,
          data: newTask,
          timestamp: new Date().toISOString(),
        },
        201,
      );
    } catch (error) {
      console.error('Error creating task:', error);
      return c.json(
        { success: false, error: 'Failed to create task', timestamp: new Date().toISOString() },
        400,
      );
    }
  });

  /**
   * GET /api/tasks/:id - Get single task
   */
  router.get('/:id', async (c) => {
    try {
      const userId = c.req.header('X-User-ID');
      const taskId = c.req.param('id');

      if (!userId) return c.json({ success: false, error: 'Unauthorized' }, 401);

      const task = await db.query.tasks.findFirst({
        where: and(eq(tasksTable.id, taskId), eq(tasksTable.userId, userId)),
        with: { dependencies: true },
      });

      if (!task) return c.json({ success: false, error: 'Task not found' }, 404);

      return c.json(
        {
          success: true,
          data: {
            ...task,
            dependencies: task.dependencies?.map((d) => d.dependsOnTaskId) || [],
          },
          timestamp: new Date().toISOString(),
        },
        200,
      );
    } catch (error) {
      console.error('Error fetching task:', error);
      return c.json(
        { success: false, error: 'Failed to fetch task', timestamp: new Date().toISOString() },
        500,
      );
    }
  });

  /**
   * PATCH /api/tasks/:id - Update task
   */
  router.patch('/:id', async (c) => {
    try {
      const userId = c.req.header('X-User-ID');
      const taskId = c.req.param('id');

      if (!userId) return c.json({ success: false, error: 'Unauthorized' }, 401);

      const body = await c.req.json();

      await db
        .update(tasksTable)
        .set({
          ...body,
          updatedAt: new Date().toISOString(),
        })
        .where(and(eq(tasksTable.id, taskId), eq(tasksTable.userId, userId)));

      return c.json(
        {
          success: true,
          data: { id: taskId, ...body },
          timestamp: new Date().toISOString(),
        },
        200,
      );
    } catch (error) {
      console.error('Error updating task:', error);
      return c.json(
        { success: false, error: 'Failed to update task', timestamp: new Date().toISOString() },
        400,
      );
    }
  });

  /**
   * DELETE /api/tasks/:id - Delete task
   */
  router.delete('/:id', async (c) => {
    try {
      const userId = c.req.header('X-User-ID');
      const taskId = c.req.param('id');

      if (!userId) return c.json({ success: false, error: 'Unauthorized' }, 401);

      await db
        .delete(tasksTable)
        .where(and(eq(tasksTable.id, taskId), eq(tasksTable.userId, userId)));

      return c.json(
        {
          success: true,
          data: { deleted: taskId },
          timestamp: new Date().toISOString(),
        },
        200,
      );
    } catch (error) {
      console.error('Error deleting task:', error);
      return c.json(
        { success: false, error: 'Failed to delete task', timestamp: new Date().toISOString() },
        400,
      );
    }
  });

  return router;
}

export type TaskRouter = ReturnType<typeof createTaskRoutes>;
