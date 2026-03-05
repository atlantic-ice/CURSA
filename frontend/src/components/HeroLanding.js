import {
  AutoAwesomeOutlined as AIIcon,
  CheckCircleOutline as CheckIcon,
  InsertDriveFile as FileIcon,
  SecurityOutlined as SecurityIcon,
  SpeedOutlined as SpeedIcon,
  TrendingUpOutlined as StatsIcon,
  Telegram as TelegramIcon,
} from "@mui/icons-material";
import {
  Box,
  Button,
  Chip,
  Container,
  Grid,
  LinearProgress,
  Paper,
  Stack,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import DemoSection from "./DemoSection";
import TestimonialsSection from "./TestimonialsSection";

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

const floatingVariants = {
  animate: {
    y: [0, -10, 0],
    transition: {
      duration: 3,
      repeat: Infinity,
      ease: "easeInOut",
    },
  },
};

// Floating background orbs (декоративно)
const FloatingOrb = ({ color, size, delay, x, y }) => (
  <motion.div
    style={{
      position: "absolute",
      background: `radial-gradient(circle, ${color} 0%, transparent 70%)`,
      width: size,
      height: size,
      borderRadius: "50%",
      filter: "blur(40px)",
      opacity: 0.1,
      left: x,
      top: y,
      pointerEvents: "none",
      zIndex: 0,
    }}
    animate={{
      x: [0, 30, 0],
      y: [0, -30, 0],
    }}
    transition={{
      duration: 8 + delay,
      repeat: Infinity,
      ease: "easeInOut",
    }}
  />
);

// Вспомогательная функция для градиентного бордера
// Feature card с иконкой
const FeatureCard = ({ icon: Icon, title, description, delay }) => (
  <motion.div variants={itemVariants} transition={{ delay }} style={{ height: "100%" }}>
    <Paper
      sx={{
        p: 4,
        height: "100%",
        display: "flex",
        flexDirection: "column",
        background: "rgba(10, 10, 10, 0.6)",
        border: "1px solid rgba(255, 255, 255, 0.08)",
        borderRadius: 60,
        backdropFilter: "blur(12px)",
        transition: "all 0.2s ease-in-out",
        cursor: "pointer",
        "&:hover": {
          border: "1px solid rgba(255, 255, 255, 0.2)",
          background: "rgba(20, 20, 20, 0.8)",
          transform: "translateY(-2px)",
        },
      }}
    >
      <Stack spacing={2.5}>
        <Box
          sx={{
            width: 40,
            height: 40,
            border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: 60,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#ededed",
            background: "rgba(255,255,255,0.03)",
          }}
        >
          <Icon sx={{ fontSize: 20 }} />
        </Box>
        <Typography variant="h6" sx={{ fontWeight: 600, fontSize: "1.1rem" }}>
          {title}
        </Typography>
        <Typography variant="body2" sx={{ color: "#a1a1aa", lineHeight: 1.6 }}>
          {description}
        </Typography>
      </Stack>
    </Paper>
  </motion.div>
);

// OAuth button
const OAuthButton = ({ icon: Icon, label, provider, delay, onClick }) => (
  <motion.div variants={itemVariants} transition={{ delay }}>
    <Button
      fullWidth
      onClick={onClick}
      sx={{
        py: 1.5,
        fontSize: "0.95rem",
        fontWeight: 500,
        backgroundColor: "rgba(255,255,255,0.03)",
        border: "1px solid rgba(255,255,255,0.1)",
        color: "#ededed",
        textTransform: "none",
        transition: "all 0.2s ease",
        justifyContent: "flex-start",
        px: 3,
        "&:hover": {
          borderColor: "rgba(255,255,255,0.3)",
          backgroundColor: "rgba(255,255,255,0.08)",
        },
      }}
      startIcon={<Icon sx={{ mr: 1, opacity: 0.8 }} />}
    >
      {label}
    </Button>
  </motion.div>
);

// Stats counter с анимацией
const StatCounter = ({ label, value, icon: Icon, delay }) => {
  const [count, setCount] = useState(0);
  const targetValue = parseInt(value);

  useEffect(() => {
    let interval = setInterval(() => {
      setCount((prev) => {
        if (prev >= targetValue) {
          clearInterval(interval);
          return targetValue;
        }
        return prev + Math.ceil(targetValue / 20);
      });
    }, 30);
    return () => clearInterval(interval);
  }, [targetValue]);

  return (
    <motion.div variants={itemVariants} transition={{ delay }} style={{ height: "100%" }}>
      <Paper
        sx={{
          p: 3,
          textAlign: "center",
          background: "transparent",
          border: "1px solid rgba(255, 255, 255, 0.08)",
          borderRadius: 60,
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <Icon sx={{ fontSize: 24, color: "#a1a1aa", mb: 1.5 }} />
        <Typography
          variant="h4"
          sx={{ fontWeight: 600, color: "#ededed", letterSpacing: "-0.02em" }}
        >
          {count}+
        </Typography>
        <Typography
          variant="caption"
          sx={{ color: "#a1a1aa", mt: 0.5, letterSpacing: "0.02em", textTransform: "uppercase" }}
        >
          {label}
        </Typography>
      </Paper>
    </motion.div>
  );
};

export default function HeroLanding() {
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  const handleOAuthClick = (provider) => {
    // Проверить что Client ID настроен
    const clientIds = {
      telegram: process.env.REACT_APP_TELEGRAM_BOT_TOKEN,
      yandex: process.env.REACT_APP_YANDEX_CLIENT_ID,
    };

    const clientId = clientIds[provider];

    // Debug info в консоль
    console.log(`[OAuth ${provider}] Config:`, {
      clientId: clientId ? `${clientId.substring(0, 20)}...` : "NOT SET",
      provider,
      redirectUri: `${window.location.origin}/auth/${provider}/callback`,
    });

    if (!clientId) {
      const errorMsg = `❌ OAuth ${provider === "telegram" ? "Bot Token" : "Client ID"} для ${provider} не установлен!\n\nУстановите переменную окружения:\nREACT_APP_${provider.toUpperCase()}_${provider === "telegram" ? "BOT_TOKEN" : "CLIENT_ID"}=your_value\n\nВ файле frontend/.env.local`;
      console.error(errorMsg);
      alert(errorMsg);
      return;
    }

    // Редирект на OAuth endpoint
    const redirectUri = `${window.location.origin}/auth/${provider}/callback`;

    const authUrls = {
      telegram: `${process.env.REACT_APP_API_URL}/api/auth/telegram/start?bot_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}`,
      yandex: `https://oauth.yandex.ru/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code`,
    };

    const authUrl = authUrls[provider];
    if (authUrl) {
      console.log(`[OAuth ${provider}] Redirecting to:`, authUrl.substring(0, 100) + "...");
      window.location.href = authUrl;
    } else {
      alert(`Unknown OAuth provider: ${provider}`);
    }
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        background: "transparent",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <Container maxWidth="lg" sx={{ position: "relative", zIndex: 1, py: 8 }}>
        <motion.div variants={containerVariants} initial="hidden" animate="visible">
          {/* HERO SECTION */}
          <Box sx={{ mb: 10, textAlign: isMobile ? "center" : "left", pt: isMobile ? 4 : 8 }}>
            {/* Бейдж */}
            <motion.div variants={itemVariants}>
              <Chip
                icon={<AIIcon sx={{ fontSize: 16 }} />}
                label="Powered by AI & ГОСТ 7.32-2017"
                variant="outlined"
                sx={{
                  mb: 4,
                  borderColor: "rgba(255, 255, 255, 0.1)",
                  background: "rgba(255, 255, 255, 0.03)",
                  color: "#a1a1aa",
                  fontWeight: 500,
                  "& .MuiChip-icon": {
                    color: "#ededed",
                  },
                }}
              />
            </motion.div>

            {/* Заголовок */}
            <motion.div variants={itemVariants}>
              <Typography
                variant="h1"
                sx={{
                  color: "#ededed",
                  lineHeight: 1.1,
                  mb: 3,
                  maxWidth: 800,
                  fontSize: isMobile ? "2.5rem" : "4.5rem",
                }}
              >
                Проверка документов за 30 секунд
              </Typography>
            </motion.div>

            {/* Описание */}
            <motion.div variants={itemVariants}>
              <Typography
                variant="h5"
                sx={{
                  color: "#a1a1aa",
                  mb: 5,
                  maxWidth: 560,
                  lineHeight: 1.6,
                  fontSize: "1.1rem",
                }}
              >
                Проверьте оформление курсовой, дипломной работы или реферата по ГОСТ 7.32-2017.
                Получите подробный отчёт с исправлениями.
              </Typography>
            </motion.div>

            {/* OAuth кнопки */}
            <motion.div variants={itemVariants}>
              <Stack spacing={2} sx={{ maxWidth: 320, mb: 4, ...(isMobile && { mx: "auto" }) }}>
                <OAuthButton
                  icon={TelegramIcon}
                  label="Войти через Telegram"
                  provider="telegram"
                  delay={0.2}
                  onClick={() => handleOAuthClick("telegram")}
                />

                {/* Yandex button (custom styling) */}
                <Button
                  fullWidth
                  variant="outlined"
                  onClick={() => handleOAuthClick("yandex")}
                  sx={{
                    py: 1.5,
                    fontSize: "0.95rem",
                    fontWeight: 500,
                    backgroundColor: "rgba(255,255,255,0.03)",
                    border: "1px solid rgba(255,255,255,0.1)",
                    color: "#ededed",
                    textTransform: "none",
                    transition: "all 0.2s ease",
                    justifyContent: "flex-start",
                    px: 3,
                    "&:hover": {
                      borderColor: "rgba(255,255,255,0.3)",
                      backgroundColor: "rgba(255,255,255,0.08)",
                    },
                  }}
                >
                  <Box
                    component="span"
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      mr: 1,
                      width: 24,
                      height: 24,
                      color: "#E52620",
                      fontWeight: 700,
                      fontSize: "1.1rem",
                    }}
                  >
                    Я
                  </Box>
                  Войти через Яндекс
                </Button>

                <Box sx={{ position: "relative", my: 2 }}>
                  <Box
                    sx={{
                      position: "absolute",
                      top: "50%",
                      left: 0,
                      right: 0,
                      height: 1,
                      background: "rgba(255,255,255,0.1)",
                      transform: "translateY(-50%)",
                    }}
                  />
                  <Typography
                    variant="caption"
                    sx={{
                      position: "relative",
                      display: "inline-block",
                      background: "#07070a",
                      px: 2,
                      left: "50%",
                      transform: "translateX(-50%)",
                      color: "rgba(255,255,255,0.5)",
                    }}
                  >
                    или продолжить как гость
                  </Typography>
                </Box>

                <Button
                  fullWidth
                  variant="contained"
                  sx={{
                    py: 1.5,
                    fontSize: "1rem",
                    fontWeight: 700,
                    background: "linear-gradient(135deg, #22d3ee 0%, #06b6d4 100%)",
                    textTransform: "none",
                    "&:hover": {
                      background: "linear-gradient(135deg, #06b6d4 0%, #22d3ee 100%)",
                    },
                  }}
                  onClick={() => navigate("/upload")}
                >
                  Загрузить документ
                </Button>
              </Stack>
            </motion.div>
          </Box>

          {/* FEATURES GRID */}
          <Box sx={{ mb: 10 }}>
            <motion.div variants={itemVariants}>
              <Typography
                variant="h4"
                sx={{
                  fontWeight: 700,
                  mb: 4,
                  textAlign: "center",
                  color: "#f8fafc",
                }}
              >
                Что проверяем
              </Typography>
            </motion.div>

            <Grid container spacing={3}>
              <Grid item xs={12} sm={6} md={3}>
                <FeatureCard
                  icon={CheckIcon}
                  title="Соответствие ГОСТ"
                  description="Проверка по 30+ правилам стандарта ГОСТ 7.32-2017"
                  delay={0.1}
                />
              </Grid>

              <Grid item xs={12} sm={6} md={3}>
                <FeatureCard
                  icon={SpeedIcon}
                  title="Молниеносно"
                  description="Обработка 50 страниц за 2-3 секунды"
                  delay={0.2}
                />
              </Grid>

              <Grid item xs={12} sm={6} md={3}>
                <FeatureCard
                  icon={SecurityIcon}
                  title="Приватно"
                  description="Документы не хранятся и не отправляются третьим лицам"
                  delay={0.3}
                />
              </Grid>

              <Grid item xs={12} sm={6} md={3}>
                <FeatureCard
                  icon={AIIcon}
                  title="AI-исправление"
                  description="Автоматическое исправление многопроходной коррекцией"
                  delay={0.4}
                />
              </Grid>
            </Grid>
          </Box>

          {/* STATISTICS SECTION */}
          <Box sx={{ mb: 10 }}>
            <motion.div variants={itemVariants}>
              <Typography
                variant="h4"
                sx={{
                  fontWeight: 700,
                  mb: 4,
                  textAlign: "center",
                  color: "#f8fafc",
                }}
              >
                Статистика приложения
              </Typography>
            </motion.div>

            <Grid container spacing={2}>
              <Grid item xs={12} sm={6} md={3}>
                <StatCounter
                  icon={FileIcon}
                  label="Проверено документов"
                  value="15000"
                  delay={0.1}
                />
              </Grid>

              <Grid item xs={12} sm={6} md={3}>
                <StatCounter
                  icon={CheckIcon}
                  label="Исправлено ошибок"
                  value="234000"
                  delay={0.2}
                />
              </Grid>

              <Grid item xs={12} sm={6} md={3}>
                <StatCounter icon={StatsIcon} label="Снижена оцифровка на" value="89" delay={0.3} />
              </Grid>

              <Grid item xs={12} sm={6} md={3}>
                <StatCounter
                  icon={SpeedIcon}
                  label="Среднее время проверки"
                  value="2"
                  delay={0.4}
                />
              </Grid>
            </Grid>

            <motion.div variants={itemVariants}>
              <Paper
                sx={{
                  mt: 4,
                  p: 3,
                  background:
                    "linear-gradient(135deg, rgba(34, 211, 238, 0.05) 0%, rgba(34, 211, 238, 0.02) 100%)",
                  border: "1px solid rgba(34, 211, 238, 0.2)",
                  borderRadius: 2,
                }}
              >
                <Stack spacing={2}>
                  <Box>
                    <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.6)", mb: 1 }}>
                      Качество проверки
                    </Typography>
                    <LinearProgress
                      variant="determinate"
                      value={98}
                      sx={{
                        height: 8,
                        borderRadius: 4,
                        background: "rgba(255,255,255,0.1)",
                        "& .MuiLinearProgress-bar": {
                          background: "linear-gradient(90deg, #22d3ee 0%, #06b6d4 100%)",
                          borderRadius: 4,
                        },
                      }}
                    />
                    <Typography
                      variant="caption"
                      sx={{ color: "#22d3ee", mt: 0.5, display: "block" }}
                    >
                      98% точности проверки
                    </Typography>
                  </Box>
                </Stack>
              </Paper>
            </motion.div>
          </Box>

          {/* DEMO SECTION */}
          <DemoSection />

          {/* TESTIMONIALS SECTION */}
          <TestimonialsSection />

          {/* CTA SECTION */}
          <motion.div variants={itemVariants} style={{ textAlign: "center" }}>
            <Box
              sx={{
                p: 4,
                borderRadius: 3,
                background:
                  "linear-gradient(135deg, rgba(34, 211, 238, 0.1) 0%, rgba(249, 115, 22, 0.05) 100%)",
                border: "1px solid rgba(34, 211, 238, 0.3)",
              }}
            >
              <Typography variant="h5" sx={{ fontWeight: 700, mb: 2 }}>
                Готовы начать?
              </Typography>
              <Typography variant="body1" sx={{ color: "rgba(255,255,255,0.7)", mb: 3 }}>
                Загрузите документ прямо сейчас и получите подробный отчёт за 30 секунд
              </Typography>
              <Button
                variant="contained"
                size="large"
                sx={{
                  px: 4,
                  py: 1.5,
                  fontSize: "1.1rem",
                  fontWeight: 700,
                  background: "linear-gradient(135deg, #22d3ee 0%, #06b6d4 100%)",
                  textTransform: "none",
                }}
                onClick={() => navigate("/upload")}
              >
                Загрузить документ →
              </Button>
            </Box>
          </motion.div>
        </motion.div>
      </Container>
    </Box>
  );
}
