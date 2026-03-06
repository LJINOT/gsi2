# GSI Schedule Planner

An AI-powered task management and scheduling system that intelligently optimizes your daily workflow using advanced algorithms: **Particle Swarm Optimization (PSO)**, **Constraint Satisfaction Problem (CSP)**, and **Analytic Hierarchy Process (AHP)**.

## 📋 System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    REACT NATIVE FRONTEND                    │
│         (Mobile-first, Real-time UI with Redux)             │
└────────────────────────┬────────────────────────────────────┘
                         │
                         │ REST API
                         │
┌────────────────────────▼────────────────────────────────────┐
│                      FLASK BACKEND                          │
│              (Python, REST endpoints, DB)                   │
└─────────────────────────────────────────────────────────────┘
                         │
        ┌────────────────┼────────────────┐
        │                │                │
        ▼                ▼                ▼
   ┌────────┐      ┌──────────┐     ┌─────────┐
   │  PSO   │      │   CSP    │     │   AHP   │
   │        │      │          │     │         │
   │Ordering│      │Constraint│     │Priority │
   │        │      │Solving   │     │Ranking  │
   └────────┘      └──────────┘     └─────────┘
        │                │                │
        └────────────────┼────────────────┘
                         │
        ┌────────────────┼────────────────┐
        │                │                │
        ▼                ▼                ▼
   ┌──────────┐    ┌──────────┐    ┌──────────┐
   │ Task     │    │Behavior  │    │Timesheet │
   │Analyzer  │    │Learner   │    │Tracker   │
   │(NLP)     │    │(AI)      │    │(Logging) │
   └──────────┘    └──────────┘    └──────────┘
```

## 🎯 Core Algorithms

### 1. Particle Swarm Optimization (PSO)
**Purpose**: Find the optimal task ordering for maximum productivity

- **How it works**: Simulates the social behavior of bird flocking
- **Particles**: Each particle represents a possible task ordering
- **Fitness**: Evaluated based on:
  - Deadline constraints
  - Task difficulty placement (hard tasks early)
  - Category grouping benefits
  - Time efficiency

- **Key Features**:
  - 30 particles by default (configurable)
  - 100 iterations per optimization
  - Inertia weight linearly decreases (0.9 → 0.4)
  - Early stopping when convergence detected

### 2. Constraint Satisfaction Problem (CSP)
**Purpose**: Enforce hard and soft constraints on the schedule

**Hard Constraints** (must satisfy):
- No task overlaps
- Respect work hours (e.g., 9 AM - 6 PM)
- Meet all deadlines
- Respect task dependencies

**Soft Constraints** (optimize for):
- Add breaks between tasks
- Balance difficult/easy tasks throughout day
- Group tasks by category
- Minimize context switching

### 3. Analytic Hierarchy Process (AHP)
**Purpose**: Intelligently rank tasks by priority

**Criteria Weighted**:
- **40% Urgency**: How soon the deadline
- **30% Importance**: Task difficulty/impact
- **15% Duration**: Time required (shorter = better fit)
- **15% Alignment**: Relatedness to other tasks

**Dynamic Re-ranking**:
- Adapts weights based on user's learned preferences
- Updates "Top Picks" throughout the day
- Learns from completion patterns

## 🚀 Getting Started

### Prerequisites
- Node.js 16+ (for React Native)
- Python 3.9+
- PostgreSQL (or SQLite for development)

### Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Copy environment file
cp .env.example .env

# Initialize database
python
>>> from app import app, db
>>> with app.app_context():
>>>     db.create_all()
>>> exit()

# Run server
python app.py
```

Server runs on `http://localhost:8000`

### Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# For Android
react-native run-android

# For iOS
react-native run-ios
```

## 📱 Frontend Structure

### Navigation Hierarchy

```
Dashboard (Home)
├── Management
│   ├── Tasks (List & Search)
│   ├── Add Task (with AI analysis)
│   ├── Calendar (Monthly/Weekly/Daily)
│   └── Schedule (Optimized timeline)
├── Overview (Referential)
│   ├── Priorities (AHP-ranked)
│   ├── Today (Smart "Top Picks")
│   ├── This Week
│   └── Completed Archive
├── Timesheet
│   ├── Time Tracking (Active timers)
│   └── Analytics (Behavior insights)
└── Settings
    ├── General (Hours, theme)
    ├── AI Personalization
    └── Data & Export
```

### Key Screens

**Dashboard**: High-level overview
- Today's smart schedule summary
- Completion metrics
- Next task with timer
- Quick access to optimization

**Tasks**: Full task management
- Searchable, filterable list
- AI auto-extracts duration & difficulty
- Quick completion toggle
- Inline editing

**Schedule**: PSO + CSP optimized timeline
- Generated schedule with start/end times
- Visual conflict detection
- One-click reschedule
- Export to calendar formats

**Priorities**: AHP-based task ranking
- Real-time priority scores
- Breakdown of AHP weights
- Manual override option
- Dynamic re-ranking

**Analytics**: Behavior learning insights
- Completion rate trends
- Peak productivity hours
- Time by difficulty distribution
- Work patterns & streaks
- "Apprentice AI" learning level

## 🧠 Backend Architecture

### Database Models

```python
Task
├── id, user_id, title, description
├── estimated_duration (AI-extracted)
├── actual_duration (tracked)
├── difficulty (easy/medium/hard)
├── category (work/personal/learning/creative/admin)
├── priority_score (AHP-calculated)
├── dependencies (task IDs)
├── tags, completed
└── created_at, updated_at

TimeEntry
├── id, user_id, task_id
├── start_time, end_time
├── duration_minutes
└── created_at

UserPreferences
├── user_id
├── work_hours_start, work_hours_end
├── theme, notifications_enabled
├── peak_productivity_hours (learned)
├── focus_styles (learned)
└── timezone, break_duration, max_tasks_per_day

ScheduleRecord
├── id, user_id
├── schedule_data (JSON array)
├── generated_at
├── algorithm_version, optimization_score
```

### API Endpoints

#### Tasks
- `GET /api/tasks` - Fetch all tasks
- `POST /api/tasks` - Create task (with AI analysis)
- `PUT /api/tasks/<id>` - Update task
- `DELETE /api/tasks/<id>` - Delete task

#### Schedule
- `POST /api/schedule/generate` - Generate optimal schedule (PSO + CSP)
- `POST /api/schedule/validate` - Validate schedule constraints
- `GET /api/schedule/history` - Get previous schedules

#### Priorities
- `POST /api/priorities/calculate` - Calculate AHP priorities
- `GET /api/priorities/top-picks` - Get smart recommendations

#### Timesheet
- `POST /api/timesheet/start` - Start timer
- `POST /api/timesheet/stop/<id>` - Stop timer
- `GET /api/timesheet/entries` - Get time entries
- `GET /api/timesheet/statistics` - Get stats

#### Analytics
- `GET /api/analytics/behavior` - Behavior analysis
- `GET /api/analytics/statistics` - Comprehensive stats

#### Settings
- `GET /api/settings` - Get user settings
- `PUT /api/settings` - Update settings

## 🔧 Configuration

### PSO Parameters
```python
num_particles = 30          # Swarm size
max_iterations = 100        # Optimization iterations
w_start = 0.9              # Initial inertia weight
w_end = 0.4                # Final inertia weight
c1 = 2.0                   # Cognitive parameter
c2 = 2.0                   # Social parameter
```

### AHP Weights (Default)
```python
urgency: 0.40      # Deadline proximity
importance: 0.30   # Difficulty/impact
duration: 0.15     # Time required
alignment: 0.15    # Category grouping
```

### Work Hours
```python
start: 09:00       # Default start
end: 18:00         # Default end
break_duration: 15 # Minutes per break
min_task_duration: 15  # Minimum task length
```

## 📊 Example Workflow

1. **User creates tasks** → Task Analyzer (NLP) extracts:
   - Estimated duration
   - Difficulty level
   - Category
   - Initial priority

2. **User requests optimal schedule** → System runs:
   - PSO: Finds best task ordering
   - CSP: Applies constraints
   - Results: Time-blocked schedule

3. **User tracks time** → Behavior Learner records:
   - Actual duration vs estimate
   - Peak productivity hours
   - Completion patterns
   - Work style preferences

4. **System optimizes over time** → AI learns:
   - More accurate duration estimates
   - Individual productivity patterns
   - Preferred task sequencing
   - Peak hours for deep work

5. **Daily "Top Picks"** → AHP dynamically re-ranks:
   - Based on current time
   - Learned user patterns
   - Real-time deadline changes
   - Energy level patterns

## 🎨 Design Philosophy

- **Dark theme** with indigo/purple accents (#818CF8)
- **Mobile-first** responsive design
- **Real-time feedback** with visual indicators
- **Minimal clicks** to complete tasks
- **Data visualization** for insights
- **Accessible** with clear typography

## 🤖 AI Learning ("Apprentice" AI)

The system learns from user behavior over time:

- **Estimate Accuracy**: Compares estimated vs actual durations
- **Peak Productivity**: Identifies best hours for complex work
- **Completion Patterns**: Learns what makes tasks more likely to complete
- **Difficulty Assessment**: Improves AI's task difficulty estimation
- **Category Patterns**: Recognizes user's work/personal balance
- **Apprentice Level**: Scores the AI's confidence (Apprentice → Journeyman → Master)

## 🔐 Security Considerations

- Implement JWT authentication
- Hash sensitive data
- Rate limit API endpoints
- Validate all user inputs
- Use HTTPS in production
- Implement CORS properly

## 📈 Performance Optimization

- Debounce schedule generation (avoid excessive recalculation)
- Cache calculated priorities
- Batch update operations
- Lazy load calendar months
- Compress schedule data for storage

## 🧪 Testing

```bash
# Backend tests
pytest tests/

# Frontend tests
npm test

# Integration tests
npm run test:integration
```

## 🚀 Deployment

### Backend (Flask)
```bash
# Using Gunicorn
gunicorn -w 4 -b 0.0.0.0:8000 app:app
```

### Frontend (React Native)
- Build APK: `react-native run-android --variant=release`
- Build IPA: `react-native run-ios --configuration=Release`

## 📚 References

- **PSO**: [Particle Swarm Optimization by Kennedy & Eberhart]
- **CSP**: [Constraint Satisfaction Problem Theory]
- **AHP**: [Analytic Hierarchy Process by Thomas Saaty]
- **NLP**: Task analysis using keyword extraction

## 📝 License

MIT License - See LICENSE.txt for details

## 🤝 Contributing

Contributions welcome! Please follow these guidelines:
1. Fork the repository
2. Create a feature branch
3. Commit with clear messages
4. Push and create a Pull Request

## 💬 Support

For issues, questions, or suggestions:
- Open an GitHub issue
- Check existing documentation
- Review the architecture diagrams above

---

**GSI Schedule Planner** - Because your time is your most valuable resource ⏰
