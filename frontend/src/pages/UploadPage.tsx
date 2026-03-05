import {
  ArrowForwardRounded,
  DarkModeRounded,
  DescriptionRounded,
  InsertDriveFileRounded,
  LightModeRounded,
} from "@mui/icons-material";
import {
  Avatar,
  Box,
  Button,
  IconButton,
  LinearProgress,
  Theme,
  Tooltip,
  Typography,
  useTheme,
} from "@mui/material";
import { AnimatePresence, motion } from "framer-motion";
import { FC, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { DropzoneOptions, useDropzone } from "react-dropzone";
import toast, { Toaster } from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import { AuthContext, CheckHistoryContext, ColorModeContext } from "../App";
import { documentsApi } from "../api/client";
import usePageStyles from "../hooks/usePageStyles";
import BrandLogo from "../components/BrandLogo";
import type { User, ValidationReport } from "../types";

/**
 * Upload page interface
 */
interface UploadPageProps {
  className?: string;
}

/**
 * Profile type from API
 */
interface Profile {
  id: string;
  name: string;
  university: string;
  rules?: Record<string, unknown>;
}

/**
 * History item type
 */
interface HistoryItem {
  fileName: string;
  timestamp: number;
  totalIssues: number;
  score: number;
  reportData: ValidationReport;
  profileId: string;
}

/**
 * Toast style type
 */
interface ToastStyleType {
  background: string;
  color: string;
  border: string;
  borderRadius: string;
  boxShadow: string;
}

/**
 * Auth Context type
 */
interface AuthContextType {
  user: User | null;
}

/**
 * Check History Context type
 */
interface CheckHistoryContextType {
  addToHistory: (item: HistoryItem) => void;
}

/**
 * Color Mode Context type
 */
interface ColorModeContextType {
  toggleColorMode: () => void;
}

/**
 * UploadPage Component
 *
 * Main page for document upload and initial analysis
 * Features:
 * - Drag-drop file upload
 * - Profile selection
 * - Document analysis with progress tracking
 * - Responsive design with animations
 * - Dark/light theme support
 */
const UploadPage: FC<UploadPageProps> = ({ className = "" }) => {
  const theme: Theme = useTheme();
  const { textMuted: commonTextMuted, textSubtle: commonTextSubtle } = usePageStyles();
  const colorMode = useContext(ColorModeContext) as ColorModeContextType;
  const { addToHistory } = useContext(CheckHistoryContext) as CheckHistoryContextType;
  const { user } = useContext(AuthContext) as AuthContextType;
  const navigate = useNavigate();

  // Theme-based colors
  const isDark: boolean = theme.palette.mode === "dark";
  const pageBg: string = isDark ? "#000000" : "#ffffff";
  const cardBg: string = isDark ? "#1C1C1E" : "#F2F2F7";
  const hoverBg: string = isDark ? "#2C2C2E" : "#EBEBF0";
  const activeBg: string = isDark ? "#3A3A3C" : "#E5E5EA";
  const textPrimary: string = isDark ? "#ffffff" : "#000000";
  const textMuted: string = commonTextMuted;
  const textSubtle: string = commonTextSubtle;
  const subtleBg: string = isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)";
  const fileCardInnerBg: string = isDark ? "#2C2C2E" : "#ffffff";
  const headerBg: string = isDark ? "rgba(0,0,0,0.85)" : "rgba(255,255,255,0.82)";
  const iconBtnBg: string = isDark ? "#2C2C2E" : "#F2F2F7";
  const iconBtnHover: string = isDark ? "#3A3A3C" : "#E5E5EA";
  const iconColor: string = isDark ? "rgba(235,235,245,0.7)" : "rgba(0,0,0,0.5)";
  const processingBarColor: string = isDark
    ? "linear-gradient(90deg, transparent, #ffffff, transparent)"
    : "linear-gradient(90deg, transparent, #000000, transparent)";

  // Toast styling
  const toastStyle: ToastStyleType = useMemo(
    () => ({
      background: isDark ? "#1C1C1E" : "#ffffff",
      color: textPrimary,
      border: "none",
      borderRadius: "14px",
      boxShadow: isDark ? "0 4px 24px rgba(0,0,0,0.4)" : "0 4px 24px rgba(0,0,0,0.08)",
    }),
    [isDark, textPrimary],
  );

  // State management
  const [isHovered, setIsHovered] = useState<boolean>(false);
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [selectedProfile, setSelectedProfile] = useState<string>("default_gost");

  /**
   * Load available profiles on component mount
   */
  useEffect((): void => {
    const loadProfiles = async (): Promise<void> => {
      try {
        const accessToken = localStorage.getItem("access_token") || undefined;
        const profiles = await documentsApi.getProfiles(accessToken);
        if (Array.isArray(profiles) && profiles.length > 0) {
          setProfiles(profiles as Profile[]);
          const saved = localStorage.getItem("cursa_profile");
          if (saved && profiles.find((p) => (p as Profile).id === saved)) {
            setSelectedProfile(saved);
          }
        }
      } catch (error) {
        const msg = error instanceof Error ? error.message : "Не удалось загрузить профили";
        console.error("Failed to load profiles:", msg);
      }
    };

    loadProfiles();
  }, []);

  /**
   * Handle file drop/selection
   */
  const onDrop = useCallback(
    (acceptedFiles: File[]): void => {
      if (acceptedFiles.length === 0) return;

      const selected = acceptedFiles[0];

      // Validate file format
      if (!selected.name.toLowerCase().endsWith(".docx")) {
        toast.error("Поддерживается только формат .docx", { style: toastStyle });
        return;
      }

      // Validate file size (20MB limit)
      if (selected.size > 20 * 1024 * 1024) {
        toast.error("Файл слишком велик (макс 20 МБ)", { style: toastStyle });
        return;
      }

      setFile(selected);
      toast.success("Файл готов к обработке", {
        icon: "",
        style: toastStyle,
      });
    },
    [toastStyle],
  );

  /**
   * Configure dropzone
   */
  const dropzoneOptions: DropzoneOptions = {
    onDrop,
    accept: {
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [".docx"],
    },
    maxFiles: 1,
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone(dropzoneOptions);

  /**
   * Handle document analysis
   */
  const handleProcess = async (): Promise<void> => {
    if (!file) return;

    setIsProcessing(true);
    setUploadProgress(10);

    try {
      localStorage.setItem("cursa_profile", selectedProfile || "default_gost");

      setUploadProgress(30);

      const reportData = await documentsApi.validate(
        file,
        selectedProfile || "default_gost",
        localStorage.getItem("access_token") || undefined,
      );
      setUploadProgress(100);

      // Save to history
      const totalIssues: number = Array.isArray((reportData as { issues?: unknown[] })?.issues)
        ? ((reportData as { issues?: unknown[] }).issues?.length ?? 0)
        : 0;

      const historyItem: HistoryItem = {
        fileName: file.name,
        timestamp: Date.now(),
        totalIssues,
        score: (reportData?.score as number) ?? 0,
        reportData: reportData as unknown as ValidationReport,
        profileId: selectedProfile || "default_gost",
      };

      addToHistory(historyItem);

      // Navigate to report page
      const selectedProfileObj = profiles.find((p) => p.id === (selectedProfile || "default_gost"));
      navigate("/report", {
        state: {
          reportData,
          fileName: file.name,
          profileId: selectedProfile || "default_gost",
          profileName: selectedProfileObj?.university || selectedProfileObj?.name || "ГОСТ",
        },
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Не удалось обработать документ";
      toast.error(errorMessage, { style: toastStyle });
      setIsProcessing(false);
      setUploadProgress(0);
    }
  };

  /**
   * Navigate to a specific route
   */
  const handleNavigate = (path: string): void => {
    navigate(path);
  };

  /**
   * Handle theme toggle
   */
  const handleThemeToggle = (): void => {
    colorMode.toggleColorMode();
  };

  /**
   * Clear selected file
   */
  const handleClearFile = (): void => {
    if (!isProcessing) {
      setFile(null);
    }
  };

  return (
    <Box
      className={className}
      sx={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        bgcolor: pageBg,
        color: textPrimary,
      }}
    >
      <Toaster position="bottom-center" />

      {/* Header */}
      <Box
        component={motion.div}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        sx={{
          px: { xs: 3, md: 5 },
          py: 2.5,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          position: "sticky",
          top: 0,
          zIndex: 10,
          background: headerBg,
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
        }}
      >
        {/* Logo instead of CURSA text */}
        <BrandLogo size="medium" />

        {/* Navigation buttons */}
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <Button
            onClick={() => window.scrollTo({ top: 400, behavior: "smooth" })}
            sx={{
              borderRadius: "20px",
              color: textMuted,
              textTransform: "none",
              fontWeight: 500,
              fontSize: "0.875rem",
              px: 1.5,
              py: 0.75,
              boxShadow: "none",
              border: "none",
              minWidth: 0,
              display: { xs: "none", sm: "inline-flex" },
              "&:hover": { bgcolor: iconBtnHover, color: textPrimary, boxShadow: "none" },
            }}
          >
            Проверить
          </Button>
          {["Панель", "История"].map((label, i) => (
            <Button
              key={label}
              onClick={() => handleNavigate(i === 0 ? "/dashboard" : "/history")}
              sx={{
                borderRadius: "20px",
                color: textMuted,
                textTransform: "none",
                fontWeight: 500,
                fontSize: "0.875rem",
                px: 1.5,
                py: 0.75,
                boxShadow: "none",
                border: "none",
                minWidth: 0,
                display: { xs: "none", md: "inline-flex" },
                "&:hover": { bgcolor: iconBtnHover, color: textPrimary, boxShadow: "none" },
              }}
            >
              {label}
            </Button>
          ))}

          {/* Theme toggle */}
          <IconButton
            onClick={handleThemeToggle}
            sx={{
              width: 36,
              height: 36,
              borderRadius: "50%",
              bgcolor: iconBtnBg,
              color: textPrimary,
              "&:hover": { bgcolor: iconBtnHover },
            }}
          >
            {isDark ? (
              <LightModeRounded sx={{ fontSize: 18 }} />
            ) : (
              <DarkModeRounded sx={{ fontSize: 18 }} />
            )}
          </IconButton>

          {/* User account */}
          {user ? (
            <Tooltip title={user.name || user.email || "Аккаунт"}>
              <IconButton
                onClick={() => handleNavigate("/account")}
                sx={{
                  width: 36,
                  height: 36,
                  p: 0,
                  borderRadius: "50%",
                  overflow: "hidden",
                }}
              >
                <Avatar
                  sx={{
                    width: 36,
                    height: 36,
                    fontSize: "0.875rem",
                    fontWeight: 700,
                    bgcolor: iconBtnBg,
                    color: textPrimary,
                  }}
                >
                  {(user.name?.[0] || user.email?.[0] || "U").toUpperCase()}
                </Avatar>
              </IconButton>
            </Tooltip>
          ) : (
            <Button
              onClick={() => handleNavigate("/login")}
              endIcon={<ArrowForwardRounded sx={{ fontSize: "16px !important" }} />}
              sx={{
                borderRadius: "20px",
                bgcolor: iconBtnBg,
                color: textPrimary,
                textTransform: "none",
                fontWeight: 500,
                fontSize: "0.875rem",
                px: 2,
                py: 0.75,
                boxShadow: "none",
                border: "none",
                minWidth: 0,
                "&:hover": { bgcolor: iconBtnHover, boxShadow: "none" },
              }}
            >
              Войти
            </Button>
          )}
        </Box>
      </Box>

      {/* Main Content */}
      <Box
        sx={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          px: { xs: 3, md: 4 },
          py: { xs: 3, md: 4 },
        }}
      >
        {/* Hero text */}
        <Box
          component={motion.div}
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.65 }}
          sx={{ textAlign: "center", mb: { xs: 3, md: 4 }, maxWidth: 520, mx: "auto" }}
        >
          <Typography
            component="h1"
            sx={{
              fontSize: { xs: "2rem", md: "3.5rem" },
              fontWeight: 700,
              lineHeight: 1.15,
              mb: 2.5,
              letterSpacing: "-0.025em",
              color: textPrimary,
              fontFamily: "'Wix Madefor Display', sans-serif",
            }}
          >
            Идеальный нормоконтроль.
            <br />
            Мгновенно.
          </Typography>
          <Typography
            sx={{
              fontSize: "1rem",
              color: textMuted,
              maxWidth: 380,
              mx: "auto",
              fontWeight: 400,
              lineHeight: 1.65,
            }}
          >
            Проверка курсовых и дипломных работ на соответствие ГОСТ и методичкам вуза.
          </Typography>
        </Box>

        {/* Profile selector */}
        {profiles.length > 0 && (
          <Box
            component={motion.div}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.45, delay: 0.2 }}
            sx={{ mb: 2, width: "100%", maxWidth: 480, mx: "auto" }}
          >
            <Typography
              sx={{
                fontSize: "0.7rem",
                color: textSubtle,
                fontWeight: 600,
                mb: 1.25,
                textAlign: "center",
                letterSpacing: "0.08em",
                textTransform: "uppercase",
              }}
            >
              Профиль проверки
            </Typography>
            <Box
              sx={{
                display: "flex",
                gap: 1,
                overflowX: "auto",
                flexWrap: "nowrap",
                justifyContent: "flex-start",
                scrollbarWidth: "none",
                "&::-webkit-scrollbar": { display: "none" },
                pb: 0.5,
              }}
            >
              {profiles.map((profile: Profile) => {
                const label = profile.university || profile.name;
                const isSelected = selectedProfile === profile.id;
                return (
                  <Box
                    key={profile.id}
                    onClick={() => setSelectedProfile(profile.id)}
                    sx={{
                      px: 1.75,
                      py: 0.625,
                      borderRadius: "20px",
                      cursor: "pointer",
                      flexShrink: 0,
                      bgcolor: isSelected ? (isDark ? "#ffffff" : "#000000") : subtleBg,
                      color: isSelected ? (isDark ? "#000000" : "#ffffff") : textMuted,
                      fontSize: "0.78rem",
                      fontWeight: isSelected ? 600 : 500,
                      transition: "all 0.15s ease",
                      userSelect: "none",
                      "&:hover": {
                        bgcolor: isSelected ? (isDark ? "#e8e8e8" : "#1a1a1a") : hoverBg,
                      },
                    }}
                  >
                    {label}
                  </Box>
                );
              })}
            </Box>
          </Box>
        )}

        {/* Drop zone / File ready */}
        <AnimatePresence mode="wait">
          {!file ? (
            <motion.div
              key="dropzone"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.97 }}
              transition={{ duration: 0.3 }}
              style={{ width: "100%", maxWidth: 480 }}
            >
              <Box
                {...getRootProps()}
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
                sx={{
                  background: isDragActive ? activeBg : isHovered ? hoverBg : cardBg,
                  borderRadius: "20px",
                  p: { xs: "40px 28px", md: "52px 40px" },
                  textAlign: "center",
                  cursor: "pointer",
                  transition: "background 0.18s ease, transform 0.18s ease",
                  transform: isDragActive ? "scale(0.985)" : "scale(1)",
                  userSelect: "none",
                }}
              >
                <input {...getInputProps()} />

                {/* File icon */}
                <Box
                  sx={{
                    width: 56,
                    height: 56,
                    mx: "auto",
                    mb: 3,
                    borderRadius: "14px",
                    background: fileCardInnerBg,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    boxShadow: isDark ? "0 2px 8px rgba(0,0,0,0.3)" : "0 2px 8px rgba(0,0,0,0.07)",
                    transition: "box-shadow 0.18s ease",
                  }}
                >
                  <InsertDriveFileRounded
                    sx={{
                      fontSize: 25,
                      color: isDragActive ? textPrimary : iconColor,
                      transition: "color 0.18s ease",
                    }}
                  />
                </Box>

                <Typography
                  sx={{
                    fontWeight: 600,
                    mb: 1,
                    color: textPrimary,
                    fontFamily: "'Wix Madefor Display', sans-serif",
                    fontSize: "1.05rem",
                  }}
                >
                  {isDragActive ? "Отпустите файл здесь" : "Загрузите файл .docx"}
                </Typography>

                <Typography
                  sx={{
                    color: textMuted,
                    fontSize: "0.875rem",
                    mb: 3.5,
                    fontWeight: 400,
                  }}
                >
                  Перетащите или нажмите для выбора
                </Typography>

                <Box
                  sx={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 1.5,
                    px: 2.5,
                    py: 1,
                    borderRadius: "20px",
                    background: subtleBg,
                  }}
                >
                  <Typography variant="caption" sx={{ color: textSubtle, fontWeight: 500 }}>
                    До 20 МБ
                  </Typography>
                  <Box
                    sx={{
                      width: 3,
                      height: 3,
                      borderRadius: "50%",
                      background: isDark ? "rgba(235,235,245,0.18)" : "rgba(0,0,0,0.18)",
                    }}
                  />
                  <Typography variant="caption" sx={{ color: textSubtle, fontWeight: 500 }}>
                    Только DOCX
                  </Typography>
                </Box>
              </Box>
            </motion.div>
          ) : (
            <motion.div
              key="file-ready"
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.97 }}
              transition={{ duration: 0.3 }}
              style={{ width: "100%", maxWidth: 440 }}
            >
              <Box
                sx={{
                  background: isDark ? "#1C1C1E" : cardBg,
                  borderRadius: "20px",
                  p: { xs: 3, md: 3.5 },
                  position: "relative",
                  overflow: "hidden",
                }}
              >
                {isProcessing && (
                  <>
                    <motion.div
                      initial={{ x: "-100%" }}
                      animate={{ x: "100%" }}
                      transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                      style={{
                        position: "absolute",
                        top: 0,
                        left: 0,
                        right: 0,
                        height: 2,
                        background: processingBarColor,
                      }}
                    />
                    {uploadProgress > 0 && uploadProgress < 100 && (
                      <LinearProgress
                        variant="determinate"
                        value={uploadProgress}
                        sx={{
                          position: "absolute",
                          top: 2,
                          left: 0,
                          right: 0,
                          height: 2,
                          bgcolor: "transparent",
                          "& .MuiLinearProgress-bar": {
                            bgcolor: isDark ? "rgba(255,255,255,0.5)" : "rgba(0,0,0,0.4)",
                          },
                        }}
                      />
                    )}
                  </>
                )}

                <Typography
                  sx={{
                    fontWeight: 600,
                    mb: 2.5,
                    textAlign: "center",
                    color: textPrimary,
                    fontFamily: "'Wix Madefor Display', sans-serif",
                    fontSize: "1rem",
                  }}
                >
                  Документ готов
                </Typography>

                {/* File info */}
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 1.5,
                    mb: 3,
                    p: 2,
                    borderRadius: "14px",
                    background: fileCardInnerBg,
                  }}
                >
                  <Box
                    sx={{
                      width: 40,
                      height: 40,
                      borderRadius: "10px",
                      background: cardBg,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    <DescriptionRounded sx={{ color: textPrimary, fontSize: 20 }} />
                  </Box>
                  <Box sx={{ flex: 1, overflow: "hidden" }}>
                    <Typography
                      sx={{
                        fontWeight: 500,
                        color: textPrimary,
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        fontSize: "0.9rem",
                      }}
                    >
                      {file.name}
                    </Typography>
                    <Typography sx={{ color: textSubtle, fontSize: "0.78rem" }}>
                      {(file.size / 1024 / 1024).toFixed(2)} МБ DOCX
                    </Typography>
                  </Box>
                  <IconButton
                    size="small"
                    onClick={handleClearFile}
                    disabled={isProcessing}
                    sx={{
                      color: isDark ? "rgba(235,235,245,0.28)" : "rgba(0,0,0,0.28)",
                      "&:hover": {
                        color: textPrimary,
                        bgcolor: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.05)",
                      },
                    }}
                  />
                </Box>

                {/* Selected profile row */}
                {profiles.length > 0 && (
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      mb: 2,
                      px: 0.5,
                    }}
                  >
                    <Typography sx={{ fontSize: "0.78rem", color: textSubtle, fontWeight: 500 }}>
                      Профиль
                    </Typography>
                    <Typography sx={{ fontSize: "0.78rem", color: textMuted, fontWeight: 600 }}>
                      {profiles.find((p: Profile) => p.id === selectedProfile)?.university ||
                        profiles.find((p: Profile) => p.id === selectedProfile)?.name ||
                        selectedProfile}
                    </Typography>
                  </Box>
                )}

                <Button
                  fullWidth
                  variant="contained"
                  onClick={handleProcess}
                  disabled={isProcessing}
                  sx={{
                    py: 1.75,
                    borderRadius: "14px",
                    fontWeight: 600,
                    fontSize: "0.95rem",
                    textTransform: "none",
                    bgcolor: isDark ? "#ffffff" : "#000000",
                    color: isDark ? "#000000" : "#ffffff",
                    boxShadow: "none",
                    "&:hover": { bgcolor: isDark ? "#e0e0e0" : "#1a1a1a", boxShadow: "none" },
                    "&:disabled": {
                      bgcolor: isDark ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.08)",
                      color: isDark ? "rgba(255,255,255,0.28)" : "rgba(0,0,0,0.28)",
                    },
                  }}
                >
                  {isProcessing ? "Анализируем файл..." : "Начать проверку"}
                </Button>
              </Box>
            </motion.div>
          )}
        </AnimatePresence>
      </Box>

      {/* Footer */}
      <Box sx={{ py: 3, textAlign: "center" }}>
        <Typography
          variant="caption"
          sx={{
            color: isDark ? "rgba(235,235,245,0.22)" : "rgba(0,0,0,0.22)",
            fontWeight: 400,
            letterSpacing: 0.3,
          }}
        >
          2026 CURSA
        </Typography>
      </Box>
    </Box>
  );
};

export default UploadPage;
