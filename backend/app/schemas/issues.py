from typing import List, Optional
from pydantic import BaseModel, Field

class IssueDifficultyAssessment(BaseModel):
    level: str = "intermediate"  # "beginner", "intermediate", "advanced"
    rationale: str
    confidence: str = "medium"   # "high", "medium", "low"
    prerequisites: List[str] = Field(default_factory=list)
    estimated_files_affected: List[str] = Field(default_factory=list)
    evidence_source: str = "AI assessment based on issue scope, code complexity, and label history"

class IssueAssignee(BaseModel):
    login: str
    avatar_url: str = ""
    html_url: str = ""

class LinkedPullRequest(BaseModel):
    number: int
    title: str
    html_url: str
    state: str = "open"  # "open", "closed", "merged"
    author_login: str
    author_avatar: str = ""
    created_at: str = ""
    updated_at: str = ""
    is_draft: bool = False

class ContributorClaim(BaseModel):
    author_login: str
    author_avatar: str = ""
    comment_body: str = ""
    created_at: str = ""
    html_url: str = ""

class IssueActivityDetails(BaseModel):
    issue_number: int
    has_active_workers: bool = False
    status_badge: str = "AVAILABLE"  # "AVAILABLE", "ASSIGNED", "PR_IN_PROGRESS", "CLAIMED"
    status_summary: str = "No existing contributors working on this issue."
    assignees: List[IssueAssignee] = Field(default_factory=list)
    linked_prs: List[LinkedPullRequest] = Field(default_factory=list)
    recent_claims: List[ContributorClaim] = Field(default_factory=list)

class IssueItem(BaseModel):
    id: int
    number: int
    title: str
    body: Optional[str] = None
    html_url: str
    state: str = "open"
    created_at: str
    updated_at: str
    author_login: str
    author_avatar: str
    labels: List[str] = Field(default_factory=list)
    comments_count: int = 0
    is_good_first_issue: bool = False
    is_help_wanted: bool = False
    difficulty: Optional[IssueDifficultyAssessment] = None
    linked_module: Optional[str] = None
    assignees: List[IssueAssignee] = Field(default_factory=list)
    activity: Optional[IssueActivityDetails] = None

class PaginatedIssuesResponse(BaseModel):
    items: List[IssueItem]
    total_count: int
    page: int
    per_page: int
    total_pages: int
    has_next: bool
    has_prev: bool
