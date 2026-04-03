import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown, Download, FileText, SlidersHorizontal } from "lucide-react";
import { FC, useContext, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import { CheckHistoryContext } from "../App";
import AppPageLayout from "../components/layout/AppPageLayout";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { SearchField } from "../components/ui/search-field";
import { cn } from "../lib/utils";
import type { HistoryItem } from "../types";

interface ReportsPageProps {
  className?: string;
}

interface ReportsHistoryContext {
  history: HistoryItem[];
}

type SortType = "date-desc" | "date-asc" | "name-asc" | "name-desc";
type ScoreFilterType = "all" | "good" | "bad";

const isLocal =
  typeof window !== "undefined" &&
  (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1");

const API_BASE = isLocal
  ? "http://localhost:5000"
  : process.env.REACT_APP_API_BASE || "https://cursa.onrender.com";

const SORT_LABELS: Record<SortType, string> = {
  "date-desc": "Сначала новые",
  "date-asc": "Сначала старые",
  "name-asc": "Имя А→Я",
  "name-desc": "Имя Я→А",
};

const fadeUp = {
  hidden: { opacity: 0, y: 18 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: [0.22, 1, 0.36, 1] } },
};

const getItemKey = (item: HistoryItem, index = 0): string => {
  return String(
    item.id ?? `${item.fileName || item.document_name || "report"}-${item.timestamp || index}`,
  );
};

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

const getCorrectedPath = (item: HistoryItem): string | undefined => {
  return item.correctedFilePath || item.corrected_file_path || item.reportData?.corrected_file_path;
};

const getReadinessStatus = (item: HistoryItem): string => {
  return item.reportData?.graduation_readiness?.status || "unknown";
};

const getReadinessLabel = (item: HistoryItem): string => {
  const status = getReadinessStatus(item);
  if (status === "ready") return "Готово к сдаче";
  if (status === "almost_ready") return "Почти готово";
  if (status === "needs_revision") return "Нужна доработка";
  return "Оценка недоступна";
};

const getQualityGatePassed = (item: HistoryItem): boolean | null => {
  if (typeof item.reportData?.quality_gate_passed === "boolean") {
    return item.reportData.quality_gate_passed;
  }
  return null;
};

const hasFallback = (item: HistoryItem): boolean => {
  return Boolean(item.reportData?.quality_metrics?.fallback_applied);
};

const getProfileLabel = (item: HistoryItem): string => {
  return (
    item.profileName ||
    item.profileId ||
    item.profile_name ||
    item.reportData?.check_results?.profile?.name ||
    "Базовый профиль"
  );
};

const downloadDocument = (filePath: string, originalName?: string): void => {
  if (!filePath) {
    return;
  }

  const safeName =
    originalName && originalName.endsWith(".docx")
      ? originalName
      : `${originalName || "document"}.docx`;

  if (filePath.indexOf("/") === -1 && filePath.indexOf("\\") === -1) {
    window.location.href = `${API_BASE}/corrections/${encodeURIComponent(filePath)}`;
    return;
  }

  window.location.href = `${API_BASE}/api/document/download-corrected?path=${encodeURIComponent(filePath)}&filename=${encodeURIComponent(safeName)}`;
};

const ReportsPage: FC<ReportsPageProps> = ({ className = "" }) => {
  const navigate = useNavigate();
  const { history } = useContext(CheckHistoryContext) as ReportsHistoryContext;

  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<SortType>("date-desc");
  const [scoreFilter, setScoreFilter] = useState<ScoreFilterType>("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const totalReports = history.length;
  const withCorrections = useMemo(
    () => history.filter((item) => Boolean(getCorrectedPath(item))).length,
    [history],
  );
  const averageScore = useMemo(() => {
    const scored = history
      .map(getScoreValue)
      .filter((score): score is number => score != null && Number.isFinite(score));
    if (scored.length === 0) {
      return 0;
    }
    return scored.reduce((sum, score) => sum + score, 0) / scored.length;
  }, [history]);
  const readinessStats = useMemo(() => {
    return history.reduce(
      (stats, item) => {
        const status = getReadinessStatus(item);
        if (status === "ready") {
          stats.ready += 1;
        } else if (status === "almost_ready") {
          stats.almostReady += 1;
        } else if (status === "needs_revision") {
          stats.needsRevision += 1;
        } else {
          stats.unknown += 1;
        }

        const gatePassed = getQualityGatePassed(item);
        if (gatePassed === true) {
          stats.gatePassed += 1;
          stats.gateKnown += 1;
        } else if (gatePassed === false) {
          stats.gateKnown += 1;
        }

        if (hasFallback(item)) {
          stats.fallback += 1;
        }

        return stats;
      },
      {
        ready: 0,
        almostReady: 0,
        needsRevision: 0,
        unknown: 0,
        gatePassed: 0,
        gateKnown: 0,
        fallback: 0,
      },
    );
  }, [history]);
  const graduationReadyCount = readinessStats.ready + readinessStats.almostReady;
  const gatePassRate =
    readinessStats.gateKnown > 0
      ? Math.round((readinessStats.gatePassed / readinessStats.gateKnown) * 100)
      : null;

  const cycleSort = (): void => {
    setSort((previous) =>
      previous === "date-desc"
        ? "date-asc"
        : previous === "date-asc"
          ? "name-asc"
          : previous === "name-asc"
            ? "name-desc"
            : "date-desc",
    );
  };

  const items = useMemo(() => {
    let filtered = query
      ? history.filter((item) =>
          (item.fileName || item.document_name || "").toLowerCase().includes(query.toLowerCase()),
        )
      : history;

    if (scoreFilter === "good") {
      filtered = filtered.filter((item) => (getScoreValue(item) ?? 0) >= 4);
    }
    if (scoreFilter === "bad") {
      filtered = filtered.filter((item) => {
        const score = getScoreValue(item);
        return score != null && score <= 2;
      });
    }

    return [...filtered].sort((left, right) => {
      if (sort === "date-desc") {
        return getTimestampValue(right) - getTimestampValue(left);
      }
      if (sort === "date-asc") {
        return getTimestampValue(left) - getTimestampValue(right);
      }

      const compare = (left.fileName || left.document_name || "").localeCompare(
        right.fileName || right.document_name || "",
      );
      return sort === "name-asc" ? compare : -compare;
    });
  }, [history, query, scoreFilter, sort]);

  const exportCSV = (): void => {
    const rows: Array<Array<string | number>> = [
      ["Файл", "Дата", "Проблем", "Балл", "Исправлен", "Quality Gate", "Готовность", "Fallback"],
      ...history.map((item) => {
        const issues = getIssuesCount(item);
        const score = getScoreValue(item) ?? "";
        const corrected = getCorrectedPath(item) ? "Да" : "Нет";
        const gatePassed = getQualityGatePassed(item);
        const gateLabel = gatePassed == null ? "Нет данных" : gatePassed ? "Пройден" : "Не пройден";
        const readinessLabel = getReadinessLabel(item);
        const fallbackLabel = hasFallback(item) ? "Да" : "Нет";
        const date = new Date(getTimestampValue(item)).toLocaleString("ru-RU");

        return [
          `"${(item.fileName || item.document_name || "").replace(/"/g, '""')}"`,
          `"${date}"`,
          issues,
          score,
          corrected,
          gateLabel,
          readinessLabel,
          fallbackLabel,
        ];
      }),
    ];

    const csv = "\ufeff" + rows.map((row) => row.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `cursa_reports_${new Date().toISOString().split("T")[0]}.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const exportVkrReadinessSummary = (): void => {
    const now = new Date();
    const dateLabel = now.toLocaleString("ru-RU");
    const gateRateLabel = gatePassRate == null ? "нет данных" : `${gatePassRate}%`;
    const total = totalReports;

    const needsRevisionItems = history
      .filter((item) => getReadinessStatus(item) === "needs_revision")
      .sort((left, right) => getIssuesCount(right) - getIssuesCount(left))
      .slice(0, 20);

    const topSection =
      needsRevisionItems.length === 0
        ? "- Документов со статусом `needs_revision` не найдено."
        : needsRevisionItems
            .map((item, index) => {
              const fileName = item.fileName || item.document_name || "Без названия";
              const issues = getIssuesCount(item);
              const score = getScoreValue(item);
              const scoreLabel = score != null && Number.isFinite(score) ? score.toFixed(1) : "-";
              return `${index + 1}. ${fileName} | проблемы: ${issues} | балл: ${scoreLabel}`;
            })
            .join("\n");

    const markdown = [
      "# VKR Readiness Summary",
      "",
      `Сформировано: ${dateLabel}`,
      "",
      "## Агрегированные метрики",
      "",
      `- Всего отчетов: ${total}`,
      `- Готово к сдаче (ready + almost_ready): ${graduationReadyCount}`,
      `- Ready: ${readinessStats.ready}`,
      `- Almost ready: ${readinessStats.almostReady}`,
      `- Needs revision: ${readinessStats.needsRevision}`,
      `- Unknown: ${readinessStats.unknown}`,
      `- Quality gate passed: ${readinessStats.gatePassed}`,
      `- Quality gate pass rate: ${gateRateLabel}`,
      `- Fallback cases: ${readinessStats.fallback}`,
      "",
      "## Документы, требующие ручной доработки",
      "",
      topSection,
      "",
      "## Интерпретация для защиты",
      "",
      "- Метрика ready+almost_ready отражает оперативную готовность корпуса документов к финальной сдаче.",
      "- Quality gate pass rate демонстрирует устойчивость алгоритма автокоррекции без деградации результата.",
      "- Fallback cases указывают на сложные документы, где система включила безопасный режим без ухудшения.",
      "",
    ].join("\n");

    const blob = new Blob([markdown], { type: "text/markdown;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `VKR_READINESS_SUMMARY_${now.toISOString().split("T")[0]}.md`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  return (
    <AppPageLayout
      className={className}
      title="Отчёты"
      actions={
        <>
          <Button
            size="sm"
            variant="outline"
            className="rounded-xl"
            disabled={history.length === 0}
            onClick={exportVkrReadinessSummary}
          >
            <FileText className="size-4" />
            VKR Summary
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="rounded-xl"
            disabled={history.length === 0}
            onClick={exportCSV}
          >
            <Download className="size-4" />
            CSV
          </Button>
        </>
      }
    >
      <motion.section initial="hidden" animate="show" variants={fadeUp} className="space-y-4">
        <div className="grid gap-4 md:grid-cols-3 xl:grid-cols-6">
          <Card className="rounded-[28px] border-border bg-card text-card-foreground shadow-sm">
            <CardContent className="p-6">
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                Всего отчётов
              </p>
              <p className="mt-2 text-4xl font-semibold tracking-[-0.05em] text-foreground">
                {totalReports}
              </p>
            </CardContent>
          </Card>

          <Card className="rounded-[28px] border-border bg-card text-card-foreground shadow-sm">
            <CardContent className="p-6">
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                С исправлениями
              </p>
              <p className="mt-2 text-4xl font-semibold tracking-[-0.05em] text-foreground">
                {withCorrections}
              </p>
            </CardContent>
          </Card>

          <Card className="rounded-[28px] border-border bg-card text-card-foreground shadow-sm">
            <CardContent className="p-6">
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                Средний балл
              </p>
              <p className="mt-2 text-4xl font-semibold tracking-[-0.05em] text-foreground">
                {averageScore > 0 ? averageScore.toFixed(1) : "0.0"}
              </p>
            </CardContent>
          </Card>

          <Card className="rounded-[28px] border-border bg-card text-card-foreground shadow-sm">
            <CardContent className="p-6">
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                Готово/почти готово
              </p>
              <p className="mt-2 text-4xl font-semibold tracking-[-0.05em] text-foreground">
                {graduationReadyCount}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Ready: {readinessStats.ready} · Almost: {readinessStats.almostReady}
              </p>
            </CardContent>
          </Card>

          <Card className="rounded-[28px] border-border bg-card text-card-foreground shadow-sm">
            <CardContent className="p-6">
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                Quality gate
              </p>
              <p className="mt-2 text-4xl font-semibold tracking-[-0.05em] text-foreground">
                {readinessStats.gatePassed}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                {gatePassRate == null
                  ? "Нет достаточных данных"
                  : `${gatePassRate}% от документов с метрикой`}
              </p>
            </CardContent>
          </Card>

          <Card className="rounded-[28px] border-border bg-card text-card-foreground shadow-sm">
            <CardContent className="p-6">
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                Fallback
              </p>
              <p className="mt-2 text-4xl font-semibold tracking-[-0.05em] text-foreground">
                {readinessStats.fallback}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Требуют ручной проверки: {readinessStats.needsRevision}
              </p>
            </CardContent>
          </Card>
        </div>

        <Card className="rounded-[30px] border-border bg-card text-card-foreground shadow-sm">
          <CardContent className="flex flex-col gap-3 p-4 md:flex-row md:items-center md:p-5">
            <SearchField
              value={query}
              onChange={setQuery}
              onSearch={() => undefined}
              placeholder="Поиск по названию"
              buttonLabel="Поиск"
              className="min-w-0 flex-1"
              inputClassName="h-11 rounded-2xl border-border bg-card text-foreground placeholder:text-muted-foreground"
              buttonClassName="h-11 rounded-2xl px-4"
            />

            <div className="flex flex-wrap gap-2">
              <Button variant="outline" className="rounded-2xl" onClick={cycleSort}>
                <SlidersHorizontal className="size-4" />
                {SORT_LABELS[sort]}
              </Button>
              {[
                { key: "all" as const, label: "Все" },
                { key: "good" as const, label: "Балл ≥ 4" },
                { key: "bad" as const, label: "Балл ≤ 2" },
              ].map((filter) => (
                <Button
                  key={filter.key}
                  variant={scoreFilter === filter.key ? "default" : "outline"}
                  className="rounded-2xl"
                  onClick={() => setScoreFilter(filter.key)}
                >
                  {filter.label}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.section>

      <motion.section
        initial="hidden"
        animate="show"
        variants={fadeUp}
        transition={{ delay: 0.06 }}
      >
        <Card className="rounded-[30px] border-border bg-card text-card-foreground shadow-sm">
          <CardHeader className="p-6 pb-4">
            <CardTitle className="text-xl">Список отчётов</CardTitle>
            <CardDescription>
              Нажмите на карточку, чтобы раскрыть метаданные и действия для конкретного документа.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4 p-6 pt-0">
            {history.length === 0 ? (
              <div className="rounded-[26px] border border-dashed border-border bg-card px-6 py-16 text-center">
                <FileText className="mx-auto size-10 text-muted-foreground" />
                <p className="mt-4 text-base font-medium text-foreground">Нет отчётов</p>
                <p className="mt-2 text-sm text-muted-foreground">
                  После первой проверки список заполнится автоматически.
                </p>
              </div>
            ) : items.length === 0 ? (
              <div className="rounded-[26px] border border-dashed border-border bg-card px-6 py-16 text-center text-sm text-muted-foreground">
                По текущим фильтрам ничего не найдено.
              </div>
            ) : (
              items.map((item, index) => {
                const itemKey = getItemKey(item, index);
                const correctedPath = getCorrectedPath(item);
                const issuesCount = getIssuesCount(item);
                const score = getScoreValue(item);
                const readinessLabel = getReadinessLabel(item);
                const gatePassed = getQualityGatePassed(item);
                const fallbackApplied = hasFallback(item);
                const isExpanded = expandedId === itemKey;

                return (
                  <div
                    key={itemKey}
                    className="rounded-[26px] border border-border bg-card transition-colors hover:bg-muted/20"
                  >
                    <button
                      type="button"
                      onClick={() => setExpandedId(isExpanded ? null : itemKey)}
                      className="flex w-full items-start justify-between gap-4 px-4 py-4 text-left md:px-5 md:py-5"
                    >
                      <div className="min-w-0 space-y-3">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="truncate text-base font-semibold text-foreground">
                            {item.fileName || item.document_name || "Без названия"}
                          </p>
                          <Badge
                            variant="outline"
                            className="rounded-full px-2.5 py-1 text-[11px] uppercase tracking-[0.18em]"
                          >
                            {getProfileLabel(item)}
                          </Badge>
                        </div>

                        <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                          <span>{new Date(getTimestampValue(item)).toLocaleString("ru-RU")}</span>
                          <span>•</span>
                          <span>{issuesCount} замечаний</span>
                          {score != null && Number.isFinite(score) && (
                            <>
                              <span>•</span>
                              <span>Балл {score.toFixed(1)}</span>
                            </>
                          )}
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                          <Badge variant="outline" className="rounded-full px-3 py-1 text-muted-foreground">
                            {readinessLabel}
                          </Badge>

                          {gatePassed != null ? (
                            <Badge
                              className={cn(
                                "rounded-full px-3 py-1",
                                gatePassed
                                  ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-300"
                                  : "bg-red-500/15 text-red-600 dark:text-red-300",
                              )}
                            >
                              Quality gate: {gatePassed ? "OK" : "Fail"}
                            </Badge>
                          ) : null}

                          {fallbackApplied ? (
                            <Badge className="rounded-full bg-amber-500/15 px-3 py-1 text-amber-600 dark:text-amber-300">
                              Fallback
                            </Badge>
                          ) : null}

                          {correctedPath ? (
                            <Badge className="rounded-full bg-emerald-500/15 px-3 py-1 text-emerald-600 dark:text-emerald-300">
                              Исправленный DOCX готов
                            </Badge>
                          ) : (
                            <Badge
                              variant="outline"
                              className="rounded-full px-3 py-1 text-muted-foreground"
                            >
                              Только отчёт
                            </Badge>
                          )}

                          {issuesCount > 0 ? (
                            <Badge
                              variant="outline"
                              className="rounded-full border-amber-500/25 bg-amber-500/10 px-3 py-1 text-amber-600 dark:text-amber-300"
                            >
                              Требует внимания
                            </Badge>
                          ) : (
                            <Badge
                              variant="outline"
                              className="rounded-full border-emerald-500/25 bg-emerald-500/10 px-3 py-1 text-emerald-600 dark:text-emerald-300"
                            >
                              Замечаний нет
                            </Badge>
                          )}
                        </div>
                      </div>

                      <ChevronDown
                        className={cn(
                          "mt-1 size-4 shrink-0 text-muted-foreground transition-transform",
                          isExpanded && "rotate-180",
                        )}
                      />
                    </button>

                    <AnimatePresence initial={false}>
                      {isExpanded && (
                        <motion.div
                          key={`expanded-${itemKey}`}
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
                          className="overflow-hidden"
                        >
                          <div className="grid gap-4 border-t border-border px-4 py-4 md:grid-cols-[120px_minmax(0,1fr)_auto] md:px-5 md:py-5">
                            <div className="rounded-2xl border border-border bg-card p-4 text-center">
                              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                                Оценка
                              </p>
                              <p className="mt-2 text-3xl font-semibold tracking-[-0.04em] text-foreground">
                                {score != null && Number.isFinite(score) ? score.toFixed(1) : "—"}
                              </p>
                            </div>

                            <div className="space-y-3 rounded-2xl border border-border bg-card p-4">
                              <div>
                                <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                                  Документ
                                </p>
                                <p className="mt-1 text-sm font-semibold text-foreground">
                                  {item.fileName || item.document_name || "Без названия"}
                                </p>
                              </div>

                              <div className="grid gap-3 md:grid-cols-2">
                                <div>
                                  <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                                    Дата проверки
                                  </p>
                                  <p className="mt-1 text-sm text-foreground">
                                    {new Date(getTimestampValue(item)).toLocaleString("ru-RU")}
                                  </p>
                                </div>
                                <div>
                                  <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                                    Профиль
                                  </p>
                                  <p className="mt-1 text-sm text-foreground">
                                    {getProfileLabel(item)}
                                  </p>
                                </div>
                                <div>
                                  <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                                    Готовность
                                  </p>
                                  <p className="mt-1 text-sm text-foreground">{readinessLabel}</p>
                                </div>
                                <div>
                                  <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                                    Quality gate
                                  </p>
                                  <p className="mt-1 text-sm text-foreground">
                                    {gatePassed == null
                                      ? "Нет данных"
                                      : gatePassed
                                        ? "Пройден"
                                        : "Не пройден"}
                                    {fallbackApplied ? " · fallback" : ""}
                                  </p>
                                </div>
                              </div>
                            </div>

                            <div className="flex flex-col gap-2 md:items-end">
                              <Button
                                variant="outline"
                                className="rounded-2xl"
                                onClick={() =>
                                  navigate("/report", {
                                    state: {
                                      reportData: item.reportData,
                                      fileName: item.fileName,
                                      profileId: item.profileId,
                                      profileName:
                                        item.profileName ||
                                        item.reportData?.check_results?.profile?.name,
                                    },
                                  })
                                }
                              >
                                Открыть отчёт
                              </Button>

                              {correctedPath && (
                                <Button
                                  variant="outline"
                                  className="rounded-2xl text-emerald-600 hover:text-emerald-600 dark:text-emerald-300 dark:hover:text-emerald-300"
                                  onClick={() =>
                                    downloadDocument(
                                      correctedPath,
                                      item.fileName || item.document_name,
                                    )
                                  }
                                >
                                  <Download className="size-4" />
                                  Скачать DOCX
                                </Button>
                              )}
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>
      </motion.section>
    </AppPageLayout>
  );
};

export default ReportsPage;
