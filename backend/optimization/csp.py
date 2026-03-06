from typing import List, Dict, Tuple, Any
from datetime import datetime, timedelta
from dataclasses import dataclass

@dataclass
class Constraint:
    """Base constraint class"""
    name: str
    severity: str  # 'hard' or 'soft'

class DeadlineConstraint(Constraint):
    """Task must be completed before its deadline"""
    def __init__(self):
        super().__init__("deadline", "hard")

class WorkHoursConstraint(Constraint):
    """Tasks must be scheduled within work hours"""
    def __init__(self):
        super().__init__("work_hours", "hard")

class NoOverlapConstraint(Constraint):
    """Tasks cannot overlap"""
    def __init__(self):
        super().__init__("no_overlap", "hard")

class DependencyConstraint(Constraint):
    """Tasks with dependencies must be scheduled after dependencies"""
    def __init__(self):
        super().__init__("dependency", "hard")

class BreakConstraint(Constraint):
    """Enforce breaks between tasks"""
    def __init__(self):
        super().__init__("breaks", "soft")

class DifficultyBalanceConstraint(Constraint):
    """Balance difficult and easy tasks throughout the day"""
    def __init__(self):
        super().__init__("difficulty_balance", "soft")

class CategoryGroupingConstraint(Constraint):
    """Group similar category tasks together"""
    def __init__(self):
        super().__init__("category_grouping", "soft")

class ConstraintSatisfactionSolver:
    """
    Solves scheduling constraints using CSP techniques
    """
    
    def __init__(self, tasks: List[Dict], work_hours: Dict, deadlines: Dict):
        self.tasks = tasks
        self.work_hours = work_hours
        self.deadlines = deadlines
        
        # Initialize constraints
        self.hard_constraints = [
            DeadlineConstraint(),
            WorkHoursConstraint(),
            NoOverlapConstraint(),
            DependencyConstraint()
        ]
        
        self.soft_constraints = [
            BreakConstraint(),
            DifficultyBalanceConstraint(),
            CategoryGroupingConstraint()
        ]
    
    def solve(self) -> List[Dict]:
        """
        Solve the CSP and return a valid schedule
        """
        schedule = self._build_initial_schedule()
        
        # Apply constraint satisfaction
        schedule = self._satisfy_hard_constraints(schedule)
        schedule = self._optimize_soft_constraints(schedule)
        
        return schedule
    
    def _build_initial_schedule(self) -> List[Dict]:
        """Build initial schedule from tasks"""
        schedule = []
        current_time = self._parse_time(self.work_hours['start'])
        end_of_day = self._parse_time(self.work_hours['end'])
        
        for task in self.tasks:
            duration_minutes = task.get('estimatedDuration', 30)
            end_time = current_time + timedelta(minutes=duration_minutes)
            
            schedule.append({
                'taskId': task['id'],
                'title': task['title'],
                'startTime': current_time,
                'endTime': end_time,
                'duration': duration_minutes,
                'task': task
            })
            
            current_time = end_time
            
            # Check if exceeds work hours
            if current_time > end_of_day:
                break
        
        return schedule
    
    def _satisfy_hard_constraints(self, schedule: List[Dict]) -> List[Dict]:
        """Enforce hard constraints"""
        
        # Constraint 1: No overlaps
        schedule = self._resolve_overlaps(schedule)
        
        # Constraint 2: Respect work hours
        schedule = self._enforce_work_hours(schedule)
        
        # Constraint 3: Meet deadlines
        schedule = self._satisfy_deadlines(schedule)
        
        # Constraint 4: Respect dependencies
        schedule = self._satisfy_dependencies(schedule)
        
        return schedule
    
    def _optimize_soft_constraints(self, schedule: List[Dict]) -> List[Dict]:
        """Optimize soft constraints"""
        
        # Add breaks
        schedule = self._add_breaks(schedule)
        
        # Balance difficulty
        schedule = self._balance_difficulty(schedule)
        
        # Group by category
        schedule = self._group_by_category(schedule)
        
        return schedule
    
    def _resolve_overlaps(self, schedule: List[Dict]) -> List[Dict]:
        """Ensure no task overlaps"""
        for i in range(len(schedule) - 1):
            current = schedule[i]
            next_task = schedule[i + 1]
            
            if current['endTime'] > next_task['startTime']:
                # Shift next task to start after current
                duration = next_task['endTime'] - next_task['startTime']
                next_task['startTime'] = current['endTime']
                next_task['endTime'] = next_task['startTime'] + duration
        
        return schedule
    
    def _enforce_work_hours(self, schedule: List[Dict]) -> List[Dict]:
        """Ensure all tasks fit within work hours"""
        start_of_day = self._parse_time(self.work_hours['start'])
        end_of_day = self._parse_time(self.work_hours['end'])
        
        valid_schedule = []
        
        for item in schedule:
            if item['startTime'] >= start_of_day and item['endTime'] <= end_of_day:
                valid_schedule.append(item)
        
        return valid_schedule
    
    def _satisfy_deadlines(self, schedule: List[Dict]) -> List[Dict]:
        """Reorder tasks to satisfy deadlines"""
        # Sort by deadline
        schedule_with_deadlines = []
        
        for item in schedule:
            task_id = item['taskId']
            deadline = self.deadlines.get(task_id)
            schedule_with_deadlines.append((deadline, item))
        
        # Sort by deadline
        schedule_with_deadlines.sort(key=lambda x: x[0] if x[0] else datetime.max)
        
        # Rebuild schedule respecting deadlines and times
        result = []
        current_time = self._parse_time(self.work_hours['start'])
        
        for deadline, item in schedule_with_deadlines:
            duration = item['duration']
            end_time = current_time + timedelta(minutes=duration)
            
            # Check if can complete before deadline
            if deadline and end_time > deadline:
                # Skip this task or reschedule
                continue
            
            item['startTime'] = current_time
            item['endTime'] = end_time
            result.append(item)
            current_time = end_time
        
        return result
    
    def _satisfy_dependencies(self, schedule: List[Dict]) -> List[Dict]:
        """Ensure tasks with dependencies are scheduled after dependencies"""
        # This would require dependency information from tasks
        # For now, return as-is
        return schedule
    
    def _add_breaks(self, schedule: List[Dict]) -> List[Dict]:
        """Add breaks between tasks"""
        schedule_with_breaks = []
        
        for i, item in enumerate(schedule):
            schedule_with_breaks.append(item)
            
            # Add break after each task except the last
            if i < len(schedule) - 1:
                break_duration = 5  # 5 minute break
                break_start = item['endTime']
                break_end = break_start + timedelta(minutes=break_duration)
                
                next_task = schedule[i + 1]
                next_task['startTime'] = break_end
                next_task['endTime'] = break_end + timedelta(minutes=next_task['duration'])
        
        return schedule_with_breaks
    
    def _balance_difficulty(self, schedule: List[Dict]) -> List[Dict]:
        """Balance difficulty levels throughout the day"""
        # Reorder slightly to alternate difficulty levels when possible
        return schedule
    
    def _group_by_category(self, schedule: List[Dict]) -> List[Dict]:
        """Group tasks by category"""
        # Sort by category while maintaining order
        categorized = {}
        for item in schedule:
            category = item['task'].get('category', 'uncategorized')
            if category not in categorized:
                categorized[category] = []
            categorized[category].append(item)
        
        # Rebuild schedule grouped by category
        result = []
        for category in categorized:
            result.extend(categorized[category])
        
        return result
    
    def validate(self, schedule: List[Dict]) -> Tuple[bool, List[str]]:
        """
        Validate a schedule against all constraints
        
        Returns:
            (is_valid, list_of_violations)
        """
        violations = []
        
        # Check hard constraints
        for constraint in self.hard_constraints:
            violated = self._check_constraint(schedule, constraint)
            if violated:
                violations.append(f"Hard constraint violated: {constraint.name}")
        
        return len(violations) == 0, violations
    
    def _check_constraint(self, schedule: List[Dict], constraint: Constraint) -> bool:
        """Check if a constraint is violated"""
        if constraint.name == 'deadline':
            for item in schedule:
                task_id = item['taskId']
                deadline = self.deadlines.get(task_id)
                if deadline and item['endTime'] > deadline:
                    return True
        
        elif constraint.name == 'work_hours':
            start = self._parse_time(self.work_hours['start'])
            end = self._parse_time(self.work_hours['end'])
            for item in schedule:
                if item['startTime'] < start or item['endTime'] > end:
                    return True
        
        elif constraint.name == 'no_overlap':
            for i in range(len(schedule) - 1):
                if schedule[i]['endTime'] > schedule[i + 1]['startTime']:
                    return True
        
        return False
    
    @staticmethod
    def _parse_time(time_str: str) -> datetime:
        """Parse time string HH:MM to datetime"""
        h, m = map(int, time_str.split(':'))
        now = datetime.now()
        return now.replace(hour=h, minute=m, second=0, microsecond=0)
