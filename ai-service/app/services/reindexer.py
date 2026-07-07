"""Coalesced background corpus reindexing.

Shared by the startup task and the /corpus/reindex-trigger endpoint (which the
backend now fires after every corpus-affecting Drive mutation: upload, delete,
corpus toggle, saved conversation). At most one index_corpus() run is active
at a time; triggers that arrive mid-run collapse into a single follow-up run,
so a burst of uploads costs one extra sweep, not one per file.
"""

import asyncio
import logging

from app.services import search

logger = logging.getLogger("ai-service")

_state = {"running": False, "pending": False}


def request_reindex() -> str:
    """Start a background reindex now, or queue exactly one follow-up if a run
    is already active. Returns "started" or "queued". Must be called from the
    event loop (FastAPI handlers / lifespan)."""
    if _state["running"]:
        _state["pending"] = True
        return "queued"
    _state["running"] = True
    asyncio.get_running_loop().create_task(_worker())
    return "started"


async def _worker() -> None:
    try:
        while True:
            try:
                result = await asyncio.to_thread(search.index_corpus)
                logger.info(
                    "Reindex complete: %d indexed, %d skipped, %d failed, %d pruned",
                    len(result.get("indexed", [])),
                    len(result.get("skipped", [])),
                    len(result.get("failed", [])),
                    len(result.get("pruned", [])),
                )
            except Exception:  # never let a background task crash the loop
                logger.exception("Background reindex failed")
                _state["pending"] = False
                break
            if not _state["pending"]:
                break
            _state["pending"] = False
    finally:
        _state["running"] = False
