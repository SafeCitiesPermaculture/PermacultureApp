"""Application settings, loaded from environment / .env.

Variable names intentionally mirror the existing Express backend's .env so the
two services can share the same values (see .env.example).
"""

import json
from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


def _normalize_openai_base_url(endpoint: str) -> str:
    """Normalize an Azure OpenAI endpoint to the OpenAI-compatible '/openai/v1'
    base URL, whether or not the configured endpoint already includes it."""
    ep = endpoint.strip().rstrip("/")
    if not ep:
        return ep
    if ep.endswith("/openai/v1"):
        return ep
    if ep.endswith("/openai"):
        return ep + "/v1"
    return ep + "/openai/v1"


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    # Auth — same secret the Express backend signs access tokens with (HS256).
    access_token_secret: str = ""

    # Database — same Atlas cluster as the backend.
    mongodb_uri: str = ""

    # Google Drive — same service account JSON the backend uses.
    google_drive_credentials_json: str = ""
    ai_conversations_folder_name: str = "AI Conversations"

    # Azure OpenAI — DeepSeek-V4-Flash for chat, text-embedding-3-small for
    # embeddings. The endpoint is the OpenAI-compatible "/openai/v1" surface.
    azure_openai_endpoint: str = ""
    azure_openai_key: str = ""
    azure_openai_chat_deployment: str = "DeepSeek-V4-Flash"
    azure_openai_embedding_deployment: str = "text-embedding-3-small"

    # The embedding model may live on a DIFFERENT Azure resource/project than
    # the chat model. When these are set they're used for embeddings; otherwise
    # embeddings fall back to the main endpoint/key above.
    azure_openai_embedding_endpoint: str = ""
    azure_openai_embedding_key: str = ""

    # Azure AI Search — vector store for the Drive corpus.
    azure_search_endpoint: str = ""
    azure_search_key: str = ""
    azure_search_index: str = "afc-estate-corpus"

    # CORS — comma-separated list of allowed frontend origins. Includes the
    # backend origin(s) because the rebuilt static site is served from there
    # (same origin as the Express API) but still calls this AI service cross-origin.
    allowed_origins: str = (
        "http://localhost:8081,"
        "http://localhost:3000,"
        "https://sc-permaculture.vercel.app,"
        "https://afc-estate.vercel.app,"
        "https://permacultureapp.onrender.com"
    )

    @property
    def azure_openai_configured(self) -> bool:
        return bool(self.azure_openai_endpoint.strip() and self.azure_openai_key.strip())

    @property
    def azure_search_configured(self) -> bool:
        return bool(self.azure_search_endpoint.strip() and self.azure_search_key.strip())

    @property
    def azure_configured(self) -> bool:
        """True once both Azure OpenAI and Azure AI Search are provisioned."""
        return self.azure_openai_configured and self.azure_search_configured

    @property
    def azure_openai_base_url(self) -> str:
        """OpenAI-compatible '/openai/v1' base URL for the chat resource."""
        return _normalize_openai_base_url(self.azure_openai_endpoint)

    @property
    def embedding_endpoint(self) -> str:
        """Endpoint for embeddings — the dedicated one if set, else the chat one."""
        return (
            self.azure_openai_embedding_endpoint.strip()
            or self.azure_openai_endpoint.strip()
        )

    @property
    def embedding_key(self) -> str:
        """API key for embeddings — the dedicated one if set, else the chat one."""
        return (
            self.azure_openai_embedding_key.strip() or self.azure_openai_key.strip()
        )

    @property
    def azure_openai_embedding_base_url(self) -> str:
        """OpenAI-compatible '/openai/v1' base URL for the embedding resource."""
        return _normalize_openai_base_url(self.embedding_endpoint)

    @property
    def embeddings_on_separate_resource(self) -> bool:
        return bool(self.azure_openai_embedding_endpoint.strip())

    @property
    def cors_origins(self) -> list[str]:
        return [o.strip() for o in self.allowed_origins.split(",") if o.strip()]

    @property
    def google_credentials(self) -> dict:
        """Parse the service-account JSON, normalizing the private key newlines
        the same way the backend's filesController does."""
        if not self.google_drive_credentials_json.strip():
            return {}
        creds = json.loads(self.google_drive_credentials_json)
        if "private_key" in creds:
            creds["private_key"] = creds["private_key"].replace("\\n", "\n")
        return creds


@lru_cache
def get_settings() -> Settings:
    return Settings()
