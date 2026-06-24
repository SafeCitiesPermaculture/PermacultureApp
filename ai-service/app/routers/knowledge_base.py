"""POST /save-to-knowledge-base — write a conversation/summary back to Drive.

Saved files land in the "AI Conversations" subfolder so they grow the corpus
and become retrievable by future RAG queries (picked up on the next corpus
re-index). This endpoint does NOT require Azure OpenAI, so it works today.
"""

from fastapi import APIRouter, Depends, HTTPException, status

from app.auth import get_current_user
from app.schemas import (
    SaveToKnowledgeBaseRequest,
    SaveToKnowledgeBaseResponse,
)
from app.services import drive

router = APIRouter(tags=["knowledge-base"])


@router.post("/save-to-knowledge-base", response_model=SaveToKnowledgeBaseResponse)
async def save_to_knowledge_base(
    body: SaveToKnowledgeBaseRequest, user: dict = Depends(get_current_user)
):
    try:
        folder_id = drive.ensure_conversations_folder()
        # Tag the file with kind + author for later filtering/indexing.
        filename = f"[{body.kind}] {body.title}.md"
        header = (
            f"<!-- kind: {body.kind} | savedBy: {user.get('username')} -->\n\n"
        )
        created = drive.save_text_file(
            title=filename,
            content=header + body.content,
            folder_id=folder_id,
        )
    except drive.DriveNotConfiguredError as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail=str(exc)
        )
    except Exception as exc:  # Drive API errors
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Failed to save to Drive: {exc}",
        )

    # TODO(rag): trigger File Search re-index of the new file here.
    return SaveToKnowledgeBaseResponse(
        drive_file_id=created["id"],
        drive_link=created.get("webViewLink"),
        folder_id=folder_id,
    )
