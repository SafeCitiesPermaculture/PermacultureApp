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

import logging
import queue
import re
import threading
import time
from functools import lru_cache

from app.config import get_settings
from app.schemas import ChatTurn, Source

logger = logging.getLogger("ai-service")

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

    # max_retries=0: every call site runs its own retry loop with stall
    # deadlines; the SDK's hidden internal retries would multiply those
    # deadlines (each timed-out attempt silently re-sent twice).
    return OpenAI(
        base_url=settings.azure_openai_base_url,
        api_key=settings.azure_openai_key,
        max_retries=0,
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
        max_retries=0,
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
                # Same stall protection as chat: fail fast and retry, but let
                # the last attempt wait (large indexing batches can be slow).
                timeout=_EMBED_ATTEMPT_TIMEOUT if attempt < 2 else None,
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
# The serverless DeepSeek pool queues requests server-side before answering:
# create() blocks with no response headers, then the whole reply arrives in one
# burst. Measured 2026-07-29 over 10 raw calls with a tiny prompt and no
# context: min 1.4s, MEDIAN 24.7s, max 34.2s — so the queue wait is a property
# of the pool, not of the prompt or the connection.
#
# That wait also swings hard by the hour: the same 10-call probe run later the
# same day had a median around 9s. So any fixed "abandon after N seconds" is a
# bet on which regime the pool is in right now, and gets it wrong half the time.
#
# Streaming therefore HEDGES instead of abandoning. If no token has arrived by
# _HEDGE_DELAY, a second request is sent ALONGSIDE the first rather than
# replacing it, and whichever produces a token first wins; the losers are closed
# immediately. Measured on an interleaved A/B of 10 questions (2026-07-29), the
# two cases where a deadline actually engaged disagreed about abandoning —
# re-sending won one by 11.5s and lost the other by 7.5s, because abandoning
# throws away a request that was about to finish. Hedging takes the better of
# the two every time, at the cost of an extra in-flight request on the slow
# minority of questions only.
#
# Non-streaming has no partial progress to protect, so it keeps plain retries —
# but at a timeout above the pool's queue wait, since the old 30s sat below it
# and fired on ordinary requests.
_EMBED_ATTEMPT_TIMEOUT = 30.0  # embeddings: fast + on their own resource
_CHAT_ATTEMPT_TIMEOUT = 120.0  # non-streaming: queue wait AND full generation
_HEDGE_DELAY = 20.0  # streaming: wait this long before adding a parallel request
_MAX_IN_FLIGHT = 3  # streaming: never hedge beyond this many concurrent requests


def _chat(messages: list[dict], temperature: float = 0.3) -> str:
    """Run a single chat completion against DeepSeek-V4-Flash, with retries on
    transient errors and stalled requests. Returns the assistant message text."""
    settings = get_settings()
    client = _client()

    last_exc = None
    for attempt in range(3):
        try:
            resp = client.chat.completions.create(
                model=settings.azure_openai_chat_deployment,
                messages=messages,
                temperature=temperature,
                # A timeout raises APITimeoutError, which _is_transient treats
                # as retryable — that's what re-dispatches a queued request.
                timeout=_CHAT_ATTEMPT_TIMEOUT if attempt < 2 else None,
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


def _build_context_block(chunks: list[dict]) -> str:
    """Render retrieved chunks into a numbered context block."""
    lines = [
        f"[{i}] (source: {ch.get('source') or 'Untitled'})\n{ch.get('content', '')}"
        for i, ch in enumerate(chunks, start=1)
    ]
    return "\n\n".join(lines)


_SYSTEM_PROMPT = (
    "You are Elsie, the Safe Cities permaculture assistant. Your name is "
    "Elsie, so if someone addresses you as Elsie, respond naturally to your "
    "name. Answer using the "
    "organisation's documents (provided below as numbered sources) and the "
    "provided context. Cite the source document name(s) you used in your "
    "answer. If the documents don't contain the answer, say so plainly "
    "rather than guessing. If the user's message is conversational small "
    "talk (a greeting, thanks, chit-chat), just respond naturally and "
    "briefly — don't force the documents into it. When a task list is "
    "provided and the user asks "
    "about their schedule, tasks, or what's due, answer from that list. If "
    "the list is labelled as all tasks across the organisation (admin "
    "view), you may tell the user who has which tasks."
)

# Asks the model to declare which numbered documents its answer actually drew
# on, so the UI can show only genuinely-referenced sources (not everything
# retrieval happened to fetch). The marker is stripped before display.
_MARKER_INSTRUCTION = (
    "After your answer, on its own final line, write [[used: 1,3]] listing "
    "the numbers of the documents your answer actually drew on, or "
    "[[used: none]] if you didn't use any of them (for example a greeting, "
    "or a question the documents don't cover)."
)

_USED_MARKER_RE = re.compile(
    r"\s*\[\[\s*used\s*:\s*(none|[\d,\s]+)\s*\]\][\s.]*$", re.IGNORECASE
)


def resolve_used_sources(
    reply: str, context_chunks: list[dict] | None
) -> tuple[str, list[Source]]:
    """Strip the trailing [[used: ...]] marker from a finished reply and return
    (clean_reply, the distinct source documents the answer actually used).

    When the model forgot the marker, fall back to keeping the sources whose
    document title is mentioned in the reply text (the prompt asks it to cite
    names, so a used document normally appears verbatim)."""
    chunks = context_chunks or []
    m = _USED_MARKER_RE.search(reply)
    if m:
        clean = reply[: m.start()].rstrip()
        titles: list[str] = []
        spec = m.group(1).strip().lower()
        if spec != "none":
            for tok in spec.split(","):
                tok = tok.strip()
                if tok.isdigit() and 1 <= int(tok) <= len(chunks):
                    title = chunks[int(tok) - 1].get("source") or "Untitled"
                    if title not in titles:
                        titles.append(title)
        return clean, [Source(title=t) for t in titles]

    low = reply.lower()
    titles = []
    for ch in chunks:
        title = ch.get("source") or "Untitled"
        stem = title.rsplit(".", 1)[0].strip().lower()
        if title not in titles and (
            title.lower() in low or (len(stem) >= 4 and stem in low)
        ):
            titles.append(title)
    return reply, [Source(title=t) for t in titles]


def _build_messages(
    message: str,
    history: list[ChatTurn],
    task_context: str | None,
    context_chunks: list[dict] | None,
) -> list[dict]:
    chunks = context_chunks or []
    messages: list[dict] = [{"role": "system", "content": _SYSTEM_PROMPT}]

    preamble = []
    if task_context:
        preamble.append(f"The user's current tasks:\n{task_context}")
    if chunks:
        preamble.append(
            f"Relevant documents:\n{_build_context_block(chunks)}"
            f"\n\n{_MARKER_INSTRUCTION}"
        )
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
    are provided. Returns (reply, sources the answer actually used)."""
    messages = _build_messages(message, history, task_context, context_chunks)
    reply = _chat(messages)
    return resolve_used_sources(reply, context_chunks)


# The reply may end with a [[used: ...]] marker (see _MARKER_INSTRUCTION) which
# must never reach the client's typewriter. Withholding a fixed-length tail is
# the obvious way to guarantee that, but it costs the user ~16 tokens of dead
# air before the first word appears — and it charged that even to replies that
# were never asked for a marker. Instead, withhold only from a "[" that could
# still grow into the marker: ordinary prose contains none, so tokens flow the
# moment they arrive.
_MARKER_LEAD = "[[used:"
# A complete marker runs ~32 chars even with 8 spaced-out numbers; there is no
# point scanning a longer tail than this for the start of one.
_MARKER_SCAN = 64


def _marker_hold_index(acc: str, since: int) -> int:
    """The index from which `acc` must be withheld because it might be the
    beginning of a [[used: ...]] marker, or len(acc) if all of it is safe.

    `since` is how much has already been emitted — never rewind past it.
    """
    for p in range(max(since, len(acc) - _MARKER_SCAN), len(acc)):
        if acc[p] != "[":
            continue
        # Whitespace-insensitive, to match _USED_MARKER_RE's tolerance.
        tail = re.sub(r"\s+", "", acc[p:]).lower()
        if tail.startswith(_MARKER_LEAD) or _MARKER_LEAD.startswith(tail):
            # Withhold the whitespace in front of it too, so stripping the
            # marker can't leave the reply ending on a blank line.
            while p > since and acc[p - 1].isspace():
                p -= 1
            return p
    return len(acc)


def stream_chat_with_sources(
    message: str,
    history: list[ChatTurn],
    task_context: str | None = None,
    context_chunks: list[dict] | None = None,
):
    """Stream a reply as ("delta", text) events, then end with one
    ("sources", list[Source]) event naming the documents the answer used.

    The model appends a [[used: ...]] marker to its reply (see
    _MARKER_INSTRUCTION); it is held back and parsed out server-side so it never
    shows up in the client's typewriter."""
    acc = ""
    emitted = 0
    # No chunks means _build_messages never asked for a marker, so there is
    # nothing to withhold — the fastest replies (greetings, task questions) pay
    # no holdback at all.
    expect_marker = bool(context_chunks)
    for delta in stream_chat(message, history, task_context, context_chunks):
        acc += delta
        safe = _marker_hold_index(acc, emitted) if expect_marker else len(acc)
        if safe > emitted:
            yield ("delta", acc[emitted:safe])
            emitted = safe
    clean, sources = resolve_used_sources(acc, context_chunks)
    if len(clean) > emitted:
        yield ("delta", clean[emitted:])
    yield ("sources", sources)


def _run_attempt(
    client,
    model: str,
    messages: list[dict],
    out: queue.Queue,
    attempt: int,
    abandoned: threading.Event,
) -> None:
    """Worker thread: open one streaming request and forward its content deltas
    into `out`, tagged with which attempt they came from.

    Runs on a thread for two reasons: create() blocks until the pool dequeues
    the request (that IS the queue wait, before any headers arrive), and a
    blocking iterator can't be interrupted, so the consumer needs to be able to
    walk away from it."""
    try:
        stream = client.chat.completions.create(
            model=model,
            messages=messages,
            temperature=0.3,
            stream=True,
            # No timeout: losing attempts are closed by the consumer, and a
            # slow-but-live request is exactly what hedging is designed to keep.
            timeout=None,
        )
    except Exception as exc:  # noqa: BLE001 — consumer classifies it
        out.put(("error", attempt, exc))
        return

    # Hand the stream over so the consumer can close it if this attempt loses.
    out.put(("open", attempt, stream))
    try:
        for chunk in stream:
            if abandoned.is_set():
                return
            if not chunk.choices:
                continue
            delta = chunk.choices[0].delta
            if delta and delta.content:
                out.put(("delta", attempt, delta.content))
        out.put(("done", attempt, None))
    except Exception as exc:  # noqa: BLE001 — consumer classifies it
        if not abandoned.is_set():
            out.put(("error", attempt, exc))


def stream_chat(
    message: str,
    history: list[ChatTurn],
    task_context: str | None = None,
    context_chunks: list[dict] | None = None,
):
    """Yield the raw assistant reply token-by-token (a generator of text
    deltas), [[used: ...]] marker included — routers should normally use
    stream_chat_with_sources, which strips it.

    HEDGED: if no token has arrived within _HEDGE_DELAY, another request is sent
    alongside the one already in flight (up to _MAX_IN_FLIGHT), and the first to
    produce a token wins — the rest are closed at once. Nothing in flight is
    ever discarded on a timer, so a request that was about to answer still
    counts. Once the winner is streaming we can't replay it, so a mid-stream
    failure propagates to the caller.
    """
    settings = get_settings()
    client = _client()
    messages = _build_messages(message, history, task_context, context_chunks)

    out: queue.Queue = queue.Queue()
    flags: dict[int, threading.Event] = {}
    streams: dict[int, object] = {}
    live: set[int] = set()
    winner: int | None = None
    last_exc = None

    def launch() -> None:
        attempt = len(flags)
        flags[attempt] = threading.Event()
        live.add(attempt)
        threading.Thread(
            target=_run_attempt,
            args=(
                client,
                settings.azure_openai_chat_deployment,
                messages,
                out,
                attempt,
                flags[attempt],
            ),
            daemon=True,
        ).start()

    def close(attempt: int) -> None:
        flags[attempt].set()
        stream = streams.pop(attempt, None)
        if stream is not None:
            try:
                stream.close()
            except Exception:  # noqa: BLE001 — best-effort cleanup
                pass
        live.discard(attempt)

    try:
        launch()
        while True:
            # Only wait on a deadline while racing for a first token and there's
            # still room to add one; after that, block for the winner's output.
            waiting = winner is None and len(flags) < _MAX_IN_FLIGHT
            try:
                kind, aid, payload = out.get(timeout=_HEDGE_DELAY if waiting else None)
            except queue.Empty:
                logger.warning(
                    "No first token within %.0fs — hedging with request %d",
                    _HEDGE_DELAY,
                    len(flags) + 1,
                )
                launch()
                continue

            if kind == "open":
                # A loser can open after the race is already decided.
                if winner is not None and aid != winner:
                    streams[aid] = payload
                    close(aid)
                else:
                    streams[aid] = payload
                continue

            if kind == "error":
                last_exc = payload
                live.discard(aid)
                if aid == winner:
                    raise payload  # already streaming; can't silently replay
                if not live:
                    if len(flags) >= _MAX_IN_FLIGHT:
                        raise LLMUnavailableError(
                            "The assistant is busy right now. Please try again "
                            "in a moment."
                        ) from last_exc
                    launch()
                continue

            if kind == "done":
                if aid == winner:
                    return
                live.discard(aid)
                # An attempt that finished without ever yielding a token.
                if winner is None and not live:
                    if len(flags) >= _MAX_IN_FLIGHT:
                        return
                    launch()
                continue

            # kind == "delta"
            if winner is None:
                winner = aid
                for other in list(live):
                    if other != aid:
                        close(other)
            if aid == winner:
                yield payload
    finally:
        # Covers normal completion, errors, and the consumer closing the
        # generator (client disconnect) — nothing is left streaming. The winner
        # is included: on a disconnect its stream is still live, and leaving it
        # open would go on consuming tokens for an answer nobody will read.
        for attempt in list(flags):
            close(attempt)


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
