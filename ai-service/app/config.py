"""Application settings, loaded from environment / .env.

Variable names intentionally mirror the existing Express backend's .env so the
two services can share the same values (see .env.example).
"""

import json
from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


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

    # Gemini — not provisioned yet; service still boots without it.
    gemini_api_key: str = ""
    gemini_model: str = "gemini-2.5-flash"

    # CORS — comma-separated list of allowed frontend origins.
    allowed_origins: str = (
        "http://localhost:8081,"
        "https://sc-permaculture.vercel.app,"
        "https://afc-estate.vercel.app"
    )

    @property
    def gemini_configured(self) -> bool:
        return bool(self.gemini_api_key.strip())

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
