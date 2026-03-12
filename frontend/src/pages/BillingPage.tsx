import { motion } from "framer-motion";
import {
  AlertCircle,
  BadgeCheck,
  Calendar,
  Check,
  ChevronRight,
  CreditCard,
  Crown,
  History,
  Info,
  Loader2,
  RefreshCw,
  Sparkles,
  Star,
  Users,
  X,
  Zap,
} from "lucide-react";
import { FC, useCallback, useEffect, useState } from "react";
import toast, { Toaster } from "react-hot-toast";
import { useSearchParams } from "react-router-dom";

import {
  paymentsApi,
  type PaymentRecord,
  type Plan,
  type SubscribeResponse,
  type SubscriptionInfo,
} from "../api/client";

import AppPageLayout from "../components/layout/AppPageLayout";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "../components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../components/ui/dialog";
import { Input } from "../components/ui/input";
import { Separator } from "../components/ui/separator";
import { cn } from "../lib/utils";

// ─── Types ──────────────────────────────────────────────────────────────────

interface BillingPageProps {
  className?: string;
}

// ─── Animation helpers ───────────────────────────────────────────────────────

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.32, ease: [0.22, 1, 0.36, 1] },
  },
};

const stagger = {
  show: { transition: { staggerChildren: 0.06 } },
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

const PLAN_ICONS: Record<string, FC<{ className?: string }>> = {
  FREE: ({ className }) => <Star className={className} />,
  STUDENT: ({ className }) => <Zap className={className} />,
  PRO: ({ className }) => <Crown className={className} />,
  TEAM: ({ className }) => <Users className={className} />,
  ENTERPRISE: ({ className }) => <Sparkles className={className} />,
};

const PLAN_COLORS: Record<string, string> = {
  FREE: "text-muted-foreground",
  STUDENT: "text-blue-400",
  PRO: "text-amber-400",
  TEAM: "text-purple-400",
  ENTERPRISE: "text-emerald-400",
};

const PLAN_BORDER: Record<string, string> = {
  FREE: "border-border",
  STUDENT: "border-blue-500/30",
  PRO: "border-amber-500/40",
  TEAM: "border-purple-500/30",
  ENTERPRISE: "border-emerald-500/30",
};

const PLAN_GLOW: Record<string, string> = {
  FREE: "",
  STUDENT: "shadow-blue-500/10",
  PRO: "shadow-amber-500/15 ring-1 ring-amber-500/20",
  TEAM: "shadow-purple-500/10",
  ENTERPRISE: "shadow-emerald-500/10",
};

const formatDate = (iso: string | null): string => {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("ru-RU", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
};

const formatAmount = (amount: number, currency: string): string => {
  if (currency === "RUB") {
    return new Intl.NumberFormat("ru-RU", { style: "currency", currency: "RUB" }).format(amount);
  }
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(amount);
};

const limitLabel = (value: number): string => (value === -1 ? "∞" : String(value));

const paymentStatusLabel: Record<
  string,
  { label: string; variant: "default" | "secondary" | "destructive" | "outline" }
> = {
  completed: { label: "Оплачен", variant: "default" },
  pending: { label: "В обработке", variant: "secondary" },
  failed: { label: "Ошибка", variant: "destructive" },
  refunded: { label: "Возврат", variant: "outline" },
};

// ─── Sub-components ──────────────────────────────────────────────────────────

interface PlanCardProps {
  plan: Plan;
  isCurrent: boolean;
  isLoading: boolean;
  billingCycle: "monthly" | "yearly";
  onSelect: (plan: Plan) => void;
}

const getCyclePrice = (plan: Plan, cycle: "monthly" | "yearly"): number => {
  if (cycle === "yearly") {
    return Math.round(plan.price_rub * 10 * 100) / 100;
  }
  return plan.price_rub;
};

const PlanCard: FC<PlanCardProps> = ({ plan, isCurrent, isLoading, billingCycle, onSelect }) => {
  const Icon = PLAN_ICONS[plan.key] ?? PLAN_ICONS.FREE;
  const colorClass = PLAN_COLORS[plan.key] ?? PLAN_COLORS.FREE;
  const borderClass = PLAN_BORDER[plan.key] ?? PLAN_BORDER.FREE;
  const glowClass = PLAN_GLOW[plan.key] ?? "";
  const isEnterprise = plan.key === "ENTERPRISE";
  const isPro = plan.key === "PRO";

  return (
    <motion.div variants={fadeUp} className="h-full">
      <Card
        className={cn(
          "relative flex h-full flex-col border bg-card/60 backdrop-blur-sm transition-all duration-200",
          borderClass,
          glowClass,
          isCurrent && "bg-card/80",
          !isCurrent && !isEnterprise && "hover:border-border/80 hover:bg-card/70 cursor-pointer",
        )}
        onClick={() => !isCurrent && !isEnterprise && !isLoading && onSelect(plan)}
      >
        {isPro && (
          <div className="absolute -top-3 left-1/2 -translate-x-1/2">
            <Badge className="bg-amber-500 text-black text-xs px-3">
              <Star className="mr-1 size-3" />
              Популярный
            </Badge>
          </div>
        )}

        <CardHeader className="pb-3">
          <div className="flex items-center gap-2 mb-1">
            <Icon className={cn("size-5", colorClass)} />
            <CardTitle className="text-base font-semibold">{plan.name}</CardTitle>
            {isCurrent && (
              <Badge variant="secondary" className="ml-auto text-xs">
                <BadgeCheck className="mr-1 size-3" />
                Текущий
              </Badge>
            )}
          </div>

          <div className="flex items-baseline gap-1 mt-2">
            {isEnterprise ? (
              <span className="text-2xl font-bold">По запросу</span>
            ) : plan.price_rub === 0 ? (
              <span className="text-2xl font-bold">Бесплатно</span>
            ) : (
              <>
                <span className="text-2xl font-bold">
                  {getCyclePrice(plan, billingCycle).toLocaleString("ru-RU")} ₽
                </span>
                <span className="text-sm text-muted-foreground">
                  {billingCycle === "yearly" ? "/год" : "/мес"}
                </span>
              </>
            )}
          </div>
        </CardHeader>

        <CardContent className="flex-1 space-y-2 pb-4">
          <ul className="space-y-1.5">
            {plan.features.map((f) => (
              <li key={f} className="flex items-start gap-2 text-sm text-muted-foreground">
                <Check className={cn("mt-0.5 size-3.5 shrink-0", colorClass)} />
                <span>{f}</span>
              </li>
            ))}
          </ul>
        </CardContent>

        <CardFooter className="pt-0">
          {isEnterprise ? (
            <Button variant="outline" className="w-full" asChild>
              <a href="mailto:sales@cursa.app">Связаться с отделом продаж</a>
            </Button>
          ) : isCurrent ? (
            <Button variant="outline" className="w-full" disabled>
              <BadgeCheck className="mr-2 size-4" />
              Активный план
            </Button>
          ) : (
            <Button
              variant={isPro ? "default" : "outline"}
              className={cn(
                "w-full",
                isPro && "bg-amber-500 hover:bg-amber-600 text-black font-semibold",
              )}
              disabled={isLoading}
              onClick={(e) => {
                e.stopPropagation();
                onSelect(plan);
              }}
            >
              {isLoading ? (
                <Loader2 className="mr-2 size-4 animate-spin" />
              ) : (
                <ChevronRight className="mr-2 size-4" />
              )}
              {plan.price_rub === 0 ? "Перейти" : "Оформить"}
            </Button>
          )}
        </CardFooter>
      </Card>
    </motion.div>
  );
};

// ─── Main page ───────────────────────────────────────────────────────────────

const BillingPage: FC<BillingPageProps> = ({ className }) => {
  const [searchParams] = useSearchParams();
  const accessToken =
    typeof window !== "undefined" ? (localStorage.getItem("accessToken") ?? "") : "";

  const [plans, setPlans] = useState<Plan[]>([]);
  const [subscription, setSubscription] = useState<SubscriptionInfo | null>(null);
  const [history, setHistory] = useState<PaymentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [subscribing, setSubscribing] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">("monthly");
  const [promoCode, setPromoCode] = useState("");

  // Modals
  const [confirmPlan, setConfirmPlan] = useState<Plan | null>(null);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);

  useEffect(() => {
    const cycleParam = (searchParams.get("cycle") || "").toLowerCase();
    if (cycleParam === "monthly" || cycleParam === "yearly") {
      setBillingCycle(cycleParam);
    }
  }, [searchParams]);

  useEffect(() => {
    if (plans.length === 0) return;
    const planParam = (searchParams.get("plan") || "").toUpperCase();
    if (!planParam) return;
    const matched = plans.find((p) => p.key === planParam);
    if (matched) {
      setConfirmPlan(matched);
    }
  }, [plans, searchParams]);

  // ── Data loading ──────────────────────────────────────────────────────────

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [plansRes, subRes] = await Promise.all([
        paymentsApi.getPlans(accessToken),
        accessToken ? paymentsApi.getSubscription(accessToken) : null,
      ]);

      if (plansRes.success) {
        // Sort plans by price ascending
        const sorted = [...plansRes.data].sort((a, b) => a.price_rub - b.price_rub);
        setPlans(sorted);
      }

      if (subRes?.success && subRes.data) {
        setSubscription(subRes.data);
      }
    } catch (err) {
      toast.error("Не удалось загрузить данные о тарифах");
    } finally {
      setLoading(false);
    }
  }, [accessToken]);

  const loadHistory = useCallback(async () => {
    if (!accessToken) return;
    try {
      const res = await paymentsApi.getHistory(accessToken, 50);
      if (res.success) setHistory(res.data);
    } catch {
      toast.error("Не удалось загрузить историю платежей");
    }
  }, [accessToken]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // ── Subscribe ─────────────────────────────────────────────────────────────

  const handleSubscribe = async (plan: Plan) => {
    if (!accessToken) {
      toast.error("Необходима авторизация");
      return;
    }

    setSubscribing(true);
    setConfirmPlan(null);

    try {
      const res = await paymentsApi.subscribe(
        {
          plan_key: plan.key,
          payment_method: "mock",
          billing_cycle: billingCycle,
          promo_code: promoCode.trim() || undefined,
        },
        accessToken,
      );

      if (res.success) {
        const payload = res.data as SubscribeResponse;
        const amount = payload.final_amount.toLocaleString("ru-RU");
        const discountPart =
          payload.discount_percent > 0 ? ` со скидкой ${payload.discount_percent}%` : "";
        toast.success(`Подписка «${plan.name}» активирована${discountPart}. Списано ${amount} ₽.`);
        await loadData();
        setPromoCode("");
      }
    } catch (err: any) {
      const msg = err?.message ?? "Ошибка оформления подписки";
      toast.error(msg);
    } finally {
      setSubscribing(false);
    }
  };

  // ── Cancel ────────────────────────────────────────────────────────────────

  const handleCancel = async () => {
    if (!accessToken) return;
    setCancelling(true);
    setShowCancelModal(false);

    try {
      const res = await paymentsApi.cancelSubscription(accessToken);
      if (res.success) {
        toast.success(res.data.message ?? "Подписка отменена");
        await loadData();
      }
    } catch (err: any) {
      toast.error(err?.message ?? "Не удалось отменить подписку");
    } finally {
      setCancelling(false);
    }
  };

  // ── Current plan info ────────────────────────────────────────────────────

  const currentPlanKey = subscription?.plan_key ?? "FREE";
  const limits = subscription?.plan_limits;

  return (
    <AppPageLayout
      title="Тариф и оплата"
      className={className}
      actions={
        subscription?.subscription_id ? (
          <Button
            variant="ghost"
            size="sm"
            className="text-muted-foreground hover:text-destructive"
            disabled={cancelling}
            onClick={() => setShowCancelModal(true)}
          >
            {cancelling ? (
              <Loader2 className="mr-2 size-4 animate-spin" />
            ) : (
              <X className="mr-2 size-4" />
            )}
            Отменить подписку
          </Button>
        ) : undefined
      }
    >
      <Toaster position="top-right" />

      {/* Current plan summary */}
      {!loading && subscription && (
        <motion.div initial="hidden" animate="show" variants={fadeUp}>
          <Card className="border-border/50 bg-card/50">
            <CardContent className="flex flex-wrap items-center gap-4 py-4">
              <div className="flex items-center gap-3">
                {(() => {
                  const Icon = PLAN_ICONS[currentPlanKey] ?? PLAN_ICONS.FREE;
                  return (
                    <div
                      className={cn(
                        "flex size-10 items-center justify-center rounded-lg bg-muted",
                        PLAN_COLORS[currentPlanKey],
                      )}
                    >
                      <Icon className="size-5" />
                    </div>
                  );
                })()}
                <div>
                  <p className="text-sm text-muted-foreground">Текущий тариф</p>
                  <p className="font-semibold">{subscription.plan_name}</p>
                </div>
              </div>

              <Separator orientation="vertical" className="hidden h-10 md:block" />

              {subscription.expires_at && (
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="size-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Активна до:</span>
                  <span className="font-medium">{formatDate(subscription.expires_at)}</span>
                </div>
              )}

              {subscription.cancelled_at && (
                <Badge variant="destructive" className="text-xs">
                  <AlertCircle className="mr-1 size-3" />
                  Отменена — действует до {formatDate(subscription.expires_at)}
                </Badge>
              )}

              {limits && (
                <>
                  <Separator orientation="vertical" className="hidden h-10 md:block" />
                  <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                    <span>
                      Проверок/день:{" "}
                      <span className="font-medium text-foreground">
                        {limitLabel(limits.checks_per_day)}
                      </span>
                    </span>
                    <span>
                      API:{" "}
                      <span
                        className={cn(
                          "font-medium",
                          limits.api_access ? "text-emerald-400" : "text-foreground",
                        )}
                      >
                        {limits.api_access ? "Есть" : "Нет"}
                      </span>
                    </span>
                    <span>
                      Автоисправление:{" "}
                      <span
                        className={cn(
                          "font-medium",
                          limits.auto_correction ? "text-emerald-400" : "text-foreground",
                        )}
                      >
                        {limits.auto_correction ? "Да" : "Нет"}
                      </span>
                    </span>
                  </div>
                </>
              )}

              <div className="ml-auto flex gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  className="gap-1.5 text-muted-foreground"
                  onClick={() => {
                    setShowHistoryModal(true);
                    loadHistory();
                  }}
                >
                  <History className="size-4" />
                  История платежей
                </Button>
                <Button variant="ghost" size="icon" onClick={loadData} disabled={loading}>
                  <RefreshCw className={cn("size-4", loading && "animate-spin")} />
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Plans grid */}
      <div className="mt-2">
        <div className="mb-4 flex flex-wrap items-center gap-3">
          <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
            Доступные тарифы
          </h2>
          <div className="ml-auto inline-flex rounded-lg border border-border/70 bg-card/40 p-1">
            <Button
              size="sm"
              variant={billingCycle === "monthly" ? "default" : "ghost"}
              className="h-8"
              onClick={() => setBillingCycle("monthly")}
            >
              Ежемесячно
            </Button>
            <Button
              size="sm"
              variant={billingCycle === "yearly" ? "default" : "ghost"}
              className="h-8"
              onClick={() => setBillingCycle("yearly")}
            >
              Ежегодно (-2 мес)
            </Button>
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <Card key={i} className="h-80 animate-pulse bg-muted/30" />
            ))}
          </div>
        ) : (
          <motion.div
            initial="hidden"
            animate="show"
            variants={stagger}
            className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4"
          >
            {plans
              .filter((p) => p.key !== "FREE" || currentPlanKey === "FREE")
              .map((plan) => (
                <PlanCard
                  key={plan.key}
                  plan={plan}
                  isCurrent={plan.key === currentPlanKey}
                  isLoading={subscribing}
                  billingCycle={billingCycle}
                  onSelect={(p) => setConfirmPlan(p)}
                />
              ))}
          </motion.div>
        )}
      </div>

      {/* Payment methods info */}
      <Card className="border-border/40 bg-card/30">
        <CardContent className="flex flex-wrap items-center gap-3 py-3 text-sm text-muted-foreground">
          <CreditCard className="size-4 shrink-0" />
          <span>Принимаем: Visa, Mastercard, МИР, СБП, ЮMoney</span>
          <Separator orientation="vertical" className="hidden h-4 sm:block" />
          <Info className="size-4 shrink-0" />
          <span>Все платежи обрабатываются через защищённый шлюз. Данные карты не хранятся.</span>
        </CardContent>
      </Card>

      {/* ── Confirm subscribe modal ── */}
      <Dialog open={!!confirmPlan} onOpenChange={() => setConfirmPlan(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Оформить подписку</DialogTitle>
            <DialogDescription>
              Тариф <strong>{confirmPlan?.name}</strong>
              {confirmPlan && confirmPlan.price_rub > 0
                ? ` — ${getCyclePrice(confirmPlan, billingCycle).toLocaleString("ru-RU")} ₽/${billingCycle === "yearly" ? "год" : "мес"}`
                : " — Бесплатно"}
            </DialogDescription>
          </DialogHeader>

          {confirmPlan && (
            <div className="space-y-2 py-2">
              {confirmPlan.price_rub > 0 && (
                <div className="space-y-1.5">
                  <label htmlFor="promo-code" className="text-sm text-muted-foreground">
                    Промокод (опционально)
                  </label>
                  <Input
                    id="promo-code"
                    value={promoCode}
                    onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                    placeholder="WELCOME10"
                    maxLength={24}
                  />
                </div>
              )}

              <p className="text-sm text-muted-foreground">Что входит:</p>
              <ul className="space-y-1">
                {confirmPlan.features.map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm">
                    <Check className="size-3.5 text-emerald-400 shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setConfirmPlan(null)} className="flex-1">
              Отмена
            </Button>
            <Button
              className="flex-1"
              disabled={subscribing}
              onClick={() => confirmPlan && handleSubscribe(confirmPlan)}
            >
              {subscribing ? (
                <Loader2 className="mr-2 size-4 animate-spin" />
              ) : (
                <CreditCard className="mr-2 size-4" />
              )}
              Оформить
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Cancel modal ── */}
      <Dialog open={showCancelModal} onOpenChange={setShowCancelModal}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Отменить подписку?</DialogTitle>
            <DialogDescription>
              Подписка останется активной до конца оплаченного периода (
              {formatDate(subscription?.expires_at ?? null)}). После этого ваш аккаунт перейдёт на
              бесплатный тариф.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowCancelModal(false)} className="flex-1">
              Сохранить подписку
            </Button>
            <Button variant="destructive" onClick={handleCancel} className="flex-1">
              Да, отменить
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Payment history modal ── */}
      <Dialog open={showHistoryModal} onOpenChange={setShowHistoryModal}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>История платежей</DialogTitle>
          </DialogHeader>

          {history.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">История платежей пуста</p>
          ) : (
            <div className="max-h-80 overflow-y-auto space-y-2 pr-1">
              {history.map((p) => {
                const statusInfo = paymentStatusLabel[p.status] ?? {
                  label: p.status,
                  variant: "secondary" as const,
                };
                return (
                  <div
                    key={p.id}
                    className="flex items-center justify-between rounded-lg border border-border/50 px-3 py-2.5"
                  >
                    <div>
                      <p className="text-sm font-medium">{p.description}</p>
                      <p className="text-xs text-muted-foreground">{formatDate(p.created_at)}</p>
                    </div>
                    <div className="flex items-center gap-3 text-right">
                      <span className="text-sm font-semibold">
                        {formatAmount(p.amount, p.currency)}
                      </span>
                      <Badge variant={statusInfo.variant} className="text-xs">
                        {statusInfo.label}
                      </Badge>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </AppPageLayout>
  );
};

export default BillingPage;
