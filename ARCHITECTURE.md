# GSI Planner - Architecture & Design Document

## System Overview

GSI Schedule Planner is a full-stack web application that uses advanced optimization algorithms to create intelligent daily schedules and learn from user behavior patterns.

### Key Innovation: Algorithm Stack

1. **AHP (Analytic Hierarchy Process)** - Calculates task priorities
2. **PSO (Particle Swarm Optimization)** - Optimizes task ordering
3. **CSP (Constraint Satisfaction Problem)** - Validates feasibility
4. **NLP (Natural Language Processing)** - Analyzes task descriptions
5. **ML (Machine Learning)** - Learns user patterns over time

## Technology Stack

### Frontend (React + TypeScript)
- **Vite**: Ultra-fast dev server and build tool
- **React 18**: With hooks for functional components
- **React Router**: SPA routing
- **Zustand**: Lightweight state management
- **TanStack Query**: Server state synchronization
- **FullCalendar**: Calendar integration
- **Recharts**: Charts and analytics visualization
- **Tailwind CSS**: Utility-first styling
- **shadcn/ui**: Accessible component library (Radix UI)

### Backend (Cloudflare Edge)
- **Hono**: Lightweight, TypeScript-first routing framework
- **Cloudflare Workers**: Serverless edge computing
- **Cloudflare D1**: SQLite database at the edge
- **Drizzle ORM**: Type-safe database access
- **Zod**: Runtime validation and TypeScript inference

### Deployment
- **Cloudflare Pages**: Frontend hosting
- **Cloudflare Workers**: Backend compute
- **Cloudflare D1**: Database
- **Cloudflare R2**: Optional file storage

## Architecture Layers

### 1. Presentation Layer (Frontend)

**Components:**
- Pages: Dashboard, Tasks, Calendar, Schedule, Analytics, Settings
- Components: TaskForm, TaskCard, ScheduleBlock, Charts
- Layouts: Sidebar navigation, header, main content

**State Management:**
```
Tasks Store (Zustand)
  ├─ tasks: Task[]
  ├─ selectedTask: Task | null
  └─ actions: add, update, delete

Schedule Store
  ├─ schedule: DailySchedule | null
  ├─ loadingSchedule: boolean
  └─ actions: generate, fetch

User Store
  ├─ settings: UserSettings
  ├─ theme: 'light' | 'dark'
  └─ actions: updateSettings

Analytics Store
  ├─ stats: ProductivityStats
  ├─ insights: LearningInsights
  └─ actions: loadStats, loadInsights
```

**Data Flow:**
```
UI Components
    ↓
React Hooks (useTasksStore, useQuery)
    ↓
Zustand Store / TanStack Query Cache
    ↓
API Services (TaskService, ScheduleService)
    ↓
HTTP Requests (Fetch API)
    ↓
Backend API
```

### 2. API Layer (Backend)

**Route Groups:**
```
/api/tasks
  GET    /          → List tasks
  POST   /          → Create task
  GET    /:id       → Get task
  PATCH  /:id       → Update task
  DELETE /:id       → Delete task

/api/schedule
  POST   /generate  → Generate optimized schedule
  GET    /:date     → Get stored schedule
  GET    /week/:date → Get week of schedules

/api/analytics
  GET    /stats     → Productivity statistics
  GET    /insights  → Learning insights
  POST   /log-completion → Log completed task
  GET    /completion-logs → Get completion history

/api/settings
  GET    /          → Get user settings
  PATCH  /          → Update settings
  GET    /theme     → Get theme preference
  GET    /work-hours → Get work hours
```

**Request/Response Pattern:**
```typescript
// Request
{
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "X-User-ID": "user-123"  // User identification
  },
  body: JSON.stringify(payload)
}

// Response
{
  success: boolean,
  data: T | undefined,
  error: string | undefined,
  timestamp: ISO8601
}
```

### 3. Optimization Layer (Backend)

**Algorithm Execution Flow for Schedule Generation:**

```
1. Fetch User Tasks
   └─ Filter: pending tasks due today

2. Calculate Priorities (AHP)
   ├─ For each task calculate:
   │  ├─ Deadline urgency (0-1)
   │  ├─ Importance score (0-1)
   │  ├─ Dependency weight (0-1)
   │  └─ Complexity score (0-1)
   └─ Result: Priority weights (0-100)

3. Fetch Learning Insights
   ├─ Analyze completion logs
   └─ Extract:
      ├─ Peak productivity hours
      ├─ Focus styles
      ├─ Estimate accuracy
      ├─ Difficulty corrections
      └─ Category patterns

4. Optimize Schedule (PSO)
   ├─ Initialize particle swarm
   ├─ For N iterations:
   │  ├─ Calculate fitness (idle time, peak hours)
   │  ├─ Update velocities
   │  └─ Update positions
   └─ Return best task ordering

5. Validate & Build Schedule (CSP)
   ├─ Allocate time slots for each task
   ├─ Check constraints:
   │  ├─ No overlaps
   │  ├─ Respect deadlines
   │  ├─ Work hours only
   │  └─ Dependencies satisfied
   └─ Backtrack if constraint violated

6. Calculate Quality Score
   ├─ Task coverage percentage
   ├─ Utilization rate
   └─ Score: 0.0-1.0

7. Store & Return Schedule
   └─ Save to D1 for quick retrieval
```

### 4. Data Layer (Database)

**Schema:**
```sql
-- Users
users
  ├─ id: UUID
  ├─ email: String
  ├─ created_at
  └─ updated_at

-- Task Management
tasks
  ├─ id: UUID
  ├─ user_id: FK
  ├─ title, description
  ├─ due_date
  ├─ estimated_duration: int (minutes)
  ├─ difficulty: enum(easy, medium, hard)
  ├─ category: String
  ├─ priority: float(0-100)
  ├─ status: enum(pending, in_progress, completed)
  ├─ created_at, updated_at, completed_at

task_dependencies
  ├─ task_id: FK
  └─ depends_on_task_id: FK

-- Settings & Preferences
user_settings
  ├─ id: UUID
  ├─ user_id: FK
  ├─ work_start_hour: int(0-23)
  ├─ work_end_hour: int(0-23)
  ├─ theme: enum(light, dark)
  ├─ notifications_enabled: bool
  └─ week_starts_on: enum(sunday, monday)

-- Learning & Analytics
completion_logs
  ├─ id: UUID
  ├─ user_id: FK
  ├─ task_id: FK
  ├─ completed_at: DateTime
  ├─ actual_duration: int
  ├─ estimated_duration: int
  └─ difficulty: String

stored_schedules
  ├─ id: UUID
  ├─ user_id: FK
  ├─ date: Date
  ├─ schedule_data: JSON
  ├─ optimization_score: float(0-1)
  └─ created_at

calendar_events
  ├─ id: UUID
  ├─ user_id: FK
  ├─ title: String
  ├─ start, end: DateTime
  ├─ color: String
  └─ created_at
```

## Algorithm Details

### Analytic Hierarchy Process (AHP)

**Purpose**: Calculate a single priority score (0-100) for each task

**Criteria**:
1. **Deadline Urgency** (weight ≈ 0.55)
   - Formula: `1 - (days_until_due / 30)` clamped to [0,1]
   - Overdue tasks = 1.0
   - Tasks due today = 0.95
   - Far future = 0.1

2. **Importance** (weight ≈ 0.25)
   - Base: Category importance (work=0.9, health=0.8, learning=0.7)
   - Modifier: Past completion rates
   - Formula: `(base_score + past_rate) / 2`

3. **Dependencies** (weight ≈ 0.15)
   - Count: How many other tasks depend on this
   - Formula: `min(0.5, dependent_count * 0.1)`

4. **Complexity** (weight ≈ 0.05)
   - Easy = 0.3, Medium = 0.6, Hard = 0.9

**Final Priority**:
```
priority = (deadline × 0.55) + (importance × 0.25) + (dependencies × 0.15) + (complexity × 0.05)
priority_score = Math.round(priority * 100)  // 0-100
```

### Particle Swarm Optimization (PSO)

**Purpose**: Find optimal task ordering to minimize idle time

**Concepts**:
- **Particles**: Each particle = task ordering (permutation)
- **Fitness**: Idle time + peak hours utilization + priority respect
- **Velocity**: Swap operations (not arithmetic movements)
- **Swarm**: Population of candidate orderings

**Algorithm**:
```
1. Initialize swarm with random task permutations
2. Evaluate fitness of each particle
3. Track personal best (pbest) and global best (gbest)
4. For each iteration:
   a. Update velocity (swap probabilities)
   b. Perform swap operations on positions
   c. Evaluate new fitness
   d. Update pbest if better
   e. Update gbest if better
   f. Decrease inertia weight (convergence)
5. Return gbest as optimal ordering
```

**Parameters**:
```
swarmSize = 20          // Number of particles
iterations = 50         // Convergence iterations
inertiaWeight = 0.7     // Exploration vs exploitation
cognitiveCoeff = 1.5    // Personal best influence
socialCoeff = 1.5       // Global best influence
```

**Time Complexity**: O(swarmSize × iterations × taskCount)
- 20 × 50 × 20 = 20,000 operations ≈ 100ms

### Constraint Satisfaction Problem (CSP)

**Purpose**: Ensure schedule is feasible given hard constraints

**Variables**: 
- `startTime[i]` for each task i

**Domains**:
- Each task: valid start times within work hours

**Constraints**:
1. **Temporal**: No overlaps
   ```
   for all i, j: startTime[i] + duration[i] ≤ startTime[j] OR startTime[j] + duration[j] ≤ startTime[i]
   ```

2. **Deadline**: Respect due dates
   ```
   for all i: endTime[i] ≤ dueDate[i]
   ```

3. **Work Hours**: Within bounds
   ```
   for all i: workStart ≤ startTime[i] AND endTime[i] ≤ workEnd
   ```

4. **Dependencies**: Prerequisites first
   ```
   if task_j depends on task_i: endTime[i] ≤ startTime[j]
   ```

5. **Break Time**: Minimum gaps
   ```
   for all i, j adjacent: startTime[j] ≥ endTime[i] + minBreak
   ```

**Solution Method**: Backtracking + Forward Checking
```
1. Sort tasks by priority (PSO ordering)
2. For each unassigned task:
   a. Try each valid start time (in 15-min increments)
   b. Check if assignment satisfies all constraints
   c. If yes, assign and continue to next task
   d. If no valid time, backtrack
3. Return first feasible schedule
```

### Natural Language Processing (NLP)

**Purpose**: Auto-extract metadata from task description

**Method**: Keyword pattern matching (lightweight, no ML)

**Duration Extraction**:
```
Patterns: 
  - "(\d+)\s*hours?" → multiply by 60
  - "(\d+)\s*minutes?" → multiply by 1
  - "(\d+)\s*days?" → multiply by 480
Fallback:
  - word_count < 5 → 15 min
  - word_count < 20 → 30 min
  - word_count < 50 → 60 min
  - else → 120 min
```

**Difficulty Classification**:
```
Hard keywords: complex, difficult, research, design, refactor, debug
Easy keywords: simple, basic, quick, trivial, routine
Medium keywords: moderate, standard, intermediate

Scoring:
  hardScore = count(hard_keywords in text)
  easyScore = count(easy_keywords in text)
  
  if hardScore > easyScore: difficulty = "hard"
  else if easyScore > hardScore: difficulty = "easy"
  else: difficulty = "medium"
```

**Category Classification**:
```
Categories: work, personal, learning, health, social

work: project, meeting, deadline, deliverable, report
personal: home, family, shopping, errands
learning: learn, study, course, tutorial, research
health: exercise, gym, doctor, meditation
social: meet, friend, hangout, call, chat

Strategy: Check keywords in order, use first match
Fallback: "general"
```

### Behavior Learning (Apprentice AI)

**Purpose**: Learn from completion history to improve estimates and scheduling

**Learning Dimensions**:

1. **Peak Hours**
   ```
   - Track hour of day for each completed task
   - Weight by how well-estimated (actual/estimated)
   - Select top 6 hours with best "speed"
   ```

2. **Focus Styles**
   ```
   - Analyze session lengths (actualDuration per task)
   - <30 min → "quick-wins"
   - 30-90 min → "pomodoro"
   - >90 min → "deep-work"
   - Low variance → "consistent", else "flexible"
   ```

3. **Estimate Accuracy**
   ```
   accuracy = 1 - abs(actualDuration / estimatedDuration - 1)
   avgAccuracy = mean(accuracies)
   
   Value: 0.85 = estimates off by ~15%
   ```

4. **Difficulty Corrections**
   ```
   For each difficulty level:
     ratio = mean(actualDuration) / mean(estimatedDuration)
     
   Example results:
     easy: 0.8   (user faster than estimated by 20%)
     medium: 1.0 (accurate)
     hard: 1.3   (user slower than estimated by 30%)
   ```

5. **Category Patterns**
   ```
   completion_rate[category] = count_completed[category] / count_total[category]
   
   Used for importance weighting in AHP
   ```

## Performance Characteristics

| Operation | Time | Notes |
|-----------|------|-------|
| Create task | 50ms | NLP analysis |
| List tasks | 10ms | D1 query |
| Calculate AHP | 1ms | Simple matrix math |
| PSO optimization | 150ms | 20 particles × 50 iterations × 20 tasks |
| CSP solving | 50ms | Backtracking with pruning |
| Behavior learning | 30ms | Statistics from logs |
| Schedule generation | 300ms | Full pipeline |
| Log completion | 75ms | Update task + analytics |
| Get analytics | 100ms | Query logs + calculate |

**Scalability**:
- Tasks: Linear O(n) up to 50, then PSO becomes slow
- Users: Unlimited (D1 serverless, Workers auto-scale)
- Concurrent requests: Handled by Cloudflare (auto-scale)

## Security Architecture

### Authentication
- User ID from header `X-User-ID` (implement real auth later)
- All queries filtered by user_id
- No data leakage between users

### Data Validation
- All inputs validated with Zod schemas
- Type-safe at compile time
- Runtime validation on API boundaries

### CORS
- Hono CORS middleware enabled
- Restrict to frontend domain in production

### HTTPS
- Automatic via Cloudflare
- All traffic encrypted

### Rate Limiting
- Cloudflare built-in rate limiting
- Workers can add custom limits

## Deployment Architecture

```
┌─────────────────────────────────────────────────────┐
│           Cloudflare Global Network                  │
│                                                       │
│  ┌─────────────────────────────────────────────┐   │
│  │  Cloudflare Pages (Frontend)                 │   │
│  │  - Auto-deploy from Git                      │   │
│  │  - Global CDN, 200+ edge locations          │   │
│  │  - Caching, DDoS protection                 │   │
│  └─────────────────────────────────────────────┘   │
│                      │                               │
│                      ↓ HTTPS                         │
│                                                       │
│  ┌─────────────────────────────────────────────┐   │
│  │  Cloudflare Workers (Backend)               │   │
│  │  - Edge compute (latency <50ms)             │   │
│  │  - Auto-scale, always available             │   │
│  │  - Regional redundancy                      │   │
│  └─────────────────────────────────────────────┘   │
│                      │                               │
│                      ↓ SQL                           │
│                                                       │
│  ┌─────────────────────────────────────────────┐   │
│  │  Cloudflare D1 (Database)                   │   │
│  │  - SQLite serverless                        │   │
│  │  - Replicated across regions                │   │
│  │  - Automatic backups                        │   │
│  └─────────────────────────────────────────────┘   │
│                                                       │
└─────────────────────────────────────────────────────┘
```

## Future Enhancements

### Phase 2
- OAuth authentication (Google, GitHub)
- Google Calendar sync
- Real-time collaboration (WebSockets)
- Advanced ML for estimates (TensorFlow.js)

### Phase 3
- Mobile app (React Native)
- Slack/Teams integration
- Task dependencies visualization
- Time tracking with pomodoro timer
- Calendar conflicts detection

### Phase 4
- Team scheduling
- AI task breakdown (GPT integration)
- Advanced forecasting
- Custom algorithms (user-defined rules)

## Code Organization Principles

1. **Single Responsibility**: Each file has one purpose
2. **Type Safety**: TypeScript with strict mode
3. **Validation**: Zod at API boundaries
4. **Separation of Concerns**: Routes → Services → Database
5. **DRY (Don't Repeat Yourself)**: Shared utilities and types
6. **Testability**: Pure functions for algorithms
7. **Documentation**: Comments for complex logic

## Development Workflow

1. **Design**: Architecture documents (this file)
2. **Types**: Define in shared/src/types.ts
3. **Schemas**: Zod validation in shared/src/schemas.ts
4. **Backend**: Database schema → Routes → Business logic
5. **Frontend**: Components → Stores → Pages
6. **Integration**: End-to-end testing
7. **Deployment**: Git push → Auto-deploy

---

This architecture supports rapid development while maintaining code quality and type safety across the full stack.
