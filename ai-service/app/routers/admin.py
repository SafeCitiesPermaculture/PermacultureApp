"""Admin-only corpus management for Azure AI Search RAG."""

import secrets

from fastapi import APIRouter, Depends, Header, HTTPException, status

from app.auth import get_admin_user
from app.config import get_settings
from app.services import drive, llm, reindexer, search

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


@router.post("/reindex-trigger", status_code=status.HTTP_202_ACCEPTED)
async def reindex_trigger(  # async: request_reindex() needs the event loop
    token: str | None = None,
    x_reindex_token: str | None = Header(default=None),
):
    """No-JWT reindex trigger for machine callers — the Express backend fires
    it after corpus-affecting Drive mutations (upload/delete/toggle/save), and
    the scheduled ACA job sweeps for out-of-band Drive changes. Authenticated
    by a shared secret via the `token` query param or `X-Reindex-Token` header.

    Responds 202 immediately; the reindex runs in the background through the
    coalescer (concurrent triggers collapse into one follow-up run), so callers
    never wait on embedding work. The incremental index_corpus() means a
    no-change run is just a Drive listing — effectively free."""
    settings = get_settings()
    expected = settings.reindex_token.strip()
    provided = (x_reindex_token or token or "").strip()
    if not expected or not provided or not secrets.compare_digest(provided, expected):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or missing reindex token",
        )
    if not settings.azure_configured:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Azure OpenAI / AI Search are not configured",
        )
    return {"status": reindexer.request_reindex()}
