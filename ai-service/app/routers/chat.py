"""POST /chat — RAG query over the Drive corpus, optionally task-aware."""

from fastapi import APIRouter, Depends, HTTPException, status

from app.auth import get_current_user
from app.db import get_database
from app.schemas import ChatRequest, ChatResponse
from app.services import file_search, gemini

router = APIRouter(tags=["chat"])


async def _load_task_context(user: dict) -> str:
    """Render the user's open tasks as plain text for the model."""
    cursor = (
        get_database()
        .tasks.find({"assignedTo": user["_id"], "isCompleted": False})
        .sort("dueDateTime", 1)
    )
    lines = []
    async for task in cursor:
        due = task.get("dueDateTime")
        lines.append(f"- {task.get('name', 'Untitled')} (due {due})")
    return "\n".join(lines) if lines else "No open tasks."


@router.post("/chat", response_model=ChatResponse)
async def chat(body: ChatRequest, user: dict = Depends(get_current_user)):
    task_context = await _load_task_context(user) if body.include_tasks else None
    store = file_search.get_indexed_store_name()  # None if corpus not indexed yet

    try:
        reply, sources = gemini.generate_chat(
            message=body.message,
            history=body.history,
            task_context=task_context,
            file_search_store=store,
        )
    except gemini.GeminiNotConfiguredError as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail=str(exc)
        )

    return ChatResponse(reply=reply, sources=sources)
