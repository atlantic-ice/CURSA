import AccountCircleOutlinedIcon from "@mui/icons-material/AccountCircleOutlined";
import BadgeOutlinedIcon from "@mui/icons-material/BadgeOutlined";
import BusinessOutlinedIcon from "@mui/icons-material/BusinessOutlined";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import KeyOutlinedIcon from "@mui/icons-material/KeyOutlined";
import LinkOutlinedIcon from "@mui/icons-material/LinkOutlined";
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
  Divider,
  IconButton,
  InputBase,
  Snackbar,
  Tooltip,
  Typography,
} from "@mui/material";
import axios, { AxiosError } from "axios";
import { motion } from "framer-motion";
import { FC, ReactNode, useContext, useState } from "react";
import { useNavigate } from "react-router-dom";

import { AuthContext, CheckHistoryContext } from "../App";
import usePageStyles from "../hooks/usePageStyles";

const isLocal =
  typeof window !== "undefined" &&
  (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1");
const API_BASE = isLocal
  ? "http://localhost:5000"
  : process.env.REACT_APP_API_BASE || "https://cursa.onrender.com";

/**
 * Role labels mapping
 */
const ROLE_LABELS: Record<string, string> = {
  user: "Пользователь",
  pro: "Pro",
  team: "Team",
  enterprise: "Enterprise",
  admin: "Администратор",
  guest: "Гость",
};

/**
 * Role colors mapping
 */
const ROLE_COLORS: Record<string, string> = {
  user: "#6B7280",
  pro: "#4F46E5",
  team: "#0EA5E9",
  enterprise: "#F59E0B",
  admin: "#EF4444",
  guest: "#9CA3AF",
};

/**
 * OAuth provider labels mapping
 */
const OAUTH_LABELS: Record<string, string> = {
  google: "Google",
  github: "GitHub",
  yandex: "Яндекс",
  telegram: "Telegram",
};

/**
 * Section animation variants
 */
const sectionVariants = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0 },
};

/**
 * Snackbar state interface
 */
interface SnackbarState {
  open: boolean;
  message: string;
  error: boolean;
}

/**
 * User profile data interface from AuthContext
 */
interface UserProfile {
  email: string;
  first_name?: string;
  last_name?: string;
  organization?: string;
  role?: string;
  is_email_verified?: boolean;
  is_2fa_enabled?: boolean;
  has_password?: boolean;
  oauth_provider?: string;
  created_at?: string;
}

/**
 * Profile field config interface
 */
interface ProfileField {
  label: string;
  icon: ReactNode;
  value: string;
  setter: (value: string) => void;
}

/**
 * AccountPageProps interface (no props required)
 */
interface AccountPageProps {}

/**
 * AccountPage Component
 *
 * User account management page with profile editing, password change, 2FA setup,
 * OAuth connections, and account deletion.
 *
 * Features:
 * - Profile information and edit mode (name, last name, organization)
 * - Email verification status with resend capability
 * - Password change with validation
 * - Two-factor authentication (2FA) setup with QR code and backup codes
 * - OAuth provider connection display
 * - Account creation date
 * - User statistics from validation history (total checks, avg score, corrections)
 * - Logout button
 *
 * State management:
 * - profileEditing: Edit mode toggle for profile data
 * - Password forms: oldPassword, newPassword, confirmPassword
 * - 2FA setup: QR code, secret, token, backup codes
 * - deleteAccountOpen: Account deletion confirmation dialog
 * - snackbar: Notifications for user actions
 *
 * @returns React component with account management interface
 */
const AccountPage: FC<AccountPageProps> = () => {
  const { isDark, textPrimary, textMuted, borderColor, surface } = usePageStyles();
  const { user, logout, updateUser } = useContext(AuthContext);
  const { history } = useContext(CheckHistoryContext);
  const navigate = useNavigate();

  const inputBg = isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)";
  const fieldHoverBg = isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.03)";

  // Profile edit state
  const [profileEditing, setProfileEditing] = useState<boolean>(false);
  const [firstName, setFirstName] = useState<string>(user?.first_name || "");
  const [lastName, setLastName] = useState<string>(user?.last_name || "");
  const [organization, setOrganization] = useState<string>(user?.organization || "");
  const [profileSaving, setProfileSaving] = useState<boolean>(false);

  // Password state
  const [passwordOpen, setPasswordOpen] = useState<boolean>(false);
  const [oldPassword, setOldPassword] = useState<string>("");
  const [newPassword, setNewPassword] = useState<string>("");
  const [confirmPassword, setConfirmPassword] = useState<string>("");
  const [passwordSaving, setPasswordSaving] = useState<boolean>(false);
  const [showPwd, setShowPwd] = useState<boolean>(false);

  // Delete account state
  const [deleteAccountOpen, setDeleteAccountOpen] = useState<boolean>(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState<string>("");
  const [deleteAccountLoading, setDeleteAccountLoading] = useState<boolean>(false);

  // 2FA state
  const [twoFaOpen, setTwoFaOpen] = useState<boolean>(false);
  const [twoFaLoading, setTwoFaLoading] = useState<boolean>(false);
  const [twoFaQrCode, setTwoFaQrCode] = useState<string>("");
  const [twoFaSecret, setTwoFaSecret] = useState<string>("");
  const [twoFaToken, setTwoFaToken] = useState<string>("");
  const [twoFaBackupCodes, setTwoFaBackupCodes] = useState<string[]>([]);

  // Snackbar state
  const [snack, setSnack] = useState<SnackbarState>({ open: false, message: "", error: false });

  // Email verification
  const [verificationSending, setVerificationSending] = useState<boolean>(false);

  /**
   * Show snackbar notification
   *
   * @param message - Notification message
   * @param error - Whether message is an error
   */
  const showSnack = (message: string, error: boolean = false): void => {
    setSnack({ open: true, message, error });
  };

  // Computed values
  const displayName =
    user?.first_name && user?.last_name
      ? `${user.first_name} ${user.last_name}`
      : user?.first_name || user?.email?.split("@")[0] || "Аккаунт";

  const initials = (user?.first_name?.[0] || user?.email?.[0] || "U").toUpperCase();
  const role = user?.role || "user";

  // Statistics from local history
  const totalChecks = history.length;
  const avgScore =
    totalChecks > 0
      ? Math.round(history.reduce((acc, h) => acc + (h.score || 0), 0) / totalChecks)
      : 0;
  const withFixes = history.filter(
    (h) => h.correctedFilePath || h.reportData?.corrected_file_path,
  ).length;

  /**
   * Save profile changes to API
   */
  const saveProfile = async (): Promise<void> => {
    setProfileSaving(true);
    try {
      const token = localStorage.getItem("access_token");
      const { data } = await axios.put<{ user: UserProfile }>(
        `${API_BASE}/api/auth/me`,
        { first_name: firstName, last_name: lastName, organization },
        { headers: { Authorization: `Bearer ${token}` } },
      );
      if (data?.user) updateUser(data.user);
      showSnack("Профиль обновлён");
      setProfileEditing(false);
    } catch (err) {
      const errorMsg =
        err instanceof AxiosError && err.response?.data?.error
          ? (err.response.data as { error: string }).error
          : err instanceof Error
            ? err.message
            : "Unknown error";
      showSnack(errorMsg, true);
    } finally {
      setProfileSaving(false);
    }
  };

  /**
   * Cancel profile editing and reset form
   */
  const cancelProfileEdit = (): void => {
    setProfileEditing(false);
    setFirstName(user?.first_name || "");
    setLastName(user?.last_name || "");
    setOrganization(user?.organization || "");
  };

  /**
   * Change user password
   */
  const handleChangePassword = async (): Promise<void> => {
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
    } catch (err) {
      const errorMsg =
        err instanceof AxiosError && err.response?.data?.error
          ? (err.response.data as { error: string }).error
          : err instanceof Error
            ? err.message
            : "Unknown error";
      showSnack(errorMsg, true);
    } finally {
      setPasswordSaving(false);
    }
  };

  /**
   * Start 2FA setup process
   */
  const startTwoFaSetup = async (): Promise<void> => {
    setTwoFaLoading(true);
    try {
      const token = localStorage.getItem("access_token");
      const { data } = await axios.post<{ qr_code: string; secret: string }>(
        `${API_BASE}/api/auth/2fa/setup`,
        {},
        { headers: { Authorization: `Bearer ${token}` } },
      );
      setTwoFaQrCode(data.qr_code);
      setTwoFaSecret(data.secret);
      setTwoFaToken("");
      setTwoFaBackupCodes([]);
      setTwoFaOpen(true);
    } catch (err) {
      const errorMsg =
        err instanceof AxiosError && err.response?.data?.error
          ? (err.response.data as { error: string }).error
          : err instanceof Error
            ? err.message
            : "Unknown error";
      showSnack(errorMsg, true);
    } finally {
      setTwoFaLoading(false);
    }
  };

  /**
   * Confirm 2FA token and enable 2FA
   */
  const confirmTwoFa = async (): Promise<void> => {
    if (!twoFaToken || twoFaToken.length !== 6) {
      showSnack("Введите 6-значный код", true);
      return;
    }

    setTwoFaLoading(true);
    try {
      const token = localStorage.getItem("access_token");
      const { data } = await axios.post<{ backup_codes: string[] }>(
        `${API_BASE}/api/auth/2fa/enable`,
        { secret: twoFaSecret, token: twoFaToken },
        { headers: { Authorization: `Bearer ${token}` } },
      );
      setTwoFaBackupCodes(data.backup_codes || []);
      if (user) updateUser({ ...user, is_2fa_enabled: true });
      showSnack("2FA успешно включена");
    } catch (err) {
      const errorMsg =
        err instanceof AxiosError && err.response?.data?.error
          ? (err.response.data as { error: string }).error
          : err instanceof Error
            ? err.message
            : "Unknown error";
      showSnack(errorMsg, true);
    } finally {
      setTwoFaLoading(false);
    }
  };

  /**
   * Disable 2FA
   */
  const disableTwoFa = async (): Promise<void> => {
    setTwoFaLoading(true);
    try {
      const token = localStorage.getItem("access_token");
      await axios.post(
        `${API_BASE}/api/auth/2fa/disable`,
        {},
        { headers: { Authorization: `Bearer ${token}` } },
      );
      if (user) updateUser({ ...user, is_2fa_enabled: false });
      setTwoFaOpen(false);
      showSnack("2FA отключена");
    } catch (err) {
      const errorMsg =
        err instanceof AxiosError && err.response?.data?.error
          ? (err.response.data as { error: string }).error
          : err instanceof Error
            ? err.message
            : "Unknown error";
      showSnack(errorMsg, true);
    } finally {
      setTwoFaLoading(false);
    }
  };

  /**
   * Resend email verification
   */
  const resendEmailVerification = async (): Promise<void> => {
    setVerificationSending(true);
    try {
      const token = localStorage.getItem("access_token");
      await axios.post(
        `${API_BASE}/api/auth/resend-verification`,
        {},
        { headers: { Authorization: `Bearer ${token}` } },
      );
      showSnack("Письмо отправлено");
    } catch (err) {
      const errorMsg =
        err instanceof AxiosError && err.response?.data?.error
          ? (err.response.data as { error: string }).error
          : err instanceof Error
            ? err.message
            : "Unknown error";
      showSnack(errorMsg, true);
    } finally {
      setVerificationSending(false);
    }
  };

  if (!user) {
    return null;
  }

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
        {/* Page header */}
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

          {/* Avatar + display name + role */}
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
                  {user.email}
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

        {/* Statistics */}
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

        {/* Profile section */}
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
                    onClick={(): void => setProfileEditing(true)}
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

            {/* Profile fields */}
            <Box sx={{ display: "flex", flexDirection: "column", gap: 0.75 }}>
              {(
                [
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
                ] as ProfileField[]
              ).map(({ label, icon, value, setter }) => (
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
                        onChange={(e): void => setter(e.target.value)}
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

              {/* Email field (read-only) */}
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
                    {user.email || "—"}
                  </Typography>
                </Box>
                {user.is_email_verified && (
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

        {/* Email verification banner */}
        {!user.is_email_verified && (
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
                onClick={resendEmailVerification}
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

        {/* Password section */}
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
                onClick={(): void => {
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
                {passwordOpen ? "Отмена" : user.has_password ? "Изменить" : "Установить"}
              </Button>
            </Box>

            {passwordOpen && (
              <motion.div
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
              >
                <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                  {(user.has_password
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
                          onChange={(e): void => setter(e.target.value)}
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

                  {/* Password controls */}
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1, mt: 0.5 }}>
                    <IconButton
                      size="small"
                      onClick={(): void => setShowPwd(!showPwd)}
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

        {/* 2FA section */}
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
                mb: twoFaOpen && !user.is_2fa_enabled ? 2 : 0,
              }}
            >
              <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                <ShieldOutlinedIcon sx={{ fontSize: 16, color: textMuted }} />
                <Typography sx={{ fontWeight: 600, fontSize: "0.85rem", color: textPrimary }}>
                  Двухфакторная аутентификация
                </Typography>
                <Chip
                  label={user.is_2fa_enabled ? "Включена" : "Отключена"}
                  size="small"
                  sx={{
                    height: 18,
                    fontSize: "0.65rem",
                    fontWeight: 700,
                    bgcolor: user.is_2fa_enabled
                      ? "rgba(52,211,153,0.12)"
                      : "rgba(107,114,128,0.12)",
                    color: user.is_2fa_enabled ? "#34d399" : textMuted,
                    border: "none",
                  }}
                />
              </Box>
              <Button
                size="small"
                disabled={twoFaLoading}
                onClick={user.is_2fa_enabled ? disableTwoFa : startTwoFaSetup}
                sx={{
                  color: user.is_2fa_enabled ? "#EF4444" : textPrimary,
                  textTransform: "none",
                  fontSize: "0.78rem",
                  minWidth: 0,
                  px: 1,
                  "&:hover": {
                    bgcolor: user.is_2fa_enabled ? "rgba(239,68,68,0.06)" : undefined,
                  },
                }}
              >
                {twoFaLoading ? "..." : user.is_2fa_enabled ? "Отключить" : "Включить"}
              </Button>
            </Box>

            {/* 2FA Setup Form */}
            {twoFaOpen && !user.is_2fa_enabled && (
              <motion.div
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
              >
                {twoFaBackupCodes.length === 0 ? (
                  <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
                    {/* QR Code Section */}
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
                          sx={{
                            fontSize: "0.78rem",
                            color: textPrimary,
                            fontWeight: 600,
                            mb: 0.5,
                          }}
                        >
                          Настройка 2FA
                        </Typography>
                        <Typography
                          sx={{
                            fontSize: "0.73rem",
                            color: textMuted,
                            mb: 1.5,
                            lineHeight: 1.6,
                          }}
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

                    {/* Token verification input */}
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
                          onChange={(e): void =>
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
                      onClick={(): void => {
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
                  /* Backup codes display */
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
                      onClick={(): void => {
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

        {/* OAuth connections section */}
        {user.oauth_provider && (
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

        {/* Member since date */}
        {user.created_at && (
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
      </Box>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snack.open}
        autoHideDuration={4000}
        onClose={(): void => setSnack({ ...snack, open: false })}
        message={snack.message}
        style={{
          color: snack.error ? "#EF4444" : textPrimary,
        }}
      />
    </Box>
  );
};

export default AccountPage;
