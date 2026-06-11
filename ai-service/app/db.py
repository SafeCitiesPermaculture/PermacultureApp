"""MongoDB connection (async, via motor).

Connects to the SAME Atlas cluster as the Express backend. We only read
existing collections — `users` (for auth) and `tasks` (for assistant context).
No new database or collections are created here.
"""

from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase

from app.config import get_settings

_client: AsyncIOMotorClient | None = None


def connect() -> None:
    global _client
    if _client is None:
        _client = AsyncIOMotorClient(get_settings().mongodb_uri)


def close() -> None:
    global _client
    if _client is not None:
        _client.close()
        _client = None


def get_database() -> AsyncIOMotorDatabase:
    """Return the default database encoded in MONGODB_URI (same DB the backend
    uses)."""
    if _client is None:
        connect()
    return _client.get_default_database()
