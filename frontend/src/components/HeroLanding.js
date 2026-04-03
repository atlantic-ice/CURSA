import {
    AutoAwesomeOutlined as AIIcon,
    PsychologyAltOutlined as AnalyzeIcon,
    CheckCircleOutline as CheckIcon,
    DescriptionOutlined as ReportIcon,
    LockOutlined as SecurityIcon,
    SpeedOutlined as SpeedIcon,
    Telegram as TelegramIcon,
    TipsAndUpdatesOutlined as TipIcon,
    FileUploadOutlined as UploadIcon,
} from "@mui/icons-material";
import {
    Box,
    Button,
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
import { useNavigate } from "react-router-dom";

const revealContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.14,
      delayChildren: 0.1,
    },
  },
};

const revealItem = {
  hidden: { opacity: 0, y: 26, filter: "blur(8px)" },
  visible: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { duration: 0.56, ease: [0.22, 1, 0.36, 1] },
  },
};

const workflowSteps = [
  {
    id: "01",
    icon: UploadIcon,
    title: "Загрузка документа",
    text: "Вы отправляете .docx, система определяет структуру и готовит данные для нормоконтроля.",
    note: "до 50 страниц",
  },
  {
    id: "02",
    icon: AnalyzeIcon,
    title: "AI-анализ по ГОСТ",
    text: "Проверка запускается по правилам ГОСТ 7.32-2017 и дополнительным эвристикам оформления.",
    note: "30+ правил",
  },
  {
    id: "03",
    icon: AIIcon,
    title: "Поэтапная распаковка проблем",
    text: "Ошибки группируются по приоритету: критичные, важные и косметические. Видно, что править сначала.",
    note: "приоритизация",
  },
  {
    id: "04",
    icon: ReportIcon,
    title: "Готовый отчет",
    text: "Получаете структурированный отчет с пояснениями и конкретными местами для исправления.",
    note: "обычно за 30 сек",
  },
];

const metrics = [
  { label: "Проверок в месяц", value: "15K+", icon: CheckIcon },
  { label: "Средняя скорость", value: "2.3 сек", icon: SpeedIcon },
  { label: "Безопасная обработка", value: "100%", icon: SecurityIcon },
];

function OAuthButton({ icon: Icon, label, onClick }) {
  return (
    <Button
      fullWidth
      onClick={onClick}
      sx={{
        py: 1.5,
        px: 2.2,
        fontSize: "0.95rem",
        fontWeight: 600,
        borderRadius: 3,
        justifyContent: "flex-start",
        textTransform: "none",
        color: "#f8fafc",
        background: "rgba(255,255,255,0.05)",
        border: "1px solid rgba(255,255,255,0.16)",
        backdropFilter: "blur(8px)",
        transition: "all .22s ease",
        "&:hover": {
          borderColor: "rgba(255,255,255,0.34)",
          background: "rgba(255,255,255,0.12)",
          transform: "translateY(-1px)",
        },
      }}
      startIcon={<Icon sx={{ opacity: 0.92 }} />}
    >
      {label}
    </Button>
  );
}

function WorkflowCard({ step, last }) {
  const Icon = step.icon;

  return (
    <motion.div variants={revealItem}>
      <Paper
        elevation={0}
        sx={{
          p: { xs: 2.5, md: 3 },
          borderRadius: 4,
          border: "1px solid rgba(255,255,255,0.12)",
          background:
            "linear-gradient(160deg, rgba(12, 21, 35, 0.88) 0%, rgba(8, 14, 24, 0.86) 60%, rgba(9, 9, 14, 0.84) 100%)",
          position: "relative",
          overflow: "hidden",
          "&::after": {
            content: '""',
            position: "absolute",
            inset: 0,
            pointerEvents: "none",
            background:
              "linear-gradient(135deg, rgba(255,255,255,0.08) 0%, transparent 30%, transparent 70%, rgba(255,255,255,0.04) 100%)",
          },
        }}
      >
        <Stack spacing={2.1} sx={{ position: "relative", zIndex: 1 }}>
          <Stack direction="row" alignItems="center" spacing={1.2}>
            <Box
              sx={{
                minWidth: 42,
                height: 42,
                borderRadius: "50%",
                border: "1px solid rgba(255,255,255,0.24)",
                background: "rgba(255,255,255,0.08)",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#f8fafc",
              }}
            >
              <Icon sx={{ fontSize: 20 }} />
            </Box>

            <Stack spacing={0.2}>
              <Typography
                variant="caption"
                sx={{
                  color: "rgba(226, 232, 240, 0.66)",
                  textTransform: "uppercase",
                  letterSpacing: "0.16em",
                  fontWeight: 700,
                }}
              >
                Шаг {step.id}
              </Typography>
              <Typography variant="h6" sx={{ fontWeight: 700, color: "#f8fafc", lineHeight: 1.2 }}>
                {step.title}
              </Typography>
            </Stack>
          </Stack>

          <Typography sx={{ color: "rgba(226, 232, 240, 0.82)", lineHeight: 1.7 }}>
            {step.text}
          </Typography>

          <Chip
            size="small"
            label={step.note}
            sx={{
              alignSelf: "flex-start",
              height: 28,
              fontWeight: 700,
              letterSpacing: "0.04em",
              color: "#dbeafe",
              border: "1px solid rgba(191, 219, 254, 0.34)",
              background: "rgba(59, 130, 246, 0.12)",
            }}
          />
        </Stack>
      </Paper>

      {!last && (
        <Box
          sx={{
            ml: 2,
            height: 22,
            borderLeft: "2px dashed rgba(148, 163, 184, 0.42)",
          }}
        />
      )}
    </motion.div>
  );
}

export default function HeroLanding() {
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  const handleOAuthClick = (provider) => {
    const clientIds = {
      telegram: process.env.REACT_APP_TELEGRAM_BOT_TOKEN,
      yandex: process.env.REACT_APP_YANDEX_CLIENT_ID,
    };

    const clientId = clientIds[provider];

    if (!clientId) {
      const errorMsg = `OAuth ${provider === "telegram" ? "Bot Token" : "Client ID"} для ${provider} не установлен.\n\nУстановите переменную окружения:\nREACT_APP_${provider.toUpperCase()}_${provider === "telegram" ? "BOT_TOKEN" : "CLIENT_ID"}=your_value\n\nВ файле frontend/.env.local`;
      alert(errorMsg);
      return;
    }

    const redirectUri = `${window.location.origin}/auth/${provider}/callback`;

    const authUrls = {
      telegram: `${process.env.REACT_APP_API_URL}/api/auth/telegram/start?bot_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}`,
      yandex: `https://oauth.yandex.ru/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code`,
    };

    const authUrl = authUrls[provider];
    if (authUrl) {
      window.location.href = authUrl;
    }
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        position: "relative",
        overflow: "hidden",
        background:
          "radial-gradient(circle at 15% 15%, rgba(14, 165, 233, 0.24), transparent 28%), radial-gradient(circle at 85% 0%, rgba(249, 115, 22, 0.18), transparent 24%), linear-gradient(170deg, #05070f 0%, #070d1b 48%, #04070f 100%)",
      }}
    >
      <Box
        sx={{
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
          opacity: 0.34,
          backgroundImage:
            "linear-gradient(rgba(148,163,184,0.14) 1px, transparent 1px), linear-gradient(90deg, rgba(148,163,184,0.14) 1px, transparent 1px)",
          backgroundSize: "44px 44px",
          maskImage: "radial-gradient(circle at 50% 30%, black 0%, transparent 82%)",
        }}
      />

      <Container maxWidth="lg" sx={{ position: "relative", zIndex: 2, py: { xs: 6, md: 10 } }}>
        <motion.div variants={revealContainer} initial="hidden" animate="visible">
          <motion.div variants={revealItem}>
            <Chip
              icon={<TipIcon sx={{ fontSize: 16 }} />}
              label="Новая структура: от загрузки до финального отчета"
              sx={{
                mb: 2.5,
                px: 0.6,
                height: 34,
                color: "#e2e8f0",
                border: "1px solid rgba(255,255,255,0.2)",
                background: "rgba(15, 23, 42, 0.66)",
                fontWeight: 600,
                "& .MuiChip-icon": { color: "#f59e0b" },
              }}
            />
          </motion.div>

          <Grid container spacing={{ xs: 4, md: 5.5 }} alignItems="flex-start">
            <Grid item xs={12} md={7}>
              <motion.div variants={revealItem}>
                <Typography
                  sx={{
                    color: "#f8fafc",
                    fontWeight: 800,
                    lineHeight: 1.06,
                    letterSpacing: "-0.02em",
                    maxWidth: 760,
                    fontSize: { xs: "2rem", sm: "2.7rem", md: "3.6rem" },
                  }}
                >
                  Документ проверяется по шагам, как понятная распаковка, а не хаотичный список ошибок
                </Typography>
              </motion.div>

              <motion.div variants={revealItem}>
                <Typography
                  sx={{
                    mt: 2.2,
                    maxWidth: 640,
                    color: "rgba(226, 232, 240, 0.84)",
                    lineHeight: 1.72,
                    fontSize: { xs: "1rem", md: "1.08rem" },
                  }}
                >
                  CURSA последовательно ведет пользователя: загрузка, AI-анализ, приоритизация проблем и
                  финальный отчет. Каждая стадия раскрывается логично и визуально связана со следующей.
                </Typography>
              </motion.div>

              <motion.div variants={revealItem}>
                <Stack
                  direction={{ xs: "column", sm: "row" }}
                  spacing={1.4}
                  sx={{ mt: 3.2, maxWidth: isMobile ? 420 : 540 }}
                >
                  <OAuthButton
                    icon={TelegramIcon}
                    label="Войти через Telegram"
                    onClick={() => handleOAuthClick("telegram")}
                  />

                  <Button
                    fullWidth
                    onClick={() => handleOAuthClick("yandex")}
                    sx={{
                      py: 1.5,
                      px: 2.2,
                      fontSize: "0.95rem",
                      fontWeight: 600,
                      borderRadius: 3,
                      justifyContent: "flex-start",
                      textTransform: "none",
                      color: "#f8fafc",
                      background: "rgba(255,255,255,0.05)",
                      border: "1px solid rgba(255,255,255,0.16)",
                      backdropFilter: "blur(8px)",
                      transition: "all .22s ease",
                      "&:hover": {
                        borderColor: "rgba(255,255,255,0.34)",
                        background: "rgba(255,255,255,0.12)",
                        transform: "translateY(-1px)",
                      },
                    }}
                  >
                    <Box
                      component="span"
                      sx={{
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                        width: 22,
                        height: 22,
                        mr: 1,
                        borderRadius: "50%",
                        background: "rgba(229, 38, 32, 0.2)",
                        color: "#E52620",
                        fontWeight: 800,
                      }}
                    >
                      Я
                    </Box>
                    Войти через Яндекс
                  </Button>
                </Stack>
              </motion.div>

              <motion.div variants={revealItem}>
                <Stack direction={{ xs: "column", sm: "row" }} spacing={1.4} sx={{ mt: 1.6 }}>
                  <Button
                    variant="contained"
                    onClick={() => navigate("/upload")}
                    sx={{
                      py: 1.5,
                      px: 3.2,
                      borderRadius: 3,
                      textTransform: "none",
                      fontSize: "1rem",
                      fontWeight: 800,
                      background:
                        "linear-gradient(135deg, rgba(14,165,233,1) 0%, rgba(2,132,199,1) 52%, rgba(30,64,175,1) 100%)",
                      boxShadow: "0 14px 34px rgba(2,132,199,0.34)",
                      "&:hover": {
                        transform: "translateY(-1px)",
                        boxShadow: "0 18px 36px rgba(2,132,199,0.4)",
                      },
                    }}
                  >
                    Начать проверку
                  </Button>

                  <Typography
                    sx={{
                      display: "inline-flex",
                      alignItems: "center",
                      color: "rgba(226, 232, 240, 0.72)",
                      fontSize: "0.92rem",
                    }}
                  >
                    Без регистрации: можно сразу загрузить файл
                  </Typography>
                </Stack>
              </motion.div>
            </Grid>

            <Grid item xs={12} md={5}>
              <motion.div variants={revealItem}>
                <Paper
                  elevation={0}
                  sx={{
                    p: { xs: 2.4, md: 2.8 },
                    borderRadius: 4,
                    border: "1px solid rgba(255,255,255,0.14)",
                    background:
                      "linear-gradient(165deg, rgba(15,23,42,0.88) 0%, rgba(10,15,28,0.86) 55%, rgba(7,9,18,0.9) 100%)",
                  }}
                >
                  <Stack spacing={1.7}>
                    <Typography
                      sx={{
                        color: "rgba(191, 219, 254, 0.94)",
                        textTransform: "uppercase",
                        letterSpacing: "0.14em",
                        fontWeight: 700,
                        fontSize: "0.72rem",
                      }}
                    >
                      Сценарий проверки
                    </Typography>

                    {workflowSteps.map((step, index) => (
                      <Stack key={step.id} spacing={0.6}>
                        <Stack direction="row" spacing={1.2} alignItems="center">
                          <Typography
                            sx={{
                              minWidth: 34,
                              color: "#7dd3fc",
                              fontWeight: 800,
                              fontSize: "0.86rem",
                            }}
                          >
                            {step.id}
                          </Typography>
                          <Typography sx={{ color: "#f8fafc", fontWeight: 600 }}>
                            {step.title}
                          </Typography>
                        </Stack>

                        {index < workflowSteps.length - 1 && (
                          <Box
                            sx={{
                              ml: "17px",
                              width: 1,
                              height: 12,
                              borderLeft: "1px dashed rgba(125, 211, 252, 0.46)",
                            }}
                          />
                        )}
                      </Stack>
                    ))}
                  </Stack>
                </Paper>
              </motion.div>
            </Grid>
          </Grid>

          <Box sx={{ mt: { xs: 7, md: 8.5 } }}>
            <motion.div
              variants={revealContainer}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.2 }}
            >
              <motion.div variants={revealItem}>
                <Typography
                  variant="h4"
                  sx={{
                    mb: 1,
                    color: "#f8fafc",
                    fontWeight: 800,
                    letterSpacing: "-0.015em",
                  }}
                >
                  Поэтапная распаковка
                </Typography>
                <Typography sx={{ mb: 3.5, color: "rgba(226, 232, 240, 0.74)", maxWidth: 720 }}>
                  Каждая следующая стадия появляется из предыдущей, поэтому интерфейс читается как процесс,
                  а не как набор несвязанных карточек.
                </Typography>
              </motion.div>

              <Stack spacing={0.8}>
                {workflowSteps.map((step, index) => (
                  <WorkflowCard
                    key={step.id}
                    step={step}
                    last={index === workflowSteps.length - 1}
                  />
                ))}
              </Stack>
            </motion.div>
          </Box>

          <Box sx={{ mt: { xs: 7, md: 9 } }}>
            <motion.div
              variants={revealContainer}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.2 }}
            >
              <motion.div variants={revealItem}>
                <Typography variant="h5" sx={{ color: "#f8fafc", fontWeight: 800, mb: 2.3 }}>
                  Почему интерфейс стал легче
                </Typography>
              </motion.div>

              <Grid container spacing={2}>
                {metrics.map((metric) => {
                  const Icon = metric.icon;
                  return (
                    <Grid item xs={12} sm={4} key={metric.label}>
                      <motion.div variants={revealItem}>
                        <Paper
                          elevation={0}
                          sx={{
                            p: 2.4,
                            borderRadius: 3,
                            border: "1px solid rgba(255,255,255,0.14)",
                            background: "rgba(15, 23, 42, 0.56)",
                            height: "100%",
                          }}
                        >
                          <Stack spacing={1.3}>
                            <Box
                              sx={{
                                width: 36,
                                height: 36,
                                borderRadius: 2,
                                border: "1px solid rgba(125, 211, 252, 0.42)",
                                background: "rgba(14, 165, 233, 0.14)",
                                display: "inline-flex",
                                alignItems: "center",
                                justifyContent: "center",
                                color: "#bae6fd",
                              }}
                            >
                              <Icon sx={{ fontSize: 20 }} />
                            </Box>
                            <Typography sx={{ color: "#f8fafc", fontWeight: 800, fontSize: "1.28rem" }}>
                              {metric.value}
                            </Typography>
                            <Typography sx={{ color: "rgba(226,232,240,0.72)" }}>{metric.label}</Typography>
                          </Stack>
                        </Paper>
                      </motion.div>
                    </Grid>
                  );
                })}
              </Grid>
            </motion.div>
          </Box>
        </motion.div>
      </Container>
    </Box>
  );
}
