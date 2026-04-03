import {
    ArrowRight,
    Files,
    ShieldCheck,
    SlidersHorizontal,
    Sparkles,
    TrendingUp,
} from "lucide-react";
import { FC, useContext, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis } from "recharts";

import { CheckHistoryContext } from "../App";
import { Badge } from "../components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import type { CheckHistoryContextType, HistoryItem } from "../types";

interface DashboardPageProps {
  className?: string;
}

interface ActivityPoint {
  dateKey: string;
  label: string;
  fullDate: string;
  count: number;
  trend: number;
}

const getTimestampValue = (item: HistoryItem): number => {
  const raw = item.timestamp ?? item.id ?? 0;
  if (typeof raw === "number") {
    return raw;
  }

  const parsed = Date.parse(String(raw));
  if (!Number.isNaN(parsed)) {
    return parsed;
  }

  const numeric = Number(raw);
  return Number.isNaN(numeric) ? 0 : numeric;
};

const getIssuesCount = (item: HistoryItem): number => {
  return (
    item.totalIssues ??
    item.issues_count ??
    item.reportData?.check_results?.total_issues_count ??
    item.validation_result?.summary?.total_issues ??
    0
  );
};

const getScoreValue = (item: HistoryItem): number | null => {
  const candidate = item.score ?? item.reportData?.score;
  if (candidate == null) {
    return null;
  }

  return typeof candidate === "number" ? candidate : Number(candidate);
};

const getProfileLabel = (item: HistoryItem): string => {
  return (
    item.profileName || item.profileId || item.profile_name || item.profile_id || "Базовый профиль"
  );
};

const formatScore = (value: number | null): string => {
  if (value == null || Number.isNaN(value)) {
    return "--";
  }

  return value.toFixed(1);
};

const getStatusLabel = (item: HistoryItem): string => {
  const issues = getIssuesCount(item);
  if (issues === 0) {
    return "Чисто";
  }

  if (issues <= 5) {
    return "Нужна проверка";
  }

  return "Требует внимания";
};

const DashboardPage: FC<DashboardPageProps> = ({ className = "" }) => {
  const navigate = useNavigate();
  const { history } = useContext(CheckHistoryContext) as CheckHistoryContextType;

  const sortedHistory = useMemo(() => {
    return [...history].sort((left, right) => getTimestampValue(right) - getTimestampValue(left));
  }, [history]);

  const recentFiles = useMemo(() => sortedHistory.slice(0, 5), [sortedHistory]);

  const weekActivity = useMemo<ActivityPoint[]>(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const bucket = new Map<string, ActivityPoint>();
    for (let offset = 6; offset >= 0; offset -= 1) {
      const current = new Date(today);
      current.setDate(today.getDate() - offset);
      const dateKey = current.toISOString().slice(0, 10);
      bucket.set(dateKey, {
        dateKey,
        label: current.toLocaleDateString("ru-RU", { weekday: "short" }).slice(0, 2).toUpperCase(),
        fullDate: current.toLocaleDateString("ru-RU", { day: "numeric", month: "long" }),
        count: 0,
        trend: 0,
      });
    }

    sortedHistory.forEach((item) => {
      const timestamp = getTimestampValue(item);
      if (!timestamp) {
        return;
      }

      const dateKey = new Date(timestamp).toISOString().slice(0, 10);
      const point = bucket.get(dateKey);
      if (point) {
        point.count += 1;
      }
    });

    const values = Array.from(bucket.values());

    return values.map((point, index) => {
      const windowStart = Math.max(0, index - 2);
      const windowSlice = values.slice(windowStart, index + 1);
      const rollingAverage =
        windowSlice.reduce((sum, item) => sum + item.count, 0) / Math.max(windowSlice.length, 1);

      return {
        ...point,
        trend: Number(rollingAverage.toFixed(2)),
      };
    });
  }, [sortedHistory]);

  const metrics = useMemo(() => {
    const totalChecks = sortedHistory.length;
    const correctedCount = sortedHistory.filter(
      (item) =>
        item.correctedFilePath || item.corrected_file_path || item.reportData?.corrected_file_path,
    ).length;
    const zeroIssuesCount = sortedHistory.filter((item) => getIssuesCount(item) === 0).length;
    const scoreValues = sortedHistory
      .map((item) => getScoreValue(item))
      .filter((value): value is number => value != null && !Number.isNaN(value));
    const averageScore = scoreValues.length
      ? scoreValues.reduce((sum, value) => sum + value, 0) / scoreValues.length
      : null;
    const topProfile = sortedHistory.reduce<Record<string, number>>((accumulator, item) => {
      const profile = getProfileLabel(item);
      accumulator[profile] = (accumulator[profile] || 0) + 1;
      return accumulator;
    }, {});
    const mostUsedProfile =
      Object.entries(topProfile).sort((left, right) => right[1] - left[1])[0]?.[0] || null;
    const weekTotal = weekActivity.reduce((sum, point) => sum + point.count, 0);

    return {
      totalChecks,
      correctedCount,
      zeroIssuesCount,
      averageScore,
      mostUsedProfile,
      weekTotal,
    };
  }, [sortedHistory, weekActivity]);

  const healthSummary = useMemo(() => {
    if (metrics.totalChecks === 0) {
      return "История ещё не накоплена. После первой проверки здесь появится срез по качеству и активности.";
    }

    if (metrics.zeroIssuesCount === metrics.totalChecks) {
      return "Поток выглядит стабильно: все проверенные документы прошли без замечаний.";
    }

    if (metrics.averageScore != null && metrics.averageScore >= 4) {
      return "Качество потока хорошее: большинство документов близки к требованиям выбранных профилей.";
    }

    return "Есть потенциал для улучшения: проверьте недавние отчёты и обновите профили, которые используются чаще всего.";
  }, [metrics]);

  return (
    <div className={className}>
      <div className="@container/main flex flex-1 flex-col gap-4 px-4 py-4 md:gap-6 md:px-6 md:py-6">
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {[
            {
              title: "Всего проверок",
              value: metrics.totalChecks,
              hint: "Накопленная история по документам",
              icon: <Files className="size-4" />,
            },
            {
              title: "За 7 дней",
              value: metrics.weekTotal,
              hint: "Текущая недельная активность",
              icon: <TrendingUp className="size-4" />,
            },
            {
              title: "Средняя оценка",
              value: formatScore(metrics.averageScore),
              hint: "Средний итоговый score по отчётам",
              icon: <ShieldCheck className="size-4" />,
            },
            {
              title: "Исправлено автоматически",
              value: metrics.correctedCount,
              hint: "Документы с автокоррекцией",
              icon: <SlidersHorizontal className="size-4" />,
            },
          ].map((item) => (
            <Card
              key={item.title}
              className="border-border bg-gradient-to-b from-card to-muted/30 text-card-foreground shadow-sm"
            >
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between gap-3">
                  <CardDescription>{item.title}</CardDescription>
                  <div className="flex size-9 items-center justify-center rounded-xl border border-border bg-card text-muted-foreground">
                    {item.icon}
                  </div>
                </div>
                <CardTitle className="text-3xl tracking-[-0.05em]">{item.value}</CardTitle>
              </CardHeader>
              <CardContent className="pt-0 text-sm text-muted-foreground">{item.hint}</CardContent>
            </Card>
          ))}
        </section>

        <section className="grid gap-4 xl:grid-cols-[1.5fr_1fr]">
          <Card className="border-border bg-card text-card-foreground shadow-sm">
            <CardHeader>
              <CardTitle className="text-xl tracking-[-0.04em]">Активность по дням</CardTitle>
              <CardDescription>
                Сколько документов запускалось в проверку за последние 7 дней.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="h-[280px] w-full rounded-xl border border-border bg-card p-2">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={weekActivity}
                    margin={{ top: 8, right: 8, left: -18, bottom: 0 }}
                  >
                    <defs>
                      <linearGradient id="activityGradientPrimary" x1="0" y1="0" x2="0" y2="1">
                        <stop
                          offset="0%"
                          stopColor="var(--dashboard-primary-line)"
                          stopOpacity={0.42}
                        />
                        <stop
                          offset="100%"
                          stopColor="var(--dashboard-primary-line)"
                          stopOpacity={0.05}
                        />
                      </linearGradient>
                      <linearGradient id="activityGradientSecondary" x1="0" y1="0" x2="0" y2="1">
                        <stop
                          offset="0%"
                          stopColor="var(--dashboard-secondary-line)"
                          stopOpacity={0.32}
                        />
                        <stop
                          offset="100%"
                          stopColor="var(--dashboard-secondary-line)"
                          stopOpacity={0.04}
                        />
                      </linearGradient>
                    </defs>
                    <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="oklch(var(--border))" />
                    <XAxis
                      dataKey="label"
                      tickLine={false}
                      axisLine={false}
                      tickMargin={10}
                      stroke="oklch(var(--muted-foreground))"
                    />
                    <Tooltip
                      cursor={{ stroke: "oklch(var(--border))", strokeWidth: 1 }}
                      contentStyle={{
                        borderRadius: 12,
                        border: "1px solid oklch(var(--border))",
                        background: "oklch(var(--card))",
                        color: "oklch(var(--card-foreground))",
                      }}
                      formatter={(value: number) => `${value} проверок`}
                      labelFormatter={(_, payload: any[]) => payload?.[0]?.payload?.fullDate || ""}
                    />
                    <Area
                      type="monotone"
                      dataKey="trend"
                      stroke="var(--dashboard-secondary-line)"
                      fill="url(#activityGradientSecondary)"
                      strokeWidth={2}
                      dot={false}
                      activeDot={{ r: 4 }}
                    />
                    <Area
                      type="monotone"
                      dataKey="count"
                      stroke="var(--dashboard-primary-line)"
                      fill="url(#activityGradientPrimary)"
                      strokeWidth={2.5}
                      dot={false}
                      activeDot={{ r: 5 }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border bg-card text-card-foreground shadow-sm">
            <CardHeader>
              <CardTitle className="text-xl tracking-[-0.04em]">Быстрые переходы</CardTitle>
              <CardDescription>Частые действия после проверки документа.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3 pt-0">
              {[
                {
                  title: "Открыть историю",
                  description: "Просмотреть предыдущие проверки и оценки.",
                  action: () => navigate("/history"),
                },
                {
                  title: "Перейти в отчёты",
                  description: "Открыть готовые результаты и выгрузки.",
                  action: () => navigate("/reports"),
                },
                {
                  title: "Управлять профилями",
                  description: "Редактировать правила вуза и шаблоны.",
                  action: () => navigate("/profiles"),
                },
              ].map((item) => (
                <button
                  key={item.title}
                  type="button"
                  onClick={item.action}
                  className="flex items-center justify-between gap-4 rounded-2xl border border-border bg-card px-4 py-4 text-left transition-colors hover:bg-muted/30"
                >
                  <div className="space-y-1">
                    <p className="text-sm font-semibold text-foreground">{item.title}</p>
                    <p className="text-sm text-muted-foreground">{item.description}</p>
                  </div>
                  <ArrowRight className="size-4 shrink-0 text-muted-foreground" />
                </button>
              ))}
            </CardContent>
          </Card>
        </section>

        <section className="grid gap-4 xl:grid-cols-[1.3fr_1fr]">
          <Card className="border-border bg-card text-card-foreground shadow-sm">
            <CardHeader>
              <CardTitle className="text-xl tracking-[-0.04em]">Последние документы</CardTitle>
              <CardDescription>Последние результаты из истории проверок CURSA.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 pt-0">
              {recentFiles.length > 0 ? (
                recentFiles.map((item, index) => (
                  <button
                    key={`${item.id}-${index}`}
                    type="button"
                    onClick={() =>
                      navigate("/report", {
                        state: {
                          reportData: item.reportData,
                          fileName: item.fileName || item.document_name,
                          profileId: item.profileId || item.profile_id,
                          profileName: item.profileName || item.profile_name,
                        },
                      })
                    }
                    className="flex w-full items-center justify-between gap-4 rounded-2xl border border-border bg-card px-4 py-4 text-left transition-colors hover:bg-muted/30"
                  >
                    <div className="min-w-0 space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="truncate text-sm font-semibold text-foreground">
                          {item.fileName || item.document_name || "Без названия"}
                        </p>
                        <Badge variant="outline" className="rounded-full px-2 py-0.5 text-[11px]">
                          {getStatusLabel(item)}
                        </Badge>
                      </div>
                      <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                        <span>{new Date(getTimestampValue(item)).toLocaleString("ru-RU")}</span>
                        <span>•</span>
                        <span>{getIssuesCount(item)} замечаний</span>
                        <span>•</span>
                        <span>{getProfileLabel(item)}</span>
                      </div>
                    </div>
                    <ArrowRight className="size-4 shrink-0 text-muted-foreground" />
                  </button>
                ))
              ) : (
                <div className="rounded-2xl border border-dashed border-border bg-card px-5 py-10 text-center text-sm text-muted-foreground">
                  История пока пуста. Первая проверка сразу появится здесь.
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-border bg-card text-card-foreground shadow-sm">
            <CardHeader>
              <CardTitle className="text-xl tracking-[-0.04em]">Качество потока</CardTitle>
              <CardDescription>Краткая сводка по текущему состоянию проверок.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 pt-0">
              <div className="rounded-2xl border border-border bg-card p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                  Документы без замечаний
                </p>
                <p className="mt-2 text-3xl font-semibold tracking-[-0.04em] text-foreground">
                  {metrics.zeroIssuesCount}
                </p>
              </div>
              <div className="rounded-2xl border border-border bg-card p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                  Средний score
                </p>
                <p className="mt-2 text-3xl font-semibold tracking-[-0.04em] text-foreground">
                  {formatScore(metrics.averageScore)}
                </p>
              </div>
              <div className="rounded-2xl border border-border bg-card p-4 text-sm text-muted-foreground">
                <div className="flex items-start gap-3">
                  <Sparkles className="mt-0.5 size-4 text-muted-foreground" />
                  <span>{healthSummary}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>
      </div>
    </div>
  );
};

export default DashboardPage;
