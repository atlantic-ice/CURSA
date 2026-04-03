"""Helpers for API key authentication and scope validation."""

from datetime import datetime, timezone, timedelta
from typing import Optional, Tuple

from flask import current_app, jsonify, request

from app.extensions import db
from app.models import APIKey, APIKeyAudit


def _extract_api_key_from_request() -> Tuple[Optional[str], bool]:
    """
    Extract API key from headers.

    Returns:
        (token, explicit_api_key_attempt)
        explicit_api_key_attempt=True when caller clearly attempted API key auth
        (X-API-Key header or Bearer token with cursa_ prefix).
    """
    x_api_key = (request.headers.get("X-API-Key") or "").strip()
    if x_api_key:
        return x_api_key, True

    auth_header = (request.headers.get("Authorization") or "").strip()
    if not auth_header.lower().startswith("bearer "):
        return None, False

    bearer_token = auth_header[7:].strip()
    if not bearer_token:
        return None, False

    # Only treat Bearer token as API key if it follows CURSA key format.
    if bearer_token.startswith("cursa_"):
        return bearer_token, True

    # Likely JWT Bearer token.
    return None, False


def authorize_api_key_request(required_scope: Optional[str] = None):
    """
    Validate API key from request when API key auth is used.

    This check is optional by design:
    - If request does not use API key auth, returns (None, None)
    - If API key auth is attempted, key must be valid and have required scope.

    Returns:
        (api_key, error_response)
    """
    raw_key, explicit_api_key_attempt = _extract_api_key_from_request()

    if not explicit_api_key_attempt:
        return None, None

    if not raw_key:
        return None, (jsonify({"error": "API key is required"}), 401)

    key_hash = APIKey.hash_key(raw_key)
    api_key = APIKey.query.filter_by(key_hash=key_hash).first()

    if not api_key:
        return None, (jsonify({"error": "Invalid API key"}), 401)

    if not api_key.is_valid:
        return None, (jsonify({"error": "API key is inactive or expired"}), 401)

    key_scopes = api_key.scopes or []
    if required_scope and required_scope not in key_scopes:
        return None, (
            jsonify(
                {
                    "error": "Insufficient API key scope",
                    "required_scope": required_scope,
                    "granted_scopes": key_scopes,
                }
            ),
            403,
        )

    # Enforce per-key rate limit using usage audit within the last hour.
    hourly_limit = api_key.rate_limit or 0
    if hourly_limit > 0:
        window_start = datetime.now(timezone.utc) - timedelta(hours=1)
        recent_usage_count = APIKeyAudit.query.filter(
            APIKeyAudit.api_key_id == api_key.id,
            APIKeyAudit.event == "api_key_used",
            APIKeyAudit.created_at >= window_start,
        ).count()
        if recent_usage_count >= hourly_limit:
            return None, (
                jsonify(
                    {
                        "error": "API key rate limit exceeded",
                        "rate_limit": hourly_limit,
                        "window": "1h",
                    }
                ),
                429,
            )

    try:
        api_key.last_used_at = datetime.now(timezone.utc)
        api_key.usage_count = (api_key.usage_count or 0) + 1

        usage_event = APIKeyAudit(
            user_id=api_key.user_id,
            api_key_id=api_key.id,
            event="api_key_used",
            details={
                "required_scope": required_scope,
                "path": request.path,
                "method": request.method,
            },
            ip_address=request.headers.get("X-Forwarded-For", request.remote_addr),
            user_agent=(request.headers.get("User-Agent") or "")[:512],
        )
        db.session.add(usage_event)
        db.session.commit()
    except Exception as exc:
        db.session.rollback()
        current_app.logger.warning("Failed to update API key usage stats: %s", exc)

    return api_key, None
