from typing import List, Optional
from pydantic import BaseModel, Field

class IssueDifficultyAssessment(BaseModel):
    level: str = "intermediate"  # "beginner", "intermediate", "advanced"
    rationale: str
    confidence: str = "medium"   # "high", "medium", "low"
    prerequisites: List[str] = Field(default_factory=list)
    estimated_files_affected: List[str] = Field(default_factory=list)
    evidence_source: str = "AI assessment based on issue scope, code complexity, and label history"

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
