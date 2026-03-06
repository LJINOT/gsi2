/**
 * Particle Swarm Optimization (PSO) for optimal task scheduling
 * Minimizes idle time and respects productivity patterns
 */

import type { Task, ScheduleBlock } from '@gsi-planner/shared';

interface Particle {
  position: number[]; // task ordering
  velocity: number[];
  bestPosition: number[];
  bestFitness: number;
}

interface PSOConfig {
  swarmSize: number;
  iterations: number;
  inertiaWeight: number;
  cognitiveCoefficient: number;
  socialCoefficient: number;
  peakHours: number[]; // preferred work hours
}

/**
 * Fitness function: lower is better
 * Evaluates schedule quality based on:
 * - Idle time minimization
 * - Peak productivity hours utilization
 * - Task priority respects
 */
function calculateFitness(taskOrder: number[], tasks: Task[], peakHours: number[]): number {
  let fitness = 0;
  let currentTime = 540; // 9:00 AM in minutes
  const dayEndTime = 1020; // 5:00 PM

  for (const taskIdx of taskOrder) {
    const task = tasks[taskIdx];
    const taskEndTime = currentTime + task.estimatedDuration;

    if (taskEndTime > dayEndTime) {
      fitness += 1000; // Penalty for exceeding work hours
      break;
    }

    // Penalty for not using peak hours
    if (!isPeakHour(currentTime, peakHours)) {
      fitness += task.estimatedDuration * 0.1;
    }

    // Penalty inversely proportional to priority
    fitness += (100 - task.priority) * 0.5;

    currentTime = taskEndTime + 15; // 15-min break
  }

  return fitness;
}

/**
 * Check if time is within peak productivity hours
 */
function isPeakHour(timeInMinutes: number, peakHours: number[]): boolean {
  const hour = Math.floor(timeInMinutes / 60);
  return peakHours.includes(hour);
}

/**
 * Initialize swarm with random positions
 */
function initializeSwarm(swarmSize: number, taskCount: number): Particle[] {
  const swarm: Particle[] = [];

  for (let i = 0; i < swarmSize; i++) {
    // Random permutation of task indices
    const position = Array.from({ length: taskCount }, (_, i) => i);
    for (let j = taskCount - 1; j > 0; j--) {
      const k = Math.floor(Math.random() * (j + 1));
      [position[j], position[k]] = [position[k], position[j]];
    }

    const velocity = Array.from({ length: taskCount }, () => (Math.random() - 0.5) * 2);

    swarm.push({
      position,
      velocity,
      bestPosition: [...position],
      bestFitness: Number.MAX_VALUE,
    });
  }

  return swarm;
}

/**
 * Order-based position update for PSO
 * Uses swap operations instead of arithmetic on positions
 */
function updateParticlePosition(
  particle: Particle,
  bestLocalFitness: number,
  bestGlobalPosition: number[],
  globalBestFitness: number,
  config: PSOConfig,
): number {
  const c1 = config.cognitiveCoefficient;
  const c2 = config.socialCoefficient;
  const w = config.inertiaWeight;

  let fitness = globalBestFitness;

  // Update velocity and perform swaps
  for (let i = 0; i < particle.position.length; i++) {
    const r1 = Math.random();
    const r2 = Math.random();

    // Probability to swap with personal best
    if (r1 < (c1 / 6)) {
      const idx1 = Math.floor(Math.random() * particle.position.length);
      const idx2 = particle.bestPosition.indexOf(particle.position[idx1]);
      [particle.position[idx1], particle.position[idx2]] = [
        particle.position[idx2],
        particle.position[idx1],
      ];
    }

    // Probability to swap with global best
    if (r2 < (c2 / 6)) {
      const idx1 = Math.floor(Math.random() * particle.position.length);
      const idx2 = bestGlobalPosition.indexOf(particle.position[idx1]);
      if (idx2 !== -1) {
        [particle.position[idx1], particle.position[idx2]] = [
          particle.position[idx2],
          particle.position[idx1],
        ];
      }
    }
  }

  return fitness;
}

/**
 * Run PSO optimization on task order
 */
export function optimizeScheduleWithPSO(tasks: Task[], config: PSOConfig): number[] {
  if (tasks.length === 0) return [];
  if (tasks.length === 1) return [0];

  const swarm = initializeSwarm(config.swarmSize, tasks.length);
  let bestGlobalPosition: number[] = [];
  let bestGlobalFitness = Number.MAX_VALUE;

  // Evaluate initial fitness
  for (const particle of swarm) {
    const fitness = calculateFitness(particle.position, tasks, config.peakHours);
    particle.bestFitness = fitness;

    if (fitness < bestGlobalFitness) {
      bestGlobalFitness = fitness;
      bestGlobalPosition = [...particle.position];
    }
  }

  // PSO iterations
  for (let iter = 0; iter < config.iterations; iter++) {
    for (const particle of swarm) {
      const fitness = updateParticlePosition(
        particle,
        particle.bestFitness,
        bestGlobalPosition,
        bestGlobalFitness,
        config,
      );

      // Update personal best
      const currentFitness = calculateFitness(particle.position, tasks, config.peakHours);
      if (currentFitness < particle.bestFitness) {
        particle.bestFitness = currentFitness;
        particle.bestPosition = [...particle.position];

        // Update global best
        if (currentFitness < bestGlobalFitness) {
          bestGlobalFitness = currentFitness;
          bestGlobalPosition = [...particle.position];
        }
      }
    }

    // Reduce inertia weight over time
    config.inertiaWeight *= 0.99;
  }

  return bestGlobalPosition;
}

/**
 * Generate schedule blocks from optimized task order
 */
export function generateScheduleFromOrder(
  taskOrder: number[],
  tasks: Task[],
  workStartHour: number = 9,
): ScheduleBlock[] {
  const blocks: ScheduleBlock[] = [];
  let currentMinutes = workStartHour * 60;
  const maxEndTime = 17 * 60; // 5 PM

  for (const taskIdx of taskOrder) {
    const task = tasks[taskIdx];
    const endTime = currentMinutes + task.estimatedDuration;

    if (endTime > maxEndTime) break;

    blocks.push({
      taskId: task.id,
      title: task.title,
      startTime: minutesToTime(currentMinutes),
      endTime: minutesToTime(endTime),
      duration: task.estimatedDuration,
      difficulty: task.difficulty,
    });

    // Add break time
    currentMinutes = endTime + 15;
  }

  return blocks;
}

/**
 * Convert minutes since midnight to HH:MM format
 */
function minutesToTime(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
}
