# FlowForge — Distributed Visual Workflow Automation Engine

[![CI](https://github.com/JunaidWarraich1/flowforge/actions/workflows/ci.yml/badge.svg)](https://github.com/JunaidWarraich1/flowforge/actions)
[![License: MIT](https://img.shields.io/badge/License-MIT-purple.svg)](https://opensource.org/licenses/MIT)
[![Python 3.11+](https://img.shields.io/badge/Python-3.11+-blue.svg)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.115+-009688.svg)](https://fastapi.tiangolo.com)
[![React 18](https://img.shields.io/badge/React-18-61DAFB.svg)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.5+-3178C6.svg)](https://www.typescriptlang.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-336791.svg)](https://www.postgresql.org/)

**FlowForge** is an event-driven visual workflow orchestration platform engineered for distributed pipeline execution, real-time node-level telemetry streaming, and deterministic data flow transformations. Built with **FastAPI**, **SQLAlchemy 2.0**, **PostgreSQL**, **React 18**, and **React Flow (v12)**.

---

## Architecture Overview

FlowForge decomposes visual canvas graphs into validated **Directed Acyclic Graphs (DAGs)**. Node dependencies are resolved via topological sort (Kahn's algorithm), and pipeline steps are asynchronously dispatched with granular state tracking and duplex WebSocket telemetry broadcasting.

```
┌────────────────────────────────────────────────────────────────────────┐
│                        React 18 Visual Canvas                          │
│        (React Flow v12 + Custom Nodes + Monaco Editor + Zustand)       │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ HTTP / WebSocket
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                          FastAPI Gateway                               │
│        (Bearer JWT Auth, RBAC Enforcement, Pydantic v2 Contracts)      │
└──────────────┬──────────────────────────────────────────┬──────────────┘
               │                                          │
               ▼                                          ▼
┌───────────────────────────────┐          ┌─────────────────────────────┐
│       DAG Execution Engine    │          │     PostgreSQL Datastore    │
│  - Cycle Detection & TopoSort │          │  - Relational Schemas       │
│  - Branching Condition Engine │          │  - JSONB Graph Definitions  │
│  - Node Handlers (HTTP/Code)  │          │  - Execution Logs & Audit   │
│  - Async WebSocket Broadcast  │          │  - Row-Level Access Guards  │
└───────────────────────────────┘          └─────────────────────────────┘
```

---

## Key Engineering Highlights

### 1. Robust DAG Compilation & Execution
- **Cycle Prevention:** Depth-First Search cycle detection guarantees graph acyclicity before execution begins.
- **Topological Traversal:** Deterministic execution ordering based on parent-child edge dependencies.
- **Dynamic Branching:** First-class conditional nodes evaluate boolean expressions and activate specific branches (`true`/`false`), cleanly skipping deactivated subgraphs without pipeline stalls.
- **Isolated Node Sandbox:** Python code execution nodes run in controlled lexical environments with restricted built-ins and hard execution timeouts.

### 2. High-Fidelity Real-Time Telemetry
- **Native WebSockets:** Real-time bi-directional pipeline progress streaming (`pending` ➔ `running` ➔ `completed` / `failed`).
- **Connection Multiplexing:** `ConnectionManager` isolates broadcast rooms per execution ID with automatic disconnection cleanup and dead connection reclamation.
- **Millisecond Telemetry:** Per-node execution durations, payload ingress/egress, and error stack captures recorded transactionally.

### 3. Production Backend Invariants
- **Zero Privilege Escalation:** Public registration strictly forces the standard user role; role mutations are quarantined to administrative interfaces.
- **Terminal State Immutability:** Completed, failed, and cancelled executions cannot be mutated, preserving strict audit trail integrity.
- **Decoupled Configuration:** Strict environment hygiene through `pydantic-settings` reading from `.env`, with comprehensive test suite isolation using in-memory SQLite with `StaticPool`.
- **Database Architecture:** SQLAlchemy 2.0 async sessions with `selectinload` relationship strategies to prevent `MissingGreenlet` overhead.

### 4. Human-Crafted, Non-Generic Frontend
- **Design System:** Custom dark theme (#0a0a0f deep background, #7c3aed violet accents, #06b6d4 cyan indicators) with subtle dot-grid canvas textures and glassmorphic cards.
- **Fluid Micro-Animations:** Framer Motion spring physics, pulsing execution rings on active nodes, and glowing SVG dash offsets on active data edges.
- **Monaco Code Editor:** Integrated VS Code-grade editor for custom transformation logic.

---

## Supported Node Ecosystem

| Node Type | Category | Capability |
|---|---|---|
| **Trigger** | Ingress | Workflow entry point, ingesting manual or external payloads. |
| **HTTP Request** | Integration | Dispatches outbound HTTP requests (GET, POST, PUT, DELETE, PATCH) with custom headers, query params, and JSON interpolation. |
| **Transform** | Data Processing | Maps and restructures payload fields across upstream node outputs. |
| **Condition** | Logic Branching | Multi-operator comparison (`eq`, `neq`, `gt`, `lt`, `contains`, `exists`) routing execution down discrete edge handles. |
| **Delay** | Control Flow | Asynchronous non-blocking pauses (`asyncio.sleep`) for throttling or rate-limited targets. |
| **Code** | Scripting | In-process Python expression evaluation with strict timeout guards. |
| **Log** | Utility | Dynamic string interpolation logging for observability. |

---

## Directory Structure

```
flowforge/
├── .github/
│   └── workflows/
│       └── ci.yml               # Automated GitHub Actions CI/CD matrix
├── backend/
│   ├── app/
│   │   ├── api/                 # API routing & v1 dependency injection
│   │   ├── core/                # Settings, Security, JWT tokens
│   │   ├── db/                  # Async session factories & DeclarativeBase
│   │   ├── models/              # SQLAlchemy 2.0 mapped models (User, Workflow, Execution)
│   │   ├── schemas/             # Pydantic v2 validation contracts
│   │   ├── services/
│   │   │   └── engine/          # DAG compiler, Topological sorter, Node handlers
│   │   └── main.py              # Application factory & Lifespan handler
│   ├── tests/                   # Pytest async suite (100% passing, 30 tests)
│   ├── alembic/                 # Async database migrations
│   ├── Dockerfile               # Multi-stage Python build
│   ├── pyproject.toml           # Tooling & Lint configuration
│   └── requirements.txt         # Production backend dependencies
├── frontend/
│   ├── src/
│   │   ├── api/                 # Axios clients with JWT interceptors
│   │   ├── components/
│   │   │   ├── canvas/          # React Flow canvas, node palette, config drawer
│   │   │   ├── nodes/           # 8 custom visual nodes
│   │   │   ├── layout/          # Sidebar, top navigation, shell
│   │   │   └── ui/              # Buttons, inputs, modals, stats cards
│   │   ├── pages/               # Dashboard, Editor, Executions, Settings
│   │   ├── stores/              # Zustand state slices
│   │   └── styles/              # Tailwind custom CSS & dot-grid canvas
│   ├── Dockerfile               # Multi-stage Node.js builder + Nginx Alpine
│   └── nginx.conf               # SPA routing & backend reverse-proxy
├── docker-compose.yml           # Unified local orchestration
├── ARCHITECTURE.md              # Complete technical architecture specification
└── README.md
```

---

## Quick Start (Docker Compose)

Run the full platform (PostgreSQL + FastAPI Backend + Vite Nginx Frontend) with a single command:

```bash
docker compose up --build
```

- **Frontend Application:** [http://localhost:3000](http://localhost:3000)
- **API Documentation (Swagger UI):** [http://localhost:8000/docs](http://localhost:8000/docs)
- **API Health Check:** [http://localhost:8000/health](http://localhost:8000/health)

---

## Local Development Setup

### 1. Backend

```bash
cd backend
python -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate
pip install -r requirements.txt -r requirements-test.txt

# Run migrations
alembic upgrade head

# Run automated tests
pytest -v

# Run linter
ruff check .

# Start development server
uvicorn app.main:app --reload --port 8000
```

### 2. Frontend

```bash
cd frontend
npm install

# Start Vite development server
npm run dev
```

---

## Testing & Quality Assurance

FlowForge enforces automated end-to-end verification across every layer:
- **Pytest Suite:** 30 comprehensive async tests covering authentication integrity, privilege escalation defense, DAG graph cycle detection, condition branching, and execution state immutability.
- **Ruff Linter:** Fully validated against modern Python 3.11 standards with zero lint warnings.
- **TypeScript:** Strict type checking with `tsc -b` and production bundle minification via Vite.

---

## Author

**Muhammad Junaid Warraich**  
*Full-Stack & Backend Systems Engineer*  
- **Email:** [j.warraich2004@gmail.com](mailto:j.warraich2004@gmail.com)  
- **GitHub:** [@JunaidWarraich1](https://github.com/JunaidWarraich1)  
- **LinkedIn:** [Muhammad Junaid Warraich](https://www.linkedin.com/in/muhammad-junaid-warraich-dev)  
- **Portfolio:** [myportfolio-seven-eta-43.vercel.app](https://myportfolio-seven-eta-43.vercel.app/)
