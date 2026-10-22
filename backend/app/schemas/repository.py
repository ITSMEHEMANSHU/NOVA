from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field

class RepoSectionStatus(BaseModel):
    overview: str = "not_started"      # not_started, queued, loading, ready, error
    tree: str = "not_started"
    graph: str = "not_started"
    contributors: str = "not_started"
    issues: str = "not_started"
    pulls: str = "not_started"

class TreeNode(BaseModel):
    path: str
    name: str
    type: str  # "blob" (file) or "tree" (directory)
    size: Optional[int] = None
    children: Optional[List['TreeNode']] = None
    url: Optional[str] = None

class RepositoryOverview(BaseModel):
    name: str
    owner: str
    full_name: str
    description: Optional[str] = None
    html_url: str
    stars_count: int
    forks_count: int
    open_issues_count: int
    license: Optional[str] = None
    default_branch: str = "main"
    readme_markdown: Optional[str] = None
    contributing_markdown: Optional[str] = None
    languages: Dict[str, int] = Field(default_factory=dict)
    topics: List[str] = Field(default_factory=list)
    architecture_summary: Optional[str] = None  # AI-generated, labeled as such
    is_cached: bool = False

class Contributor(BaseModel):
    login: str
    id: int
    avatar_url: str
    html_url: str
    contributions: int
    role: str = "Contributor"  # Verifiable role: Owner, Maintainer, Contributor
    verified_context: Optional[str] = None

class PullRequest(BaseModel):
    number: int
    title: str
    state: str  # open, closed, merged
    html_url: str
    created_at: str
    user_login: str
    user_avatar: str
    is_merged: bool = False
    merged_at: Optional[str] = None
