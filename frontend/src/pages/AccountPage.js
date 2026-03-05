import AccountCircleOutlinedIcon from "@mui/icons-material/AccountCircleOutlined";
import BadgeOutlinedIcon from "@mui/icons-material/BadgeOutlined";
import BusinessOutlinedIcon from "@mui/icons-material/BusinessOutlined";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import DeleteForeverOutlinedIcon from "@mui/icons-material/DeleteForeverOutlined";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import KeyOutlinedIcon from "@mui/icons-material/KeyOutlined";
import LinkOutlinedIcon from "@mui/icons-material/LinkOutlined";
import LogoutIcon from "@mui/icons-material/LogoutOutlined";
import SaveOutlinedIcon from "@mui/icons-material/SaveOutlined";
import ShieldOutlinedIcon from "@mui/icons-material/ShieldOutlined";
import VisibilityOffOutlinedIcon from "@mui/icons-material/VisibilityOffOutlined";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import WarningAmberOutlinedIcon from "@mui/icons-material/WarningAmberOutlined";
import {
  Avatar,
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Divider,
  IconButton,
  InputBase,
  Snackbar,
  Tooltip,
  Typography,
} from "@mui/material";
import axios from "axios";
import { motion } from "framer-motion";
import { useContext, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext, CheckHistoryContext } from "../App";
import usePageStyles from "../hooks/usePageStyles";

const isLocal =
  typeof window !== "undefined" &&
  (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1");
const API_BASE = isLocal
  ? "http://localhost:5000"
  : process.env.REACT_APP_API_BASE || "https://cursa.onrender.com";

const ROLE_LABELS = {
  user: "Пользователь",
  pro: "Pro",
  team: "Team",
  enterprise: "Enterprise",
  admin: "Администратор",
  guest: "Гость",
};

const ROLE_COLORS = {
  user: "#6B7280",
  pro: "#4F46E5",
  team: "#0EA5E9",
  enterprise: "#F59E0B",
  admin: "#EF4444",
  guest: "#9CA3AF",
};

const OAUTH_LABELS = {
  google: "Google",
  github: "GitHub",
  yandex: "Яндекс",
  telegram: "Telegram",
};

const sectionVariants = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0 },
};

export default function AccountPage() {
  const { isDark, textPrimary, textMuted, borderColor, surface } = usePageStyles();
  const { user, logout, updateUser } = useContext(AuthContext);
  const { history } = useContext(CheckHistoryContext);
  const navigate = useNavigate();
  const inputBg = isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)";
  const fieldHoverBg = isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.03)";

  // Profile edit state
  const [profileEditing, setProfileEditing] = useState(false);
  const [firstName, setFirstName] = useState(user?.first_name || "");
  const [lastName, setLastName] = useState(user?.last_name || "");
  const [organization, setOrganization] = useState(user?.organization || "");
  const [profileSaving, setProfileSaving] = useState(false);

  // Password state
  const [passwordOpen, setPasswordOpen] = useState(false);
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [showPwd, setShowPwd] = useState(false);

  // Delete account state
  const [deleteAccountOpen, setDeleteAccountOpen] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [deleteAccountLoading, setDeleteAccountLoading] = useState(false);

  // 2FA state
  const [twoFaOpen, setTwoFaOpen] = useState(false);
  const [twoFaLoading, setTwoFaLoading] = useState(false);
  const [twoFaQrCode, setTwoFaQrCode] = useState("");
  const [twoFaSecret, setTwoFaSecret] = useState("");
  const [twoFaToken, setTwoFaToken] = useState("");
  const [twoFaBackupCodes, setTwoFaBackupCodes] = useState([]);

  // Snack
  const [snack, setSnack] = useState({ open: false, message: "", error: false });
  const showSnack = (message, error = false) => setSnack({ open: true, message, error });

  // Email verification
  const [verificationSending, setVerificationSending] = useState(false);

  const displayName =
    user?.first_name && user?.last_name
      ? `${user.first_name} ${user.last_name}`
      : user?.first_name || user?.email?.split("@")[0] || "Аккаунт";

  const initials = (user?.first_name?.[0] || user?.email?.[0] || "U").toUpperCase();
  const role = user?.role || "user";

  // Stats from local history
  const totalChecks = history.length;
  const avgScore =
    totalChecks > 0
      ? Math.round(history.reduce((acc, h) => acc + (h.score || 0), 0) / totalChecks)
      : 0;
  const withFixes = history.filter(
    (h) => h.correctedFilePath || h.reportData?.corrected_file_path,
  ).length;

  const saveProfile = async () => {
    setProfileSaving(true);
    try {
      const token = localStorage.getItem("access_token");
      const { data } = await axios.put(
        `${API_BASE}/api/auth/me`,
        { first_name: firstName, last_name: lastName, organization },
        { headers: { Authorization: `Bearer ${token}` } },
      );
      if (data?.user) updateUser(data.user);
      showSnack("Профиль обновлён");
      setProfileEditing(false);
    } catch (e) {
      showSnack(e.response?.data?.error || "Ошибка сохранения", true);
    } finally {
      setProfileSaving(false);
    }
  };

  const cancelProfileEdit = () => {
    setProfileEditing(false);
    setFirstName(user?.first_name || "");
    setLastName(user?.last_name || "");
    setOrganization(user?.organization || "");
  };

  const handleChangePassword = async () => {
    if (newPassword !== confirmPassword) {
      showSnack("Пароли не совпадают", true);
      return;
    }
    if (newPassword.length < 8) {
      showSnack("Минимум 8 символов", true);
      return;
    }
    setPasswordSaving(true);
    try {
      const token = localStorage.getItem("access_token");
      await axios.post(
        `${API_BASE}/api/auth/change-password`,
        { old_password: oldPassword, new_password: newPassword },
        { headers: { Authorization: `Bearer ${token}` } },
      );
      showSnack("Пароль успешно изменён");
      setPasswordOpen(false);
      setOldPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (e) {
      showSnack(e.response?.data?.error || "Ошибка смены пароля", true);
    } finally {
      setPasswordSaving(false);
    }
  };

  const startTwoFaSetup = async () => {
    setTwoFaLoading(true);
    try {
      const token = localStorage.getItem("access_token");
      const { data } = await axios.post(
        `${API_BASE}/api/auth/2fa/setup`,
        {},
        { headers: { Authorization: `Bearer ${token}` } },
      );
      setTwoFaQrCode(data.qr_code);
      setTwoFaSecret(data.secret);
      setTwoFaToken("");
      setTwoFaBackupCodes([]);
      setTwoFaOpen(true);
    } catch (e) {
      showSnack(e.response?.data?.error || "Ошибка настройки 2FA", true);
    } finally {
      setTwoFaLoading(false);
    }
  };

  const confirmTwoFa = async () => {
    if (!twoFaToken || twoFaToken.length !== 6) {
      showSnack("Введите 6-значный код", true);
      return;
    }
    setTwoFaLoading(true);
    try {
      const token = localStorage.getItem("access_token");
      const { data } = await axios.post(
        `${API_BASE}/api/auth/2fa/enable`,
        { secret: twoFaSecret, token: twoFaToken },
        { headers: { Authorization: `Bearer ${token}` } },
      );
      setTwoFaBackupCodes(data.backup_codes || []);
      updateUser({ ...user, is_2fa_enabled: true });
      showSnack("2FA успешно включена");
    } catch (e) {
      showSnack(e.response?.data?.error || "Неверный код 2FA", true);
    } finally {
      setTwoFaLoading(false);
    }
  };

  const disableTwoFa = async () => {
    setTwoFaLoading(true);
    try {
      const token = localStorage.getItem("access_token");
      await axios.post(
        `${API_BASE}/api/auth/2fa/disable`,
        {},
        { headers: { Authorization: `Bearer ${token}` } },
      );
      updateUser({ ...user, is_2fa_enabled: false });
      setTwoFaOpen(false);
      showSnack("2FA отключена");
    } catch (e) {
      showSnack(e.response?.data?.error || "Ошибка отключения 2FA", true);
    } finally {
      setTwoFaLoading(false);
    }
  };

  return (
    <Box
      sx={{
        height: "100%",
        overflowY: "auto",
        bgcolor: isDark ? "#000" : "#fff",
        color: textPrimary,
      }}
    >
      <Box sx={{ maxWidth: 580, mx: "auto", px: { xs: 3, md: 5 }, py: 4 }}>
        {/* Page caption */}
        <motion.div
          variants={sectionVariants}
          initial="hidden"
          animate="show"
          transition={{ duration: 0.35 }}
        >
          <Typography
            sx={{
              fontSize: "0.68rem",
              fontWeight: 600,
              letterSpacing: "0.1em",
              color: textMuted,
              textTransform: "uppercase",
              mb: 0.5,
            }}
          >
            Аккаунт
          </Typography>

          {/* Avatar + name row */}
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              mb: 4,
              mt: 0.5,
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
              <Avatar
                sx={{
                  width: 52,
                  height: 52,
                  fontSize: "1.25rem",
                  fontWeight: 700,
                  bgcolor: isDark ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.09)",
                  color: textPrimary,
                }}
              >
                {initials}
              </Avatar>
              <Box>
                <Typography
                  sx={{
                    fontWeight: 700,
                    fontSize: "1.1rem",
                    color: textPrimary,
                    lineHeight: 1.25,
                    fontFamily: "'Wix Madefor Display', sans-serif",
                  }}
                >
                  {displayName}
                </Typography>
                <Typography sx={{ fontSize: "0.8rem", color: textMuted, mt: 0.25 }}>
                  {user?.email}
                </Typography>
              </Box>
            </Box>
            <Chip
              label={ROLE_LABELS[role] || role}
              size="small"
              sx={{
                bgcolor: `${ROLE_COLORS[role] || "#6B7280"}18`,
                color: ROLE_COLORS[role] || "#6B7280",
                fontWeight: 600,
                fontSize: "0.68rem",
                borderRadius: "6px",
                height: 22,
                border: "none",
              }}
            />
          </Box>
        </motion.div>

        {/* Stats */}
        <motion.div
          variants={sectionVariants}
          initial="hidden"
          animate="show"
          transition={{ duration: 0.35, delay: 0.05 }}
        >
          <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 1.5, mb: 4 }}>
            {[
              { label: "Проверок", value: totalChecks },
              { label: "Средний балл", value: avgScore },
              { label: "С исправлениями", value: withFixes },
            ].map(({ label, value }) => (
              <Box
                key={label}
                sx={{
                  bgcolor: surface,
                  borderRadius: "12px",
                  p: 2,
                  textAlign: "center",
                }}
              >
                <Typography
                  sx={{
                    fontWeight: 700,
                    fontSize: "1.6rem",
                    color: textPrimary,
                    lineHeight: 1,
                    fontFamily: "'Wix Madefor Display', sans-serif",
                  }}
                >
                  {value}
                </Typography>
                <Typography sx={{ fontSize: "0.68rem", color: textMuted, mt: 0.75 }}>
                  {label}
                </Typography>
              </Box>
            ))}
          </Box>
        </motion.div>

        <Divider sx={{ borderColor, mb: 0 }} />

        {/* ── Profile section ── */}
        <motion.div
          variants={sectionVariants}
          initial="hidden"
          animate="show"
          transition={{ duration: 0.35, delay: 0.1 }}
        >
          <Box sx={{ py: 3 }}>
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                mb: 2,
              }}
            >
              <Typography sx={{ fontWeight: 600, fontSize: "0.85rem", color: textPrimary }}>
                Профиль
              </Typography>
              {!profileEditing ? (
                <Tooltip title="Редактировать">
                  <IconButton
                    size="small"
                    onClick={() => setProfileEditing(true)}
                    sx={{
                      color: textMuted,
                      borderRadius: "6px",
                      "&:hover": { color: textPrimary },
                    }}
                  >
                    <EditOutlinedIcon sx={{ fontSize: 15 }} />
                  </IconButton>
                </Tooltip>
              ) : (
                <Box sx={{ display: "flex", gap: 1 }}>
                  <Button
                    size="small"
                    onClick={cancelProfileEdit}
                    sx={{
                      color: textMuted,
                      textTransform: "none",
                      fontSize: "0.78rem",
                      minWidth: 0,
                      px: 1,
                    }}
                  >
                    Отмена
                  </Button>
                  <Button
                    size="small"
                    disabled={profileSaving}
                    onClick={saveProfile}
                    startIcon={<SaveOutlinedIcon sx={{ fontSize: "13px !important" }} />}
                    sx={{
                      color: textPrimary,
                      textTransform: "none",
                      fontSize: "0.78rem",
                      fontWeight: 600,
                      minWidth: 0,
                      px: 1,
                    }}
                  >
                    {profileSaving ? "..." : "Сохранить"}
                  </Button>
                </Box>
              )}
            </Box>

            <Box sx={{ display: "flex", flexDirection: "column", gap: 0.75 }}>
              {[
                {
                  label: "Имя",
                  icon: <AccountCircleOutlinedIcon sx={{ fontSize: 14 }} />,
                  value: firstName,
                  setter: setFirstName,
                },
                {
                  label: "Фамилия",
                  icon: <BadgeOutlinedIcon sx={{ fontSize: 14 }} />,
                  value: lastName,
                  setter: setLastName,
                },
                {
                  label: "Организация",
                  icon: <BusinessOutlinedIcon sx={{ fontSize: 14 }} />,
                  value: organization,
                  setter: setOrganization,
                },
              ].map(({ label, icon, value, setter }) => (
                <Box
                  key={label}
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 1.5,
                    px: 1.5,
                    py: 1.25,
                    borderRadius: "10px",
                    bgcolor: profileEditing ? inputBg : "transparent",
                    transition: "background 0.2s",
                    "&:hover": profileEditing ? {} : { bgcolor: fieldHoverBg },
                  }}
                >
                  <Box sx={{ color: textMuted, flexShrink: 0 }}>{icon}</Box>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography
                      sx={{
                        fontSize: "0.62rem",
                        color: textMuted,
                        mb: 0.2,
                        textTransform: "uppercase",
                        letterSpacing: "0.07em",
                      }}
                    >
                      {label}
                    </Typography>
                    {profileEditing ? (
                      <InputBase
                        value={value}
                        onChange={(e) => setter(e.target.value)}
                        placeholder={`Введите ${label.toLowerCase()}`}
                        sx={{
                          fontSize: "0.85rem",
                          color: textPrimary,
                          width: "100%",
                          "& input": { p: 0 },
                        }}
                      />
                    ) : (
                      <Typography
                        sx={{
                          fontSize: "0.85rem",
                          color: value ? textPrimary : textMuted,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {value || "—"}
                      </Typography>
                    )}
                  </Box>
                </Box>
              ))}

              {/* Email — always read-only */}
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 1.5,
                  px: 1.5,
                  py: 1.25,
                  borderRadius: "10px",
                }}
              >
                <Box sx={{ color: textMuted, flexShrink: 0 }}>
                  <LinkOutlinedIcon sx={{ fontSize: 14 }} />
                </Box>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography
                    sx={{
                      fontSize: "0.62rem",
                      color: textMuted,
                      mb: 0.2,
                      textTransform: "uppercase",
                      letterSpacing: "0.07em",
                    }}
                  >
                    Email
                  </Typography>
                  <Typography
                    sx={{
                      fontSize: "0.85rem",
                      color: textPrimary,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {user?.email || "—"}
                  </Typography>
                </Box>
                {user?.is_email_verified && (
                  <Tooltip title="Email подтверждён">
                    <CheckCircleOutlineIcon
                      sx={{ fontSize: 15, color: "#22C55E", flexShrink: 0 }}
                    />
                  </Tooltip>
                )}
              </Box>
            </Box>
          </Box>
        </motion.div>

        <Divider sx={{ borderColor }} />

        {/* ── Email verification banner ── */}
        {user && !user.is_email_verified && (
          <motion.div
            variants={sectionVariants}
            initial="hidden"
            animate="show"
            transition={{ duration: 0.3, delay: 0.1 }}
          >
            <Box
              sx={{
                py: 2.5,
                px: 2,
                my: 0.5,
                borderRadius: "10px",
                border: "1px solid",
                borderColor: "rgba(251,191,36,0.3)",
                bgcolor: isDark ? "rgba(251,191,36,0.06)" : "rgba(251,191,36,0.07)",
                display: "flex",
                alignItems: "center",
                gap: 2,
              }}
            >
              <WarningAmberOutlinedIcon sx={{ fontSize: 18, color: "#fbbf24", flexShrink: 0 }} />
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography
                  sx={{ fontSize: "0.82rem", fontWeight: 600, color: "#fbbf24", mb: 0.3 }}
                >
                  Email не подтверждён
                </Typography>
                <Typography
                  sx={{
                    fontSize: "0.75rem",
                    color: isDark ? "rgba(255,255,255,0.4)" : "rgba(0,0,0,0.5)",
                  }}
                >
                  Проверьте почту или отправьте письмо повторно
                </Typography>
              </Box>
              <Button
                size="small"
                disabled={verificationSending}
                onClick={async () => {
                  setVerificationSending(true);
                  try {
                    const token = localStorage.getItem("access_token");
                    await axios.post(
                      `${API_BASE}/api/auth/resend-verification`,
                      {},
                      { headers: { Authorization: `Bearer ${token}` } },
                    );
                    showSnack("Письмо отправлено");
                  } catch (e) {
                    showSnack(e.response?.data?.error || "Ошибка отправки", true);
                  } finally {
                    setVerificationSending(false);
                  }
                }}
                sx={{
                  textTransform: "none",
                  fontSize: "0.75rem",
                  color: "#fbbf24",
                  borderColor: "rgba(251,191,36,0.4)",
                  whiteSpace: "nowrap",
                  flexShrink: 0,
                  "&:hover": { borderColor: "#fbbf24", bgcolor: "rgba(251,191,36,0.08)" },
                }}
                variant="outlined"
              >
                {verificationSending ? "Отправка..." : "Отправить"}
              </Button>
            </Box>
          </motion.div>
        )}

        <Divider sx={{ borderColor }} />

        {/* ── Password section ── */}
        <motion.div
          variants={sectionVariants}
          initial="hidden"
          animate="show"
          transition={{ duration: 0.35, delay: 0.15 }}
        >
          <Box sx={{ py: 3 }}>
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                mb: passwordOpen ? 2 : 0,
              }}
            >
              <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                <KeyOutlinedIcon sx={{ fontSize: 16, color: textMuted }} />
                <Typography sx={{ fontWeight: 600, fontSize: "0.85rem", color: textPrimary }}>
                  Пароль
                </Typography>
              </Box>
              <Button
                size="small"
                onClick={() => {
                  setPasswordOpen(!passwordOpen);
                  if (passwordOpen) {
                    setOldPassword("");
                    setNewPassword("");
                    setConfirmPassword("");
                  }
                }}
                sx={{
                  color: passwordOpen ? textMuted : textPrimary,
                  textTransform: "none",
                  fontSize: "0.78rem",
                  minWidth: 0,
                  px: 1,
                }}
              >
                {passwordOpen ? "Отмена" : user?.has_password ? "Изменить" : "Установить"}
              </Button>
            </Box>

            {passwordOpen && (
              <motion.div
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
              >
                <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                  {(user?.has_password
                    ? [
                        {
                          label: "Текущий пароль",
                          value: oldPassword,
                          setter: setOldPassword,
                        },
                        {
                          label: "Новый пароль",
                          value: newPassword,
                          setter: setNewPassword,
                        },
                        {
                          label: "Подтвердите пароль",
                          value: confirmPassword,
                          setter: setConfirmPassword,
                        },
                      ]
                    : [
                        {
                          label: "Новый пароль",
                          value: newPassword,
                          setter: setNewPassword,
                        },
                        {
                          label: "Подтвердите пароль",
                          value: confirmPassword,
                          setter: setConfirmPassword,
                        },
                      ]
                  ).map(({ label, value, setter }) => (
                    <Box
                      key={label}
                      sx={{
                        px: 1.5,
                        py: 1.25,
                        borderRadius: "10px",
                        bgcolor: inputBg,
                        display: "flex",
                        alignItems: "center",
                        gap: 1,
                      }}
                    >
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography
                          sx={{
                            fontSize: "0.62rem",
                            color: textMuted,
                            mb: 0.2,
                            textTransform: "uppercase",
                            letterSpacing: "0.07em",
                          }}
                        >
                          {label}
                        </Typography>
                        <InputBase
                          type={showPwd ? "text" : "password"}
                          value={value}
                          onChange={(e) => setter(e.target.value)}
                          placeholder="••••••••"
                          sx={{
                            fontSize: "0.85rem",
                            color: textPrimary,
                            width: "100%",
                            "& input": { p: 0 },
                          }}
                        />
                      </Box>
                    </Box>
                  ))}

                  <Box sx={{ display: "flex", alignItems: "center", gap: 1, mt: 0.5 }}>
                    <IconButton
                      size="small"
                      onClick={() => setShowPwd(!showPwd)}
                      sx={{ color: textMuted, "&:hover": { color: textPrimary } }}
                    >
                      {showPwd ? (
                        <VisibilityOffOutlinedIcon sx={{ fontSize: 16 }} />
                      ) : (
                        <VisibilityOutlinedIcon sx={{ fontSize: 16 }} />
                      )}
                    </IconButton>
                    <Typography sx={{ fontSize: "0.75rem", color: textMuted }}>
                      {showPwd ? "Скрыть" : "Показать"} пароль
                    </Typography>
                    <Box sx={{ flex: 1 }} />
                    <Button
                      onClick={handleChangePassword}
                      disabled={passwordSaving}
                      sx={{
                        borderRadius: "9px",
                        bgcolor: isDark ? "rgba(255,255,255,0.09)" : "rgba(0,0,0,0.06)",
                        color: textPrimary,
                        textTransform: "none",
                        fontWeight: 600,
                        fontSize: "0.82rem",
                        px: 2,
                        py: 1,
                        "&:hover": {
                          bgcolor: isDark ? "rgba(255,255,255,0.13)" : "rgba(0,0,0,0.09)",
                        },
                      }}
                    >
                      {passwordSaving ? "..." : "Сохранить"}
                    </Button>
                  </Box>
                </Box>
              </motion.div>
            )}
          </Box>
        </motion.div>

        <Divider sx={{ borderColor }} />

        {/* ── 2FA section ── */}
        <motion.div
          variants={sectionVariants}
          initial="hidden"
          animate="show"
          transition={{ duration: 0.35, delay: 0.18 }}
        >
          <Box sx={{ py: 3 }}>
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                mb: twoFaOpen && !user?.is_2fa_enabled ? 2 : 0,
              }}
            >
              <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                <ShieldOutlinedIcon sx={{ fontSize: 16, color: textMuted }} />
                <Typography sx={{ fontWeight: 600, fontSize: "0.85rem", color: textPrimary }}>
                  Двухфакторная аутентификация
                </Typography>
                <Chip
                  label={user?.is_2fa_enabled ? "Включена" : "Отключена"}
                  size="small"
                  sx={{
                    height: 18,
                    fontSize: "0.65rem",
                    fontWeight: 700,
                    bgcolor: user?.is_2fa_enabled
                      ? "rgba(52,211,153,0.12)"
                      : "rgba(107,114,128,0.12)",
                    color: user?.is_2fa_enabled ? "#34d399" : textMuted,
                    border: "none",
                  }}
                />
              </Box>
              <Button
                size="small"
                disabled={twoFaLoading}
                onClick={user?.is_2fa_enabled ? disableTwoFa : startTwoFaSetup}
                sx={{
                  color: user?.is_2fa_enabled ? "#EF4444" : textPrimary,
                  textTransform: "none",
                  fontSize: "0.78rem",
                  minWidth: 0,
                  px: 1,
                  "&:hover": {
                    bgcolor: user?.is_2fa_enabled ? "rgba(239,68,68,0.06)" : undefined,
                  },
                }}
              >
                {twoFaLoading ? "..." : user?.is_2fa_enabled ? "Отключить" : "Включить"}
              </Button>
            </Box>

            {twoFaOpen && !user?.is_2fa_enabled && (
              <motion.div
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
              >
                {twoFaBackupCodes.length === 0 ? (
                  <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
                    {/* QR code + instructions */}
                    <Box
                      sx={{
                        display: "flex",
                        gap: 2.5,
                        alignItems: "flex-start",
                        px: 1.5,
                        py: 2,
                        borderRadius: "10px",
                        bgcolor: surface,
                        border: "1px solid",
                        borderColor,
                      }}
                    >
                      <Box sx={{ flexShrink: 0 }}>
                        {twoFaQrCode ? (
                          <Box
                            component="img"
                            src={twoFaQrCode}
                            alt="QR код"
                            sx={{ width: 112, height: 112, borderRadius: 1, display: "block" }}
                          />
                        ) : (
                          <Box
                            sx={{
                              width: 112,
                              height: 112,
                              borderRadius: 1,
                              bgcolor: borderColor,
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                            }}
                          >
                            <Typography sx={{ fontSize: "0.7rem", color: textMuted }}>
                              Загрузка...
                            </Typography>
                          </Box>
                        )}
                      </Box>
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography
                          sx={{ fontSize: "0.78rem", color: textPrimary, fontWeight: 600, mb: 0.5 }}
                        >
                          Настройка 2FA
                        </Typography>
                        <Typography
                          sx={{ fontSize: "0.73rem", color: textMuted, mb: 1.5, lineHeight: 1.6 }}
                        >
                          Отсканируйте QR-код в Google Authenticator, Microsoft Authenticator или
                          аналогичном приложении.
                        </Typography>
                        <Typography
                          sx={{
                            fontSize: "0.62rem",
                            color: textMuted,
                            mb: 0.5,
                            textTransform: "uppercase",
                            letterSpacing: "0.07em",
                          }}
                        >
                          Код для ручного ввода
                        </Typography>
                        <Box
                          sx={{
                            px: 1.25,
                            py: 0.75,
                            borderRadius: "7px",
                            bgcolor: inputBg,
                            fontFamily: "monospace",
                            fontSize: "0.78rem",
                            color: textPrimary,
                            letterSpacing: "0.08em",
                            wordBreak: "break-all",
                            userSelect: "all",
                          }}
                        >
                          {twoFaSecret || "—"}
                        </Box>
                      </Box>
                    </Box>

                    {/* Token input */}
                    <Box
                      sx={{
                        display: "flex",
                        gap: 1.5,
                        alignItems: "center",
                        px: 1.5,
                        py: 1.25,
                        borderRadius: "10px",
                        bgcolor: inputBg,
                      }}
                    >
                      <Box sx={{ flex: 1 }}>
                        <Typography
                          sx={{
                            fontSize: "0.62rem",
                            color: textMuted,
                            mb: 0.2,
                            textTransform: "uppercase",
                            letterSpacing: "0.07em",
                          }}
                        >
                          Код из приложения
                        </Typography>
                        <InputBase
                          value={twoFaToken}
                          onChange={(e) =>
                            setTwoFaToken(e.target.value.replace(/\D/g, "").slice(0, 6))
                          }
                          placeholder="000000"
                          inputProps={{ maxLength: 6, inputMode: "numeric" }}
                          sx={{
                            fontSize: "1.1rem",
                            fontWeight: 600,
                            color: textPrimary,
                            letterSpacing: "0.3em",
                            "& input": { p: 0 },
                          }}
                        />
                      </Box>
                      <Button
                        onClick={confirmTwoFa}
                        disabled={twoFaLoading || twoFaToken.length !== 6}
                        sx={{
                          borderRadius: "9px",
                          bgcolor: isDark ? "rgba(255,255,255,0.09)" : "rgba(0,0,0,0.06)",
                          color: textPrimary,
                          textTransform: "none",
                          fontWeight: 600,
                          fontSize: "0.82rem",
                          px: 2,
                          py: 1,
                          flexShrink: 0,
                          "&:hover": {
                            bgcolor: isDark ? "rgba(255,255,255,0.13)" : "rgba(0,0,0,0.09)",
                          },
                          "&:disabled": { opacity: 0.4 },
                        }}
                      >
                        {twoFaLoading ? "..." : "Подтвердить"}
                      </Button>
                    </Box>

                    <Button
                      size="small"
                      onClick={() => {
                        setTwoFaOpen(false);
                        setTwoFaQrCode("");
                        setTwoFaSecret("");
                        setTwoFaToken("");
                      }}
                      sx={{
                        alignSelf: "flex-start",
                        color: textMuted,
                        textTransform: "none",
                        fontSize: "0.78rem",
                        px: 0,
                      }}
                    >
                      Отмена
                    </Button>
                  </Box>
                ) : (
                  /* Backup codes shown after successful enable */
                  <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: 1,
                        px: 1.5,
                        py: 1.5,
                        borderRadius: "10px",
                        bgcolor: "rgba(52,211,153,0.07)",
                        border: "1px solid rgba(52,211,153,0.25)",
                      }}
                    >
                      <CheckCircleOutlineIcon sx={{ fontSize: 16, color: "#34d399" }} />
                      <Typography sx={{ fontSize: "0.82rem", fontWeight: 600, color: "#34d399" }}>
                        2FA успешно включена
                      </Typography>
                    </Box>
                    <Box>
                      <Typography sx={{ fontSize: "0.72rem", color: textMuted, mb: 1 }}>
                        Сохраните резервные коды — они помогут войти, если потеряете доступ к
                        приложению-аутентификатору:
                      </Typography>
                      <Box
                        sx={{
                          display: "grid",
                          gridTemplateColumns: "repeat(3, 1fr)",
                          gap: 0.75,
                          px: 1.5,
                          py: 1.25,
                          borderRadius: "10px",
                          bgcolor: inputBg,
                        }}
                      >
                        {twoFaBackupCodes.map((code, i) => (
                          <Typography
                            key={i}
                            sx={{
                              fontFamily: "monospace",
                              fontSize: "0.78rem",
                              color: textPrimary,
                              letterSpacing: "0.08em",
                            }}
                          >
                            {code}
                          </Typography>
                        ))}
                      </Box>
                    </Box>
                    <Button
                      size="small"
                      onClick={() => {
                        setTwoFaOpen(false);
                        setTwoFaBackupCodes([]);
                        setTwoFaQrCode("");
                        setTwoFaSecret("");
                      }}
                      sx={{
                        alignSelf: "flex-start",
                        color: textPrimary,
                        textTransform: "none",
                        fontSize: "0.78rem",
                        px: 1.5,
                        py: 0.75,
                        bgcolor: isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.05)",
                        "&:hover": {
                          bgcolor: isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.08)",
                        },
                        borderRadius: "7px",
                      }}
                    >
                      Готово
                    </Button>
                  </Box>
                )}
              </motion.div>
            )}
          </Box>
        </motion.div>

        <Divider sx={{ borderColor }} />

        {/* ── OAuth connection ── */}
        {user?.oauth_provider && (
          <>
            <motion.div
              variants={sectionVariants}
              initial="hidden"
              animate="show"
              transition={{ duration: 0.35, delay: 0.2 }}
            >
              <Box sx={{ py: 3 }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 2 }}>
                  <LinkOutlinedIcon sx={{ fontSize: 16, color: textMuted }} />
                  <Typography sx={{ fontWeight: 600, fontSize: "0.85rem", color: textPrimary }}>
                    Привязанный аккаунт
                  </Typography>
                </Box>
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 1.5,
                    px: 1.5,
                    py: 1.5,
                    borderRadius: "10px",
                    bgcolor: surface,
                  }}
                >
                  <Typography
                    sx={{
                      fontSize: "0.85rem",
                      color: textPrimary,
                      fontWeight: 600,
                    }}
                  >
                    {OAUTH_LABELS[user.oauth_provider] || user.oauth_provider}
                  </Typography>
                  <Box sx={{ flex: 1 }} />
                  <Chip
                    label="Подключено"
                    size="small"
                    sx={{
                      bgcolor: "#22C55E1A",
                      color: "#22C55E",
                      fontWeight: 600,
                      fontSize: "0.68rem",
                      height: 20,
                      borderRadius: "5px",
                      border: "none",
                    }}
                  />
                </Box>
              </Box>
            </motion.div>
            <Divider sx={{ borderColor }} />
          </>
        )}

        {/* ── Member since ── */}
        {user?.created_at && (
          <Box sx={{ py: 2.5 }}>
            <Typography sx={{ fontSize: "0.78rem", color: textMuted }}>
              В CURSA с{" "}
              {new Date(user.created_at).toLocaleDateString("ru-RU", {
                year: "numeric",
                month: "long",
              })}
            </Typography>
          </Box>
        )}
        <Divider sx={{ borderColor }} />

        {/* ── Danger zone ── */}
        <motion.div
          variants={sectionVariants}
          initial="hidden"
          animate="show"
          transition={{ duration: 0.35, delay: 0.25 }}
        >
          <Box sx={{ py: 3 }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 2 }}>
              <DeleteForeverOutlinedIcon sx={{ fontSize: 16, color: "#EF4444" }} />
              <Typography sx={{ fontWeight: 600, fontSize: "0.85rem", color: "#EF4444" }}>
                Зона опасности
              </Typography>
            </Box>
            <Box
              sx={{
                p: 2,
                borderRadius: "10px",
                border: "1px solid rgba(239,68,68,0.2)",
                bgcolor: isDark ? "rgba(239,68,68,0.05)" : "rgba(239,68,68,0.04)",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 2,
              }}
            >
              <Box sx={{ minWidth: 0 }}>
                <Typography sx={{ fontSize: "0.82rem", fontWeight: 600, color: textPrimary }}>
                  Удалить аккаунт
                </Typography>
                <Typography sx={{ fontSize: "0.72rem", color: textMuted, mt: 0.25 }}>
                  Все данные будут удалены без возможности восстановления
                </Typography>
              </Box>
              <Button
                size="small"
                onClick={() => {
                  setDeleteConfirmText("");
                  setDeleteAccountOpen(true);
                }}
                sx={{
                  borderRadius: "8px",
                  color: "#EF4444",
                  border: "1px solid rgba(239,68,68,0.35)",
                  textTransform: "none",
                  fontSize: "0.78rem",
                  fontWeight: 600,
                  px: 1.5,
                  flexShrink: 0,
                  "&:hover": { bgcolor: "rgba(239,68,68,0.08)" },
                }}
              >
                Удалить
              </Button>
            </Box>
          </Box>
        </motion.div>
        {/* ── Logout ── */}
        <Box sx={{ pt: 1, pb: 4 }}>
          <Button
            fullWidth
            startIcon={<LogoutIcon sx={{ fontSize: "17px !important" }} />}
            onClick={() => {
              logout();
              navigate("/");
            }}
            sx={{
              borderRadius: "12px",
              bgcolor: isDark ? "rgba(239,68,68,0.09)" : "rgba(239,68,68,0.06)",
              color: "#EF4444",
              textTransform: "none",
              fontWeight: 600,
              py: 1.4,
              fontSize: "0.9rem",
              "&:hover": {
                bgcolor: isDark ? "rgba(239,68,68,0.15)" : "rgba(239,68,68,0.11)",
              },
            }}
          >
            Выйти из аккаунта
          </Button>
        </Box>
      </Box>

      {/* Snackbar */}
      <Snackbar
        open={snack.open}
        autoHideDuration={3000}
        onClose={() => setSnack((s) => ({ ...s, open: false }))}
        message={snack.message}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
        ContentProps={{
          sx: {
            bgcolor: snack.error ? "#EF4444" : isDark ? "#1C1C1E" : "#000",
            color: "#fff",
            borderRadius: "12px",
            fontWeight: 500,
            fontSize: "0.875rem",
          },
        }}
      />

      {/* Delete account confirmation dialog */}
      <Dialog
        open={deleteAccountOpen}
        onClose={() => setDeleteAccountOpen(false)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle sx={{ fontWeight: 700, fontSize: "1rem" }}>Удалить аккаунт?</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ fontSize: "0.85rem", mb: 2 }}>
            Это действие необратимо. Все ваши данные, история проверок и настройки будут удалены
            навсегда. Введите <strong>УДАЛИТЬ</strong> для подтверждения.
          </DialogContentText>
          <InputBase
            value={deleteConfirmText}
            onChange={(e) => setDeleteConfirmText(e.target.value)}
            placeholder="УДАЛИТЬ"
            autoFocus
            sx={{
              px: 1.5,
              py: 1,
              borderRadius: "8px",
              border: "1px solid",
              borderColor: deleteConfirmText === "УДАЛИТЬ" ? "#EF4444" : "rgba(0,0,0,0.15)",
              fontSize: "0.85rem",
              width: "100%",
              fontFamily: "monospace",
              transition: "border-color 0.2s",
            }}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button
            onClick={() => setDeleteAccountOpen(false)}
            sx={{ textTransform: "none", fontSize: "0.82rem" }}
          >
            Отмена
          </Button>
          <Button
            disabled={deleteConfirmText !== "УДАЛИТЬ" || deleteAccountLoading}
            onClick={async () => {
              setDeleteAccountLoading(true);
              try {
                const token = localStorage.getItem("access_token");
                await axios.delete(`${API_BASE}/api/auth/delete-account`, {
                  headers: { Authorization: `Bearer ${token}` },
                });
                logout();
                navigate("/");
              } catch (e) {
                showSnack(e.response?.data?.error || "Ошибка удаления аккаунта", true);
                setDeleteAccountLoading(false);
                setDeleteAccountOpen(false);
              }
            }}
            color="error"
            variant="contained"
            sx={{ textTransform: "none", fontWeight: 600, fontSize: "0.82rem", boxShadow: "none" }}
          >
            {deleteAccountLoading ? "Удаление..." : "Удалить навсегда"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
