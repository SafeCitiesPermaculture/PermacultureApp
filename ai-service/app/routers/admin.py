"""Admin-only corpus management for File Search RAG."""

from fastapi import APIRouter, Depends, HTTPException, status

from app.auth import get_admin_user
from app.services import file_search, gemini

router = APIRouter(prefix="/corpus", tags=["corpus"])


@router.get("/status")
def corpus_status(admin: dict = Depends(get_admin_user)):
    """Whether the corpus store exists yet (chat grounds answers only if so)."""
    try:
        store = file_search.get_indexed_store_name()
    except gemini.GeminiNotConfiguredError as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail=str(exc)
        )
    return {"indexed": store is not None, "store": store}


@router.post("/reindex")
def reindex(admin: dict = Depends(get_admin_user)):
    """(Re)index the Drive corpus into the File Search store. Idempotent —
    files already present are skipped. Blocking; runs in a threadpool."""
    try:
        return file_search.index_corpus()
    except gemini.GeminiNotConfiguredError as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail=str(exc)
        )
    except file_search.drive.DriveNotConfiguredError as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail=str(exc)
        )
