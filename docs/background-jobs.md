# Background Jobs & Trigger.dev Integration

## Overview

OSS Compass uses **Trigger.dev Cloud** (v3 SDK) for reliable, durable background job orchestration and progressive repository preparation.

## Architecture

```
User selects repo / views discovery
           │
           ▼
Trigger.dev Task:
'prepare_repository' (repositoryTasks.ts)
           │
           ├────────────────────────────┐
           ▼                            ▼
  FastAPI Boundary:             Trigger.dev Cloud:
  POST /repositories/{owner}/{repo}/prepare   Managed Run Lifecycle
           │                            │
           ▼                            ▼
  Background Orchestrator:       Task Steps:
  execute_repo_preparation       - build_dependency_graph
           │                     - analyze_repository_with_ai
           │                     - analyze_contribution_issues
           │                     - generate_issue_proof
           │                     - refresh_repository_data
           ▼                            │
  Populates Layerbase Redis Cache:      │
  - Overview & README                   │
  - Git Tree                            │
  - Architecture Graph (AST)            │
  - Issues with difficulty tags         │
  - Contributors & Pull Requests        │
           ▼                            ▼
  Updates RepoSectionStatus: 'ready'   Run Status: 'COMPLETED'
```

## Migrated Background Workflows

The following 6 application-level workflows are implemented in `frontend/src/trigger/repositoryTasks.ts`:

1. `prepare_repository` (`prepare-repository`): Durable orchestrator that requests repository overview, file tree, contributors, and issues.
2. `build_dependency_graph` (`build-dependency-graph`): Triggers AST import parsing and deterministic codebase graph generation.
3. `analyze_repository_with_ai` (`analyze-repository-with-ai`): Synthesizes repository architecture and technologies using Gemma 4.
4. `analyze_contribution_issues` (`analyze-contribution-issues`): Generates grounded Gemma 4 contribution plans for a selected issue.
5. `generate_issue_proof` (`generate-issue-proof`): Audits bug observation and produces structured, GitHub-ready Markdown reports.
6. `refresh_repository_data` (`refresh-repository-data`): Refreshes dynamic metrics, issues, pull requests, and contributor activity.

## Running Trigger.dev in Local Development

1. Add your Trigger.dev Cloud secret key to `backend/.env` and `frontend/.env.local`:
   ```ini
   TRIGGER_SECRET_KEY=tr_prod_...
   ```
2. Start the Trigger.dev development CLI in a separate terminal:
   ```bash
   cd frontend
   npx trigger.dev@latest dev
   ```
3. Run the Next.js app (`npm run dev`) and FastAPI backend (`py -3.12 -m uvicorn app.main:app --app-dir backend --port 8000`).
4. Trigger.dev automatically discovers the tasks defined in `frontend/src/trigger/` and streams execution logs to your terminal and dashboard.
