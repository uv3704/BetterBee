"""
BetterBee — Clerk Authentication Utilities.

Handles Clerk JWT token verification using JWKS (JSON Web Key Set).
Provides caching of public keys and a mock fallback for offline local development.
"""

import httpx
import structlog
from jose import jwk, jwt
from jose.exceptions import JWTError

from app.core.config import get_settings
from app.core.exceptions import AuthenticationError

logger = structlog.get_logger(__name__)

# In-memory cache for JWKS keys
_jwks_cache: dict = {}


async def _fetch_jwks(jwks_url: str) -> dict:
    """Fetch JSON Web Key Set from Clerk."""
    global _jwks_cache
    if _jwks_cache and "keys" in _jwks_cache:
        return _jwks_cache

    if not jwks_url:
        logger.warning("CLERK_JWKS_URL is not configured")
        return {}

    try:
        logger.info("Fetching JWKS from Clerk", url=jwks_url)
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.get(jwks_url)
            response.raise_for_status()
            _jwks_cache = response.json()
            return _jwks_cache
    except Exception as e:
        logger.error("Failed to fetch Clerk JWKS", error=str(e))
        return {}


async def prefetch_jwks() -> None:
    """Pre-warm JWKS cache during application startup."""
    settings = get_settings()
    if settings.CLERK_JWKS_URL:
        await _fetch_jwks(settings.CLERK_JWKS_URL)


async def verify_clerk_token(token: str) -> str:
    """
    Verify the Clerk JWT token and return the Clerk user ID (sub).

    Supports mock tokens for local offline development.
    """
    settings = get_settings()

    # Developer-friendly fallback for offline development
    is_mock = token.startswith("mock-") or token == "mock_token"
    is_clerk_unconfigured = not settings.CLERK_JWKS_URL

    if is_mock or is_clerk_unconfigured:
        if is_mock:
            # e.g., mock-user_12345 -> user_12345
            clerk_id = token.replace("mock-", "") if "-" in token else "mock_user_id"
            logger.debug("Using mock auth verification", clerk_id=clerk_id)
            return clerk_id
        else:
            logger.warning(
                "Clerk is unconfigured. Accepting token as Clerk ID for local development."
            )
            return token

    try:
        # Decode header without verification to find key ID (kid)
        unverified_header = jwt.get_unverified_header(token)
        kid = unverified_header.get("kid")
        if not kid:
            raise AuthenticationError("Invalid token headers: missing kid")

        # Fetch JWKS keys
        jwks = await _fetch_jwks(settings.CLERK_JWKS_URL)
        if not jwks or "keys" not in jwks:
            raise AuthenticationError("Could not retrieve Clerk public keys")

        # Find matching key
        public_key = None
        for key in jwks["keys"]:
            if key["kid"] == kid:
                public_key = jwk.construct(key)
                break

        if not public_key:
            # Clear cache and retry fetch in case keys were rotated
            global _jwks_cache
            _jwks_cache = {}
            jwks = await _fetch_jwks(settings.CLERK_JWKS_URL)
            for key in jwks.get("keys", []):
                if key["kid"] == kid:
                    public_key = jwk.construct(key)
                    break

        if not public_key:
            raise AuthenticationError("Signing key not found in JWKS")

        # Verify signature and expiration
        # Note: Clerk tokens don't always have a strict audience unless configured,
        # but we check issuer if possible. For simplicity, we decode with verified signature.
        payload = jwt.decode(
            token,
            public_key.to_pem().decode("utf-8"),
            algorithms=["RS256"],
            options={"verify_aud": False},
        )

        clerk_id = payload.get("sub")
        if not clerk_id:
            raise AuthenticationError("Token payload missing subject (sub)")

        return clerk_id

    except JWTError as e:
        logger.warning("JWT verification failed", error=str(e))
        raise AuthenticationError(f"Invalid authentication token: {e!s}")
    except Exception as e:
        logger.error("Authentication error during token verification", error=str(e))
        raise AuthenticationError("Authentication failed")
