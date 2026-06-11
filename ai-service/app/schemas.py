"""Request/response models for the AI Assistant endpoints."""

from typing import Literal

from pydantic import BaseModel, Field


# --- Shared -----------------------------------------------------------------
class ChatTurn(BaseModel):
    role: Literal["user", "assistant"]
    content: str


class Source(BaseModel):
    """A document the answer drew from (Drive file surfaced by File Search)."""

    title: str
    drive_file_id: str | None = None
    drive_link: str | None = None


# --- POST /chat -------------------------------------------------------------
class ChatRequest(BaseModel):
    message: str = Field(..., min_length=1)
    history: list[ChatTurn] = Field(default_factory=list)
    # When true, the user's open tasks are folded into the model context.
    include_tasks: bool = False


class ChatResponse(BaseModel):
    reply: str
    sources: list[Source] = Field(default_factory=list)


# --- POST /summarize --------------------------------------------------------
class SummarizeRequest(BaseModel):
    transcript: str = Field(..., min_length=1)
    title: str | None = None


class SummarizeResponse(BaseModel):
    summary: str


# --- POST /report -----------------------------------------------------------
class ReportRequest(BaseModel):
    # Template key (e.g. "weekly_progress"); concrete templates land later.
    template: str = Field(..., min_length=1)
    context: str | None = None
    parameters: dict = Field(default_factory=dict)


class ReportResponse(BaseModel):
    report: str


# --- POST /save-to-knowledge-base -------------------------------------------
class SaveToKnowledgeBaseRequest(BaseModel):
    title: str = Field(..., min_length=1)
    content: str = Field(..., min_length=1)
    kind: Literal["conversation", "summary", "report"] = "conversation"


class SaveToKnowledgeBaseResponse(BaseModel):
    drive_file_id: str
    drive_link: str | None = None
    folder_id: str
