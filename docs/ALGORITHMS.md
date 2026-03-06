# Architecture & Algorithms Deep Dive

## System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│                    USER MOBILE APP (React Native)               │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Dashboard  │  Tasks  │  Calendar  │  Priorities  │ ...  │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
│  Redux Store (State Management)                                │
│  ├── tasks, schedule, priorities, timesheet, analytics         │
│  └── Connected to API via Axios                                │
│                                                                 │
└─────────────────┬───────────────────────────────────────────────┘
                  │ REST API (JSON over HTTPS)
                  │
┌─────────────────▼───────────────────────────────────────────────┐
│                                                                 │
│              BACKEND API SERVER (Flask + Python)                │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ Route Handlers & Business Logic                          │  │
│  ├── /api/tasks, /api/schedule, /api/priorities, ...        │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ Optimization Algorithms                                  │  │
│  ├── PSO (Particle Swarm Optimization)                      │  │
│  ├── CSP (Constraint Satisfaction Problem)                  │  │
│  ├── AHP (Analytic Hierarchy Process)                       │  │
│  ├── TaskAnalyzer (NLP)                                     │  │
│  └── BehaviorLearner (ML)                                   │  │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ Database Layer (SQLAlchemy ORM)                          │  │
│  ├── Tasks, TimeEntries, UserPreferences, ...               │  │
│  └── SQLite (dev) / PostgreSQL (prod)                       │  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## 1. Particle Swarm Optimization (PSO)

### Problem Statement
Given N tasks with:
- Estimated duration
- Deadline
- Difficulty level
- Category

Find the optimal ordering that maximizes:
- On-time completion
- Task difficulty distribution
- Category grouping
- Energy efficiency

### Algorithm Details

**Initialization:**
```
For each particle i:
    position[i] = random permutation of [0, 1, ..., N-1]
    velocity[i] = random value in [-4, 4]
    fitness[i] = calculate_fitness(position[i])
    best_position[i] = position[i]
    best_fitness[i] = fitness[i]

global_best = particle with minimum fitness
```

**Fitness Function:**
```
fitness(ordering) = sum of:
    
1. Deadline Penalties:
   for each task in ordering:
       if completion_time > deadline:
           fitness += (hours_late × 100)
   
2. Difficulty Distribution:
   for each task:
       if difficulty == "hard" AND time_in_day > 6_hours:
           fitness += 50  # penalty for hard tasks late in day
   
3. Category Grouping:
   for consecutive tasks:
       if task[i].category == task[i-1].category:
           fitness -= 5   # bonus for grouping same category
   
4. Work Hours Constraint:
   if any task exceeds work_end_time:
       fitness += (hours_over × 200)
```

**Update Equations:**
```
For each iteration t from 1 to max_iterations:
    
    w(t) = w_start - (w_start - w_end) × (t / max_iterations)
    
    For each particle i:
        For each dimension d:
            r1 = random(0, 1)
            r2 = random(0, 1)
            
            velocity[i][d] = (
                w × velocity[i][d] +
                c1 × r1 × (best_position[i][d] - position[i][d]) +
                c2 × r2 × (global_best[d] - position[i][d])
            )
            
            # Discrete update (swap operation for permutation)
            if random() < abs(velocity[i][d]) / 4:
                swap two random positions in position[i]
        
        new_fitness = calculate_fitness(position[i])
        
        if new_fitness < best_fitness[i]:
            best_position[i] = position[i]
            best_fitness[i] = new_fitness
        
        if new_fitness < global_fitness:
            global_best = position[i]
            global_fitness = new_fitness
```

**Convergence Criteria:**
```
if iteration > 20:
    recent_improvement = history[-5] - history[-1]
    if recent_improvement < 0.001:
        break  # Stop early if converged
```

### Configuration
```python
num_particles = 30          # Swarm population size
max_iterations = 100        # Maximum iterations
w_start = 0.9              # Initial inertia weight (exploration)
w_end = 0.4                # Final inertia weight (exploitation)
c1 = 2.0                   # Cognitive parameter (personal best)
c2 = 2.0                   # Social parameter (global best)
max_velocity = 4.0         # Maximum velocity threshold
```

### Output
Optimized task ordering with schedule times:
```json
[
    {
        "taskId": "task1",
        "title": "Important meeting",
        "startTime": "09:00",
        "endTime": "10:00",
        "difficulty": "hard"
    },
    {
        "taskId": "task2",
        "title": "Email review",
        "startTime": "10:05",
        "endTime": "10:25",
        "difficulty": "easy"
    }
]
```

---

## 2. Constraint Satisfaction Problem (CSP)

### Constraints

#### Hard Constraints (Must Satisfy)
1. **No Overlaps**: No two tasks can overlap in time
2. **Work Hours**: All tasks must fit within work_hours
3. **Deadlines**: All tasks must complete before their deadline
4. **Dependencies**: Tasks with dependencies complete after dependencies

#### Soft Constraints (Try to Optimize)
1. **Breaks**: Add 5-15 minute breaks between tasks
2. **Difficulty Balance**: Alternate easy/hard tasks
3. **Category Grouping**: Keep similar categories together

### Algorithm

**Approach: Constraint Propagation + Backtracking**

```python
def solve_csp(tasks, work_hours, deadlines):
    
    # 1. Resolve overlaps
    schedule = resolve_overlaps(tasks)
    
    # 2. Enforce work hours
    schedule = enforce_work_hours(schedule, work_hours)
    
    # 3. Satisfy deadlines
    schedule = satisfy_deadlines(schedule, deadlines)
    
    # 4. Respect dependencies
    schedule = satisfy_dependencies(schedule)
    
    # 5. Apply soft constraints
    schedule = add_breaks(schedule)
    schedule = balance_difficulty(schedule)
    schedule = group_by_category(schedule)
    
    return schedule
```

**Detail: Resolve Overlaps**
```
For i = 0 to len(schedule)-1:
    current = schedule[i]
    if i < len(schedule)-1:
        next_task = schedule[i+1]
        if current.end_time > next_task.start_time:
            # Shift next task
            gap = current.end_time - next_task.start_time
            next_task.start_time += gap
            next_task.end_time += gap
```

**Detail: Enforce Deadlines**
```
Sort tasks by deadline (earliest first)

For each task in sorted order:
    completion_time = current_time + task.duration
    
    if deadline exists and completion_time > deadline:
        if can_fit_before_deadline:
            reschedule task to fit
        else:
            skip task (infeasible)
    
    current_time = completion_time
```

**Detail: Validate Constraint**
```python
def validate(schedule):
    violations = []
    
    # Check hard constraints
    for constraint in hard_constraints:
        if violates(constraint, schedule):
            violations.append(constraint.name)
    
    return len(violations) == 0, violations
```

---

## 3. Analytic Hierarchy Process (AHP)

### Problem Statement
Rank N tasks based on multiple criteria:
- Urgency (deadline proximity)
- Importance (difficulty/impact)
- Duration (time required)
- Alignment (category relatedness)

### The AHP Method

**Step 1: Normalize Criteria**
```
For each task:
    urgency_score = 1 - (days_until_deadline / max_days)
    importance_score = difficulty_to_score(difficulty)
    duration_score = 1 - (duration / max_duration)
    alignment_score = count_same_category_tasks() × 0.2
```

**Step 2: Build Pairwise Comparison Matrix**
```
       Urgency  Importance  Duration  Alignment
Urgency    1      1.3         2.5        2.5
Importance 0.77    1          2.0        2.0
Duration   0.4    0.5         1          1.0
Alignment  0.4    0.5         1          1

Values based on Saaty's 9-point scale:
1 = Equal importance
3 = Weak importance
5 = Strong importance
7 = Very strong importance
9 = Absolute importance
```

**Step 3: Calculate Weights (Eigenvector)**
```
1. Normalize each column
2. Average each row
3. Result: weights vector

Standard weights:
- Urgency: 0.40 (40%)
- Importance: 0.30 (30%)
- Duration: 0.15 (15%)
- Alignment: 0.15 (15%)
```

**Step 4: Calculate Consistency Ratio (CR)**
```
λ_max = largest eigenvalue of matrix
CI = (λ_max - n) / (n - 1)
RI = Random Index (from table)
CR = CI / RI

If CR < 0.1: Consistency is acceptable
```

**Step 5: Calculate Priority Score**
```
For each task:
    priority_score = (
        urgency_score × 0.40 +
        importance_score × 0.30 +
        duration_score × 0.15 +
        alignment_score × 0.15
    )

Rank tasks by priority_score (descending)
```

### Dynamic Re-ranking

AHP weights adjust based on learned user patterns:

```python
def adjust_weights(patterns):
    weights = default_weights.copy()
    
    if patterns['urgent_first_preference']:
        weights['urgency'] = 0.50
        weights['importance'] = 0.25
    
    if patterns['prefer_batching']:
        weights['alignment'] = 0.25
        weights['urgency'] = 0.35
    
    # Normalize to sum = 1.0
    total = sum(weights.values())
    return {k: v/total for k, v in weights.items()}
```

### Consistency Check
```python
def calculate_consistency_ratio(matrix):
    eigenvalues = np.linalg.eigvals(matrix)
    lambda_max = np.max(np.real(eigenvalues))
    
    n = len(matrix)
    ci = (lambda_max - n) / (n - 1)
    
    # Random Index from Saaty's table
    ri_table = {3: 0.58, 4: 0.90, 5: 1.12, ...}
    ri = ri_table[n]
    
    cr = ci / ri
    return cr  # Should be < 0.1 for good consistency
```

---

## 4. Task Analyzer (NLP)

### Purpose
Automatically extract:
- Estimated duration
- Difficulty level
- Category
- Initial priority score

### NLP Techniques

**Keyword Matching:**
```python
difficulty_keywords = {
    'easy': ['simple', 'quick', 'basic', 'trivial', 'routine'],
    'medium': ['normal', 'standard', 'implement', 'develop', 'create'],
    'hard': ['complex', 'challenging', 'research', 'architect', 'optimize']
}

category_keywords = {
    'work': ['meeting', 'project', 'deadline', 'code', 'develop'],
    'personal': ['family', 'household', 'doctor', 'car', 'shopping'],
    'learning': ['learn', 'study', 'course', 'tutorial', 'research'],
    ...
}
```

**Duration Extraction:**
```python
patterns = [
    r'(\d+)\s*hours?',           # Matches "2 hours"
    r'(\d+)\s*minutes?',         # Matches "30 minutes"
    r'(\d+)h\s*(\d+)m',          # Matches "2h 30m"
]

# If no explicit duration found:
# - "quick" → 15 min
# - "research" → 120 min
# - else → 30 min (default)
```

**Priority Calculation:**
```
base_score = 0.5

if difficulty == 'hard':
    score += 0.2
elif difficulty == 'easy':
    score -= 0.1

if deadline <= 1 day:
    score += 0.3
elif deadline <= 3 days:
    score += 0.2
elif deadline <= 7 days:
    score += 0.1

if category == 'work':
    score += 0.1
elif category == 'personal':
    score -= 0.05

final_score = clamp(score, 0, 1)
```

---

## 5. Behavior Learner (Machine Learning)

### Metrics Tracked

1. **Completion Rate**
   - % of tasks completed per period
   - Trend over time

2. **Time Estimation Accuracy**
   ```
   error = actual_duration - estimated_duration
   accuracy = 1.0 - abs(error) / estimated_duration
   ```

3. **Peak Productivity Hours**
   ```
   For each hour of day:
       productivity_score = completed_tasks_in_hour / total_tasks_in_hour
   
   Find top 5 hours with highest scores
   ```

4. **Work Patterns**
   ```
   - Preferred start/end hours
   - Average break duration
   - Most active day of week
   - Total hours worked per week
   ```

5. **Time by Difficulty**
   ```
   For each difficulty level:
       average_time = mean(actual_durations)
       median_time = median(actual_durations)
       total_time = sum(actual_durations)
   ```

### Learning Over Time

**Apprentice Level Scoring:**
```
score = 0.5

if completion_rate >= 0.8:
    score += 0.3
elif completion_rate > 30 sessions:
    score += 0.2
else:
    score += 0.1

if completion_rate >= 0.7:
    return "Master"
elif completion_rate >= 0.5:
    return "Journeyman"
else:
    return "Apprentice"
```

### Adaptive Recommendations
```python
def get_insights(metrics):
    insights = []
    
    if completion_rate > 0.8:
        insights.append("Excellent completion rate!")
    
    if completion_rate < 0.5:
        insights.append("Try breaking tasks into smaller pieces")
    
    if peak_hours:
        insights.append(f"Peak productivity: {peak_hours[0]['hour']}:00")
    
    if avg_work_hours > 50:
        insights.append("You're working 50+ hours/week - consider reducing workload")
    
    return insights
```

---

## Performance Characteristics

### Time Complexity
- **PSO**: O(max_iterations × num_particles × num_tasks)
  - Typical: 100 × 30 × 50 = 150,000 operations
- **CSP**: O(num_tasks²) for constraint checking
- **AHP**: O(num_tasks) for scoring

### Space Complexity
- **PSO**: O(num_particles × num_tasks)
- **CSP**: O(num_tasks²) for consistency matrix
- **AHP**: O(num_tasks) for scoring

### Typical Execution Times
- Schedule generation: 100-500ms
- Priority calculation: 50-200ms
- Analytics update: 200-1000ms

### Scalability
- Tested up to 500 tasks per user
- Works well with 30-300 tasks (sweet spot)
- PSO converges faster with fewer particles

---

## Integration Points

### Frontend → Backend
```
User Action → Redux Dispatch → Axios API Call → Backend Route
```

### Algorithm Pipeline
```
Input Tasks → TaskAnalyzer → PSO Ordering → CSP Validation → Schedule Output
```

### Learning Loop
```
TimeEntry Created → BehaviorLearner → Pattern Analysis → Weight Adjustment → AHP Re-rank
```

---

## Tuning & Configuration

### For More Optimization
```python
PSO_PARTICLES = 50        # More particles = slower but more accurate
PSO_ITERATIONS = 200      # More iterations = slower but better optimization
PSO_INERTIA_START = 0.95  # Higher = more exploration
```

### For Faster Response
```python
PSO_PARTICLES = 20        # Fewer particles = faster
PSO_ITERATIONS = 50       # Fewer iterations = faster
```

### For User-Specific Tuning
```python
if user.prefers_speed:
    particles = 20
    iterations = 50
elif user.prefers_accuracy:
    particles = 50
    iterations = 150
else:  # balanced (default)
    particles = 30
    iterations = 100
```

---

## References

1. Kennedy, J., & Eberhart, R. (1995). "Particle Swarm Optimization"
2. Tsang, E. (1993). "Foundations of Constraint Satisfaction"
3. Saaty, T. L. (2008). "Decision Making with the Analytic Hierarchy Process"
4. Natural Language Processing for task analysis
5. Time-series analysis for behavior learning

