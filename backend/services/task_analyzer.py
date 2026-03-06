import re
from datetime import datetime, timedelta
from typing import Dict, List
import json

class TaskAnalyzer:
    """
    Analyzes tasks using NLP to extract duration, difficulty, and category
    """
    
    # Keywords for difficulty classification
    DIFFICULTY_KEYWORDS = {
        'easy': [
            'simple', 'quick', 'easy', 'straightforward', 'basic',
            'minor', 'small', 'trivial', 'routine', 'simple fix'
        ],
        'medium': [
            'normal', 'moderate', 'standard', 'typical', 'regular',
            'implement', 'develop', 'create', 'configure'
        ],
        'hard': [
            'complex', 'difficult', 'challenging', 'advanced', 'tricky',
            'research', 'investigate', 'analyze', 'optimize', 'redesign',
            'refactor', 'architect', 'framework', 'algorithm', 'critical'
        ]
    }
    
    # Keywords for category classification
    CATEGORY_KEYWORDS = {
        'work': [
            'meeting', 'email', 'project', 'task', 'report', 'presentation',
            'deadline', 'deliverable', 'sprint', 'review', 'code', 'develop'
        ],
        'personal': [
            'personal', 'family', 'home', 'household', 'errands', 'shopping',
            'health', 'appointment', 'doctor', 'dentist', 'car', 'maintenance'
        ],
        'learning': [
            'learn', 'study', 'course', 'tutorial', 'research', 'read',
            'explore', 'training', 'skill', 'language', 'certification'
        ],
        'creative': [
            'design', 'write', 'art', 'music', 'creative', 'brainstorm',
            'sketch', 'draft', 'content', 'blog', 'post'
        ],
        'admin': [
            'admin', 'organize', 'file', 'sort', 'clean', 'organize',
            'document', 'backup', 'update', 'archive', 'data entry'
        ]
    }
    
    # Duration patterns (regex)
    DURATION_PATTERNS = [
        (r'(\d+)\s*(?:hours?|hrs?)', lambda m: int(m.group(1)) * 60),
        (r'(\d+)\s*(?:minutes?|mins?)', lambda m: int(m.group(1))),
        (r'(\d+)\s*(?:hours?|hrs?)\s*(\d+)\s*(?:minutes?|mins?)', 
         lambda m: int(m.group(1)) * 60 + int(m.group(2))),
    ]
    
    def __init__(self):
        self.default_duration = 30  # minutes
        
    def analyze_task(self, title: str, description: str = '', due_date: str = None) -> Dict:
        """
        Analyze a task and extract key attributes
        
        Returns:
            {
                'estimated_duration': int (minutes),
                'difficulty': str ('easy', 'medium', 'hard'),
                'category': str,
                'priority_score': float (0-1)
            }
        """
        
        # Combine title and description for analysis
        text = f"{title} {description}".lower()
        
        # Extract duration
        estimated_duration = self._extract_duration(text)
        
        # Classify difficulty
        difficulty = self._classify_difficulty(text)
        
        # Classify category
        category = self._classify_category(text)
        
        # Calculate priority score
        priority_score = self._calculate_priority(
            due_date=due_date,
            difficulty=difficulty,
            category=category
        )
        
        return {
            'estimated_duration': estimated_duration,
            'difficulty': difficulty,
            'category': category,
            'priority_score': priority_score
        }
    
    def _extract_duration(self, text: str) -> int:
        """Extract estimated duration from text"""
        
        for pattern, converter in self.DURATION_PATTERNS:
            match = re.search(pattern, text)
            if match:
                return converter(match)
        
        # Estimate based on difficulty
        if 'quick' in text or 'small' in text:
            return 15
        elif 'complex' in text or 'research' in text:
            return 120
        
        return self.default_duration
    
    def _classify_difficulty(self, text: str) -> str:
        """Classify task difficulty based on keywords"""
        
        scores = {'easy': 0, 'medium': 0, 'hard': 0}
        
        for difficulty, keywords in self.DIFFICULTY_KEYWORDS.items():
            for keyword in keywords:
                if keyword in text:
                    scores[difficulty] += 1
        
        # If no keywords match, return medium
        if sum(scores.values()) == 0:
            return 'medium'
        
        # Return the difficulty with highest score
        return max(scores.items(), key=lambda x: x[1])[0]
    
    def _classify_category(self, text: str) -> str:
        """Classify task category based on keywords"""
        
        scores = {cat: 0 for cat in self.CATEGORY_KEYWORDS}
        
        for category, keywords in self.CATEGORY_KEYWORDS.items():
            for keyword in keywords:
                if keyword in text:
                    scores[category] += 1
        
        # Return the category with highest score, or 'general' if tie
        max_score = max(scores.values()) if scores else 0
        
        if max_score == 0:
            return 'general'
        
        return max(scores.items(), key=lambda x: x[1])[0]
    
    def _calculate_priority(self, due_date: str = None, 
                          difficulty: str = 'medium',
                          category: str = 'general') -> float:
        """Calculate initial priority score"""
        
        priority = 0.5  # Base score
        
        # Boost for difficulty
        if difficulty == 'hard':
            priority += 0.2
        elif difficulty == 'easy':
            priority -= 0.1
        
        # Boost for upcoming deadlines
        if due_date:
            try:
                due = datetime.fromisoformat(due_date)
                days_until = (due - datetime.now()).days
                
                if days_until <= 1:
                    priority += 0.3
                elif days_until <= 3:
                    priority += 0.2
                elif days_until <= 7:
                    priority += 0.1
            except:
                pass
        
        # Boost for work category (usually higher priority)
        if category == 'work':
            priority += 0.1
        elif category == 'personal':
            priority -= 0.05
        
        return min(1.0, max(0.0, priority))
    
    def analyze_batch(self, tasks: List[Dict]) -> List[Dict]:
        """Analyze multiple tasks"""
        results = []
        for task in tasks:
            analysis = self.analyze_task(
                title=task.get('title', ''),
                description=task.get('description', ''),
                due_date=task.get('dueDate')
            )
            results.append({
                **task,
                **analysis
            })
        
        return results
    
    def extract_dependencies(self, text: str, all_tasks: List[str]) -> List[str]:
        """
        Extract task dependencies from description text.
        Looks for patterns like "after X", "depends on X", "following X"
        """
        dependencies = []
        text_lower = text.lower()
        
        dependency_keywords = [
            'after', 'depends on', 'following', 'once', 'when',
            'requires', 'needs', 'blocked by'
        ]
        
        for task_name in all_tasks:
            for keyword in dependency_keywords:
                pattern = f"{keyword}.*{task_name}"
                if re.search(pattern, text_lower):
                    dependencies.append(task_name)
                    break
        
        return list(set(dependencies))
    
    def extract_subtasks(self, description: str) -> List[str]:
        """
        Extract subtasks from description.
        Looks for numbered lists, bullet points, etc.
        """
        subtasks = []
        
        # Match numbered items (1. 2. etc)
        numbered = re.findall(r'^\s*\d+\.\s*(.+)$', description, re.MULTILINE)
        subtasks.extend(numbered)
        
        # Match bullet points
        bulleted = re.findall(r'^\s*[-•]\s*(.+)$', description, re.MULTILINE)
        subtasks.extend(bulleted)
        
        return subtasks
    
    def calculate_realistic_duration(self, original_estimate: int, 
                                    difficulty: str = 'medium') -> int:
        """
        Apply Hofstadter's Law adjustment to duration estimates
        (it always takes longer than expected)
        """
        
        # Buffer multipliers by difficulty
        buffers = {
            'easy': 1.2,
            'medium': 1.5,
            'hard': 2.0
        }
        
        buffer = buffers.get(difficulty, 1.5)
        return int(original_estimate * buffer)
