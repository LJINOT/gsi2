from datetime import datetime, timedelta
from typing import Dict, List, Any
import statistics
from collections import defaultdict
import json

class BehaviorLearner:
    """
    Analyzes user behavior over time to improve scheduling and estimates
    """
    
    def __init__(self, db):
        self.db = db
    
    def analyze_behavior(self, user_id: str) -> Dict[str, Any]:
        """
        Analyze user behavior patterns
        """
        from models import Task, TimeEntry
        
        # Get user's tasks and time entries from the past month
        since = datetime.utcnow() - timedelta(days=30)
        
        tasks = Task.query.filter(
            Task.user_id == user_id,
            Task.updated_at >= since
        ).all()
        
        entries = TimeEntry.query.filter(
            TimeEntry.user_id == user_id,
            TimeEntry.start_time >= since
        ).all()
        
        # Calculate metrics
        completion_rate = self._calculate_completion_rate(tasks)
        peak_hours = self._calculate_peak_hours(entries)
        work_patterns = self._analyze_work_patterns(entries, tasks)
        time_by_difficulty = self._analyze_time_by_difficulty(entries, tasks)
        learnings = self._generate_learnings(completion_rate, peak_hours, work_patterns)
        
        return {
            'completion_rate': completion_rate,
            'peak_productivity_hours': peak_hours,
            'work_patterns': work_patterns,
            'time_by_difficulty': time_by_difficulty,
            'learnings': learnings
        }
    
    def _calculate_completion_rate(self, tasks: List) -> float:
        """Calculate task completion rate"""
        if not tasks:
            return 0.0
        
        completed = sum(1 for task in tasks if task.completed)
        return completed / len(tasks)
    
    def _calculate_peak_hours(self, entries: List) -> List[Dict]:
        """
        Identify peak productivity hours by analyzing time entry patterns
        """
        hour_productivity = defaultdict(list)
        
        for entry in entries:
            if entry.start_time and entry.end_time:
                hour = entry.start_time.hour
                
                # Calculate "quality" based on completion
                duration_minutes = (entry.end_time - entry.start_time).total_seconds() / 60
                quality = 1.0 if duration_minutes > 0 else 0.0
                
                hour_productivity[hour].append(quality)
        
        # Calculate average productivity per hour
        peak_hours = []
        for hour in range(24):
            if hour in hour_productivity:
                avg_quality = statistics.mean(hour_productivity[hour])
                peak_hours.append({
                    'hour': hour,
                    'productivity': avg_quality,
                    'timeSlot': f"{hour:02d}:00-{(hour+1):02d}:00"
                })
        
        # Sort by productivity
        peak_hours.sort(key=lambda x: x['productivity'], reverse=True)
        
        return peak_hours[:5] if peak_hours else []
    
    def _analyze_work_patterns(self, entries: List, tasks: List) -> Dict:
        """
        Analyze work patterns (when user tends to work, breaks, etc.)
        """
        if not entries:
            return {}
        
        work_hours = []
        break_durations = []
        
        # Sort entries by time
        sorted_entries = sorted(entries, key=lambda e: e.start_time)
        
        for i, entry in enumerate(sorted_entries):
            work_hours.append(entry.start_time.hour)
            
            # Calculate break duration if available
            if i < len(sorted_entries) - 1:
                next_entry = sorted_entries[i + 1]
                if entry.end_time:
                    break_duration = (next_entry.start_time - entry.end_time).total_seconds() / 60
                    if 0 < break_duration < 120:  # 0-2 hour break
                        break_durations.append(break_duration)
        
        avg_break = statistics.mean(break_durations) if break_durations else 15
        
        return {
            'preferredStartHour': min(work_hours) if work_hours else 9,
            'preferredEndHour': max(work_hours) if work_hours else 17,
            'averageBreakDuration': int(avg_break),
            'mostActiveDay': self._get_most_active_day(entries),
            'sessionCount': len(entries),
            'totalHoursWorked': sum(
                (e.end_time - e.start_time).total_seconds() / 3600 
                for e in entries if e.end_time
            )
        }
    
    def _get_most_active_day(self, entries: List) -> str:
        """Find which day of week user is most active"""
        days = defaultdict(int)
        
        for entry in entries:
            day_name = entry.start_time.strftime('%A')
            days[day_name] += 1
        
        if days:
            return max(days.items(), key=lambda x: x[1])[0]
        return 'Monday'
    
    def _analyze_time_by_difficulty(self, entries: List, tasks: List) -> Dict:
        """
        Analyze actual time spent by task difficulty
        """
        task_map = {task.id: task for task in tasks}
        difficulty_times = defaultdict(list)
        
        for entry in entries:
            if entry.task_id in task_map:
                task = task_map[entry.task_id]
                if entry.end_time:
                    duration = (entry.end_time - entry.start_time).total_seconds() / 60
                    difficulty_times[task.difficulty or 'unknown'].append(duration)
        
        result = {}
        for difficulty, times in difficulty_times.items():
            if times:
                result[difficulty] = {
                    'averageMinutes': int(statistics.mean(times)),
                    'medianMinutes': int(statistics.median(times)),
                    'totalMinutes': int(sum(times)),
                    'taskCount': len(times)
                }
        
        return result
    
    def _generate_learnings(self, completion_rate: float, peak_hours: List, 
                          work_patterns: Dict) -> Dict:
        """
        Generate actionable insights based on behavior analysis
        """
        insights = []
        
        # Completion rate insights
        if completion_rate > 0.8:
            insights.append({
                'type': 'positive',
                'message': f'Excellent completion rate! You\'re finishing {int(completion_rate*100)}% of your tasks.'
            })
        elif completion_rate < 0.5:
            insights.append({
                'type': 'warning',
                'message': f'Your completion rate is {int(completion_rate*100)}%. Try breaking tasks into smaller pieces.'
            })
        
        # Peak hours insights
        if peak_hours:
            best_hour = peak_hours[0]
            insights.append({
                'type': 'tip',
                'message': f'Your peak productivity is around {best_hour["hour"]:02d}:00. Schedule important tasks then.'
            })
        
        # Work pattern insights
        if 'totalHoursWorked' in work_patterns:
            hours = work_patterns['totalHoursWorked']
            if hours < 20:
                insights.append({
                    'type': 'tip',
                    'message': f'You\'re working about {int(hours)} hours/week. Ensure you\'re taking enough breaks!'
                })
            elif hours > 50:
                insights.append({
                    'type': 'warning',
                    'message': 'You\'re working over 50 hours/week. Consider reducing your workload to avoid burnout.'
                })
        
        return {
            'insights': insights,
            'apprenticeLevel': self._calculate_apprentice_level(completion_rate, work_patterns)
        }
    
    def _calculate_apprentice_level(self, completion_rate: float, work_patterns: Dict) -> str:
        """
        Calculate 'Apprentice' AI learning level based on data collected
        """
        score = completion_rate * 0.5
        
        if work_patterns.get('sessionCount', 0) > 30:
            score += 0.3
        elif work_patterns.get('sessionCount', 0) > 10:
            score += 0.2
        else:
            score += 0.1
        
        if score >= 0.7:
            return 'Master'
        elif score >= 0.5:
            return 'Journeyman'
        else:
            return 'Apprentice'
    
    def get_work_patterns(self, user_id: str) -> Dict:
        """Get user's learned work patterns"""
        from models import TimeEntry
        
        since = datetime.utcnow() - timedelta(days=60)
        
        entries = TimeEntry.query.filter(
            TimeEntry.user_id == user_id,
            TimeEntry.start_time >= since
        ).all()
        
        return self._analyze_work_patterns(entries, [])
    
    def get_statistics(self, user_id: str, days: int = 30) -> Dict:
        """Get comprehensive statistics for a user"""
        from models import Task, TimeEntry
        
        since = datetime.utcnow() - timedelta(days=days)
        
        tasks = Task.query.filter(
            Task.user_id == user_id,
            Task.updated_at >= since
        ).all()
        
        entries = TimeEntry.query.filter(
            TimeEntry.user_id == user_id,
            TimeEntry.start_time >= since
        ).all()
        
        # Calculate various statistics
        total_tasks = len(tasks)
        completed_tasks = sum(1 for t in tasks if t.completed)
        
        total_time = sum(
            (e.end_time - e.start_time).total_seconds() / 3600
            for e in entries if e.end_time
        )
        
        estimated_vs_actual = self._compare_estimates(tasks)
        
        return {
            'period': f'Last {days} days',
            'totalTasks': total_tasks,
            'completedTasks': completed_tasks,
            'completionRate': completed_tasks / total_tasks if total_tasks > 0 else 0,
            'totalHoursWorked': round(total_time, 1),
            'averageTimePerTask': round(total_time / len(entries), 2) if entries else 0,
            'estimateAccuracy': estimated_vs_actual,
            'topCategory': self._get_top_category(tasks),
            'averageDifficulty': self._get_average_difficulty(tasks),
        }
    
    def _compare_estimates(self, tasks: List) -> Dict:
        """Compare estimated vs actual duration"""
        differences = []
        
        for task in tasks:
            if task.estimated_duration and task.actual_duration:
                diff = task.actual_duration - task.estimated_duration
                differences.append(diff)
        
        if not differences:
            return {'accuracy': 'unknown'}
        
        avg_diff = statistics.mean(differences)
        
        return {
            'averageDifference': round(avg_diff, 1),
            'tendency': 'underestimate' if avg_diff > 0 else 'overestimate',
            'accuracy': round(1.0 - (abs(avg_diff) / 30), 2)  # Normalize
        }
    
    def _get_top_category(self, tasks: List) -> str:
        """Get most common task category"""
        categories = defaultdict(int)
        for task in tasks:
            if task.category:
                categories[task.category] += 1
        
        return max(categories.items(), key=lambda x: x[1])[0] if categories else 'general'
    
    def _get_average_difficulty(self, tasks: List) -> str:
        """Get average difficulty of tasks"""
        difficulty_scores = {
            'easy': 1,
            'medium': 2,
            'hard': 3
        }
        
        scores = [difficulty_scores.get(t.difficulty, 2) for t in tasks if t.difficulty]
        
        if not scores:
            return 'medium'
        
        avg = statistics.mean(scores)
        
        if avg < 1.5:
            return 'easy'
        elif avg < 2.5:
            return 'medium'
        else:
            return 'hard'
