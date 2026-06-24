"""POST /chat — RAG query over the Drive corpus, optionally task-aware.

Two flavours:
  - /chat          : returns the whole answer as JSON {reply, sources}.
  - /chat/stream   : streams the answer token-by-token as Server-Sent Events,
                     for the website's typewriter effect.
"""

import json

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


@router.post("/chat", response_model=ChatResponse)
async def chat(body: ChatRequest, user: dict = Depends(get_current_user)):
    task_context = await _load_task_context(user) if body.include_tasks else None

    try:
        # Retrieve relevant corpus chunks (empty if nothing is indexed yet).
        chunks = search.search(body.message) if search.has_documents() else []
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
      {"type":"sources","sources":[...]}   sent once, up front
      {"type":"delta","text":"..."}        many, the streamed reply
      {"type":"error","message":"..."}     if generation fails mid-stream
      {"type":"done"}                       terminates the stream
    """
    task_context = await _load_task_context(user) if body.include_tasks else None

    # Retrieval happens before streaming, so config errors surface as a clean
    # 503 (rather than mid-stream). The token generation is what we stream.
    try:
        chunks = search.search(body.message) if search.has_documents() else []
    except (llm.LLMNotConfiguredError, llm.LLMUnavailableError) as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail=str(exc)
        )
    sources = llm.sources_for(chunks)

    def event_stream():
        yield _sse({"type": "sources", "sources": [s.model_dump() for s in sources]})
        try:
            for delta in llm.stream_chat(
                message=body.message,
                history=body.history,
                task_context=task_context,
                context_chunks=chunks,
            ):
                yield _sse({"type": "delta", "text": delta})
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
