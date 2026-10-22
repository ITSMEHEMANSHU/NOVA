import pytest
from app.schemas.issue_proof import BugAuditInput, BugReportGenerateRequest
from app.agent.services.gemma_service import gemma_service

@pytest.mark.asyncio
async def test_audit_bug_report_missing_fields():
    incomplete_input = BugAuditInput(
        owner="pallets",
        repo="flask",
        title="App crashes on startup",
        description="I ran it and it failed."
    )
    audit = await gemma_service.audit_bug_report(incomplete_input)
    assert audit.completeness_score < 70
    assert len(audit.missing_fields) > 0
    assert any(q.field_to_update == "steps_to_reproduce" for q in audit.clarification_questions)

@pytest.mark.asyncio
async def test_audit_bug_report_complete():
    complete_input = BugAuditInput(
        owner="pallets",
        repo="flask",
        title="App crashes on startup",
        description="Importing custom module throws ImportError on Windows.",
        environment="Windows 11, Python 3.12, Flask 3.0",
        steps_to_reproduce="1. Create app.py\n2. Run flask run\n3. View stack trace",
        expected_behavior="Server should start on port 5000",
        actual_behavior="Crashes with ImportError: cannot import name 'X'",
        error_logs="Traceback (most recent call last): line 10"
    )
    audit = await gemma_service.audit_bug_report(complete_input)
    assert audit.completeness_score >= 80

@pytest.mark.asyncio
async def test_generate_report_markdown():
    req = BugReportGenerateRequest(
        owner="fastapi",
        repo="fastapi",
        title="Query param validation bug",
        description="Optional float param fails with 422.",
        environment="Python 3.12, FastAPI 0.110.0",
        steps_to_reproduce="1. Send GET /test?val=abc\n2. Observe response",
        expected_behavior="Helpful error message",
        actual_behavior="Internal error 500",
        error_logs="ValidationError detail..."
    )
    report = await gemma_service.generate_issue_proof_report(req)
    assert "Query param validation bug" in report.title
    assert "### Steps to Reproduce" in report.markdown_content
    assert "### Expected Behavior" in report.markdown_content
    assert "### Actual Behavior" in report.markdown_content
