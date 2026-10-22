# OSS Compass Development & Extension Plan

## Implemented Milestones

- [x] Monorepo scaffold with Next.js 15 App Router & FastAPI.
- [x] Python 3.12 system-wide execution without virtualenv.
- [x] Reusable async GitHub REST client with URL injection protection & rate-limit handling.
- [x] Discovery engine with explainable fit scoring, challenges, and GSoC organization registry.
- [x] Deterministic AST import parser and architecture graph generator.
- [x] XYFlow / React Flow interactive codebase visualizer with custom nodes and node inspector.
- [x] Progressive loading with Trigger.dev Cloud background job orchestration and section status polling.
- [x] Layerbase Redis cache with TLS (`rediss://`) and resilient in-memory TTL fallback.
- [x] Google GenAI SDK integration supporting configurable Gemma 4 model (`gemma-4-31b-it`).
- [x] Grounded issue analysis with prerequisites, investigation plan, hypotheses, and tests.
- [x] Integrated IssueProof bug-reporting auditor and GitHub-ready Markdown generator.
- [x] 15 automated pytest tests covering schemas, GitHub client, graph builder, issue proof, and API routes.

## Future Post-Hackathon Roadmap

1. **Multi-language AST Parsing**: Expand AST support beyond Python and TypeScript into Go, Rust, and Java.
2. **Direct PR Draft Sync**: Optional GitHub OAuth to draft PRs directly from IssueProof templates.
3. **Historical Commit Graph**: Animate file edits over time to visualize active developer heatmaps.
