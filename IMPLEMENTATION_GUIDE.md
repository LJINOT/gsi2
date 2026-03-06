# GSI Planner - Implementation Guide

Complete step-by-step guide to build and deploy this full-stack application.

## Phase 1: Project Setup

### 1.1 Initialize Monorepo

```bash
mkdir gsi-planner
cd gsi-planner

# Create root package.json with workspaces
npm init -y
npm install -D concurrently typescript eslint
```

### 1.2 Create Workspace Packages

```bash
mkdir -p frontend backend shared

# Shared package
cd shared
npm init -y
npm install zod
npm install -D typescript

# Backend
cd ../backend
npm init -y
npm install hono drizzle-orm @cloudflare/workers-types uuid zod
npm install -D wrangler typescript

# Frontend
cd ../frontend
npm init -y
npm install react react-dom react-router-dom zustand @tanstack/react-query zod lucide-react
npm install react-hook-form @fullcalendar/react @fullcalendar/daygrid @fullcalendar/timegrid
npm install recharts date-fns clsx tailwind-merge
npm install -D vite @vitejs/plugin-react typescript tailwindcss postcss autoprefixer
```

## Phase 2: Shared Package

### 2.1 Create Type Definitions

```
shared/src/
├── index.ts          # Exports
├── types.ts          # TypeScript interfaces
└── schemas.ts        # Zod validation schemas
```

**Key types to define:**
- `Task`, `CreateTaskInput`
- `ScheduleBlock`, `DailySchedule`
- `UserSettings`
- `CompletionLog`, `ProductivityStats`
- `APIResponse<T>`

### 2.2 Build Zod Schemas

Create schemas for:
- `createTaskSchema` - Input validation
- `taskSchema` - Full task with types
- `dailyScheduleSchema` - Schedule response
- `userSettingsSchema` - Settings

Ensure schemas export inferred types:
```typescript
export type Task = z.infer<typeof taskSchema>;
```

## Phase 3: Backend (Cloudflare Workers)

### 3.1 Database Setup

```bash
# Initialize Cloudflare D1
cd backend
wrangler d1 create gsi-planner

# Copy database ID to wrangler.toml
```

**wrangler.toml**:
```toml
name = "gsi-planner-backend"
main = "src/index.ts"
compatibility_date = "2024-06-05"

[[d1_databases]]
binding = "DB"
database_name = "gsi-planner"
database_id = "YOUR_DB_ID"
```

### 3.2 Create Database Schema (Drizzle ORM)

File: `backend/src/db/schema.ts`

Define tables:
- `users` - User accounts
- `tasks` - Task data with userId foreign key
- `taskDependencies` - Junction table for task dependencies
- `userSettings` - Per-user settings
- `completionLogs` - Historical completion data
- `storedSchedules` - Cached optimized schedules
- `calendarEvents` - External calendar events

Add relations for type safety:
```typescript
export const userRelations = relations(users, ({ many, one }) => ({
  tasks: many(tasks),
  settings: one(userSettings),
}));
```

### 3.3 Build Optimization Libraries

Create these core algorithm files:

1. **`lib/nlp-analyzer.ts`** - Task analysis
   - Extract duration from text patterns
   - Classify difficulty from keywords
   - Auto-categorize tasks

2. **`lib/ahp-priority.ts`** - Priority calculation
   - deadline score: days until due
   - importance score: category + patterns
   - dependency score: task dependents
   - complexity score: difficulty level
   - Calculate weighted priorities

3. **`lib/pso-optimizer.ts`** - Schedule optimization
   - Initialize particle swarm
   - Fitness function: minimize idle time
   - Update positions using swap operations
   - Return optimized task order

4. **`lib/csp-solver.ts`** - Constraint satisfaction
   - Validate work hours
   - Check for overlaps
   - Ensure dependencies satisfied
   - Backtracking algorithm

5. **`lib/behavior-learning.ts`** - ML insights
   - Analyze peak productivity hours
   - Identify focus styles
   - Calculate estimate accuracy
   - Difficulty correction factors
   - Category completion patterns

### 3.4 Build API Routes

Create route modules for:

**`routes/tasks.ts`**
- GET /api/tasks - list
- POST /api/tasks - create (with NLP analysis)
- GET /api/tasks/:id - get
- PATCH /api/tasks/:id - update
- DELETE /api/tasks/:id - delete

**`routes/schedule.ts`**
- POST /api/schedule/generate - optimize schedule
- GET /api/schedule/:date - get stored schedule
- GET /api/schedule/week/:startDate - week view

**`routes/analytics.ts`**
- GET /api/analytics/stats - productivity stats
- GET /api/analytics/insights - learning insights
- POST /api/analytics/log-completion - log task done
- GET /api/analytics/completion-logs - history

**`routes/settings.ts`**
- GET /api/settings - get settings
- PATCH /api/settings - update
- GET /api/settings/theme - theme
- GET /api/settings/work-hours - work hours

### 3.5 Main Entry Point

File: `backend/src/index.ts`

```typescript
import { Hono } from 'hono';
import { cors } from 'hono/cors';

const app = new Hono();
app.use('*', cors());
app.use('*', logger());

// Mount route groups
app.route('/api/tasks', createTaskRoutes(db));
app.route('/api/schedule', createScheduleRoutes(db));
app.route('/api/analytics', createAnalyticsRoutes(db));
app.route('/api/settings', createSettingsRoutes(db));

export default app;
```

### 3.6 Test Backend Locally

```bash
cd backend
npm run dev
# Visit http://localhost:8787/health
# Test endpoints with curl/Postman
```

## Phase 4: Frontend (React SPA)

### 4.1 Project Structure

```
frontend/src/
├── main.tsx                # Entry point
├── App.tsx                 # Root component
├── routes/                 # Page components
│   ├── Dashboard.tsx
│   ├── Tasks.tsx
│   ├── Calendar.tsx
│   ├── Schedule.tsx
│   ├── Priorities.tsx
│   ├── Analytics.tsx
│   └── Settings.tsx
├── components/             # Reusable UI components
│   ├── TaskForm.tsx
│   ├── TaskCard.tsx
│   ├── ScheduleBlock.tsx
│   ├── PriorityBadge.tsx
│   ├── Header.tsx
│   └── Sidebar.tsx
├── store/                  # Zustand stores
│   ├── tasks.ts
│   ├── schedule.ts
│   ├── user.ts
│   └── analytics.ts
├── services/               # API clients
│   ├── api.ts
│   ├── tasks.ts
│   ├── schedule.ts
│   └── analytics.ts
├── hooks/                  # Custom React hooks
│   ├── useTask.ts
│   ├── useSchedule.ts
│   └── useAnalytics.ts
├── lib/                    # Utilities
│   ├── api-client.ts
│   ├── date-utils.ts
│   └── format.ts
├── styles/                 # Global styles
│   └── globals.css
└── types.ts               # Local types (re-exports from shared)
```

### 4.2 Create API Client

File: `frontend/src/lib/api-client.ts`

```typescript
const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8787';

export async function apiCall<T>(
  endpoint: string,
  options: RequestInit = {},
): Promise<T> {
  const response = await fetch(`${API_BASE}${endpoint}`, {
    headers: {
      'Content-Type': 'application/json',
      'X-User-ID': getUserId(),
      ...options.headers,
    },
    ...options,
  });

  if (!response.ok) throw new Error(`API error: ${response.status}`);
  return response.json();
}
```

### 4.3 Create Zustand Stores

**`store/tasks.ts`**
```typescript
interface TasksState {
  tasks: Task[];
  addTask: (task: Task) => void;
  updateTask: (id: string, updates: Partial<Task>) => void;
  deleteTask: (id: string) => void;
}

export const useTasksStore = create<TasksState>((set) => ({
  tasks: [],
  addTask: (task) => set((state) => ({
    tasks: [...state.tasks, task],
  })),
  // ... more actions
}));
```

**`store/schedule.ts`** - for current day's schedule
**`store/user.ts`** - for user settings and theme
**`store/analytics.ts`** - for stats and insights

### 4.4 Build UI Components

**Key components:**

1. **TaskForm** - Create/edit with NLP preview
2. **TaskCard** - Task display with status/priority
3. **ScheduleBlock** - Timeslot visualization
4. **PriorityBadge** - Color-coded priority (0-100)
5. **AnalyticsChart** - Recharts for stats
6. **Header** - Top navigation with user menu
7. **Sidebar** - Navigation menu
8. **Modal/Dialog** - For forms

### 4.5 Create Page Components

**Dashboard** - Summary view
- Today's schedule at a glance
- Top priorities
- Key metrics

**Tasks** - Full task list
- Searchable/filterable by category, status
- Add task button opens form
- Inline edit capability
- Completion checkbox

**Calendar** - FullCalendar integration
- Monthly/weekly/daily views
- Tasks + external events
- Click to view/edit details

**Schedule** - Today's optimized timeline
- Visual blocks for each task
- Drag-to-reschedule (optional)
- Start/pause timers
- Mark complete

**Priorities** - AHP ranked list
- Tasks ordered by priority
- Reason for ranking
- Manual override capability

**Analytics** - Stats and learning
- Completion rates chart
- Peak hours heatmap
- Estimate accuracy trend
- Focus styles identified
- Category breakdown

**Settings** - User preferences
- Work hours (start/end)
- Theme (light/dark)
- Notifications
- Data export (CSV/PDF/ICS)
- About/help

### 4.6 Styling with Tailwind

Create `frontend/src/styles/globals.css`:
```css
@import 'tailwindcss/base';
@import 'tailwindcss/components';
@import 'tailwindcss/utilities';

@layer base {
  body {
    @apply bg-light dark:bg-dark text-dark dark:text-light;
  }
}

@layer components {
  .btn-primary {
    @apply px-4 py-2 bg-primary text-white rounded hover:opacity-90;
  }
  .card {
    @apply bg-white dark:bg-gray-800 rounded-lg shadow-soft;
  }
}
```

### 4.7 Test Frontend Locally

```bash
cd frontend
npm run dev
# Visit http://localhost:5173
```

## Phase 5: Integration Testing

### 5.1 Test Task Flow

1. Create task with description
   - Verify NLP extracts duration/difficulty
   - Check category classification

2. Update task
   - Change status to in_progress
   - Verify backend updates

3. View task list
   - Verify filters work (by category, status)
   - Test search

### 5.2 Test Schedule Generation

1. Request schedule for today
   - Verify PSO runs and returns blocks
   - Check time doesn't overlap
   - Verify respects work hours

2. Verify priorities
   - Tasks with closer deadlines have higher priority
   - Hard tasks ranked higher than easy

### 5.3 Test Analytics

1. Log task completion
   - Record actual duration vs estimated
   - Check stats update

2. View insights
   - Verify peak hours identified
   - Check estimate accuracy calculated
   - Verify difficulty corrections applied

### 5.4 Manual Testing Checklist

- [ ] Create 5-10 tasks with varied descriptions
- [ ] Request schedule for today
- [ ] Verify tasks appear in correct time slots
- [ ] Mark several tasks complete
- [ ] Check analytics show updated stats
- [ ] Switch theme (light/dark)
- [ ] Update work hours setting
- [ ] Test on mobile viewport
- [ ] Test keyboard navigation
- [ ] Verify no console errors

## Phase 6: Deployment

### 6.1 Deploy Backend to Cloudflare Workers

```bash
cd backend
wrangler login  # Authenticate
wrangler deploy

# Get the worker URL from output
# e.g., https://gsi-planner-backend.{username}.workers.dev
```

### 6.2 Deploy Frontend to Cloudflare Pages

1. Push code to GitHub
2. Connect repo to Cloudflare Pages dashboard
3. Configure build:
   - Build command: `npm run build`
   - Build output directory: `dist`
   - Environment variables:
     - `VITE_API_URL`: https://gsi-planner-backend.{username}.workers.dev

4. Pages auto-deploys on git push

### 6.3 Custom Domain

1. Add custom domain in Cloudflare dashboard
2. Update nameservers (or CNAME if using existing DNS)
3. SSL certificate automatically provisioned

### 6.4 Environment Variables

**Backend** (wrangler.toml or Cloudflare dashboard):
```toml
[env.production]
vars = { ENVIRONMENT = "production" }
```

**Frontend** (.env.production):
```
VITE_API_URL=https://api.yourdomain.com
```

## Phase 7: Optimization

### 7.1 Performance

- Profile PSO/CSP with slow task lists
- Implement progressive UI updates
- Cache schedule results in D1
- Use React.memo for expensive components

### 7.2 Security

- Validate all inputs with Zod
- Implement rate limiting (Cloudflare)
- Add CORS whitelist
- Hash/encrypt sensitive data
- Use HTTPS only (automatic on Cloudflare)

### 7.3 Monitoring

- Add error tracking (Sentry/LogRocket)
- Monitor Worker CPU usage
- Track API response times
- User event analytics

## Common Issues & Solutions

### Issue: Worker timeout on PSO

**Solution**: Reduce swarm size/iterations or use Workers Unbound

### Issue: CORS errors

**Solution**: Ensure Hono CORS middleware enabled in backend

### Issue: Database query slow

**Solution**: Add indexes to D1 tables (user_id, due_date on tasks)

### Issue: Types not syncing between packages

**Solution**: Run `npm install` in root, restart editor TypeScript server

### Issue: Frontend can't reach backend

**Solution**: Check API_URL env var, ensure CORS enabled, check worker status

## Testing Checklist

- [ ] Types compile without errors
- [ ] All backend routes return valid responses
- [ ] Frontend components render without errors
- [ ] Task creation triggers NLP analysis
- [ ] Schedule generation completes in <1s
- [ ] Analytics calculations accurate
- [ ] Responsive design works on mobile
- [ ] Dark mode functional
- [ ] All API endpoints secured with X-User-ID

## Performance Targets

- Task creation: <200ms
- Schedule generation: <500ms (for 20 tasks)
- Analytics update: <300ms
- API response: <100ms (including db query)
- Frontend page load: <2s
- First Contentful Paint: <1s

## Next Steps

1. Implement authentication (Auth0/Clerk)
2. Add Google Calendar sync
3. Create mobile app (React Native)
4. Implement team collaboration
5. Add AI-powered task breakdown
6. Implement advanced ML for estimates
