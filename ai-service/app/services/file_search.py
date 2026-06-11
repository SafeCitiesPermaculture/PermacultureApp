"""Gemini File Search — indexes the Drive corpus and exposes the store for RAG.

Flow:
  1. get_or_create_store() — one File Search store for the org corpus.
  2. index_corpus() — list corpus files from Drive (excluding the write-back
     "AI Conversations" folder on the initial pass is optional), download each,
     and upload into the store. Idempotent: files already in the store (matched
     by display name) are skipped.
  3. chat attaches the store via the file_search tool (see services/gemini.py).

Indexing is blocking (polls long-running upload operations), so it is exposed
through a sync endpoint that FastAPI runs in a threadpool.
"""

import os
import tempfile
import time

from app.config import get_settings
from app.services import drive
from app.services.gemini import _client  # reuse the configured genai client

STORE_DISPLAY_NAME = "afc-estate-corpus"

# Mime types File Search can ingest. Images/video/audio are skipped.
_SUPPORTED_EXACT = {
    "application/pdf",
    "application/json",
    "text/csv",
    "text/plain",
    "text/markdown",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    # Google-native docs are exported to text/csv before upload (see drive.py).
    "application/vnd.google-apps.document",
    "application/vnd.google-apps.spreadsheet",
    "application/vnd.google-apps.presentation",
}


def _is_supported(mime: str) -> bool:
    return mime.startswith("text/") or mime in _SUPPORTED_EXACT


def get_or_create_store() -> str:
    """Return the corpus store's resource name, creating it if needed."""
    client = _client()
    for store in client.file_search_stores.list():
        if store.display_name == STORE_DISPLAY_NAME:
            return store.name
    created = client.file_search_stores.create(
        config={"display_name": STORE_DISPLAY_NAME}
    )
    return created.name


def get_indexed_store_name() -> str | None:
    """Return the store name if it exists and has documents, else None.

    Used by chat to decide whether to ground answers. Returns None (rather than
    raising) when Gemini isn't configured, so chat can degrade gracefully.
    """
    try:
        client = _client()
    except Exception:
        return None
    for store in client.file_search_stores.list():
        if store.display_name == STORE_DISPLAY_NAME:
            return store.name
    return None


def _existing_display_names(store_name: str) -> set[str]:
    client = _client()
    names = set()
    try:
        for doc in client.file_search_stores.documents.list(parent=store_name):
            if doc.display_name:
                names.add(doc.display_name)
    except Exception:
        # If listing isn't supported / store is empty, treat as none indexed.
        pass
    return names


def index_corpus(include_conversations: bool = False) -> dict:
    """Index the Drive corpus into the File Search store. Idempotent.

    Returns {"store": name, "indexed": [...], "skipped": [...], "failed": [...]}.
    """
    settings = get_settings()
    client = _client()
    store_name = get_or_create_store()

    exclude = None
    if not include_conversations:
        try:
            exclude = drive.ensure_conversations_folder()
        except Exception:
            exclude = None

    already = _existing_display_names(store_name)
    indexed, skipped, failed = [], [], []

    for f in drive.list_corpus_files(exclude_folder_id=exclude):
        name, mime = f["name"], f.get("mimeType", "")
        if not _is_supported(mime):
            skipped.append({"name": name, "reason": f"unsupported type {mime}"})
            continue
        if name in already:
            skipped.append({"name": name, "reason": "already indexed"})
            continue
        try:
            data, eff_mime, ext = drive.download_file_bytes(f["id"], mime)
            suffix = os.path.splitext(name)[1] or ext or ""
            with tempfile.NamedTemporaryFile(suffix=suffix, delete=False) as tmp:
                tmp.write(data)
                tmp_path = tmp.name
            try:
                # Note: do NOT pass mime_type — the File Search endpoint rejects
                # some valid mime strings (e.g. the OpenXML .docx type) and
                # infers it correctly from the file's extension/content instead.
                op = client.file_search_stores.upload_to_file_search_store(
                    file_search_store_name=store_name,
                    file=tmp_path,
                    config={"display_name": name},
                )
                _wait(op)
                indexed.append(name)
            finally:
                os.unlink(tmp_path)
        except Exception as exc:
            failed.append({"name": name, "error": str(exc)[:300]})

    return {
        "store": store_name,
        "indexed": indexed,
        "skipped": skipped,
        "failed": failed,
    }


def _wait(operation, timeout_s: int = 120, interval_s: float = 2.0):
    """Poll a long-running upload operation until done."""
    client = _client()
    waited = 0.0
    while not operation.done and waited < timeout_s:
        time.sleep(interval_s)
        waited += interval_s
        operation = client.operations.get(operation)
    return operation
