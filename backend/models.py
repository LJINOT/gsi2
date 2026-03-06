from flask_sqlalchemy import SQLAlchemy
from datetime import datetime
from sqlalchemy.dialects.postgresql import JSON
from sqlalchemy import func

db = SQLAlchemy()

class Task(db.Model):
    __tablename__ = 'tasks'
    
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(__import__('uuid').uuid4()))
    user_id = db.Column(db.String(100), nullable=False, index=True)
    title = db.Column(db.String(255), nullable=False)
    description = db.Column(db.Text)
    due_date = db.Column(db.DateTime, nullable=False)
    estimated_duration = db.Column(db.Integer)  # in minutes
    actual_duration = db.Column(db.Integer)
    difficulty = db.Column(db.String(20))  # easy, medium, hard
    category = db.Column(db.String(100))
    priority_score = db.Column(db.Float, default=0.0)
    completed = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    dependencies = db.Column(JSON)  # List of task IDs this depends on
    tags = db.Column(JSON)  # Array of tags
    
    # Relationships
    time_entries = db.relationship('TimeEntry', backref='task', lazy=True, cascade='all, delete-orphan')
    
    def to_dict(self):
        return {
            'id': self.id,
            'userId': self.user_id,
            'title': self.title,
            'description': self.description,
            'dueDate': self.due_date.isoformat(),
            'estimatedDuration': self.estimated_duration,
            'actualDuration': self.actual_duration,
            'difficulty': self.difficulty,
            'category': self.category,
            'priorityScore': self.priority_score,
            'completed': self.completed,
            'createdAt': self.created_at.isoformat(),
            'updatedAt': self.updated_at.isoformat(),
            'dependencies': self.dependencies or [],
            'tags': self.tags or []
        }

class TimeEntry(db.Model):
    __tablename__ = 'time_entries'
    
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(__import__('uuid').uuid4()))
    user_id = db.Column(db.String(100), nullable=False, index=True)
    task_id = db.Column(db.String(36), db.ForeignKey('tasks.id'), nullable=False)
    start_time = db.Column(db.DateTime, nullable=False)
    end_time = db.Column(db.DateTime)
    duration_minutes = db.Column(db.Integer)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    def to_dict(self):
        duration = None
        if self.end_time:
            duration = int((self.end_time - self.start_time).total_seconds() / 60)
        
        return {
            'id': self.id,
            'userId': self.user_id,
            'taskId': self.task_id,
            'startTime': self.start_time.isoformat(),
            'endTime': self.end_time.isoformat() if self.end_time else None,
            'duration': duration,
            'createdAt': self.created_at.isoformat()
        }

class UserPreferences(db.Model):
    __tablename__ = 'user_preferences'
    
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(__import__('uuid').uuid4()))
    user_id = db.Column(db.String(100), unique=True, nullable=False, index=True)
    work_hours_start = db.Column(db.String(5), default='09:00')
    work_hours_end = db.Column(db.String(5), default='18:00')
    theme = db.Column(db.String(20), default='dark')
    notifications_enabled = db.Column(db.Boolean, default=True)
    peak_productivity_hours = db.Column(JSON)
    focus_styles = db.Column(JSON)
    timezone = db.Column(db.String(50), default='UTC')
    break_duration = db.Column(db.Integer, default=15)  # minutes
    min_task_duration = db.Column(db.Integer, default=15)  # minutes
    max_tasks_per_day = db.Column(db.Integer, default=10)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    def to_dict(self):
        return {
            'userId': self.user_id,
            'workHours': {
                'start': self.work_hours_start,
                'end': self.work_hours_end
            },
            'theme': self.theme,
            'notificationsEnabled': self.notifications_enabled,
            'peakProductivityHours': self.peak_productivity_hours or [],
            'focusStyles': self.focus_styles or [],
            'timezone': self.timezone,
            'breakDuration': self.break_duration,
            'minTaskDuration': self.min_task_duration,
            'maxTasksPerDay': self.max_tasks_per_day
        }

class ScheduleRecord(db.Model):
    __tablename__ = 'schedule_records'
    
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(__import__('uuid').uuid4()))
    user_id = db.Column(db.String(100), nullable=False, index=True)
    schedule_data = db.Column(JSON, nullable=False)
    generated_at = db.Column(db.DateTime, default=datetime.utcnow)
    algorithm_version = db.Column(db.String(50), default='1.0')
    optimization_score = db.Column(db.Float)
    
    def to_dict(self):
        return {
            'id': self.id,
            'userId': self.user_id,
            'schedule': self.schedule_data,
            'generatedAt': self.generated_at.isoformat(),
            'algorithmVersion': self.algorithm_version,
            'optimizationScore': self.optimization_score
        }

class BehaviorMetric(db.Model):
    __tablename__ = 'behavior_metrics'
    
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(__import__('uuid').uuid4()))
    user_id = db.Column(db.String(100), nullable=False, index=True)
    metric_type = db.Column(db.String(50), nullable=False)  # completion_rate, avg_duration, etc.
    value = db.Column(db.Float, nullable=False)
    metadata = db.Column(JSON)  # Additional context
    recorded_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    def to_dict(self):
        return {
            'id': self.id,
            'userId': self.user_id,
            'metricType': self.metric_type,
            'value': self.value,
            'metadata': self.metadata,
            'recordedAt': self.recorded_at.isoformat()
        }

class AHPComparisonMatrix(db.Model):
    __tablename__ = 'ahp_comparison_matrices'
    
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(__import__('uuid').uuid4()))
    user_id = db.Column(db.String(100), nullable=False, index=True)
    criteria = db.Column(JSON, nullable=False)  # List of criteria being compared
    matrix = db.Column(JSON, nullable=False)  # The pairwise comparison matrix
    weights = db.Column(JSON)  # Calculated weights from the matrix
    consistency_ratio = db.Column(db.Float)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    def to_dict(self):
        return {
            'id': self.id,
            'userId': self.user_id,
            'criteria': self.criteria,
            'matrix': self.matrix,
            'weights': self.weights,
            'consistencyRatio': self.consistency_ratio,
            'createdAt': self.created_at.isoformat()
        }
