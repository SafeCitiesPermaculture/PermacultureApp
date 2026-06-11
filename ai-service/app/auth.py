"""JWT auth — verifies the access tokens issued by the Express backend.

The backend signs access tokens as `jwt.sign({ userId }, ACCESS_TOKEN_SECRET,
{ expiresIn: "15m" })` (HS256). We verify with the same secret, then load the
user from Mongo and apply the same gate the backend's controllers use
(isVerified && !isRemoved). All verified users may use the assistant.
"""

import jwt
from bson import ObjectId
from bson.errors import InvalidId
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from app.config import get_settings
from app.db import get_database

_bearer = HTTPBearer(auto_error=True)


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(_bearer),
) -> dict:
    settings = get_settings()
    token = credentials.credentials

    try:
        payload = jwt.decode(
            token, settings.access_token_secret, algorithms=["HS256"]
        )
    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Token expired"
        )
    except jwt.InvalidTokenError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token"
        )

    user_id = payload.get("userId")
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token payload"
        )

    try:
        oid = ObjectId(user_id)
    except InvalidId:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid user id"
        )

    user = await get_database().users.find_one({"_id": oid})
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found"
        )

    # Same gate the backend applies to protected actions.
    if not user.get("isVerified") or user.get("isRemoved"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is not verified or has been removed",
        )

    return user


async def get_admin_user(user: dict = Depends(get_current_user)) -> dict:
    """Restrict to admins — used for corpus indexing/management."""
    if user.get("userRole") != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="Admin only"
        )
    return user
