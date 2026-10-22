# OSS Compass

> **Navigate open-source codebases with confidence. Discover suitable repositories, visualize architecture, explore issues, and prepare grounded, evidence-based contributions powered by Gemma 4.**

OSS Compass transforms the intimidating open-source contribution cold start into a clear, guided journey:
$$\text{Your Skills} \longrightarrow \text{Repo Discovery} \longrightarrow \text{Interactive Architecture Graph} \longrightarrow \text{Issue Match} \longrightarrow \text{Gemma 4 Plan} \longrightarrow \text{IssueProof Generation}$$

---

## 🌟 Core Features

- **Personalized Repository Discovery**: Discover public GitHub repositories and GSoC participating organizations matching your programming languages, frameworks, and experience level with explainable match scores (0–100) and potential friction warnings.
- **Progressive Repository Preparation**: Lightweight metadata renders immediately, while deep repository trees, READMEs, issues, and contributor graphs are progressively prepared in the background via **Trigger.dev Cloud**.
- **Interactive Codebase Graph**: Powered by **React Flow / XYFlow**, displaying real AST import relationships (`is_inferred: false`) in contrast to module structural co-location (`is_inferred: true`). Includes a live node inspector and file search.
- **Gemma 4 Guided Contribution Plans**: Powered by Google's **Gemma 4** (`gemma-4-31b-it` via Google GenAI Python SDK). Generates plain-language problem summaries, prerequisite checklists, affected file suggestions, and step-by-step investigation plans with terminal test commands.
- **IssueProof Evidence Auditor**: Integrated bug-reporting tool that audits rough observations, highlights missing reproduction steps or environment details, and generates a structured GitHub-ready Markdown report.
- **Resilient Layerbase Redis Cache**: Connects to Layerbase Redis via secure TLS (`rediss://`) over port 6379, with automatic in-memory TTL fallback if unconfigured or offline.

---

## 🛠️ Technology Stack

- **Frontend**: Next.js 16 (App Router, TypeScript), Tailwind CSS, Lucide Icons, `@xyflow/react` (React Flow), `@trigger.dev/sdk` (Trigger.dev v3).
- **Backend**: Python 3.12, FastAPI, Pydantic v2, HTTPX, Google Gen AI Python SDK, `redis` (Layerbase TLS), Pytest.
- **AI Model**: Gemma 4 (`gemma-4-31b-it`) via Google GenAI / Gemini API.
- **Orchestration**: Trigger.dev Cloud v3 with durable task steps and retries.
- **Data Sources**: GitHub REST API v3, GSoC Organization Registry.

---

## 📋 Prerequisites & Mandatory Python Setup

> **Note**: This project strictly runs on your system-wide **Python 3.12** installation on Windows without virtual environments (`venv`, Conda, etc.).

Ensure you have:
1. Python 3.12 installed globally (`py -3.12 --version`)
2. Node.js 18+ and npm installed (`node -v`, `npm -v`)

---

## 🚀 Quickstart Guide

### 1. Install Backend Dependencies (System Python 3.12)

```powershell
py -3.12 -m pip install -r backend/requirements.txt
```

### 2. Configure Environment Variables

Backend template (`backend/.env`):
```ini
GEMINI_API_KEY=your_gemini_api_key_here
GEMINI_MODEL=gemma-4-31b-it
GITHUB_TOKEN=your_optional_github_token
REDIS_URL=rediss://default:password@your-host.cloud.layerbase.dev:6379
TRIGGER_SECRET_KEY=
BACKEND_CORS_ORIGINS=["http://localhost:3000","http://127.0.0.1:3000"]
```

Frontend template (`frontend/.env.local`):
```ini
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000/api
```

*(Note: All services have built-in graceful degradation. If `GEMINI_API_KEY`, `REDIS_URL`, or `GITHUB_TOKEN` are empty, OSS Compass functions using grounded heuristic fallbacks, in-memory caching, and public GitHub limits).*

### 3. Run the Backend API

```powershell
py -3.12 -m uvicorn app.main:app --reload --app-dir backend --port 8000
```
- API Base: `http://localhost:8000/api`
- Interactive Swagger Docs: `http://localhost:8000/docs`
- Health Endpoint: `http://localhost:8000/api/health`

### 4. Run the Frontend Application

In a separate terminal:
```powershell
cd frontend
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🧪 Testing

Run all 15 backend tests covering schemas, GitHub client, AST graph builder, IssueProof audit, and API routes:

```powershell
py -3.12 -m pytest backend/tests
```

Run frontend build check:
```powershell
cd frontend
npm run build
```

---

## 📂 Project Structure

```text
HackDayVU/
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   │   ├── layout.tsx                # Root dark theme layout with Navbar
│   │   │   ├── page.tsx                  # Discovery landing & IssueProof demo
│   │   │   └── repo/[owner]/[repo]/      # Progressive repository workspace
│   │   ├── components/
│   │   │   ├── layout/Navbar.tsx         # Telemetry badges & navigation
│   │   │   ├── discovery/                # Filter form & explainable repo cards
│   │   │   ├── graph/                    # XYFlow architecture visualizer
│   │   │   ├── issues/                   # Issue list & Gemma 4 guidance modal
│   │   │   └── issue-proof/              # Interactive bug audit & Markdown generator
│   │   ├── lib/api.ts                    # Typed API client
│   │   └── types/index.ts                # TypeScript data interfaces
│   └── package.json
├── backend/
│   ├── app/
│   │   ├── main.py                       # FastAPI entrypoint
│   │   ├── core/config.py                # Pydantic Settings & CORS
│   │   ├── schemas/                      # Typed Pydantic models
│   │   ├── github/client.py              # Reusable async GitHub REST client
│   │   ├── discovery/engine.py           # Match scoring & GSoC lookup
│   │   ├── graph/builder.py              # AST & import relationship parser
│   │   ├── cache/redis_client.py         # Layerbase TLS Redis with in-memory fallback
│   │   ├── background/orchestrator.py    # Background preparation orchestrator
│   │   ├── agent/services/gemma_service.py # Gemma 4 GenAI service & guardrails
│   │   └── api/routes/                   # health, discovery, repos, analysis, issue_proof
│   ├── tests/                            # 15 unit and integration tests
│   ├── requirements.txt
│   └── .env.example
├── docs/                                 # architecture, api-contracts, background-jobs
├── docker-compose.yml
├── pytest.ini
└── README.md
```

---

## 🛡️ Security & Grounding Policy

- **Untrusted External Data**: All READMEs, issue bodies, and commit messages fetched from GitHub are treated strictly as untrusted data strings.
- **Zero Hallucination Guarantee**: The application never invents repository files, line numbers, or test outcomes. Unverified inferences are explicitly marked as hypotheses.
- **Backend-Only Secrets**: All tokens (`GEMINI_API_KEY`, `GITHUB_TOKEN`, `REDIS_URL`) remain exclusively on the FastAPI backend and are never exposed to the client bundle.
