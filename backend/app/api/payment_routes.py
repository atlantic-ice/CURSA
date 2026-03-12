"""
Payment API Routes

Endpoints:
  GET  /api/payments/plans              - List all subscription plans
  GET  /api/payments/plans/<key>        - Get single plan details
  GET  /api/payments/subscription       - Get current user subscription
  POST /api/payments/subscribe          - Subscribe to a plan
  POST /api/payments/cancel             - Cancel current subscription
  GET  /api/payments/history            - Get payment history
  POST /api/payments/webhook/stripe     - Stripe webhook (raw body)
  POST /api/payments/webhook/yookassa   - YooKassa webhook
"""

from __future__ import annotations

import hashlib
import hmac
import json
import logging
import os

from flask import Blueprint, current_app, jsonify, request
from flask_jwt_extended import get_jwt_identity, jwt_required

from app.extensions import db
from app.models.payment import Payment, PaymentStatus
from app.models.subscription import Subscription, SubscriptionStatus
from app.models.user import User, UserRole
from app.services.payment_service import (
    PaymentServiceError,
    get_payment_service,
)

logger = logging.getLogger(__name__)

bp = Blueprint("payments", __name__, url_prefix="/api/payments")


def _ok(data: dict | list, status: int = 200):
    return jsonify({"success": True, "data": data}), status


def _err(message: str, code: str = "error", status: int = 400):
    return jsonify({"success": False, "error": message, "code": code}), status


# ---------------------------------------------------------------------------
# Plans
# ---------------------------------------------------------------------------


@bp.get("/plans")
def list_plans():
    """Return all subscription plans (public endpoint)."""
    svc = get_payment_service()
    return _ok(svc.get_all_plans())


@bp.get("/plans/<plan_key>")
def get_plan(plan_key: str):
    """Return a single plan by key (FREE, STUDENT, PRO, TEAM, ENTERPRISE)."""
    svc = get_payment_service()
    plan = svc.get_plan(plan_key)
    if not plan:
        return _err(f"Plan '{plan_key}' not found", "plan_not_found", 404)
    return _ok(plan)


# ---------------------------------------------------------------------------
# Current subscription
# ---------------------------------------------------------------------------


@bp.get("/subscription")
@jwt_required()
def get_subscription():
    """Return the current user's subscription info."""
    user_id = int(get_jwt_identity())
    svc = get_payment_service()
    try:
        info = svc.get_subscription_info(user_id)
        return _ok(info)
    except PaymentServiceError as exc:
        return _err(str(exc), exc.code, 404)


# ---------------------------------------------------------------------------
# Subscribe / Upgrade
# ---------------------------------------------------------------------------


@bp.post("/subscribe")
@jwt_required()
def subscribe():
    """
    Subscribe or upgrade to a plan.

    Body (JSON):
        plan_key       str  Required. FREE | STUDENT | PRO | TEAM
        payment_method str  Optional. "mock" (default) | "stripe" | "yookassa"
        payment_token  str  Optional. Provider-specific card/payment token.
        billing_cycle  str  Optional. "monthly" (default) | "yearly"
        promo_code     str  Optional. Promo code for discount.
    """
    user_id = int(get_jwt_identity())
    body = request.get_json(silent=True) or {}

    plan_key = body.get("plan_key", "").upper()
    if not plan_key:
        return _err("plan_key is required", "validation_error")

    payment_method = body.get("payment_method", "mock")
    payment_token = body.get("payment_token")
    billing_cycle = body.get("billing_cycle", "monthly")
    promo_code = body.get("promo_code")

    svc = get_payment_service()
    try:
        result = svc.subscribe(
            user_id=user_id,
            plan_key=plan_key,
            payment_method=payment_method,
            payment_token=payment_token,
            billing_cycle=billing_cycle,
            promo_code=promo_code,
        )
        return _ok(result, 201)
    except PaymentServiceError as exc:
        if exc.code == "enterprise_contact_sales":
            return _err(str(exc), exc.code, 422)
        return _err(str(exc), exc.code, 400)
    except Exception as exc:
        logger.exception("Unexpected error in subscribe")
        return _err("Internal server error", "internal_error", 500)


# ---------------------------------------------------------------------------
# Cancel
# ---------------------------------------------------------------------------


@bp.post("/cancel")
@jwt_required()
def cancel_subscription():
    """Cancel the current user's active subscription."""
    user_id = int(get_jwt_identity())
    svc = get_payment_service()
    try:
        result = svc.cancel_subscription(user_id)
        return _ok(result)
    except PaymentServiceError as exc:
        return _err(str(exc), exc.code, 400)


# ---------------------------------------------------------------------------
# Payment history
# ---------------------------------------------------------------------------


@bp.get("/history")
@jwt_required()
def payment_history():
    """Return the current user's payment history (last 50 records)."""
    user_id = int(get_jwt_identity())
    limit = min(int(request.args.get("limit", 20)), 50)

    svc = get_payment_service()
    try:
        history = svc.get_payment_history(user_id, limit=limit)
        return _ok(history)
    except Exception as exc:
        logger.exception("Error fetching payment history")
        return _err("Internal server error", "internal_error", 500)


# ---------------------------------------------------------------------------
# Stripe webhook
# ---------------------------------------------------------------------------


@bp.post("/webhook/stripe")
def stripe_webhook():
    """Handle Stripe webhook events (requires raw body + signature verification)."""
    secret = os.environ.get("STRIPE_WEBHOOK_SECRET")
    payload = request.get_data(as_text=False)
    sig_header = request.headers.get("Stripe-Signature", "")

    if secret:
        try:
            import stripe  # type: ignore

            event = stripe.Webhook.construct_event(payload, sig_header, secret)
        except Exception as exc:
            logger.warning(f"Stripe webhook signature verification failed: {exc}")
            return _err("Invalid signature", "invalid_signature", 400)
    else:
        # Dev mode: accept without verification
        try:
            event = json.loads(payload)
        except json.JSONDecodeError:
            return _err("Invalid JSON", "invalid_json", 400)

    event_type = event.get("type", "")
    logger.info(f"Stripe webhook received: {event_type}")

    if event_type == "customer.subscription.deleted":
        _handle_stripe_sub_deleted(event["data"]["object"])
    elif event_type == "invoice.payment_succeeded":
        _handle_stripe_invoice_paid(event["data"]["object"])
    elif event_type == "invoice.payment_failed":
        _handle_stripe_payment_failed(event["data"]["object"])

    return jsonify({"received": True}), 200


def _handle_stripe_sub_deleted(sub_obj: dict) -> None:
    stripe_sub_id = sub_obj.get("id")
    sub = Subscription.query.filter_by(stripe_subscription_id=stripe_sub_id).first()
    if sub:
        sub.status = SubscriptionStatus.CANCELLED
        user = User.query.get(sub.user_id)
        if user:
            user.role = UserRole.USER
        db.session.commit()
        logger.info(f"Subscription expired via Stripe webhook: {stripe_sub_id}")


def _handle_stripe_invoice_paid(invoice: dict) -> None:
    stripe_sub_id = invoice.get("subscription")
    if not stripe_sub_id:
        return
    sub = Subscription.query.filter_by(stripe_subscription_id=stripe_sub_id).first()
    if sub:
        from datetime import timezone
        from datetime import datetime

        sub.expires_at = datetime.fromtimestamp(invoice.get("period_end", 0), tz=timezone.utc)
        db.session.commit()


def _handle_stripe_payment_failed(invoice: dict) -> None:
    logger.warning(f"Stripe payment failed for invoice: {invoice.get('id')}")


# ---------------------------------------------------------------------------
# YooKassa webhook
# ---------------------------------------------------------------------------


@bp.post("/webhook/yookassa")
def yookassa_webhook():
    """Handle YooKassa webhook events."""
    try:
        event = request.get_json(force=True)
    except Exception:
        return _err("Invalid JSON", "invalid_json", 400)

    event_type = event.get("event", "")
    logger.info(f"YooKassa webhook: {event_type}")

    if event_type == "payment.succeeded":
        obj = event.get("object", {})
        transaction_id = obj.get("id")
        payment = Payment.query.filter_by(transaction_id=transaction_id).first()
        if payment:
            payment.status = PaymentStatus.COMPLETED
            from datetime import timezone, datetime

            payment.completed_at = datetime.now(timezone.utc)
            db.session.commit()

    elif event_type == "payment.canceled":
        obj = event.get("object", {})
        transaction_id = obj.get("id")
        payment = Payment.query.filter_by(transaction_id=transaction_id).first()
        if payment:
            payment.status = PaymentStatus.FAILED
            db.session.commit()

    return jsonify({"received": True}), 200
