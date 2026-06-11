"""POST /chat — RAG query over the Drive corpus, optionally task-aware."""

from fastapi import APIRouter, Depends, HTTPException, status

from app.auth import get_current_user
from app.db import get_database
from app.schemas import ChatRequest, ChatResponse
from app.services import file_search, gemini

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
