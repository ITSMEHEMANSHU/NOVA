# OSS Compass Architecture Specification

## Overview

OSS Compass is an AI-assisted open-source contribution platform built to guide developers from initial skill profiling to submitting an evidence-grounded pull request or bug report.

```
┌────────────────────────────────────────────────────────┐
│                   Next.js 15 App Router                │
│ (Tailwind CSS, XYFlow Graph Canvas, Responsive Views)  │
└───────────────────────────┬────────────────────────────┘
                            │ REST / JSON
┌───────────────────────────▼────────────────────────────┐
│                  FastAPI Backend Engine                │
│                                                        │
│  ┌───────────────────┐       ┌──────────────────────┐  │
│  │   API Endpoints   │       │ Layerbase Redis /    │  │
│  │   (/api/v1/...)   │       │ In-Memory Fallback   │  │
│  └─────────┬─────────┘       └──────────┬───────────┘  │
│            ▼                            ▼              │
│  ┌───────────────────┐       ┌──────────────────────┐  │
│  │  GitHub Client    │       │ AST & Import Graph   │  │
│  │  (httpx, token)   │       │ Builder (NetworkX)   │  │
│  └─────────┬─────────┘       └──────────┬───────────┘  │
│            ▼                            ▼              │
│  ┌──────────────────────────────────────────────────┐  │
│  │   Gemma 4 Service (Google GenAI Python SDK)      │  │
│  │   - Grounding Guardrails & Prompt Injection Def. │  │
│  │   - Structured Output Schemas (Pydantic)         │  │
│  │   - Evidence-Based Issue Plans & IssueProof      │  │
│  └──────────────────────────────────────────────────┘  │
└───────────────────────────┬────────────────────────────┘
                            │
              ┌─────────────┴─────────────┐
              ▼                           ▼
      GitHub REST API (v3)      Google GenAI / Gemini API
```

## Key Architectural Principles

1. **GitHub Supplies Facts; Gemma 4 Interprets**:
   - The application never asks the AI to guess repository files, line numbers, or commit logs.
   - AST parsers and GitHub tree APIs extract verified relationships (`is_inferred: false`).
   - Structural directory co-location is labeled as `is_inferred: true`.

2. **Progressive Loading & Background Preparation**:
   - When discovering repositories, only lightweight metadata is retrieved for fast initial rendering.
   - Background preparation (`/api/repositories/{owner}/{repo}/prepare`) runs through Trigger.dev Cloud tasks or async orchestrator.
   - Individual sections (`overview`, `graph`, `issues`, `contributors`, `pulls`) load independently with explicit lifecycle states (`queued`, `loading`, `ready`, `error`).

3. **Layerbase Redis with In-Memory Resiliency**:
   - TLS connection (`rediss://`) to Layerbase Redis over port 6379 with automatic SNI handling.
   - If Redis credentials are unconfigured or connection is lost, backend automatically switches to local in-memory TTL caching with zero downtime.

4. **Prompt Injection & Untrusted Data Isolation**:
   - All external repository READMEs, commit messages, and issue descriptions are treated as untrusted text.
   - Strict delimiters `<ISSUE_BODY>` and `<README_SNIPPET>` with system instruction guardrails prevent user input from overriding AI constraints.
