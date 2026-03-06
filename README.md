# GSI Schedule Planner - Full Stack Application

An AI-powered task scheduling system that combines Particle Swarm Optimization (PSO), Constraint Satisfaction Problem (CSP) solving, and Analytic Hierarchy Process (AHP) to create optimal daily schedules with intelligent task prioritization and learning.

## Architecture

### Stack Overview

**Frontend**
- **Framework**: React 18 + TypeScript with Vite
- **Routing**: React Router v7
- **State Management**: Zustand (lightweight)
- **Data Fetching**: TanStack Query (React Query)
- **UI Components**: shadcn/ui (Radix UI based) + Lucide Icons
- **Styling**: Tailwind CSS
- **Calendar**: FullCalendar React
- **Forms**: React Hook Form + Zod validation
- **Charts**: Recharts

**Backend**
- **Runtime**: Cloudflare Workers (Edge Computing)
- **Framework**: Hono (TypeScript-first, minimal)
- **Database**: Cloudflare D1 (SQLite serverless)
- **ORM**: Drizzle ORM (type-safe SQL)
- **Validation**: Zod schemas

**Shared**
- **Package**: Monorepo package with shared types and schemas
- **Validation**: End-to-end type safety between frontend and backend

### Deployment

- **Frontend**: Cloudflare Pages (auto-deploy from Git)
- **Backend**: Cloudflare Workers (via Pages Functions or separate project)
- **Domain**: Cloudflare (free SSL, global CDN)
- **Storage**: Cloudflare R2 (if file exports needed)

## Project Structure

```
gsi-planner/
├── package.json                 # Root monorepo config
├── frontend/                    # React SPA
│   ├── package.json
│   ├── vite.config.ts
│   ├── tsconfig.json
│   ├── tailwind.config.js
│   ├── postcss.config.js
│   ├── src/
│   │   ├── main.tsx
│   │   ├── App.tsx
│   │   ├── routes/              # Page components
│   │   ├── components/          # Reusable components
│   │   ├── hooks/               # Custom React hooks
│   │   ├── store/               # Zustand stores
│   │   ├── services/            # API clients
│   │   ├── lib/                 # Utilities
│   │   └── styles/              # Global styles
│   └── public/
├── backend/                     # Cloudflare Workers
│   ├── package.json
│   ├── wrangler.toml           # Worker config
│   ├── tsconfig.json
│   └── src/
│       ├── index.ts            # Main entry point
│       ├── db/
│       │   ├── index.ts        # DB initialization
│       │   └── schema.ts       # Drizzle schema
│       ├── routes/
│       │   ├── tasks.ts        # Task management
│       │   ├── schedule.ts     # Schedule optimization
│       │   ├── analytics.ts    # Learning & analytics
│       │   └── settings.ts     # User settings
│       └── lib/
│           ├── nlp-analyzer.ts        # NLP task analysis
│           ├── ahp-priority.ts        # AHP prioritization
│           ├── pso-optimizer.ts       # PSO scheduling
│           ├── csp-solver.ts          # CSP constraints
│           └── behavior-learning.ts   # ML insights
└── shared/                      # Shared types & schemas
    ├── package.json
    ├── src/
    │   ├── index.ts
    │   ├── types.ts            # TypeScript interfaces
    │   └── schemas.ts          # Zod validation schemas
    └── tsconfig.json
```

## Core Algorithms

### 1. Particle Swarm Optimization (PSO)
**File**: `backend/src/lib/pso-optimizer.ts`

Optimizes task ordering to minimize idle time while respecting:
- Task priorities (from AHP)
- Peak productivity hours (learned)
- Work hour constraints
- Task dependencies

**Configuration**:
```typescript
{
  swarmSize: 20,
  iterations: 50,
  inertiaWeight: 0.7,
  cognitiveCoefficient: 1.5,
  socialCoefficient: 1.5,
  peakHours: [9, 10, 11, 14, 15, 16]  // Learned from user data
}
```

### 2. Constraint Satisfaction Problem (CSP)
**File**: `backend/src/lib/csp-solver.ts`

Ensures schedule feasibility by enforcing:
- No time overlaps
- Work hour boundaries (default 9 AM - 5 PM)
- Respect deadlines
- Minimum break time between tasks (default 15 min)
- Task dependencies (prerequisites completed first)

Uses backtracking with forward checking for O(n!) worst case (feasible for daily schedules <50 tasks).

### 3. Analytic Hierarchy Process (AHP)
**File**: `backend/src/lib/ahp-priority.ts`

Calculates task priorities (0-100) based on:
- **Deadline Urgency** (0-1): Days until due
- **Importance** (0-1): Category + past completion patterns
- **Dependencies** (0-1): How many tasks depend on this
- **Complexity** (0-1): Difficulty level (easy/medium/hard)

Uses simplified eigenvalue approach (power iteration) for weight calculation.

**Priority Formula**:
```
Priority = (deadline × w1) + (importance × w2) + (dependencies × w3) + (complexity × w4)
```

### 4. NLP Task Analyzer
**File**: `backend/src/lib/nlp-analyzer.ts`

Automatically extracts from task title/description:
- **Duration**: Keyword extraction ("2 hours", "30 minutes") with fallback heuristics
- **Difficulty**: Keyword scoring (easy/medium/hard)
- **Category**: Classification (work/personal/learning/health/social)

**Example**:
```
Input: "Design and implement complex authentication system"
Output: {
  estimatedDuration: 480,  // 8 hours
  difficulty: "hard",
  category: "work"
}
```

### 5. Behavior Learning (Apprentice AI)
**File**: `backend/src/lib/behavior-learning.ts`

Learns from completion logs to:
- **Peak Hours Analysis**: Find times when user completes tasks fastest
- **Focus Styles**: Identify work patterns (Pomodoro, deep work, quick wins)
- **Estimate Accuracy**: Track how accurate initial estimates are
- **Difficulty Correction**: Adjust estimates per difficulty level
- **Category Patterns**: Find completion rates by task category

**Output**: `LearningInsights` object
```typescript
{
  peakProductivityHours: [9, 10, 11, 14, 15, 16],
  focusStyles: ['deep-work', 'consistent'],
  estimateAccuracy: 0.87,
  difficultyCorrectionFactors: {
    easy: 0.8,
    medium: 1.0,
    hard: 1.3
  },
  categoryPatterns: {
    work: 0.92,
    personal: 0.65
  }
}
```

## API Endpoints

### Tasks Management
```
GET    /api/tasks              # List all tasks
POST   /api/tasks              # Create task (auto-analyzes)
GET    /api/tasks/:id          # Get single task
PATCH  /api/tasks/:id          # Update task
DELETE /api/tasks/:id          # Delete task
```

### Schedule Optimization
```
POST   /api/schedule/generate  # Generate optimized schedule for date
GET    /api/schedule/:date     # Get stored schedule
GET    /api/schedule/week/:startDate  # Get week of schedules
```

### Analytics & Learning
```
GET    /api/analytics/stats    # Productivity statistics
GET    /api/analytics/insights # Learning insights
POST   /api/analytics/log-completion  # Log completed task
GET    /api/analytics/completion-logs # Get completion history
```

### Settings
```
GET    /api/settings           # Get user settings
PATCH  /api/settings           # Update settings
GET    /api/settings/theme     # Get theme preference
GET    /api/settings/work-hours # Get work hours
```

## Database Schema

### Core Tables

**tasks**
- id, userId, title, description
- dueDate, estimatedDuration, difficulty, category
- priority (calculated by AHP)
- status (pending/in_progress/completed)
- dependencies (junction table)

**userSettings**
- workStartHour, workEndHour
- theme (light/dark), notificationsEnabled
- weekStartsOn (sunday/monday)

**completionLogs** (Learning)
- taskId, completedAt
- actualDuration, estimatedDuration (for accuracy tracking)
- difficulty (for pattern analysis)

**storedSchedules**
- date, scheduleData (JSON), optimizationScore

**calendarEvents**
- External events (meetings, etc.)
- id, title, start, end, userId

## Frontend Components

### Page/Screen Components
- **Dashboard**: High-level overview, today's smart schedule
- **Tasks**: Searchable/filterable task list
- **Calendar**: FullCalendar monthly/weekly/daily views
- **Schedule**: Optimized daily timeline visualization
- **Priorities**: AHP-ranked task list
- **Today**: AI's "Top Picks" for focus
- **Week**: Weekly overview + smart rollovers
- **Completed**: Archive with statistics
- **Timesheet**: Active timers + logs
- **Analytics**: Completion rates, patterns, trends
- **Settings**: General, AI personalization, data export

### Key Components
- TaskForm: Create/edit tasks with NLP analysis preview
- ScheduleBlock: Individual task block in timeline
- PriorityBadge: Visual priority indicator (0-100)
- AnalyticsChart: Productivity trends (Recharts)
- SettingsPanel: Theme, hours, notifications

## State Management (Zustand)

### Stores
```typescript
// Tasks store
interface TasksState {
  tasks: Task[];
  selectedTask: Task | null;
  addTask: (task: CreateTaskInput) => void;
  updateTask: (id: string, updates: Partial<Task>) => void;
  deleteTask: (id: string) => void;
  setSelectedTask: (task: Task | null) => void;
}

// Schedule store
interface ScheduleState {
  schedule: DailySchedule | null;
  loadingSchedule: boolean;
  generateSchedule: (date: string) => void;
  getSchedule: (date: string) => void;
}

// User store
interface UserState {
  settings: UserSettings | null;
  theme: 'light' | 'dark';
  updateSettings: (settings: Partial<UserSettings>) => void;
  toggleTheme: () => void;
}

// Analytics store
interface AnalyticsState {
  stats: ProductivityStats | null;
  insights: LearningInsights | null;
  loadStats: () => void;
  loadInsights: () => void;
  logCompletion: (taskId: string, actualDuration: number) => void;
}
```

## API Client (Frontend Services)

```typescript
// services/api.ts
export class TaskService {
  static async getTasks(): Promise<Task[]>
  static async createTask(input: CreateTaskInput): Promise<Task>
  static async updateTask(id: string, updates: Partial<Task>): Promise<Task>
  static async deleteTask(id: string): Promise<void>
}

export class ScheduleService {
  static async generateSchedule(date: string): Promise<DailySchedule>
  static async getSchedule(date: string): Promise<DailySchedule>
  static async getWeekSchedule(startDate: string): Promise<DailySchedule[]>
}

export class AnalyticsService {
  static async getStats(): Promise<ProductivityStats>
  static async getInsights(): Promise<LearningInsights>
  static async logCompletion(taskId: string, actualDuration: number): Promise<void>
}

export class SettingsService {
  static async getSettings(): Promise<UserSettings>
  static async updateSettings(settings: Partial<UserSettings>): Promise<UserSettings>
}
```

## Setup Instructions

### Prerequisites
- Node.js 18+
- npm or yarn
- Wrangler CLI: `npm install -g wrangler`
- GitHub account (for Cloudflare Pages)

### Local Development

1. **Clone and install**
```bash
git clone <repo>
cd gsi-planner
npm install
```

2. **Setup environment variables**
```bash
# backend/.env.local
ENVIRONMENT=development
```

3. **Start local dev server**
```bash
npm run dev
# Frontend: http://localhost:5173
# Backend: http://localhost:8787
```

### Cloudflare Deployment

1. **Create Cloudflare account and D1 database**
```bash
# Create D1 database
wrangler d1 create gsi-planner

# Get database ID from output
# Update wrangler.toml with database_id
```

2. **Deploy backend**
```bash
cd backend
wrangler deploy
```

3. **Deploy frontend to Pages**
```bash
# Push to GitHub
git push origin main

# Connect repo to Cloudflare Pages
# Pages will auto-deploy on git push
# Set build command: npm run build
# Set build output: dist
```

4. **Set environment variables**
In Cloudflare Workers/Pages dashboard:
```
ENVIRONMENT=production
API_URL=https://your-backend-url.workers.dev
```

## Configuration

### PSO Parameters (Optimization)

Adjust in `backend/src/routes/schedule.ts`:
```typescript
const optimizationParams = {
  swarmSize: 20,           // 1-50, higher = slower but better
  iterations: 50,          // 10-200, higher = more refined
  inertiaWeight: 0.7,      // 0.4-0.9, controls convergence
  cognitiveCoefficient: 1.5, // Personal best weight
  socialCoefficient: 1.5,    // Global best weight
  peakHours: insights.peakProductivityHours,
};
```

### Work Hours

Modify in user settings or `userSettings` table:
```typescript
{
  workStartHour: 9,    // 0-23
  workEndHour: 17,     // 0-23
  minBreakTime: 15,    // minutes
}
```

### Difficulty Correction

After enough completion logs, system auto-adjusts estimates based on:
- `difficultyCorrectionFactors.easy` (typically 0.5-1.2)
- `difficultyCorrectionFactors.medium` (typically 0.8-1.2)
- `difficultyCorrectionFactors.hard` (typically 1.0-1.8)

## Performance

### Optimization Notes

- **PSO**: O(swarmSize × iterations × taskCount) - typically <100ms for <50 tasks
- **CSP**: O(n!) worst case, but pruning brings typical case to O(n²-n³)
- **AHP**: O(criteria²) - 3-4 criteria = very fast
- **NLP**: O(n) keyword matching - instant

For heavy compute (PSO with >100 tasks):
- Use Cloudflare Workers Unbound (longer CPU time)
- Or implement async queue-based scheduling

### Caching Strategy

Frontend:
- TanStack Query handles API response caching
- Stale times: 30s (tasks), 1m (schedule), 5m (analytics)
- User settings cached in localStorage

Backend:
- Store computed schedules in D1 (avoid recompute)
- Cache learning insights (update hourly/daily)
- D1 query results cached by Cloudflare (1-hour default)

## Roadmap

### Phase 1 (MVP) ✓
- [x] Basic task CRUD
- [x] NLP task analysis
- [x] PSO schedule optimization
- [x] CSP constraint validation
- [x] AHP task prioritization
- [x] Basic learning from completion logs

### Phase 2
- [ ] Real-time collaboration (multiple users)
- [ ] Task dependencies visualization
- [ ] Integration with Google Calendar
- [ ] Mobile app (React Native)
- [ ] Advanced ML: neural networks for estimate accuracy
- [ ] Slack/Teams notifications

### Phase 3
- [ ] Team scheduling
- [ ] AI-suggested task breakdown
- [ ] Calendar sync (Outlook, iCal)
- [ ] Export to PDF/ICS
- [ ] Dark mode UI refinements
- [ ] Keyboard shortcuts

## Development Tips

### Adding a New Feature

1. **Define types** in `shared/src/types.ts`
2. **Add Zod schema** in `shared/src/schemas.ts`
3. **Create DB schema** in `backend/src/db/schema.ts`
4. **Build API routes** in `backend/src/routes/*.ts`
5. **Create services** in `frontend/src/services/*.ts`
6. **Build UI components** in `frontend/src/components/*.tsx`
7. **Add Zustand store** in `frontend/src/store/*.ts`
8. **Create page** in `frontend/src/routes/*.tsx`

### Testing

```bash
# Type checking across monorepo
npm run type-check

# Run specific tests
npm run test -w backend
npm run test -w frontend
```

### Debugging

- **Frontend**: Chrome DevTools (React components via React Dev Tools)
- **Backend**: Wrangler logs: `wrangler tail`
- **Database**: Wrangler D1 CLI: `wrangler d1 query <DB_ID> "SELECT * FROM tasks"`

## License

MIT - See LICENSE file

## Contributing

Contributions welcome! Please:
1. Fork the repo
2. Create feature branch: `git checkout -b feature/amazing-thing`
3. Commit changes: `git commit -am 'Add amazing thing'`
4. Push: `git push origin feature/amazing-thing`
5. Open Pull Request

## Support

For issues or questions:
- Open GitHub Issues
- Check Discussions
- Email: support@gsi-planner.dev
