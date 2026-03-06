# GSI Planner API Documentation

## Base URL
```
http://localhost:8000/api
```

## Authentication
Currently uses placeholder `User-ID` header. Implement JWT in production.

```bash
curl -H "User-ID: user123" http://localhost:8000/api/tasks
```

---

## Endpoints

### Tasks Management

#### GET /tasks
Fetch all tasks for the current user

**Query Parameters:**
- `status` (optional): `pending|completed|all`
- `category` (optional): Filter by category
- `sort` (optional): `deadline|priority|created`

**Response:**
```json
[
  {
    "id": "uuid",
    "title": "Implement user auth",
    "description": "Add JWT authentication",
    "dueDate": "2024-12-15T18:00:00",
    "estimatedDuration": 120,
    "actualDuration": null,
    "difficulty": "hard",
    "category": "work",
    "priorityScore": 0.85,
    "completed": false,
    "createdAt": "2024-12-01T10:00:00",
    "updatedAt": "2024-12-01T10:00:00",
    "dependencies": [],
    "tags": ["backend", "security"]
  }
]
```

#### POST /tasks
Create a new task with AI analysis

**Request Body:**
```json
{
  "title": "Review code PR",
  "description": "Review the authentication PR with focus on security",
  "dueDate": "2024-12-05T17:00:00"
}
```

**Response:** `201 Created`
```json
{
  "id": "new-uuid",
  "title": "Review code PR",
  "description": "Review the authentication PR with focus on security",
  "dueDate": "2024-12-05T17:00:00",
  "estimatedDuration": 45,
  "difficulty": "medium",
  "category": "work",
  "priorityScore": 0.72,
  "completed": false,
  "createdAt": "2024-12-01T11:30:00",
  "updatedAt": "2024-12-01T11:30:00",
  "dependencies": [],
  "tags": []
}
```

#### PUT /tasks/{id}
Update an existing task

**Request Body:**
```json
{
  "title": "Review code PR",
  "completed": true,
  "estimatedDuration": 60
}
```

**Response:** `200 OK`

#### DELETE /tasks/{id}
Delete a task

**Response:** `200 OK`
```json
{ "message": "Task deleted" }
```

---

### Schedule Optimization

#### POST /schedule/generate
Generate an AI-optimized schedule using PSO + CSP

**Request Body:**
```json
{
  "tasks": [
    {
      "id": "task1",
      "title": "Task 1",
      "estimatedDuration": 30,
      "dueDate": "2024-12-05T18:00:00",
      "difficulty": "medium",
      "category": "work"
    }
  ],
  "settings": {
    "workHours": {
      "start": "09:00",
      "end": "18:00"
    }
  }
}
```

**Response:** `200 OK`
```json
{
  "schedule": [
    {
      "title": "Important task",
      "taskId": "task1",
      "startTime": "09:00",
      "endTime": "09:30",
      "duration": 30,
      "category": "work",
      "difficulty": "hard"
    },
    {
      "title": "Medium task",
      "taskId": "task2",
      "startTime": "09:35",
      "endTime": "10:05",
      "duration": 30,
      "category": "work",
      "difficulty": "medium"
    }
  ],
  "generatedAt": "2024-12-01T10:15:00",
  "algorithm": "PSO + CSP",
  "optimizationScore": 0.92
}
```

**Algorithm Details:**
- Uses Particle Swarm Optimization to find best task ordering
- Applies Constraint Satisfaction to enforce hard constraints
- Considers:
  - Deadline constraints
  - Work hours limits
  - Task dependencies
  - Difficulty distribution
  - Category grouping
  - Energy levels throughout day

#### POST /schedule/validate
Validate a schedule against all constraints

**Request Body:**
```json
{
  "schedule": [
    {
      "taskId": "task1",
      "startTime": "09:00",
      "endTime": "09:30"
    }
  ]
}
```

**Response:** `200 OK`
```json
{
  "valid": true,
  "violations": []
}
```

Or if invalid:
```json
{
  "valid": false,
  "violations": [
    "Hard constraint violated: deadline",
    "Hard constraint violated: work_hours"
  ]
}
```

---

### Priority Calculation (AHP)

#### POST /priorities/calculate
Calculate task priorities using Analytic Hierarchy Process

**Request Body:**
```json
{
  "tasks": [
    {
      "id": "task1",
      "title": "Task 1",
      "dueDate": "2024-12-02T18:00:00",
      "difficulty": "hard",
      "estimatedDuration": 120,
      "category": "work"
    }
  ]
}
```

**Response:** `200 OK`
```json
{
  "ranked": [
    {
      "id": "task1",
      "title": "Task 1",
      "priority": 0.89,
      "scores": {
        "urgency": 0.95,
        "importance": 0.85,
        "duration": 0.70,
        "alignment": 0.75
      }
    }
  ],
  "weights": {
    "urgency": 0.40,
    "importance": 0.30,
    "duration": 0.15,
    "alignment": 0.15
  },
  "algorithm": "Analytic Hierarchy Process (AHP)"
}
```

**AHP Criteria:**
- **Urgency (40%)**: How soon the deadline
- **Importance (30%)**: Difficulty/impact level
- **Duration (15%)**: Time required (shorter = better)
- **Alignment (15%)**: Related to other tasks in same category

#### GET /priorities/top-picks
Get AI's smart "Top Picks" recommendations for today

**Response:** `200 OK`
```json
[
  {
    "id": "task1",
    "title": "Fix critical bug",
    "priority": 0.95,
    "urgency": "2024-12-01T17:00:00"
  },
  {
    "id": "task2",
    "title": "Code review",
    "priority": 0.82,
    "urgency": "2024-12-02T18:00:00"
  }
]
```

---

### Timesheet & Tracking

#### POST /timesheet/start
Start tracking time for a task

**Request Body:**
```json
{
  "taskId": "task-uuid"
}
```

**Response:** `201 Created`
```json
{
  "entryId": "entry-uuid",
  "taskId": "task-uuid",
  "startTime": "2024-12-01T14:30:00"
}
```

#### POST /timesheet/stop/{entryId}
Stop tracking time

**Response:** `200 OK`
```json
{
  "entryId": "entry-uuid",
  "duration": 45,
  "taskId": "task-uuid"
}
```

#### GET /timesheet/entries
Get timesheet entries

**Query Parameters:**
- `days` (optional): Number of days to retrieve (default: 7)

**Response:** `200 OK`
```json
[
  {
    "id": "entry-uuid",
    "taskId": "task-uuid",
    "startTime": "2024-12-01T14:30:00",
    "endTime": "2024-12-01T15:15:00",
    "duration": 45,
    "createdAt": "2024-12-01T14:30:00"
  }
]
```

#### GET /timesheet/statistics
Get timesheet statistics

**Query Parameters:**
- `days` (optional): Number of days (default: 30)

**Response:** `200 OK`
```json
{
  "totalTime": 145.5,
  "byCategory": {
    "work": 120,
    "personal": 25.5
  },
  "byCategoryWithStats": {
    "work": {
      "totalMinutes": 7200,
      "taskCount": 15,
      "averageMinutes": 480
    }
  },
  "streaks": {
    "longestCompletion": 8,
    "currentStreak": 5
  }
}
```

---

### Analytics & Behavior Learning

#### GET /analytics/behavior
Get behavior analysis and AI insights

**Response:** `200 OK`
```json
{
  "completionRate": 0.82,
  "peakHours": [
    {
      "hour": 10,
      "productivity": 0.95,
      "timeSlot": "10:00-11:00"
    },
    {
      "hour": 9,
      "productivity": 0.90,
      "timeSlot": "09:00-10:00"
    }
  ],
  "workPatterns": {
    "preferredStartHour": 9,
    "preferredEndHour": 17,
    "averageBreakDuration": 15,
    "mostActiveDay": "Wednesday",
    "sessionCount": 45,
    "totalHoursWorked": 187.5
  },
  "timeByDifficulty": {
    "easy": {
      "averageMinutes": 25,
      "medianMinutes": 20,
      "totalMinutes": 250,
      "taskCount": 10
    },
    "medium": {
      "averageMinutes": 45,
      "medianMinutes": 40,
      "totalMinutes": 900,
      "taskCount": 20
    },
    "hard": {
      "averageMinutes": 95,
      "medianMinutes": 90,
      "totalMinutes": 1900,
      "taskCount": 20
    }
  },
  "learnings": {
    "insights": [
      {
        "type": "positive",
        "message": "Excellent completion rate! You're finishing 82% of your tasks."
      },
      {
        "type": "tip",
        "message": "Your peak productivity is around 10:00. Schedule important tasks then."
      }
    ],
    "apprenticeLevel": "Journeyman"
  }
}
```

#### GET /analytics/statistics
Get comprehensive statistics

**Query Parameters:**
- `days` (optional): Number of days (default: 30)

**Response:** `200 OK`
```json
{
  "period": "Last 30 days",
  "totalTasks": 45,
  "completedTasks": 37,
  "completionRate": 0.82,
  "totalHoursWorked": 187.5,
  "averageTimePerTask": 2.45,
  "estimateAccuracy": {
    "averageDifference": 12.5,
    "tendency": "underestimate",
    "accuracy": 0.85
  },
  "topCategory": "work",
  "averageDifficulty": "medium"
}
```

---

### Settings & Preferences

#### GET /settings
Get user settings

**Response:** `200 OK`
```json
{
  "userId": "user123",
  "workHours": {
    "start": "09:00",
    "end": "18:00"
  },
  "theme": "dark",
  "notificationsEnabled": true,
  "peakProductivityHours": ["09:00-12:00", "14:00-16:00"],
  "focusStyles": ["pomodoro", "deep-work"],
  "timezone": "America/New_York",
  "breakDuration": 15,
  "minTaskDuration": 15,
  "maxTasksPerDay": 10
}
```

#### PUT /settings
Update user settings

**Request Body:**
```json
{
  "theme": "light",
  "workHours": {
    "start": "08:00",
    "end": "17:00"
  },
  "breakDuration": 20,
  "maxTasksPerDay": 8
}
```

**Response:** `200 OK` with updated settings

---

### Health Check

#### GET /health
System health check

**Response:** `200 OK`
```json
{
  "status": "ok",
  "timestamp": "2024-12-01T10:15:00"
}
```

---

## Error Responses

### 400 Bad Request
```json
{
  "error": "Invalid request body",
  "details": "Field 'title' is required"
}
```

### 401 Unauthorized
```json
{
  "error": "Unauthorized",
  "message": "Missing or invalid User-ID header"
}
```

### 404 Not Found
```json
{
  "error": "Task not found"
}
```

### 500 Internal Server Error
```json
{
  "error": "Internal server error",
  "timestamp": "2024-12-01T10:15:00"
}
```

---

## Rate Limiting

- 100 requests per minute per user
- 1000 requests per hour per user

Rate limit headers:
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1701426600
```

---

## Webhook Events

(Optional - for future implementation)

```
- task.created
- task.completed
- schedule.generated
- priority.changed
- behavior.updated
```

---

## Examples

### Complete Task Creation Workflow

```bash
# 1. Create task (AI analyzes automatically)
curl -X POST http://localhost:8000/api/tasks \
  -H "User-ID: user123" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Implement payment processing",
    "description": "Add Stripe integration with webhook support",
    "dueDate": "2024-12-10T18:00:00"
  }'

# Response includes AI-extracted:
# - estimatedDuration: 480 (8 hours)
# - difficulty: "hard"
# - category: "work"
# - priorityScore: 0.88
```

### Generate Optimized Schedule

```bash
# 2. Get all tasks
curl -X GET http://localhost:8000/api/tasks \
  -H "User-ID: user123"

# 3. Generate optimal schedule
curl -X POST http://localhost:8000/api/schedule/generate \
  -H "User-ID: user123" \
  -H "Content-Type: application/json" \
  -d '{
    "tasks": [...],
    "settings": {
      "workHours": {"start": "09:00", "end": "18:00"}
    }
  }'

# Response: Optimized schedule with:
# - Hard tasks early (high energy)
# - Grouped by category
# - Respects all constraints
# - Optimization score: 0.92
```

### Track Time & Get Analytics

```bash
# 4. Start timer for a task
curl -X POST http://localhost:8000/api/timesheet/start \
  -H "User-ID: user123" \
  -H "Content-Type: application/json" \
  -d '{"taskId": "task-uuid"}'

# ... work on task ...

# 5. Stop timer
curl -X POST http://localhost:8000/api/timesheet/stop/entry-uuid \
  -H "User-ID: user123"

# 6. Get behavior insights (system learns over time)
curl -X GET http://localhost:8000/api/analytics/behavior \
  -H "User-ID: user123"
```

---

## WebSocket Support (Future)

For real-time updates:
```
ws://localhost:8000/ws/user/{userId}

Events:
- schedule.updated
- task.added
- timer.started
- analytics.refreshed
```

---

Last Updated: 2024-12-01
API Version: 1.0.0
