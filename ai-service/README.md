# AFC Estate — AI Assistant (FastAPI)

Separate Python/FastAPI service that powers the AI Assistant tab. It runs
alongside the existing Express backend and React Native app, **reusing** their
auth, database, and Google Drive service account rather than duplicating them.

- **LLM:** Gemini 2.5 Flash (RAG over Google Drive via File Search)
- **Auth:** verifies the access-token JWTs the Express backend already issues
- **DB:** reads the same MongoDB Atlas cluster (`users`, `tasks`)
- **Drive:** same service account as the backend; write-back to an
  `AI Conversations` subfolder grows the knowledge base
- **Hosting:** a second Render service (see `render.yaml`)

The React Native app calls this service **directly** (not proxied through
Express).

## Endpoints

| Method | Path | Auth | Notes |
|--------|------|------|-------|
| GET  | `/health` | none | Liveness + config readiness |
| POST | `/chat` | Bearer | RAG query; `include_tasks` folds in the user's open tasks |
| POST | `/summarize` | Bearer | Meeting transcript → bullet summary |
| POST | `/report` | Bearer | Templated report generation |
| POST | `/save-to-knowledge-base` | Bearer | Writes a conversation/summary to Drive |

All Bearer endpoints accept the **same access token** the app stores after
login (`Authorization: Bearer <accessToken>`).

> **Gemini is not provisioned yet.** Until `GEMINI_API_KEY` is set, `/chat`,
> `/summarize`, and `/report` return **503**. `/health` and
> `/save-to-knowledge-base` work without it.

## Local development

```bash
cd ai-service
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt

cp .env.example .env          # then fill in values from the backend's .env
uvicorn app.main:app --reload --port 8000
```

Open http://localhost:8000/docs for the interactive API docs, or
http://localhost:8000/health to check config readiness.

## Environment

See `.env.example`. `ACCESS_TOKEN_SECRET`, `MONGODB_URI`, and
`GOOGLE_DRIVE_CREDENTIALS_JSON` must be **copied verbatim** from the Express
backend's `.env` so the services interoperate.

## Layout

```
app/
  main.py          FastAPI app, CORS, lifespan, router mounting
  config.py        settings from env (mirrors backend var names)
  db.py            async Mongo (motor) connection — read-only use
  auth.py          JWT verification dependency (HS256, same secret)
  schemas.py       request/response models
  services/
    drive.py       Drive read + write-back via the service account
    gemini.py      Gemini 2.5 Flash; raises until GEMINI_API_KEY is set
  routers/
    chat.py, summarize.py, report.py, knowledge_base.py
```

## Not yet wired (next steps)

- **Gemini File Search** indexing of the corpus folders (Animals, Composting
  and Worms, Plants, Permaculture Profile2025.docx) and grounding for `/chat`
  — marked with `TODO(rag)` in `services/gemini.py`.
- Re-indexing newly saved knowledge-base files (`TODO(rag)` in
  `routers/knowledge_base.py`).
- Concrete report templates (`TODO(reports)` in `services/gemini.py`).
- Frontend AI Assistant tab calling this service.
