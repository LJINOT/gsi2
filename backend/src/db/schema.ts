import { sqliteTable, text, integer, real, primaryKey } from 'drizzle-orm/sqlite-core';
import { relations } from 'drizzle-orm';

// Users table
export const users = sqliteTable('users', {
  id: text('id').primaryKey(),
  email: text('email').notNull().unique(),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});

// Tasks table
export const tasks = sqliteTable('tasks', {
  id: text('id').primaryKey(),
  userId: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  description: text('description'),
  dueDate: text('due_date').notNull(),
  estimatedDuration: integer('estimated_duration').notNull(), // minutes
  difficulty: text('difficulty', { enum: ['easy', 'medium', 'hard'] }).notNull().default('medium'),
  category: text('category').notNull().default('general'),
  priority: real('priority').notNull().default(50), // 0-100
  status: text('status', { enum: ['pending', 'in_progress', 'completed'] }).notNull().default('pending'),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
  completedAt: text('completed_at'),
});

// Task dependencies
export const taskDependencies = sqliteTable(
  'task_dependencies',
  {
    taskId: text('task_id')
      .notNull()
      .references(() => tasks.id, { onDelete: 'cascade' }),
    dependsOnTaskId: text('depends_on_task_id')
      .notNull()
      .references(() => tasks.id, { onDelete: 'cascade' }),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.taskId, table.dependsOnTaskId] }),
  }),
);

// Calendar events (external events)
export const calendarEvents = sqliteTable('calendar_events', {
  id: text('id').primaryKey(),
  userId: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  start: text('start').notNull(), // ISO datetime
  end: text('end').notNull(),
  color: text('color'),
  createdAt: text('created_at').notNull(),
});

// User settings
export const userSettings = sqliteTable('user_settings', {
  id: text('id').primaryKey(),
  userId: text('user_id')
    .notNull()
    .unique()
    .references(() => users.id, { onDelete: 'cascade' }),
  workStartHour: integer('work_start_hour').notNull().default(9),
  workEndHour: integer('work_end_hour').notNull().default(17),
  theme: text('theme', { enum: ['light', 'dark'] }).notNull().default('light'),
  notificationsEnabled: integer('notifications_enabled', { mode: 'boolean' }).notNull().default(true),
  weekStartsOn: text('week_starts_on', { enum: ['sunday', 'monday'] }).notNull().default('monday'),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});

// Completion logs for learning
export const completionLogs = sqliteTable('completion_logs', {
  id: text('id').primaryKey(),
  userId: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  taskId: text('task_id')
    .notNull()
    .references(() => tasks.id, { onDelete: 'cascade' }),
  completedAt: text('completed_at').notNull(),
  actualDuration: integer('actual_duration').notNull(), // minutes
  estimatedDuration: integer('estimated_duration').notNull(),
  difficulty: text('difficulty').notNull(),
});

// Stored schedules (daily optimized schedules)
export const storedSchedules = sqliteTable('stored_schedules', {
  id: text('id').primaryKey(),
  userId: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  date: text('date').notNull(), // YYYY-MM-DD
  scheduleData: text('schedule_data').notNull(), // JSON
  optimizationScore: real('optimization_score').notNull(),
  createdAt: text('created_at').notNull(),
});

// Relations
export const userRelations = relations(users, ({ many, one }) => ({
  tasks: many(tasks),
  settings: one(userSettings),
  events: many(calendarEvents),
  schedules: many(storedSchedules),
}));

export const taskRelations = relations(tasks, ({ one, many }) => ({
  user: one(users, { fields: [tasks.userId], references: [users.id] }),
  dependencies: many(taskDependencies),
  logs: many(completionLogs),
}));

export const userSettingsRelations = relations(userSettings, ({ one }) => ({
  user: one(users, { fields: [userSettings.userId], references: [users.id] }),
}));
