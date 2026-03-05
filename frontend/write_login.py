new_content = r"""import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  TextField,
  Typography,
  IconButton,
} from "@mui/material";
import { motion } from "framer-motion";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

const LoginPage = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState("");

  const API_BASE = process.env.REACT_APP_API_URL || "http://localhost:5000";

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
      newErrors.password = "Пароль должен содержать минимум 6 символов";
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
      const response = await fetch(`${API_BASE}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const data = await response.json();
      if (!response.ok) {
        setApiError(data.error || "Ошибка входа");
        return;
      }
      localStorage.setItem("access_token", data.access_token);
      localStorage.setItem("refresh_token", data.refresh_token);
      navigate("/dashboard");
    } catch (error) {
      setApiError("Ошибка сети. Попробуйте снова.");
      console.error("Login error:", error);
    } finally {
      setLoading(false);
    }
  };

  const fieldSx = {
    "& .MuiOutlinedInput-root": {
      borderRadius: 1,
      bgcolor: "rgba(255,255,255,0.03)",
      "& fieldset": { borderColor: "rgba(255,255,255,0.1)" },
      "&:hover fieldset": { borderColor: "rgba(255,255,255,0.25)" },
      "&.Mui-focused fieldset": { borderColor: "rgba(255,255,255,0.55)", borderWidth: 1 },
      "& input": { color: "#fff", fontSize: "0.95rem", py: 1.5, px: 2 },
      "& input::placeholder": { color: "rgba(255,255,255,0.2)", opacity: 1 },
    },
    "& .MuiFormHelperText-root": { color: "#fca5a5", ml: 0 },
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        bgcolor: "#000",
        display: "flex",
        flexDirection: { xs: "column", md: "row" },
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Back button */}
      <Box sx={{ position: "absolute", top: 24, left: 24, zIndex: 20 }}>
        <IconButton
          onClick={() => navigate("/")}
          sx={{
            color: "rgba(255,255,255,0.45)",
            border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: 1,
            width: 36,
            height: 36,
            "&:hover": {
              color: "#fff",
              borderColor: "rgba(255,255,255,0.35)",
              bgcolor: "transparent",
            },
          }}
        >
          <ArrowBackIcon fontSize="small" />
        </IconButton>
      </Box>

      {/* Left panel — branding */}
      <Box
        component={motion.div}
        initial={{ opacity: 0, x: -32 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.65, ease: "easeOut" }}
        sx={{
          display: { xs: "none", md: "flex" },
          flexDirection: "column",
          justifyContent: "space-between",
          width: "42%",
          p: "64px 56px",
          borderRight: "1px solid rgba(255,255,255,0.07)",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Subtle dot grid */}
        <Box
          sx={{
            position: "absolute",
            inset: 0,
            backgroundImage:
              "radial-gradient(circle, rgba(255,255,255,0.06) 1px, transparent 1px)",
            backgroundSize: "28px 28px",
            zIndex: 0,
          }}
        />

        <Box sx={{ position: "relative", zIndex: 1 }}>
          <Typography
            sx={{
              fontSize: "1rem",
              fontWeight: 900,
              letterSpacing: "0.2em",
              color: "#fff",
              fontFamily: "'Wix Madefor Display', sans-serif",
            }}
          >
            CURSA
          </Typography>
        </Box>

        <Box sx={{ position: "relative", zIndex: 1 }}>
          <Typography
            sx={{
              fontSize: "2.6rem",
              fontWeight: 800,
              lineHeight: 1.15,
              letterSpacing: "-0.03em",
              color: "#fff",
              mb: 2.5,
              fontFamily: "'Wix Madefor Display', sans-serif",
            }}
          >
            Проверяй работы
            <br />
            быстрее.
          </Typography>
          <Typography
            sx={{
              fontSize: "0.9rem",
              color: "rgba(255,255,255,0.3)",
              lineHeight: 1.75,
              maxWidth: 300,
            }}
          >
            Нейросетевой нормоконтроль курсовых и дипломных работ. ГОСТ и методичка вуза — автоматически.
          </Typography>
        </Box>

        <Box sx={{ position: "relative", zIndex: 1 }}>
          <Typography
            sx={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.18)", letterSpacing: "0.06em" }}
          >
            © 2026 CURSA
          </Typography>
        </Box>
      </Box>

      {/* Right panel — form */}
      <Box
        sx={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          p: { xs: "88px 24px 48px", md: "64px 56px" },
        }}
      >
        <Box
          component={motion.div}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, ease: "easeOut", delay: 0.05 }}
          sx={{ width: "100%", maxWidth: 380 }}
        >
          {/* Mobile logo */}
          <Typography
            sx={{
              display: { xs: "block", md: "none" },
              fontSize: "0.95rem",
              fontWeight: 900,
              letterSpacing: "0.2em",
              color: "#fff",
              fontFamily: "'Wix Madefor Display', sans-serif",
              mb: 6,
            }}
          >
            CURSA
          </Typography>

          <Typography
            variant="h4"
            sx={{
              fontWeight: 700,
              color: "#fff",
              mb: 0.75,
              letterSpacing: "-0.025em",
              fontFamily: "'Wix Madefor Display', sans-serif",
              fontSize: { xs: "1.75rem", md: "2rem" },
            }}
          >
            Добро пожаловать
          </Typography>
          <Typography
            sx={{ color: "rgba(255,255,255,0.3)", mb: 5, fontSize: "0.875rem" }}
          >
            Введите данные для входа в аккаунт
          </Typography>

          {apiError && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              style={{ marginBottom: 24 }}
            >
              <Alert
                severity="error"
                sx={{
                  bgcolor: "rgba(239,68,68,0.08)",
                  color: "#fca5a5",
                  border: "1px solid rgba(239,68,68,0.18)",
                  borderRadius: 1,
                  ".MuiAlert-icon": { color: "#fca5a5" },
                }}
              >
                {apiError}
              </Alert>
            </motion.div>
          )}

          <Box component="form" onSubmit={handleSubmit} noValidate>
            {/* Email */}
            <Box sx={{ mb: 2.5 }}>
              <Typography
                component="label"
                htmlFor="login-email"
                sx={{
                  display: "block",
                  fontSize: "0.72rem",
                  fontWeight: 600,
                  color: "rgba(255,255,255,0.4)",
                  mb: 0.75,
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                }}
              >
                Email
              </Typography>
              <TextField
                id="login-email"
                fullWidth
                type="email"
                name="email"
                placeholder="you@example.com"
                value={formData.email}
                onChange={handleChange}
                error={!!errors.email}
                helperText={errors.email}
                variant="outlined"
                sx={fieldSx}
              />
            </Box>

            {/* Password */}
            <Box sx={{ mb: 4 }}>
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  mb: 0.75,
                }}
              >
                <Typography
                  component="label"
                  htmlFor="login-password"
                  sx={{
                    fontSize: "0.72rem",
                    fontWeight: 600,
                    color: "rgba(255,255,255,0.4)",
                    letterSpacing: "0.08em",
                    textTransform: "uppercase",
                  }}
                >
                  Пароль
                </Typography>
                <Typography
                  component={Link}
                  to="/forgot"
                  sx={{
                    fontSize: "0.75rem",
                    color: "rgba(255,255,255,0.25)",
                    textDecoration: "none",
                    "&:hover": { color: "rgba(255,255,255,0.6)" },
                    transition: "color 0.2s",
                  }}
                >
                  Забыли пароль?
                </Typography>
              </Box>
              <TextField
                id="login-password"
                fullWidth
                type="password"
                name="password"
                placeholder="••••••••"
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
                py: 1.6,
                borderRadius: 1,
                fontWeight: 600,
                fontSize: "0.875rem",
                textTransform: "none",
                bgcolor: "#fff",
                color: "#000",
                letterSpacing: "0.03em",
                boxShadow: "none",
                "&:hover": {
                  bgcolor: "rgba(255,255,255,0.88)",
                  boxShadow: "none",
                },
                "&:disabled": {
                  bgcolor: "rgba(255,255,255,0.08)",
                  color: "rgba(255,255,255,0.25)",
                },
              }}
            >
              {loading ? (
                <CircularProgress size={18} sx={{ color: "#000" }} />
              ) : (
                "Войти"
              )}
            </Button>
          </Box>

          <Box
            sx={{
              mt: 5,
              pt: 4,
              borderTop: "1px solid rgba(255,255,255,0.06)",
              textAlign: "center",
            }}
          >
            <Typography sx={{ fontSize: "0.85rem", color: "rgba(255,255,255,0.3)" }}>
              Нет аккаунта?{" "}
              <Link
                to="/register"
                style={{
                  color: "#fff",
                  textDecoration: "none",
                  fontWeight: 600,
                }}
              >
                Зарегистрироваться →
              </Link>
            </Typography>
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

export default LoginPage;
"""

with open("src/pages/LoginPage.jsx", "w", encoding="utf-8") as f:
    f.write(new_content)

print("Done!")
