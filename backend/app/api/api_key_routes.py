"""
API Key API routes

Endpoints:
- GET /api/api-keys - List user's API keys
- POST /api/api-keys - Create new API key
- DELETE /api/api-keys/{id} - Revoke API key
- PATCH /api/api-keys/{id} - Update API key (name, scopes)
- POST /api/api-keys/{id}/regenerate - Regenerate API key
"""

from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime, timezone, timedelta
import secrets
import logging

from app.extensions import db
from app.models import APIKey, User, APIKeyAudit

logger = logging.getLogger(__name__)

api_key_routes = Blueprint('api_key_routes', __name__, url_prefix='/api/api-keys')


# ─── Helpers ────────────────────────────────────────────────────────────────

def generate_api_key() -> tuple[str, str, str]:
    """
    Generate a new API key.
    Returns: (full_key, prefix, hash)
    """
    # Format: cursa_<type>_<random>
    prefix = "cursa_prod"
    random_part = secrets.token_urlsafe(32)
    full_key = f"{prefix}_{random_part}"
    visible_prefix = full_key[:16]

    # Hash the key for storage
    key_hash = APIKey.hash_key(full_key)

    return full_key, visible_prefix, key_hash


def _log_api_key_event(user_id: str, api_key_id: int | None, event: str, metadata: dict | None = None) -> None:
    """Persist an immutable audit event for API key operations."""
    try:
        entry = APIKeyAudit(
            user_id=int(user_id),
            api_key_id=api_key_id,
            event=event,
            details=metadata or {},
            ip_address=request.headers.get("X-Forwarded-For", request.remote_addr),
            user_agent=(request.headers.get("User-Agent") or "")[:512],
        )
        db.session.add(entry)
    except Exception as exc:
        logger.warning("Failed to prepare API key audit event %s: %s", event, exc)


def _build_usage_payload(api_key: APIKey) -> dict:
    """Build normalized usage metrics payload for a single API key."""
    window_start = datetime.now(timezone.utc) - timedelta(hours=1)
    recent_usage_count = APIKeyAudit.query.filter(
        APIKeyAudit.api_key_id == api_key.id,
        APIKeyAudit.event == 'api_key_used',
        APIKeyAudit.created_at >= window_start,
    ).count()

    rate_limit = api_key.rate_limit or 0
    hourly_remaining = max(0, rate_limit - recent_usage_count) if rate_limit > 0 else None
    rate_limit_reset_at = (window_start + timedelta(hours=1)).isoformat()

    return {
        'key_id': api_key.id,
        'usage_count': api_key.usage_count,
        'usage_count_last_hour': recent_usage_count,
        'hourly_remaining': hourly_remaining,
        'last_used_at': api_key.last_used_at.isoformat() if api_key.last_used_at else None,
        'rate_limit': rate_limit,
        'rate_limit_reset_at': rate_limit_reset_at,
        'is_active': api_key.is_active,
    }


# ─── Routes ─────────────────────────────────────────────────────────────────

@api_key_routes.get('')
@jwt_required()
def list_api_keys():
    """
    List all API keys for the current user.

    Returns:
        List of API keys (without full key, only metadata)
    """
    try:
        user_id = get_jwt_identity()
        user = User.query.get(user_id)

        if not user:
            return jsonify({'error': 'User not found'}), 404

        # Check if user has Pro+ plan (for now allow all for demo)
        # TODO: Uncomment when billing is integrated
        # if user.subscription.plan.key not in ['PRO', 'TEAM', 'ENTERPRISE']:
        #     return jsonify({'error': 'API keys require Pro+ plan'}), 403

        api_keys = APIKey.query.filter_by(user_id=user_id).all()

        return jsonify({
            'api_keys': [key.to_dict() for key in api_keys],
            'total': len(api_keys)
        }), 200

    except Exception as e:
        logger.error(f"Error listing API keys: {str(e)}")
        return jsonify({'error': 'Failed to list API keys'}), 500


@api_key_routes.post('')
@jwt_required()
def create_api_key():
    """
    Create a new API key for the current user.

    Request body:
    {
        "name": "Production",
        "scopes": ["document:check", "document:correct"],
        "expires_in_days": null  # Optional, null = no expiration
    }

    Returns:
        New API key (full key shown only once)
    """
    try:
        user_id = get_jwt_identity()
        user = User.query.get(user_id)

        if not user:
            return jsonify({'error': 'User not found'}), 404

        data = request.get_json()

        if not data:
            return jsonify({'error': 'Request body required'}), 400

        # Validate required fields
        name = data.get('name', '').strip()
        scopes = data.get('scopes', ['document:check'])
        expires_in_days = data.get('expires_in_days')

        if not name:
            return jsonify({'error': 'Name is required'}), 400

        if not isinstance(scopes, list) or len(scopes) == 0:
            return jsonify({'error': 'At least one scope is required'}), 400

        if expires_in_days is not None:
            if not isinstance(expires_in_days, int) or expires_in_days <= 0:
                return jsonify({'error': 'expires_in_days must be a positive integer'}), 400

        # Validate scopes
        valid_scopes = {'document:check', 'document:correct', 'document:view'}
        invalid_scopes = set(scopes) - valid_scopes
        if invalid_scopes:
            return jsonify({'error': f'Invalid scopes: {", ".join(invalid_scopes)}'}), 400

        # Generate new API key
        full_key, key_prefix, key_hash = generate_api_key()

        # Create API key record
        api_key = APIKey(
            user_id=user_id,
            name=name,
            key_hash=key_hash,
            key_prefix=key_prefix,
            scopes=scopes,
            is_active=True,
            expires_at=datetime.now(timezone.utc) + timedelta(days=expires_in_days)
                      if expires_in_days else None
        )

        db.session.add(api_key)
        db.session.flush()
        _log_api_key_event(
            user_id,
            api_key.id,
            "api_key_created",
            {
                "name": api_key.name,
                "scopes": api_key.scopes,
                "expires_at": api_key.expires_at.isoformat() if api_key.expires_at else None,
            },
        )
        db.session.commit()

        # Return the full key (only shown once!)
        response = api_key.to_dict(include_key=False)
        response['key'] = full_key  # Full key only in creation response
        response['message'] = 'Save this key securely. It will not be shown again.'

        logger.info(f"User {user_id} created API key: {api_key.id}")

        return jsonify(response), 201

    except Exception as e:
        db.session.rollback()
        logger.error(f"Error creating API key: {str(e)}")
        return jsonify({'error': 'Failed to create API key'}), 500


@api_key_routes.delete('/<int:key_id>')
@jwt_required()
def revoke_api_key(key_id):
    """
    Revoke (delete) an API key.

    Args:
        key_id: ID of the API key to revoke

    Returns:
        Confirmation message
    """
    try:
        user_id = get_jwt_identity()
        api_key = APIKey.query.filter_by(id=key_id, user_id=user_id).first()

        if not api_key:
            return jsonify({'error': 'API key not found'}), 404

        _log_api_key_event(
            user_id,
            api_key.id,
            "api_key_revoked",
            {"name": api_key.name, "scopes": api_key.scopes},
        )
        db.session.delete(api_key)
        db.session.commit()

        logger.info(f"User {user_id} revoked API key: {key_id}")

        return jsonify({'message': 'API key revoked successfully'}), 200

    except Exception as e:
        db.session.rollback()
        logger.error(f"Error revoking API key: {str(e)}")
        return jsonify({'error': 'Failed to revoke API key'}), 500


@api_key_routes.patch('/<int:key_id>')
@jwt_required()
def update_api_key(key_id):
    """
    Update API key settings (name, scopes).

    Args:
        key_id: ID of the API key

    Request body:
    {
        "name": "New Name",
        "scopes": ["document:check"],
        "is_active": true
    }

    Returns:
        Updated API key
    """
    try:
        user_id = get_jwt_identity()
        api_key = APIKey.query.filter_by(id=key_id, user_id=user_id).first()

        if not api_key:
            return jsonify({'error': 'API key not found'}), 404

        data = request.get_json()

        if not data:
            return jsonify({'error': 'Request body required'}), 400

        old_name = api_key.name
        old_scopes = list(api_key.scopes or [])
        old_active = api_key.is_active

        # Update Name
        if 'name' in data:
            name = data['name'].strip()
            if not name:
                return jsonify({'error': 'Name cannot be empty'}), 400
            api_key.name = name

        # Update scopes
        if 'scopes' in data:
            scopes = data['scopes']
            if not isinstance(scopes, list) or len(scopes) == 0:
                return jsonify({'error': 'At least one scope is required'}), 400

            valid_scopes = {'document:check', 'document:correct', 'document:view'}
            invalid_scopes = set(scopes) - valid_scopes
            if invalid_scopes:
                return jsonify({'error': f'Invalid scopes: {", ".join(invalid_scopes)}'}), 400

            api_key.scopes = scopes

        # Update active status
        if 'is_active' in data:
            api_key.is_active = bool(data['is_active'])

        _log_api_key_event(
            user_id,
            api_key.id,
            "api_key_updated",
            {
                "old": {
                    "name": old_name,
                    "scopes": old_scopes,
                    "is_active": old_active,
                },
                "new": {
                    "name": api_key.name,
                    "scopes": api_key.scopes,
                    "is_active": api_key.is_active,
                },
            },
        )

        db.session.commit()

        logger.info(f"User {user_id} updated API key: {key_id}")

        return jsonify(api_key.to_dict()), 200

    except Exception as e:
        db.session.rollback()
        logger.error(f"Error updating API key: {str(e)}")
        return jsonify({'error': 'Failed to update API key'}), 500


@api_key_routes.post('/<int:key_id>/regenerate')
@jwt_required()
def regenerate_api_key(key_id):
    """
    Regenerate (replace) an API key with a new one.

    Args:
        key_id: ID of the API key to regenerate

    Returns:
        New API key (full key shown only once)
    """
    try:
        user_id = get_jwt_identity()
        api_key = APIKey.query.filter_by(id=key_id, user_id=user_id).first()

        if not api_key:
            return jsonify({'error': 'API key not found'}), 404

        previous_prefix = api_key.key_prefix

        # Generate new key
        full_key, key_prefix, key_hash = generate_api_key()

        # Update the key record
        api_key.key_hash = key_hash
        api_key.key_prefix = key_prefix
        api_key.last_used_at = None  # Reset usage
        api_key.usage_count = 0

        _log_api_key_event(
            user_id,
            api_key.id,
            "api_key_regenerated",
            {
                "old_prefix": previous_prefix,
                "new_prefix": key_prefix,
            },
        )

        db.session.commit()

        # Return the new key (only shown once!)
        response = api_key.to_dict(include_key=False)
        response['key'] = full_key
        response['message'] = 'Save this key securely. It will not be shown again.'

        logger.info(f"User {user_id} regenerated API key: {key_id}")

        return jsonify(response), 200

    except Exception as e:
        db.session.rollback()
        logger.error(f"Error regenerating API key: {str(e)}")
        return jsonify({'error': 'Failed to regenerate API key'}), 500


@api_key_routes.get('/<int:key_id>/usage')
@jwt_required()
def get_api_key_usage(key_id):
    """
    Get usage statistics for an API key.

    Args:
        key_id: ID of the API key

    Returns:
        Usage statistics
    """
    try:
        user_id = get_jwt_identity()
        api_key = APIKey.query.filter_by(id=key_id, user_id=user_id).first()

        if not api_key:
            return jsonify({'error': 'API key not found'}), 404

        return jsonify(_build_usage_payload(api_key)), 200

    except Exception as e:
        logger.error(f"Error getting API key usage: {str(e)}")
        return jsonify({'error': 'Failed to get usage statistics'}), 500


@api_key_routes.get('/usage')
@jwt_required()
def get_api_keys_usage_bulk():
    """Get usage statistics for all user API keys (or a subset via key_ids query)."""
    try:
        user_id = int(get_jwt_identity())
        key_ids_param = (request.args.get('key_ids') or '').strip()

        query = APIKey.query.filter_by(user_id=user_id)

        if key_ids_param:
            try:
                key_ids = [int(item.strip()) for item in key_ids_param.split(',') if item.strip()]
            except ValueError:
                return jsonify({'error': 'key_ids must be comma-separated integers'}), 400

            if key_ids:
                query = query.filter(APIKey.id.in_(key_ids))

        api_keys = query.all()

        items = [_build_usage_payload(api_key) for api_key in api_keys]
        usage_by_key_id = {str(item['key_id']): item for item in items}

        return jsonify({
            'items': items,
            'usage_by_key_id': usage_by_key_id,
            'total': len(items),
        }), 200

    except Exception as e:
        logger.error("Error getting bulk API key usage: %s", str(e))
        return jsonify({'error': 'Failed to get bulk usage statistics'}), 500


@api_key_routes.get('/history')
@jwt_required()
def get_api_key_history():
    """Get API key audit history for current user."""
    try:
        user_id = int(get_jwt_identity())
        key_id_param = request.args.get('key_id')
        limit_param = request.args.get('limit', '50')

        try:
            limit = max(1, min(200, int(limit_param)))
        except ValueError:
            return jsonify({'error': 'limit must be an integer'}), 400

        query = APIKeyAudit.query.filter_by(user_id=user_id)

        if key_id_param is not None:
            try:
                key_id = int(key_id_param)
            except ValueError:
                return jsonify({'error': 'key_id must be an integer'}), 400

            # Ensure user can only query own key history.
            own_key = APIKey.query.filter_by(id=key_id, user_id=user_id).first()
            if not own_key:
                return jsonify({'error': 'API key not found'}), 404

            query = query.filter_by(api_key_id=key_id)

        records = query.order_by(APIKeyAudit.created_at.desc()).limit(limit).all()

        return jsonify(
            {
                'items': [record.to_dict() for record in records],
                'total': len(records),
                'limit': limit,
            }
        ), 200

    except Exception as e:
        logger.error("Error getting API key history: %s", str(e))
        return jsonify({'error': 'Failed to get API key history'}), 500
