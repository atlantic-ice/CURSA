import ArticleOutlinedIcon from "@mui/icons-material/ArticleOutlined";
import AssessmentOutlinedIcon from "@mui/icons-material/AssessmentOutlined";
import DownloadIcon from "@mui/icons-material/Download";
import FileDownloadOutlinedIcon from "@mui/icons-material/FileDownloadOutlined";
import HighlightOffIcon from "@mui/icons-material/HighlightOff";
import InsertDriveFileOutlinedIcon from "@mui/icons-material/InsertDriveFileOutlined";
import NoteAddOutlinedIcon from "@mui/icons-material/NoteAddOutlined";
import SearchIcon from "@mui/icons-material/Search";
import SortIcon from "@mui/icons-material/Sort";
import { Box, Button, Grid, IconButton, InputBase, Tooltip, Typography } from "@mui/material";
import { AnimatePresence, motion } from "framer-motion";
import { FC, ReactNode, useContext, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import { CheckHistoryContext } from "../App";
import usePageStyles from "../hooks/usePageStyles";

const isLocal =
  typeof window !== "undefined" &&
  (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1");
const API_BASE = isLocal
  ? "http://localhost:5000"
  : process.env.REACT_APP_API_BASE || "https://cursa.onrender.com";

/**
 * Container and item animation variants for reports list
 */
const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.04 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 8 },
  show: { opacity: 1, y: 0, transition: { duration: 0.3, ease: "easeOut" } },
};

/**
 * StatCard component props interface
 */
interface StatCardProps {
  isDark: boolean;
  title: string;
  value: string | number;
  icon: ReactNode;
}

/**
 * Score distribution score band interface
 */
interface ScoreDistBand {
  score: number;
  count: number;
  pct: number;
  color: string;
}

/**
 * History item interface (from CheckHistoryContext)
 */
interface HistoryItem {
  id: string | number;
  fileName?: string;
  timestamp?: number;
  score?: number;
  reportData?: {
    score?: number;
    check_results?: {
      total_issues_count?: number;
    };
    corrected_file_path?: string;
  };
  correctedFilePath?: string;
  totalIssues?: number;
}

/**
 * Sort state type definition
 */
type SortType = "date-desc" | "date-asc" | "name-asc" | "name-desc";

/**
 * Score filter type definition
 */
type ScoreFilterType = "all" | "good" | "bad";

/**
 * ReportsPageProps interface (no props required)
 */
interface ReportsPageProps {}

/**
 * Sort labels mapping
 */
const SORT_LABELS: Record<SortType, string> = {
  "date-desc": "Сначала новые",
  "date-asc": "Сначала старые",
  "name-asc": "Имя А→Я",
  "name-desc": "Имя Я→А",
};

/**
 * StatCard Sub-Component
 *
 * Displays statistics card with icon, title and value
 *
 * @param props - StatCardProps with theme and data
 * @returns Card displaying statistic
 */
const StatCard: FC<StatCardProps> = ({ isDark, title, value, icon }) => {
  const textPrimary = isDark ? "#fff" : "#000";
  const textMuted = isDark ? "rgba(255,255,255,0.3)" : "rgba(0,0,0,0.4)";
  const borderColor = isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)";

  return (
    <Box sx={{ p: 3, border: "1px solid", borderColor, borderRadius: 1 }}>
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          mb: 2,
        }}
      >
        <Typography
          sx={{
            fontSize: "0.75rem",
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            color: textMuted,
            fontWeight: 600,
          }}
        >
          {title}
        </Typography>
        <Box sx={{ color: textMuted, display: "flex" }}>{icon}</Box>
      </Box>
      <Typography
        sx={{
          fontSize: "2rem",
          fontWeight: 700,
          letterSpacing: "-0.04em",
          color: textPrimary,
          fontFamily: "'Wix Madefor Display', sans-serif",
        }}
      >
        {value}
      </Typography>
    </Box>
  );
};

/**
 * ReportsPage Component
 *
 * Displays all validation reports from history with filtering, sorting, and export capabilities.
 * Features include:
 * - List view with collapsible rows showing detailed information
 * - Search by filename
 * - Sort by date or name (ascending/descending)
 * - Filter by score (all, good ≥4, bad ≤2)
 * - Score distribution visualization
 * - Download corrected documents
 * - CSV export of all reports
 * - Navigation to detailed report view
 *
 * State:
 * - query: Search filter for filename
 * - sort: Current sort order
 * - scoreFilter: Score range filter
 * - expandedId: Currently expanded report row ID
 *
 * @returns React component with reports list and management interface
 */
const ReportsPage: FC<ReportsPageProps> = () => {
  const navigate = useNavigate();
  const {
    isDark,
    textPrimary,
    textMuted,
    borderColor,
    borderColorSubtle,
    rowHover,
    inputBg,
    contentPaddingX,
  } = usePageStyles();
  const { history } = useContext(CheckHistoryContext);

  // UI state
  const [query, setQuery] = useState<string>("");
  const [sort, setSort] = useState<SortType>("date-desc");
  const [scoreFilter, setScoreFilter] = useState<ScoreFilterType>("all");
  const [expandedId, setExpandedId] = useState<string | number | null>(null);

  /**
   * Calculate report statistics
   */
  const totalReports = history.length;
  const withCorrections = history.filter(
    (h) => h.correctedFilePath || h.reportData?.corrected_file_path,
  ).length;
  const avgScore =
    history.length > 0
      ? (history.reduce((acc, h) => acc + (h.score || 0), 0) / history.length).toFixed(1)
      : "—";

  /**
   * Calculate score distribution (1-5 range)
   */
  const scoreDist = useMemo((): ScoreDistBand[] => {
    const counts: Record<number, number> = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    history.forEach((h) => {
      const s = h.score ?? h.reportData?.score;
      if (s != null) {
        const rounded = Math.round(s);
        if (rounded >= 1 && rounded <= 5) counts[rounded]++;
      }
    });
    const maxCount = Math.max(...Object.values(counts), 1);
    return [5, 4, 3, 2, 1].map((n) => ({
      score: n,
      count: counts[n],
      pct: (counts[n] / maxCount) * 100,
      color: n >= 4 ? "#34d399" : n === 3 ? "#fbbf24" : "#f87171",
    }));
  }, [history]);

  /**
   * Cycle through sort options
   */
  const cycleSort = (): void => {
    setSort((s) =>
      s === "date-desc"
        ? "date-asc"
        : s === "date-asc"
          ? "name-asc"
          : s === "name-asc"
            ? "name-desc"
            : "date-desc",
    );
  };

  /**
   * Filter and sort reports based on current criteria
   */
  const items = useMemo((): HistoryItem[] => {
    let filtered = query
      ? history.filter((h) => (h.fileName || "").toLowerCase().includes(query.toLowerCase()))
      : history;

    if (scoreFilter === "good") {
      filtered = filtered.filter((h) => (h.score ?? h.reportData?.score ?? 0) >= 4);
    }
    if (scoreFilter === "bad") {
      filtered = filtered.filter((h) => {
        const s = h.score ?? h.reportData?.score ?? null;
        return s != null && s <= 2;
      });
    }

    return [...filtered].sort((a, b) => {
      if (sort === "date-desc")
        return (b.timestamp || Number(b.id) || 0) - (a.timestamp || Number(a.id) || 0);
      if (sort === "date-asc")
        return (a.timestamp || Number(a.id) || 0) - (b.timestamp || Number(b.id) || 0);
      const na = (a.fileName || "").localeCompare(b.fileName || "");
      return sort === "name-asc" ? na : -na;
    });
  }, [history, query, sort, scoreFilter]);

  /**
   * Download corrected document
   *
   * @param filePath - Path to the corrected file
   * @param originalName - Original document name
   */
  const downloadDocument = (filePath: string, originalName?: string): void => {
    if (!filePath) return;

    const safeName = originalName
      ? originalName.endsWith(".docx")
        ? originalName
        : originalName + ".docx"
      : `document_${Date.now()}.docx`;

    if (filePath.indexOf("/") === -1 && filePath.indexOf("\\") === -1) {
      window.location.href = `${API_BASE}/corrections/${encodeURIComponent(filePath)}`;
    } else {
      window.location.href = `${API_BASE}/api/document/download-corrected?path=${encodeURIComponent(filePath)}&filename=${encodeURIComponent(safeName)}`;
    }
  };

  /**
   * Export all reports to CSV file
   */
  const exportCSV = (): void => {
    const rows: Array<Array<string | number>> = [
      ["Файл", "Дата", "Проблем", "Балл", "Исправлен"],
      ...history.map((h) => {
        const issues = h.reportData?.check_results?.total_issues_count ?? h.totalIssues ?? 0;
        const score = h.score ?? h.reportData?.score ?? "";
        const corrected = h.correctedFilePath || h.reportData?.corrected_file_path ? "Да" : "Нет";
        const date = new Date(h.timestamp || h.id).toLocaleString("ru-RU");
        return [
          `"${(h.fileName || "").replace(/"/g, '""')}"`,
          `"${date}"`,
          issues,
          score,
          corrected,
        ];
      }),
    ];

    const csv = "\ufeff" + rows.map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `cursa_reports_${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Box
      sx={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        py: 4,
        px: contentPaddingX,
      }}
    >
      {/* Header section */}
      <Box
        sx={{
          mb: 4,
          display: "flex",
          alignItems: "flex-end",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 2,
        }}
      >
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Typography
            variant="h4"
            sx={{
              fontWeight: 700,
              letterSpacing: "-0.025em",
              fontFamily: "'Wix Madefor Display', sans-serif",
              color: textPrimary,
              mb: 0.5,
            }}
          >
            Отчёты
          </Typography>
          <Typography sx={{ color: textMuted, fontSize: "0.875rem" }}>
            Результаты проверок и исправленные документы
          </Typography>
        </motion.div>

        {/* Action buttons */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
          <Box sx={{ display: "flex", gap: 1 }}>
            <Tooltip title="Экспортировать все отчёты в CSV">
              <span>
                <Button
                  size="small"
                  startIcon={<FileDownloadOutlinedIcon sx={{ fontSize: 15 }} />}
                  onClick={exportCSV}
                  disabled={history.length === 0}
                  sx={{
                    borderRadius: 1,
                    color: textMuted,
                    border: "1px solid",
                    borderColor,
                    fontSize: "0.8rem",
                    textTransform: "none",
                    px: 1.5,
                    "&:hover": { color: textPrimary },
                  }}
                >
                  Экспорт CSV
                </Button>
              </span>
            </Tooltip>
            <Button
              onClick={(): void => navigate("/")}
              startIcon={<NoteAddOutlinedIcon />}
              variant="contained"
              sx={{
                borderRadius: 1,
                fontWeight: 600,
                fontSize: "0.8rem",
                textTransform: "none",
                letterSpacing: "0.03em",
                px: 2.5,
                boxShadow: "none",
              }}
            >
              Новая проверка
            </Button>
          </Box>
        </motion.div>
      </Box>

      {/* Statistics cards */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Grid container spacing={2} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={4}>
            <StatCard
              isDark={isDark}
              title="Всего отчётов"
              value={totalReports || "0"}
              icon={<ArticleOutlinedIcon sx={{ fontSize: 18 }} />}
            />
          </Grid>
          <Grid item xs={12} sm={4}>
            <StatCard
              isDark={isDark}
              title="С исправлениями"
              value={withCorrections || "0"}
              icon={<DownloadIcon sx={{ fontSize: 18 }} />}
            />
          </Grid>
          <Grid item xs={12} sm={4}>
            <StatCard
              isDark={isDark}
              title="Средний балл"
              value={avgScore}
              icon={<AssessmentOutlinedIcon sx={{ fontSize: 18 }} />}
            />
          </Grid>
        </Grid>
      </motion.div>

      {/* Score distribution visualization */}
      {history.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
        >
          <Box
            sx={{
              mb: 3,
              p: 2.5,
              border: "1px solid",
              borderColor,
              borderRadius: 1,
            }}
          >
            <Typography
              sx={{
                fontSize: "0.7rem",
                fontWeight: 600,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                color: textMuted,
                mb: 1.5,
              }}
            >
              Распределение баллов
            </Typography>
            <Box sx={{ display: "flex", flexDirection: "column", gap: 0.75 }}>
              {scoreDist.map(({ score, count, pct, color }) => (
                <Box key={score} sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                  <Typography
                    sx={{
                      fontSize: "0.75rem",
                      fontWeight: 600,
                      color: count > 0 ? color : textMuted,
                      width: 20,
                      flexShrink: 0,
                      textAlign: "right",
                    }}
                  >
                    {score}
                  </Typography>
                  <Box
                    sx={{
                      flex: 1,
                      height: 6,
                      borderRadius: 3,
                      bgcolor: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)",
                      overflow: "hidden",
                    }}
                  >
                    <Box
                      sx={{
                        height: "100%",
                        width: `${pct}%`,
                        bgcolor: count > 0 ? color : "transparent",
                        borderRadius: 3,
                        transition: "width 0.6s cubic-bezier(0.4,0,0.2,1)",
                        opacity: count > 0 ? 1 : 0,
                      }}
                    />
                  </Box>
                  <Typography
                    sx={{
                      fontSize: "0.72rem",
                      color: count > 0 ? textPrimary : textMuted,
                      fontWeight: count > 0 ? 600 : 400,
                      width: 24,
                      flexShrink: 0,
                      textAlign: "center",
                    }}
                  >
                    {count || "—"}
                  </Typography>
                </Box>
              ))}
            </Box>
          </Box>
        </motion.div>
      )}

      {/* Toolbar with search and filters */}
      <Box sx={{ mb: 2, display: "flex", alignItems: "center", gap: 1.5, flexWrap: "wrap" }}>
        {/* Search field */}
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1,
            px: 1.5,
            py: 0.75,
            borderRadius: 1,
            bgcolor: inputBg,
            border: "1px solid",
            borderColor,
            flex: "1 1 240px",
            maxWidth: 360,
          }}
        >
          <SearchIcon sx={{ fontSize: 16, color: textMuted }} />
          <InputBase
            placeholder="Поиск по названию"
            value={query}
            onChange={(e): void => setQuery(e.target.value)}
            sx={{
              flex: 1,
              fontSize: "0.875rem",
              color: textPrimary,
              "& input::placeholder": { color: textMuted },
            }}
          />
          {query && (
            <IconButton size="small" onClick={(): void => setQuery("")} sx={{ p: 0.25 }}>
              <HighlightOffIcon sx={{ fontSize: 15, color: textMuted }} />
            </IconButton>
          )}
        </Box>

        {/* Sort button */}
        <Button
          size="small"
          startIcon={<SortIcon sx={{ fontSize: 15 }} />}
          onClick={cycleSort}
          sx={{
            borderRadius: 1,
            color: textMuted,
            border: "1px solid",
            borderColor,
            fontSize: "0.8rem",
            textTransform: "none",
            px: 1.5,
            py: 0.875,
            "&:hover": { color: textPrimary },
          }}
        >
          {SORT_LABELS[sort]}
        </Button>

        {/* Score filter chips */}
        {[
          { key: "all" as const, label: "Все" },
          { key: "good" as const, label: "Балл ≥ 4" },
          { key: "bad" as const, label: "Балл ≤ 2" },
        ].map((f) => {
          const active = scoreFilter === f.key;
          return (
            <Button
              key={f.key}
              size="small"
              onClick={(): void => setScoreFilter(f.key)}
              sx={{
                borderRadius: 1,
                fontSize: "0.78rem",
                textTransform: "none",
                px: 1.5,
                py: 0.875,
                border: "1px solid",
                borderColor: active ? "primary.main" : borderColor,
                color: active ? "primary.main" : textMuted,
                bgcolor: active
                  ? isDark
                    ? "rgba(99,102,241,0.08)"
                    : "rgba(99,102,241,0.06)"
                  : "transparent",
                "&:hover": { color: textPrimary },
              }}
            >
              {f.label}
            </Button>
          );
        })}
      </Box>

      {/* Reports list content */}
      <Box sx={{ flex: 1, overflowY: "auto", pr: 0.5 }} className="custom-scrollbar">
        {history.length === 0 ? (
          /* Empty state */
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              height: 300,
              gap: 2,
            }}
          >
            <ArticleOutlinedIcon sx={{ fontSize: 48, color: textMuted, opacity: 0.4 }} />
            <Typography sx={{ color: textMuted, fontSize: "0.9rem" }}>Нет отчётов</Typography>
            <Button
              onClick={(): void => navigate("/")}
              variant="outlined"
              size="small"
              sx={{ borderRadius: 1, textTransform: "none", borderColor, color: textMuted }}
            >
              Загрузить документ
            </Button>
          </Box>
        ) : items.length === 0 ? (
          /* No results */
          <Box
            sx={{ display: "flex", alignItems: "center", justifyContent: "center", height: 200 }}
          >
            <Typography sx={{ color: textMuted, fontSize: "0.875rem" }}>
              Ничего не найдено
            </Typography>
          </Box>
        ) : (
          <>
            {/* Table header */}
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: "minmax(0,1fr) 150px 85px 70px 90px 160px",
                gap: 1,
                px: 2,
                py: 1,
                borderBottom: "1px solid",
                borderColor,
              }}
            >
              {["Файл", "Дата", "Проблем", "Балл", "Исправлен", ""].map((h) => (
                <Typography
                  key={h}
                  sx={{
                    fontSize: "0.7rem",
                    letterSpacing: "0.08em",
                    color: textMuted,
                    textTransform: "uppercase",
                    fontWeight: 600,
                  }}
                >
                  {h}
                </Typography>
              ))}
            </Box>

            {/* Reports list with animations */}
            <motion.div variants={containerVariants} initial="hidden" animate="show">
              {items.map((item) => {
                const issuesCount =
                  item.reportData?.check_results?.total_issues_count ?? item.totalIssues ?? 0;
                const correctedPath =
                  item.correctedFilePath || item.reportData?.corrected_file_path;
                const score = item.score ?? item.reportData?.score;
                const dateStr = new Date(item.timestamp || item.id).toLocaleString("ru-RU", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                });

                return (
                  <motion.div key={item.id} variants={itemVariants}>
                    {/* Table row */}
                    <Box
                      sx={{
                        display: "grid",
                        gridTemplateColumns: "minmax(0,1fr) 150px 85px 70px 90px 160px",
                        gap: 1,
                        px: 2,
                        py: 1.5,
                        borderBottom: "1px solid",
                        borderColor: borderColorSubtle,
                        cursor: "pointer",
                        transition: "background 0.15s",
                        bgcolor: expandedId === item.id ? rowHover : "transparent",
                        "&:hover": { bgcolor: rowHover },
                        alignItems: "center",
                      }}
                      onClick={(): void => setExpandedId(expandedId === item.id ? null : item.id)}
                    >
                      {/* File name column */}
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, minWidth: 0 }}>
                        <InsertDriveFileOutlinedIcon
                          sx={{ fontSize: 16, color: textMuted, flexShrink: 0 }}
                        />
                        <Typography
                          sx={{
                            fontSize: "0.875rem",
                            fontWeight: 500,
                            color: textPrimary,
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {item.fileName || "Без названия"}
                        </Typography>
                      </Box>

                      {/* Date column */}
                      <Typography sx={{ fontSize: "0.775rem", color: textMuted }}>
                        {dateStr}
                      </Typography>

                      {/* Issues count column */}
                      <Box
                        sx={{
                          display: "inline-flex",
                          px: 1.25,
                          py: 0.25,
                          borderRadius: 0.5,
                          border: "1px solid",
                          borderColor:
                            issuesCount > 0 ? "rgba(251,191,36,0.25)" : "rgba(52,211,153,0.25)",
                          bgcolor:
                            issuesCount > 0 ? "rgba(251,191,36,0.07)" : "rgba(52,211,153,0.07)",
                        }}
                      >
                        <Typography
                          sx={{
                            fontSize: "0.75rem",
                            fontWeight: 600,
                            color: issuesCount > 0 ? "#fbbf24" : "#34d399",
                          }}
                        >
                          {issuesCount}
                        </Typography>
                      </Box>

                      {/* Score column */}
                      <Typography
                        sx={{
                          fontSize: "0.775rem",
                          color: score ? textPrimary : textMuted,
                          fontWeight: score ? 600 : 400,
                        }}
                      >
                        {score != null
                          ? typeof score === "number"
                            ? score.toFixed(1)
                            : score
                          : "—"}
                      </Typography>

                      {/* Has corrected column */}
                      <Box>
                        {correctedPath ? (
                          <Box
                            sx={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: 0.5,
                              px: 1.25,
                              py: 0.25,
                              borderRadius: 0.5,
                              border: "1px solid rgba(52,211,153,0.25)",
                              bgcolor: "rgba(52,211,153,0.07)",
                            }}
                          >
                            <Typography
                              sx={{ fontSize: "0.75rem", fontWeight: 600, color: "#34d399" }}
                            >
                              Да
                            </Typography>
                          </Box>
                        ) : (
                          <Typography sx={{ fontSize: "0.75rem", color: textMuted }}>—</Typography>
                        )}
                      </Box>

                      {/* Actions column */}
                      <Box
                        sx={{ display: "flex", gap: 0.5, justifyContent: "flex-end" }}
                        onClick={(e): void => e.stopPropagation()}
                      >
                        <Button
                          size="small"
                          onClick={(): void =>
                            navigate("/report", {
                              state: { reportData: item.reportData, fileName: item.fileName },
                            })
                          }
                          sx={{
                            borderRadius: 0.5,
                            fontSize: "0.75rem",
                            textTransform: "none",
                            color: textMuted,
                            py: 0.25,
                            px: 1,
                            "&:hover": { color: textPrimary },
                          }}
                        >
                          Открыть
                        </Button>
                        {correctedPath && (
                          <Tooltip title="Скачать исправленный .DOCX">
                            <Button
                              size="small"
                              startIcon={<DownloadIcon sx={{ fontSize: 13 }} />}
                              onClick={(): void => downloadDocument(correctedPath, item.fileName)}
                              sx={{
                                borderRadius: 0.5,
                                fontSize: "0.75rem",
                                textTransform: "none",
                                color: "#34d399",
                                py: 0.25,
                                px: 1,
                                "&:hover": { bgcolor: "rgba(52,211,153,0.08)" },
                              }}
                            >
                              .DOCX
                            </Button>
                          </Tooltip>
                        )}
                      </Box>
                    </Box>

                    {/* Expandable details row */}
                    <AnimatePresence>
                      {expandedId === item.id && (
                        <motion.div
                          key={`exp-${item.id}`}
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.18, ease: "easeInOut" }}
                          style={{ overflow: "hidden" }}
                        >
                          <Box
                            sx={{
                              px: 2,
                              py: 1.75,
                              display: "flex",
                              gap: 3,
                              alignItems: "center",
                              bgcolor: isDark ? "rgba(255,255,255,0.025)" : "rgba(0,0,0,0.018)",
                              borderBottom: "1px solid",
                              borderColor,
                            }}
                          >
                            {/* Score badge */}
                            <Box
                              sx={{
                                width: 52,
                                height: 52,
                                borderRadius: 1.5,
                                border: "2px solid",
                                borderColor:
                                  score != null
                                    ? score >= 4
                                      ? "rgba(52,211,153,0.4)"
                                      : score >= 3
                                        ? "rgba(251,191,36,0.4)"
                                        : "rgba(248,113,113,0.4)"
                                    : borderColor,
                                bgcolor:
                                  score != null
                                    ? score >= 4
                                      ? "rgba(52,211,153,0.08)"
                                      : score >= 3
                                        ? "rgba(251,191,36,0.08)"
                                        : "rgba(248,113,113,0.08)"
                                    : "transparent",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                flexShrink: 0,
                              }}
                            >
                              <Typography
                                sx={{
                                  fontSize: "1.2rem",
                                  fontWeight: 700,
                                  color:
                                    score != null
                                      ? score >= 4
                                        ? "#34d399"
                                        : score >= 3
                                          ? "#fbbf24"
                                          : "#f87171"
                                      : textMuted,
                                }}
                              >
                                {score != null
                                  ? typeof score === "number"
                                    ? score.toFixed(1)
                                    : score
                                  : "—"}
                              </Typography>
                            </Box>

                            {/* Metadata section */}
                            <Box sx={{ flex: 1, minWidth: 0 }}>
                              <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                                <Typography
                                  sx={{
                                    fontSize: "0.78rem",
                                    color: textPrimary,
                                    fontWeight: 500,
                                    overflow: "hidden",
                                    textOverflow: "ellipsis",
                                    whiteSpace: "nowrap",
                                  }}
                                >
                                  {item.fileName || "Без названия"}
                                </Typography>
                              </Box>
                              <Box
                                sx={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: 1,
                                  mt: 0.5,
                                }}
                              >
                                <Typography
                                  sx={{
                                    fontSize: "0.72rem",
                                    fontWeight: 600,
                                    color: issuesCount > 0 ? "#fbbf24" : "#34d399",
                                  }}
                                >
                                  {issuesCount} замеч.
                                </Typography>
                                <Typography sx={{ fontSize: "0.72rem", color: textMuted }}>
                                  ·
                                </Typography>
                                <Typography sx={{ fontSize: "0.72rem", color: textMuted }}>
                                  {dateStr}
                                </Typography>
                              </Box>
                            </Box>

                            {/* Expanded actions */}
                            <Box sx={{ display: "flex", gap: 1, flexShrink: 0 }}>
                              <Button
                                size="small"
                                variant="outlined"
                                onClick={(e): void => {
                                  e.stopPropagation();
                                  navigate("/report", {
                                    state: {
                                      reportData: item.reportData,
                                      fileName: item.fileName,
                                    },
                                  });
                                }}
                                sx={{
                                  borderRadius: 0.75,
                                  textTransform: "none",
                                  fontSize: "0.78rem",
                                  py: 0.5,
                                  px: 1.5,
                                  borderColor,
                                  color: textMuted,
                                  "&:hover": { color: textPrimary },
                                }}
                              >
                                Открыть отчёт
                              </Button>
                              {correctedPath && (
                                <Button
                                  size="small"
                                  variant="outlined"
                                  startIcon={<DownloadIcon sx={{ fontSize: 13 }} />}
                                  onClick={(e): void => {
                                    e.stopPropagation();
                                    downloadDocument(correctedPath, item.fileName);
                                  }}
                                  sx={{
                                    borderRadius: 0.75,
                                    textTransform: "none",
                                    fontSize: "0.78rem",
                                    py: 0.5,
                                    px: 1.5,
                                    borderColor: "rgba(52,211,153,0.35)",
                                    color: "#34d399",
                                    "&:hover": { bgcolor: "rgba(52,211,153,0.08)" },
                                  }}
                                >
                                  .DOCX
                                </Button>
                              )}
                            </Box>
                          </Box>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                );
              })}
            </motion.div>
          </>
        )}
      </Box>
    </Box>
  );
};

export default ReportsPage;
