"""POST /summarize — meeting transcript summarization."""

from fastapi import APIRouter, Depends, HTTPException, status

from app.auth import get_current_user
from app.schemas import SummarizeRequest, SummarizeResponse
from app.services import gemini

router = APIRouter(tags=["summarize"])


@router.post("/summarize", response_model=SummarizeResponse)
async def summarize(body: SummarizeRequest, user: dict = Depends(get_current_user)):
    try:
        summary = gemini.summarize(body.transcript, title=body.title)
    except gemini.GeminiNotConfiguredError as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail=str(exc)
        )
    return SummarizeResponse(summary=summary)
