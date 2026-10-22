from typing import List, Optional
from pydantic import BaseModel, Field

class PrerequisiteItem(BaseModel):
    concept: str
    why_needed: str
    doc_link: Optional[str] = None

class InvestigationStep(BaseModel):
    step_number: int
    title: str
    description: str
    target_files: List[str] = Field(default_factory=list)
    suggested_commands_or_tests: List[str] = Field(default_factory=list)

class Hypothesis(BaseModel):
    potential_cause: str
    evidence_found: str
    how_to_verify: str

class IssueAnalysisRequest(BaseModel):
    owner: str
    repo: str
    issue_number: int
    issue_title: str
    issue_body: Optional[str] = ""
    user_experience: Optional[str] = "beginner"

class IssueAnalysisResponse(BaseModel):
    issue_number: int
    plain_language_explanation: str
    why_it_matters: str
    expected_vs_actual: Optional[str] = None
    likely_relevant_files: List[str] = Field(default_factory=list)
    prerequisites: List[PrerequisiteItem] = Field(default_factory=list)
    investigation_plan: List[InvestigationStep] = Field(default_factory=list)
    suggested_tests: List[str] = Field(default_factory=list)
    hypotheses: List[Hypothesis] = Field(default_factory=list)
    questions_before_modifying_code: List[str] = Field(default_factory=list)
    source_evidence_links: List[str] = Field(default_factory=list)
    uncertainties_and_unknowns: List[str] = Field(default_factory=list)
    model_used: str

class RepoSummaryResponse(BaseModel):
    owner: str
    repo: str
    architecture_summary: str
    key_technologies: List[str] = Field(default_factory=list)
    entry_points: List[str] = Field(default_factory=list)
    contributing_tips: List[str] = Field(default_factory=list)
    evidence_source: str = "README, tree structure, and config inspection"
