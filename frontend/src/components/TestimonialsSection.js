import {
  Avatar,
  Box,
  Container,
  Grid,
  Paper,
  Rating,
  Stack,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import { motion } from "framer-motion";

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

// Testimonial card
const TestimonialCard = ({ name, role, university, text, rating, avatar, delay }) => (
  <motion.div variants={itemVariants} transition={{ delay }}>
    <Paper
      elevation={0}
      sx={{
        p: 3,
        height: "100%",
        background: "rgba(10, 10, 10, 0.8)",
        border: "1px solid rgba(255, 255, 255, 0.08)",
        borderRadius: 2,
        transition: "all 0.2s ease",
        "&:hover": {
          border: "1px solid rgba(255, 255, 255, 0.15)",
          background: "rgba(15, 15, 15, 0.9)",
          transform: "translateY(-2px)",
        },
      }}
    >
      <Stack spacing={2}>
        {/* Rating */}
        <Rating value={rating} readOnly sx={{ color: "#f97316" }} />

        {/* Text */}
        <Typography
          variant="body2"
          sx={{
            color: "rgba(255,255,255,0.7)",
            lineHeight: 1.8,
            fontStyle: "italic",
            minHeight: 80,
          }}
        >
          "{text}"
        </Typography>

        {/* Author */}
        <Stack spacing={1}>
          <Box
            sx={{
              display: "flex",
              gap: 1.5,
              alignItems: "center",
              pt: 1,
              borderTop: "1px solid rgba(255,255,255,0.1)",
            }}
          >
            <Avatar
              src={avatar}
              sx={{
                width: 40,
                height: 40,
                background: "#ededed",
                color: "#111",
              }}
            >
              {name.charAt(0)}
            </Avatar>
            <Box>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, color: "#f8fafc" }}>
                {name}
              </Typography>
              <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.5)" }}>
                {role}&nbsp;•&nbsp;{university}
              </Typography>
            </Box>
          </Box>
        </Stack>
      </Stack>
    </Paper>
  </motion.div>
);

export default function TestimonialsSection() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  const testimonials = [
    {
      name: "Мария Петрова",
      role: "Студент 4 курса",
      university: "БГПУ",
      rating: 5,
      text: "Спасло мою дипломную работу! За 2 минуты курса нашел все ошибки оформления, которые я упустил. Очень удобно!",
      avatar: null,
    },
    {
      name: "Иван Сидоров",
      role: "Магистрант",
      university: "БГУ",
      rating: 5,
      text: "Отличная система. Проверял курсовую и он выявил даже такие мелочи как неправильное форматирование библиографии. Рекомендую!",
      avatar: null,
    },
    {
      name: "Анна Козлова",
      role: "Преподаватель",
      university: "МГЛУ",
      rating: 5,
      text: "Используем CURSA для проверки студенческих работ. Экономит массу времени при нормоконтроле. Качество проверки на 10/10.",
      avatar: null,
    },
    {
      name: "Алексей Морозов",
      role: "Студент 3 курса",
      university: "ТПУ",
      rating: 5,
      text: "Быстро, надёжно, бесплатно! Зачем платить за другие проверки, когда есть CURSA? Лучше не найти.",
      avatar: null,
    },
    {
      name: "Елена Волкова",
      role: "Норм-контролер",
      university: "СПбГУ",
      rating: 5,
      text: "Помогает выявить всё по ГОСТ 7.32-2017. Теперь работаю эффективнее. Студенты тоже чаще сдают более аккуратные работы.",
      avatar: null,
    },
    {
      name: "Дмитрий Новиков",
      role: "Студент 2 курса",
      university: "ЮУрГУ",
      rating: 5,
      text: "Отправил реферат, получил подробный отчёт за 30 сек. Исправил все замечания и получил отлично. Спасибо разработчикам!",
      avatar: null,
    },
  ];

  return (
    <Box
      sx={{
        py: 8,
        background: "transparent",
      }}
    >
      <Container maxWidth="lg">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
        >
          {/* Header */}
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
              Что говорят пользователи
            </Typography>
            <Typography
              variant="body1"
              sx={{
                color: "rgba(255,255,255,0.6)",
                textAlign: "center",
                mb: 6,
              }}
            >
              Более 15,000 студентов и преподавателей доверяют CURSA
            </Typography>
          </motion.div>

          {/* Testimonials Grid */}
          <Grid container spacing={3}>
            {testimonials.map((testimonial, index) => (
              <Grid item xs={12} sm={6} md={4} key={index}>
                <TestimonialCard {...testimonial} delay={0.1 * (index % 3)} />
              </Grid>
            ))}
          </Grid>

          {/* Stats Footer */}
          <motion.div variants={itemVariants}>
            <Paper
              sx={{
                mt: 6,
                p: 4,
                background:
                  "linear-gradient(135deg, rgba(34, 211, 238, 0.1) 0%, rgba(249, 115, 22, 0.05) 100%)",
                border: "1px solid rgba(34, 211, 238, 0.2)",
                borderRadius: 3,
              }}
            >
              <Grid container spacing={3} sx={{ textAlign: "center" }}>
                <Grid item xs={12} sm={4}>
                  <Typography variant="h5" sx={{ fontWeight: 800, color: "#22d3ee", mb: 0.5 }}>
                    15K+
                  </Typography>
                  <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.6)" }}>
                    Документов проверено
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <Typography variant="h5" sx={{ fontWeight: 800, color: "#f97316", mb: 0.5 }}>
                    4.9★
                  </Typography>
                  <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.6)" }}>
                    Средний рейтинг
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <Typography variant="h5" sx={{ fontWeight: 800, color: "#06b6d4", mb: 0.5 }}>
                    2.3 сек
                  </Typography>
                  <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.6)" }}>
                    Среднее время проверки
                  </Typography>
                </Grid>
              </Grid>
            </Paper>
          </motion.div>
        </motion.div>
      </Container>
    </Box>
  );
}
