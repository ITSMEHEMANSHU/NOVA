# OSS Compass API Contracts

Base URL: `http://localhost:8000/api`

## Health & Status

### `GET /health`
Returns system status, active cache mode, AI model identifier, Inngest configuration, and GitHub token status.

## Discovery

### `POST /discovery/search`
Searches public GitHub repositories matching user skills and preferences.

**Request:**
```json
{
  "languages": ["Python"],
  "frameworks": ["FastAPI"],
  "experience_level": "beginner",
  "interests": ["web"],
  "contribution_types": ["bugs", "documentation"],
  "gsoc_interest": false,
  "min_stars": 10
}
```

**Response:**
```json
{
  "total_found": 12,
  "query_summary": "Discovered 12 repositories matching beginner experience...",
  "repositories": [
    {
      "id": 12345,
      "name": "fastapi",
      "owner": "fastapi",
      "full_name": "fastapi/fastapi",
      "description": "...",
      "stars_count": 82000,
      "match_explanation": {
        "score": 95,
        "matched_skills": ["Python", "FastAPI"],
        "reasons_for_fit": ["..."],
        "potential_challenges": ["..."],
        "is_gsoc_affiliated": false
      }
    }
  ]
}
```

## Repositories & Workspace

- `POST /repositories/{owner}/{repo}/prepare`: Triggers background caching and graph generation.
- `GET /repositories/{owner}/{repo}/status`: Returns section loading status (`queued`, `loading`, `ready`, `error`).
- `GET /repositories/{owner}/{repo}/overview`: Returns README, license, languages, and metadata.
- `GET /repositories/{owner}/{repo}/graph`: Returns deterministic `ArchitectureGraph` (nodes and AST import edges).
- `GET /repositories/{owner}/{repo}/tree`: Returns repository directory tree.
- `GET /repositories/{owner}/{repo}/contributors`: Returns verifiable contributors and maintainer roles.
- `GET /repositories/{owner}/{repo}/issues`: Returns open issues with difficulty classification.
- `GET /repositories/{owner}/{repo}/pulls`: Returns recent pull requests.

## AI Reasoning & Guidance

### `POST /analysis/issue`
Generates a grounded investigation plan, prerequisites checklist, and affected files using Gemma 4.

## IssueProof

- `POST /issue-proof/validate`: Audits a bug report for missing information and generates targeted clarification questions.
- `POST /issue-proof/generate`: Generates a structured, GitHub-ready Markdown bug report.
