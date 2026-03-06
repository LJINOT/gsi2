import numpy as np
from typing import List, Dict, Any
from datetime import datetime, timedelta
import random

class Particle:
    """Represents a particle in the swarm (a task ordering)"""
    
    def __init__(self, tasks: List[Dict], work_hours: Dict):
        self.tasks = tasks
        self.work_hours = work_hours
        self.position = list(range(len(tasks)))  # Task indices ordering
        random.shuffle(self.position)
        
        self.velocity = [random.uniform(-1, 1) for _ in range(len(tasks))]
        self.best_position = self.position.copy()
        self.best_fitness = float('inf')
        self.fitness = self._calculate_fitness()
        
        if self.fitness < self.best_fitness:
            self.best_fitness = self.fitness
    
    def _calculate_fitness(self) -> float:
        """
        Calculate fitness score for current position.
        Lower fitness = better schedule
        """
        fitness = 0.0
        current_time = self._parse_time(self.work_hours['start'])
        
        for idx in self.position:
            task = self.tasks[idx]
            
            # Penalty: task completion after deadline
            due_time = datetime.fromisoformat(task.get('dueDate'))
            task_duration = task.get('estimatedDuration', 30) / 60  # convert to hours
            
            completion_time = current_time + timedelta(hours=task_duration)
            
            if completion_time > due_time:
                hours_late = (completion_time - due_time).total_seconds() / 3600
                fitness += hours_late * 100  # Heavy penalty for late tasks
            
            # Penalty: high difficulty tasks later in day (when energy low)
            task_hours_from_start = (current_time - self._parse_time(self.work_hours['start'])).total_seconds() / 3600
            if task['difficulty'] == 'hard' and task_hours_from_start > 6:
                fitness += 50
            
            # Bonus: grouping similar categories
            if idx > 0:
                prev_task = self.tasks[self.position[idx - 1]]
                if task.get('category') == prev_task.get('category'):
                    fitness -= 5  # Negative penalty = bonus
            
            current_time = completion_time
        
        # Penalty: exceeding work hours
        end_time = self._parse_time(self.work_hours['end'])
        if current_time > end_time:
            hours_over = (current_time - end_time).total_seconds() / 3600
            fitness += hours_over * 200
        
        return max(0, fitness)
    
    @staticmethod
    def _parse_time(time_str: str) -> datetime:
        """Parse time string HH:MM to datetime"""
        h, m = map(int, time_str.split(':'))
        now = datetime.now()
        return now.replace(hour=h, minute=m, second=0, microsecond=0)
    
    def update_velocity_and_position(self, global_best_position: List, w: float, c1: float, c2: float):
        """Update particle velocity and position using PSO equations"""
        for i in range(len(self.position)):
            r1 = random.random()
            r2 = random.random()
            
            # PSO velocity update equation
            self.velocity[i] = (
                w * self.velocity[i] +
                c1 * r1 * (self.best_position[i] - self.position[i]) +
                c2 * r2 * (global_best_position[i] - self.position[i])
            )
            
            # Apply velocity threshold
            self.velocity[i] = max(-4, min(4, self.velocity[i]))
            
            # Update position with some randomness for discrete domain
            if random.random() < abs(self.velocity[i]) / 4:
                # Swap two random positions
                idx1, idx2 = random.sample(range(len(self.position)), 2)
                self.position[idx1], self.position[idx2] = self.position[idx2], self.position[idx1]
        
        # Calculate new fitness
        self.fitness = self._calculate_fitness()
        
        # Update personal best
        if self.fitness < self.best_fitness:
            self.best_fitness = self.fitness
            self.best_position = self.position.copy()


class ParticleSwarmOptimizer:
    """
    Optimizes task ordering using Particle Swarm Optimization
    """
    
    def __init__(self, tasks: List[Dict], work_hours: Dict, preferences: Dict = None, num_particles: int = 30):
        self.tasks = tasks
        self.work_hours = work_hours
        self.preferences = preferences or {}
        self.num_particles = num_particles
        
        self.swarm = [Particle(tasks, work_hours) for _ in range(num_particles)]
        self.global_best_position = min(self.swarm, key=lambda p: p.fitness).best_position.copy()
        self.best_fitness = min(p.fitness for p in self.swarm)
        
        self.fitness_history = [self.best_fitness]
    
    def optimize(self, max_iterations: int = 100, w_start: float = 0.9, w_end: float = 0.4) -> List[Dict]:
        """
        Run PSO optimization
        
        Args:
            max_iterations: Number of iterations to run
            w_start: Initial inertia weight
            w_end: Final inertia weight
            
        Returns:
            Optimized task ordering
        """
        c1 = 2.0  # Cognitive parameter
        c2 = 2.0  # Social parameter
        
        for iteration in range(max_iterations):
            # Linearly decrease inertia weight
            w = w_start - (w_start - w_end) * (iteration / max_iterations)
            
            # Update each particle
            for particle in self.swarm:
                particle.update_velocity_and_position(self.global_best_position, w, c1, c2)
                
                # Update global best if needed
                if particle.fitness < self.best_fitness:
                    self.best_fitness = particle.fitness
                    self.global_best_position = particle.best_position.copy()
            
            self.fitness_history.append(self.best_fitness)
            
            # Early stopping if convergence achieved
            if iteration > 20:
                recent_improvement = self.fitness_history[-5] - self.fitness_history[-1]
                if recent_improvement < 0.001:
                    break
        
        # Return ordered tasks
        return [self.tasks[i] for i in self.global_best_position]
    
    def get_schedule_with_times(self) -> List[Dict]:
        """Generate schedule with start and end times"""
        schedule = []
        current_time = self._parse_time(self.work_hours['start'])
        
        for task in [self.tasks[i] for i in self.global_best_position]:
            duration_minutes = task.get('estimatedDuration', 30)
            end_time = current_time + timedelta(minutes=duration_minutes)
            
            schedule.append({
                'title': task['title'],
                'taskId': task['id'],
                'startTime': current_time.strftime('%H:%M'),
                'endTime': end_time.strftime('%H:%M'),
                'duration': duration_minutes,
                'category': task.get('category'),
                'difficulty': task.get('difficulty')
            })
            
            current_time = end_time
            
            # Add break after tasks (unless it's the last one)
            if task != [self.tasks[i] for i in self.global_best_position][-1]:
                current_time += timedelta(minutes=5)  # 5 min break
        
        return schedule
    
    @staticmethod
    def _parse_time(time_str: str) -> datetime:
        """Parse time string HH:MM to datetime"""
        h, m = map(int, time_str.split(':'))
        now = datetime.now()
        return now.replace(hour=h, minute=m, second=0, microsecond=0)
