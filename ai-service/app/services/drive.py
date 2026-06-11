"""Google Drive access via the shared service account.

Reuses GOOGLE_DRIVE_CREDENTIALS_JSON — the same service account the Express
backend uses (fileuploader@safecitiespermaculture.iam.gserviceaccount.com),
which already owns/has access to the RAG corpus folders.

Responsibilities:
  - read the corpus (used later when indexing into Gemini File Search)
  - write conversations/summaries back into an "AI Conversations" subfolder
"""

from functools import lru_cache
from io import BytesIO

from googleapiclient.discovery import build
from googleapiclient.http import MediaIoBaseDownload, MediaIoBaseUpload
from google.oauth2 import service_account

from app.config import get_settings

_SCOPES = ["https://www.googleapis.com/auth/drive"]
_FOLDER_MIME = "application/vnd.google-apps.folder"

# Google-native docs must be exported, not downloaded directly. Map them to a
# File Search-friendly format.
_GOOGLE_EXPORT = {
    "application/vnd.google-apps.document": ("text/plain", ".txt"),
    "application/vnd.google-apps.spreadsheet": ("text/csv", ".csv"),
    "application/vnd.google-apps.presentation": ("text/plain", ".txt"),
}

# Mirrors the backend's pattern of also sharing created objects with the human
# Safe Cities account so staff can see them in their own Drive UI.
_SHARE_WITH = "safecitiespermaculture@gmail.com"


class DriveNotConfiguredError(RuntimeError):
    """Raised when GOOGLE_DRIVE_CREDENTIALS_JSON is missing/empty."""


@lru_cache
def _service():
    settings = get_settings()
    creds_info = settings.google_credentials
    if not creds_info:
        raise DriveNotConfiguredError(
            "GOOGLE_DRIVE_CREDENTIALS_JSON is not set"
        )
    creds = service_account.Credentials.from_service_account_info(
        creds_info, scopes=_SCOPES
    )
    return build("drive", "v3", credentials=creds, cache_discovery=False)


def ensure_conversations_folder() -> str:
    """Return the id of the write-back folder, creating it if absent."""
    settings = get_settings()
    name = settings.ai_conversations_folder_name
    svc = _service()

    safe_name = name.replace("'", "\\'")
    query = (
        f"name = '{safe_name}' and mimeType = '{_FOLDER_MIME}' "
        "and trashed = false"
    )
    found = (
        svc.files()
        .list(q=query, fields="files(id, name)", pageSize=1)
        .execute()
        .get("files", [])
    )
    if found:
        return found[0]["id"]

    folder = (
        svc.files()
        .create(
            body={"name": name, "mimeType": _FOLDER_MIME},
            fields="id",
        )
        .execute()
    )
    folder_id = folder["id"]
    _share(folder_id)
    return folder_id


def save_text_file(
    title: str, content: str, folder_id: str, mime_type: str = "text/markdown"
) -> dict:
    """Upload a text document into the given folder. Returns {id, webViewLink}."""
    svc = _service()
    media = MediaIoBaseUpload(
        BytesIO(content.encode("utf-8")), mimetype=mime_type, resumable=False
    )
    created = (
        svc.files()
        .create(
            body={"name": title, "parents": [folder_id]},
            media_body=media,
            fields="id, webViewLink",
        )
        .execute()
    )
    _share(created["id"])
    return created


def list_corpus_files(exclude_folder_id: str | None = None) -> list[dict]:
    """List all non-folder, non-trashed files the service account can see — the
    RAG corpus. Optionally excludes files inside `exclude_folder_id` (the
    write-back "AI Conversations" folder), so the initial corpus build doesn't
    pull in saved conversations.

    Returns dicts of {id, name, mimeType, parents}.
    """
    svc = _service()
    files: list[dict] = []
    page_token = None
    query = f"mimeType != '{_FOLDER_MIME}' and trashed = false"
    while True:
        resp = (
            svc.files()
            .list(
                q=query,
                fields="nextPageToken, files(id, name, mimeType, parents)",
                pageSize=100,
                pageToken=page_token,
            )
            .execute()
        )
        for f in resp.get("files", []):
            if exclude_folder_id and exclude_folder_id in (f.get("parents") or []):
                continue
            files.append(f)
        page_token = resp.get("nextPageToken")
        if not page_token:
            break
    return files


def download_file_bytes(file_id: str, mime_type: str) -> tuple[bytes, str, str]:
    """Download a Drive file's content.

    Returns (data, effective_mime, suggested_extension). Google-native docs are
    exported to a text format; everything else is downloaded as-is.
    """
    svc = _service()
    buf = BytesIO()

    if mime_type in _GOOGLE_EXPORT:
        export_mime, ext = _GOOGLE_EXPORT[mime_type]
        request = svc.files().export_media(fileId=file_id, mimeType=export_mime)
        effective_mime = export_mime
    else:
        request = svc.files().get_media(fileId=file_id)
        effective_mime = mime_type
        ext = ""

    downloader = MediaIoBaseDownload(buf, request)
    done = False
    while not done:
        _, done = downloader.next_chunk()
    return buf.getvalue(), effective_mime, ext


def _share(file_id: str) -> None:
    try:
        _service().permissions().create(
            fileId=file_id,
            body={"type": "user", "role": "writer", "emailAddress": _SHARE_WITH},
            sendNotificationEmail=False,
        ).execute()
    except Exception:
        # Sharing is best-effort; failing it shouldn't break the write-back.
        pass
