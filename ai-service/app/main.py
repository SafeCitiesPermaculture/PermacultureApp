"""AI Assistant service — FastAPI entrypoint.

A separate backend from the Express API. The React Native app calls this
service directly. Auth reuses the backend's JWTs; data reuses the same Mongo
cluster; Drive reuses the same service account.

On startup, the Drive corpus is pulled, chunked, embedded with Azure OpenAI
(text-embedding-3-small), and indexed into Azure AI Search — in a background
task so the service still boots green while indexing runs.

Run locally:  uvicorn app.main:app --reload --port 8000
"""

import asyncio
import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app import db
from app.config import get_settings
from app.routers import admin, chat, knowledge_base, report, summarize
from app.services import search

logger = logging.getLogger("ai-service")


async def _index_corpus_on_startup() -> None:
    """Pull + chunk + embed + index the Drive corpus, off the request path."""
    try:
        result = await asyncio.to_thread(search.index_corpus)
        logger.info(
            "Corpus indexing complete: %d indexed, %d skipped, %d failed",
            len(result.get("indexed", [])),
            len(result.get("skipped", [])),
            len(result.get("failed", [])),
        )
    except Exception:  # never let a startup task crash the process
        logger.exception("Corpus indexing failed on startup")


@asynccontextmanager
async def lifespan(app: FastAPI):
    db.connect()
    if settings.azure_configured:
        # Fire-and-forget: indexing can take a while; don't block boot/health.
        asyncio.create_task(_index_corpus_on_startup())
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
