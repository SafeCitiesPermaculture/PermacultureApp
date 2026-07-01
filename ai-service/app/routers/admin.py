"""Admin-only corpus management for Azure AI Search RAG."""

import secrets

from fastapi import APIRouter, Depends, Header, HTTPException, status

from app.auth import get_admin_user
from app.config import get_settings
from app.services import drive, llm, search

router = APIRouter(prefix="/corpus", tags=["corpus"])


def _run_reindex():
    """Shared body for the admin and secret-token reindex paths."""
    try:
        return search.index_corpus()
    except (llm.LLMNotConfiguredError, drive.DriveNotConfiguredError) as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail=str(exc)
        )


@router.get("/status")
def corpus_status(admin: dict = Depends(get_admin_user)):
    """Whether the corpus index holds any documents (chat grounds answers only
    if so)."""
    return {"indexed": search.has_documents()}


@router.post("/reindex")
def reindex(admin: dict = Depends(get_admin_user)):
    """(Re)index the Drive corpus into Azure AI Search. Idempotent — sources
    already present are skipped. Blocking; FastAPI runs it in a threadpool."""
    return _run_reindex()


@router.post("/reindex-trigger")
def reindex_trigger(
    token: str | None = None,
    x_reindex_token: str | None = Header(default=None),
):
    """No-JWT reindex trigger for a scheduler (cron-job.org). Authenticated by a
    shared secret via the `token` query param or `X-Reindex-Token` header, so it
    can be called without an admin login. Reuses the incremental index_corpus(),
    so when nothing changed it's just a Drive listing — effectively free."""
    expected = get_settings().reindex_token.strip()
    provided = (x_reindex_token or token or "").strip()
    if not expected or not provided or not secrets.compare_digest(provided, expected):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or missing reindex token",
        )
    return _run_reindex()
