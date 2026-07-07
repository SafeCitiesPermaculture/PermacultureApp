"""POST /chat — RAG query over the Drive corpus, optionally task-aware.

Two flavours:
  - /chat          : returns the whole answer as JSON {reply, sources}.
  - /chat/stream   : streams the answer token-by-token as Server-Sent Events,
                     for the website's typewriter effect.
"""

import json
import re

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import StreamingResponse

from app.auth import get_current_user
from app.db import get_database
from app.schemas import ChatRequest, ChatResponse
from app.services import llm, search

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


@router.post("/chat", response_model=ChatResponse)
async def chat(body: ChatRequest, user: dict = Depends(get_current_user)):
    task_context = await _load_task_context(user) if body.include_tasks else None

    try:
        # Retrieve relevant corpus chunks (empty if nothing is indexed yet, or
        # for questions that don't need documents at all).
        chunks = (
            search.search(body.message)
            if _needs_retrieval(body.message, body.include_tasks)
            and search.has_documents()
            else []
        )
        reply, sources = llm.generate_chat(
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
    task_context = await _load_task_context(user) if body.include_tasks else None

    # Retrieval happens before streaming, so config errors surface as a clean
    # 503 (rather than mid-stream). The token generation is what we stream.
    try:
        chunks = (
            search.search(body.message)
            if _needs_retrieval(body.message, body.include_tasks)
            and search.has_documents()
            else []
        )
    except (llm.LLMNotConfiguredError, llm.LLMUnavailableError) as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail=str(exc)
        )
    def event_stream():
        try:
            for kind, payload in llm.stream_chat_with_sources(
                message=body.message,
                history=body.history,
                task_context=task_context,
                context_chunks=chunks,
            ):
                if kind == "delta":
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
