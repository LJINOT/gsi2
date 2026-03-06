# GSI Planner - Quick Start Guide

Get up and running in 5 minutes.

## Prerequisites

- Node.js 18+ ([download](https://nodejs.org))
- Git
- A code editor (VS Code recommended)

## Local Development Setup

### 1. Clone and Install

```bash
# Extract the provided tar.gz or clone from git
cd gsi-planner

# Install all dependencies
npm install
```

### 2. Start Development Servers

```bash
# Start both frontend (5173) and backend (8787) in parallel
npm run dev
```

You'll see:
```
Frontend: http://localhost:5173
Backend:  http://localhost:8787
```

### 3. Test It Works

**Backend health check:**
```bash
curl http://localhost:8787/health
# Response: {"status":"ok","timestamp":"..."}
```

**Frontend:**
Open http://localhost:5173 in your browser.

## Creating Your First Task

1. Click "Add Task" button
2. Enter title: "Review project proposal"
3. Enter description: "Review and provide feedback on Q4 project proposal - should take about 2 hours"
4. Set due date: Tomorrow
5. Click Create

**What happens:**
- Backend NLP analyzes the task
- Duration extracted: ~120 minutes (from "2 hours")
- Difficulty set to: medium (based on keywords)
- Category set to: work
- Task created in database
- Task appears in task list

## Generate Your First Schedule

1. Go to Schedule page
2. Click "Generate Optimized Schedule"
3. Watch the algorithm work:
   - AHP calculates priorities
   - PSO optimizes task ordering
   - CSP validates constraints
   - Schedule rendered with time blocks

## Log Task Completion

1. In Schedule view, click task block
2. Click "Complete" button
3. Confirm actual time taken (or use default)

**Learning happens:**
- Completion logged
- Estimate accuracy calculated
- Pattern analysis updated
- Future schedules improve

## Common Commands

```bash
# Development
npm run dev              # Start frontend + backend
npm run build            # Build both packages
npm run type-check       # Check TypeScript

# Specific packages
npm run dev -w frontend  # Frontend only
npm run dev -w backend   # Backend only

# Debugging
npm run type-check -w backend
npm run type-check -w frontend
```

## File Structure Quick Reference

```
src/
├── Backend algorithms
│  └── backend/src/lib/
│      ├── nlp-analyzer.ts        ← Task analysis
│      ├── ahp-priority.ts        ← Priority ranking
│      ├── pso-optimizer.ts       ← Schedule optimization
│      ├── csp-solver.ts          ← Constraints
│      └── behavior-learning.ts   ← ML insights
│
├── API Routes
│  └── backend/src/routes/
│      ├── tasks.ts               ← Task CRUD
│      ├── schedule.ts            ← Schedule optimization
│      ├── analytics.ts           ← Learning analytics
│      └── settings.ts            ← User settings
│
├── Frontend Pages
│  └── frontend/src/routes/
│      ├── Dashboard.tsx
│      ├── Tasks.tsx
│      ├── Schedule.tsx
│      ├── Analytics.tsx
│      └── Settings.tsx
│
└── Shared types
   └── shared/src/
       ├── types.ts               ← Interfaces
       └── schemas.ts             ← Zod validation
```

## Troubleshooting

### Port Already in Use

```bash
# Change port in vite.config.ts or wrangler.toml
# Or kill process using port:
lsof -i :5173  # Find process
kill -9 <PID>  # Kill it
```

### Types Not Working

```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install

# Restart TypeScript server in your editor
# (Command palette > "TypeScript: Restart TS Server")
```

### Backend Not Responding

```bash
# Check wrangler is running
# Verify http://localhost:8787/health returns 200

# Restart backend
# Ctrl+C and npm run dev
```

### Tasks Not Showing

```bash
# Check browser console for errors
# Open DevTools: F12 or Right-click > Inspect

# Check Network tab:
# - Look for GET /api/tasks request
# - Should return 200 with task array

# Check X-User-ID header is being sent
```

## Next Steps

1. **Explore the code**: Read through algorithms in `backend/src/lib/`
2. **Customize**: Adjust PSO parameters, work hours, AHP weights
3. **Build features**: Add new API routes, UI pages
4. **Deploy**: Follow `IMPLEMENTATION_GUIDE.md` for Cloudflare setup
5. **Extend**: Integrate with Google Calendar, add collaboration

## Key Files to Understand

| File | Purpose | Complexity |
|------|---------|------------|
| `ahp-priority.ts` | Task prioritization | Medium |
| `pso-optimizer.ts` | Schedule optimization | High |
| `csp-solver.ts` | Constraint validation | High |
| `nlp-analyzer.ts` | Task analysis | Low |
| `behavior-learning.ts` | Pattern analysis | Medium |
| `routes/tasks.ts` | Task API | Low |
| `routes/schedule.ts` | Schedule API | Medium |

## Performance Expectations

| Operation | Time | Notes |
|-----------|------|-------|
| Create task | <200ms | NLP analysis included |
| List tasks | <50ms | Cached after first load |
| Generate schedule | <500ms | For 20 tasks, PSO runs 50 iterations |
| Update task | <100ms | Immediate local update |
| Log completion | <200ms | Analytics recalculated |

## API Quick Reference

### Create Task
```bash
curl -X POST http://localhost:8787/api/tasks \
  -H "Content-Type: application/json" \
  -H "X-User-ID: user123" \
  -d '{
    "title": "Review proposal",
    "description": "2 hour review of Q4 proposal",
    "dueDate": "2025-01-10T00:00:00Z"
  }'
```

### Generate Schedule
```bash
curl -X POST http://localhost:8787/api/schedule/generate \
  -H "Content-Type: application/json" \
  -H "X-User-ID: user123" \
  -d '{"date": "2025-01-10"}'
```

### Get Insights
```bash
curl http://localhost:8787/api/analytics/insights \
  -H "X-User-ID: user123"
```

### Log Completion
```bash
curl -X POST http://localhost:8787/api/analytics/log-completion \
  -H "Content-Type: application/json" \
  -H "X-User-ID: user123" \
  -d '{
    "taskId": "task-id-here",
    "actualDuration": 125,
    "estimatedDuration": 120,
    "difficulty": "medium"
  }'
```

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────┐
│                    React Frontend                        │
│  (Dashboard, Tasks, Schedule, Analytics, Settings)       │
└──────────────────────┬──────────────────────────────────┘
                       │ HTTP/JSON
                       ▼
┌─────────────────────────────────────────────────────────┐
│              Hono Backend (Workers)                       │
│  ┌──────────────────────────────────────────────────┐   │
│  │  Routes: /api/tasks /api/schedule /api/analytics │   │
│  └──────────────────┬───────────────────────────────┘   │
│  ┌────────────────────▼───────────────────────────────┐  │
│  │   Optimization Algorithms                          │  │
│  │  ├─ AHP: Priority calculation                      │  │
│  │  ├─ PSO: Schedule optimization                    │  │
│  │  ├─ CSP: Constraint solving                       │  │
│  │  ├─ NLP: Task analysis                            │  │
│  │  └─ Learning: Pattern analysis                    │  │
│  └──────────────────┬───────────────────────────────┘  │
└─────────────────────┼───────────────────────────────────┘
                      │ SQL
                      ▼
            ┌──────────────────────┐
            │  Cloudflare D1       │
            │  (SQLite Database)   │
            └──────────────────────┘
```

## Tips for Development

### Modify PSO Parameters

Edit `backend/src/routes/schedule.ts`:
```typescript
const optimizationParams = {
  swarmSize: 20,        // Lower = faster, less accurate
  iterations: 50,       // Higher = better schedule, slower
  inertiaWeight: 0.7,   // Lower = converges faster
  // ... more params
};
```

### Test NLP Analysis

The system automatically extracts:
- Duration: Looks for "2 hours", "30 min", "3 days"
- Difficulty: Keywords like "complex", "simple", "research"
- Category: Keywords like "work", "personal", "health"

Try these task descriptions:
- "Simple data cleanup task - 15 minutes" → easy, 15min
- "Design complex API architecture" → hard, 480min
- "Gym workout" → health category

### Debug Learning

Check what the system learned:
```bash
curl http://localhost:8787/api/analytics/insights \
  -H "X-User-ID: user123"
```

Response shows:
- Peak productivity hours
- Focus styles identified
- Estimate accuracy
- Difficulty correction factors

### Inspect Database

Install SQLite CLI:
```bash
# macOS
brew install sqlite3

# Linux
sudo apt install sqlite3

# Windows
# Download from https://www.sqlite.org/download.html
```

Query database (when using local D1):
```bash
wrangler d1 execute gsi-planner "SELECT * FROM tasks LIMIT 5"
```

## Performance Tuning

### If Schedule Generation is Slow

1. Reduce `swarmSize` (from 20 to 10)
2. Reduce `iterations` (from 50 to 25)
3. Check task count (>50 tasks needs optimization)

### If Frontend is Slow

1. Check Network tab for slow API calls
2. Add React.memo() to expensive components
3. Optimize re-renders with useCallback()
4. Use TanStack Query's staleTime setting

### If Database is Slow

1. Add indexes to D1 tables:
   ```sql
   CREATE INDEX idx_tasks_user ON tasks(user_id);
   CREATE INDEX idx_tasks_due ON tasks(due_date);
   ```
2. Limit query results
3. Cache frequently accessed data

## Resources

- **Algorithm Details**: See `IMPLEMENTATION_GUIDE.md`
- **Full Docs**: See `README.md`
- **API Schema**: See `shared/src/schemas.ts`
- **Database**: See `backend/src/db/schema.ts`

## Getting Help

1. Check error messages in browser console (F12)
2. Check server logs: `wrangler tail`
3. Review code comments in algorithm files
4. Test API endpoints with curl
5. Check TypeScript errors: `npm run type-check`

---

**Happy planning!** 🚀

Start with simple tasks, and watch the system learn your patterns over time.
