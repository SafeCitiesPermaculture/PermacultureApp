"""Admin-only corpus management for Azure AI Search RAG."""

from fastapi import APIRouter, Depends, HTTPException, status

from app.auth import get_admin_user
from app.services import drive, llm, search

router = APIRouter(prefix="/corpus", tags=["corpus"])


@router.get("/status")
def corpus_status(admin: dict = Depends(get_admin_user)):
    """Whether the corpus index holds any documents (chat grounds answers only
    if so)."""
    return {"indexed": search.has_documents()}


@router.post("/reindex")
def reindex(admin: dict = Depends(get_admin_user)):
    """(Re)index the Drive corpus into Azure AI Search. Idempotent — sources
    already present are skipped. Blocking; FastAPI runs it in a threadpool."""
    try:
        return search.index_corpus()
    except llm.LLMNotConfiguredError as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail=str(exc)
        )
    except drive.DriveNotConfiguredError as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail=str(exc)
        )
