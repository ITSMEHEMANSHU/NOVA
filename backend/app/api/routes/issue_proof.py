from fastapi import APIRouter, HTTPException
from app.schemas.issue_proof import (
    BugAuditInput,
    IssueProofAuditResult,
    BugReportGenerateRequest,
    GeneratedReport,
    BugAutofillRequest,
    BugAutofillResponse,
)
from app.agent.services.gemma_service import gemma_service

router = APIRouter(prefix="/issue-proof", tags=["IssueProof"])

@router.post("/validate", response_model=IssueProofAuditResult)
async def validate_bug_observation(input_data: BugAuditInput):
    try:
        return await gemma_service.audit_bug_report(input_data)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Validation failed: {str(e)}")

@router.post("/generate", response_model=GeneratedReport)
async def generate_report(req: BugReportGenerateRequest):
    try:
        return await gemma_service.generate_issue_proof_report(req)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Report generation failed: {str(e)}")

@router.post("/autofill", response_model=BugAutofillResponse)
async def autofill_issue_proof(req: BugAutofillRequest):
    try:
        return await gemma_service.autofill_bug_report(
            owner=req.owner,
            repo=req.repo,
            title=req.title,
            body=req.body or ""
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Autofill failed: {str(e)}")

