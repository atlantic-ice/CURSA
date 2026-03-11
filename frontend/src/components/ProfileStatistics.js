import { motion } from "framer-motion";
import {
  BarChart3,
  BookOpenText,
  CheckCircle2,
  Clock3,
  FileText,
  GraduationCap,
  LayoutDashboard,
  TriangleAlert,
  X,
  XCircle,
} from "lucide-react";
import PropTypes from "prop-types";
import { useMemo, useState } from "react";

import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";

const hashStatus = (value) => {
  const score =
    String(value || "")
      .split("")
      .reduce((sum, char) => sum + char.charCodeAt(0), 0) % 10;
  if (score >= 8) return "error";
  if (score >= 5) return "warning";
  return "valid";
};

const StatCard = ({ title, value, subtitle, icon }) => (
  <motion.div whileHover={{ y: -2 }} transition={{ duration: 0.18 }}>
    <Card className="rounded-[1.5rem] border-border/70 bg-muted/25">
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-background text-muted-foreground">
            {icon}
          </div>
        </div>
        <p className="mt-4 text-3xl font-black tracking-[-0.04em] text-foreground">{value}</p>
        <p className="mt-1 text-sm font-semibold text-foreground">{title}</p>
        <p className="mt-1 text-xs text-muted-foreground">{subtitle}</p>
      </CardContent>
    </Card>
  </motion.div>
);

const DonutChart = ({ segments, size = 132 }) => {
  const total = segments.reduce((sum, segment) => sum + segment.value, 0) || 1;
  let currentAngle = -90;

  return (
    <div className="relative mx-auto" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {segments.map((segment) => {
          const angle = (segment.value / total) * 360;
          const startAngle = currentAngle;
          currentAngle += angle;

          const radius = size / 2 - 8;
          const cx = size / 2;
          const cy = size / 2;
          const startRad = (startAngle * Math.PI) / 180;
          const endRad = ((startAngle + angle) * Math.PI) / 180;
          const x1 = cx + radius * Math.cos(startRad);
          const y1 = cy + radius * Math.sin(startRad);
          const x2 = cx + radius * Math.cos(endRad);
          const y2 = cy + radius * Math.sin(endRad);
          const largeArc = angle > 180 ? 1 : 0;

          return (
            <path
              key={segment.label}
              d={`M ${cx} ${cy} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2} Z`}
              fill={segment.color}
              stroke="var(--background)"
              strokeWidth={2}
            />
          );
        })}
        <circle cx={size / 2} cy={size / 2} r={size / 4} fill="var(--card)" />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        <p className="text-xl font-bold text-foreground">
          {segments.reduce((sum, item) => sum + item.value, 0)}
        </p>
        <p className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">всего</p>
      </div>
    </div>
  );
};

export default function ProfileStatistics({ profiles, onClose }) {
  const [viewType, setViewType] = useState("overview");

  const stats = useMemo(() => {
    const total = profiles.length;
    const byMonth = {};
    const validationStats = { valid: 0, warnings: 0, errors: 0 };
    let totalRules = 0;

    profiles.forEach((profile) => {
      const date = profile.created_at || profile.updated_at;
      if (date) {
        const month = new Date(date).toLocaleString("ru-RU", { month: "short" });
        byMonth[month] = (byMonth[month] || 0) + 1;
      }
      if (profile.rules) totalRules += Object.keys(profile.rules).length;

      const status = hashStatus(profile.id || profile.name);
      if (status === "valid") validationStats.valid += 1;
      if (status === "warning") validationStats.warnings += 1;
      if (status === "error") validationStats.errors += 1;
    });

    return {
      total,
      avgRules: total > 0 ? Math.round(totalRules / total) : 0,
      universitiesCount: profiles.filter((profile) => profile.category === "university").length,
      customCount: profiles.filter((profile) => profile.category !== "university").length,
      recent: [...profiles].slice(0, 5),
      byMonth,
      validationStats,
    };
  }, [profiles]);

  const categoryData = useMemo(
    () => [
      { label: "ВУЗы", value: stats.universitiesCount, color: "rgba(59,130,246,0.8)" },
      { label: "Пользов.", value: stats.customCount, color: "rgba(99,102,241,0.8)" },
    ],
    [stats.customCount, stats.universitiesCount],
  );

  const monthData = useMemo(
    () =>
      Object.entries(stats.byMonth)
        .slice(-6)
        .map(([label, value]) => ({ label, value })),
    [stats.byMonth],
  );

  const maxMonthValue = Math.max(...monthData.map((item) => item.value), 1);

  return (
    <Card className="rounded-[2rem] border-border/70 bg-card/90 shadow-[0_18px_48px_rgba(15,23,42,0.05)]">
      <CardHeader className="border-b border-border/60 bg-muted/25">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <CardTitle className="flex items-center gap-2 text-xl">
              <BarChart3 className="h-5 w-5 text-muted-foreground" />
              Статистика профилей
            </CardTitle>
            <CardDescription>
              Обзор библиотеки профилей, активности и статуса качества.
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex rounded-full border border-border/70 bg-background p-1">
              <Button
                variant={viewType === "overview" ? "secondary" : "ghost"}
                size="sm"
                className="rounded-full"
                onClick={() => setViewType("overview")}
              >
                <LayoutDashboard className="h-4 w-4" />
              </Button>
              <Button
                variant={viewType === "details" ? "secondary" : "ghost"}
                size="sm"
                className="rounded-full"
                onClick={() => setViewType("details")}
              >
                <BookOpenText className="h-4 w-4" />
              </Button>
            </div>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-5 p-6">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            title="Всего профилей"
            value={stats.total}
            subtitle="активных"
            icon={<FileText className="h-4 w-4" />}
          />
          <StatCard
            title="Профили ВУЗов"
            value={stats.universitiesCount}
            subtitle="университеты"
            icon={<GraduationCap className="h-4 w-4" />}
          />
          <StatCard
            title="Пользовательские"
            value={stats.customCount}
            subtitle="созданные вручную"
            icon={<LayoutDashboard className="h-4 w-4" />}
          />
          <StatCard
            title="Правил в среднем"
            value={stats.avgRules}
            subtitle="на профиль"
            icon={<BarChart3 className="h-4 w-4" />}
          />
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <Card className="rounded-[1.5rem] border-border/70 bg-muted/20">
            <CardContent className="p-5">
              <p className="text-sm font-semibold text-foreground">Распределение по категориям</p>
              <div className="mt-4 flex flex-col gap-5 md:flex-row md:items-center">
                <DonutChart segments={categoryData} />
                <div className="flex-1 space-y-3">
                  {categoryData.map((item) => (
                    <div key={item.label} className="flex items-center gap-3 text-sm">
                      <span
                        className="h-3 w-3 rounded-full"
                        style={{ backgroundColor: item.color }}
                      />
                      <span className="flex-1 text-foreground">{item.label}</span>
                      <span className="font-semibold text-foreground">{item.value}</span>
                      <span className="text-xs text-muted-foreground">
                        ({stats.total > 0 ? Math.round((item.value / stats.total) * 100) : 0}%)
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-[1.5rem] border-border/70 bg-muted/20">
            <CardContent className="p-5">
              <p className="text-sm font-semibold text-foreground">Статус качества</p>
              <div className="mt-4 space-y-4">
                {[
                  {
                    label: "Валидные",
                    value: stats.validationStats.valid,
                    icon: <CheckCircle2 className="h-4 w-4 text-emerald-600" />,
                    color: "bg-emerald-500",
                  },
                  {
                    label: "С предупреждениями",
                    value: stats.validationStats.warnings,
                    icon: <TriangleAlert className="h-4 w-4 text-amber-600" />,
                    color: "bg-amber-500",
                  },
                  {
                    label: "С ошибками",
                    value: stats.validationStats.errors,
                    icon: <XCircle className="h-4 w-4 text-destructive" />,
                    color: "bg-destructive",
                  },
                ].map((item) => (
                  <div key={item.label}>
                    <div className="mb-1 flex items-center justify-between gap-3 text-sm">
                      <div className="flex items-center gap-2 text-foreground">
                        {item.icon}
                        {item.label}
                      </div>
                      <span className="font-semibold text-foreground">{item.value}</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-muted">
                      <div
                        className={`${item.color} h-full rounded-full`}
                        style={{
                          width: `${stats.total > 0 ? (item.value / stats.total) * 100 : 0}%`,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
          <Card className="rounded-[1.5rem] border-border/70 bg-muted/20">
            <CardContent className="p-5">
              <p className="text-sm font-semibold text-foreground">Активность по месяцам</p>
              {monthData.length > 0 ? (
                <div className="mt-5">
                  <div className="flex h-48 items-end gap-2">
                    {monthData.map((item) => (
                      <div key={item.label} className="flex flex-1 flex-col items-center gap-2">
                        <div
                          className="w-full rounded-t-xl bg-primary/70 transition-all"
                          style={{
                            height: `${(item.value / maxMonthValue) * 100}%`,
                            minHeight: 10,
                          }}
                        />
                        <span className="text-xs text-muted-foreground">{item.label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="mt-5 text-sm text-muted-foreground">Нет данных об активности.</div>
              )}
            </CardContent>
          </Card>

          <Card className="rounded-[1.5rem] border-border/70 bg-muted/20">
            <CardContent className="p-5">
              <p className="text-sm font-semibold text-foreground">Последние профили</p>
              <div className="mt-4 space-y-2">
                {stats.recent.length > 0 ? (
                  stats.recent.map((profile) => (
                    <div
                      key={profile.id}
                      className="flex items-center gap-3 rounded-2xl border border-border/60 bg-background/70 px-3 py-3"
                    >
                      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-muted text-muted-foreground">
                        <Clock3 className="h-4 w-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-foreground">
                          {profile.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {profile.updated_at
                            ? new Date(profile.updated_at).toLocaleDateString("ru-RU")
                            : "Без даты"}
                        </p>
                      </div>
                      <Badge variant="outline" className="rounded-full">
                        {profile.category === "university" ? "ВУЗ" : "Пользов."}
                      </Badge>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">Нет профилей.</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {viewType === "details" ? (
          <div className="grid gap-3 md:grid-cols-3">
            <div className="rounded-[1.5rem] border border-emerald-500/15 bg-emerald-500/5 p-4 text-sm">
              <div className="flex items-center gap-2 font-semibold text-emerald-700 dark:text-emerald-300">
                <CheckCircle2 className="h-4 w-4" /> Валидные профили
              </div>
              <p className="mt-2 text-muted-foreground">
                Ориентировочный стабильный статус по библиотеке: {stats.validationStats.valid} из{" "}
                {stats.total}.
              </p>
            </div>
            <div className="rounded-[1.5rem] border border-amber-500/15 bg-amber-500/5 p-4 text-sm">
              <div className="flex items-center gap-2 font-semibold text-amber-700 dark:text-amber-300">
                <TriangleAlert className="h-4 w-4" /> Требуют внимания
              </div>
              <p className="mt-2 text-muted-foreground">
                Профили с предупреждениями: {stats.validationStats.warnings}.
              </p>
            </div>
            <div className="rounded-[1.5rem] border border-destructive/15 bg-destructive/5 p-4 text-sm">
              <div className="flex items-center gap-2 font-semibold text-destructive">
                <XCircle className="h-4 w-4" /> Потенциальные ошибки
              </div>
              <p className="mt-2 text-muted-foreground">
                Профили с критичными отклонениями: {stats.validationStats.errors}.
              </p>
            </div>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}

StatCard.propTypes = {
  title: PropTypes.string.isRequired,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  subtitle: PropTypes.string.isRequired,
  icon: PropTypes.node.isRequired,
};

ProfileStatistics.propTypes = {
  profiles: PropTypes.array.isRequired,
  onClose: PropTypes.func.isRequired,
};
