export type ExperienceLevel = 'beginner' | 'intermediate' | 'advanced';

export interface UserPreferences {
  languages: string[];
  frameworks: string[];
  experience_level: ExperienceLevel;
  interests: string[];
  contribution_types: string[];
  gsoc_interest: boolean;
  min_stars?: number;
}

export interface MatchExplanation {
  score: number;
  matched_skills: string[];
  reasons_for_fit: string[];
  potential_challenges: string[];
  is_gsoc_affiliated: boolean;
}

export interface RepoSearchResult {
  id: number;
  name: string;
  owner: string;
  full_name: string;
  description: string | null;
  html_url: string;
  primary_language: string | null;
  languages: string[];
  stars_count: number;
  forks_count: number;
  open_issues_count: number;
  updated_at: string;
  license: string | null;
  default_branch: string;
  topics: string[];
  has_contributing_guide: boolean;
  match_explanation: MatchExplanation;
}

export interface DiscoveryResponse {
  total_found: number;
  repositories: RepoSearchResult[];
  query_summary: string;
}

export interface RepoSectionStatus {
  overview: 'not_started' | 'queued' | 'loading' | 'ready' | 'error';
  tree: 'not_started' | 'queued' | 'loading' | 'ready' | 'error';
  graph: 'not_started' | 'queued' | 'loading' | 'ready' | 'error';
  contributors: 'not_started' | 'queued' | 'loading' | 'ready' | 'error';
  issues: 'not_started' | 'queued' | 'loading' | 'ready' | 'error';
  pulls: 'not_started' | 'queued' | 'loading' | 'ready' | 'error';
}

export interface RepositoryOverview {
  name: string;
  owner: string;
  full_name: string;
  description: string | null;
  html_url: string;
  primary_language?: string | null;
  stars_count: number;
  forks_count: number;
  open_issues_count: number;
  license: string | null;
  default_branch: string;
  readme_markdown: string | null;
  contributing_markdown: string | null;
  languages: Record<string, number>;
  topics: string[];
  architecture_summary: string | null;
  is_cached: boolean;
}

export interface TreeNodeItem {
  path: string;
  name: string;
  type: 'file' | 'directory';
  size?: number;
}

export interface RepositoryTreeResponse {
  branch: string;
  total_files: number;
  files: TreeNodeItem[];
}

export type NodeType = 'entry_point' | 'module' | 'component' | 'service' | 'config' | 'test' | 'dependency';

export interface GraphNode {
  id: string;
  label: string;
  path: string;
  type: NodeType;
  language?: string;
  line_count?: number;
  exports: string[];
  github_url?: string;
  data: Record<string, any>;
}

export interface GraphEdge {
  id: string;
  source: string;
  target: string;
  label?: string;
  relationship: string;
  is_inferred: boolean;
  evidence?: string;
}

export interface ArchitectureGraph {
  nodes: GraphNode[];
  edges: GraphEdge[];
  total_nodes: number;
  total_edges: number;
  is_partial: boolean;
  analysis_evidence: string;
}

export interface Contributor {
  login: string;
  id: number;
  avatar_url: string;
  html_url: string;
  contributions: number;
  role: string;
  verified_context?: string;
}

export interface PullRequest {
  number: number;
  title: string;
  state: string;
  html_url: string;
  created_at: string;
  user_login: string;
  user_avatar: string;
  is_merged: boolean;
  merged_at?: string;
}

export interface IssueDifficultyAssessment {
  level: 'beginner' | 'intermediate' | 'advanced';
  rationale: string;
  confidence: 'high' | 'medium' | 'low';
  prerequisites: string[];
  estimated_files_affected: string[];
  evidence_source: string;
}

export interface IssueItem {
  id: number;
  number: number;
  title: string;
  body: string | null;
  html_url: string;
  state: string;
  created_at: string;
  updated_at: string;
  author_login: string;
  author_avatar: string;
  labels: string[];
  comments_count: number;
  is_good_first_issue: boolean;
  is_help_wanted: boolean;
  difficulty?: IssueDifficultyAssessment;
  linked_module?: string;
}

export interface PaginatedIssuesResponse {
  items: IssueItem[];
  total_count: number;
  page: number;
  per_page: number;
  total_pages: number;
  has_next: boolean;
  has_prev: boolean;
}

export interface PrerequisiteItem {
  concept: string;
  why_needed: string;
  doc_link?: string;
}

export interface InvestigationStep {
  step_number: number;
  title: string;
  description: string;
  target_files: string[];
  suggested_commands_or_tests: string[];
}

export interface Hypothesis {
  potential_cause: string;
  evidence_found: string;
  how_to_verify: string;
}

export interface IssueAnalysisResponse {
  issue_number: number;
  plain_language_explanation: string;
  why_it_matters: string;
  expected_vs_actual?: string;
  likely_relevant_files: string[];
  prerequisites: PrerequisiteItem[];
  investigation_plan: InvestigationStep[];
  suggested_tests: string[];
  hypotheses: Hypothesis[];
  questions_before_modifying_code: string[];
  source_evidence_links: string[];
  uncertainties_and_unknowns: string[];
  model_used: string;
}

export interface ClarificationQuestion {
  id: string;
  question: string;
  why_important: string;
  example_answer?: string;
  field_to_update: string;
}

export interface IssueProofAuditResult {
  completeness_score: number;
  missing_fields: string[];
  clarification_questions: ClarificationQuestion[];
  strengths: string[];
  feedback: string;
}

export interface GeneratedReport {
  title: string;
  markdown_content: string;
  quality_score: number;
  unverified_elements_flagged: string[];
}
