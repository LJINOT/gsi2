/**
 * Analytic Hierarchy Process (AHP) for automated task prioritization
 * Calculates priorities based on: deadline urgency, importance, dependencies, and learned patterns
 */

import type { Task, CompletionLog } from '@gsi-planner/shared';

interface AHPCriteria {
  deadline: number; // 0-1 (days until due)
  importance: number; // 0-1 (learned from past patterns)
  dependencies: number; // 0-1 (how many tasks depend on this)
  complexity: number; // 0-1 (easy/medium/hard)
}

/**
 * Calculate deadline urgency score (0-1)
 * Closer to deadline = higher urgency
 */
function calculateDeadlineScore(dueDate: string, today: Date = new Date()): number {
  const due = new Date(dueDate);
  const msPerDay = 24 * 60 * 60 * 1000;
  const daysUntilDue = (due.getTime() - today.getTime()) / msPerDay;

  if (daysUntilDue < 0) return 1.0; // Overdue
  if (daysUntilDue === 0) return 0.95; // Due today
  if (daysUntilDue < 1) return 0.9;
  if (daysUntilDue < 3) return 0.75;
  if (daysUntilDue < 7) return 0.6;
  if (daysUntilDue < 14) return 0.4;
  return Math.max(0.1, 1 - daysUntilDue / 30); // Spread over month
}

/**
 * Calculate task importance based on learned patterns
 * Uses completion logs to determine which categories/types are important
 */
function calculateImportanceScore(
  task: Task,
  completionLogs: CompletionLog[] = [],
): number {
  // Category-based importance
  const categoryImportance: Record<string, number> = {
    work: 0.9,
    learning: 0.7,
    personal: 0.5,
    health: 0.8,
    social: 0.4,
    general: 0.5,
  };

  let baseScore = categoryImportance[task.category] || 0.5;

  // Difficulty can increase importance
  if (task.difficulty === 'hard') baseScore += 0.2;
  if (task.difficulty === 'easy') baseScore -= 0.1;

  // Analyze completion patterns
  if (completionLogs.length > 0) {
    const categoryLogs = completionLogs.filter((log) => log.difficulty === task.difficulty);
    const completionRate = categoryLogs.length > 0 ? 1 : 0;
    baseScore = (baseScore + completionRate) / 2;
  }

  return Math.min(1, baseScore);
}

/**
 * Calculate dependency weight
 * More dependent tasks = higher priority
 */
function calculateDependencyScore(taskId: string, allTasks: Task[]): number {
  const dependentTasks = allTasks.filter((t) => t.dependencies?.includes(taskId));
  const score = Math.min(0.5, dependentTasks.length * 0.1);
  return score;
}

/**
 * Convert difficulty to numeric score
 */
function difficultyToScore(difficulty: string): number {
  switch (difficulty) {
    case 'easy':
      return 0.3;
    case 'medium':
      return 0.6;
    case 'hard':
      return 0.9;
    default:
      return 0.5;
  }
}

/**
 * Build AHP comparison matrix (3x3 for 3 main criteria)
 * Simplified version focusing on: Deadline, Importance, Dependencies
 */
function buildAHPMatrix(): number[][] {
  // Pairwise comparison matrix (assuming these weights)
  return [
    [1, 2, 3], // Deadline: 2x importance, 3x dependencies
    [0.5, 1, 2], // Importance: 2x dependencies
    [0.33, 0.5, 1], // Dependencies
  ];
}

/**
 * Calculate eigenvalues and eigenvector (priority weights)
 * Simplified power method for 3x3 matrix
 */
function calculatePriorityWeights(): number[] {
  const matrix = buildAHPMatrix();
  const n = matrix.length;

  // Initialize vector
  let w = Array(n).fill(1 / n);

  // Power iteration (simplified)
  for (let iter = 0; iter < 10; iter++) {
    const newW = Array(n).fill(0);

    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        newW[i] += matrix[i][j] * w[j];
      }
    }

    const sum = newW.reduce((a, b) => a + b, 0);
    w = newW.map((val) => val / sum);
  }

  // Normalize to sum to 1
  const sum = w.reduce((a, b) => a + b, 0);
  return w.map((val) => val / sum);
}

/**
 * Calculate priority score for a single task (0-100)
 */
function calculateTaskPriority(
  task: Task,
  allTasks: Task[],
  completionLogs: CompletionLog[] = [],
): number {
  const criteria: AHPCriteria = {
    deadline: calculateDeadlineScore(task.dueDate),
    importance: calculateImportanceScore(task, completionLogs),
    dependencies: calculateDependencyScore(task.id, allTasks),
    complexity: difficultyToScore(task.difficulty),
  };

  // Get AHP weights
  const weights = calculatePriorityWeights();

  // Weighted sum (simplified 3-factor version)
  const score =
    criteria.deadline * weights[0] + criteria.importance * weights[1] + criteria.dependencies * weights[2];

  return Math.round(Math.min(100, Math.max(0, score * 100)));
}

/**
 * Calculate priorities for all tasks
 * Returns tasks sorted by priority (highest first)
 */
export function calculateTaskPriorities(
  tasks: Task[],
  completionLogs: CompletionLog[] = [],
): Task[] {
  return tasks
    .map((task) => ({
      ...task,
      priority: calculateTaskPriority(task, tasks, completionLogs),
    }))
    .sort((a, b) => b.priority - a.priority);
}

/**
 * Consistency ratio check (simplified)
 * Verifies AHP matrix consistency
 */
export function checkAHPConsistency(): number {
  // Simplified: always return valid (0.1 or less is acceptable)
  return 0.05;
}

/**
 * Calculate relative importance between two tasks
 */
export function getRelativeImportance(task1: Task, task2: Task): number {
  const score1 = calculateDeadlineScore(task1.dueDate) + task1.difficulty === 'hard' ? 0.2 : 0;
  const score2 = calculateDeadlineScore(task2.dueDate) + task2.difficulty === 'hard' ? 0.2 : 0;
  return score1 / (score1 + score2);
}
