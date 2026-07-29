"""POST /chat — RAG query over the Drive corpus, optionally task-aware.

Two flavours:
  - /chat          : returns the whole answer as JSON {reply, sources}.
  - /chat/stream   : streams the answer token-by-token as Server-Sent Events,
                     for the website's typewriter effect.
"""

import asyncio
import json
import logging
import re
import time

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.concurrency import run_in_threadpool
from fastapi.responses import StreamingResponse

from app.auth import get_current_user
from app.db import get_database
from app.schemas import ChatRequest, ChatResponse
from app.services import llm, search

logger = logging.getLogger("ai-service")

router = APIRouter(tags=["chat"])


async def _load_task_context(user: dict) -> str:
    """Render open tasks as plain text for the model.

    Admins see ALL open tasks across the organisation (with the assignee's
    name); regular users see only their own.
    """
    db = get_database()
    is_admin = user.get("userRole") == "admin"

    query = {"isCompleted": False}
    if not is_admin:
        query["assignedTo"] = user["_id"]

    tasks = [t async for t in db.tasks.find(query).sort("dueDateTime", 1)]
    if not tasks:
        return "There are no open tasks." if is_admin else "You have no open tasks."

    if is_admin:
        # Map assignee ids -> usernames so the admin can ask who has what.
        ids = list({t["assignedTo"] for t in tasks if t.get("assignedTo")})
        names = {}
        async for u in db.users.find({"_id": {"$in": ids}}):
            names[u["_id"]] = u.get("username", "Unknown")
        lines = [
            f"- {names.get(t.get('assignedTo'), 'Unassigned')}: "
            f"{t.get('name', 'Untitled')} (due {t.get('dueDateTime')})"
            for t in tasks
        ]
        return "All open tasks across the organisation:\n" + "\n".join(lines)

    lines = [
        f"- {t.get('name', 'Untitled')} (due {t.get('dueDateTime')})"
        for t in tasks
    ]
    return "\n".join(lines)


# Questions that clearly don't need document retrieval skip it entirely, which
# removes 2 network round trips (embedding + search) before the reply starts.
_SMALLTALK_RE = re.compile(
    r"^\s*(hi|hiya|hello|hey|yo|thanks?|thank you|ok(ay)?|"
    r"good (morning|afternoon|evening)|how are you)\b[\s!,.?]*$",
    re.IGNORECASE,
)
_TASK_RE = re.compile(
    r"\b(tasks?|schedule|to-?dos?|due|overdue|assign(ed|ments)?)\b", re.IGNORECASE
)
_DOC_RE = re.compile(
    r"\b(documents?|files?|docs?|guides?|reports?|manuals?|policy|policies)\b",
    re.IGNORECASE,
)


def _needs_retrieval(message: str, include_tasks: bool) -> bool:
    """Whether a message should hit the document index.

    Greetings never do. Task/schedule questions answer straight from the task
    context (when it's included) — unless the question also mentions documents.
    """
    if _SMALLTALK_RE.match(message):
        return False
    if include_tasks and _TASK_RE.search(message) and not _DOC_RE.search(message):
        return False
    return True


async def _retrieve(message: str, include_tasks: bool) -> list[dict]:
    """Relevant corpus chunks for a question — empty if nothing is indexed yet,
    or for questions that don't need documents at all.

    The Azure Search and embedding clients are synchronous, so this runs OFF the
    event loop: called inline it would block the whole worker for the duration
    of retrieval, stalling every other request — including the token flushes of
    other users' in-flight streams."""
    if not _needs_retrieval(message, include_tasks):
        return []

    def _blocking() -> list[dict]:
        return search.search(message) if search.has_documents() else []

    return await run_in_threadpool(_blocking)


async def _none() -> None:
    return None


async def _load_context(
    body: ChatRequest, user: dict
) -> tuple[str | None, list[dict]]:
    """Task context and corpus chunks, fetched CONCURRENTLY — they're
    independent, and running them in sequence put a whole Mongo round trip in
    front of retrieval on every task-aware question."""
    task_context, chunks = await asyncio.gather(
        _load_task_context(user) if body.include_tasks else _none(),
        _retrieve(body.message, body.include_tasks),
    )
    return task_context, chunks


@router.post("/chat", response_model=ChatResponse)
async def chat(body: ChatRequest, user: dict = Depends(get_current_user)):
    try:
        task_context, chunks = await _load_context(body, user)
        # Off the event loop for the same reason as retrieval — and this one
        # blocks for the whole generation, not just a round trip.
        reply, sources = await run_in_threadpool(
            llm.generate_chat,
            message=body.message,
            history=body.history,
            task_context=task_context,
            context_chunks=chunks,
        )
    except (llm.LLMNotConfiguredError, llm.LLMUnavailableError) as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail=str(exc)
        )

    return ChatResponse(reply=reply, sources=sources)


def _sse(payload: dict) -> str:
    return f"data: {json.dumps(payload)}\n\n"


@router.post("/chat/stream")
async def chat_stream(body: ChatRequest, user: dict = Depends(get_current_user)):
    """Stream the answer token-by-token as Server-Sent Events.

    Event payloads (one JSON object per `data:` line):
      {"type":"delta","text":"..."}        many, the streamed reply
      {"type":"sources","sources":[...]}   sent once, AFTER the deltas — only
                                            the documents the answer actually
                                            used (the model declares them; see
                                            llm.stream_chat_with_sources)
      {"type":"error","message":"..."}     if generation fails mid-stream
      {"type":"done"}                       terminates the stream
    """
    started = time.perf_counter()

    # Context is gathered before streaming, so config errors surface as a clean
    # 503 (rather than mid-stream). The token generation is what we stream.
    try:
        task_context, chunks = await _load_context(body, user)
    except (llm.LLMNotConfiguredError, llm.LLMUnavailableError) as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail=str(exc)
        )
    context_ms = (time.perf_counter() - started) * 1000

    def event_stream():
        # Timings for the two things users actually feel: how long the typing
        # dots sit there, and the longest silence once text is flowing. The
        # first-token figure is measured where the client sees it (after any
        # marker holdback), not where the model starts.
        first_at = None
        last_at = started
        longest_gap = 0.0
        chars = 0
        try:
            for kind, payload in llm.stream_chat_with_sources(
                message=body.message,
                history=body.history,
                task_context=task_context,
                context_chunks=chunks,
            ):
                if kind == "delta":
                    now = time.perf_counter()
                    if first_at is None:
                        first_at = now
                    else:
                        longest_gap = max(longest_gap, now - last_at)
                    last_at = now
                    chars += len(payload)
                    yield _sse({"type": "delta", "text": payload})
                else:
                    yield _sse(
                        {
                            "type": "sources",
                            "sources": [s.model_dump() for s in payload],
                        }
                    )
        except (llm.LLMNotConfiguredError, llm.LLMUnavailableError) as exc:
            yield _sse({"type": "error", "message": str(exc)})
        except Exception:  # noqa: BLE001 — never leak a traceback into the stream
            yield _sse(
                {"type": "error", "message": "The assistant hit an error. Please try again."}
            )
        finally:
            logger.info(
                "chat/stream: context %.0fms, first token %s, longest gap "
                "%.0fms, total %.0fms, %d chars, %d chunks",
                context_ms,
                f"{(first_at - started) * 1000:.0f}ms" if first_at else "never",
                longest_gap * 1000,
                (time.perf_counter() - started) * 1000,
                chars,
                len(chunks),
            )
        yield _sse({"type": "done"})

    return StreamingResponse(
        event_stream(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            # Disable proxy buffering so tokens flush immediately.
            "X-Accel-Buffering": "no",
        },
    )
