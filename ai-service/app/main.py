"""AI Assistant service — FastAPI entrypoint.

A separate backend from the Express API. The React Native app calls this
service directly. Auth reuses the backend's JWTs; data reuses the same Mongo
cluster; Drive reuses the same service account.

Run locally:  uvicorn app.main:app --reload --port 8000
"""

from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app import db
from app.config import get_settings
from app.routers import admin, chat, knowledge_base, report, summarize


@asynccontextmanager
async def lifespan(app: FastAPI):
    db.connect()
    yield
    db.close()


settings = get_settings()

app = FastAPI(
    title="AFC Estate — AI Assistant",
    version="0.1.0",
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
    """Liveness + config readiness. Boots green even before Gemini is set."""
    return {
        "status": "ok",
        "gemini_configured": settings.gemini_configured,
        "mongo_configured": bool(settings.mongodb_uri),
        "drive_configured": bool(settings.google_drive_credentials_json),
    }
