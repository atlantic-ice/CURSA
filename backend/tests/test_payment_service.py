"""
Tests for Payment Service and Payment API Routes

Covers:
- Plan listing (GET /api/payments/plans)
- Single plan retrieval
- Subscription info for authenticated user
- Subscribe / upgrade flow (mock mode)
- Cancel subscription
- Payment history
- Usage limit checking (check_can_check)
- Error cases (invalid plan, no subscription, etc.)
"""

from __future__ import annotations

import pytest
from flask_jwt_extended import create_access_token

from app.extensions import db
from app.models.user import User, UserRole
from app.models.subscription import Subscription, SubscriptionStatus
from app.models.payment import Payment, PaymentStatus
from app.services.payment_service import (
    PaymentService,
    PaymentServiceError,
    PLANS,
    get_payment_service,
)


# ---------------------------------------------------------------------------
# Fixtures
# ---------------------------------------------------------------------------


@pytest.fixture
def payment_service(app):
    """Return a PaymentService in mock mode bound to the app context."""
    with app.app_context():
        return PaymentService(mock=True)


@pytest.fixture
def pro_user(app, db):
    """Create a PRO-role user (follows conftest pattern — no extra app_context wrap)."""
    user = User(
        email="pro@example.com",
        first_name="Pro",
        last_name="User",
        role=UserRole.PRO,
        is_active=True,
        is_email_verified=True,
    )
    user.set_password("TestPassword123!")
    db.session.add(user)
    db.session.commit()
    return user


@pytest.fixture
def auth_headers_for(app):
    """Factory fixture: returns JWT headers for a given user."""

    def _make(user: User):
        with app.app_context():
            token = create_access_token(identity=str(user.id))
            return {"Authorization": f"Bearer {token}"}

    return _make


# ---------------------------------------------------------------------------
# Unit tests: PaymentService
# ---------------------------------------------------------------------------


class TestPlanListing:
    def test_get_all_plans_returns_list(self, app, payment_service):
        with app.app_context():
            plans = payment_service.get_all_plans()
            assert isinstance(plans, list)
            assert len(plans) >= 4, "Expected at least FREE, STUDENT, PRO, TEAM"

    def test_all_plans_have_required_fields(self, app, payment_service):
        with app.app_context():
            for plan in payment_service.get_all_plans():
                assert "key" in plan
                assert "name" in plan
                assert "price_rub" in plan
                assert "features" in plan
                assert "limits" in plan
                assert isinstance(plan["features"], list)

    def test_get_plan_by_key(self, app, payment_service):
        with app.app_context():
            plan = payment_service.get_plan("PRO")
            assert plan is not None
            assert plan["key"] == "PRO"
            assert plan["price_rub"] > 0

    def test_get_plan_case_insensitive(self, app, payment_service):
        with app.app_context():
            plan = payment_service.get_plan("pro")
            assert plan is not None
            assert plan["key"] == "PRO"

    def test_get_nonexistent_plan_returns_none(self, app, payment_service):
        with app.app_context():
            plan = payment_service.get_plan("NONEXISTENT")
            assert plan is None

    def test_free_plan_has_zero_price(self, app, payment_service):
        with app.app_context():
            plan = payment_service.get_plan("FREE")
            assert plan["price_rub"] == 0.0

    def test_pro_plan_has_unlimited_checks(self, app, payment_service):
        with app.app_context():
            plan = payment_service.get_plan("PRO")
            assert plan["limits"]["checks_per_day"] == -1

    def test_enterprise_has_unlimited_team_members(self, app, payment_service):
        with app.app_context():
            plan = payment_service.get_plan("ENTERPRISE")
            assert plan["limits"]["team_members"] == -1


class TestSubscriptionInfo:
    def test_subscription_info_for_free_user(self, app, payment_service, test_user):
        with app.app_context():
            # Re-fetch to be in same session
            user = User.query.get(test_user.id)
            info = payment_service.get_subscription_info(user.id)
            assert info["plan_key"] in ("FREE", "USER")
            assert info["subscription_id"] is None

    def test_subscription_info_invalid_user(self, app, payment_service):
        with app.app_context():
            with pytest.raises(PaymentServiceError) as exc_info:
                payment_service.get_subscription_info(99999)
            assert exc_info.value.code == "user_not_found"


class TestSubscribe:
    def test_subscribe_student_plan(self, app, payment_service, test_user):
        with app.app_context():
            user = User.query.get(test_user.id)
            result = payment_service.subscribe(user.id, "STUDENT")
            assert result["plan_key"] == "STUDENT"
            assert result["status"] == "active"
            assert "expires_at" in result
            # user role should be updated
            db.session.refresh(user)
            assert user.role == UserRole.USER  # STUDENT maps to USER role

    def test_subscribe_pro_plan(self, app, payment_service, test_user):
        with app.app_context():
            user = User.query.get(test_user.id)
            result = payment_service.subscribe(user.id, "PRO")
            assert result["plan_key"] == "PRO"
            db.session.refresh(user)
            assert user.role == UserRole.PRO

    def test_subscribe_creates_payment_record(self, app, payment_service, test_user):
        with app.app_context():
            user = User.query.get(test_user.id)
            before_count = Payment.query.filter_by(user_id=user.id).count()
            payment_service.subscribe(user.id, "PRO")
            after_count = Payment.query.filter_by(user_id=user.id).count()
            assert after_count == before_count + 1

    def test_subscribe_cancels_existing_subscription(self, app, payment_service, test_user):
        with app.app_context():
            user = User.query.get(test_user.id)
            # First subscription
            payment_service.subscribe(user.id, "STUDENT")
            first_sub = payment_service.get_active_subscription(user.id)
            assert first_sub is not None

            # Upgrade to PRO — old sub should be cancelled
            payment_service.subscribe(user.id, "PRO")
            db.session.refresh(first_sub)
            assert first_sub.status == SubscriptionStatus.CANCELLED

    def test_subscribe_invalid_plan_raises(self, app, payment_service, test_user):
        with app.app_context():
            with pytest.raises(PaymentServiceError) as exc_info:
                payment_service.subscribe(test_user.id, "INVALID_PLAN")
            assert exc_info.value.code == "invalid_plan"

    def test_subscribe_enterprise_raises(self, app, payment_service, test_user):
        with app.app_context():
            with pytest.raises(PaymentServiceError) as exc_info:
                payment_service.subscribe(test_user.id, "ENTERPRISE")
            assert exc_info.value.code == "enterprise_contact_sales"

    def test_subscribe_nonexistent_user_raises(self, app, payment_service):
        with app.app_context():
            with pytest.raises(PaymentServiceError) as exc_info:
                payment_service.subscribe(99999, "PRO")
            assert exc_info.value.code == "user_not_found"

    def test_subscribe_yearly_cycle_sets_365_days(self, app, payment_service, test_user):
        with app.app_context():
            result = payment_service.subscribe(test_user.id, "PRO", billing_cycle="yearly")
            assert result["billing_cycle"] == "yearly"
            assert result["duration_days"] == 365
            assert result["final_amount"] == float(PLANS["PRO"]["price_rub"] * 10)

    def test_subscribe_with_valid_promo_code_applies_discount(self, app, payment_service, test_user):
        with app.app_context():
            result = payment_service.subscribe(test_user.id, "PRO", promo_code="WELCOME10")
            assert result["discount_percent"] == 10
            assert result["promo_code_applied"] == "WELCOME10"
            assert result["final_amount"] < result["original_amount"]

    def test_subscribe_with_invalid_promo_code_raises(self, app, payment_service, test_user):
        with app.app_context():
            with pytest.raises(PaymentServiceError) as exc_info:
                payment_service.subscribe(test_user.id, "PRO", promo_code="BADCODE")
            assert exc_info.value.code == "invalid_promo_code"

    def test_subscribe_with_invalid_billing_cycle_raises(self, app, payment_service, test_user):
        with app.app_context():
            with pytest.raises(PaymentServiceError) as exc_info:
                payment_service.subscribe(test_user.id, "PRO", billing_cycle="weekly")
            assert exc_info.value.code == "invalid_billing_cycle"


class TestCancelSubscription:
    def test_cancel_active_subscription(self, app, payment_service, test_user):
        with app.app_context():
            user = User.query.get(test_user.id)
            payment_service.subscribe(user.id, "PRO")
            result = payment_service.cancel_subscription(user.id)
            assert "expires_at" in result
            # Subscription should still be ACTIVE until period end
            sub = payment_service.get_active_subscription(user.id)
            assert sub is not None
            assert sub.cancelled_at is not None

    def test_cancel_no_subscription_raises(self, app, payment_service, test_user):
        with app.app_context():
            with pytest.raises(PaymentServiceError) as exc_info:
                payment_service.cancel_subscription(test_user.id)
            assert exc_info.value.code == "no_subscription"


class TestPaymentHistory:
    def test_history_empty_for_new_user(self, app, payment_service, test_user):
        with app.app_context():
            history = payment_service.get_payment_history(test_user.id)
            assert isinstance(history, list)
            assert len(history) == 0

    def test_history_populated_after_subscribe(self, app, payment_service, test_user):
        with app.app_context():
            user = User.query.get(test_user.id)
            payment_service.subscribe(user.id, "PRO")
            history = payment_service.get_payment_history(user.id)
            assert len(history) == 1
            assert history[0]["status"] == "completed"
            assert history[0]["amount"] == float(PLANS["PRO"]["price_rub"])


class TestUsageLimits:
    def test_free_user_blocked_at_limit(self, app, payment_service, test_user):
        with app.app_context():
            user = User.query.get(test_user.id)
            user.role = UserRole.USER
            db.session.commit()
            daily_limit = PLANS["FREE"]["limits"]["checks_per_day"]
            allowed, reason = payment_service.check_can_check(user.id, daily_limit)
            assert not allowed
            assert "лимит" in reason.lower()

    def test_free_user_allowed_below_limit(self, app, payment_service, test_user):
        with app.app_context():
            user = User.query.get(test_user.id)
            user.role = UserRole.USER
            db.session.commit()
            allowed, reason = payment_service.check_can_check(user.id, 0)
            assert allowed
            assert reason == "ok"

    def test_pro_user_always_allowed(self, app, payment_service, pro_user):
        with app.app_context():
            user = User.query.get(pro_user.id)
            # Even at very high count
            allowed, _ = payment_service.check_can_check(user.id, 10000)
            assert allowed

    def test_invalid_user_not_allowed(self, app, payment_service):
        with app.app_context():
            allowed, reason = payment_service.check_can_check(99999, 0)
            assert not allowed


# ---------------------------------------------------------------------------
# API integration tests (HTTP)
# ---------------------------------------------------------------------------


class TestPlansAPI:
    def test_list_plans_public_endpoint(self, client):
        """GET /api/payments/plans should work without auth."""
        response = client.get("/api/payments/plans")
        assert response.status_code == 200
        data = response.get_json()
        assert data["success"] is True
        assert isinstance(data["data"], list)
        assert len(data["data"]) >= 4

    def test_get_plan_by_key(self, client):
        response = client.get("/api/payments/plans/PRO")
        assert response.status_code == 200
        data = response.get_json()
        assert data["data"]["key"] == "PRO"

    def test_get_nonexistent_plan_returns_404(self, client):
        response = client.get("/api/payments/plans/NONEXISTENT")
        assert response.status_code == 404


class TestSubscriptionAPI:
    def test_subscription_requires_auth(self, client):
        response = client.get("/api/payments/subscription")
        assert response.status_code == 401

    def test_subscription_returns_info_for_authed_user(self, client, app, test_user):
        with app.app_context():
            token = create_access_token(identity=str(test_user.id))
        headers = {"Authorization": f"Bearer {token}"}
        response = client.get("/api/payments/subscription", headers=headers)
        assert response.status_code == 200
        data = response.get_json()
        assert "plan_key" in data["data"]


class TestSubscribeAPI:
    def test_subscribe_requires_auth(self, client):
        response = client.post(
            "/api/payments/subscribe",
            json={"plan_key": "PRO"},
        )
        assert response.status_code == 401

    def test_subscribe_pro_plan(self, client, app, test_user):
        with app.app_context():
            token = create_access_token(identity=str(test_user.id))
        headers = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}
        response = client.post(
            "/api/payments/subscribe",
            json={"plan_key": "PRO", "payment_method": "mock"},
            headers=headers,
        )
        assert response.status_code == 201
        data = response.get_json()
        assert data["success"] is True
        assert data["data"]["plan_key"] == "PRO"

    def test_subscribe_missing_plan_key(self, client, app, test_user):
        with app.app_context():
            token = create_access_token(identity=str(test_user.id))
        headers = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}
        response = client.post("/api/payments/subscribe", json={}, headers=headers)
        assert response.status_code == 400

    def test_subscribe_enterprise_returns_422(self, client, app, test_user):
        with app.app_context():
            token = create_access_token(identity=str(test_user.id))
        headers = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}
        response = client.post(
            "/api/payments/subscribe",
            json={"plan_key": "ENTERPRISE"},
            headers=headers,
        )
        assert response.status_code == 422

    def test_subscribe_yearly_with_promo(self, client, app, test_user):
        with app.app_context():
            token = create_access_token(identity=str(test_user.id))
        headers = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}
        response = client.post(
            "/api/payments/subscribe",
            json={
                "plan_key": "PRO",
                "billing_cycle": "yearly",
                "promo_code": "WELCOME10",
                "payment_method": "mock",
            },
            headers=headers,
        )
        assert response.status_code == 201
        data = response.get_json()["data"]
        assert data["billing_cycle"] == "yearly"
        assert data["discount_percent"] == 10

    def test_subscribe_invalid_cycle_returns_400(self, client, app, test_user):
        with app.app_context():
            token = create_access_token(identity=str(test_user.id))
        headers = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}
        response = client.post(
            "/api/payments/subscribe",
            json={"plan_key": "PRO", "billing_cycle": "weekly"},
            headers=headers,
        )
        assert response.status_code == 400


class TestCancelAPI:
    def test_cancel_requires_auth(self, client):
        response = client.post("/api/payments/cancel")
        assert response.status_code == 401

    def test_cancel_no_subscription_returns_400(self, client, app, test_user):
        with app.app_context():
            token = create_access_token(identity=str(test_user.id))
        headers = {"Authorization": f"Bearer {token}"}
        response = client.post("/api/payments/cancel", headers=headers)
        assert response.status_code == 400

    def test_cancel_active_subscription(self, client, app, test_user):
        with app.app_context():
            # Subscribe first
            svc = PaymentService(mock=True)
            user = User.query.get(test_user.id)
            svc.subscribe(user.id, "PRO")
            token = create_access_token(identity=str(test_user.id))
        headers = {"Authorization": f"Bearer {token}"}
        response = client.post("/api/payments/cancel", headers=headers)
        assert response.status_code == 200


class TestPaymentHistoryAPI:
    def test_history_requires_auth(self, client):
        response = client.get("/api/payments/history")
        assert response.status_code == 401

    def test_history_returns_list(self, client, app, test_user):
        with app.app_context():
            token = create_access_token(identity=str(test_user.id))
        headers = {"Authorization": f"Bearer {token}"}
        response = client.get("/api/payments/history", headers=headers)
        assert response.status_code == 200
        data = response.get_json()
        assert isinstance(data["data"], list)

    def test_history_limit_param(self, client, app, test_user):
        with app.app_context():
            token = create_access_token(identity=str(test_user.id))
        headers = {"Authorization": f"Bearer {token}"}
        response = client.get("/api/payments/history?limit=5", headers=headers)
        assert response.status_code == 200
