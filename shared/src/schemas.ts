import { z } from 'zod';

// Task schemas
export const createTaskSchema = z.object({
  title: z.string().min(1).max(255),
  description: z.string().max(2000),
  dueDate: z.string().datetime(),
});

export const taskSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
  dueDate: z.string(),
  estimatedDuration: z.number().positive(),
  difficulty: z.enum(['easy', 'medium', 'hard']),
  category: z.string(),
  priority: z.number().min(0).max(100),
  status: z.enum(['pending', 'in_progress', 'completed']),
  dependencies: z.array(z.string()),
  createdAt: z.string(),
  updatedAt: z.string(),
  completedAt: z.string().optional(),
});

// Calendar event schema
export const calendarEventSchema = z.object({
  id: z.string(),
  title: z.string(),
  start: z.string(),
  end: z.string(),
  type: z.enum(['task', 'external']),
  taskId: z.string().optional(),
  color: z.string().optional(),
});

// Schedule block schema
export const scheduleBlockSchema = z.object({
  taskId: z.string(),
  title: z.string(),
  startTime: z.string(),
  endTime: z.string(),
  duration: z.number().positive(),
  difficulty: z.string(),
});

export const dailyScheduleSchema = z.object({
  date: z.string(),
  blocks: z.array(scheduleBlockSchema),
  optimizationScore: z.number().min(0).max(1),
});

// User settings schema
export const userSettingsSchema = z.object({
  id: z.string(),
  workStartHour: z.number().min(0).max(23),
  workEndHour: z.number().min(0).max(23),
  theme: z.enum(['light', 'dark']),
  notificationsEnabled: z.boolean(),
  weekStartsOn: z.enum(['sunday', 'monday']),
});

// Analytics schemas
export const completionLogSchema = z.object({
  taskId: z.string(),
  completedAt: z.string(),
  actualDuration: z.number().positive(),
  estimatedDuration: z.number().positive(),
  difficulty: z.string(),
});

export const productivityStatsSchema = z.object({
  totalTasks: z.number(),
  completedTasks: z.number(),
  completionRate: z.number(),
  avgDuration: z.number(),
  avgEstimateAccuracy: z.number(),
  peakHours: z.array(z.number()),
});

// API Response schema
export const apiResponseSchema = z.object({
  success: z.boolean(),
  data: z.unknown().optional(),
  error: z.string().optional(),
  timestamp: z.string(),
});

// Constraint satisfaction schema
export const constraintsSchema = z.object({
  workHoursStart: z.number().min(0).max(23),
  workHoursEnd: z.number().min(0).max(23),
  noOverlaps: z.boolean(),
  respectDeadlines: z.boolean(),
  minBreakTime: z.number().nonnegative(),
});

export type CreateTaskInput = z.infer<typeof createTaskSchema>;
export type Task = z.infer<typeof taskSchema>;
export type CalendarEvent = z.infer<typeof calendarEventSchema>;
export type DailySchedule = z.infer<typeof dailyScheduleSchema>;
export type UserSettings = z.infer<typeof userSettingsSchema>;
export type ProductivityStats = z.infer<typeof productivityStatsSchema>;
