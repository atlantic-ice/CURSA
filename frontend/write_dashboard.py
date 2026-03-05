new_dashboard = r"""import ArrowForwardIosIcon from "@mui/icons-material/ArrowForwardIos";
import AssessmentOutlinedIcon from "@mui/icons-material/AssessmentOutlined";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import FileCopyOutlinedIcon from "@mui/icons-material/FileCopyOutlined";
import NoteAddOutlinedIcon from "@mui/icons-material/NoteAddOutlined";
import { Box, Button, Grid, IconButton, Typography } from "@mui/material";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import MemeWidget from "../components/MemeWidget";

const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.07 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } },
};

const StatCard = ({ title, value, icon }) => (
  <motion.div variants={itemVariants}>
    <Box
      sx={{
        p: 3,
        borderRadius: 1,
        border: "1px solid rgba(255,255,255,0.08)",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        bgcolor: "rgba(255,255,255,0.02)",
        transition: "border-color 0.2s, background 0.2s",
        "&:hover": { borderColor: "rgba(255,255,255,0.18)", bgcolor: "rgba(255,255,255,0.04)" },
      }}
    >
      <Box>
        <Typography
          sx={{
            fontSize: "0.7rem",
            fontWeight: 600,
            color: "rgba(255,255,255,0.35)",
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
            color: "#fff",
            lineHeight: 1,
            fontFamily: "'Wix Madefor Display', sans-serif",
          }}
        >
          {value}
        </Typography>
      </Box>
      <Box sx={{ color: "rgba(255,255,255,0.15)", "& svg": { fontSize: 36 } }}>{icon}</Box>
    </Box>
  </motion.div>
);

const RecentFileItem = ({ name, status, date }) => {
  const isReady = status === "Готово";
  return (
    <motion.div variants={itemVariants}>
      <Box
        sx={{
          p: "14px 16px",
          borderBottom: "1px solid rgba(255,255,255,0.05)",
          cursor: "pointer",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          transition: "background 0.15s",
          "&:hover": { bgcolor: "rgba(255,255,255,0.03)" },
          "&:last-child": { borderBottom: "none" },
        }}
      >
        <Box sx={{ flex: 1, overflow: "hidden", mr: 2 }}>
          <Typography
            sx={{
              fontWeight: 500,
              color: "#fff",
              fontSize: "0.88rem",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
              mb: 0.4,
            }}
          >
            {name}
          </Typography>
          <Typography sx={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.3)" }}>
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
          <IconButton size="small" sx={{ color: "rgba(255,255,255,0.2)", p: 0.25 }}>
            <ArrowForwardIosIcon sx={{ fontSize: 11 }} />
          </IconButton>
        </Box>
      </Box>
    </motion.div>
  );
};

export default function DashboardPage() {
  const navigate = useNavigate();

  return (
    <Box
      sx={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        py: 4,
        px: { xs: 3, md: 4 },
      }}
    >
      {/* Header */}
      <Box sx={{ mb: 5, display: "flex", alignItems: "flex-end", justifyContent: "space-between", flexWrap: "wrap", gap: 2 }}>
        <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <Typography
            variant="h4"
            sx={{
              fontWeight: 700,
              letterSpacing: "-0.025em",
              fontFamily: "'Wix Madefor Display', sans-serif",
              color: "#fff",
              mb: 0.5,
            }}
          >
            Панель управления
          </Typography>
          <Typography sx={{ color: "rgba(255,255,255,0.3)", fontSize: "0.875rem" }}>
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
              bgcolor: "#fff",
              color: "#000",
              fontWeight: 600,
              fontSize: "0.8rem",
              textTransform: "none",
              letterSpacing: "0.03em",
              px: 2.5,
              boxShadow: "none",
              "&:hover": { bgcolor: "rgba(255,255,255,0.88)", boxShadow: "none" },
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
              <StatCard title="Всего проверок" value="24" icon={<FileCopyOutlinedIcon />} />
            </Grid>
            <Grid item xs={12} md={4}>
              <StatCard title="Успешно" value="18" icon={<CheckCircleOutlineIcon />} />
            </Grid>
            <Grid item xs={12} md={4}>
              <StatCard title="Средний балл" value="8.4" icon={<AssessmentOutlinedIcon />} />
            </Grid>
          </Grid>

          <Grid container spacing={3}>
            {/* Recent files */}
            <Grid item xs={12} lg={8}>
              <motion.div variants={itemVariants}>
                <Box
                  sx={{
                    borderRadius: 1,
                    border: "1px solid rgba(255,255,255,0.08)",
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
                      borderBottom: "1px solid rgba(255,255,255,0.06)",
                    }}
                  >
                    <Typography sx={{ fontWeight: 600, fontSize: "0.9rem", color: "#fff", letterSpacing: "0.01em" }}>
                      Последние файлы
                    </Typography>
                    <Button size="small" sx={{ color: "rgba(255,255,255,0.3)", textTransform: "none", fontSize: "0.78rem", p: 0, "&:hover": { color: "#fff", bgcolor: "transparent" } }}>
                      Все файлы →
                    </Button>
                  </Box>
                  <Box>
                    <RecentFileItem name="Курсовая_работа_2025.docx" status="Готово" date="2 ноября 2025" />
                    <RecentFileItem name="Отчет_практика.docx" status="Требует правок" date="1 ноября 2025" />
                    <RecentFileItem name="Диплом_глава1.docx" status="Готово" date="30 октября 2025" />
                    <RecentFileItem name="Реферат_история.docx" status="Готово" date="28 октября 2025" />
                  </Box>
                </Box>
              </motion.div>
            </Grid>

            {/* Meme / motivation widget */}
            <Grid item xs={12} lg={4}>
              <motion.div variants={itemVariants}>
                <Box
                  sx={{
                    borderRadius: 1,
                    border: "1px solid rgba(255,255,255,0.08)",
                    overflow: "hidden",
                    height: "100%",
                    display: "flex",
                    flexDirection: "column",
                  }}
                >
                  <Box sx={{ px: 3, py: 2.5, borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                    <Typography sx={{ fontWeight: 600, fontSize: "0.9rem", color: "#fff" }}>
                      Мотивация дня
                    </Typography>
                  </Box>
                  <Box sx={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", minHeight: 200, bgcolor: "rgba(255,255,255,0.01)", p: 2 }}>
                    <MemeWidget />
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
"""

with open("src/pages/DashboardPage.js", "w", encoding="utf-8") as f:
    f.write(new_dashboard)
print("DashboardPage done")
