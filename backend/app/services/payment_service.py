"""
Payment and Subscription Service

Manages subscription plans, payments, and usage limits.
Supports mock mode for development (no API keys required) and
real payment gateways (Stripe, YooKassa) in production.
"""

from __future__ import annotations

import logging
from datetime import datetime, timezone, timedelta
from decimal import Decimal
from typing import Optional

from app.extensions import db
from app.models.user import User, UserRole
from app.models.subscription import Subscription, SubscriptionStatus
from app.models.payment import Payment, PaymentStatus

logger = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# Plan definitions
# ---------------------------------------------------------------------------

PLANS: dict[str, dict] = {
    "FREE": {
        "id": "free",
        "name": "Бесплатный",
        "price_rub": Decimal("0.00"),
        "price_usd": Decimal("0.00"),
        "role": UserRole.USER,
        "limits": {
            "checks_per_day": 5,
            "checks_per_month": 30,
            "max_file_size_mb": 10,
            "api_access": False,
            "auto_correction": False,
            "batch_processing": False,
            "custom_profiles": 0,
            "team_members": 1,
        },
        "features": [
            "5 проверок в день",
            "Базовые профили университетов",
            "Отчёт о нарушениях",
        ],
    },
    "STUDENT": {
        "id": "student",
        "name": "Студент",
        "price_rub": Decimal("299.00"),
        "price_usd": Decimal("3.49"),
        "role": UserRole.USER,
        "limits": {
            "checks_per_day": 20,
            "checks_per_month": 200,
            "max_file_size_mb": 25,
            "api_access": False,
            "auto_correction": True,
            "batch_processing": False,
            "custom_profiles": 2,
            "team_members": 1,
        },
        "features": [
            "20 проверок в день",
            "Автоисправление документов",
            "200 проверок в месяц",
            "2 пользовательских профиля",
            "Приоритетная поддержка",
        ],
    },
    "PRO": {
        "id": "pro",
        "name": "Профессиональный",
        "price_rub": Decimal("990.00"),
        "price_usd": Decimal("11.99"),
        "role": UserRole.PRO,
        "limits": {
            "checks_per_day": -1,  # unlimited
            "checks_per_month": -1,
            "max_file_size_mb": 50,
            "api_access": True,
            "auto_correction": True,
            "batch_processing": True,
            "custom_profiles": 10,
            "team_members": 1,
        },
        "features": [
            "Безлимитные проверки",
            "Пакетная обработка",
            "REST API доступ",
            "10 пользовательских профилей",
            "Автоисправление всех нарушений",
            "Экспорт в PDF/DOCX",
            "Приоритетная поддержка 24/7",
        ],
    },
    "TEAM": {
        "id": "team",
        "name": "Команда",
        "price_rub": Decimal("3490.00"),
        "price_usd": Decimal("39.99"),
        "role": UserRole.TEAM,
        "limits": {
            "checks_per_day": -1,
            "checks_per_month": -1,
            "max_file_size_mb": 50,
            "api_access": True,
            "auto_correction": True,
            "batch_processing": True,
            "custom_profiles": 50,
            "team_members": 10,
        },
        "features": [
            "Всё из тарифа PRO",
            "До 10 участников команды",
            "Единые профили для команды",
            "Командная аналитика",
            "Управление правами доступа",
            "Выделенный менеджер",
        ],
    },
    "ENTERPRISE": {
        "id": "enterprise",
        "name": "Корпоративный",
        "price_rub": Decimal("0.00"),  # custom pricing
        "price_usd": Decimal("0.00"),
        "role": UserRole.ENTERPRISE,
        "limits": {
            "checks_per_day": -1,
            "checks_per_month": -1,
            "max_file_size_mb": 200,
            "api_access": True,
            "auto_correction": True,
            "batch_processing": True,
            "custom_profiles": -1,  # unlimited
            "team_members": -1,
        },
        "features": [
            "Всё из тарифа Команда",
            "Неограниченное количество пользователей",
            "Кастомные профили университетов",
            "AI-ассистент нормоконтроля",
            "SLA 99.9% uptime",
            "Интеграция с LMS системами",
            "On-premise развёртывание",
            "Индивидуальный договор",
        ],
    },
}

VALID_BILLING_CYCLES = {"monthly", "yearly"}

# Promo codes are intentionally simple for MVP and can be moved to DB later.
PROMO_CODES: dict[str, int] = {
    "WELCOME10": 10,
    "STUDENT20": 20,
    "LAUNCH35": 35,
}


class PaymentServiceError(Exception):
    """Base error for payment service operations"""

    def __init__(self, message: str, code: str = "payment_error"):
        super().__init__(message)
        self.code = code


class PaymentService:
    """
    Core service for subscription and payment management.

    In development mode (mock=True or no provider credentials), all payment
    operations succeed immediately without hitting external APIs.
    """

    def __init__(self, mock: bool = False):
        self.mock = mock
        logger.info(f"PaymentService initialized ({'mock' if mock else 'production'} mode)")

    # ------------------------------------------------------------------
    # Plan queries
    # ------------------------------------------------------------------

    def get_all_plans(self) -> list[dict]:
        """Return all available plans as serializable dicts."""
        result = []
        for key, plan in PLANS.items():
            serialized = {
                **plan,
                "price_rub": float(plan["price_rub"]),
                "price_usd": float(plan["price_usd"]),
                "role": plan["role"].value,
                "key": key,
            }
            result.append(serialized)
        return result

    def get_plan(self, plan_key: str) -> Optional[dict]:
        """Return a single plan by key (case-insensitive)."""
        plan = PLANS.get(plan_key.upper())
        if not plan:
            return None
        return {
            **plan,
            "price_rub": float(plan["price_rub"]),
            "price_usd": float(plan["price_usd"]),
            "role": plan["role"].value,
            "key": plan_key.upper(),
        }

    # ------------------------------------------------------------------
    # Subscription queries
    # ------------------------------------------------------------------

    def get_active_subscription(self, user_id: int) -> Optional[Subscription]:
        """Return the user's current active or trial subscription."""
        return (
            Subscription.query.filter_by(user_id=user_id)
            .filter(Subscription.status.in_([SubscriptionStatus.ACTIVE, SubscriptionStatus.TRIAL]))
            .order_by(Subscription.created_at.desc())
            .first()
        )

    def get_subscription_info(self, user_id: int) -> dict:
        """Return full subscription details for a user (safe to serialize)."""
        sub = self.get_active_subscription(user_id)
        user = User.query.get(user_id)

        if not user:
            raise PaymentServiceError("User not found", "user_not_found")

        plan_key = user.role.value.upper() if user.role != UserRole.USER else "FREE"
        plan = PLANS.get(plan_key, PLANS["FREE"])

        base = {
            "plan_key": plan_key,
            "plan_name": plan["name"],
            "plan_limits": plan["limits"],
            "plan_features": plan["features"],
            "price_rub": float(plan["price_rub"]),
            "price_usd": float(plan["price_usd"]),
            "role": user.role.value,
        }

        if sub:
            base.update(
                {
                    "subscription_id": sub.id,
                    "status": sub.status.value,
                    "started_at": sub.started_at.isoformat() if sub.started_at else None,
                    "expires_at": sub.expires_at.isoformat() if sub.expires_at else None,
                    "cancelled_at": sub.cancelled_at.isoformat() if sub.cancelled_at else None,
                    "auto_renew": sub.cancelled_at is None,
                }
            )
        else:
            base.update(
                {
                    "subscription_id": None,
                    "status": "free",
                    "started_at": None,
                    "expires_at": None,
                    "cancelled_at": None,
                    "auto_renew": False,
                }
            )

        return base

    # ------------------------------------------------------------------
    # Subscription management
    # ------------------------------------------------------------------

    def subscribe(
        self,
        user_id: int,
        plan_key: str,
        payment_method: str = "mock",
        payment_token: Optional[str] = None,
        billing_cycle: str = "monthly",
        promo_code: Optional[str] = None,
    ) -> dict:
        """
        Create or upgrade a subscription for a user.

        For development/mock mode, payment succeeds immediately.
        In production, passes through Stripe/YooKassa.

        Returns:
            dict with subscription info and payment status.
        """
        plan_key = plan_key.upper()
        plan = PLANS.get(plan_key)
        if not plan:
            raise PaymentServiceError(f"Unknown plan: {plan_key}", "invalid_plan")

        if plan_key == "ENTERPRISE":
            raise PaymentServiceError(
                "Enterprise plan requires contacting sales", "enterprise_contact_sales"
            )

        user = User.query.get(user_id)
        if not user:
            raise PaymentServiceError("User not found", "user_not_found")

        billing_cycle = self._normalize_billing_cycle(billing_cycle)
        discount_percent = self._resolve_promo_discount(promo_code)
        original_amount, final_amount, duration_days = self._calculate_subscription_pricing(
            plan=plan,
            billing_cycle=billing_cycle,
            discount_percent=discount_percent,
        )

        # Cancel existing subscription
        existing = self.get_active_subscription(user_id)
        if existing:
            existing.status = SubscriptionStatus.CANCELLED
            existing.cancelled_at = datetime.now(timezone.utc)

        # Process payment
        payment_result = self._process_payment(
            user_id=user_id,
            amount=final_amount,
            currency="RUB",
            description=f"Подписка {plan['name']} ({'год' if billing_cycle == 'yearly' else 'месяц'})",
            provider=payment_method,
            token=payment_token,
        )

        if not payment_result["success"]:
            raise PaymentServiceError(payment_result["error"], "payment_failed")

        # Create subscription with selected billing cycle
        now = datetime.now(timezone.utc)
        sub = Subscription(
            user_id=user_id,
            plan=plan_key,
            status=SubscriptionStatus.ACTIVE,
            amount=final_amount,
            currency="RUB",
            started_at=now,
            expires_at=now + timedelta(days=duration_days),
        )
        db.session.add(sub)

        # Update user role
        user.role = plan["role"]

        db.session.commit()
        logger.info(f"Subscription created: user={user_id} plan={plan_key}")

        return {
            "subscription_id": sub.id,
            "plan_key": plan_key,
            "plan_name": plan["name"],
            "status": sub.status.value,
            "expires_at": sub.expires_at.isoformat(),
            "payment_id": payment_result.get("payment_id"),
            "billing_cycle": billing_cycle,
            "original_amount": float(original_amount),
            "final_amount": float(final_amount),
            "discount_percent": discount_percent,
            "promo_code_applied": promo_code.upper() if promo_code and discount_percent > 0 else None,
            "duration_days": duration_days,
        }

    def _normalize_billing_cycle(self, billing_cycle: str) -> str:
        """Validate and normalize billing cycle input."""
        normalized = (billing_cycle or "monthly").strip().lower()
        if normalized not in VALID_BILLING_CYCLES:
            raise PaymentServiceError(
                f"Invalid billing_cycle '{billing_cycle}'. Supported: monthly, yearly",
                "invalid_billing_cycle",
            )
        return normalized

    def _resolve_promo_discount(self, promo_code: Optional[str]) -> int:
        """Resolve promo code to discount percentage (0 if absent)."""
        if not promo_code:
            return 0

        normalized = promo_code.strip().upper()
        if not normalized:
            return 0

        discount = PROMO_CODES.get(normalized)
        if discount is None:
            raise PaymentServiceError("Invalid promo code", "invalid_promo_code")
        return discount

    def _calculate_subscription_pricing(
        self,
        plan: dict,
        billing_cycle: str,
        discount_percent: int,
    ) -> tuple[Decimal, Decimal, int]:
        """
        Calculate final price and duration.

        Yearly pricing uses 2 months free (10x monthly) as a base yearly discount.
        Promo discount is applied on top of cycle pricing.
        """
        monthly_price: Decimal = plan["price_rub"]

        if billing_cycle == "yearly":
            original_amount = monthly_price * Decimal("10")
            duration_days = 365
        else:
            original_amount = monthly_price
            duration_days = 30

        if discount_percent > 0:
            multiplier = Decimal(str(100 - discount_percent)) / Decimal("100")
            final_amount = (original_amount * multiplier).quantize(Decimal("0.01"))
        else:
            final_amount = original_amount

        return original_amount, final_amount, duration_days

    def cancel_subscription(self, user_id: int) -> dict:
        """Cancel the active subscription (remains active until period end)."""
        sub = self.get_active_subscription(user_id)
        if not sub:
            raise PaymentServiceError("No active subscription", "no_subscription")

        sub.cancelled_at = datetime.now(timezone.utc)
        # Status stays ACTIVE until expires_at; a cron job would expire it
        db.session.commit()
        logger.info(f"Subscription cancelled: user={user_id} subscription={sub.id}")

        return {
            "subscription_id": sub.id,
            "status": sub.status.value,
            "expires_at": sub.expires_at.isoformat(),
            "message": "Подписка будет активна до конца оплаченного периода",
        }

    def get_payment_history(self, user_id: int, limit: int = 20) -> list[dict]:
        """Return paginated payment history for a user."""
        payments = (
            Payment.query.filter_by(user_id=user_id)
            .order_by(Payment.created_at.desc())
            .limit(limit)
            .all()
        )
        return [p.to_dict() for p in payments]

    # ------------------------------------------------------------------
    # Usage / limit checks
    # ------------------------------------------------------------------

    def check_can_check(self, user_id: int, checks_today: int) -> tuple[bool, str]:
        """
        Check whether a user can perform a document check.

        Returns:
            (allowed: bool, reason: str)
        """
        user = User.query.get(user_id)
        if not user:
            return False, "User not found"

        plan_key = user.role.value.upper() if user.role != UserRole.USER else "FREE"
        limits = PLANS.get(plan_key, PLANS["FREE"])["limits"]
        daily_limit = limits["checks_per_day"]

        if daily_limit == -1:
            return True, "ok"

        if checks_today >= daily_limit:
            plan_name = PLANS.get(plan_key, PLANS["FREE"])["name"]
            return (
                False,
                f"Достигнут лимит проверок ({daily_limit}/день) для тарифа «{plan_name}». "
                f"Перейдите на тариф PRO для безлимитных проверок.",
            )

        return True, "ok"

    # ------------------------------------------------------------------
    # Internal payment processing
    # ------------------------------------------------------------------

    def _process_payment(
        self,
        user_id: int,
        amount: Decimal,
        currency: str,
        description: str,
        provider: str,
        token: Optional[str],
    ) -> dict:
        """Route payment through mock or real provider."""
        if self.mock or provider == "mock" or amount == Decimal("0.00"):
            return self._mock_payment(user_id, amount, currency, description)

        if provider == "stripe":
            return self._stripe_payment(user_id, amount, currency, description, token)

        if provider == "yookassa":
            return self._yookassa_payment(user_id, amount, currency, description, token)

        return {"success": False, "error": f"Unknown payment provider: {provider}"}

    def _mock_payment(self, user_id: int, amount: Decimal, currency: str, description: str) -> dict:
        """Simulate a successful payment without calling any external API."""
        import uuid

        transaction_id = f"mock_{uuid.uuid4().hex[:16]}"
        payment = Payment(
            user_id=user_id,
            amount=amount,
            currency=currency,
            status=PaymentStatus.COMPLETED,
            provider="mock",
            transaction_id=transaction_id,
            description=description,
            completed_at=datetime.now(timezone.utc),
        )
        db.session.add(payment)
        # Don't commit here — caller will commit after subscription creation
        return {"success": True, "payment_id": transaction_id}

    def _stripe_payment(
        self,
        user_id: int,
        amount: Decimal,
        currency: str,
        description: str,
        token: Optional[str],
    ) -> dict:
        """Process payment through Stripe (requires STRIPE_SECRET_KEY env var)."""
        import os

        try:
            import stripe  # type: ignore

            stripe.api_key = os.environ.get("STRIPE_SECRET_KEY")
            if not stripe.api_key:
                raise PaymentServiceError("STRIPE_SECRET_KEY not configured", "config_error")

            # Stripe amounts are in smallest currency unit (kopecks for RUB)
            amount_int = int(amount * 100)
            charge = stripe.PaymentIntent.create(
                amount=amount_int,
                currency=currency.lower(),
                description=description,
                payment_method=token,
                confirm=True,
            )

            payment = Payment(
                user_id=user_id,
                amount=amount,
                currency=currency,
                status=PaymentStatus.COMPLETED,
                provider="stripe",
                transaction_id=charge["id"],
                description=description,
                completed_at=datetime.now(timezone.utc),
            )
            db.session.add(payment)
            return {"success": True, "payment_id": charge["id"]}

        except Exception as e:
            logger.error(f"Stripe payment failed for user {user_id}: {e}")
            payment = Payment(
                user_id=user_id,
                amount=amount,
                currency=currency,
                status=PaymentStatus.FAILED,
                provider="stripe",
                transaction_id=f"stripe_failed_{user_id}",
                description=description,
                payment_metadata={"error": str(e)},
            )
            db.session.add(payment)
            return {"success": False, "error": str(e)}

    def _yookassa_payment(
        self,
        user_id: int,
        amount: Decimal,
        currency: str,
        description: str,
        token: Optional[str],
    ) -> dict:
        """Process payment through YooKassa (requires YOOKASSA_SHOP_ID / YOOKASSA_SECRET_KEY)."""
        import os
        import uuid

        try:
            from yookassa import Configuration, Payment as YooPayment  # type: ignore

            Configuration.account_id = os.environ.get("YOOKASSA_SHOP_ID")
            Configuration.secret_key = os.environ.get("YOOKASSA_SECRET_KEY")

            if not Configuration.account_id or not Configuration.secret_key:
                raise PaymentServiceError("YooKassa credentials not configured", "config_error")

            idempotence_key = str(uuid.uuid4())
            payment_data = YooPayment.create(
                {
                    "amount": {"value": str(amount), "currency": currency},
                    "payment_method_data": {"type": "bank_card", "card": {"id": token}},
                    "confirmation": {"type": "redirect", "return_url": "https://cursa.app/billing"},
                    "description": description,
                    "capture": True,
                },
                idempotence_key,
            )

            payment = Payment(
                user_id=user_id,
                amount=amount,
                currency=currency,
                status=PaymentStatus.COMPLETED,
                provider="yookassa",
                transaction_id=payment_data.id,
                description=description,
                completed_at=datetime.now(timezone.utc),
            )
            db.session.add(payment)
            return {"success": True, "payment_id": payment_data.id}

        except Exception as e:
            logger.error(f"YooKassa payment failed for user {user_id}: {e}")
            payment = Payment(
                user_id=user_id,
                amount=amount,
                currency=currency,
                status=PaymentStatus.FAILED,
                provider="yookassa",
                transaction_id=f"yoo_failed_{user_id}",
                description=description,
                payment_metadata={"error": str(e)},
            )
            db.session.add(payment)
            return {"success": False, "error": str(e)}


# ---------------------------------------------------------------------------
# Module-level singleton (lazily initialised in app context)
# ---------------------------------------------------------------------------

_payment_service: Optional[PaymentService] = None


def get_payment_service() -> PaymentService:
    """Return the module-level PaymentService singleton."""
    global _payment_service
    if _payment_service is None:
        import os

        mock_mode = os.environ.get("PAYMENT_MOCK", "true").lower() in ("1", "true", "yes")
        _payment_service = PaymentService(mock=mock_mode)
    return _payment_service
