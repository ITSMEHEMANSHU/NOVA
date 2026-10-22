from typing import List, Optional
from pydantic import BaseModel, Field

class BugAuditInput(BaseModel):
    owner: str
    repo: str
    title: str
    description: str
    environment: Optional[str] = None
    steps_to_reproduce: Optional[str] = None
    expected_behavior: Optional[str] = None
    actual_behavior: Optional[str] = None
    error_logs: Optional[str] = None
    additional_context: Optional[str] = None

class ClarificationQuestion(BaseModel):
    id: str
    question: str
    why_important: str
    example_answer: Optional[str] = None
    field_to_update: str

class IssueProofAuditResult(BaseModel):
    completeness_score: int = Field(..., description="0 to 100 quality/actionability rating")
    missing_fields: List[str] = Field(default_factory=list)
    clarification_questions: List[ClarificationQuestion] = Field(default_factory=list)
    strengths: List[str] = Field(default_factory=list)
    feedback: str

class BugReportGenerateRequest(BaseModel):
    owner: str
    repo: str
    title: str
    description: str
    environment: Optional[str] = "Not provided / Unknown"
    preconditions: Optional[str] = "None noted"
    steps_to_reproduce: Optional[str] = "1. [Step 1]\n2. [Step 2]"
    expected_behavior: Optional[str] = "Expected behavior not specified"
    actual_behavior: Optional[str] = "Actual behavior not specified"
    error_logs: Optional[str] = "No logs provided"
    reproducibility: Optional[str] = "Unknown"
    potential_files_involved: List[str] = Field(default_factory=list)

class GeneratedReport(BaseModel):
    title: str
    markdown_content: str
    quality_score: int
    unverified_elements_flagged: List[str] = Field(default_factory=list)
