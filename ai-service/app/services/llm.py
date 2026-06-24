"""Azure OpenAI integration — chat + embeddings.

Chat runs on the DeepSeek-V4-Flash deployment; embeddings on
text-embedding-3-small. Both are reached through Azure's OpenAI-compatible
"/openai/v1" surface, so the stock `openai` SDK is used with `base_url` pointed
at the Azure resource and the deployment name passed as the `model`.

Until AZURE_OPENAI_ENDPOINT / AZURE_OPENAI_KEY are set, every call raises
LLMNotConfiguredError, which routers translate into an HTTP 503. The service
still boots and /health stays green so auth and the frontend can be wired up in
parallel.
"""

import time
from functools import lru_cache

from app.config import get_settings
from app.schemas import ChatTurn, Source

# text-embedding-3-small returns 1536-dimensional vectors.
EMBEDDING_DIMENSIONS = 1536


class LLMNotConfiguredError(RuntimeError):
    """Raised when Azure OpenAI isn't configured — surfaced to clients as 503."""


class LLMUnavailableError(RuntimeError):
    """Raised when Azure OpenAI is transiently unavailable after retries are
    exhausted — surfaced to clients as a friendly 503."""


@lru_cache
def _client():
    """Client for the chat resource (DeepSeek-V4-Flash)."""
    settings = get_settings()
    if not settings.azure_openai_configured:
        raise LLMNotConfiguredError(
            "AZURE_OPENAI_ENDPOINT / AZURE_OPENAI_KEY are not set — the "
            "assistant is not yet provisioned"
        )
    # Imported lazily so the package isn't required to boot the service.
    from openai import OpenAI

    return OpenAI(
        base_url=settings.azure_openai_base_url,
        api_key=settings.azure_openai_key,
    )


@lru_cache
def _embedding_client():
    """Client for the embedding resource. The embedding model may live on a
    different Azure project than chat, so this uses the embedding endpoint/key
    when configured and falls back to the chat client otherwise."""
    settings = get_settings()
    if not settings.embeddings_on_separate_resource:
        return _client()
    from openai import OpenAI

    return OpenAI(
        base_url=settings.azure_openai_embedding_base_url,
        api_key=settings.embedding_key,
    )


def _is_transient(exc) -> bool:
    """Whether an OpenAI SDK error is worth retrying (5xx / rate limit / network)."""
    from openai import APIConnectionError, APITimeoutError, RateLimitError
    from openai import APIStatusError

    if isinstance(exc, (APIConnectionError, APITimeoutError, RateLimitError)):
        return True
    if isinstance(exc, APIStatusError):
        return exc.status_code >= 500
    return False


# --- Embeddings -------------------------------------------------------------
def embed(texts: list[str]) -> list[list[float]]:
    """Embed a batch of texts with text-embedding-3-small. Order is preserved."""
    if not texts:
        return []
    settings = get_settings()
    client = _embedding_client()

    last_exc = None
    for attempt in range(3):
        try:
            resp = client.embeddings.create(
                model=settings.azure_openai_embedding_deployment,
                input=texts,
            )
            return [d.embedding for d in resp.data]
        except Exception as exc:  # noqa: BLE001 — classified below
            last_exc = exc
            if _is_transient(exc) and attempt < 2:
                time.sleep(1.5 * (attempt + 1))
                continue
            raise
    raise LLMUnavailableError(
        "The assistant is busy right now. Please try again in a moment."
    ) from last_exc


def embed_one(text: str) -> list[float]:
    return embed([text])[0]


# --- Chat -------------------------------------------------------------------
def _chat(messages: list[dict], temperature: float = 0.3) -> str:
    """Run a single chat completion against DeepSeek-V4-Flash, with retries on
    transient errors. Returns the assistant message text."""
    settings = get_settings()
    client = _client()

    last_exc = None
    for attempt in range(3):
        try:
            resp = client.chat.completions.create(
                model=settings.azure_openai_chat_deployment,
                messages=messages,
                temperature=temperature,
            )
            return (resp.choices[0].message.content or "").strip()
        except Exception as exc:  # noqa: BLE001 — classified below
            last_exc = exc
            if _is_transient(exc) and attempt < 2:
                time.sleep(1.5 * (attempt + 1))
                continue
            raise
    raise LLMUnavailableError(
        "The assistant is busy right now. Please try again in a moment."
    ) from last_exc


def _build_context_block(chunks: list[dict]) -> tuple[str, list[Source]]:
    """Render retrieved chunks into a numbered context block and collect the
    distinct source documents for citation."""
    if not chunks:
        return "", []

    lines = []
    sources: list[Source] = []
    seen = set()
    for i, ch in enumerate(chunks, start=1):
        title = ch.get("source") or "Untitled"
        lines.append(f"[{i}] (source: {title})\n{ch.get('content', '')}")
        if title not in seen:
            seen.add(title)
            sources.append(Source(title=title))
    return "\n\n".join(lines), sources


_SYSTEM_PROMPT = (
    "You are the Safe Cities permaculture assistant. Answer using the "
    "organisation's documents (provided below as numbered sources) and the "
    "provided context. Cite the source document name(s) you used in your "
    "answer. If the documents don't contain the answer, say so plainly "
    "rather than guessing. When a task list is provided and the user asks "
    "about their schedule, tasks, or what's due, answer from that list. If "
    "the list is labelled as all tasks across the organisation (admin "
    "view), you may tell the user who has which tasks."
)


def sources_for(context_chunks: list[dict] | None) -> list[Source]:
    """The distinct source documents behind a set of retrieved chunks."""
    return _build_context_block(context_chunks or [])[1]


def _build_messages(
    message: str,
    history: list[ChatTurn],
    task_context: str | None,
    context_chunks: list[dict] | None,
) -> list[dict]:
    context_block, _ = _build_context_block(context_chunks or [])
    messages: list[dict] = [{"role": "system", "content": _SYSTEM_PROMPT}]

    preamble = []
    if task_context:
        preamble.append(f"The user's current tasks:\n{task_context}")
    if context_block:
        preamble.append(f"Relevant documents:\n{context_block}")
    if preamble:
        messages.append({"role": "system", "content": "\n\n".join(preamble)})

    for turn in history:
        messages.append({"role": turn.role, "content": turn.content})
    messages.append({"role": "user", "content": message})
    return messages


def generate_chat(
    message: str,
    history: list[ChatTurn],
    task_context: str | None = None,
    context_chunks: list[dict] | None = None,
) -> tuple[str, list[Source]]:
    """Answer a user question, grounded in the retrieved corpus chunks when any
    are provided. Returns (reply, sources)."""
    messages = _build_messages(message, history, task_context, context_chunks)
    reply = _chat(messages)
    return reply, sources_for(context_chunks)


def stream_chat(
    message: str,
    history: list[ChatTurn],
    task_context: str | None = None,
    context_chunks: list[dict] | None = None,
):
    """Yield the assistant reply token-by-token (a generator of text deltas).

    Sources are derived from context_chunks separately (see sources_for) — they
    are known before generation, so the caller can emit them up front.
    """
    settings = get_settings()
    client = _client()
    messages = _build_messages(message, history, task_context, context_chunks)

    # Establishing the stream may hit a transient error; retry that part only.
    # Once tokens start flowing we can't safely replay, so mid-stream errors
    # propagate to the caller.
    last_exc = None
    stream = None
    for attempt in range(3):
        try:
            stream = client.chat.completions.create(
                model=settings.azure_openai_chat_deployment,
                messages=messages,
                temperature=0.3,
                stream=True,
            )
            break
        except Exception as exc:  # noqa: BLE001 — classified below
            last_exc = exc
            if _is_transient(exc) and attempt < 2:
                time.sleep(1.5 * (attempt + 1))
                continue
            raise
    if stream is None:
        raise LLMUnavailableError(
            "The assistant is busy right now. Please try again in a moment."
        ) from last_exc

    for chunk in stream:
        if not chunk.choices:
            continue
        delta = chunk.choices[0].delta
        if delta and delta.content:
            yield delta.content


def summarize(transcript: str, title: str | None = None) -> str:
    header = f"Meeting: {title}\n\n" if title else ""
    prompt = (
        f"{header}Summarize the following meeting transcript into concise "
        "bullet points covering decisions, action items (with owners if "
        "stated), and open questions.\n\nTranscript:\n" + transcript
    )
    return _chat([{"role": "user", "content": prompt}])


def generate_report(template: str, context: str | None, parameters: dict) -> str:
    # TODO(reports): replace with real templated prompts keyed by `template`.
    prompt = (
        f"Generate a '{template}' report for the Safe Cities permaculture team.\n"
        f"Parameters: {parameters}\n"
    )
    if context:
        prompt += f"\nContext:\n{context}\n"
    return _chat([{"role": "user", "content": prompt}])
