"""AI Assistant service — FastAPI entrypoint.

A separate backend from the Express API. The React Native app calls this
service directly. Auth reuses the backend's JWTs; data reuses the same Mongo
cluster; Drive reuses the same service account.

On startup, the Drive corpus is pulled, chunked, embedded with Azure OpenAI
(text-embedding-3-small), and indexed into Azure AI Search — in a background
task so the service still boots green while indexing runs.

Run locally:  uvicorn app.main:app --reload --port 8000
"""

import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app import db
from app.config import get_settings
from app.routers import admin, chat, knowledge_base, report, summarize
from app.services import reindexer

# Root logger defaults to WARNING with no handler, which silently swallowed
# our own INFO lines (reindex results) in production logs. Uvicorn's loggers
# keep their own handlers, so this doesn't duplicate request logs. The Azure
# SDK logs every HTTP request at INFO — keep it at WARNING or logs drown.
logging.basicConfig(level=logging.INFO)
logging.getLogger("azure").setLevel(logging.WARNING)

logger = logging.getLogger("ai-service")


@asynccontextmanager
async def lifespan(app: FastAPI):
    db.connect()
    if settings.azure_configured:
        # Fire-and-forget: indexing can take a while; don't block boot/health.
        # Goes through the shared coalescer so an early /corpus/reindex-trigger
        # can't start a second concurrent run.
        reindexer.request_reindex()
    yield
    db.close()


settings = get_settings()

app = FastAPI(
    title="AFC Estate — AI Assistant",
    version="0.2.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(chat.router)
app.include_router(summarize.router)
app.include_router(report.router)
app.include_router(knowledge_base.router)
app.include_router(admin.router)


@app.get("/", tags=["meta"])
def root():
    return {"service": "afc-estate-ai-assistant", "status": "ok"}


@app.get("/health", tags=["meta"])
def health():
    """Liveness + config readiness. Boots green even before Azure is set."""
    return {
        "status": "ok",
        "azure_openai_configured": settings.azure_openai_configured,
        "azure_search_configured": settings.azure_search_configured,
        "mongo_configured": bool(settings.mongodb_uri),
        "drive_configured": bool(settings.google_drive_credentials_json),
    }
