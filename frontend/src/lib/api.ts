import {
  UserPreferences,
  DiscoveryResponse,
  RepoSectionStatus,
  RepositoryOverview,
  RepositoryTreeResponse,
  ArchitectureGraph,
  Contributor,
  IssueItem,
  PaginatedIssuesResponse,
  PullRequest,
  IssueAnalysisResponse,
  IssueProofAuditResult,
  GeneratedReport,
} from '@/types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000/api';

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const errorBody = await res.text();
    let message = `API Request failed with status ${res.status}`;
    try {
      const parsed = JSON.parse(errorBody);
      if (parsed.detail) message = parsed.detail;
    } catch {}
    throw new Error(message);
  }
  return res.json();
}

export async function checkBackendHealth(): Promise<any> {
  const res = await fetch(`${API_BASE_URL}/health`);
  return handleResponse(res);
}

export async function searchRepositories(preferences: UserPreferences): Promise<DiscoveryResponse> {
  const res = await fetch(`${API_BASE_URL}/discovery/search`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(preferences),
  });
  return handleResponse<DiscoveryResponse>(res);
}

export async function prepareRepository(owner: string, repo: string): Promise<{ status: string }> {
  // Trigger both backend orchestrator and Trigger.dev Cloud endpoint
  fetch(`/api/trigger`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ owner, repo }),
  }).catch(() => {});

  const res = await fetch(`${API_BASE_URL}/repositories/${owner}/${repo}/prepare`, {
    method: 'POST',
  });
  return handleResponse(res);
}

export async function getRepositoryStatus(owner: string, repo: string): Promise<RepoSectionStatus> {
  const res = await fetch(`${API_BASE_URL}/repositories/${owner}/${repo}/status`);
  return handleResponse<RepoSectionStatus>(res);
}

export async function getRepositoryOverview(owner: string, repo: string): Promise<RepositoryOverview> {
  const res = await fetch(`${API_BASE_URL}/repositories/${owner}/${repo}/overview`);
  return handleResponse<RepositoryOverview>(res);
}

export async function getRepositoryTree(owner: string, repo: string, branch?: string): Promise<RepositoryTreeResponse> {
  const url = branch 
    ? `${API_BASE_URL}/repositories/${owner}/${repo}/tree?branch=${encodeURIComponent(branch)}`
    : `${API_BASE_URL}/repositories/${owner}/${repo}/tree`;
  const res = await fetch(url);
  return handleResponse<RepositoryTreeResponse>(res);
}

export async function getRepositoryGraph(owner: string, repo: string, branch?: string): Promise<ArchitectureGraph> {
  const url = branch 
    ? `${API_BASE_URL}/repositories/${owner}/${repo}/graph?branch=${encodeURIComponent(branch)}`
    : `${API_BASE_URL}/repositories/${owner}/${repo}/graph`;
  const res = await fetch(url);
  return handleResponse<ArchitectureGraph>(res);
}

export async function getRepositoryContributors(owner: string, repo: string): Promise<Contributor[]> {
  const res = await fetch(`${API_BASE_URL}/repositories/${owner}/${repo}/contributors`);
  return handleResponse<Contributor[]>(res);
}

export async function getRepositoryIssues(
  owner: string,
  repo: string,
  page: number = 1,
  perPage: number = 25
): Promise<PaginatedIssuesResponse> {
  const res = await fetch(`${API_BASE_URL}/repositories/${owner}/${repo}/issues?page=${page}&per_page=${perPage}`);
  const data = await handleResponse<any>(res);
  if (Array.isArray(data)) {
    return {
      items: data,
      total_count: data.length,
      page,
      per_page: perPage,
      total_pages: Math.ceil(data.length / perPage) || 1,
      has_next: false,
      has_prev: page > 1,
    };
  }
  return data;
}

export async function getRepositoryPulls(owner: string, repo: string): Promise<PullRequest[]> {
  const res = await fetch(`${API_BASE_URL}/repositories/${owner}/${repo}/pulls`);
  return handleResponse<PullRequest[]>(res);
}

export async function analyzeIssue(
  owner: string,
  repo: string,
  issueNumber: number,
  title: string,
  body?: string,
  userExperience: string = 'beginner'
): Promise<IssueAnalysisResponse> {
  const res = await fetch(`${API_BASE_URL}/analysis/issue`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      owner,
      repo,
      issue_number: issueNumber,
      issue_title: title,
      issue_body: body || '',
      user_experience: userExperience,
    }),
  });
  return handleResponse<IssueAnalysisResponse>(res);
}

export async function auditBugReport(payload: {
  owner: string;
  repo: string;
  title: string;
  description: string;
  environment?: string;
  steps_to_reproduce?: string;
  expected_behavior?: string;
  actual_behavior?: string;
  error_logs?: string;
}): Promise<IssueProofAuditResult> {
  const res = await fetch(`${API_BASE_URL}/issue-proof/validate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  return handleResponse<IssueProofAuditResult>(res);
}

export async function generateBugReport(payload: {
  owner: string;
  repo: string;
  title: string;
  description: string;
  environment?: string;
  preconditions?: string;
  steps_to_reproduce?: string;
  expected_behavior?: string;
  actual_behavior?: string;
  error_logs?: string;
  reproducibility?: string;
}): Promise<GeneratedReport> {
  const res = await fetch(`${API_BASE_URL}/issue-proof/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  return handleResponse<GeneratedReport>(res);
}
