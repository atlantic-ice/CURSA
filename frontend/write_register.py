new_register = r"""import ArrowBackIcon from "@mui/icons-material/ArrowBack";
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
} from "@mui/material";
import { motion } from "framer-motion";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

const RegisterPage = () => {
  const navigate = useNavigate();
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
  const [success, setSuccess] = useState("");

  const API_BASE = process.env.REACT_APP_API_URL || "http://localhost:5000";

  const handleChange = (e) => {
    const { name, value, checked, type } = e.target;
    setFormData((prev) => ({ ...prev, [name]: type === "checkbox" ? checked : value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.email) newErrors.email = "Email обязателен";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) newErrors.email = "Неверный формат email";
    if (!formData.firstName) newErrors.firstName = "Имя обязательно";
    if (!formData.password) newErrors.password = "Пароль обязателен";
    else if (formData.password.length < 8) newErrors.password = "Минимум 8 символов";
    else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.password))
      newErrors.password = "Нужны заглавные, строчные буквы и цифры";
    if (formData.password !== formData.confirmPassword)
      newErrors.confirmPassword = "Пароли не совпадают";
    if (!formData.agreeTerms) newErrors.agreeTerms = "Необходимо согласие с условиями";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setApiError("");
    setSuccess("");
    if (!validateForm()) return;
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/api/auth/register`, {
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
      if (!response.ok) { setApiError(data.error || "Ошибка регистрации"); return; }
      setSuccess("Регистрация выполнена! Проверьте email для подтверждения.");
      setTimeout(() => navigate("/login"), 2000);
    } catch (error) {
      setApiError("Ошибка сети. Попробуйте снова.");
      console.error("Registration error:", error);
    } finally { setLoading(false); }
  };

  const fieldSx = {
    "& .MuiOutlinedInput-root": {
      borderRadius: 1,
      bgcolor: "rgba(255,255,255,0.03)",
      "& fieldset": { borderColor: "rgba(255,255,255,0.1)" },
      "&:hover fieldset": { borderColor: "rgba(255,255,255,0.25)" },
      "&.Mui-focused fieldset": { borderColor: "rgba(255,255,255,0.55)", borderWidth: 1 },
      "& input": { color: "#fff", fontSize: "0.9rem", py: 1.4, px: 2 },
      "& input::placeholder": { color: "rgba(255,255,255,0.18)", opacity: 1 },
    },
    "& .MuiFormHelperText-root": { color: "#fca5a5", ml: 0 },
  };

  const Label = ({ children, htmlFor }) => (
    <Typography
      component="label"
      htmlFor={htmlFor}
      sx={{
        display: "block",
        fontSize: "0.7rem",
        fontWeight: 600,
        color: "rgba(255,255,255,0.4)",
        mb: 0.75,
        letterSpacing: "0.09em",
        textTransform: "uppercase",
      }}
    >
      {children}
    </Typography>
  );

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
            width: 36, height: 36,
            "&:hover": { color: "#fff", borderColor: "rgba(255,255,255,0.35)", bgcolor: "transparent" },
          }}
        >
          <ArrowBackIcon fontSize="small" />
        </IconButton>
      </Box>

      {/* Left branding panel */}
      <Box
        component={motion.div}
        initial={{ opacity: 0, x: -32 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.65, ease: "easeOut" }}
        sx={{
          display: { xs: "none", md: "flex" },
          flexDirection: "column",
          justifyContent: "space-between",
          width: "38%",
          p: "64px 52px",
          borderRight: "1px solid rgba(255,255,255,0.07)",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <Box
          sx={{
            position: "absolute", inset: 0,
            backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.06) 1px, transparent 1px)",
            backgroundSize: "28px 28px",
            zIndex: 0,
          }}
        />
        <Box sx={{ position: "relative", zIndex: 1 }}>
          <Typography sx={{ fontSize: "1rem", fontWeight: 900, letterSpacing: "0.2em", color: "#fff", fontFamily: "'Wix Madefor Display', sans-serif" }}>
            CURSA
          </Typography>
        </Box>
        <Box sx={{ position: "relative", zIndex: 1 }}>
          <Typography sx={{ fontSize: "2.4rem", fontWeight: 800, lineHeight: 1.15, letterSpacing: "-0.03em", color: "#fff", mb: 2.5, fontFamily: "'Wix Madefor Display', sans-serif" }}>
            Начните работу
            <br />с CURSA.
          </Typography>
          <Typography sx={{ fontSize: "0.88rem", color: "rgba(255,255,255,0.3)", lineHeight: 1.75, maxWidth: 280 }}>
            Создайте аккаунт и получите доступ к автоматической проверке нормоконтроля.
          </Typography>
        </Box>
        <Box sx={{ position: "relative", zIndex: 1 }}>
          <Typography sx={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.18)", letterSpacing: "0.06em" }}>
            © 2026 CURSA
          </Typography>
        </Box>
      </Box>

      {/* Right form panel */}
      <Box sx={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", p: { xs: "88px 24px 48px", md: "64px 56px" }, overflowY: "auto" }}>
        <Box
          component={motion.div}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, ease: "easeOut", delay: 0.05 }}
          sx={{ width: "100%", maxWidth: 420 }}
        >
          {/* Mobile logo */}
          <Typography sx={{ display: { xs: "block", md: "none" }, fontSize: "0.95rem", fontWeight: 900, letterSpacing: "0.2em", color: "#fff", fontFamily: "'Wix Madefor Display', sans-serif", mb: 6 }}>
            CURSA
          </Typography>

          <Typography variant="h4" sx={{ fontWeight: 700, color: "#fff", mb: 0.75, letterSpacing: "-0.025em", fontFamily: "'Wix Madefor Display', sans-serif", fontSize: { xs: "1.75rem", md: "1.9rem" } }}>
            Создать аккаунт
          </Typography>
          <Typography sx={{ color: "rgba(255,255,255,0.3)", mb: 4, fontSize: "0.875rem" }}>
            Заполните данные для регистрации
          </Typography>

          {apiError && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} style={{ marginBottom: 24 }}>
              <Alert severity="error" sx={{ bgcolor: "rgba(239,68,68,0.08)", color: "#fca5a5", border: "1px solid rgba(239,68,68,0.18)", borderRadius: 1, ".MuiAlert-icon": { color: "#fca5a5" } }}>
                {apiError}
              </Alert>
            </motion.div>
          )}
          {success && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} style={{ marginBottom: 24 }}>
              <Alert severity="success" sx={{ bgcolor: "rgba(16,185,129,0.08)", color: "#6ee7b7", border: "1px solid rgba(16,185,129,0.18)", borderRadius: 1, ".MuiAlert-icon": { color: "#6ee7b7" } }}>
                {success}
              </Alert>
            </motion.div>
          )}

          <Box component="form" onSubmit={handleSubmit} noValidate>
            {/* Name row */}
            <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2, mb: 2 }}>
              <Box>
                <Label htmlFor="reg-first">Имя</Label>
                <TextField id="reg-first" fullWidth name="firstName" placeholder="Иван" value={formData.firstName} onChange={handleChange} error={!!errors.firstName} helperText={errors.firstName} variant="outlined" sx={fieldSx} />
              </Box>
              <Box>
                <Label htmlFor="reg-last">Фамилия</Label>
                <TextField id="reg-last" fullWidth name="lastName" placeholder="Иванов" value={formData.lastName} onChange={handleChange} error={!!errors.lastName} helperText={errors.lastName} variant="outlined" sx={fieldSx} />
              </Box>
            </Box>

            <Box sx={{ mb: 2 }}>
              <Label htmlFor="reg-email">Email</Label>
              <TextField id="reg-email" fullWidth type="email" name="email" placeholder="you@example.com" value={formData.email} onChange={handleChange} error={!!errors.email} helperText={errors.email} variant="outlined" sx={fieldSx} />
            </Box>

            <Box sx={{ mb: 2 }}>
              <Label htmlFor="reg-org">Организация <Typography component="span" sx={{ fontSize: "0.68rem", color: "rgba(255,255,255,0.2)", fontStyle: "italic" }}>(необязательно)</Typography></Label>
              <TextField id="reg-org" fullWidth name="organization" placeholder="Название вуза" value={formData.organization} onChange={handleChange} variant="outlined" sx={fieldSx} />
            </Box>

            <Box sx={{ mb: 2 }}>
              <Label htmlFor="reg-pass">Пароль</Label>
              <TextField id="reg-pass" fullWidth type="password" name="password" placeholder="••••••••" value={formData.password} onChange={handleChange} error={!!errors.password} helperText={errors.password} variant="outlined" sx={fieldSx} />
            </Box>

            <Box sx={{ mb: 3 }}>
              <Label htmlFor="reg-confirm">Подтверждение пароля</Label>
              <TextField id="reg-confirm" fullWidth type="password" name="confirmPassword" placeholder="••••••••" value={formData.confirmPassword} onChange={handleChange} error={!!errors.confirmPassword} helperText={errors.confirmPassword} variant="outlined" sx={fieldSx} />
            </Box>

            <FormControlLabel
              control={
                <Checkbox
                  name="agreeTerms"
                  checked={formData.agreeTerms}
                  onChange={handleChange}
                  sx={{
                    color: "rgba(255,255,255,0.2)",
                    "&.Mui-checked": { color: "#fff" },
                    "& .MuiSvgIcon-root": { fontSize: 18, borderRadius: 0.5 },
                    p: 0.5,
                    mr: 1,
                  }}
                />
              }
              label={
                <Typography sx={{ fontSize: "0.82rem", color: "rgba(255,255,255,0.4)" }}>
                  Принимаю{" "}
                  <Link to="/terms" style={{ color: "#fff", textDecoration: "none", fontWeight: 600 }}>
                    условия использования
                  </Link>
                </Typography>
              }
              sx={{ mb: errors.agreeTerms ? 0 : 3 }}
            />
            {errors.agreeTerms && (
              <Typography sx={{ color: "#fca5a5", fontSize: "0.75rem", mb: 3, ml: 0.5 }}>
                {errors.agreeTerms}
              </Typography>
            )}

            <Button
              fullWidth type="submit" variant="contained" disabled={loading}
              sx={{
                py: 1.6, borderRadius: 1, fontWeight: 600, fontSize: "0.875rem",
                textTransform: "none", bgcolor: "#fff", color: "#000", letterSpacing: "0.03em",
                boxShadow: "none",
                "&:hover": { bgcolor: "rgba(255,255,255,0.88)", boxShadow: "none" },
                "&:disabled": { bgcolor: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.25)" },
              }}
            >
              {loading ? <CircularProgress size={18} sx={{ color: "#000" }} /> : "Создать аккаунт"}
            </Button>
          </Box>

          <Box sx={{ mt: 4, pt: 4, borderTop: "1px solid rgba(255,255,255,0.06)", textAlign: "center" }}>
            <Typography sx={{ fontSize: "0.85rem", color: "rgba(255,255,255,0.3)" }}>
              Уже есть аккаунт?{" "}
              <Link to="/login" style={{ color: "#fff", textDecoration: "none", fontWeight: 600 }}>
                Войти →
              </Link>
            </Typography>
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

export default RegisterPage;
"""

with open("src/pages/RegisterPage.jsx", "w", encoding="utf-8") as f:
    f.write(new_register)
print("RegisterPage done")
