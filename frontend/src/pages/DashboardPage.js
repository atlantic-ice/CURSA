import ArrowDownwardIcon from "@mui/icons-material/ArrowDownward";
import ArrowForwardIosIcon from "@mui/icons-material/ArrowForwardIos";
import ArrowUpwardIcon from "@mui/icons-material/ArrowUpward";
import AssessmentOutlinedIcon from "@mui/icons-material/AssessmentOutlined";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import FileCopyOutlinedIcon from "@mui/icons-material/FileCopyOutlined";
import NoteAddOutlinedIcon from "@mui/icons-material/NoteAddOutlined";
import TuneOutlinedIcon from "@mui/icons-material/TuneOutlined";
import { Box, Button, Grid, IconButton, Typography, useTheme } from "@mui/material";
import { motion } from "framer-motion";
import { useContext, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  Bar,
  BarChart,
  Cell,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  XAxis,
} from "recharts";
import { AuthContext, CheckHistoryContext } from "../App";
import usePageStyles from "../hooks/usePageStyles";

const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.07 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } },
};

const StatCard = ({ title, value, icon, isDark, trend }) => {
  const hasTrend = trend !== null && trend !== undefined;
  const trendUp = hasTrend && trend > 0;
  const trendDown = hasTrend && trend < 0;
  const trendColor = trendUp ? "#34d399" : trendDown ? "#f87171" : "rgba(128,128,128,0.7)";

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

const RecentFileItem = ({ name, status, date, isDark, onClick }) => {
  const isReady = status === "Готово";
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
          <IconButton
            size="small"
            onClick={onClick}
            sx={{ color: isDark ? "rgba(255,255,255,0.2)" : "rgba(0,0,0,0.2)", p: 0.25 }}
          >
            <ArrowForwardIosIcon sx={{ fontSize: 11 }} />
          </IconButton>
        </Box>
      </Box>
    </motion.div>
  );
};

const SCORE_COLORS = {
  5: "#34d399",
  4: "#34d399",
  3: "#fbbf24",
  2: "#f87171",
  1: "#f87171",
};

const ActivityWidget = ({
  history,
  isDark,
  textPrimary,
  textMuted,
  borderColor,
  borderColorSubtle,
}) => {
  const theme = useTheme();
  const last7Days = useMemo(
    () =>
      Array.from({ length: 7 }, (_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - (6 - i));
        return d;
      }),
    [],
  );

  const chartData = useMemo(
    () =>
      last7Days.map((day, i) => {
        const start = new Date(day.getFullYear(), day.getMonth(), day.getDate()).getTime();
        const end = start + 86400000 - 1;
        const count = history.filter((h) => {
          const t = h.timestamp || h.id;
          return t >= start && t <= end;
        }).length;
        return {
          label: day.toLocaleDateString("ru-RU", { weekday: "short" }).slice(0, 2),
          date: day.toLocaleDateString("ru-RU", { day: "numeric", month: "short" }),
          count,
          isToday: i === 6,
        };
      }),
    [last7Days, history],
  );

  const totalWeek = chartData.reduce((a, b) => a + b.count, 0);
  const todayCount = chartData[6].count;

  const avgScore =
    history.length > 0
      ? (history.reduce((acc, h) => acc + (h.score || 0), 0) / history.length).toFixed(1)
      : "—";

  const CustomTooltip = ({ active, payload }) => {
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
          borderColor: borderColorSubtle,
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

      {/* Body */}
      <Box sx={{ p: 3 }}>
        {/* Week total */}
        <Box sx={{ mb: 2.5 }}>
          <Typography
            sx={{
              fontSize: "2rem",
              fontWeight: 700,
              color: textPrimary,
              lineHeight: 1,
              fontFamily: "'Wix Madefor Display', sans-serif",
            }}
          >
            {totalWeek}
          </Typography>
          <Typography sx={{ fontSize: "0.72rem", color: textMuted, mt: 0.3 }}>
            проверок за 7 дней
          </Typography>
        </Box>

        {/* Recharts Bar chart */}
        <Box sx={{ mx: -1 }}>
          <ResponsiveContainer width="100%" height={80}>
            <BarChart
              data={chartData}
              margin={{ top: 4, right: 4, left: 4, bottom: 0 }}
              barCategoryGap="30%"
            >
              <XAxis
                dataKey="label"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 10, fill: textMuted, fontWeight: 400 }}
                dy={4}
              />
              <RechartsTooltip
                content={<CustomTooltip />}
                cursor={{ fill: isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.04)", radius: 3 }}
              />
              <Bar dataKey="count" radius={[3, 3, 0, 0]} minPointSize={3} maxBarSize={32}>
                {chartData.map((entry, i) => (
                  <Cell
                    key={i}
                    fill={
                      entry.isToday
                        ? theme.palette.primary.main
                        : entry.count > 0
                          ? isDark
                            ? "rgba(255,255,255,0.25)"
                            : "rgba(0,0,0,0.2)"
                          : isDark
                            ? "rgba(255,255,255,0.07)"
                            : "rgba(0,0,0,0.07)"
                    }
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Box>

        {/* Stats row */}
        {history.length > 0 && (
          <Box
            sx={{
              mt: 2.5,
              pt: 2.5,
              borderTop: "1px solid",
              borderColor,
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 1.5,
            }}
          >
            <Box>
              <Typography
                sx={{
                  fontSize: "0.62rem",
                  color: textMuted,
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                  mb: 0.5,
                  fontWeight: 600,
                }}
              >
                Всего
              </Typography>
              <Typography
                sx={{
                  fontSize: "1.15rem",
                  fontWeight: 700,
                  color: textPrimary,
                  fontFamily: "'Wix Madefor Display', sans-serif",
                }}
              >
                {history.length}
              </Typography>
            </Box>
            <Box>
              <Typography
                sx={{
                  fontSize: "0.62rem",
                  color: textMuted,
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                  mb: 0.5,
                  fontWeight: 600,
                }}
              >
                Ср. балл
              </Typography>
              <Typography
                sx={{
                  fontSize: "1.15rem",
                  fontWeight: 700,
                  color:
                    avgScore !== "—"
                      ? SCORE_COLORS[Math.round(parseFloat(avgScore))] || textPrimary
                      : textPrimary,
                  fontFamily: "'Wix Madefor Display', sans-serif",
                }}
              >
                {avgScore}
              </Typography>
            </Box>
          </Box>
        )}

        {history.length === 0 && (
          <Box sx={{ textAlign: "center", py: 2 }}>
            <Typography sx={{ fontSize: "0.78rem", color: textMuted }}>
              Нет данных за неделю
            </Typography>
          </Box>
        )}
      </Box>
    </Box>
  );
};

export default function DashboardPage() {
  const navigate = useNavigate();
  const { isDark, textPrimary, textMuted, borderColor, borderColorSubtle, contentPaddingX } =
    usePageStyles();
  const { history } = useContext(CheckHistoryContext);
  const { user } = useContext(AuthContext);

  const greeting = (() => {
    const h = new Date().getHours();
    if (h < 12) return "Доброе утро";
    if (h < 18) return "Добрый день";
    return "Добрый вечер";
  })();
  const displayName =
    user?.first_name || user?.name?.split(" ")[0] || user?.email?.split("@")[0] || "пользователь";

  // Статистика из реальной истории
  const totalChecks = history.length;
  const successChecks = history.filter((h) => h.totalIssues === 0 || h.score >= 4).length;
  const avgScore =
    history.length > 0
      ? (history.reduce((acc, h) => acc + (h.score || 0), 0) / history.length).toFixed(1)
      : "—";

  // Недельные тренды (сравнение текущей и прошлой недели)
  const { weekTrend, successTrend, avgScoreTrend } = useMemo(() => {
    const now = Date.now();
    const oneWeek = 7 * 24 * 60 * 60 * 1000;
    const thisWeekItems = history.filter((h) => now - h.id <= oneWeek);
    const lastWeekItems = history.filter((h) => h.id > now - 2 * oneWeek && h.id <= now - oneWeek);

    const wt = lastWeekItems.length > 0 ? thisWeekItems.length - lastWeekItems.length : null;
    const lwSuccess = lastWeekItems.filter((h) => h.totalIssues === 0 || h.score >= 4).length;
    const twSuccess = thisWeekItems.filter((h) => h.totalIssues === 0 || h.score >= 4).length;
    const st = lastWeekItems.length > 0 ? twSuccess - lwSuccess : null;

    const lwAvg =
      lastWeekItems.length > 0
        ? lastWeekItems.reduce((acc, h) => acc + (h.score || 0), 0) / lastWeekItems.length
        : null;
    const twAvg =
      thisWeekItems.length > 0
        ? thisWeekItems.reduce((acc, h) => acc + (h.score || 0), 0) / thisWeekItems.length
        : null;
    const ast = lwAvg !== null && twAvg !== null ? parseFloat((twAvg - lwAvg).toFixed(1)) : null;

    return { weekTrend: wt, successTrend: st, avgScoreTrend: ast };
  }, [history]);

  // Последние 4 записи для таблицы
  const recentFiles = history.slice(0, 4);

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
      {/* Header */}
      <Box
        sx={{
          mb: 5,
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
            {greeting}, {displayName}!
          </Typography>
          <Typography sx={{ color: textMuted, fontSize: "0.875rem" }}>
            Сводка активности и последние проверки
          </Typography>
        </motion.div>
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
          <Button
            onClick={() => navigate("/")}
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
        </motion.div>
      </Box>

      <Box sx={{ flex: 1, overflowY: "auto", pr: 0.5 }} className="custom-scrollbar">
        <motion.div variants={containerVariants} initial="hidden" animate="show">
          {/* Stats row */}
          <Grid container spacing={2} sx={{ mb: 4 }}>
            <Grid item xs={12} md={4}>
              <StatCard
                isDark={isDark}
                title="Всего проверок"
                value={totalChecks || "0"}
                icon={<FileCopyOutlinedIcon />}
                trend={weekTrend}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <StatCard
                isDark={isDark}
                title="Успешно"
                value={totalChecks > 0 ? successChecks : "0"}
                icon={<CheckCircleOutlineIcon />}
                trend={successTrend}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <StatCard
                isDark={isDark}
                title="Средний балл"
                value={avgScore}
                icon={<AssessmentOutlinedIcon />}
                trend={avgScoreTrend}
              />
            </Grid>
          </Grid>

          <Grid container spacing={3}>
            {/* Recent files */}
            <Grid item xs={12} lg={8}>
              <motion.div variants={itemVariants}>
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
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      borderBottom: "1px solid",
                      borderColor: borderColorSubtle,
                    }}
                  >
                    <Typography
                      sx={{
                        fontWeight: 600,
                        fontSize: "0.9rem",
                        color: textPrimary,
                        letterSpacing: "0.01em",
                      }}
                    >
                      Последние файлы
                    </Typography>
                    <Button
                      size="small"
                      onClick={() => navigate("/history")}
                      sx={{
                        color: textMuted,
                        textTransform: "none",
                        fontSize: "0.78rem",
                        p: 0,
                        "&:hover": { color: textPrimary, bgcolor: "transparent" },
                      }}
                    >
                      Все файлы →
                    </Button>
                  </Box>
                  <Box>
                    {recentFiles.length > 0 ? (
                      recentFiles.map((item) => (
                        <RecentFileItem
                          key={item.id}
                          isDark={isDark}
                          name={item.fileName || "Без названия"}
                          status={item.totalIssues === 0 ? "Готово" : "Требует правок"}
                          date={new Date(item.id).toLocaleDateString("ru-RU", {
                            day: "numeric",
                            month: "long",
                            year: "numeric",
                          })}
                          onClick={() =>
                            navigate("/report", {
                              state: {
                                reportData: item.reportData,
                                fileName: item.fileName,
                                profileId: item.profileId,
                                profileName: item.reportData?.check_results?.profile?.name,
                              },
                            })
                          }
                        />
                      ))
                    ) : (
                      <Box sx={{ p: 4, textAlign: "center" }}>
                        <Typography sx={{ color: textMuted, fontSize: "0.875rem" }}>
                          Проверок пока нет. Загрузите документ для анализа.
                        </Typography>
                      </Box>
                    )}
                  </Box>
                </Box>
              </motion.div>
            </Grid>

            {/* Activity widget */}
            <Grid item xs={12} lg={4}>
              <motion.div variants={itemVariants}>
                <ActivityWidget
                  history={history}
                  isDark={isDark}
                  textPrimary={textPrimary}
                  textMuted={textMuted}
                  borderColor={borderColor}
                  borderColorSubtle={borderColorSubtle}
                />
              </motion.div>

              {/* Quick Actions */}
              <motion.div variants={itemVariants}>
                <Box
                  sx={{
                    mt: 3,
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
                      borderColor: borderColorSubtle,
                    }}
                  >
                    <Typography sx={{ fontWeight: 600, fontSize: "0.9rem", color: textPrimary }}>
                      Быстрые действия
                    </Typography>
                  </Box>
                  <Box>
                    {[
                      {
                        label: "Загрузить документ",
                        sub: "Начать новую проверку",
                        icon: <NoteAddOutlinedIcon />,
                        to: "/",
                      },
                      {
                        label: "Отчёты",
                        sub: "Просмотр всех результатов",
                        icon: <AssessmentOutlinedIcon />,
                        to: "/reports",
                      },
                      {
                        label: "История",
                        sub: `${history.length} проверок всего`,
                        icon: <FileCopyOutlinedIcon />,
                        to: "/history",
                      },
                      {
                        label: "Профили",
                        sub: "Требования вузов и ГОСТ",
                        icon: <TuneOutlinedIcon />,
                        to: "/profiles",
                      },
                    ].map((item) => (
                      <Box
                        key={item.to}
                        onClick={() => navigate(item.to)}
                        sx={{
                          px: 3,
                          py: 1.75,
                          display: "flex",
                          alignItems: "center",
                          gap: 2,
                          cursor: "pointer",
                          borderBottom: "1px solid",
                          borderColor: borderColorSubtle,
                          transition: "background 0.15s",
                          "&:hover": {
                            bgcolor: isDark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.03)",
                          },
                          "&:last-child": { borderBottom: "none" },
                        }}
                      >
                        <Box sx={{ color: textMuted, "& svg": { fontSize: 18 } }}>{item.icon}</Box>
                        <Box sx={{ flex: 1 }}>
                          <Typography
                            sx={{ fontSize: "0.88rem", fontWeight: 500, color: textPrimary }}
                          >
                            {item.label}
                          </Typography>
                          <Typography sx={{ fontSize: "0.75rem", color: textMuted }}>
                            {item.sub}
                          </Typography>
                        </Box>
                        <ArrowForwardIosIcon sx={{ fontSize: 11, color: textMuted }} />
                      </Box>
                    ))}
                  </Box>
                </Box>
              </motion.div>
            </Grid>
          </Grid>
        </motion.div>
      </Box>
    </Box>
  );
}
