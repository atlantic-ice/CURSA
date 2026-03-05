import ArrowDownwardIcon from "@mui/icons-material/ArrowDownward";
import ArrowForwardIosIcon from "@mui/icons-material/ArrowForwardIos";
import ArrowUpwardIcon from "@mui/icons-material/ArrowUpward";
import AssessmentOutlinedIcon from "@mui/icons-material/AssessmentOutlined";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import FileCopyOutlinedIcon from "@mui/icons-material/FileCopyOutlined";
import NoteAddOutlinedIcon from "@mui/icons-material/NoteAddOutlined";
import TuneOutlinedIcon from "@mui/icons-material/TuneOutlined";
import { Box, Button, Grid, IconButton, Theme, Tooltip, Typography, useTheme } from "@mui/material";
import { motion } from "framer-motion";
import { FC, useContext, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  Bar,
  BarChart,
  Cell,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  XAxis,
} from "recharts";
import { AuthContext, CheckHistoryContext } from "../App";
import usePageStyles from "../hooks/usePageStyles";
import type { User } from "../types";

// ============================================================================
// Type Definitions
// ============================================================================

interface DashboardPageProps {
  className?: string;
}

interface AuthContextType {
  user: User | null;
}

interface HistoryItem {
  id?: string;
  fileName: string;
  timestamp: number;
  totalIssues: number;
  score: number;
  status?: "Готово" | "Обработка" | "Ошибка";
  reportData?: unknown;
  profileId?: string;
}

interface CheckHistoryContextType {
  history: HistoryItem[];
}

interface ChartDataPoint {
  label: string;
  date: string;
  count: number;
  isToday?: boolean;
}

interface StatCardProps {
  title: string;
  value: number;
  icon: React.ReactNode;
  isDark: boolean;
  trend?: number | null;
}

// ============================================================================
// Variants & Animations
// ============================================================================

const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.07 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } },
};

// ============================================================================
// Sub-Components
// ============================================================================

/**
 * Statistics card component
 */
const StatCard: FC<StatCardProps> = ({ title, value, icon, isDark, trend }) => {
  const hasTrend: boolean = trend !== null && trend !== undefined;
  const trendUp: boolean = hasTrend && trend! > 0;
  const trendDown: boolean = hasTrend && trend! < 0;
  const trendColor: string = trendUp ? "#34d399" : trendDown ? "#f87171" : "rgba(128,128,128,0.7)";

  return (
    <motion.div variants={itemVariants}>
      <Box
        sx={{
          p: 3,
          borderRadius: 1,
          border: "1px solid",
          borderColor: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          bgcolor: isDark ? "rgba(255,255,255,0.02)" : "rgba(0,0,0,0.02)",
          transition: "border-color 0.2s, background 0.2s",
          "&:hover": {
            borderColor: isDark ? "rgba(255,255,255,0.18)" : "rgba(0,0,0,0.16)",
            bgcolor: isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.04)",
          },
        }}
      >
        <Box>
          <Typography
            sx={{
              fontSize: "0.7rem",
              fontWeight: 600,
              color: isDark ? "rgba(255,255,255,0.35)" : "rgba(0,0,0,0.4)",
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              mb: 1,
            }}
          >
            {title}
          </Typography>
          <Typography
            sx={{
              fontSize: "2rem",
              fontWeight: 700,
              color: isDark ? "#fff" : "#000",
              lineHeight: 1,
              fontFamily: "'Wix Madefor Display', sans-serif",
            }}
          >
            {value}
          </Typography>
          {hasTrend && (
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.3, mt: 0.8 }}>
              {trendUp && <ArrowUpwardIcon sx={{ fontSize: 12, color: trendColor }} />}
              {trendDown && <ArrowDownwardIcon sx={{ fontSize: 12, color: trendColor }} />}
              <Typography sx={{ fontSize: "0.72rem", color: trendColor, fontWeight: 500 }}>
                {trendUp ? `+${trend}` : trend} за неделю
              </Typography>
            </Box>
          )}
        </Box>
        <Box
          sx={{
            color: isDark ? "rgba(255,255,255,0.15)" : "rgba(0,0,0,0.15)",
            "& svg": { fontSize: 36 },
          }}
        >
          {icon}
        </Box>
      </Box>
    </motion.div>
  );
};

/**
 * Recent file item component
 */
interface RecentFileItemProps {
  name: string;
  status: "Готово" | "Обработка" | "Ошибка";
  date: string;
  isDark: boolean;
  onClick: () => void;
}

const RecentFileItem: FC<RecentFileItemProps> = ({ name, status, date, isDark, onClick }) => {
  const isReady: boolean = status === "Готово";
  return (
    <motion.div variants={itemVariants}>
      <Box
        onClick={onClick}
        sx={{
          p: "14px 16px",
          borderBottom: "1px solid",
          borderColor: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.06)",
          cursor: "pointer",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          transition: "background 0.15s",
          "&:hover": { bgcolor: isDark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.03)" },
          "&:last-child": { borderBottom: "none" },
        }}
      >
        <Box sx={{ flex: 1, overflow: "hidden", mr: 2 }}>
          <Typography
            sx={{
              fontWeight: 500,
              color: isDark ? "#fff" : "#000",
              fontSize: "0.88rem",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
              mb: 0.4,
            }}
          >
            {name}
          </Typography>
          <Typography
            sx={{
              fontSize: "0.75rem",
              color: isDark ? "rgba(255,255,255,0.3)" : "rgba(0,0,0,0.4)",
            }}
          >
            {date}
          </Typography>
        </Box>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, flexShrink: 0 }}>
          <Box
            sx={{
              px: 1.5,
              py: 0.3,
              borderRadius: 0.5,
              border: "1px solid",
              borderColor: isReady ? "rgba(52,211,153,0.25)" : "rgba(251,191,36,0.25)",
              bgcolor: isReady ? "rgba(52,211,153,0.07)" : "rgba(251,191,36,0.07)",
            }}
          >
            <Typography
              sx={{
                fontSize: "0.7rem",
                fontWeight: 600,
                letterSpacing: "0.04em",
                color: isReady ? "#34d399" : "#fbbf24",
              }}
            >
              {status}
            </Typography>
          </Box>
          <Tooltip title="Открыть отчет">
            <IconButton
              size="small"
              onClick={onClick}
              sx={{ color: isDark ? "rgba(255,255,255,0.2)" : "rgba(0,0,0,0.2)", p: 0.25 }}
            >
              <ArrowForwardIosIcon sx={{ fontSize: 11 }} />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>
    </motion.div>
  );
};

/**
 * Activity chart component
 */
interface ActivityChartProps {
  history: HistoryItem[];
  isDark: boolean;
  textPrimary: string;
  textMuted: string;
  borderColor: string;
}

const ActivityChart: FC<ActivityChartProps> = ({ history, isDark, textPrimary, textMuted, borderColor }) => {
  const theme: Theme = useTheme();

  const last7Days: Date[] = useMemo(
    () =>
      Array.from({ length: 7 }, (_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - (6 - i));
        return d;
      }),
    [],
  );

  const chartData: ChartDataPoint[] = useMemo(
    () =>
      last7Days.map((day, i) => {
        const start = new Date(day.getFullYear(), day.getMonth(), day.getDate()).getTime();
        const end = start + 86400000 - 1;
        const count = history.filter((h: HistoryItem) => {
          const t = (h.timestamp || h.id) as number;
          return t >= start && t <= end;
        }).length;
        return {
          label: day
            .toLocaleDateString("ru-RU", { weekday: "short" })
            .slice(0, 2)
            .toUpperCase(),
          date: day.toLocaleDateString("ru-RU", { day: "numeric", month: "short" }),
          count,
          isToday: i === 6,
        };
      }),
    [last7Days, history],
  );

  const totalWeek: number = chartData.reduce((a, b) => a + b.count, 0);
  const todayCount: number = chartData[6]?.count || 0;
  const avgScore: string =
    history.length > 0
      ? (history.reduce((acc, h: HistoryItem) => acc + (h.score || 0), 0) / history.length).toFixed(1)
      : "—";

  interface CustomTooltipProps {
    active?: boolean;
    payload?: Array<{ payload: ChartDataPoint }>;
  }

  const CustomTooltip: FC<CustomTooltipProps> = ({ active, payload }) => {
    if (!active || !payload?.length) return null;
    const { date, count } = payload[0].payload;
    return (
      <Box
        sx={{
          bgcolor: isDark ? "rgba(20,20,20,0.95)" : "rgba(255,255,255,0.97)",
          border: "1px solid",
          borderColor,
          borderRadius: 1,
          px: 1.5,
          py: 1,
          boxShadow: "0 4px 16px rgba(0,0,0,0.12)",
        }}
      >
        <Typography sx={{ fontSize: "0.7rem", color: textMuted, mb: 0.3 }}>{date}</Typography>
        <Typography sx={{ fontSize: "0.85rem", fontWeight: 700, color: textPrimary }}>
          {count} проверок
        </Typography>
      </Box>
    );
  };

  return (
    <Box
      sx={{
        borderRadius: 1,
        border: "1px solid",
        borderColor,
        overflow: "hidden",
      }}
    >
      {/* Header */}
      <Box
        sx={{
          px: 3,
          py: 2.5,
          borderBottom: "1px solid",
          borderColor: "rgba(0,0,0,0.06)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <Typography sx={{ fontWeight: 600, fontSize: "0.9rem", color: textPrimary }}>
          Активность
        </Typography>
        {todayCount > 0 && (
          <Box
            sx={{
              px: 1.25,
              py: 0.25,
              borderRadius: 0.5,
              bgcolor: "rgba(52,211,153,0.1)",
              border: "1px solid rgba(52,211,153,0.2)",
            }}
          >
            <Typography sx={{ fontSize: "0.7rem", fontWeight: 600, color: "#34d399" }}>
              {todayCount} сегодня
            </Typography>
          </Box>
        )}
      </Box>

      {/* Chart */}
      <Box sx={{ p: 3 }}>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={chartData}>
            <XAxis dataKey="label" stroke={textMuted} />
            <RechartsTooltip content={<CustomTooltip />} />
            <Bar dataKey="count" radius={[6, 6, 0, 0]} fill="#3b82f6">
              {(chartData as ChartDataPoint[]).map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={entry.isToday ? "#10b981" : "#3b82f6"}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </Box>

      {/* Footer Stats */}
      <Box
        sx={{
          px: 3,
          py: 2.5,
          borderTop: "1px solid",
          borderColor: "rgba(0,0,0,0.06)",
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 2,
        }}
      >
        <Box>
          <Typography sx={{ fontSize: "0.7rem", color: textMuted, fontWeight: 600, mb: 0.5 }}>
            ВСЕГО НА НЕДЕЛЮ
          </Typography>
          <Typography sx={{ fontSize: "1.4rem", fontWeight: 700, color: textPrimary }}>
            {totalWeek}
          </Typography>
        </Box>
        <Box>
          <Typography sx={{ fontSize: "0.7rem", color: textMuted, fontWeight: 600, mb: 0.5 }}>
            СРЕДНЯЯ ОЦЕНКА
          </Typography>
          <Typography sx={{ fontSize: "1.4rem", fontWeight: 700, color: textPrimary }}>
            {avgScore}
          </Typography>
        </Box>
      </Box>
    </Box>
  );
};

// ============================================================================
// Main Component
// ============================================================================

/**
 * DashboardPage Component
 * 
 * Shows user statistics:
 * - Total documents processed
 * - Average score
 * - Recent files with status
 * - Weekly activity chart
 * - Quick action buttons
 */
const DashboardPage: FC<DashboardPageProps> = ({ className = "" }) => {
  const theme: Theme = useTheme();
  const navigate = useNavigate();
  
  const { user } = useContext(AuthContext) as AuthContextType;
  const { history } = useContext(CheckHistoryContext) as CheckHistoryContextType;
  const { textMuted, textSubtle } = usePageStyles();

  const isDark: boolean = theme.palette.mode === "dark";
  const textPrimary: string = isDark ? "#ffffff" : "#000000";
  const borderColor: string = isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)";

  // Calculate statistics
  const totalDocuments: number = history.length;
  const successCount: number = history.filter((h: HistoryItem) => h.status === "Готово").length;
  const recentFiles: HistoryItem[] = history.slice(-5).reverse();
  const averageScore: number =
    history.length > 0 ? history.reduce((acc, h: HistoryItem) => acc + (h.score || 0), 0) / history.length : 0;

  const handleOpenUpload = (): void => {
    navigate("/");
  };

  const handleOpenRecent = (index: number): void => {
    const file = recentFiles[index];
    if (file) {
      navigate("/report", {
        state: {
          reportData: file.reportData,
          fileName: file.fileName,
          profileId: file.profileId || "default_gost",
        },
      });
    }
  };

  return (
    <Box className={className} sx={{ minHeight: "100vh", bgcolor: "background.default", py: 4 }}>
      {/* Header */}
      <Box sx={{ px: { xs: 2, md: 4 }, mb: 4 }}>
        <Typography variant="h4" fontWeight={700} sx={{ mb: 1 }}>
          Хорошего дня, {user?.name || "гость"}! 👋
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Вот обзор вашей активности
        </Typography>
      </Box>

      {/* Quick Actions */}
      <Box
        sx={{
          px: { xs: 2, md: 4 },
          mb: 4,
          display: "flex",
          gap: 2,
          flexWrap: "wrap",
        }}
      >
        <Button
          variant="contained"
          startIcon={<NoteAddOutlinedIcon />}
          onClick={handleOpenUpload}
          sx={{ textTransform: "none", fontWeight: 600 }}
        >
          新提交
        </Button>
        <Button
          variant="outlined"
          startIcon={<AssessmentOutlinedIcon />}
          sx={{ textTransform: "none", fontWeight: 600 }}
        >
          Мои отчеты
        </Button>
        <Button
          variant="outlined"
          startIcon={<TuneOutlinedIcon />}
          sx={{ textTransform: "none", fontWeight: 600 }}
        >
          Профили
        </Button>
      </Box>

      {/* Statistics Grid */}
      <Box sx={{ px: { xs: 2, md: 4 }, mb: 4 }}>
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="show"
        >
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard
                title="Всего документов"
                value={totalDocuments}
                icon={<FileCopyOutlinedIcon />}
                isDark={isDark}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard
                title="Успешно"
                value={successCount}
                icon={<CheckCircleOutlineIcon />}
                isDark={isDark}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard
                title="Средняя оценка"
                value={Math.round(averageScore * 10) / 10}
                icon={<AssessmentOutlinedIcon />}
                isDark={isDark}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard
                title="Сегодня"
                value={
                  history.filter((h: HistoryItem) => {
                    const today = new Date().toDateString();
                    return new Date(h.timestamp).toDateString() === today;
                  }).length
                }
                icon={<NoteAddOutlinedIcon />}
                isDark={isDark}
              />
            </Grid>
          </Grid>
        </motion.div>
      </Box>

      {/* Main Content Grid */}
      <Box sx={{ px: { xs: 2, md: 4 } }}>
        <Grid container spacing={3}>
          {/* Activity Chart */}
          <Grid item xs={12} md={8}>
            <ActivityChart
              history={history}
              isDark={isDark}
              textPrimary={textPrimary}
              textMuted={textMuted}
              borderColor={borderColor}
            />
          </Grid>

          {/* Recent Files */}
          <Grid item xs={12} md={4}>
            <Box
              sx={{
                borderRadius: 1,
                border: "1px solid",
                borderColor,
                overflow: "hidden",
              }}
            >
              <Box
                sx={{
                  px: 3,
                  py: 2.5,
                  borderBottom: "1px solid",
                  borderColor: "rgba(0,0,0,0.06)",
                }}
              >
                <Typography sx={{ fontWeight: 600, fontSize: "0.9rem", color: textPrimary }}>
                  Недавние файлы
                </Typography>
              </Box>
              <Box sx={{ maxHeight: 400, overflowY: "auto" }}>
                {recentFiles.length > 0 ? (
                  <motion.div variants={containerVariants} initial="hidden" animate="show">
                    {recentFiles.map((file, idx) => (
                      <RecentFileItem
                        key={idx}
                        name={file.fileName}
                        status={file.status || "Готово"}
                        date={new Date(file.timestamp).toLocaleDateString("ru-RU")}
                        isDark={isDark}
                        onClick={() => handleOpenRecent(idx)}
                      />
                    ))}
                  </motion.div>
                ) : (
                  <Box sx={{ p: 3, textAlign: "center" }}>
                    <Typography color="text.secondary">Нет файлов</Typography>
                  </Box>
                )}
              </Box>
            </Box>
          </Grid>
        </Grid>
      </Box>
    </Box>
  );
};

export default DashboardPage;
