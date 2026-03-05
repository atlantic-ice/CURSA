import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import DarkModeRounded from "@mui/icons-material/DarkModeRounded";
import LightModeRounded from "@mui/icons-material/LightModeRounded";
import {
  Alert,
  Box,
  Button,
  Checkbox,
  CircularProgress,
  FormControlLabel,
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

const RegisterPage = () => {
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
      "& input": { color: inputText, fontSize: "0.95rem", py: "13px", px: "16px" },
      "& input::placeholder": { color: placeholderColor, opacity: 1 },
    },
    "& .MuiFormHelperText-root": { color: "#e34234", ml: 0.5, mt: 0.5, fontSize: "0.78rem" },
  };

  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    firstName: "",
    lastName: "",
    organization: "",
    agreeTerms: false,
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState("");

  const handleChange = (e) => {
    const { name, value, checked, type } = e.target;
    setFormData((prev) => ({ ...prev, [name]: type === "checkbox" ? checked : value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.email) newErrors.email = "Email обязателен";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email))
      newErrors.email = "Неверный формат email";
    if (!formData.firstName) newErrors.firstName = "Имя обязательно";
    if (!formData.password) newErrors.password = "Пароль обязателен";
    else if (formData.password.length < 8) newErrors.password = "Минимум 8 символов";
    else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.password))
      newErrors.password = "Нужны заглавные, строчные буквы и цифры";
    if (formData.password !== formData.confirmPassword)
      newErrors.confirmPassword = "Пароли не совпадают";
    if (!formData.agreeTerms) newErrors.agreeTerms = "Необходимо принять условия";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setApiError("");
    if (!validateForm()) return;
    setLoading(true);
    try {
      const apiBase =
        process.env.REACT_APP_API_URL ||
        (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1"
          ? "http://localhost:5000"
          : process.env.REACT_APP_API_BASE || "https://cursa.onrender.com");
      const response = await fetch(`${apiBase}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          first_name: formData.firstName,
          last_name: formData.lastName,
          organization: formData.organization,
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        setApiError(data.error || "Ошибка регистрации");
        return;
      }
      await login(formData.email, formData.password);
      navigate("/dashboard");
    } catch (error) {
      setApiError(error.message || "Ошибка сети. Попробуйте снова.");
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
        py: 6,
        position: "relative",
      }}
    >
      {/* Кнопка назад */}
      <Box sx={{ position: "fixed", top: 20, left: 20, zIndex: 10 }}>
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
      <Box sx={{ position: "fixed", top: 20, right: 20, zIndex: 10 }}>
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
        sx={{ width: "100%", maxWidth: 420 }}
      >
        {/* Logo - instead of CURSA text */}
        <Box sx={{ mb: 6, display: "flex", justifyContent: "center" }}>
          <BrandLogo size="large" />
        </Box>

        {/* Heading */}
        <Typography
          sx={{
            fontSize: { xs: "1.9rem", md: "2.1rem" },
            fontWeight: 700,
            color: textPrimary,
            letterSpacing: "-0.025em",
            fontFamily: "'Wix Madefor Display', sans-serif",
            mb: 1,
            textAlign: "center",
          }}
        >
          Создать аккаунт
        </Typography>
        <Typography sx={{ color: textMuted, mb: 4.5, fontSize: "0.95rem", textAlign: "center" }}>
          Заполните данные для регистрации
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
          {/* Name row */}
          <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 1.5, mb: 1.5 }}>
            <TextField
              id="reg-first"
              fullWidth
              name="firstName"
              placeholder="Имя"
              value={formData.firstName}
              onChange={handleChange}
              error={!!errors.firstName}
              helperText={errors.firstName}
              variant="outlined"
              sx={fieldSx}
            />
            <TextField
              id="reg-last"
              fullWidth
              name="lastName"
              placeholder="Фамилия"
              value={formData.lastName}
              onChange={handleChange}
              variant="outlined"
              sx={fieldSx}
            />
          </Box>

          <Box sx={{ mb: 1.5 }}>
            <TextField
              id="reg-email"
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

          <Box sx={{ mb: 1.5 }}>
            <TextField
              id="reg-org"
              fullWidth
              name="organization"
              placeholder="Вуз или организация (необязательно)"
              value={formData.organization}
              onChange={handleChange}
              variant="outlined"
              sx={fieldSx}
            />
          </Box>

          <Box sx={{ mb: 1.5 }}>
            <TextField
              id="reg-pass"
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

          <Box sx={{ mb: 3 }}>
            <TextField
              id="reg-confirm"
              fullWidth
              type="password"
              name="confirmPassword"
              placeholder="Повторите пароль"
              value={formData.confirmPassword}
              onChange={handleChange}
              error={!!errors.confirmPassword}
              helperText={errors.confirmPassword}
              variant="outlined"
              sx={fieldSx}
            />
          </Box>

          <FormControlLabel
            control={
              <Checkbox
                name="agreeTerms"
                checked={formData.agreeTerms}
                onChange={handleChange}
                sx={{
                  color: isDark ? "rgba(235,235,245,0.2)" : "rgba(0,0,0,0.2)",
                  "&.Mui-checked": { color: textPrimary },
                  "& .MuiSvgIcon-root": { fontSize: 20 },
                  p: 0.5,
                  mr: 0.75,
                }}
              />
            }
            label={
              <Typography
                sx={{
                  fontSize: "0.875rem",
                  color: isDark ? "rgba(235,235,245,0.5)" : "rgba(0,0,0,0.5)",
                }}
              >
                Принимаю{" "}
                <Link
                  to="/terms"
                  style={{ color: textPrimary, textDecoration: "none", fontWeight: 600 }}
                >
                  условия использования
                </Link>
              </Typography>
            }
            sx={{ mb: errors.agreeTerms ? 0.5 : 3, ml: 0 }}
          />
          {errors.agreeTerms && (
            <Typography sx={{ color: "#e34234", fontSize: "0.78rem", mb: 2.5, ml: 0.5 }}>
              {errors.agreeTerms}
            </Typography>
          )}

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
              "Создать аккаунт"
            )}
          </Button>
        </Box>

        <Box sx={{ mt: 4, textAlign: "center" }}>
          <Typography sx={{ fontSize: "0.9rem", color: textMuted }}>
            Уже есть аккаунт?{" "}
            <Link
              to="/login"
              style={{ color: textPrimary, textDecoration: "none", fontWeight: 600 }}
            >
              Войти
            </Link>
          </Typography>
        </Box>
      </Box>
    </Box>
  );
};

export default RegisterPage;
