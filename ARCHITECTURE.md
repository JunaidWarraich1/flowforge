# FlowForge — Architecture & API Contract

## Overview
FlowForge is a visual workflow automation engine. Users build automation
pipelines by connecting nodes on a drag-and-drop canvas, then execute
them with real-time step-by-step visualization.

---

## Tech Stack
- **Backend:** Python 3.11+, FastAPI, SQLAlchemy 2.0, Alembic, PostgreSQL (Neon)
- **Frontend:** React 18, TypeScript, Vite, Tailwind CSS, @xyflow/react (React Flow), Zustand, Framer Motion, Lucide React, Monaco Editor
- **Auth:** JWT (access + refresh tokens), bcrypt
- **Real-time:** WebSocket (FastAPI native)
- **Deploy:** Docker Compose, GitHub Actions CI/CD

---

## Database Schema (PostgreSQL)

### users
| Column | Type | Constraints |
|---|---|---|
| id | UUID | PK, default gen |
| email | VARCHAR(255) | UNIQUE, NOT NULL |
| full_name | VARCHAR(100) | NOT NULL |
| hashed_password | VARCHAR(255) | NOT NULL |
| role | ENUM('user','admin') | DEFAULT 'user' |
| created_at | TIMESTAMPTZ | DEFAULT now() |

### workflows
| Column | Type | Constraints |
|---|---|---|
| id | UUID | PK, default gen |
| user_id | UUID | FK → users.id, NOT NULL |
| name | VARCHAR(200) | NOT NULL |
| description | TEXT | NULLABLE |
| status | ENUM('draft','active','archived') | DEFAULT 'draft' |
| graph | JSONB | NOT NULL, DEFAULT '{"nodes":[],"edges":[]}' |
| version | INTEGER | DEFAULT 1 |
| created_at | TIMESTAMPTZ | DEFAULT now() |
| updated_at | TIMESTAMPTZ | DEFAULT now(), on update |

### executions
| Column | Type | Constraints |
|---|---|---|
| id | UUID | PK, default gen |
| workflow_id | UUID | FK → workflows.id, NOT NULL |
| status | ENUM('pending','running','completed','failed','cancelled') | DEFAULT 'pending' |
| triggered_by | VARCHAR(20) | DEFAULT 'manual' |
| input_data | JSONB | NULLABLE |
| started_at | TIMESTAMPTZ | NULLABLE |
| finished_at | TIMESTAMPTZ | NULLABLE |
| error | TEXT | NULLABLE |

### node_executions
| Column | Type | Constraints |
|---|---|---|
| id | UUID | PK, default gen |
| execution_id | UUID | FK → executions.id, NOT NULL |
| node_id | VARCHAR(100) | NOT NULL (matches graph node id) |
| node_type | VARCHAR(50) | NOT NULL |
| status | ENUM('pending','running','completed','failed','skipped') | DEFAULT 'pending' |
| input_data | JSONB | NULLABLE |
| output_data | JSONB | NULLABLE |
| started_at | TIMESTAMPTZ | NULLABLE |
| finished_at | TIMESTAMPTZ | NULLABLE |
| duration_ms | INTEGER | NULLABLE |
| error | TEXT | NULLABLE |

---

## API Endpoints

### Auth
```
POST /api/v1/auth/register
  Body: { email, full_name, password }
  Response: { id, email, full_name, role, created_at }
  Notes: role always forced to "user"

POST /api/v1/auth/login
  Body: { email, password }  (OAuth2 form: username=email, password=password)
  Response: { access_token, refresh_token, token_type: "bearer" }

GET /api/v1/auth/me
  Headers: Authorization: Bearer <token>
  Response: { id, email, full_name, role, created_at }
```

### Workflows
```
GET /api/v1/workflows
  Query: ?status=draft|active|archived&search=<name>&page=1&limit=20
  Response: { items: [WorkflowSummary], total, page, pages }

POST /api/v1/workflows
  Body: { name, description?, graph? }
  Response: Workflow (full)

GET /api/v1/workflows/{id}
  Response: Workflow (full, includes graph)

PUT /api/v1/workflows/{id}
  Body: { name?, description?, status?, graph? }
  Response: Workflow (full)
  Notes: version auto-increments on graph change

DELETE /api/v1/workflows/{id}
  Response: 204

POST /api/v1/workflows/{id}/execute
  Body: { input_data?: {} }
  Response: Execution (with status "pending")
  Notes: Kicks off async execution, returns immediately
```

### Executions
```
GET /api/v1/executions
  Query: ?workflow_id=<uuid>&status=<status>&page=1&limit=20
  Response: { items: [ExecutionSummary], total, page, pages }

GET /api/v1/executions/{id}
  Response: Execution (full, includes node_executions array)
```

### WebSocket
```
WS /api/v1/ws/executions/{execution_id}?token=<jwt>
  Server sends JSON messages:
    { type: "execution_status", data: { status, started_at?, finished_at?, error? } }
    { type: "node_status", data: { node_id, status, input_data?, output_data?, duration_ms?, error? } }
    { type: "execution_complete", data: { status, finished_at } }
```

### Dashboard Stats
```
GET /api/v1/dashboard/stats
  Response: {
    total_workflows: int,
    active_workflows: int,
    total_executions: int,
    successful_executions: int,
    failed_executions: int,
    avg_execution_time_ms: float,
    recent_executions: [ExecutionSummary] (last 10)
  }
```

---

## Graph Schema (JSONB in workflows.graph)

```json
{
  "nodes": [
    {
      "id": "node_1",
      "type": "http_request",
      "position": { "x": 250, "y": 100 },
      "data": {
        "label": "Fetch Users",
        "config": {
          "url": "https://jsonplaceholder.typicode.com/users",
          "method": "GET",
          "headers": {},
          "body": null,
          "timeout_seconds": 30
        }
      }
    }
  ],
  "edges": [
    {
      "id": "edge_1",
      "source": "node_1",
      "target": "node_2",
      "sourceHandle": null,
      "targetHandle": null,
      "label": null
    }
  ]
}
```

### Node Types & Configs

**trigger** — Start node, every workflow needs one
```json
{ "trigger_type": "manual" }
```

**http_request** — Make an HTTP call
```json
{
  "url": "https://...",
  "method": "GET|POST|PUT|DELETE|PATCH",
  "headers": { "Content-Type": "application/json" },
  "body": "{ ... }",
  "timeout_seconds": 30
}
```

**transform** — Transform data with field mapping
```json
{
  "expression": "jmespath or simple mapping",
  "mappings": [
    { "source": "$.data.users", "target": "$.users" }
  ]
}
```

**condition** — Branch based on a condition (has "true" and "false" output handles)
```json
{
  "field": "$.status_code",
  "operator": "eq|neq|gt|lt|gte|lte|contains|exists",
  "value": 200
}
```

**delay** — Wait N seconds
```json
{ "seconds": 5 }
```

**code** — Execute a Python expression
```json
{
  "code": "result = [u for u in input_data['users'] if u['active']]",
  "timeout_seconds": 10
}
```

**log** — Log a message
```json
{
  "message": "Processing complete: {$.count} items",
  "level": "info|warning|error"
}
```

---

## Execution Engine Logic

1. Parse workflow graph into a DAG
2. Topological sort to determine execution order
3. Start from trigger node
4. For each node (in order):
   a. Set node status → "running", broadcast via WebSocket
   b. Execute node logic with input data from parent nodes
   c. Set node status → "completed" or "failed", broadcast
   d. If condition node: follow "true" or "false" branch
   e. Pass output_data to downstream nodes as their input
5. When all nodes done: set execution status → "completed" or "failed"

---

## Frontend Design System

### Colors (Custom — NOT default Tailwind)
- **Background:** #0a0a0f (deep dark), #111118 (card), #1a1a25 (elevated)
- **Primary:** #7c3aed (violet-600) → #8b5cf6 (violet-500 hover)
- **Accent:** #06b6d4 (cyan-500) → #22d3ee (cyan-400)
- **Success:** #10b981 (emerald-500)
- **Warning:** #f59e0b (amber-500)
- **Error:** #ef4444 (red-500)
- **Text:** #f1f5f9 (slate-100), #94a3b8 (slate-400 muted)
- **Border:** #1e293b (slate-800)

### Canvas
- Dot-grid background pattern (#1a1a25 dots on #0a0a0f)
- Custom node cards with colored left border per type
- Animated edges during execution (dashed → flowing)
- Glow effect on active/running nodes

### Node Colors
- trigger: cyan (#06b6d4)
- http_request: blue (#3b82f6)
- transform: violet (#8b5cf6)
- condition: amber (#f59e0b)
- delay: slate (#64748b)
- code: emerald (#10b981)
- log: rose (#f43f5e)

### Typography
- Font: Inter (import from Google Fonts)
- Monospace: JetBrains Mono (for code/data)

### Animations (Framer Motion)
- Page transitions: fade + slide up (200ms)
- Node appear: scale from 0.8 + fade (150ms)
- Execution pulse: ring animation on running nodes
- Edge flow: animated dash offset during execution
- Modal: backdrop blur + scale (200ms)
- Sidebar: slide in from left (250ms)
- Stats counters: count-up animation on dashboard

---

## Pages

1. **Login / Register** — Clean split-screen (form left, gradient illustration right)
2. **Dashboard** — Stats cards (animated counters), recent executions table, quick-create workflow button
3. **Workflows List** — Grid of workflow cards with status badges, search/filter
4. **Workflow Editor** (main canvas page):
   - Left sidebar: node palette (draggable node types)
   - Center: React Flow canvas
   - Right panel: node configuration (appears when node selected)
   - Top bar: workflow name (editable), save button, execute button
   - Bottom bar: minimap, zoom controls
5. **Execution Viewer** — Split view: left = workflow graph (read-only, animated), right = execution timeline with node logs
6. **Settings** — Profile, change password
