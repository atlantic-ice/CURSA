import { motion } from "framer-motion";
import {
  ArrowLeft,
  CheckCircle2,
  ChevronDown,
  Download,
  PauseCircle,
  PlayCircle,
  Printer,
  RotateCcw,
  Sparkles,
  Wand2,
} from "lucide-react";
import { FC, ReactNode, useCallback, useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import { documentsApi, getApiErrorMessage } from "../api/client";
import DocumentViewer from "../components/DocumentViewer";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Separator } from "../components/ui/separator";
import { cn } from "../lib/utils";
import type {
  BackendCheckIssue,
  IssueCategory,
  IssueSeverity,
  ValidationIssue,
  ValidationReport,
  ValidationResult,
} from "../types";
import "./ReportPage.css";

interface ReportPageProps {
  className?: string;
}

interface DocumentGrade {
  label: string;
  tone: "success" | "warning" | "danger";
  score: 1 | 2 | 3 | 4 | 5;
  description: string;
}

interface GroupedIssue extends ValidationIssue {
  count: number;
  locations: string[];
}

interface CorrectionSummary {
  passes_completed?: number;
  total_issues_found?: number;
  total_issues_fixed?: number;
  remaining_issues?: number;
  success_rate?: number;
  duration_seconds?: number;
  actions_by_phase?: Record<string, number>;
  actions_by_type?: Record<string, number>;
  verification_results?: Record<string, { passed?: boolean; message?: string }>;
}

interface ImprovementSummary {
  before_total_issues?: number;
  after_total_issues?: number;
  resolved_total_issues?: number;
  before_font_issues?: number;
  after_font_issues?: number;
  resolved_font_issues?: number;
}

type BackendIssueLike = BackendCheckIssue & { message?: string };

type ReportPayload = Partial<ValidationReport> & {
  id?: string;
  document_id?: string;
  document_name?: string;
  profile_id?: string;
  profile_name?: string;
  created_at?: string;
  validation_result?: ValidationResult;
  check_results?: {
    total_issues_count?: number;
    issues?: BackendIssueLike[];
    profile?: { name?: string };
  };
  corrected_file_path?: string;
  corrected_document_url?: string;
  original_preview_path?: string;
  document_token?: string;
  correction_success?: boolean;
  improvement?: ImprovementSummary;
  report?: CorrectionSummary;
  errors?: Array<Partial<ValidationIssue> & { message?: string }>;
};

interface LocationState {
  reportData: ReportPayload;
  fileName: string;
  profileId: string;
  profileName: string;
}

interface CorrectionPlaybackStep {
  key: string;
  title: string;
  description: string;
  accent: string;
  count: number;
}

interface ViewerHighlight {
  id: string;
  title: string;
  location: string;
  severity: ValidationIssue["severity"];
  category: ValidationIssue["category"];
  status: string;
}

interface ReportDocumentViewerProps {
  originalPath?: string | null;
  correctedPath?: string | null;
  highlightedIssues?: ViewerHighlight[];
  activePhaseTitle?: string | null;
  activePhaseAccent?: string;
  isProcessing?: boolean;
}

interface StatsCardProps {
  value: number;
  title: string;
  subtitle?: string;
  icon: ReactNode;
  toneClassName: string;
}

interface IssueItemProps {
  issue: GroupedIssue;
}

const ReportDocumentViewer = DocumentViewer as FC<ReportDocumentViewerProps>;

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.32, ease: [0.22, 1, 0.36, 1] } },
};

const severityToneClasses: Record<IssueSeverity, string> = {
  critical: "border-red-500/25 bg-red-500/10 text-red-600 dark:text-red-300",
  error: "border-red-500/25 bg-red-500/10 text-red-600 dark:text-red-300",
  warning: "border-amber-500/25 bg-amber-500/10 text-amber-600 dark:text-amber-300",
  info: "border-sky-500/25 bg-sky-500/10 text-sky-600 dark:text-sky-300",
};

const gradeToneClasses: Record<DocumentGrade["tone"], string> = {
  success: "border-emerald-500/20 bg-emerald-500/5",
  warning: "border-amber-500/20 bg-amber-500/5",
  danger: "border-red-500/20 bg-red-500/5",
};

const playbackPhaseCategories: Record<string, ValidationIssue["category"][]> = {
  structure: ["structure", "headings", "bibliography", "tables", "images", "formulas"],
  styles: ["font", "typography", "headings"],
  formatting: ["spacing", "margins", "pagination", "formatting"],
  xml_deep: ["formatting", "typography", "tables", "images"],
  verification: [],
};

const correctionPhaseMeta: Record<string, Omit<CorrectionPlaybackStep, "count">> = {
  structure: {
    key: "structure",
    title: "Структура",
    description: "Выравниваем порядок разделов, заголовков и важных блоков.",
    accent: "#38bdf8",
  },
  styles: {
    key: "styles",
    title: "Стили",
    description: "Приводим шрифты, начертания и текстовую систему к профилю.",
    accent: "#8b5cf6",
  },
  formatting: {
    key: "formatting",
    title: "Форматирование",
    description: "Исправляем интервалы, поля, выравнивание и абзацную сетку.",
    accent: "#f59e0b",
  },
  xml_deep: {
    key: "xml_deep",
    title: "Глубокая правка",
    description: "Дорабатываем низкоуровневые DOCX-настройки, недоступные в редакторе.",
    accent: "#14b8a6",
  },
  verification: {
    key: "verification",
    title: "Верификация",
    description: "Повторно проверяем документ и фиксируем результат.",
    accent: "#22c55e",
  },
};

const verificationLabels: Record<string, string> = {
  fonts: "Шрифты",
  spacing: "Интервалы",
  margins: "Поля",
};

const playbackAccentClasses: Record<string, string> = {
  structure: "report-playback-chip--structure",
  styles: "report-playback-chip--styles",
  formatting: "report-playback-chip--formatting",
  xml_deep: "report-playback-chip--xml-deep",
  verification: "report-playback-chip--verification",
};

const AnimatedNumber: FC<{ value: number }> = ({ value }) => {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    let frameId = 0;
    let currentValue = 0;
    const nextStep = Math.max(1, Math.ceil(value / 20));

    const animate = (): void => {
      currentValue += nextStep;
      if (currentValue >= value) {
        setDisplayValue(value);
        return;
      }
      setDisplayValue(currentValue);
      frameId = window.requestAnimationFrame(animate);
    };

    setDisplayValue(0);
    frameId = window.requestAnimationFrame(animate);

    return () => window.cancelAnimationFrame(frameId);
  }, [value]);

  return <>{displayValue}</>;
};

const normalizeIssueSeverity = (severity?: string): IssueSeverity => {
  switch (severity) {
    case "critical":
      return "critical";
    case "error":
    case "high":
      return "error";
    case "warning":
    case "medium":
      return "warning";
    case "info":
    case "low":
    default:
      return "info";
  }
};

const normalizeIssueCategory = (category?: string): IssueCategory => {
  const safeCategory = String(category || "other") as IssueCategory;
  const allowedCategories: IssueCategory[] = [
    "font",
    "margins",
    "spacing",
    "pagination",
    "headings",
    "structure",
    "bibliography",
    "tables",
    "images",
    "formulas",
    "typography",
    "formatting",
    "other",
  ];

  return allowedCategories.includes(safeCategory) ? safeCategory : "other";
};

const getSeverityLabel = (severity: string): string => {
  switch (severity) {
    case "critical":
    case "error":
    case "high":
      return "Критическая";
    case "warning":
    case "medium":
      return "Средняя";
    case "info":
    case "low":
    default:
      return "Низкая";
  }
};

const getPluralPlaces = (count: number): string => {
  if (count === 1) {
    return "место";
  }
  if (count < 5) {
    return "места";
  }
  return "мест";
};

const buildCorrectedFileName = (fileName: string): string => {
  const lastDotIndex = fileName.lastIndexOf(".");
  if (lastDotIndex === -1) {
    return `${fileName}_corrected`;
  }

  return `${fileName.slice(0, lastDotIndex)}_corrected${fileName.slice(lastDotIndex)}`;
};

const extractIssues = (report?: ReportPayload | null): ValidationIssue[] => {
  if (!report) {
    return [];
  }

  if (Array.isArray(report.issues)) {
    return report.issues;
  }

  if (Array.isArray(report.check_results?.issues)) {
    return report.check_results.issues.map((issue: BackendIssueLike, index) => ({
      id: issue.id || `check-issue-${index}`,
      rule_id: typeof issue.rule_id === "number" ? issue.rule_id : index,
      rule_name: issue.rule_name || issue.description || issue.message || `Правило ${index + 1}`,
      category: normalizeIssueCategory(issue.category || issue.type),
      severity: normalizeIssueSeverity(issue.severity),
      description: issue.description || issue.message || "Проблема форматирования",
      location: issue.location || "Документ",
      can_autocorrect: Boolean(issue.can_autocorrect || issue.auto_fixable),
      suggestion: issue.suggestion,
    }));
  }

  if (Array.isArray(report.validation_result?.issues)) {
    return report.validation_result.issues;
  }

  if (Array.isArray(report.errors)) {
    return report.errors.map((issue, index) => ({
      id: issue.id || `legacy-issue-${index}`,
      rule_id: typeof issue.rule_id === "number" ? issue.rule_id : index,
      rule_name: issue.rule_name || issue.description || issue.message || `Правило ${index + 1}`,
      category: normalizeIssueCategory(issue.category),
      severity: normalizeIssueSeverity(issue.severity),
      description: issue.description || issue.message || "Проблема форматирования",
      location: issue.location || "Документ",
      can_autocorrect: Boolean(issue.can_autocorrect),
      suggestion: issue.suggestion,
    }));
  }

  return [];
};

const groupIssues = (issues: ValidationIssue[]): GroupedIssue[] => {
  const issueMap = new Map<string, GroupedIssue>();

  issues.forEach((issue) => {
    const key = `${issue.description}-${issue.severity}-${issue.category}`;
    const existing = issueMap.get(key);

    if (existing) {
      existing.count += 1;
      if (issue.location && !existing.locations.includes(issue.location)) {
        existing.locations.push(issue.location);
      }
      return;
    }

    issueMap.set(key, {
      ...issue,
      count: 1,
      locations: issue.location ? [issue.location] : [],
    });
  });

  const weightBySeverity: Record<IssueSeverity, number> = {
    critical: 0,
    error: 0,
    warning: 1,
    info: 2,
  };

  return Array.from(issueMap.values()).sort((left, right) => {
    const leftWeight = weightBySeverity[left.severity];
    const rightWeight = weightBySeverity[right.severity];

    if (leftWeight !== rightWeight) {
      return leftWeight - rightWeight;
    }

    return right.count - left.count;
  });
};

const getDocumentGrade = (
  totalIssues: number,
  highSeverityCount: number,
  mediumSeverityCount: number,
): DocumentGrade => {
  if (totalIssues === 0) {
    return {
      label: "Отлично",
      tone: "success",
      score: 5,
      description: "Критичных замечаний не найдено.",
    };
  }

  if (highSeverityCount <= 1 && mediumSeverityCount <= 1) {
    return {
      label: "Хорошо",
      tone: "success",
      score: 4,
      description: "Есть точечные отклонения, но документ выглядит устойчиво.",
    };
  }

  if (highSeverityCount <= 2) {
    return {
      label: "Нужна доработка",
      tone: "warning",
      score: 3,
      description: "Документ требует правок перед финальной сдачей.",
    };
  }

  return {
    label: "Критично",
    tone: "danger",
    score: 2,
    description: "Нарушений слишком много, документу нужна серьёзная переработка.",
  };
};

const getPostCorrectionGrade = (remainingIssues: number): DocumentGrade => {
  if (remainingIssues <= 0) {
    return {
      label: "Отлично",
      tone: "success",
      score: 5,
      description: "Автокоррекция сняла все найденные проблемы.",
    };
  }

  if (remainingIssues <= 3) {
    return {
      label: "Хорошо",
      tone: "success",
      score: 4,
      description: "После автокоррекции остались только единичные замечания.",
    };
  }

  if (remainingIssues <= 8) {
    return {
      label: "Нужна доработка",
      tone: "warning",
      score: 3,
      description: "Основная часть проблем исправлена, но нужна ещё одна итерация.",
    };
  }

  return {
    label: "Требуется ручная правка",
    tone: "danger",
    score: 2,
    description: "Даже после автокоррекции документ требует заметной ручной доработки.",
  };
};

const buildCorrectionPlaybackSteps = (summary?: CorrectionSummary): CorrectionPlaybackStep[] => {
  const phaseCounts = summary?.actions_by_phase ?? {};
  const steps = Object.values(correctionPhaseMeta)
    .map((meta) => ({
      ...meta,
      count: phaseCounts[meta.key] ?? (meta.key === "verification" && summary ? 1 : 0),
    }))
    .filter((step) => {
      if (!summary) {
        return true;
      }

      return step.count > 0 || step.key === "verification";
    });

  return steps.length > 0
    ? steps
    : Object.values(correctionPhaseMeta).map((meta) => ({ ...meta, count: 0 }));
};

const buildViewerHighlights = (
  issues: ValidationIssue[],
  activePhaseKey?: string,
  isProcessing = false,
  correctionApplied = false,
): ViewerHighlight[] => {
  const phaseCategories = activePhaseKey ? (playbackPhaseCategories[activePhaseKey] ?? []) : [];
  const phaseIssues =
    phaseCategories.length > 0
      ? issues.filter((issue) => phaseCategories.includes(issue.category))
      : issues;
  const source = (phaseIssues.length > 0 ? phaseIssues : issues).slice(0, 4);

  return source.map((issue, index) => ({
    id: `${issue.id}-${index}`,
    title: issue.rule_name || issue.description,
    location: issue.location || "Документ",
    severity: issue.severity,
    category: issue.category,
    status: isProcessing
      ? "В работе"
      : correctionApplied
        ? issue.can_autocorrect
          ? "Перепроверено"
          : "Нужна ручная правка"
        : issue.can_autocorrect
          ? "Готово к автоисправлению"
          : "Требует анализа",
  }));
};

const StatsCard: FC<StatsCardProps> = ({ value, title, subtitle, icon, toneClassName }) => {
  return (
    <motion.div initial="hidden" animate="show" variants={fadeUp}>
      <Card className={cn("h-full rounded-[28px] shadow-surface", toneClassName)}>
        <CardContent className="flex h-full items-start justify-between gap-4 p-6">
          <div className="space-y-2">
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-muted-foreground">
              {title}
            </p>
            <p className="text-4xl font-semibold tracking-[-0.05em] text-foreground">
              <AnimatedNumber value={value} />
            </p>
            {subtitle ? <p className="text-sm text-muted-foreground">{subtitle}</p> : null}
          </div>
          <div className="flex size-12 items-center justify-center rounded-2xl border border-border/70 bg-background/70 text-muted-foreground">
            {icon}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

const IssueItem: FC<IssueItemProps> = ({ issue }) => {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="rounded-[24px] border border-border/70 bg-background/55 transition-colors hover:border-border hover:bg-accent/35">
      <button
        type="button"
        onClick={() => setExpanded((previous) => !previous)}
        className="flex w-full items-start gap-4 px-4 py-4 text-left md:px-5"
      >
        <span
          className={cn(
            "mt-1.5 size-2 shrink-0 rounded-full",
            issue.severity === "warning"
              ? "bg-amber-400"
              : issue.severity === "info"
                ? "bg-sky-400"
                : "bg-red-400",
          )}
        />

        <div className="min-w-0 flex-1 space-y-3">
          <p className="text-sm font-semibold leading-relaxed text-foreground md:text-base">
            {issue.description}
          </p>

          <div className="flex flex-wrap gap-2">
            <Badge
              variant="outline"
              className={cn("rounded-full", severityToneClasses[issue.severity])}
            >
              {getSeverityLabel(issue.severity)}
            </Badge>
            <Badge variant="outline" className="rounded-full text-muted-foreground">
              {issue.count} {getPluralPlaces(issue.count)}
            </Badge>
            {issue.can_autocorrect ? (
              <Badge className="rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-300">
                <Sparkles className="mr-1 size-3.5" />
                Авто
              </Badge>
            ) : null}
          </div>
        </div>

        <ChevronDown
          className={cn(
            "mt-1 size-4 shrink-0 text-muted-foreground transition-transform",
            expanded && "rotate-180",
          )}
        />
      </button>

      {expanded ? (
        <div className="px-4 pb-4 md:px-5 md:pb-5">
          <div className="ml-6 rounded-[20px] border border-border/70 bg-card/70 p-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-muted-foreground">
              Расположение
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {issue.locations.map((location) => (
                <Badge
                  key={location}
                  variant="outline"
                  className="rounded-full text-muted-foreground"
                >
                  {location}
                </Badge>
              ))}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};

const ReportPage: FC<ReportPageProps> = ({ className = "" }) => {
  const location = useLocation() as { state?: LocationState };
  const navigate = useNavigate();
  const {
    reportData,
    fileName = "Документ",
    profileName = "Профиль",
  } = (location.state || {}) as Partial<LocationState>;

  const [currentReport, setCurrentReport] = useState<ReportPayload | null>(reportData ?? null);
  const [isCorrecting, setIsCorrecting] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [correctionError, setCorrectionError] = useState<string | null>(null);
  const [downloadError, setDownloadError] = useState<string | null>(null);
  const [activePlaybackStep, setActivePlaybackStep] = useState(0);
  const [isPlaybackRunning, setIsPlaybackRunning] = useState(false);

  useEffect(() => {
    setCurrentReport(reportData ?? null);
  }, [reportData]);

  useEffect(() => {
    setActivePlaybackStep(0);
    setIsPlaybackRunning(isCorrecting);
  }, [currentReport?.report, isCorrecting]);

  const handleGoBack = useCallback(() => {
    navigate("/");
  }, [navigate]);

  const handleDownload = useCallback(async (): Promise<void> => {
    const correctedFilePath =
      currentReport?.corrected_file_path || currentReport?.corrected_document_url;

    if (!correctedFilePath) {
      return;
    }

    setIsDownloading(true);
    setDownloadError(null);

    try {
      const accessToken = localStorage.getItem("access_token") || undefined;
      const blob = await documentsApi.downloadCorrected(correctedFilePath, accessToken);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = buildCorrectedFileName(fileName);
      document.body.appendChild(link);
      link.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(link);
    } catch (error) {
      setDownloadError(getApiErrorMessage(error, "Не удалось скачать исправленный файл"));
    } finally {
      setIsDownloading(false);
    }
  }, [currentReport, fileName]);

  const handleAutocorrect = useCallback(async (): Promise<void> => {
    const documentToken = currentReport?.document_token;

    if (!documentToken) {
      setCorrectionError(
        "Не найдена сессия документа для автокоррекции. Повторите проверку документа заново.",
      );
      return;
    }

    setIsCorrecting(true);
    setCorrectionError(null);
    setDownloadError(null);

    try {
      const accessToken = localStorage.getItem("access_token") || undefined;
      const correctionResult = await documentsApi.autocorrect(documentToken, fileName, accessToken);

      setCurrentReport((previousReport) => {
        if (!previousReport) {
          return previousReport;
        }

        return {
          ...previousReport,
          corrected_file_path:
            correctionResult.corrected_file_path ||
            correctionResult.corrected_path ||
            correctionResult.filename,
          original_preview_path:
            correctionResult.original_preview_path || previousReport.original_preview_path,
          document_token: undefined,
          correction_success: correctionResult.success,
          check_results: correctionResult.check_results ?? previousReport.check_results,
          improvement: correctionResult.improvement,
          report: correctionResult.report,
        };
      });
    } catch (error) {
      setCorrectionError(getApiErrorMessage(error, "Не удалось автоматически исправить документ"));
    } finally {
      setIsPlaybackRunning(false);
      setIsCorrecting(false);
    }
  }, [currentReport, fileName]);

  const initialIssues = useMemo(() => extractIssues(reportData ?? null), [reportData]);
  const issues = useMemo(() => extractIssues(currentReport), [currentReport]);
  const groupedIssues = useMemo(() => groupIssues(issues), [issues]);
  const correctedFilePath =
    currentReport?.corrected_file_path || currentReport?.corrected_document_url || null;
  const originalPreviewPath = currentReport?.original_preview_path || null;
  const canStartAutocorrect = Boolean(currentReport?.document_token) && !correctedFilePath;
  const autocorrectableIssuesCount = issues.filter((issue) => issue.can_autocorrect).length;
  const correctionSummary = currentReport?.report;
  const improvementSummary = currentReport?.improvement;
  const correctedRemainingIssues = improvementSummary?.after_total_issues;
  const correctionPlaybackSteps = useMemo(
    () => buildCorrectionPlaybackSteps(correctionSummary),
    [correctionSummary],
  );
  const showCorrectionPlayback = isCorrecting || Boolean(correctionSummary);
  const playbackSteps = useMemo(
    () => (showCorrectionPlayback ? correctionPlaybackSteps : []),
    [showCorrectionPlayback, correctionPlaybackSteps],
  );
  const hasPlaybackSteps = playbackSteps.length > 0;
  const currentStepIndex = hasPlaybackSteps ? activePlaybackStep % playbackSteps.length : 0;
  const activePlayback = hasPlaybackSteps ? playbackSteps[currentStepIndex] : null;
  const viewerHighlights = useMemo(
    () =>
      buildViewerHighlights(
        issues,
        activePlayback?.key,
        isCorrecting,
        Boolean(currentReport?.correction_success),
      ),
    [issues, activePlayback?.key, isCorrecting, currentReport?.correction_success],
  );
  const verificationEntries = Object.entries(correctionSummary?.verification_results ?? {});
  const showDocumentViewer = Boolean(correctedFilePath || originalPreviewPath);
  const viewerModeNote = correctedFilePath
    ? originalPreviewPath
      ? "Сравниваем оригинал и исправленный документ в live-режиме."
      : "Исходный снимок недоступен, поэтому показываем исправленный документ без полного compare-view."
    : "";
  const playbackProgressPercent = hasPlaybackSteps
    ? Math.round(((currentStepIndex + 1) / playbackSteps.length) * 100)
    : 0;
  const canControlPlayback = hasPlaybackSteps && !isCorrecting;

  const handleTogglePlayback = useCallback(() => {
    if (!canControlPlayback) {
      return;
    }

    setIsPlaybackRunning((previous) => !previous);
  }, [canControlPlayback]);

  const handleRestartPlayback = useCallback(() => {
    if (!hasPlaybackSteps) {
      return;
    }

    setActivePlaybackStep(0);
    if (!isCorrecting) {
      setIsPlaybackRunning(true);
    }
  }, [hasPlaybackSteps, isCorrecting]);

  useEffect(() => {
    if (!showCorrectionPlayback || playbackSteps.length === 0) {
      return undefined;
    }

    if (!isCorrecting && !isPlaybackRunning) {
      return undefined;
    }

    const interval = window.setInterval(
      () => {
        setActivePlaybackStep((previousStep) => (previousStep + 1) % playbackSteps.length);
      },
      isCorrecting ? 900 : 1800,
    );

    return () => window.clearInterval(interval);
  }, [showCorrectionPlayback, playbackSteps, isCorrecting, isPlaybackRunning]);

  const initialHighSeverityCount = initialIssues.filter(
    (issue) => issue.severity === "critical" || issue.severity === "error",
  ).length;
  const initialMediumSeverityCount = initialIssues.filter(
    (issue) => issue.severity === "warning",
  ).length;
  const highSeverityCount = issues.filter(
    (issue) => issue.severity === "critical" || issue.severity === "error",
  ).length;
  const mediumSeverityCount = issues.filter((issue) => issue.severity === "warning").length;
  const lowSeverityCount = issues.filter((issue) => issue.severity === "info").length;

  const initialGrade = useMemo(
    () =>
      getDocumentGrade(initialIssues.length, initialHighSeverityCount, initialMediumSeverityCount),
    [initialIssues.length, initialHighSeverityCount, initialMediumSeverityCount],
  );
  const activeGrade = useMemo(() => {
    if (typeof correctedRemainingIssues === "number") {
      return getPostCorrectionGrade(correctedRemainingIssues);
    }

    return initialGrade;
  }, [correctedRemainingIssues, initialGrade]);
  const primaryIssuesCount = correctedRemainingIssues ?? issues.length;
  const primaryIssuesTitle = improvementSummary ? "Проблем после коррекции" : "Всего проблем";
  const primaryIssuesSubtitle = improvementSummary
    ? `До исправления: ${improvementSummary.before_total_issues ?? issues.length}`
    : undefined;

  if (!currentReport) {
    return (
      <div
        className={cn(
          "flex min-h-screen items-center justify-center bg-background px-4",
          className,
        )}
      >
        <Card className="w-full max-w-md rounded-[32px] border-border/70 shadow-surface">
          <CardContent className="flex flex-col items-center gap-4 p-8 text-center">
            <div className="size-8 animate-spin rounded-full border-2 border-primary/20 border-t-primary" />
            <div className="space-y-2">
              <p className="text-lg font-semibold text-foreground">Загрузка отчета...</p>
              <p className="text-sm text-muted-foreground">
                Если переход был прерван, можно вернуться и запустить проверку ещё раз.
              </p>
            </div>
            <Button variant="outline" className="rounded-2xl" onClick={handleGoBack}>
              Вернуться
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className={cn("min-h-screen bg-background", className)}>
      <div className="sticky top-0 z-20 border-b border-border/70 bg-background/90 backdrop-blur-xl">
        <div className="mx-auto flex w-full max-w-[1480px] items-center justify-between gap-3 px-4 py-3 md:px-6">
          <Button variant="ghost" className="rounded-2xl" onClick={handleGoBack}>
            <ArrowLeft className="size-4" />
            Назад
          </Button>

          <Button
            variant="ghost"
            size="icon"
            className="rounded-2xl"
            aria-label="Распечатать"
            onClick={() => window.print()}
          >
            <Printer className="size-4" />
          </Button>
        </div>
      </div>

      <div className="mx-auto flex w-full max-w-[1480px] flex-col gap-6 px-4 py-6 md:px-6 md:py-8">
        <motion.div initial="hidden" animate="show" variants={fadeUp}>
          <Card
            className={cn(
              "rounded-[32px] border shadow-surface",
              gradeToneClasses[activeGrade.tone],
            )}
          >
            <CardContent className="space-y-6 p-6 md:p-8">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="space-y-2">
                  {improvementSummary ? (
                    <h2 className="text-xs font-semibold uppercase tracking-[0.28em] text-muted-foreground">
                      После автокоррекции
                    </h2>
                  ) : null}
                  <h1 className="text-3xl font-semibold tracking-[-0.05em] text-foreground md:text-4xl">
                    {activeGrade.label}
                  </h1>
                  <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground md:text-base">
                    {activeGrade.description}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {fileName} · {profileName}
                  </p>
                </div>

                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline" className="rounded-full px-3 py-1 text-foreground">
                    {primaryIssuesCount} проблем
                  </Badge>
                  <Badge variant="outline" className="rounded-full px-3 py-1 text-foreground">
                    {improvementSummary
                      ? `До исправления: ${initialGrade.label}`
                      : `Автоисправляемых: ${autocorrectableIssuesCount}`}
                  </Badge>
                  {correctionSummary ? (
                    <Badge className="rounded-full bg-emerald-500/15 px-3 py-1 text-emerald-600 dark:text-emerald-300">
                      Исправлено: {correctionSummary.total_issues_fixed ?? 0}
                    </Badge>
                  ) : null}
                  {improvementSummary ? (
                    <Badge className="rounded-full bg-amber-500/15 px-3 py-1 text-amber-600 dark:text-amber-300">
                      Осталось: {improvementSummary.after_total_issues ?? 0}
                    </Badge>
                  ) : null}
                </div>
              </div>

              <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
                <div className="flex flex-wrap gap-2">
                  <Button
                    className="rounded-2xl"
                    onClick={correctedFilePath ? handleDownload : handleAutocorrect}
                    disabled={
                      isDownloading || isCorrecting || (!correctedFilePath && !canStartAutocorrect)
                    }
                    aria-label={
                      correctedFilePath ? "Скачать исправленный файл" : "Исправить автоматически"
                    }
                  >
                    {correctedFilePath ? (
                      <Download className="size-4" />
                    ) : (
                      <Wand2 className="size-4" />
                    )}
                    {correctedFilePath
                      ? isDownloading
                        ? "Загрузка..."
                        : "Скачать исправленный файл"
                      : isCorrecting
                        ? "Исправляем документ..."
                        : "Исправить автоматически"}
                  </Button>

                  {hasPlaybackSteps ? (
                    <>
                      <Button
                        variant="outline"
                        className="rounded-2xl"
                        onClick={handleTogglePlayback}
                        disabled={!canControlPlayback}
                        aria-label={
                          isPlaybackRunning ? "Пауза walkthrough" : "Запустить walkthrough"
                        }
                      >
                        {isPlaybackRunning ? (
                          <PauseCircle className="size-4" />
                        ) : (
                          <PlayCircle className="size-4" />
                        )}
                        {isPlaybackRunning ? "Пауза walkthrough" : "Запустить walkthrough"}
                      </Button>
                      <Button
                        variant="ghost"
                        className="rounded-2xl"
                        onClick={handleRestartPlayback}
                        disabled={!hasPlaybackSteps}
                      >
                        <RotateCcw className="size-4" />
                        Сначала
                      </Button>
                    </>
                  ) : null}
                </div>

                {improvementSummary ? (
                  <div className="grid gap-2 sm:grid-cols-3">
                    <div className="rounded-[20px] border border-border/70 bg-background/60 px-4 py-3 text-sm text-muted-foreground">
                      <span className="block text-[11px] font-semibold uppercase tracking-[0.24em]">
                        Убрано проблем
                      </span>
                      <span className="mt-1 block text-base font-semibold text-foreground">
                        Убрано проблем: {improvementSummary.resolved_total_issues ?? 0}
                      </span>
                    </div>
                    <div className="rounded-[20px] border border-border/70 bg-background/60 px-4 py-3 text-sm text-muted-foreground">
                      <span className="block text-[11px] font-semibold uppercase tracking-[0.24em]">
                        Исправлено шрифтов
                      </span>
                      <span className="mt-1 block text-base font-semibold text-foreground">
                        Исправлено шрифтов: {improvementSummary.resolved_font_issues ?? 0}
                      </span>
                    </div>
                    <div className="rounded-[20px] border border-border/70 bg-background/60 px-4 py-3 text-sm text-muted-foreground">
                      <span className="block text-[11px] font-semibold uppercase tracking-[0.24em]">
                        Остаток после коррекции
                      </span>
                      <span className="mt-1 block text-base font-semibold text-foreground">
                        Осталось проблем: {improvementSummary.after_total_issues ?? 0}
                      </span>
                    </div>
                  </div>
                ) : null}
              </div>

              {correctionError ? <p className="text-sm text-red-500">{correctionError}</p> : null}
              {downloadError ? <p className="text-sm text-red-500">{downloadError}</p> : null}
            </CardContent>
          </Card>
        </motion.div>

        <div className="grid gap-4 md:grid-cols-3">
          <StatsCard
            value={primaryIssuesCount}
            title={primaryIssuesTitle}
            subtitle={primaryIssuesSubtitle}
            icon={<Sparkles className="size-5" />}
            toneClassName="border-red-500/20 bg-red-500/5"
          />
          <StatsCard
            value={highSeverityCount}
            title="Критических"
            icon={<Wand2 className="size-5" />}
            toneClassName="border-fuchsia-500/20 bg-fuchsia-500/5"
          />
          <StatsCard
            value={mediumSeverityCount}
            title="Средних"
            subtitle={`Низких: ${lowSeverityCount}`}
            icon={<CheckCircle2 className="size-5" />}
            toneClassName="border-amber-500/20 bg-amber-500/5"
          />
        </div>

        {showCorrectionPlayback || showDocumentViewer ? (
          <motion.div initial="hidden" animate="show" variants={fadeUp}>
            <Card className="rounded-[32px] border-border/70 bg-card/92 shadow-surface">
              <CardHeader className="space-y-3 p-6 pb-4 md:p-8 md:pb-5">
                <div className="space-y-2">
                  <h2 className="text-2xl font-semibold tracking-[-0.04em] text-foreground">
                    {showCorrectionPlayback ? "Живой режим исправлений" : "Предпросмотр документа"}
                  </h2>
                  <CardDescription className="max-w-3xl text-sm leading-relaxed md:text-base">
                    {showCorrectionPlayback
                      ? isCorrecting
                        ? "Автокоррекция идёт по фазам. Ниже показывается текущий прогресс и документ."
                        : "Здесь видно, какие фазы прошла автокоррекция и что осталось после неё."
                      : "Показываем доступный снимок документа и готовый corrected-файл."}
                  </CardDescription>
                </div>
                {showCorrectionPlayback && activePlayback ? (
                  <div className="rounded-[22px] border border-border/70 bg-background/55 p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.26em] text-muted-foreground">
                      Фокус playback: {activePlayback.title}
                    </p>
                    <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                      {activePlayback.description}
                    </p>
                  </div>
                ) : null}
              </CardHeader>

              <CardContent className="space-y-5 p-6 pt-0 md:p-8 md:pt-0">
                {showCorrectionPlayback && hasPlaybackSteps ? (
                  <div className="flex flex-wrap gap-2">
                    {playbackSteps.map((step, index) => {
                      const isActive = index === currentStepIndex;

                      return (
                        <button
                          key={step.key}
                          type="button"
                          onClick={() => {
                            setActivePlaybackStep(index);
                            if (!isCorrecting) {
                              setIsPlaybackRunning(false);
                            }
                          }}
                          className={cn(
                            "rounded-full border px-3 py-1.5 text-sm transition-colors",
                            isActive
                              ? playbackAccentClasses[step.key] || "text-foreground"
                              : "border-border/70 bg-background/55 text-muted-foreground hover:bg-accent",
                          )}
                        >
                          {step.title}
                          {step.count > 0 ? ` · ${step.count}` : ""}
                        </button>
                      );
                    })}

                    <Badge variant="outline" className="rounded-full px-3 py-1.5 text-foreground">
                      {isCorrecting
                        ? `Автопроход ${playbackProgressPercent}%`
                        : isPlaybackRunning
                          ? `Walkthrough ${playbackProgressPercent}%`
                          : `Шаг ${currentStepIndex + 1} из ${playbackSteps.length}`}
                    </Badge>
                  </div>
                ) : null}

                {showCorrectionPlayback && verificationEntries.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {verificationEntries.map(([key, result]) => (
                      <Badge
                        key={key}
                        className={cn(
                          "rounded-full px-3 py-1.5",
                          result.passed
                            ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-300"
                            : "bg-amber-500/15 text-amber-600 dark:text-amber-300",
                        )}
                      >
                        {verificationLabels[key] ?? key}:{" "}
                        {result.message ?? (result.passed ? "OK" : "Проверить")}
                      </Badge>
                    ))}
                  </div>
                ) : null}

                {showDocumentViewer ? (
                  <div data-testid="live-document-compare" className="space-y-3">
                    {viewerModeNote ? (
                      <p className="text-sm text-muted-foreground">{viewerModeNote}</p>
                    ) : null}
                    <ReportDocumentViewer
                      originalPath={originalPreviewPath}
                      correctedPath={correctedFilePath}
                      highlightedIssues={viewerHighlights}
                      activePhaseTitle={activePlayback?.title ?? null}
                      activePhaseAccent={activePlayback?.accent}
                      isProcessing={isCorrecting}
                    />
                  </div>
                ) : correctedFilePath ? (
                  <p className="text-sm text-muted-foreground">
                    Подготавливаем визуальное сравнение документа...
                  </p>
                ) : null}
              </CardContent>
            </Card>
          </motion.div>
        ) : null}

        <motion.div initial="hidden" animate="show" variants={fadeUp}>
          <Card className="rounded-[32px] border-border/70 bg-card/92 shadow-surface">
            <CardHeader className="p-6 pb-4 md:p-8 md:pb-5">
              <CardTitle className="text-2xl tracking-[-0.04em]">Замечания</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 p-6 pt-0 md:p-8 md:pt-0">
              {groupedIssues.length > 0 ? (
                groupedIssues.map((issue) => <IssueItem key={issue.id} issue={issue} />)
              ) : (
                <div className="rounded-[26px] border border-dashed border-emerald-500/30 bg-emerald-500/5 px-6 py-14 text-center">
                  <CheckCircle2 className="mx-auto size-12 text-emerald-500" />
                  <p className="mt-4 text-base font-semibold text-emerald-600 dark:text-emerald-300">
                    Документ прошел проверку без ошибок!
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        <Separator className="bg-border/70" />

        <div className="pb-4 text-center text-sm text-muted-foreground">
          Отчет создан для: {fileName} | Профиль: {profileName}
        </div>
      </div>
    </div>
  );
};

export default ReportPage;
