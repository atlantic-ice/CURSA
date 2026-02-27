import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import DescriptionIcon from "@mui/icons-material/Description";
import ErrorIcon from "@mui/icons-material/Error";
import HistoryIcon from "@mui/icons-material/History";
import SettingsIcon from "@mui/icons-material/Settings";
import {
  alpha,
  Box,
  Button,
  Chip,
  CircularProgress,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  IconButton,
  LinearProgress,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  MenuItem,
  Paper,
  Select,
  Stack,
  Tooltip,
  Typography,
  useTheme,
} from "@mui/material";
import axios from "axios";
import { motion } from "framer-motion";
import { useCallback, useEffect, useState } from "react";
import { useDropzone } from "react-dropzone";
import toast, { Toaster } from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import HealthStatusChip from "../components/HealthStatusChip";
import IdleOverlay from "../components/IdleOverlay";
import StarBackground from "../components/StarBackground";
import api from "../utils/api";

// В дев-среде используем прокси CRA (пустая база), иначе — REACT_APP_API_BASE или прод-URL
const isLocal =
  typeof window !== "undefined" &&
  (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1");
const API_BASE = isLocal ? "" : process.env.REACT_APP_API_BASE || "https://cursa.onrender.com";

const ACCEPTED_TYPES = {
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [".docx"],
};

export default function UploadPage() {
  const [fileName, setFileName] = useState("");
  const [status, setStatus] = useState("idle");
  const [error, setError] = useState("");
  const [profiles, setProfiles] = useState([]);
  const [selectedProfile, setSelectedProfile] = useState("");
  const [recentFiles, setRecentFiles] = useState([]);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [batchResults, setBatchResults] = useState(null);
  const [showBatchDialog, setShowBatchDialog] = useState(false);
  const [isIdle, setIsIdle] = useState(false); // For StarBackground
  const [showEasterEgg, setShowEasterEgg] = useState(false); // For Van Gogh
  const [logoClicks, setLogoClicks] = useState(0); // Counter for Easter Egg

  const navigate = useNavigate();
  const theme = useTheme();

  // Idle timer logic for StarBackground (1 minute)
  useEffect(() => {
    let timeoutId;

    const resetTimer = () => {
      setIsIdle(false);
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => setIsIdle(true), 60000); // 60 seconds (1 minute)
    };

    // Initial timer
    resetTimer();

    // Listeners
    const events = ["mousedown", "mousemove", "keypress", "scroll", "touchstart"];
    events.forEach((event) => window.addEventListener(event, resetTimer));

    return () => {
      clearTimeout(timeoutId);
      events.forEach((event) => window.removeEventListener(event, resetTimer));
    };
  }, []);

  // Logo Click Handler
  const handleLogoClick = () => {
    setLogoClicks((prev) => {
      const newCount = prev + 1;
      if (newCount === 10) {
        setShowEasterEgg(true);
        return 0; // Reset after trigger
      }
      return newCount;
    });
  };

  // Load profiles and history
  useEffect(() => {
    // Fetch profiles
    axios
      .get(`${API_BASE}/api/profiles/`)
      .then((res) => {
        setProfiles(res.data);
        if (res.data.length > 0) setSelectedProfile(res.data[0].id);
      })
      .catch((err) => console.error("Failed to load profiles", err));

    // Load history
    const history = JSON.parse(localStorage.getItem("uploadHistory") || "[]");
    setRecentFiles(history);
  }, []);

  const addToHistory = (file, profileId) => {
    const newEntry = {
      name: file.name,
      date: new Date().toISOString(),
      profile: profileId,
      size: file.size,
    };
    const updated = [newEntry, ...recentFiles.filter((f) => f.name !== file.name)].slice(0, 5);
    setRecentFiles(updated);
    localStorage.setItem("uploadHistory", JSON.stringify(updated));
  };

  const clearHistory = () => {
    setRecentFiles([]);
    localStorage.removeItem("uploadHistory");
  };

  const handleUpload = useCallback(
    async (acceptedFiles) => {
      if (!acceptedFiles?.length) return;

      setStatus("loading");
      setError("");
      setUploadProgress(0);

      // Simulate progress
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => {
          if (prev >= 90) return prev;
          return prev + Math.random() * 10;
        });
      }, 200);

      try {
        if (acceptedFiles.length > 1) {
          // Batch Upload
          const data = await api.uploadBatch(acceptedFiles, selectedProfile);

          clearInterval(progressInterval);
          setUploadProgress(100);

          // Wait slightly for smooth transition
          setTimeout(() => {
            setStatus("success");
            setBatchResults(data.results);
            setShowBatchDialog(true);
            toast.success(`Обработано ${data.results.length} файлов`);
          }, 500);

          // Add successful uploads to history
          data.results.forEach((res) => {
            if (res.success) {
              const originalFile = acceptedFiles.find((f) => f.name === res.filename);
              if (originalFile) {
                addToHistory(originalFile, selectedProfile);
              }
            }
          });
        } else {
          // Single Upload
          const file = acceptedFiles[0];
          setFileName(file.name);

          const data = await api.uploadDocument(file, selectedProfile);

          clearInterval(progressInterval);
          setUploadProgress(100);
          setStatus("success");

          toast.success(`Файл «${file.name}» успешно проверен`);
          addToHistory(file, selectedProfile);

          // Navigate to results
          setTimeout(() => {
            navigate("/report", {
              state: {
                reportData: data,
                fileName: file.name,
              },
            });
          }, 500);
        }
      } catch (err) {
        clearInterval(progressInterval);
        const message =
          err?.response?.data?.error || "Не удалось загрузить файл. Попробуйте ещё раз.";
        setStatus("error");
        setError(message);
        toast.error(message);
      }
    },
    [navigate, selectedProfile, recentFiles],
  );

  const handleRejected = useCallback(() => {
    setStatus("error");
    const message = "Поддерживается только .docx до 20 МБ";
    setError(message);
    toast.error(message);
  }, []);

  const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
    accept: ACCEPTED_TYPES,
    maxFiles: 10,
    maxSize: 20 * 1024 * 1024,
    onDrop: handleUpload,
    onDropRejected: handleRejected,
    multiple: true,
  });

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        position: "relative",
        overflow: "hidden",
        p: 2,
      }}
    >
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: "rgba(18, 18, 18, 0.8)",
            color: "#fff",
            border: "1px solid rgba(255, 255, 255, 0.1)",
            backdropFilter: "blur(10px)",
          },
        }}
      />

      <IdleOverlay open={showEasterEgg} onClose={() => setShowEasterEgg(false)} />

      {/* Stars are always active now, but opacity controlled by isIdle */}
      <StarBackground active={isIdle} />

      {/* Minimal Top Left Logo */}
      <Box
        onClick={handleLogoClick}
        sx={{
          position: "absolute",
          top: 32,
          left: 40,
          zIndex: 10,
          cursor: "pointer",
          userSelect: "none",
        }}
      >
        <Typography
          variant="body1"
          sx={{
            fontWeight: 700,
            color: alpha(theme.palette.common.white, 0.8),
            fontSize: "1rem",
            fontFamily: '"Wix Madefor Display", "Montserrat", sans-serif',
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            transition: "all 0.3s",
            "&:hover": {
              color: theme.palette.common.white,
              textShadow: "0 0 10px rgba(255,255,255,0.5)",
            },
          }}
        >
          CURSA / UPLOAD
        </Typography>
      </Box>

      {/* Top Right Actions */}
      <Box
        sx={{
          position: "absolute",
          top: 32,
          right: 40,
          zIndex: 10,
          display: "flex",
          gap: 2,
          alignItems: "center",
        }}
      >
        <HealthStatusChip />
        <Button
          variant="outlined"
          startIcon={<SettingsIcon />}
          onClick={() => navigate("/profiles")}
          sx={{
            color: alpha(theme.palette.common.white, 0.8),
            borderColor: alpha(theme.palette.common.white, 0.2),
            borderRadius: 2,
            "&:hover": {
              borderColor: theme.palette.common.white,
              color: theme.palette.common.white,
              bgcolor: alpha(theme.palette.common.white, 0.05),
            },
          }}
        >
          Профили
        </Button>
      </Box>

      <Container
        maxWidth="lg"
        sx={{
          position: "relative",
          zIndex: 1,
          display: "flex",
          gap: 4,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Stack spacing={6} alignItems="center" sx={{ flex: 1, maxWidth: "md" }}>
          {/* Main Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 40 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 1.5, ease: "easeInOut", delay: 0.5 }} // Delay entry slightly to let stars settle
            style={{ width: "100%", position: "relative" }}
          >
            {/* Ambient Glow Behind Card */}
            <Box
              className="glow-effect"
              sx={{
                position: "absolute",
                top: "50%",
                left: "50%",
                width: "120%",
                height: "120%",
                background: `radial-gradient(circle, ${alpha(theme.palette.primary.main, 0.1)} 0%, transparent 60%)`,
                zIndex: 0,
                pointerEvents: "none",
              }}
            />

            <Paper
              elevation={0}
              className="glass-card"
              sx={{
                p: 0,
                overflow: "hidden",
                position: "relative",
                zIndex: 2,
              }}
            >
              {/* Dropzone Area */}
              <Box
                {...getRootProps()}
                sx={{
                  p: 0,
                  minHeight: 500,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                  transition: "all 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
                  bgcolor: isDragActive ? alpha(theme.palette.primary.main, 0.05) : "transparent",
                  position: "relative",
                }}
              >
                <input {...getInputProps()} />

                {!status || status === "idle" ? (
                  <Stack
                    spacing={4}
                    alignItems="center"
                    sx={{ position: "relative", zIndex: 1, pointerEvents: "none" }}
                  >
                    <motion.div
                      animate={{
                        scale: isDragActive ? 1.1 : 1,
                        y: isDragActive ? -10 : 0,
                        rotate: isDragActive ? 5 : 0,
                      }}
                      transition={{ duration: 0.4, type: "spring", stiffness: 200 }}
                    >
                      <CloudUploadIcon
                        sx={{ fontSize: 80, color: alpha(theme.palette.common.white, 0.8) }}
                      />
                    </motion.div>

                    <Box sx={{ textAlign: "center" }}>
                      <Typography
                        variant="h3"
                        sx={{
                          fontWeight: 700,
                          letterSpacing: "-0.02em",
                          color: theme.palette.common.white,
                          fontSize: { xs: "2rem", md: "2.5rem" },
                          textShadow: "0 4px 20px rgba(0,0,0,0.5)",
                          mb: 1,
                        }}
                      >
                        {isDragActive ? "Отпускайте" : "Загрузить документ"}
                      </Typography>
                      <Typography
                        variant="body1"
                        sx={{
                          color: alpha(theme.palette.text.secondary, 0.7),
                          fontWeight: 500,
                        }}
                      >
                        Перетащите файл или нажмите для выбора
                      </Typography>
                    </Box>

                    <Chip
                      label="DOCX"
                      variant="outlined"
                      sx={{
                        borderColor: alpha(theme.palette.common.white, 0.2),
                        color: alpha(theme.palette.common.white, 0.5),
                        fontWeight: 600,
                        letterSpacing: "0.05em",
                      }}
                    />
                  </Stack>
                ) : (
                  status === "loading" && (
                    <Box sx={{ width: "100%", maxWidth: 320, zIndex: 2, textAlign: "center" }}>
                      <CircularProgress size={60} thickness={2} sx={{ mb: 4, color: "white" }} />
                      <Typography
                        variant="h6"
                        fontWeight={600}
                        sx={{ letterSpacing: "0.05em", textTransform: "uppercase", mb: 1 }}
                      >
                        Анализируем структуру
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                        Ищем ошибки оформления и стиля...
                      </Typography>
                      <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1, px: 1 }}>
                        <Typography
                          variant="caption"
                          fontWeight={700}
                          color="text.secondary"
                          sx={{ letterSpacing: 1 }}
                        >
                          PROGRESS
                        </Typography>
                        <Typography variant="caption" fontWeight={700} color="white">
                          {Math.round(uploadProgress)}%
                        </Typography>
                      </Box>
                      <LinearProgress
                        variant="determinate"
                        value={uploadProgress}
                        sx={{
                          height: 6,
                          borderRadius: 3,
                          bgcolor: "rgba(255,255,255,0.05)",
                          "& .MuiLinearProgress-bar": {
                            borderRadius: 3,
                            background: "white",
                            boxShadow: "0 0 15px rgba(255,255,255,0.5)",
                          },
                        }}
                      />
                    </Box>
                  )
                )}
              </Box>

              {/* Profile Selector */}
              {(!status || status === "idle") && profiles.length > 0 && (
                <Box
                  sx={{
                    p: 2,
                    borderTop: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                    bgcolor: alpha(theme.palette.background.paper, 0.3),
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 2,
                  }}
                  onClick={(e) => e.stopPropagation()} // Prevent triggering dropzone
                >
                  <Typography variant="body2" color="text.secondary" fontWeight={600}>
                    Профиль проверки:
                  </Typography>
                  <FormControl size="small" sx={{ minWidth: 200 }}>
                    <Select
                      value={selectedProfile}
                      onChange={(e) => setSelectedProfile(e.target.value)}
                      displayEmpty
                      sx={{
                        borderRadius: 2,
                        bgcolor: alpha(theme.palette.common.white, 0.05),
                        color: "white",
                        "& .MuiOutlinedInput-notchedOutline": {
                          borderColor: alpha(theme.palette.common.white, 0.1),
                        },
                        "&:hover .MuiOutlinedInput-notchedOutline": {
                          borderColor: alpha(theme.palette.common.white, 0.3),
                        },
                        "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                          borderColor: theme.palette.primary.main,
                        },
                        "& .MuiSelect-icon": {
                          color: alpha(theme.palette.common.white, 0.5),
                        },
                      }}
                    >
                      {profiles.map((p) => (
                        <MenuItem key={p.id} value={p.id}>
                          {p.name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Box>
              )}
            </Paper>
          </motion.div>
        </Stack>

        {/* Recent Files Sidebar */}
        {recentFiles.length > 0 && (
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 1, ease: "easeOut", delay: 0.8 }}
            style={{ width: 320, flexShrink: 0 }}
          >
            <Paper
              elevation={0}
              className="glass-card"
              sx={{
                p: 3,
                display: "flex",
                flexDirection: "column",
                gap: 2,
                maxHeight: 500,
                overflowY: "auto",
              }}
            >
              <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <Typography
                  variant="h6"
                  fontWeight={700}
                  sx={{ display: "flex", alignItems: "center", gap: 1 }}
                >
                  <HistoryIcon fontSize="small" />
                  История
                </Typography>
                <Tooltip title="Очистить историю">
                  <IconButton size="small" onClick={clearHistory} sx={{ color: "text.secondary" }}>
                    <DeleteOutlineIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              </Box>

              <List sx={{ p: 0 }}>
                {recentFiles.map((file, idx) => (
                  <ListItem
                    key={idx}
                    sx={{
                      px: 0,
                      py: 1.5,
                      borderBottom:
                        idx < recentFiles.length - 1
                          ? `1px solid ${alpha(theme.palette.divider, 0.1)}`
                          : "none",
                    }}
                  >
                    <ListItemIcon sx={{ minWidth: 40 }}>
                      <DescriptionIcon sx={{ color: alpha(theme.palette.primary.main, 0.7) }} />
                    </ListItemIcon>
                    <ListItemText
                      primary={file.name}
                      secondary={new Date(file.date).toLocaleDateString("ru-RU", {
                        day: "numeric",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                      primaryTypographyProps={{ variant: "body2", fontWeight: 600, noWrap: true }}
                      secondaryTypographyProps={{ variant: "caption", color: "text.secondary" }}
                    />
                  </ListItem>
                ))}
              </List>
            </Paper>
          </motion.div>
        )}
      </Container>

      {/* Batch Results Dialog - Updated Style */}
      <Dialog
        open={showBatchDialog}
        onClose={() => setShowBatchDialog(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          className: "glass-card",
          sx: { bgcolor: "rgba(10,10,10,0.95)" },
        }}
      >
        <DialogTitle sx={{ borderBottom: "1px solid rgba(255,255,255,0.1)", fontWeight: 700 }}>
          Результаты обработки
        </DialogTitle>
        <DialogContent sx={{ mt: 2 }}>
          <List>
            {batchResults &&
              batchResults.map((res, index) => (
                <ListItem
                  key={index}
                  sx={{ borderBottom: "1px solid rgba(255,255,255,0.05)", py: 2 }}
                >
                  <ListItemIcon>
                    {res.success ? (
                      <CheckCircleIcon color="success" />
                    ) : (
                      <ErrorIcon color="error" />
                    )}
                  </ListItemIcon>
                  <ListItemText
                    primary={
                      <Typography variant="subtitle1" fontWeight={600} color="white">
                        {res.filename}
                      </Typography>
                    }
                    secondary={
                      <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                        {res.success
                          ? `Найдено ошибок: ${res.check_results?.total_issues_count || 0}`
                          : res.error}
                      </Typography>
                    }
                  />
                  {res.success && (
                    <Button
                      variant="outlined"
                      color="inherit"
                      size="small"
                      onClick={() => {
                        setShowBatchDialog(false);
                        navigate("/report", { state: { reportData: res, fileName: res.filename } });
                      }}
                      sx={{ borderColor: "rgba(255,255,255,0.2)" }}
                    >
                      Отчет
                    </Button>
                  )}
                </ListItem>
              ))}
          </List>
        </DialogContent>
        <DialogActions sx={{ p: 2, borderTop: "1px solid rgba(255,255,255,0.1)" }}>
          <Button onClick={() => setShowBatchDialog(false)} color="inherit">
            Закрыть
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
