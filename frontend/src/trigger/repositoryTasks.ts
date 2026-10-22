import { task, logger } from "@trigger.dev/sdk/v3";

const API_BASE = process.env.FASTAPI_BASE_URL || process.env.NEXT_PUBLIC_API_BASE_URL || "http://127.0.0.1:8000/api";

interface RepoPayload {
  owner: string;
  repo: string;
}

interface IssuePayload extends RepoPayload {
  issueNumber: number;
  title: string;
  body?: string;
  userExperience?: string;
}

interface BugProofPayload extends RepoPayload {
  title: string;
  description: string;
  environment?: string;
  stepsToReproduce?: string;
  expectedBehavior?: string;
  actualBehavior?: string;
  errorLogs?: string;
}

/**
 * 1. prepare_repository
 * Durable workflow: prepares overview, file tree, contributors, and open issues
 */
export const prepareRepositoryTask = task({
  id: "prepare-repository",
  retry: {
    maxAttempts: 3,
  },
  run: async (payload: RepoPayload) => {
    const { owner, repo } = payload;
    logger.info(`Starting prepare_repository workflow for ${owner}/${repo}`);

    const res = await fetch(`${API_BASE}/repositories/${owner}/${repo}/prepare`, {
      method: "POST",
    });

    if (!res.ok) {
      const errText = await res.text();
      logger.error(`Failed to prepare repository: ${errText}`);
      throw new Error(`Failed to prepare repository: ${res.statusText}`);
    }

    const data = await res.json();
    logger.info(`Successfully orchestrated preparation for ${owner}/${repo}`, { result: data });
    return {
      status: "completed",
      owner,
      repo,
      timestamp: new Date().toISOString(),
    };
  },
});

/**
 * 2. build_dependency_graph
 * Triggers AST import parsing and deterministic codebase graph builder
 */
export const buildDependencyGraphTask = task({
  id: "build-dependency-graph",
  retry: {
    maxAttempts: 3,
  },
  run: async (payload: RepoPayload & { branch?: string }) => {
    const { owner, repo, branch = "main" } = payload;
    logger.info(`Building dependency graph for ${owner}/${repo} on branch ${branch}`);

    const res = await fetch(
      `${API_BASE}/repositories/${owner}/${repo}/graph?branch=${encodeURIComponent(branch)}`
    );

    if (!res.ok) {
      throw new Error(`Graph generation error: ${res.statusText}`);
    }

    const graph = await res.json();
    logger.info(`Generated graph with ${graph.total_nodes} nodes and ${graph.total_edges} edges`);
    return {
      success: true,
      totalNodes: graph.total_nodes,
      totalEdges: graph.total_edges,
    };
  },
});

/**
 * 3. analyze_repository_with_ai
 * Synthesizes repository architecture and technologies using Gemma 4
 */
export const analyzeRepositoryWithAiTask = task({
  id: "analyze-repository-with-ai",
  retry: {
    maxAttempts: 2,
  },
  run: async (payload: RepoPayload) => {
    const { owner, repo } = payload;
    logger.info(`Running AI repository architectural analysis for ${owner}/${repo}`);

    const res = await fetch(`${API_BASE}/repositories/${owner}/${repo}/overview`);
    if (!res.ok) {
      throw new Error(`Overview fetch failed: ${res.statusText}`);
    }

    const overview = await res.json();
    logger.info(`Completed AI repository analysis for ${owner}/${repo}`);
    return {
      owner,
      repo,
      stars: overview.stars_count,
      hasReadme: Boolean(overview.readme_markdown),
    };
  },
});

/**
 * 4. analyze_contribution_issues
 * Generates grounded Gemma 4 contribution plans for a selected issue
 */
export const analyzeContributionIssuesTask = task({
  id: "analyze-contribution-issues",
  retry: {
    maxAttempts: 3,
  },
  run: async (payload: IssuePayload) => {
    const { owner, repo, issueNumber, title, body = "", userExperience = "beginner" } = payload;
    logger.info(`Analyzing contribution issue #${issueNumber} for ${owner}/${repo}`);

    const res = await fetch(`${API_BASE}/analysis/issue`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        owner,
        repo,
        issue_number: issueNumber,
        issue_title: title,
        issue_body: body,
        user_experience: userExperience,
      }),
    });

    if (!res.ok) {
      throw new Error(`Issue analysis failed: ${res.statusText}`);
    }

    const plan = await res.json();
    logger.info(`Generated investigation plan for issue #${issueNumber} with model: ${plan.model_used}`);
    return plan;
  },
});

/**
 * 5. generate_issue_proof
 * Audits bug observation and produces a structured, GitHub-ready Markdown report
 */
export const generateIssueProofTask = task({
  id: "generate-issue-proof",
  retry: {
    maxAttempts: 2,
  },
  run: async (payload: BugProofPayload) => {
    logger.info(`Running IssueProof report generation for ${payload.owner}/${payload.repo}`);

    // Audit first
    const auditRes = await fetch(`${API_BASE}/issue-proof/validate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        owner: payload.owner,
        repo: payload.repo,
        title: payload.title,
        description: payload.description,
        steps_to_reproduce: payload.stepsToReproduce,
        expected_behavior: payload.expectedBehavior,
        actual_behavior: payload.actualBehavior,
        environment: payload.environment,
        error_logs: payload.errorLogs,
      }),
    });

    const audit = await auditRes.json();

    // Generate markdown report
    const genRes = await fetch(`${API_BASE}/issue-proof/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        owner: payload.owner,
        repo: payload.repo,
        title: payload.title,
        description: payload.description,
        environment: payload.environment,
        steps_to_reproduce: payload.stepsToReproduce,
        expected_behavior: payload.expectedBehavior,
        actual_behavior: payload.actualBehavior,
        error_logs: payload.errorLogs,
      }),
    });

    const report = await genRes.json();
    logger.info(`Generated report with completeness score ${audit.completeness_score}`);
    return {
      audit,
      report,
    };
  },
});

/**
 * 6. refresh_repository_data
 * Refreshes dynamic metrics, issues, pull requests, and contributor activity
 */
export const refreshRepositoryDataTask = task({
  id: "refresh-repository-data",
  retry: {
    maxAttempts: 3,
  },
  run: async (payload: RepoPayload) => {
    const { owner, repo } = payload;
    logger.info(`Refreshing dynamic data for ${owner}/${repo}`);

    const [issuesRes, pullsRes] = await Promise.all([
      fetch(`${API_BASE}/repositories/${owner}/${repo}/issues`),
      fetch(`${API_BASE}/repositories/${owner}/${repo}/pulls`),
    ]);

    const issues = issuesRes.ok ? await issuesRes.json() : [];
    const pulls = pullsRes.ok ? await pullsRes.json() : [];

    logger.info(`Refreshed ${issues.length} issues and ${pulls.length} pull requests`);
    return {
      refreshed: true,
      issueCount: issues.length,
      pullCount: pulls.length,
      timestamp: new Date().toISOString(),
    };
  },
});
