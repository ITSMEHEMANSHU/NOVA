from typing import List, Optional
from pydantic import BaseModel, Field

class UserPreferences(BaseModel):
    languages: List[str] = Field(default_factory=list, description="Preferred programming languages (e.g., Python, TypeScript)")
    frameworks: List[str] = Field(default_factory=list, description="Preferred frameworks and tools (e.g., React, FastAPI, Docker)")
    experience_level: str = Field(default="beginner", description="beginner, intermediate, or advanced")
    interests: List[str] = Field(default_factory=list, description="Domains of interest (e.g., web, AI, devtools, CLI)")
    contribution_types: List[str] = Field(default_factory=lambda: ["bugs", "documentation"], description="Preferred task types: bugs, features, documentation, tests, maintenance")
    gsoc_interest: bool = Field(default=False, description="Prioritize GSoC participating organizations and projects")
    min_stars: Optional[int] = Field(default=10, description="Minimum stars filter")

class MatchExplanation(BaseModel):
    score: int = Field(..., description="Explainable suitability score out of 100")
    matched_skills: List[str] = Field(default_factory=list, description="Skills present in repo that match user profile")
    reasons_for_fit: List[str] = Field(default_factory=list, description="Why this repository fits the user's criteria")
    potential_challenges: List[str] = Field(default_factory=list, description="Potential friction or complexity factors")
    is_gsoc_affiliated: bool = Field(default=False, description="Whether repo has confirmed GSoC links")

class RepoSearchResult(BaseModel):
    id: int
    name: str
    owner: str
    full_name: str
    description: Optional[str] = None
    html_url: str
    primary_language: Optional[str] = None
    languages: List[str] = Field(default_factory=list)
    stars_count: int
    forks_count: int
    open_issues_count: int
    updated_at: str
    license: Optional[str] = None
    default_branch: str = "main"
    topics: List[str] = Field(default_factory=list)
    has_contributing_guide: bool = False
    match_explanation: MatchExplanation

class DiscoveryResponse(BaseModel):
    total_found: int
    repositories: List[RepoSearchResult]
    query_summary: str
