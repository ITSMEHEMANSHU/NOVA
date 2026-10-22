import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_health_endpoint():
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert "cache" in data
    assert "ai" in data

def test_root_endpoint():
    response = client.get("/")
    assert response.status_code == 200
    assert response.json()["service"] == "NOVA Backend API"

def test_issue_proof_validate_endpoint():
    payload = {
        "owner": "tiangolo",
        "repo": "fastapi",
        "title": "Swagger UI doc string formatting",
        "description": "Docstrings with backticks render strangely."
    }
    response = client.post("/api/issue-proof/validate", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert "completeness_score" in data
    assert "clarification_questions" in data
