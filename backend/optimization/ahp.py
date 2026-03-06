import numpy as np
from typing import List, Dict, Tuple
from datetime import datetime, timedelta
import math

class AnalyticHierarchyProcessor:
    """
    Implements Analytic Hierarchy Process (AHP) for multi-criteria task prioritization.
    
    Criteria considered:
    - Urgency (deadline proximity)
    - Importance (difficulty/impact)
    - Duration (time required)
    - Category alignment (related to other tasks)
    """
    
    # Saaty's scale for pairwise comparisons
    SCALE = {
        1: 'Equal importance',
        3: 'Weak importance',
        5: 'Strong importance',
        7: 'Very strong importance',
        9: 'Absolute importance'
    }
    
    def __init__(self):
        self.criteria = ['urgency', 'importance', 'duration', 'alignment']
        self.weights = {}
        
    def calculate_priorities(self, tasks: List[Dict]) -> Tuple[List[Dict], Dict]:
        """
        Calculate priority scores for all tasks using AHP
        
        Returns:
            (ranked_tasks, criteria_weights)
        """
        if not tasks:
            return [], {}
        
        # Normalize task criteria values
        normalized_tasks = self._normalize_criteria(tasks)
        
        # Build pairwise comparison matrix for criteria
        criteria_weights = self._get_default_criteria_weights()
        
        # Calculate priority score for each task
        ranked_tasks = []
        for task in normalized_tasks:
            priority_score = self._calculate_task_priority(task, criteria_weights)
            
            ranked_tasks.append({
                'id': task['id'],
                'title': task['title'],
                'priority': priority_score,
                'scores': {
                    'urgency': task.get('urgency_score', 0),
                    'importance': task.get('importance_score', 0),
                    'duration': task.get('duration_score', 0),
                    'alignment': task.get('alignment_score', 0)
                }
            })
        
        # Sort by priority score (descending)
        ranked_tasks.sort(key=lambda x: x['priority'], reverse=True)
        
        return ranked_tasks, criteria_weights
    
    def _normalize_criteria(self, tasks: List[Dict]) -> List[Dict]:
        """Normalize all criteria to 0-1 scale"""
        normalized = []
        
        # Extract raw values
        urgencies = []
        durations = []
        difficulties = []
        
        for task in tasks:
            due_date = task.get('dueDate')
            if due_date:
                if isinstance(due_date, str):
                    due_date = datetime.fromisoformat(due_date)
                urgency = max(0, (due_date - datetime.now()).total_seconds() / 86400)
                urgencies.append(urgency)
            
            duration = task.get('estimatedDuration', 30)
            durations.append(duration)
            
            difficulty = task.get('difficulty', 'medium')
            difficulties.append(self._difficulty_to_score(difficulty))
        
        # Normalize values to 0-1 range
        for task in tasks:
            # Urgency: tasks due soon get higher score
            due_date = task.get('dueDate')
            if due_date and urgencies:
                if isinstance(due_date, str):
                    due_date = datetime.fromisoformat(due_date)
                days_until_due = max(0, (due_date - datetime.now()).total_seconds() / 86400)
                max_urgency = max(urgencies) if urgencies else 1
                urgency_score = 1.0 - (days_until_due / max(max_urgency, 1))
            else:
                urgency_score = 0.5
            
            # Importance: based on difficulty
            difficulty = task.get('difficulty', 'medium')
            importance_score = self._difficulty_to_score(difficulty)
            
            # Duration: shorter tasks get slightly higher priority (easier to fit in)
            duration = task.get('estimatedDuration', 30)
            max_duration = max(durations) if durations else 60
            duration_score = 1.0 - (duration / max(max_duration, 1))
            
            # Alignment: how related to other tasks (simplified)
            alignment_score = self._calculate_category_alignment(task, tasks)
            
            normalized.append({
                **task,
                'urgency_score': min(1.0, max(0.0, urgency_score)),
                'importance_score': min(1.0, max(0.0, importance_score)),
                'duration_score': min(1.0, max(0.0, duration_score)),
                'alignment_score': min(1.0, max(0.0, alignment_score))
            })
        
        return normalized
    
    def _difficulty_to_score(self, difficulty: str) -> float:
        """Convert difficulty string to numeric score"""
        difficulty_map = {
            'easy': 0.3,
            'medium': 0.6,
            'hard': 1.0
        }
        return difficulty_map.get(difficulty.lower(), 0.5)
    
    def _calculate_category_alignment(self, task: Dict, all_tasks: List[Dict]) -> float:
        """
        Calculate how well-aligned a task is with other tasks.
        Tasks in the same category as other tasks get higher scores.
        """
        if 'category' not in task:
            return 0.0
        
        category_count = sum(1 for t in all_tasks if t.get('category') == task.get('category'))
        return min(0.8, category_count * 0.2)  # Max 0.8 to avoid over-weighting
    
    def _get_default_criteria_weights(self) -> Dict[str, float]:
        """
        Default criteria weights for AHP.
        These can be customized based on user preferences or learned over time.
        """
        return {
            'urgency': 0.40,      # 40% - deadline proximity
            'importance': 0.30,   # 30% - difficulty/impact
            'duration': 0.15,     # 15% - time efficiency
            'alignment': 0.15     # 15% - category grouping
        }
    
    def _calculate_task_priority(self, task: Dict, criteria_weights: Dict[str, float]) -> float:
        """
        Calculate final priority score using weighted sum of criteria
        """
        priority = (
            task.get('urgency_score', 0) * criteria_weights['urgency'] +
            task.get('importance_score', 0) * criteria_weights['importance'] +
            task.get('duration_score', 0) * criteria_weights['duration'] +
            task.get('alignment_score', 0) * criteria_weights['alignment']
        )
        
        return priority
    
    def calculate_priorities_dynamic(self, tasks: List[Dict], patterns: Dict) -> List[Dict]:
        """
        Calculate priorities dynamically based on learned user patterns
        """
        # Adjust weights based on patterns
        adjusted_weights = self._adjust_weights_by_patterns(patterns)
        
        # Recalculate with adjusted weights
        normalized_tasks = self._normalize_criteria(tasks)
        
        ranked_tasks = []
        for task in normalized_tasks:
            priority_score = self._calculate_task_priority(task, adjusted_weights)
            
            ranked_tasks.append({
                'id': task['id'],
                'title': task['title'],
                'priority': priority_score,
                'urgency': task.get('dueDate'),
            })
        
        ranked_tasks.sort(key=lambda x: x['priority'], reverse=True)
        return ranked_tasks
    
    def _adjust_weights_by_patterns(self, patterns: Dict) -> Dict[str, float]:
        """
        Adjust criteria weights based on learned user behavior patterns
        """
        weights = self._get_default_criteria_weights()
        
        # If user typically completes urgent tasks first
        if patterns.get('urgent_first_preference', False):
            weights['urgency'] = 0.50
            weights['importance'] = 0.25
        
        # If user prefers longer tasks early
        if patterns.get('long_tasks_early', False):
            weights['duration'] = 0.25
        
        # Normalize weights to sum to 1.0
        total = sum(weights.values())
        return {k: v / total for k, v in weights.items()}
    
    def build_comparison_matrix(self, criteria: List[str]) -> np.ndarray:
        """
        Build a pairwise comparison matrix for criteria.
        For now, uses default comparisons.
        """
        n = len(criteria)
        matrix = np.ones((n, n))
        
        # Define relative importances
        # These should ideally come from user preferences or learning
        comparisons = {
            ('urgency', 'importance'): 1.3,
            ('urgency', 'duration'): 2.5,
            ('urgency', 'alignment'): 2.5,
            ('importance', 'duration'): 2.0,
            ('importance', 'alignment'): 2.0,
            ('duration', 'alignment'): 1.0,
        }
        
        for i, crit1 in enumerate(criteria):
            for j, crit2 in enumerate(criteria):
                if i != j:
                    key = (crit1, crit2)
                    reverse_key = (crit2, crit1)
                    
                    if key in comparisons:
                        matrix[i][j] = comparisons[key]
                    elif reverse_key in comparisons:
                        matrix[i][j] = 1.0 / comparisons[reverse_key]
        
        return matrix
    
    def calculate_consistency_ratio(self, matrix: np.ndarray) -> float:
        """
        Calculate the Consistency Ratio (CR) of a pairwise comparison matrix.
        CR < 0.1 indicates acceptable consistency.
        """
        n = len(matrix)
        
        # Calculate eigenvalue
        eigenvalues = np.linalg.eigvals(matrix)
        lambda_max = np.max(np.real(eigenvalues))
        
        # Calculate Consistency Index
        ci = (lambda_max - n) / (n - 1) if n > 1 else 0
        
        # Random Index (from Saaty's table)
        ri_table = {
            1: 0, 2: 0, 3: 0.58, 4: 0.90, 5: 1.12,
            6: 1.24, 7: 1.32, 8: 1.41, 9: 1.45, 10: 1.49
        }
        
        ri = ri_table.get(n, 1.49)
        cr = ci / ri if ri > 0 else 0
        
        return cr
