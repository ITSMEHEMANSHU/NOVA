import {
  task
} from "../../chunk-HW3KSO2P.mjs";
import "../../chunk-GJ2HVB4L.mjs";
import {
  logger
} from "../../chunk-P6CYADCN.mjs";
import "../../chunk-DHADIA3R.mjs";
import {
  __name,
  init_esm
} from "../../chunk-244PAGAH.mjs";

// src/trigger/repositoryTasks.ts
init_esm();
var API_BASE = process.env.FASTAPI_BASE_URL || process.env.NEXT_PUBLIC_API_BASE_URL || "http://127.0.0.1:8000/api";
var prepareRepositoryTask = task({
  id: "prepare-repository",
  retry: {
    maxAttempts: 3
  },
  run: /* @__PURE__ */ __name(async (payload) => {
    const { owner, repo } = payload;
    logger.info(`Starting prepare_repository workflow for ${owner}/${repo}`);
    const res = await fetch(`${API_BASE}/repositories/${owner}/${repo}/prepare`, {
      method: "POST"
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
      timestamp: (/* @__PURE__ */ new Date()).toISOString()
    };
  }, "run")
});
var buildDependencyGraphTask = task({
  id: "build-dependency-graph",
  retry: {
    maxAttempts: 3
  },
  run: /* @__PURE__ */ __name(async (payload) => {
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
      totalEdges: graph.total_edges
    };
  }, "run")
});
var analyzeRepositoryWithAiTask = task({
  id: "analyze-repository-with-ai",
  retry: {
    maxAttempts: 2
  },
  run: /* @__PURE__ */ __name(async (payload) => {
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
      hasReadme: Boolean(overview.readme_markdown)
    };
  }, "run")
});
var analyzeContributionIssuesTask = task({
  id: "analyze-contribution-issues",
  retry: {
    maxAttempts: 3
  },
  run: /* @__PURE__ */ __name(async (payload) => {
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
        user_experience: userExperience
      })
    });
    if (!res.ok) {
      throw new Error(`Issue analysis failed: ${res.statusText}`);
    }
    const plan = await res.json();
    logger.info(`Generated investigation plan for issue #${issueNumber} with model: ${plan.model_used}`);
    return plan;
  }, "run")
});
var generateIssueProofTask = task({
  id: "generate-issue-proof",
  retry: {
    maxAttempts: 2
  },
  run: /* @__PURE__ */ __name(async (payload) => {
    logger.info(`Running IssueProof report generation for ${payload.owner}/${payload.repo}`);
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
        error_logs: payload.errorLogs
      })
    });
    const audit = await auditRes.json();
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
        error_logs: payload.errorLogs
      })
    });
    const report = await genRes.json();
    logger.info(`Generated report with completeness score ${audit.completeness_score}`);
    return {
      audit,
      report
    };
  }, "run")
});
var refreshRepositoryDataTask = task({
  id: "refresh-repository-data",
  retry: {
    maxAttempts: 3
  },
  run: /* @__PURE__ */ __name(async (payload) => {
    const { owner, repo } = payload;
    logger.info(`Refreshing dynamic data for ${owner}/${repo}`);
    const [issuesRes, pullsRes] = await Promise.all([
      fetch(`${API_BASE}/repositories/${owner}/${repo}/issues`),
      fetch(`${API_BASE}/repositories/${owner}/${repo}/pulls`)
    ]);
    const issues = issuesRes.ok ? await issuesRes.json() : [];
    const pulls = pullsRes.ok ? await pullsRes.json() : [];
    logger.info(`Refreshed ${issues.length} issues and ${pulls.length} pull requests`);
    return {
      refreshed: true,
      issueCount: issues.length,
      pullCount: pulls.length,
      timestamp: (/* @__PURE__ */ new Date()).toISOString()
    };
  }, "run")
});
export {
  analyzeContributionIssuesTask,
  analyzeRepositoryWithAiTask,
  buildDependencyGraphTask,
  generateIssueProofTask,
  prepareRepositoryTask,
  refreshRepositoryDataTask
};
//# sourceMappingURL=repositoryTasks.mjs.map
