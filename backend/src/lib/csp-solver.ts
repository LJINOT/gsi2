/**
 * Simple Constraint Satisfaction Problem (CSP) solver
 * Ensures schedules respect work hours, dependencies, deadlines, and no overlaps
 */

import type { Task, ScheduleBlock, ScheduleConstraints } from '@gsi-planner/shared';

interface TaskToSchedule extends Task {
  startTime?: string;
  endTime?: string;
}

/**
 * Convert time string (HH:MM) to minutes since midnight
 */
function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + (minutes || 0);
}

/**
 * Convert minutes since midnight to time string
 */
function minutesToTime(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
}

/**
 * Check if two time blocks overlap
 */
function blocksOverlap(
  start1: number,
  end1: number,
  start2: number,
  end2: number,
): boolean {
  return start1 < end2 && start2 < end1;
}

/**
 * Solve schedule using simple backtracking + forward checking
 */
export function solveScheduleCSP(
  tasks: Task[],
  constraints: ScheduleConstraints,
  date: string,
): ScheduleBlock[] {
  const workStart = constraints.workHoursStart * 60; // minutes
  const workEnd = constraints.workHoursEnd * 60;
  const workDayLength = workEnd - workStart;

  // Sort tasks by priority (higher = earlier)
  const sortedTasks = [...tasks].sort((a, b) => b.priority - a.priority);

  const schedule: ScheduleBlock[] = [];
  const assignedTasks = new Set<string>();

  /**
   * Try to fit task into schedule using forward checking
   */
  function canAssignTask(
    task: Task,
    startMinutes: number,
  ): { canAssign: boolean; endMinutes: number } {
    const endMinutes = startMinutes + task.estimatedDuration;

    // Check work hours constraint
    if (startMinutes < workStart || endMinutes > workEnd) {
      return { canAssign: false, endMinutes };
    }

    // Check no overlap constraint
    if (constraints.noOverlaps) {
      for (const block of schedule) {
        const blockStart = timeToMinutes(block.startTime);
        const blockEnd = timeToMinutes(block.endTime);
        if (blocksOverlap(startMinutes, endMinutes, blockStart, blockEnd)) {
          return { canAssign: false, endMinutes };
        }
      }
    }

    // Check break time constraint
    if (constraints.minBreakTime > 0) {
      for (const block of schedule) {
        const blockStart = timeToMinutes(block.startTime);
        const blockEnd = timeToMinutes(block.endTime);

        if (endMinutes + constraints.minBreakTime > blockStart && endMinutes <= blockStart) {
          return { canAssign: false, endMinutes };
        }
        if (startMinutes - constraints.minBreakTime < blockEnd && startMinutes >= blockEnd) {
          return { canAssign: false, endMinutes };
        }
      }
    }

    // Check deadline constraint
    if (constraints.respectDeadlines) {
      const taskDueDate = new Date(task.dueDate);
      const scheduleDate = new Date(date);
      if (taskDueDate < scheduleDate) {
        return { canAssign: false, endMinutes };
      }
    }

    // Check dependencies are scheduled first
    for (const depId of task.dependencies || []) {
      if (!assignedTasks.has(depId)) {
        return { canAssign: false, endMinutes };
      }
    }

    return { canAssign: true, endMinutes };
  }

  /**
   * Backtracking algorithm to assign tasks
   */
  function assignTask(taskIndex: number): boolean {
    if (taskIndex >= sortedTasks.length) {
      return true; // All tasks assigned
    }

    const task = sortedTasks[taskIndex];
    if (assignedTasks.has(task.id)) {
      return assignTask(taskIndex + 1); // Already assigned
    }

    // Try to fit task at different start times
    for (let startMinutes = workStart; startMinutes < workEnd; startMinutes += 15) {
      const { canAssign, endMinutes } = canAssignTask(task, startMinutes);

      if (canAssign) {
        // Assign task
        schedule.push({
          taskId: task.id,
          title: task.title,
          startTime: minutesToTime(startMinutes),
          endTime: minutesToTime(endMinutes),
          duration: task.estimatedDuration,
          difficulty: task.difficulty,
        });

        assignedTasks.add(task.id);

        // Recursively try to assign remaining tasks
        if (assignTask(taskIndex + 1)) {
          return true;
        }

        // Backtrack
        schedule.pop();
        assignedTasks.delete(task.id);
      }
    }

    return false;
  }

  // Run the backtracking algorithm
  assignTask(0);

  return schedule.sort((a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime));
}

/**
 * Calculate schedule quality score (0-1)
 * Considers: task coverage, idle time, constraint satisfaction
 */
export function calculateScheduleQuality(
  schedule: ScheduleBlock[],
  totalTaskDuration: number,
  workDayLength: number,
): number {
  if (schedule.length === 0) return 0;

  const scheduledDuration = schedule.reduce((sum, block) => sum + block.duration, 0);
  const idleTime = workDayLength - scheduledDuration;

  // Higher score if less idle time, more tasks scheduled
  const taskCoverage = scheduledDuration / totalTaskDuration;
  const utilizationRate = scheduledDuration / workDayLength;

  return Math.min(1, (taskCoverage + utilizationRate) / 2);
}
