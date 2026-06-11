"""POST /report — templated report generation."""

from fastapi import APIRouter, Depends, HTTPException, status

from app.auth import get_current_user
from app.schemas import ReportRequest, ReportResponse
from app.services import gemini

router = APIRouter(tags=["report"])


@router.post("/report", response_model=ReportResponse)
async def report(body: ReportRequest, user: dict = Depends(get_current_user)):
    try:
        text = gemini.generate_report(
            template=body.template,
            context=body.context,
            parameters=body.parameters,
        )
    except gemini.GeminiNotConfiguredError as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail=str(exc)
        )
    return ReportResponse(report=text)
