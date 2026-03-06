from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
from dotenv import load_dotenv
import os
from datetime import datetime, timedelta
from typing import List, Dict, Any

load_dotenv()

app = Flask(__name__)
CORS(app)

# Database Configuration
app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv('DATABASE_URL', 'sqlite:///gsi_planner.db')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
db = SQLAlchemy(app)

# Import models
from models import Task, TimeEntry, UserPreferences, ScheduleRecord

# Import optimization modules
from optimization.pso import ParticleSwarmOptimizer
from optimization.csp import ConstraintSatisfactionSolver
from optimization.ahp import AnalyticHierarchyProcessor
from services.task_analyzer import TaskAnalyzer
from services.behavior_learner import BehaviorLearner

# Initialize services
task_analyzer = TaskAnalyzer()
behavior_learner = BehaviorLearner(db)

# ==================== TASK ENDPOINTS ====================

@app.route('/api/tasks', methods=['GET'])
def get_tasks():
    """Fetch all tasks for the current user"""
    user_id = request.headers.get('User-ID', '1')  # Placeholder auth
    tasks = Task.query.filter_by(user_id=user_id).all()
    return jsonify([task.to_dict() for task in tasks]), 200

@app.route('/api/tasks', methods=['POST'])
def create_task():
    """Create a new task with AI analysis"""
    user_id = request.headers.get('User-ID', '1')
    data = request.get_json()
    
    # Analyze task using NLP
    analysis = task_analyzer.analyze_task(
        title=data.get('title'),
        description=data.get('description'),
        due_date=data.get('dueDate')
    )
    
    task = Task(
        user_id=user_id,
        title=data.get('title'),
        description=data.get('description'),
        due_date=datetime.fromisoformat(data.get('dueDate', datetime.now().isoformat())),
        estimated_duration=analysis['estimated_duration'],
        difficulty=analysis['difficulty'],
        category=analysis['category'],
        priority_score=analysis['priority_score']
    )
    
    db.session.add(task)
    db.session.commit()
    
    return jsonify(task.to_dict()), 201

@app.route('/api/tasks/<task_id>', methods=['PUT'])
def update_task(task_id):
    """Update an existing task"""
    task = Task.query.get(task_id)
    if not task:
        return jsonify({'error': 'Task not found'}), 404
    
    data = request.get_json()
    
    for key, value in data.items():
        if key == 'dueDate':
            setattr(task, 'due_date', datetime.fromisoformat(value))
        elif key in ['title', 'description', 'completed', 'category', 'difficulty']:
            setattr(task, key, value)
    
    db.session.commit()
    return jsonify(task.to_dict()), 200

@app.route('/api/tasks/<task_id>', methods=['DELETE'])
def delete_task(task_id):
    """Delete a task"""
    task = Task.query.get(task_id)
    if not task:
        return jsonify({'error': 'Task not found'}), 404
    
    db.session.delete(task)
    db.session.commit()
    
    return jsonify({'message': 'Task deleted'}), 200

# ==================== SCHEDULE ENDPOINTS ====================

@app.route('/api/schedule/generate', methods=['POST'])
def generate_schedule():
    """Generate optimal schedule using PSO + CSP"""
    user_id = request.headers.get('User-ID', '1')
    data = request.get_json()
    
    tasks = data.get('tasks', [])
    settings = data.get('settings', {})
    
    # Get user preferences
    prefs = UserPreferences.query.filter_by(user_id=user_id).first()
    work_hours = settings.get('workHours', {'start': '09:00', 'end': '18:00'})
    
    # Run PSO to find best task ordering
    pso = ParticleSwarmOptimizer(
        tasks=tasks,
        work_hours=work_hours,
        preferences=prefs.to_dict() if prefs else {}
    )
    best_ordering = pso.optimize()
    
    # Apply CSP to enforce constraints
    csp_solver = ConstraintSatisfactionSolver(
        tasks=best_ordering,
        work_hours=work_hours,
        deadlines={t['id']: t['dueDate'] for t in tasks}
    )
    schedule = csp_solver.solve()
    
    # Store schedule record
    record = ScheduleRecord(
        user_id=user_id,
        schedule_data=schedule,
        generated_at=datetime.utcnow()
    )
    db.session.add(record)
    db.session.commit()
    
    return jsonify({
        'schedule': schedule,
        'generatedAt': datetime.utcnow().isoformat(),
        'algorithm': 'PSO + CSP',
        'optimization_score': pso.best_fitness
    }), 200

@app.route('/api/schedule/validate', methods=['POST'])
def validate_schedule():
    """Validate if a schedule satisfies all constraints"""
    data = request.get_json()
    schedule = data.get('schedule', [])
    
    solver = ConstraintSatisfactionSolver(schedule, {}, {})
    is_valid, violations = solver.validate(schedule)
    
    return jsonify({
        'valid': is_valid,
        'violations': violations
    }), 200

# ==================== PRIORITIES ENDPOINTS ====================

@app.route('/api/priorities/calculate', methods=['POST'])
def calculate_priorities():
    """Calculate task priorities using AHP"""
    data = request.get_json()
    tasks = data.get('tasks', [])
    
    # Use AHP to rank tasks
    ahp = AnalyticHierarchyProcessor()
    ranked_tasks, weights = ahp.calculate_priorities(tasks)
    
    return jsonify({
        'ranked': ranked_tasks,
        'weights': weights,
        'algorithm': 'Analytic Hierarchy Process (AHP)'
    }), 200

@app.route('/api/priorities/top-picks', methods=['GET'])
def get_top_picks():
    """Get AI's top task recommendations for today (smart view)"""
    user_id = request.headers.get('User-ID', '1')
    
    # Get today's incomplete tasks
    today = datetime.utcnow().date()
    tasks = Task.query.filter(
        Task.user_id == user_id,
        Task.due_date >= datetime(today.year, today.month, today.day),
        Task.due_date < datetime(today.year, today.month, today.day) + timedelta(days=1),
        Task.completed == False
    ).all()
    
    # Get user's behavior patterns
    patterns = behavior_learner.get_work_patterns(user_id)
    
    # Re-rank dynamically based on current time
    ahp = AnalyticHierarchyProcessor()
    ranked = ahp.calculate_priorities_dynamic([t.to_dict() for t in tasks], patterns)
    
    return jsonify(ranked), 200

# ==================== TIMESHEET ENDPOINTS ====================

@app.route('/api/timesheet/start', methods=['POST'])
def start_timer():
    """Start tracking time for a task"""
    user_id = request.headers.get('User-ID', '1')
    data = request.get_json()
    task_id = data.get('taskId')
    
    entry = TimeEntry(
        user_id=user_id,
        task_id=task_id,
        start_time=datetime.utcnow()
    )
    
    db.session.add(entry)
    db.session.commit()
    
    return jsonify({
        'entryId': entry.id,
        'taskId': task_id,
        'startTime': entry.start_time.isoformat()
    }), 201

@app.route('/api/timesheet/stop/<entry_id>', methods=['POST'])
def stop_timer(entry_id):
    """Stop tracking time"""
    entry = TimeEntry.query.get(entry_id)
    if not entry:
        return jsonify({'error': 'Entry not found'}), 404
    
    entry.end_time = datetime.utcnow()
    db.session.commit()
    
    # Update task's actual duration
    duration_minutes = (entry.end_time - entry.start_time).total_seconds() / 60
    task = Task.query.get(entry.task_id)
    if task:
        task.actual_duration = duration_minutes
        db.session.commit()
    
    return jsonify({
        'entryId': entry.id,
        'duration': duration_minutes,
        'taskId': entry.task_id
    }), 200

@app.route('/api/timesheet/entries', methods=['GET'])
def get_timesheet_entries():
    """Get all timesheet entries"""
    user_id = request.headers.get('User-ID', '1')
    days = request.args.get('days', 7, type=int)
    
    since = datetime.utcnow() - timedelta(days=days)
    entries = TimeEntry.query.filter(
        TimeEntry.user_id == user_id,
        TimeEntry.start_time >= since
    ).all()
    
    return jsonify([entry.to_dict() for entry in entries]), 200

# ==================== ANALYTICS ENDPOINTS ====================

@app.route('/api/analytics/behavior', methods=['GET'])
def get_behavior_analysis():
    """Get behavior learning insights"""
    user_id = request.headers.get('User-ID', '1')
    
    insights = behavior_learner.analyze_behavior(user_id)
    
    return jsonify({
        'completionRate': insights['completion_rate'],
        'peakHours': insights['peak_productivity_hours'],
        'workPatterns': insights['work_patterns'],
        'timeByDifficulty': insights['time_by_difficulty'],
        'learnings': insights['learnings']
    }), 200

@app.route('/api/analytics/statistics', methods=['GET'])
def get_statistics():
    """Get comprehensive statistics"""
    user_id = request.headers.get('User-ID', '1')
    days = request.args.get('days', 30, type=int)
    
    stats = behavior_learner.get_statistics(user_id, days)
    
    return jsonify(stats), 200

# ==================== SETTINGS ENDPOINTS ====================

@app.route('/api/settings', methods=['GET'])
def get_settings():
    """Get user settings"""
    user_id = request.headers.get('User-ID', '1')
    prefs = UserPreferences.query.filter_by(user_id=user_id).first()
    
    if not prefs:
        prefs = UserPreferences(user_id=user_id)
        db.session.add(prefs)
        db.session.commit()
    
    return jsonify(prefs.to_dict()), 200

@app.route('/api/settings', methods=['PUT'])
def update_settings():
    """Update user settings"""
    user_id = request.headers.get('User-ID', '1')
    data = request.get_json()
    
    prefs = UserPreferences.query.filter_by(user_id=user_id).first()
    if not prefs:
        prefs = UserPreferences(user_id=user_id)
    
    for key, value in data.items():
        if hasattr(prefs, key):
            setattr(prefs, key, value)
    
    db.session.add(prefs)
    db.session.commit()
    
    return jsonify(prefs.to_dict()), 200

# ==================== HEALTH CHECK ====================

@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({'status': 'ok', 'timestamp': datetime.utcnow().isoformat()}), 200

# ==================== ERROR HANDLERS ====================

@app.errorhandler(404)
def not_found(error):
    return jsonify({'error': 'Not found'}), 404

@app.errorhandler(500)
def server_error(error):
    return jsonify({'error': 'Internal server error'}), 500

if __name__ == '__main__':
    with app.app_context():
        db.create_all()
    app.run(debug=True, host='0.0.0.0', port=8000)
