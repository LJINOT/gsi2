// Task types
export interface Task {
  id: string;
  title: string;
  description: string;
  dueDate: string;
  estimatedDuration: number; // minutes
  difficulty: 'easy' | 'medium' | 'hard';
  category: string;
  priority: number; // 0-100 (calculated by AHP)
  status: 'pending' | 'in_progress' | 'completed';
  dependencies: string[]; // task IDs
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
}

export interface CreateTaskInput {
  title: string;
  description: string;
  dueDate: string;
}

// Calendar event (can be task or external)
export interface CalendarEvent {
  id: string;
  title: string;
  start: string;
  end: string;
  type: 'task' | 'external';
  taskId?: string;
  color?: string;
}

// Schedule representation
export interface ScheduleBlock {
  taskId: string;
  title: string;
  startTime: string;
  endTime: string;
  duration: number; // minutes
  difficulty: string;
}

export interface DailySchedule {
  date: string;
  blocks: ScheduleBlock[];
  optimizationScore: number;
}

// User settings and preferences
export interface UserSettings {
  id: string;
  workStartHour: number; // 0-23
  workEndHour: number;
  theme: 'light' | 'dark';
  notificationsEnabled: boolean;
  weekStartsOn: 'sunday' | 'monday';
}

// Analytics and learning
export interface CompletionLog {
  taskId: string;
  completedAt: string;
  actualDuration: number; // minutes
  estimatedDuration: number;
  difficulty: string;
}

export interface ProductivityStats {
  totalTasks: number;
  completedTasks: number;
  completionRate: number;
  avgDuration: number;
  avgEstimateAccuracy: number;
  peakHours: number[];
}

export interface UserPatterns {
  peakProductivityHours: number[];
  focusStyles: string[];
  averageDailyTaskCompletion: number;
  estimateAccuracy: number;
}

// AHP Priority calculation
export interface AHPMatrix {
  criteria: string[];
  matrix: number[][];
  weights: number[];
}

// PSO Schedule optimization
export interface PSOptimizationParams {
  swarmSize: number;
  iterations: number;
  inertiaWeight: number;
  cognitiveCoefficient: number;
  socialCoefficient: number;
  timeConstraint: 'workHours' | 'flexible';
}

// CSP Constraint satisfaction
export interface ScheduleConstraints {
  workHoursStart: number;
  workHoursEnd: number;
  noOverlaps: boolean;
  respectDeadlines: boolean;
  minBreakTime: number; // minutes between tasks
}

export interface APIResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: string;
}
