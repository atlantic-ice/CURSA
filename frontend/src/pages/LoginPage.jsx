import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import DarkModeRounded from "@mui/icons-material/DarkModeRounded";
import LightModeRounded from "@mui/icons-material/LightModeRounded";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  IconButton,
  TextField,
  Typography,
  useTheme,
} from "@mui/material";
import { motion } from "framer-motion";
import { useContext, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AuthContext, ColorModeContext } from "../App";
import BrandLogo from "../components/BrandLogo";

const LoginPage = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const colorMode = useContext(ColorModeContext);
  const { login } = useContext(AuthContext);
  const isDark = theme.palette.mode === "dark";

  const pageBg = isDark ? "#000000" : "#ffffff";
  const cardBg = isDark ? "#1C1C1E" : "#F2F2F7";
  const hoverBg = isDark ? "#2C2C2E" : "#E5E5EA";
  const textPrimary = isDark ? "#ffffff" : "#000000";
  const textMuted = isDark ? "rgba(235,235,245,0.38)" : "rgba(0,0,0,0.38)";
  const inputText = isDark ? "#ffffff" : "#000";
  const placeholderColor = isDark ? "rgba(235,235,245,0.3)" : "rgba(0,0,0,0.3)";
  const btnDisabledBg = isDark ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.08)";
  const btnDisabledColor = isDark ? "rgba(235,235,245,0.28)" : "rgba(0,0,0,0.28)";

  const fieldSx = {
    "& .MuiOutlinedInput-root": {
      borderRadius: "14px",
      bgcolor: cardBg,
      "& fieldset": { border: "none" },
      "&:hover fieldset": { border: "none" },
      "&.Mui-focused fieldset": { border: "none" },
      "& input": { color: inputText, fontSize: "1rem", py: "14px", px: "16px" },
      "& input::placeholder": { color: placeholderColor, opacity: 1 },
    },
    "& .MuiFormHelperText-root": { color: "#e34234", ml: 0.5, mt: 0.5, fontSize: "0.8rem" },
  };

  const [formData, setFormData] = useState({ email: "", password: "" });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState("");

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.email) {
      newErrors.email = "Email обязателен";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Неверный формат email";
    }
    if (!formData.password) {
      newErrors.password = "Пароль обязателен";
    } else if (formData.password.length < 6) {
      newErrors.password = "Минимум 6 символов";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setApiError("");
    if (!validateForm()) return;
    setLoading(true);
    try {
      await login(formData.email, formData.password);
      navigate("/dashboard");
    } catch (error) {
      setApiError(error.message || "Ошибка входа. Попробуйте снова.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        bgcolor: pageBg,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        px: 3,
        position: "relative",
      }}
    >
      {/* Кнопка назад */}
      <Box sx={{ position: "absolute", top: 20, left: 20 }}>
        <IconButton
          onClick={() => navigate("/")}
          sx={{
            bgcolor: cardBg,
            borderRadius: "50%",
            width: 36,
            height: 36,
            color: isDark ? "rgba(235,235,245,0.7)" : "rgba(0,0,0,0.6)",
            "&:hover": { bgcolor: hoverBg },
          }}
        >
          <ArrowBackIcon sx={{ fontSize: 18 }} />
        </IconButton>
      </Box>
      {/* Тоггл темы */}
      <Box sx={{ position: "absolute", top: 20, right: 20 }}>
        <IconButton
          onClick={colorMode.toggleColorMode}
          sx={{
            bgcolor: cardBg,
            borderRadius: "50%",
            width: 36,
            height: 36,
            color: textPrimary,
            "&:hover": { bgcolor: hoverBg },
          }}
        >
          {isDark ? (
            <LightModeRounded sx={{ fontSize: 18 }} />
          ) : (
            <DarkModeRounded sx={{ fontSize: 18 }} />
          )}
        </IconButton>
      </Box>

      <Box
        component={motion.div}
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        sx={{ width: "100%", maxWidth: 380 }}
      >
        {/* Logo */}
        {/* Logo - instead of CURSA text */}
        <Box sx={{ mb: 6, display: "flex", justifyContent: "center" }}>
          <BrandLogo size="large" />
        </Box>

        {/* Heading */}
        <Typography
          sx={{
            fontSize: { xs: "2rem", md: "2.25rem" },
            fontWeight: 700,
            color: textPrimary,
            letterSpacing: "-0.025em",
            fontFamily: "'Wix Madefor Display', sans-serif",
            mb: 1,
            textAlign: "center",
          }}
        >
          Добро пожаловать
        </Typography>
        <Typography
          sx={{
            color: textMuted,
            mb: 5,
            fontSize: "0.95rem",
            textAlign: "center",
          }}
        >
          Введите данные для входа
        </Typography>

        {apiError && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            style={{ marginBottom: 20 }}
          >
            <Alert
              severity="error"
              sx={{
                bgcolor: "rgba(227,66,52,0.08)",
                color: "#c0392b",
                border: "none",
                borderRadius: "14px",
                ".MuiAlert-icon": { color: "#c0392b" },
              }}
            >
              {apiError}
            </Alert>
          </motion.div>
        )}

        <Box component="form" onSubmit={handleSubmit} noValidate>
          <Box sx={{ mb: 2 }}>
            <TextField
              id="login-email"
              fullWidth
              type="email"
              name="email"
              placeholder="Email"
              value={formData.email}
              onChange={handleChange}
              error={!!errors.email}
              helperText={errors.email}
              variant="outlined"
              sx={fieldSx}
            />
          </Box>

          <Box sx={{ mb: 3.5 }}>
            <TextField
              id="login-password"
              fullWidth
              type="password"
              name="password"
              placeholder="Пароль"
              value={formData.password}
              onChange={handleChange}
              error={!!errors.password}
              helperText={errors.password}
              variant="outlined"
              sx={fieldSx}
            />
          </Box>

          <Button
            fullWidth
            type="submit"
            variant="contained"
            disabled={loading}
            sx={{
              py: 1.75,
              borderRadius: "14px",
              fontWeight: 600,
              fontSize: "1rem",
              textTransform: "none",
              bgcolor: isDark ? "#ffffff" : "#000",
              color: isDark ? "#000000" : "#fff",
              boxShadow: "none",
              letterSpacing: "0",
              "&:hover": { bgcolor: isDark ? "#e0e0e0" : "#1a1a1a", boxShadow: "none" },
              "&:disabled": { bgcolor: btnDisabledBg, color: btnDisabledColor },
            }}
          >
            {loading ? (
              <CircularProgress
                size={20}
                sx={{ color: isDark ? "rgba(0,0,0,0.6)" : "rgba(255,255,255,0.6)" }}
              />
            ) : (
              "Войти"
            )}
          </Button>
        </Box>

        <Box sx={{ mt: 4, textAlign: "center" }}>
          <Typography sx={{ fontSize: "0.9rem", color: textMuted }}>
            Нет аккаунта?{" "}
            <Link
              to="/register"
              style={{ color: textPrimary, textDecoration: "none", fontWeight: 600 }}
            >
              Создать
            </Link>
          </Typography>
        </Box>
      </Box>
    </Box>
  );
};

export default LoginPage;
