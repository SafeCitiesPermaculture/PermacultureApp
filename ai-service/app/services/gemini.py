"""Gemini 2.5 Flash integration.

NOTE: GEMINI_API_KEY is not provisioned yet. Until it is set, every method here
raises GeminiNotConfiguredError, which the routers translate into an HTTP 503.
The service still boots and /health stays green so the frontend and auth can be
wired up in parallel.

RAG over the Drive corpus is intended to run through Gemini File Search; the
retrieval wiring is marked with TODOs where the File Search store plugs in.
"""

from functools import lru_cache

from app.config import get_settings
from app.schemas import ChatTurn, Source


class GeminiNotConfiguredError(RuntimeError):
    """Raised when GEMINI_API_KEY is missing — surfaced to clients as 503."""


@lru_cache
def _client():
    settings = get_settings()
    if not settings.gemini_configured:
        raise GeminiNotConfiguredError(
            "GEMINI_API_KEY is not set — the assistant is not yet provisioned"
        )
    # Imported lazily so the package isn't required to boot the service.
    from google import genai

    return genai.Client(api_key=settings.gemini_api_key)


def _generate(
    prompt: str,
    system_instruction: str | None = None,
    file_search_store: str | None = None,
):
    """Run a single generation. Returns the raw response so callers can read
    grounding metadata when File Search is used."""
    settings = get_settings()
    client = _client()

    from google.genai import types

    kwargs = {}
    if system_instruction:
        kwargs["system_instruction"] = system_instruction
    if file_search_store:
        kwargs["tools"] = [
            types.Tool(
                file_search=types.FileSearch(
                    file_search_store_names=[file_search_store]
                )
            )
        ]
    config = types.GenerateContentConfig(**kwargs) if kwargs else None

    return client.models.generate_content(
        model=settings.gemini_model,
        contents=prompt,
        config=config,
    )


def _extract_sources(resp) -> list[Source]:
    """Pull cited documents from File Search grounding metadata (best-effort)."""
    sources: list[Source] = []
    seen = set()
    try:
        for cand in resp.candidates or []:
            gm = getattr(cand, "grounding_metadata", None)
            for chunk in (getattr(gm, "grounding_chunks", None) or []):
                ctx = getattr(chunk, "retrieved_context", None)
                title = getattr(ctx, "title", None) if ctx else None
                if title and title not in seen:
                    seen.add(title)
                    sources.append(Source(title=title))
    except Exception:
        pass
    return sources


def generate_chat(
    message: str,
    history: list[ChatTurn],
    task_context: str | None = None,
    file_search_store: str | None = None,
) -> tuple[str, list[Source]]:
    """Answer a user question, grounded in the File Search corpus when one is
    provided. Returns (reply, sources)."""
    convo = "\n".join(f"{t.role}: {t.content}" for t in history)
    blocks = []
    if task_context:
        blocks.append(f"The user's current tasks:\n{task_context}")
    if convo:
        blocks.append(f"Conversation so far:\n{convo}")
    blocks.append(f"user: {message}")
    prompt = "\n\n".join(blocks)

    system = (
        "You are the Safe Cities permaculture assistant. Answer using the "
        "organisation's documents and the provided context. If you don't know, "
        "say so plainly. When the user's current tasks are provided and they "
        "ask about their schedule, tasks, or what's due, answer from that list."
    )
    resp = _generate(
        prompt, system_instruction=system, file_search_store=file_search_store
    )
    reply = (resp.text or "").strip()
    return reply, _extract_sources(resp)


def summarize(transcript: str, title: str | None = None) -> str:
    header = f"Meeting: {title}\n\n" if title else ""
    prompt = (
        f"{header}Summarize the following meeting transcript into concise "
        "bullet points covering decisions, action items (with owners if "
        "stated), and open questions.\n\nTranscript:\n" + transcript
    )
    return (_generate(prompt).text or "").strip()


def generate_report(template: str, context: str | None, parameters: dict) -> str:
    # TODO(reports): replace with real templated prompts keyed by `template`.
    prompt = (
        f"Generate a '{template}' report for the Safe Cities permaculture team.\n"
        f"Parameters: {parameters}\n"
    )
    if context:
        prompt += f"\nContext:\n{context}\n"
    return (_generate(prompt).text or "").strip()
