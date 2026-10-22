import pytest
from app.schemas.discovery import UserPreferences, RepoSearchResult, MatchExplanation
from app.schemas.graph import GraphNode, GraphEdge, ArchitectureGraph
from app.schemas.issues import IssueDifficultyAssessment
from app.schemas.issue_proof import BugAuditInput, GeneratedReport

def test_user_preferences_defaults():
    prefs = UserPreferences()
    assert prefs.experience_level == "beginner"
    assert "bugs" in prefs.contribution_types
    assert prefs.gsoc_interest is False

def test_repo_search_result_validation():
    explanation = MatchExplanation(
        score=85,
        matched_skills=["Python", "FastAPI"],
        reasons_for_fit=["Matches primary language"],
        potential_challenges=[],
        is_gsoc_affiliated=False
    )
    result = RepoSearchResult(
        id=123,
        name="test-repo",
        owner="test-owner",
        full_name="test-owner/test-repo",
        description="A great repo",
        html_url="https://github.com/test-owner/test-repo",
        primary_language="Python",
        stars_count=100,
        forks_count=20,
        open_issues_count=5,
        updated_at="2026-10-20T00:00:00Z",
        match_explanation=explanation
    )
    assert result.name == "test-repo"
    assert result.match_explanation.score == 85

def test_architecture_graph_schemas():
    node = GraphNode(id="n1", label="main.py", path="src/main.py", type="entry_point")
    edge = GraphEdge(id="e1", source="n1", target="n2", relationship="imports", is_inferred=False)
    graph = ArchitectureGraph(nodes=[node], edges=[edge], total_nodes=1, total_edges=1)
    assert graph.total_nodes == 1
    assert graph.edges[0].is_inferred is False

def test_issue_difficulty_schema():
    diff = IssueDifficultyAssessment(
        level="beginner",
        rationale="Tagged good first issue",
        confidence="high",
        prerequisites=["Basic Python"]
    )
    assert diff.level == "beginner"
