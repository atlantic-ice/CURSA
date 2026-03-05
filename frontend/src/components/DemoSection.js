import {
  ErrorOutline as ErrorIcon,
  Info as InfoIcon,
  CheckCircleOutlined as SuccessIcon,
  WarningOutlined as WarningIcon,
} from "@mui/icons-material";
import {
  Box,
  Chip,
  Container,
  Grid,
  Paper,
  Stack,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.2,
      delayChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: "easeOut" },
  },
};

// Issue card с прогрессивной анимацией
const IssueCard = ({ icon: Icon, type, title, severity, details, delay }) => {
  const severityColors = {
    error: { bg: "rgba(239, 68, 68, 0.05)", border: "rgba(239, 68, 68, 0.2)", color: "#fca5a5" },
    warning: {
      bg: "rgba(245, 158, 11, 0.05)",
      border: "rgba(245, 158, 11, 0.2)",
      color: "#fcd34d",
    },
    info: { bg: "rgba(255, 255, 255, 0.05)", border: "rgba(255, 255, 255, 0.2)", color: "#ededed" },
    success: { bg: "rgba(34, 197, 94, 0.05)", border: "rgba(34, 197, 94, 0.2)", color: "#86efac" },
  };

  const style = severityColors[severity];

  return (
    <motion.div variants={itemVariants} transition={{ delay }}>
      <Paper
        elevation={0}
        sx={{
          p: 2.5,
          background: style.bg,
          border: `1px solid ${style.border}`,
          borderRadius: 60,
          cursor: "default",
          transition: "all 0.2s ease",
          "&:hover": {
            transform: "translateX(4px)",
            boxShadow: "none",
          },
        }}
      >
        <Stack spacing={1.5}>
          <Box sx={{ display: "flex", gap: 2, alignItems: "flex-start" }}>
            <Box sx={{ color: style.color, mt: 0.5 }}>
              <Icon sx={{ fontSize: 20 }} />
            </Box>
            <Box sx={{ flex: 1 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, color: style.color }}>
                {title}
              </Typography>
              <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.5)" }}>
                {type}
              </Typography>
            </Box>
          </Box>

          {details && (
            <Typography
              variant="body2"
              sx={{ color: "rgba(255,255,255,0.6)", pl: "32px", fontSize: "0.85rem" }}
            >
              {details}
            </Typography>
          )}

          {severity === "error" && (
            <Box sx={{ pl: 4 }}>
              <Chip
                label="Требует исправления"
                size="small"
                variant="outlined"
                sx={{
                  borderColor: style.color,
                  color: style.color,
                  height: 24,
                  fontSize: "0.75rem",
                  fontWeight: 600,
                }}
              />
            </Box>
          )}
        </Stack>
      </Paper>
    </motion.div>
  );
};

// Demo step component
const DemoStep = ({ number, title, active, completed, onClick }) => (
  <motion.div
    onClick={onClick}
    initial={{ opacity: 0, x: -20 }}
    animate={{ opacity: 1, x: 0 }}
    transition={{ delay: number * 0.1 }}
  >
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        gap: 2,
        cursor: "pointer",
        p: 2,
        borderRadius: 60,
        background: active ? "rgba(255, 255, 255, 0.05)" : "transparent",
        border: active ? "1px solid rgba(255, 255, 255, 0.2)" : "1px solid rgba(255,255,255,0.08)",
        transition: "all 0.3s ease",
        "&:hover": {
          background: "rgba(255, 255, 255, 0.03)",
          borderColor: "rgba(255, 255, 255, 0.2)",
        },
      }}
    >
      <Box
        sx={{
          width: 40,
          height: 40,
          borderRadius: "50%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: completed ? "#ededed" : active ? "rgba(255, 255, 255, 0.1)" : "transparent",
          border: completed
            ? "1px solid #ededed"
            : active
              ? "1px solid #ededed"
              : "1px solid rgba(255,255,255,0.2)",
          color: completed ? "#000000" : active ? "#ededed" : "rgba(255,255,255,0.7)",
          fontWeight: 700,
          flexShrink: 0,
        }}
      >
        {completed ? "✓" : number}
      </Box>
      <Box>
        <Typography
          variant="body2"
          sx={{
            fontWeight: 700,
            color: active ? "#ededed" : "rgba(255,255,255,0.7)",
            transition: "color 0.3s ease",
          }}
        >
          {title}
        </Typography>
      </Box>
    </Box>
  </motion.div>
);

export default function DemoSection() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const [activeStep, setActiveStep] = useState(0);
  const [animate, setAnimate] = useState(false);

  useEffect(() => {
    if (activeStep === 1) {
      setAnimate(true);
    }
  }, [activeStep]);

  const steps = [
    { title: "1. Загрузить документ" },
    { title: "2. Анализ" },
    { title: "3. Результаты" },
  ];

  return (
    <Box
      sx={{
        py: 8,
        background: "transparent",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <Container maxWidth="lg">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
        >
          {/* Заголовок */}
          <motion.div variants={itemVariants}>
            <Typography
              variant="h4"
              sx={{
                fontWeight: 700,
                mb: 1,
                textAlign: "center",
                color: "#f8fafc",
              }}
            >
              Как это работает
            </Typography>
            <Typography
              variant="body1"
              sx={{
                color: "rgba(255,255,255,0.6)",
                textAlign: "center",
                mb: 6,
              }}
            >
              Загрузите документ и получите подробный отчёт за 30 секунд
            </Typography>
          </motion.div>

          <Grid container spacing={4}>
            {/* LEFT: Steps */}
            <Grid item xs={12} md={4}>
              <Stack spacing={2}>
                {steps.map((step, idx) => (
                  <DemoStep
                    key={idx}
                    number={idx + 1}
                    title={step.title}
                    active={activeStep === idx}
                    completed={activeStep > idx}
                    onClick={() => setActiveStep(idx)}
                  />
                ))}
              </Stack>
            </Grid>

            {/* RIGHT: Content */}
            <Grid item xs={12} md={8}>
              {activeStep === 0 && (
                <motion.div variants={itemVariants} initial="hidden" animate="visible">
                  <Paper
                    elevation={0}
                    sx={{
                      p: 4,
                      background: "rgba(10, 10, 10, 0.8)",
                      border: "1px dashed rgba(255, 255, 255, 0.2)",
                      borderRadius: 2,
                      textAlign: "center",
                      minHeight: 300,
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                      cursor: "pointer",
                      transition: "all 0.2s ease",
                      "&:hover": {
                        background: "rgba(15, 15, 15, 0.9)",
                        borderColor: "rgba(255, 255, 255, 0.4)",
                      },
                    }}
                    onClick={() => setActiveStep(1)}
                  >
                    <Box
                      sx={{
                        fontSize: 64,
                        mb: 2,
                      }}
                    >
                      📄
                    </Box>
                    <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>
                      Перетащите DOCX документ
                    </Typography>
                    <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.6)" }}>
                      или нажмите для выбора файла
                    </Typography>
                    <Typography
                      variant="caption"
                      sx={{
                        color: "#ededed",
                        mt: 2,
                        cursor: "pointer",
                        "&:hover": { textDecoration: "underline" },
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveStep(1);
                      }}
                    >
                      Или нажмите для предпросмотра →
                    </Typography>
                  </Paper>
                </motion.div>
              )}

              {activeStep === 1 && (
                <motion.div variants={itemVariants} initial="hidden" animate="visible">
                  <Paper
                    elevation={0}
                    sx={{
                      p: 4,
                      background: "rgba(10, 10, 10, 0.8)",
                      border: "1px solid rgba(255, 255, 255, 0.1)",
                      borderRadius: 2,
                      minHeight: 300,
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "center",
                    }}
                  >
                    <Stack spacing={3}>
                      <Box>
                        <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.6)", mb: 1 }}>
                          Анализ документа: Курсовая_работа_2025.docx
                        </Typography>
                        <motion.div
                          animate={animate ? { width: "100%" } : { width: 0 }}
                          transition={{ duration: 2, ease: "easeOut" }}
                        >
                          <Box
                            sx={{
                              height: 4,
                              background: "#ededed",
                              borderRadius: 2,
                            }}
                          />
                        </motion.div>
                      </Box>

                      <Box>
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={animate ? { opacity: 1 } : { opacity: 0 }}
                          transition={{ delay: 0.5 }}
                        >
                          <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.7)" }}>
                            ✓ Проверка шрифтов
                          </Typography>
                        </motion.div>
                      </Box>

                      <Box>
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={animate ? { opacity: 1 } : { opacity: 0 }}
                          transition={{ delay: 0.7 }}
                        >
                          <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.7)" }}>
                            ✓ Проверка полей
                          </Typography>
                        </motion.div>
                      </Box>

                      <Box>
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={animate ? { opacity: 1 } : { opacity: 0 }}
                          transition={{ delay: 0.9 }}
                        >
                          <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.7)" }}>
                            ✓ Проверка форматирования
                          </Typography>
                        </motion.div>
                      </Box>

                      <Box>
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={animate ? { opacity: 1 } : { opacity: 0 }}
                          transition={{ delay: 1.1 }}
                        >
                          <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.7)" }}>
                            ✓ Проверка нумерации
                          </Typography>
                        </motion.div>
                      </Box>

                      {animate && (
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: 1.5 }}
                        >
                          <Box sx={{ textAlign: "center", mt: 2 }}>
                            <Typography
                              variant="body2"
                              sx={{
                                color: "#ededed",
                                cursor: "pointer",
                                "&:hover": { textDecoration: "underline" },
                              }}
                              onClick={() => setActiveStep(2)}
                            >
                              Анализ завершён → Показать результаты
                            </Typography>
                          </Box>
                        </motion.div>
                      )}
                    </Stack>
                  </Paper>
                </motion.div>
              )}

              {activeStep === 2 && (
                <motion.div variants={itemVariants} initial="hidden" animate="visible">
                  <Stack spacing={3}>
                    {/* Summary */}
                    <Paper
                      elevation={0}
                      sx={{
                        p: 3,
                        background: "rgba(10, 10, 10, 0.8)",
                        border: "1px solid rgba(255, 255, 255, 0.1)",
                        borderRadius: 2,
                      }}
                    >
                      <Stack spacing={2}>
                        <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
                          <SuccessIcon sx={{ color: "#86efac" }} />
                          <Typography sx={{ color: "#86efac", fontWeight: 700 }}>
                            Документ проверен: Найдено 7 проблем
                          </Typography>
                        </Box>
                        <Box
                          sx={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 2 }}
                        >
                          <Box>
                            <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.5)" }}>
                              Критичных
                            </Typography>
                            <Typography variant="h5" sx={{ fontWeight: 700, color: "#fca5a5" }}>
                              2
                            </Typography>
                          </Box>
                          <Box>
                            <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.5)" }}>
                              Warnings
                            </Typography>
                            <Typography variant="h5" sx={{ fontWeight: 700, color: "#fcd34d" }}>
                              3
                            </Typography>
                          </Box>
                          <Box>
                            <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.5)" }}>
                              Замечания
                            </Typography>
                            <Typography variant="h5" sx={{ fontWeight: 700, color: "#22d3ee" }}>
                              2
                            </Typography>
                          </Box>
                        </Box>
                      </Stack>
                    </Paper>

                    {/* Issues list */}
                    <Box>
                      <Typography
                        variant="subtitle2"
                        sx={{ fontWeight: 600, mb: 2, color: "rgba(255,255,255,0.7)" }}
                      >
                        Найденные проблемы
                      </Typography>

                      <IssueCard
                        icon={ErrorIcon}
                        type="Formatting Error"
                        title="Неправильный шрифт в заголовке"
                        severity="error"
                        details="Используется Arial 12pt вместо Times New Roman 14pt"
                        delay={0.1}
                      />

                      <IssueCard
                        icon={ErrorIcon}
                        type="Spacing Error"
                        title="Неправильные поля страницы"
                        severity="error"
                        details="Левое поле 2см вместо 3см"
                        delay={0.2}
                      />

                      <IssueCard
                        icon={WarningIcon}
                        type="Warning"
                        title="Межстрочный интервал"
                        severity="warning"
                        details="Используется одиночный интервал вместо 1.5"
                        delay={0.3}
                      />

                      <IssueCard
                        icon={WarningIcon}
                        type="Warning"
                        title="Отступ абзаца"
                        severity="warning"
                        details="Отступ первой строки 1см вместо 1.25см"
                        delay={0.4}
                      />

                      <IssueCard
                        icon={WarningIcon}
                        type="Warning"
                        title="Нумерация при печати"
                        severity="warning"
                        details="Нумерация не начинается с первой страницы"
                        delay={0.5}
                      />

                      <IssueCard
                        icon={InfoIcon}
                        type="Info"
                        title="Рекомендация"
                        severity="info"
                        details="Проверьте библиографию по ГОСТ 7.0.100-2018"
                        delay={0.6}
                      />

                      <IssueCard
                        icon={SuccessIcon}
                        type="Success"
                        title="Все таблицы в порядке"
                        severity="success"
                        details="Таблицы оформлены согласно стандарту"
                        delay={0.7}
                      />
                    </Box>
                  </Stack>
                </motion.div>
              )}
            </Grid>
          </Grid>
        </motion.div>
      </Container>
    </Box>
  );
}
