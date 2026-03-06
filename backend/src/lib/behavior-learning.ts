/**
 * Apprentice AI: Learning module for personal productivity patterns
 * Analyzes completion logs to understand and improve estimates and scheduling
 */

import type { CompletionLog, Task } from '@gsi-planner/shared';

export interface LearningInsights {
  peakProductivityHours: number[]; // hours 0-23
  focusStyles: string[];
  averageDailyTaskCompletion: number;
  estimateAccuracy: number; // 0-1
  difficultyCorrectionFactors: {
    easy: number;
    medium: number;
    hard: number;
  };
  categoryPatterns: Record<string, number>; // avg completion rate by category
}

/**
 * Find peak productivity hours from completion logs
 */
export function analyzePeakHours(logs: CompletionLog[]): number[] {
  if (logs.length === 0) return [9, 10, 11, 14, 15, 16]; // Default: 9-12, 2-5 PM

  const hourCounts = Array(24).fill(0);
  const hourSums = Array(24).fill(0);

  for (const log of logs) {
    const date = new Date(log.completedAt);
    const hour = date.getHours();
    const accuracy = log.estimatedDuration > 0 ? log.actualDuration / log.estimatedDuration : 1;

    hourCounts[hour]++;
    hourSums[hour] += accuracy > 0 ? 1 / accuracy : 0; // Higher = better estimate
  }

  // Calculate efficiency per hour
  const efficiency = hourSums.map((sum, hour) =>
    hourCounts[hour] > 0 ? sum / hourCounts[hour] : 0,
  );

  // Get top 6 hours
  const peakHours = efficiency
    .map((eff, hour) => ({ hour, efficiency: eff }))
    .sort((a, b) => b.efficiency - a.efficiency)
    .slice(0, 6)
    .map((h) => h.hour)
    .sort((a, b) => a - b);

  return peakHours.length > 0 ? peakHours : [9, 10, 11, 14, 15, 16];
}

/**
 * Identify focus styles (Pomodoro, deep work, etc.)
 */
export function analyzeFocusStyles(logs: CompletionLog[]): string[] {
  if (logs.length === 0) return ['pomodoro'];

  // Analyze session lengths
  const sessionLengths = logs.map((l) => l.actualDuration);
  const avgSession = sessionLengths.reduce((a, b) => a + b, 0) / sessionLengths.length;

  const styles: string[] = [];

  if (avgSession < 30) styles.push('quick-wins');
  if (avgSession >= 30 && avgSession < 90) styles.push('pomodoro');
  if (avgSession >= 90) styles.push('deep-work');

  // Analyze consistency
  const variance = sessionLengths.reduce((sum, len) => sum + Math.pow(len - avgSession, 2), 0) / sessionLengths.length;
  if (variance < avgSession ** 2 * 0.2) styles.push('consistent');
  else styles.push('flexible');

  return styles.length > 0 ? styles : ['pomodoro'];
}

/**
 * Calculate average daily task completion
 */
export function calculateDailyCompletion(logs: CompletionLog[]): number {
  if (logs.length === 0) return 3;

  const dates = new Set(logs.map((l) => new Date(l.completedAt).toDateString()));
  return logs.length / dates.size;
}

/**
 * Calculate how accurate user estimates are
 */
export function calculateEstimateAccuracy(logs: CompletionLog[]): number {
  if (logs.length === 0) return 0.85; // Default: assume 85% accuracy

  const accuracies = logs.map((log) => {
    if (log.estimatedDuration === 0) return 1;
    const ratio = log.actualDuration / log.estimatedDuration;
    // Measure how close to 1 (perfect estimate)
    return 1 - Math.abs(ratio - 1);
  });

  const avgAccuracy = accuracies.reduce((a, b) => a + b, 0) / accuracies.length;
  return Math.max(0, Math.min(1, avgAccuracy));
}

/**
 * Calculate correction factors for difficulty estimates
 */
export function calculateDifficultyCorrectionFactors(
  logs: CompletionLog[],
): Record<'easy' | 'medium' | 'hard', number> {
  if (logs.length === 0) {
    return { easy: 1.0, medium: 1.0, hard: 1.0 };
  }

  const byDifficulty = {
    easy: logs.filter((l) => l.difficulty === 'easy'),
    medium: logs.filter((l) => l.difficulty === 'medium'),
    hard: logs.filter((l) => l.difficulty === 'hard'),
  };

  const factors: Record<'easy' | 'medium' | 'hard', number> = {
    easy: 1.0,
    medium: 1.0,
    hard: 1.0,
  };

  for (const [difficulty, logsForDiff] of Object.entries(byDifficulty)) {
    if (logsForDiff.length === 0) continue;

    const avgRatio =
      logsForDiff.reduce((sum, log) => sum + log.actualDuration / log.estimatedDuration, 0) /
      logsForDiff.length;

    factors[difficulty as 'easy' | 'medium' | 'hard'] = Math.max(0.5, Math.min(2, avgRatio));
  }

  return factors;
}

/**
 * Analyze completion patterns by category
 */
export function analyzeCategoryPatterns(logs: CompletionLog[], tasks: Task[]): Record<string, number> {
  if (logs.length === 0) {
    return { work: 0.8, personal: 0.6, learning: 0.7 };
  }

  const patterns: Record<string, number> = {};

  const taskMap = new Map(tasks.map((t) => [t.id, t]));

  for (const log of logs) {
    const task = taskMap.get(log.taskId);
    if (!task) continue;

    if (!patterns[task.category]) patterns[task.category] = 0;

    const accuracy = log.estimatedDuration > 0 ? log.actualDuration / log.estimatedDuration : 1;
    patterns[task.category] += accuracy > 0 ? 1 / accuracy : 0;
  }

  // Normalize
  for (const category in patterns) {
    patterns[category] = Math.min(1, patterns[category] / logs.length);
  }

  return patterns;
}

/**
 * Generate comprehensive learning insights
 */
export function generateInsights(logs: CompletionLog[], tasks: Task[]): LearningInsights {
  return {
    peakProductivityHours: analyzePeakHours(logs),
    focusStyles: analyzeFocusStyles(logs),
    averageDailyTaskCompletion: calculateDailyCompletion(logs),
    estimateAccuracy: calculateEstimateAccuracy(logs),
    difficultyCorrectionFactors: calculateDifficultyCorrectionFactors(logs),
    categoryPatterns: analyzeCategoryPatterns(logs, tasks),
  };
}

/**
 * Apply learned patterns to improve task estimate
 */
export function improveTaskEstimate(
  originalEstimate: number,
  difficulty: string,
  category: string,
  insights: LearningInsights,
): number {
  let adjusted = originalEstimate;

  // Apply difficulty correction
  const difficultyFactor =
    insights.difficultyCorrectionFactors[difficulty as 'easy' | 'medium' | 'hard'] || 1.0;
  adjusted *= difficultyFactor;

  // Apply category pattern adjustment
  const categoryFactor = insights.categoryPatterns[category] || 1.0;
  adjusted = (adjusted + adjusted * categoryFactor) / 2;

  // Apply overall accuracy adjustment
  adjusted *= insights.estimateAccuracy;

  return Math.round(adjusted);
}
