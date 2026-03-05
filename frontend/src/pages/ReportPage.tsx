import {
  alpha,
  Box,
  Button,
  Chip,
  CircularProgress,
  Collapse,
  Container,
  Divider,
  Grid,
  IconButton,
  Paper,
  Stack,
  Theme,
  Tooltip,
  Typography,
  useTheme,
} from "@mui/material";
import axios from "axios";
import { motion } from "framer-motion";
import { FC, useCallback, useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

// Icons
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import AutoFixHighIcon from "@mui/icons-material/AutoFixHigh";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import DownloadIcon from "@mui/icons-material/Download";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import PrintIcon from "@mui/icons-material/Print";

import type { ValidationIssue, ValidationReport } from "../types";
import "./ReportPage.css";

// ============================================================================
// Type Definitions
// ============================================================================

interface ReportPageProps {
  className?: string;
}

interface DocumentGrade {
  label: string;
  color: "success" | "warning" | "error";
  score: 1 | 2 | 3 | 4 | 5;
  description: string;
}

interface GroupedIssue extends ValidationIssue {
  count: number;
  locations: string[];
}

interface ManualFixGuide {
  title: string;
  icon: React.ReactNode;
  steps: string[];
  videoPlaceholder?: string;
  tips: string[];
}

interface LocationState {
  reportData: ValidationReport;
  fileName: string;
  profileId: string;
  profileName: string;
}

/**
 * Animated number component for statistics
 */
const AnimatedNumber: FC<{ value: number }> = ({ value }) => {
  const [displayValue, setDisplayValue] = useState<number>(0);

  useEffect(() => {
    let frame = 0;
    const animate = (): void => {
      frame += Math.max(1, Math.ceil(value / 30));
      if (frame >= value) {
        setDisplayValue(value);
      } else {
        setDisplayValue(frame);
        requestAnimationFrame(animate);
      }
    };
    requestAnimationFrame(animate);
  }, [value]);

  return <>{displayValue}</>;
};

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Calculate document grade based on issue severity counts
 */
const getDocumentGrade = (
  totalIssues: number,
  highSeverityCount: number,
  mediumSeverityCount: number,
  lowSeverityCount: number,
): DocumentGrade => {
  if (highSeverityCount === 0 && mediumSeverityCount === 0 && lowSeverityCount <= 3) {
    return {
      label: "Отлично",
      color: "success",
      score: 5,
      description: "Документ соответствует стандартам",
    };
  }
  if (highSeverityCount === 0 && mediumSeverityCount <= 3 && lowSeverityCount <= 10) {
    return {
      label: "Хорошо",
      color: "success",
      score: 4,
      description: "Незначительные отклонения",
    };
  }
  if (highSeverityCount === 0 && mediumSeverityCount <= 10) {
    return {
      label: "Удовлетворительно",
      color: "warning",
      score: 3,
      description: "Требуются правки",
    };
  }
  if (highSeverityCount <= 5) {
    return {
      label: "Неудовлетворительно",
      color: "error",
      score: 2,
      description: "Множество нарушений",
    };
  }
  return {
    label: "Плохо",
    color: "error",
    score: 1,
    description: "Критическое количество ошибок",
  };
};

/**
 * Group issues by type and description
 */
const groupIssues = (issues: ValidationIssue[]): GroupedIssue[] => {
  const map = new Map<string, GroupedIssue>();

  issues.forEach((issue: ValidationIssue) => {
    const key = `${issue.rule_name}|${issue.description}`;
    if (!map.has(key)) {
      map.set(key, {
        ...issue,
        count: 1,
        locations: [issue.location || "неизвестно"],
      });
    } else {
      const grouped = map.get(key)!;
      grouped.count += 1;
      if (issue.location) {
        grouped.locations.push(issue.location);
      }
    }
  });

  return Array.from(map.values());
};

/**
 * Get color for severity level
 */
const getSeverityColor = (severity: string): string => {
  switch (severity) {
    case "high":
      return "#ef4444"; // Red
    case "medium":
      return "#f59e0b"; // Amber
    case "low":
      return "#3b82f6"; // Blue
    default:
      return "#94a3b8"; // Slate
  }
};

/**
 * Get label for severity level
 */
const getSeverityLabel = (severity: string): string => {
  switch (severity) {
    case "high":
      return "Критическая";
    case "medium":
      return "Средняя";
    case "low":
      return "Низкая";
    default:
      return "Инфо";
  }
};

// ============================================================================
// Sub-Components
// ============================================================================

/**
 * Statistics card component
 */
interface StatsCardProps {
  value: number;
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  color?: string;
}

const StatsCard: FC<StatsCardProps> = ({ value, title, subtitle, icon, color = "#3b82f6" }) => {
  const theme: Theme = useTheme();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Paper
        elevation={0}
        sx={{
          p: 2.5,
          borderRadius: 2,
          background: `linear-gradient(135deg, ${color}20 0%, ${color}05 100%)`,
          border: `1px solid ${alpha(color, 0.2)}`,
          textAlign: "center",
          minHeight: 140,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        {icon && <Box sx={{ mb: 1, color, fontSize: 32 }}>{icon}</Box>}
        <Typography
          variant="h3"
          fontWeight={700}
          sx={{
            color: "white",
            mb: 0.5,
            letterSpacing: "-0.02em",
            textShadow: "0 2px 10px rgba(0,0,0,0.5)",
          }}
        >
          <AnimatedNumber value={value} />
        </Typography>
        <Typography
          variant="body2"
          fontWeight={600}
          sx={{ textShadow: "0 1px 4px rgba(0,0,0,0.8)" }}
        >
          {title}
        </Typography>
        {subtitle && (
          <Typography
            variant="caption"
            sx={{ color: alpha(theme.palette.text.secondary, 0.7), mt: 0.5, display: "block" }}
          >
            {subtitle}
          </Typography>
        )}
      </Paper>
    </motion.div>
  );
};

/**
 * Issue item component with expandable details
 */
interface IssueItemProps {
  issue: GroupedIssue;
  index: number;
}

const IssueItem: FC<IssueItemProps> = ({ issue, index }) => {
  const [expanded, setExpanded] = useState<boolean>(false);
  const theme: Theme = useTheme();
  const severityColor: string = getSeverityColor(issue.severity);

  return (
    <Paper
      elevation={0}
      sx={{
        mb: 1,
        borderRadius: 1,
        background: "rgba(255,255,255,0.02)",
        border: "1px solid rgba(255,255,255,0.07)",
        transition: "border-color 0.15s ease",
        "&:hover": {
          borderColor: "rgba(255,255,255,0.18)",
        },
      }}
    >
      <Box
        onClick={() => setExpanded(!expanded)}
        sx={{
          p: 2,
          display: "flex",
          alignItems: "flex-start",
          cursor: "pointer",
          gap: 2,
          userSelect: "none",
        }}
      >
        <Box
          sx={{
            mt: 0.5,
            width: 8,
            height: 8,
            borderRadius: "50%",
            bgcolor: severityColor,
          }}
        />

        <Box sx={{ flexGrow: 1 }}>
          <Typography
            variant="body1"
            fontWeight={500}
            sx={{
              color: "white",
              mb: 1,
              lineHeight: 1.4,
            }}
          >
            {issue.description}
          </Typography>

          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, flexWrap: "wrap" }}>
            <Chip
              size="small"
              label={getSeverityLabel(issue.severity)}
              sx={{
                height: 20,
                fontSize: "0.65rem",
                fontWeight: 700,
                bgcolor: alpha(severityColor, 0.15),
                color: severityColor,
                border: "none",
              }}
            />

            <Chip
              size="small"
              label={`${issue.count} ${
                issue.count === 1 ? "место" : issue.count < 5 ? "места" : "мест"
              }`}
              sx={{
                height: 20,
                fontSize: "0.65rem",
                bgcolor: alpha(theme.palette.text.secondary, 0.1),
                color: "text.secondary",
                border: "none",
              }}
            />

            {issue.can_autocorrect && (
              <Chip
                size="small"
                icon={<AutoFixHighIcon style={{ fontSize: 10 }} />}
                label="Авто"
                sx={{
                  height: 20,
                  fontSize: "0.65rem",
                  bgcolor: alpha(theme.palette.success.main, 0.15),
                  color: theme.palette.success.main,
                  border: "none",
                  "& .MuiChip-icon": { color: theme.palette.success.main },
                }}
              />
            )}
          </Box>
        </Box>

        <IconButton
          size="small"
          sx={{
            color: "text.secondary",
            transform: expanded ? "rotate(180deg)" : "rotate(0deg)",
            transition: "transform 0.2s",
          }}
        >
          <ExpandMoreIcon fontSize="small" />
        </IconButton>
      </Box>

      <Collapse in={expanded} timeout={200}>
        <Box sx={{ px: 2, pb: 2, ml: 4 }}>
          <Box
            sx={{
              p: 1.5,
              borderRadius: 1,
              bgcolor: alpha(theme.palette.background.default, 0.5),
              border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
            }}
          >
            <Typography
              variant="caption"
              color="text.secondary"
              fontWeight={700}
              sx={{
                textTransform: "uppercase",
                mb: 1,
                display: "block",
                letterSpacing: 1,
                fontSize: "0.65rem",
              }}
            >
              Расположение
            </Typography>
            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
              {issue.locations.map((loc: string, idx: number) => (
                <Chip
                  key={idx}
                  label={loc}
                  size="small"
                  sx={{
                    bgcolor: alpha(theme.palette.background.paper, 1),
                    color: "text.secondary",
                    fontSize: "0.7rem",
                    height: 24,
                    border: `1px solid ${alpha(theme.palette.divider, 0.2)}`,
                  }}
                />
              ))}
            </Box>
          </Box>
        </Box>
      </Collapse>
    </Paper>
  );
};

// ============================================================================
// Main Component
// ============================================================================

const isLocal: boolean =
  typeof window !== "undefined" &&
  (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1");

const API_BASE: string = isLocal
  ? "http://localhost:5000"
  : process.env.REACT_APP_API_BASE || "https://cursa.onrender.com";

/**
 * ReportPage Component
 *
 * Displays document validation results with:
 * - Overall grade and score
 * - Statistics (total issues, by severity)
 * - Detailed issue list with grouping
 * - Download options for corrected document
 * - Manual fix guides
 */
const ReportPage: FC<ReportPageProps> = ({ className = "" }) => {
  const theme: Theme = useTheme();
  const location = useLocation();
  const navigate = useNavigate();

  // Extract location state
  const { reportData, fileName, profileId, profileName } = (location.state || {}) as LocationState;

  // State
  const [isDownloading, setIsDownloading] = useState<boolean>(false);
  const [showManualGuides, setShowManualGuides] = useState<boolean>(false);

  /**
   * Navigate back to upload
   */
  const handleGoBack = useCallback(() => {
    navigate("/");
  }, [navigate]);

  /**
   * Download corrected document
   */
  const handleDownload = useCallback(async (): Promise<void> => {
    if (!reportData?.document_id) return;

    setIsDownloading(true);
    try {
      const response = await axios.get(
        `${API_BASE}/api/document/${reportData.document_id}/download`,
        {
          responseType: "blob",
        },
      );

      const blob = new Blob([response.data], {
        type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${fileName}_corrected.docx`;
      document.body.appendChild(link);
      link.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(link);
    } catch (error) {
      console.error("Download error:", error);
    } finally {
      setIsDownloading(false);
    }
  }, [reportData, fileName]);

  // Calculate statistics
  const issues: ValidationIssue[] = useMemo(() => {
    return reportData?.issues || reportData?.validation_result?.issues || [];
  }, [reportData]);
  const groupedIssues: GroupedIssue[] = useMemo(() => groupIssues(issues), [issues]);

  const highSeverityCount: number = issues.filter(
    (i: ValidationIssue) => i.severity === "critical" || i.severity === "error",
  ).length;
  const mediumSeverityCount: number = issues.filter(
    (i: ValidationIssue) => i.severity === "warning",
  ).length;
  const lowSeverityCount: number = issues.filter(
    (i: ValidationIssue) => i.severity === "info",
  ).length;

  const grade: DocumentGrade = useMemo(
    () => getDocumentGrade(issues.length, highSeverityCount, mediumSeverityCount, lowSeverityCount),
    [issues.length, highSeverityCount, mediumSeverityCount, lowSeverityCount],
  );

  // Handle no report
  if (!reportData) {
    return (
      <Box
        className={className}
        sx={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          bgcolor: "background.default",
        }}
      >
        <Stack alignItems="center">
          <CircularProgress />
          <Typography variant="body1" sx={{ mt: 2 }}>
            Загрузка отчета...
          </Typography>
          <Button variant="text" onClick={handleGoBack} sx={{ mt: 2 }}>
            Вернуться
          </Button>
        </Stack>
      </Box>
    );
  }

  return (
    <Box
      className={className}
      sx={{
        minHeight: "100vh",
        bgcolor: "background.default",
      }}
    >
      {/* Header */}
      <Box
        sx={{
          px: { xs: 2, md: 4 },
          py: 3,
          borderBottom: "1px solid",
          borderColor: "divider",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          position: "sticky",
          top: 0,
          zIndex: 10,
          backdropFilter: "blur(10px)",
          bgcolor: alpha(theme.palette.background.default, 0.95),
        }}
      >
        <Button startIcon={<ArrowBackIcon />} onClick={handleGoBack} sx={{ textTransform: "none" }}>
          Назад
        </Button>
        <Stack direction="row" spacing={1}>
          <Tooltip title="Распечатать">
            <IconButton onClick={() => window.print()}>
              <PrintIcon />
            </IconButton>
          </Tooltip>
        </Stack>
      </Box>

      {/* Main Content */}
      <Container maxWidth="lg" sx={{ py: 4 }}>
        {/* Grade Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Paper
            elevation={0}
            sx={{
              p: 4,
              borderRadius: 2,
              background: `linear-gradient(135deg, ${theme.palette.primary.main}20 0%, ${theme.palette.primary.main}05 100%)`,
              border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
              mb: 4,
              textAlign: "center",
            }}
          >
            <Typography variant="body2" color="primary" fontWeight={600} sx={{ mb: 1 }}>
              ОЦЕНКА ДОКУМЕНТА
            </Typography>
            <Typography
              variant="h2"
              fontWeight={700}
              sx={{ mb: 2, color: grade.color === "success" ? "#10b981" : "#ef4444" }}
            >
              {grade.label}
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
              {grade.description}
            </Typography>
            <Stack direction="row" spacing={2} justifyContent="center" flexWrap="wrap">
              <Button
                variant="contained"
                endIcon={<DownloadIcon />}
                onClick={handleDownload}
                disabled={
                  isDownloading ||
                  !(reportData?.corrected_document_url || reportData?.corrected_file_path)
                }
              >
                {isDownloading ? "Загрузка..." : "Скачать исправленный файл"}
              </Button>
              <Button variant="outlined" onClick={() => setShowManualGuides(!showManualGuides)}>
                {showManualGuides ? "Скрыть" : "Показать"} руководства
              </Button>
            </Stack>
          </Paper>
        </motion.div>

        {/* Statistics */}
        <Grid container spacing={2} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <StatsCard value={issues.length} title="Всего проблем" color="#ef4444" />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatsCard value={highSeverityCount} title="Критических" color="#ec4899" />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatsCard value={mediumSeverityCount} title="Средних" color="#f59e0b" />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatsCard value={lowSeverityCount} title="Низких" color="#3b82f6" />
          </Grid>
        </Grid>

        {/* Issues Section */}
        <Paper
          elevation={0}
          sx={{ p: 3, borderRadius: 2, border: "1px solid", borderColor: "divider" }}
        >
          <Typography variant="h5" fontWeight={700} sx={{ mb: 3 }}>
            Сводка проблем
          </Typography>
          <Stack spacing={0}>
            {groupedIssues.length > 0 ? (
              groupedIssues.map((issue: GroupedIssue, index: number) => (
                <IssueItem key={index} issue={issue} index={index} />
              ))
            ) : (
              <Box sx={{ py: 4, textAlign: "center" }}>
                <CheckCircleIcon sx={{ fontSize: 48, color: "success.main", mb: 1 }} />
                <Typography variant="body1" color="success.main">
                  Документ прошел проверку без ошибок!
                </Typography>
              </Box>
            )}
          </Stack>
        </Paper>

        {/* Divider */}
        <Divider sx={{ my: 4 }} />

        {/* Footer */}
        <Box sx={{ textAlign: "center", py: 2 }}>
          <Typography variant="caption" color="text.secondary">
            Отчет создан для: {fileName} | Профиль: {profileName}
          </Typography>
        </Box>
      </Container>
    </Box>
  );
};

export default ReportPage;
