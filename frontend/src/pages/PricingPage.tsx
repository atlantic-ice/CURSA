import { motion } from "framer-motion";
import { Check, Crown, Loader2, Rocket, Sparkles, Star, Users, Zap } from "lucide-react";
import { FC, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

import { paymentsApi, type Plan } from "../api/client";
import AppPageLayout from "../components/layout/AppPageLayout";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "../components/ui/card";
import { Separator } from "../components/ui/separator";
import { cn } from "../lib/utils";

interface PricingPageProps {
  className?: string;
}

const PLAN_META: Record<string, { icon: FC<{ className?: string }>; accent: string }> = {
  FREE: { icon: Star, accent: "text-slate-300" },
  STUDENT: { icon: Zap, accent: "text-sky-300" },
  PRO: { icon: Crown, accent: "text-amber-300" },
  TEAM: { icon: Users, accent: "text-fuchsia-300" },
  ENTERPRISE: { icon: Sparkles, accent: "text-emerald-300" },
};

const fade = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: [0.22, 1, 0.36, 1] } },
};

const getCyclePrice = (plan: Plan, cycle: "monthly" | "yearly"): number => {
  if (cycle === "yearly") return Math.round(plan.price_rub * 10 * 100) / 100;
  return plan.price_rub;
};

const fmtPrice = (plan: Plan, cycle: "monthly" | "yearly"): string => {
  if (plan.key === "ENTERPRISE") return "По запросу";
  if (plan.price_rub === 0) return "Бесплатно";
  const unit = cycle === "yearly" ? "год" : "мес";
  return `${getCyclePrice(plan, cycle).toLocaleString("ru-RU")} ₽/${unit}`;
};

const renderLimit = (value: number): string => (value === -1 ? "Безлимит" : String(value));

const PricingPage: FC<PricingPageProps> = ({ className }) => {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">("monthly");

  useEffect(() => {
    let alive = true;

    const run = async () => {
      setLoading(true);
      setError("");
      try {
        const res = await paymentsApi.getPlans();
        if (!alive) return;
        const sorted = [...res.data].sort((a, b) => a.price_rub - b.price_rub);
        setPlans(sorted);
      } catch (e: any) {
        if (!alive) return;
        setError(e?.message ?? "Не удалось загрузить тарифы");
      } finally {
        if (alive) setLoading(false);
      }
    };

    run();
    return () => {
      alive = false;
    };
  }, []);

  const matrixRows = useMemo(
    () => [
      { key: "checks_per_day", label: "Проверок в день" },
      { key: "checks_per_month", label: "Проверок в месяц" },
      { key: "max_file_size_mb", label: "Макс. размер файла (MB)" },
      { key: "custom_profiles", label: "Пользовательские профили" },
      { key: "team_members", label: "Участники команды" },
    ],
    [],
  );

  return (
    <AppPageLayout className={className} title="Тарифы CURSA" maxWidth="wide" showTitleBar={false}>
      <section className="relative overflow-hidden rounded-3xl border border-border/60 bg-gradient-to-br from-slate-950 via-zinc-950 to-slate-900 p-6 text-slate-100 md:p-10">
        <div className="pointer-events-none absolute -top-20 -right-20 h-64 w-64 rounded-full bg-amber-400/15 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 -left-10 h-72 w-72 rounded-full bg-sky-400/10 blur-3xl" />

        <motion.div
          initial="hidden"
          animate="show"
          variants={fade}
          className="relative z-10 max-w-3xl"
        >
          <Badge className="mb-4 bg-white/10 text-slate-100 hover:bg-white/10">
            Гибкие подписки
          </Badge>
          <h1 className="text-balance text-3xl font-semibold tracking-tight md:text-5xl">
            Выберите тариф под ваш темп проверки документов
          </h1>
          <p className="mt-4 max-w-2xl text-slate-300 md:text-lg">
            От студенческой подготовки до командной экспертизы кафедры: подключайте только нужные
            лимиты и функции.
          </p>
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <Button asChild className="bg-amber-400 text-black hover:bg-amber-300">
              <Link to="/billing">
                <Rocket className="mr-2 h-4 w-4" />
                Оформить подписку
              </Link>
            </Button>
            <Button asChild variant="outline" className="border-white/20 bg-white/5 text-white">
              <Link to="/register">Создать аккаунт</Link>
            </Button>
            <div className="ml-auto inline-flex rounded-lg border border-white/20 bg-white/5 p-1">
              <Button
                size="sm"
                variant={billingCycle === "monthly" ? "default" : "ghost"}
                className={cn("h-8", billingCycle !== "monthly" && "text-white hover:text-white")}
                onClick={() => setBillingCycle("monthly")}
              >
                Ежемесячно
              </Button>
              <Button
                size="sm"
                variant={billingCycle === "yearly" ? "default" : "ghost"}
                className={cn("h-8", billingCycle !== "yearly" && "text-white hover:text-white")}
                onClick={() => setBillingCycle("yearly")}
              >
                Ежегодно (-2 мес)
              </Button>
            </div>
          </div>
        </motion.div>
      </section>

      {loading && (
        <div className="flex items-center justify-center rounded-2xl border border-border/50 bg-card/30 py-14 text-muted-foreground">
          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
          Загружаем тарифы...
        </div>
      )}

      {!!error && (
        <Card className="border-destructive/40 bg-destructive/5">
          <CardHeader>
            <CardTitle className="text-destructive">Ошибка загрузки тарифов</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">{error}</CardContent>
        </Card>
      )}

      {!loading && !error && (
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          {plans.map((plan) => {
            const meta = PLAN_META[plan.key] ?? PLAN_META.FREE;
            const Icon = meta.icon;
            const isFeatured = plan.key === "PRO";
            return (
              <motion.div key={plan.key} initial="hidden" animate="show" variants={fade}>
                <Card
                  className={cn(
                    "relative flex h-full flex-col border bg-card/40 backdrop-blur-sm",
                    isFeatured && "border-amber-400/50 ring-1 ring-amber-400/20",
                  )}
                >
                  {isFeatured && (
                    <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-amber-400 text-black">
                      Рекомендуем
                    </Badge>
                  )}
                  <CardHeader>
                    <div className="flex items-center gap-2">
                      <Icon className={cn("h-5 w-5", meta.accent)} />
                      <CardTitle className="text-base">{plan.name}</CardTitle>
                    </div>
                    <p className="pt-1 text-2xl font-semibold">{fmtPrice(plan, billingCycle)}</p>
                    {billingCycle === "yearly" &&
                      plan.price_rub > 0 &&
                      plan.key !== "ENTERPRISE" && (
                        <p className="text-xs text-muted-foreground">
                          Эквивалент {Math.round((plan.price_rub * 10 * 100) / 12) / 100} ₽/мес
                        </p>
                      )}
                  </CardHeader>

                  <CardContent className="flex-1 space-y-2">
                    {plan.features.slice(0, 5).map((item) => (
                      <div
                        key={item}
                        className="flex items-start gap-2 text-sm text-muted-foreground"
                      >
                        <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
                        <span>{item}</span>
                      </div>
                    ))}
                  </CardContent>

                  <CardFooter>
                    {plan.key === "ENTERPRISE" ? (
                      <Button asChild className="w-full" variant="outline">
                        <a href="mailto:sales@cursa.app">Связаться с sales</a>
                      </Button>
                    ) : (
                      <Button
                        asChild
                        className="w-full"
                        variant={isFeatured ? "default" : "outline"}
                      >
                        <Link
                          to={`/billing?plan=${encodeURIComponent(plan.key)}&cycle=${encodeURIComponent(billingCycle)}`}
                        >
                          Выбрать тариф
                        </Link>
                      </Button>
                    )}
                  </CardFooter>
                </Card>
              </motion.div>
            );
          })}
        </section>
      )}

      {!loading && !error && plans.length > 0 && (
        <Card className="border-border/60 bg-card/30">
          <CardHeader>
            <CardTitle className="text-lg">Сравнение ключевых лимитов</CardTitle>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-sm">
              <thead>
                <tr className="text-left text-muted-foreground">
                  <th className="py-2 pr-3 font-medium">Параметр</th>
                  {plans.map((plan) => (
                    <th key={plan.key} className="py-2 px-3 font-medium">
                      {plan.name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {matrixRows.map((row, idx) => (
                  <tr key={row.key} className={idx % 2 === 0 ? "bg-muted/20" : ""}>
                    <td className="py-2 pr-3 text-muted-foreground">{row.label}</td>
                    {plans.map((plan) => {
                      const value = plan.limits[row.key as keyof typeof plan.limits] as number;
                      return (
                        <td key={plan.key + row.key} className="py-2 px-3 font-medium">
                          {renderLimit(value)}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>

            <Separator className="my-4" />
            <p className="text-xs text-muted-foreground">
              Поддержка API, пакетная обработка и автоисправление доступны на старших тарифах.
            </p>
          </CardContent>
        </Card>
      )}
    </AppPageLayout>
  );
};

export default PricingPage;
