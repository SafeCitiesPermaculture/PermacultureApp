"""Azure AI Search — vector store for the Drive corpus.

Flow:
  1. ensure_index() — create the vector index once (idempotent).
  2. index_corpus() — recursively list corpus files under the documents root
     (the same set the website Documents tab shows), skip any an admin flagged
     out of the corpus (scInCorpus="false"), download each, extract plain text,
     chunk it, embed the chunks with Azure OpenAI text-embedding-3-small, and
     upload the chunk vectors into Azure AI Search. Idempotent: sources already
     present in the index are skipped (pass force=True to re-embed everything).
     It also PRUNES: chunks for any indexed source no longer in the corpus
     (deleted from Drive or flagged out) are removed, so the assistant stops
     citing them.
  3. /chat retrieves the top chunks for a question via vector search (see
     services/llm.py for generation).

Indexing is blocking (downloads + embeds), so it runs in a threadpool: from the
admin /corpus/reindex endpoint and, on startup, from a background task.
"""

import hashlib
import io
import re
from functools import lru_cache

from app.config import get_settings
from app.services import drive, llm

# Mime types we can extract text from. Images/video/audio are skipped.
_SUPPORTED_EXACT = {
    "application/pdf",
    "application/json",
    "text/csv",
    "text/plain",
    "text/markdown",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    # Google-native docs are exported to text/plain or text/csv before download
    # (see drive.py), so by the time we extract they're already text.
    "application/vnd.google-apps.document",
    "application/vnd.google-apps.spreadsheet",
    "application/vnd.google-apps.presentation",
}

_CHUNK_CHARS = 2000
_CHUNK_OVERLAP = 200


def _is_supported(mime: str) -> bool:
    return mime.startswith("text/") or mime in _SUPPORTED_EXACT


# --- Azure AI Search clients ------------------------------------------------
@lru_cache
def _index_client():
    settings = get_settings()
    if not settings.azure_search_configured:
        raise llm.LLMNotConfiguredError(
            "AZURE_SEARCH_ENDPOINT / AZURE_SEARCH_KEY are not set"
        )
    from azure.core.credentials import AzureKeyCredential
    from azure.search.documents.indexes import SearchIndexClient

    return SearchIndexClient(
        endpoint=settings.azure_search_endpoint,
        credential=AzureKeyCredential(settings.azure_search_key),
    )


@lru_cache
def _search_client():
    settings = get_settings()
    if not settings.azure_search_configured:
        raise llm.LLMNotConfiguredError(
            "AZURE_SEARCH_ENDPOINT / AZURE_SEARCH_KEY are not set"
        )
    from azure.core.credentials import AzureKeyCredential
    from azure.search.documents import SearchClient

    return SearchClient(
        endpoint=settings.azure_search_endpoint,
        index_name=settings.azure_search_index,
        credential=AzureKeyCredential(settings.azure_search_key),
    )


def ensure_index() -> str:
    """Create the vector index if it doesn't exist. Returns the index name."""
    settings = get_settings()
    name = settings.azure_search_index
    client = _index_client()

    from azure.core.exceptions import ResourceNotFoundError
    from azure.search.documents.indexes.models import (
        HnswAlgorithmConfiguration,
        SearchableField,
        SearchField,
        SearchFieldDataType,
        SimpleField,
        VectorSearch,
        VectorSearchProfile,
    )

    try:
        client.get_index(name)
        return name
    except ResourceNotFoundError:
        pass

    fields = [
        SimpleField(name="id", type=SearchFieldDataType.String, key=True),
        SearchableField(name="content", type=SearchFieldDataType.String),
        # Facetable so we can cheaply list which documents are already indexed.
        SearchableField(
            name="source",
            type=SearchFieldDataType.String,
            filterable=True,
            facetable=True,
        ),
        SimpleField(
            name="chunk_index", type=SearchFieldDataType.Int32, filterable=True
        ),
        SearchField(
            name="embedding",
            type=SearchFieldDataType.Collection(SearchFieldDataType.Single),
            searchable=True,
            vector_search_dimensions=llm.EMBEDDING_DIMENSIONS,
            vector_search_profile_name="default-profile",
        ),
    ]

    vector_search = VectorSearch(
        algorithms=[HnswAlgorithmConfiguration(name="default-hnsw")],
        profiles=[
            VectorSearchProfile(
                name="default-profile", algorithm_configuration_name="default-hnsw"
            )
        ],
    )

    from azure.search.documents.indexes.models import SearchIndex

    client.create_index(
        SearchIndex(name=name, fields=fields, vector_search=vector_search)
    )
    return name


# --- Text extraction + chunking ---------------------------------------------
def _extract_text(data: bytes, mime: str, name: str) -> str:
    """Extract plain text from a downloaded corpus file."""
    # Google-native exports and anything text-like arrive as decodable bytes.
    if mime.startswith("text/") or mime in (
        "application/json",
        "text/csv",
        "application/vnd.google-apps.document",
        "application/vnd.google-apps.spreadsheet",
        "application/vnd.google-apps.presentation",
    ):
        return data.decode("utf-8", errors="ignore")

    if mime == "application/pdf" or name.lower().endswith(".pdf"):
        from pypdf import PdfReader

        reader = PdfReader(io.BytesIO(data))
        return "\n".join((page.extract_text() or "") for page in reader.pages)

    if mime.endswith("wordprocessingml.document") or name.lower().endswith(".docx"):
        import docx

        document = docx.Document(io.BytesIO(data))
        return "\n".join(p.text for p in document.paragraphs)

    # Last resort: best-effort decode.
    return data.decode("utf-8", errors="ignore")


def _chunk_text(text: str) -> list[str]:
    """Split text into overlapping character windows, preferring paragraph/word
    boundaries so chunks stay coherent."""
    text = re.sub(r"\n{3,}", "\n\n", text).strip()
    if not text:
        return []
    if len(text) <= _CHUNK_CHARS:
        return [text]

    chunks: list[str] = []
    start = 0
    while start < len(text):
        end = start + _CHUNK_CHARS
        if end >= len(text):
            chunks.append(text[start:].strip())
            break
        # Back off to the nearest whitespace within the window so we don't split
        # mid-word.
        split = text.rfind(" ", start + _CHUNK_CHARS - _CHUNK_OVERLAP, end)
        if split == -1 or split <= start:
            split = end
        chunks.append(text[start:split].strip())
        start = max(split - _CHUNK_OVERLAP, start + 1)
    return [c for c in chunks if c]


def _doc_id(file_id: str, chunk_index: int) -> str:
    """Deterministic, Azure-Search-safe document key (file id + chunk index)."""
    digest = hashlib.sha1(file_id.encode("utf-8")).hexdigest()
    return f"{digest}-{chunk_index}"


# --- Indexing ---------------------------------------------------------------
def indexed_sources() -> set[str]:
    """Distinct source filenames already present in the index (via facets)."""
    try:
        client = _search_client()
        results = client.search(
            search_text="*",
            facets=["source,count:10000"],
            top=0,
        )
        facets = results.get_facets() or {}
        return {f["value"] for f in facets.get("source", [])}
    except Exception:
        return set()


def _in_corpus(f: dict) -> bool:
    """Honour the admin per-doc flag stored on the Drive file: scInCorpus="false"
    excludes a file from the AI corpus. Absent flag = included."""
    return (f.get("properties") or {}).get("scInCorpus") != "false"


def _escape_odata(value: str) -> str:
    """Escape single quotes for an OData filter string literal."""
    return value.replace("'", "''")


def _delete_source(client, source: str) -> int:
    """Delete every indexed chunk belonging to a source filename. Returns the
    number of chunks removed."""
    results = client.search(
        search_text="*",
        filter=f"source eq '{_escape_odata(source)}'",
        select=["id"],
        top=1000,
    )
    ids = [{"id": r["id"]} for r in results]
    if ids:
        client.delete_documents(documents=ids)
    return len(ids)


def index_corpus(force: bool = False) -> dict:
    """Index the Drive corpus into Azure AI Search and prune deletions.

    - Scans the documents root recursively (same set as the Documents tab).
    - Skips files an admin flagged out of the corpus (scInCorpus="false").
    - Adds new files (idempotent; already-indexed sources skipped unless force).
    - Prunes chunks for any indexed source no longer in the corpus (deleted from
      Drive or flagged out).

    Returns {"index", "indexed", "skipped", "failed", "pruned"}.
    """
    ensure_index()
    client = _search_client()

    source_files = [f for f in drive.list_corpus_files() if _in_corpus(f)]
    # Filenames that SHOULD be in the index. Pruning is keyed on the source name
    # (the index stores `source`), so two distinct files sharing a name can't be
    # pruned independently — acceptable given filenames are effectively unique.
    current_names = {f["name"] for f in source_files}

    already = set() if force else indexed_sources()
    indexed, skipped, failed = [], [], []

    for f in source_files:
        name, mime = f["name"], f.get("mimeType", "")
        if not _is_supported(mime):
            skipped.append({"name": name, "reason": f"unsupported type {mime}"})
            continue
        if name in already:
            skipped.append({"name": name, "reason": "already indexed"})
            continue
        try:
            data, eff_mime, _ext = drive.download_file_bytes(f["id"], mime)
            text = _extract_text(data, eff_mime, name)
            chunks = _chunk_text(text)
            if not chunks:
                skipped.append({"name": name, "reason": "no extractable text"})
                continue

            vectors = llm.embed(chunks)
            documents = [
                {
                    "id": _doc_id(f["id"], i),
                    "content": chunk,
                    "source": name,
                    "chunk_index": i,
                    "embedding": vector,
                }
                for i, (chunk, vector) in enumerate(zip(chunks, vectors))
            ]
            client.upload_documents(documents=documents)
            indexed.append({"name": name, "chunks": len(chunks)})
        except Exception as exc:
            failed.append({"name": name, "error": str(exc)[:300]})

    # Prune: any indexed source no longer in the corpus is stale — remove it so
    # the assistant stops retrieving deleted/excluded documents.
    pruned = []
    for stale in indexed_sources() - current_names:
        try:
            pruned.append(
                {"name": stale, "chunks": _delete_source(client, stale)}
            )
        except Exception as exc:
            failed.append(
                {"name": stale, "error": f"prune failed: {str(exc)[:200]}"}
            )

    return {
        "index": get_settings().azure_search_index,
        "indexed": indexed,
        "skipped": skipped,
        "failed": failed,
        "pruned": pruned,
    }


def has_documents() -> bool:
    """Whether the index exists and holds at least one chunk. Returns False
    (rather than raising) when Azure isn't configured, so chat degrades."""
    try:
        client = _search_client()
        results = client.search(search_text="*", top=0, include_total_count=True)
        return (results.get_count() or 0) > 0
    except Exception:
        return False


def search(query: str, k: int = 5) -> list[dict]:
    """Embed the question and return the top-k corpus chunks by vector
    similarity. Each result is {source, content, chunk_index}."""
    from azure.search.documents.models import VectorizedQuery

    vector = llm.embed_one(query)
    client = _search_client()
    results = client.search(
        search_text=None,
        vector_queries=[
            VectorizedQuery(vector=vector, k_nearest_neighbors=k, fields="embedding")
        ],
        select=["source", "content", "chunk_index"],
        top=k,
    )
    return [
        {
            "source": r.get("source"),
            "content": r.get("content"),
            "chunk_index": r.get("chunk_index"),
        }
        for r in results
    ]
