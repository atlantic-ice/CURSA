import SearchIcon from "@mui/icons-material/Search";
import { Box, Dialog, DialogContent, InputBase, Typography, useTheme } from "@mui/material";
import CssBaseline from "@mui/material/CssBaseline";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import { AnimatePresence, motion } from "framer-motion";
import React, {
  Suspense,
  createContext,
  lazy,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  Navigate,
  Route,
  BrowserRouter as Router,
  Routes,
  useLocation,
  useNavigate,
} from "react-router-dom";
import { authApi } from "./api/client";
import ErrorBoundary from "./components/ErrorBoundary";
import LeftNav from "./components/LeftNav";

export const ColorModeContext = createContext({ toggleColorMode: () => {} });
export const CheckHistoryContext = createContext({
  history: [],
  addToHistory: () => {},
  removeFromHistory: () => {},
  clearHistory: () => {},
});
export const AuthContext = createContext({
  user: null,
  authLoading: true,
  login: async () => {},
  logout: () => {},
  loginWithToken: async () => {},
  updateUser: () => {},
});
export const UIActionsContext = createContext({
  openShortcuts: () => {},
  openPalette: () => {},
});

// Lazy loading для страниц
const LoginPage = lazy(() => import("./pages/LoginPage.tsx"));
const RegisterPage = lazy(() => import("./pages/RegisterPage.tsx"));
const UploadPage = lazy(() => import("./pages/UploadPage.tsx"));
const ReportPage = lazy(() => import("./pages/ReportPage.tsx"));
const ProfilesPage = lazy(() => import("./pages/ProfilesPage.tsx"));
const PreviewPage = lazy(() => import("./pages/PreviewPage.tsx"));
const OAuthCallbackPage = lazy(() => import("./pages/OAuthCallbackPage.tsx"));
const DashboardPage = lazy(() => import("./pages/DashboardPage.tsx"));
const HistoryPage = lazy(() => import("./pages/HistoryPage.tsx"));
const ReportsPage = lazy(() => import("./pages/ReportsPage.tsx"));
const AdminPage = lazy(() => import("./pages/AdminPage.tsx"));
const AccountPage = lazy(() => import("./pages/AccountPage.tsx"));
const SettingsPage = lazy(() => import("./pages/SettingsPage.tsx"));

// Компонент загрузки для Suspense
const PageLoader = () => (
  <Box
    sx={{
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      minHeight: "100vh",
      bgcolor: "background.default",
    }}
  >
    <motion.div
      animate={{
        scale: [1, 1.2, 1],
        opacity: [0.3, 0.7, 0.3],
      }}
      transition={{ duration: 1.5, repeat: Infinity }}
      style={{
        width: 48,
        height: 48,
        borderRadius: "50%",
        background: "currentColor",
      }}
    />
  </Box>
);

// Фабрика темы с поддержкой светлого и тёмного режима
const getTheme = (mode) =>
  createTheme({
    palette: {
      mode,
      background: {
        default: mode === "dark" ? "#000000" : "#ffffff",
        paper: mode === "dark" ? "#1C1C1E" : "#ffffff",
      },
      text: {
        primary: mode === "dark" ? "#ffffff" : "#000000",
        secondary: mode === "dark" ? "rgba(235, 235, 245, 0.6)" : "rgba(0, 0, 0, 0.6)",
      },
      primary: {
        main: mode === "dark" ? "#ffffff" : "#000000",
        dark: mode === "dark" ? "#dddddd" : "#333333",
      },
      secondary: {
        main: "#4F46E5",
      },
      divider: mode === "dark" ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.08)",
    },
    typography: {
      fontFamily: '"Inter", "Wix Madefor Display", sans-serif',
      h1: { fontWeight: 800, letterSpacing: "-0.04em", fontSize: "4.5rem", lineHeight: 1.1 },
      h2: { fontWeight: 700, letterSpacing: "-0.03em", fontSize: "3rem" },
      h3: { fontWeight: 700, letterSpacing: "-0.02em" },
      h4: { fontWeight: 600, letterSpacing: "-0.01em" },
      h5: { fontWeight: 600 },
      h6: { fontWeight: 500 },
      button: { fontWeight: 600, textTransform: "none", letterSpacing: "0.02em" },
      body1: { color: "rgba(0, 0, 0, 0.7)", lineHeight: 1.7 },
      body2: { color: "rgba(0, 0, 0, 0.5)", lineHeight: 1.6 },
    },
    shape: {
      borderRadius: 24,
    },
    components: {
      MuiCssBaseline: {
        styleOverrides: {
          body: {
            backgroundColor: mode === "dark" ? "#000000" : "#ffffff",
            color: mode === "dark" ? "#ffffff" : "#000000",
            overflowX: "hidden",
            WebkitFontSmoothing: "antialiased",
            MozOsxFontSmoothing: "grayscale",
          },
        },
      },
      MuiPaper: {
        styleOverrides: {
          root: {
            backgroundImage: "none",
            backgroundColor: mode === "dark" ? "#1C1C1E" : "#ffffff",
            border:
              mode === "dark"
                ? "1px solid rgba(255, 255, 255, 0.1)"
                : "1px solid rgba(0, 0, 0, 0.08)",
            boxShadow:
              mode === "dark"
                ? "0 2px 12px 0 rgba(0, 0, 0, 0.4)"
                : "0 2px 12px 0 rgba(0, 0, 0, 0.06)",
          },
        },
      },
      MuiButton: {
        styleOverrides: {
          root: {
            borderRadius: 9999,
            textTransform: "none",
            boxShadow: "none",
            fontWeight: 600,
            padding: "10px 24px",
            "&:hover": {
              boxShadow: "0 0 20px rgba(0,0,0,0.08)",
            },
          },
          contained: {
            backgroundColor: mode === "dark" ? "#ffffff" : "#000000",
            color: mode === "dark" ? "#000000" : "#ffffff",
            "&:hover": {
              backgroundColor: mode === "dark" ? "#e0e0e0" : "#333333",
              transform: "translateY(-2px)",
            },
            transition: "all 0.3s ease",
          },
          outlined: {
            borderColor: mode === "dark" ? "rgba(255, 255, 255, 0.2)" : "rgba(0, 0, 0, 0.2)",
            color: mode === "dark" ? "#ffffff" : "#000000",
            "&:hover": {
              borderColor: mode === "dark" ? "#ffffff" : "#000000",
              backgroundColor:
                mode === "dark" ? "rgba(255, 255, 255, 0.04)" : "rgba(0, 0, 0, 0.04)",
            },
          },
        },
      },
    },
  });

// Обёртка для страниц с боковой навигацией
const NavLayout = ({ children }) => (
  <Box sx={{ display: "flex", height: "100vh", width: "100%", bgcolor: "background.default" }}>
    <LeftNav />
    <Box sx={{ flex: 1, position: "relative", overflow: "hidden" }}>{children}</Box>
  </Box>
);

const PageWrapper = ({ children }) => (
  <motion.div
    initial={{ opacity: 0, y: 20, filter: "blur(10px)" }}
    animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
    exit={{ opacity: 0, y: -20, filter: "blur(10px)" }}
    transition={{ duration: 0.4, ease: "easeOut" }}
    style={{ height: "100%", width: "100%", position: "absolute", top: 0, left: 0 }}
  >
    {children}
  </motion.div>
);

// ProtectedRoute: требует авторизации (редирект на /login)
const ProtectedRoute = ({ children }) => {
  const { user, authLoading } = useContext(AuthContext);
  if (authLoading) return <PageLoader />;
  if (!user) return <Navigate to="/login" replace />;
  return children;
};

// AdminRoute: требует роль admin
const AdminRoute = ({ children }) => {
  const { user, authLoading } = useContext(AuthContext);
  if (authLoading) return <PageLoader />;
  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== "admin") return <Navigate to="/" replace />;
  return children;
};

const AnimatedRoutes = () => {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route
          path="/"
          element={
            <PageWrapper>
              <UploadPage />
            </PageWrapper>
          }
        />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route
          path="/auth/:provider/callback"
          element={
            <PageWrapper>
              <OAuthCallbackPage />
            </PageWrapper>
          }
        />
        <Route path="/upload" element={<Navigate to="/" replace />} />
        <Route
          path="/report"
          element={
            <NavLayout>
              <PageWrapper>
                <ReportPage />
              </PageWrapper>
            </NavLayout>
          }
        />
        <Route
          path="/profiles"
          element={
            <NavLayout>
              <PageWrapper>
                <ProfilesPage />
              </PageWrapper>
            </NavLayout>
          }
        />
        <Route
          path="/preview"
          element={
            <NavLayout>
              <PageWrapper>
                <PreviewPage />
              </PageWrapper>
            </NavLayout>
          }
        />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <NavLayout>
                <PageWrapper>
                  <DashboardPage />
                </PageWrapper>
              </NavLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/history"
          element={
            <ProtectedRoute>
              <NavLayout>
                <PageWrapper>
                  <HistoryPage />
                </PageWrapper>
              </NavLayout>
            </ProtectedRoute>
          }
        />
        <Route path="/check" element={<Navigate to="/" replace />} />
        <Route
          path="/reports"
          element={
            <ProtectedRoute>
              <NavLayout>
                <PageWrapper>
                  <ReportsPage />
                </PageWrapper>
              </NavLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/account"
          element={
            <ProtectedRoute>
              <NavLayout>
                <PageWrapper>
                  <AccountPage />
                </PageWrapper>
              </NavLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/settings"
          element={
            <ProtectedRoute>
              <NavLayout>
                <PageWrapper>
                  <SettingsPage />
                </PageWrapper>
              </NavLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin"
          element={
            <AdminRoute>
              <NavLayout>
                <PageWrapper>
                  <AdminPage />
                </PageWrapper>
              </NavLayout>
            </AdminRoute>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AnimatePresence>
  );
};

// ───── SHORTCUT DEFINITIONS ─────
const SHORTCUT_DEFS = [
  { keys: ["N"], description: "Загрузить новый документ" },
  { keys: ["G", "D"], description: "Панель" },
  { keys: ["G", "H"], description: "История проверок" },
  { keys: ["G", "R"], description: "Отчёты" },
  { keys: ["G", "A"], description: "Аккаунт" },
  { keys: ["G", "S"], description: "Настройки" },
  { keys: ["Ctrl", "K"], description: "Командная палитра" },
  { keys: ["?"], description: "Показать эту справку" },
];

// ───── SHARED KEY BADGE ─────
const KbdKey = ({ label, isDark }) => (
  <Box
    component="span"
    sx={{
      display: "inline-flex",
      alignItems: "center",
      px: 0.75,
      py: 0.1,
      borderRadius: "5px",
      bgcolor: isDark ? "rgba(255,255,255,0.10)" : "rgba(0,0,0,0.07)",
      border: "1px solid",
      borderColor: isDark ? "rgba(255,255,255,0.18)" : "rgba(0,0,0,0.15)",
      fontFamily: "monospace",
      fontSize: "0.72rem",
      fontWeight: 700,
      color: isDark ? "rgba(255,255,255,0.75)" : "rgba(0,0,0,0.65)",
      lineHeight: 1.7,
      userSelect: "none",
    }}
  >
    {label}
  </Box>
);

// ───── KEYBOARD SHORTCUTS MODAL ─────
const KeyboardShortcutsModal = ({ open, onClose }) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  const textPrimary = isDark ? "#fff" : "#000";
  const textMuted = isDark ? "rgba(255,255,255,0.4)" : "rgba(0,0,0,0.4)";
  const borderColor = isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)";

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="xs"
      fullWidth
      PaperProps={{
        sx: {
          bgcolor: isDark ? "#111" : "#fff",
          border: "1px solid",
          borderColor,
          borderRadius: "16px",
          boxShadow: "0 24px 64px rgba(0,0,0,0.2)",
        },
      }}
    >
      <DialogContent sx={{ p: 0 }}>
        <Box sx={{ px: 3, py: 2.5, borderBottom: "1px solid", borderColor }}>
          <Typography
            sx={{
              fontWeight: 700,
              fontSize: "0.95rem",
              color: textPrimary,
              fontFamily: "'Wix Madefor Display', sans-serif",
            }}
          >
            Горячие клавиши
          </Typography>
          <Typography sx={{ fontSize: "0.75rem", color: textMuted, mt: 0.3 }}>
            Работают вне полей ввода
          </Typography>
        </Box>
        <Box sx={{ px: 3, py: 1 }}>
          {SHORTCUT_DEFS.map(({ keys, description }, i) => (
            <Box
              key={i}
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                py: 1,
                borderBottom: "1px solid",
                borderColor: isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.04)",
                "&:last-child": { borderBottom: "none" },
              }}
            >
              <Typography sx={{ fontSize: "0.82rem", color: textPrimary }}>
                {description}
              </Typography>
              <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, ml: 2, flexShrink: 0 }}>
                {keys.map((k, ki) => (
                  <React.Fragment key={ki}>
                    <KbdKey label={k} isDark={isDark} />
                    {ki < keys.length - 1 && (
                      <Typography sx={{ fontSize: "0.62rem", color: textMuted, mx: 0.25 }}>
                        then
                      </Typography>
                    )}
                  </React.Fragment>
                ))}
              </Box>
            </Box>
          ))}
        </Box>
        <Box sx={{ px: 3, py: 1.5, borderTop: "1px solid", borderColor, textAlign: "center" }}>
          <Typography sx={{ fontSize: "0.72rem", color: textMuted }}>
            Нажмите <KbdKey label="Esc" isDark={isDark} /> чтобы закрыть
          </Typography>
        </Box>
      </DialogContent>
    </Dialog>
  );
};

// ───── COMMAND PALETTE ─────
const PALETTE_NAV_ITEMS = [
  { label: "Загрузить документ", to: "/", shortcut: "N" },
  { label: "Панель", to: "/dashboard", shortcut: "G D" },
  { label: "История", to: "/history", shortcut: "G H" },
  { label: "Отчёты", to: "/reports", shortcut: "G R" },
  { label: "Аккаунт", to: "/account", shortcut: "G A" },
  { label: "Настройки", to: "/settings", shortcut: "G S" },
];

const CommandPalette = ({ open, onClose }) => {
  const navigate = useNavigate();
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  const { history } = useContext(CheckHistoryContext);

  const textPrimary = isDark ? "#fff" : "#000";
  const textMuted = isDark ? "rgba(255,255,255,0.4)" : "rgba(0,0,0,0.4)";
  const borderColor = isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)";
  const itemActive = isDark ? "rgba(255,255,255,0.09)" : "rgba(0,0,0,0.08)";

  const [query, setQuery] = useState("");
  const [selectedIdx, setSelectedIdx] = useState(0);
  const inputRef = useRef(null);

  const recentItems = useMemo(
    () =>
      history.slice(0, 5).map((h) => ({
        label: h.fileName || "Документ",
        to: "/report",
        state: { reportData: h.reportData, fileName: h.fileName },
        date: new Date(h.timestamp || h.id).toLocaleDateString("ru-RU", {
          day: "numeric",
          month: "short",
        }),
      })),
    [history],
  );

  const filteredNavItems = useMemo(() => {
    if (!query.trim()) return PALETTE_NAV_ITEMS;
    const q = query.toLowerCase();
    return PALETTE_NAV_ITEMS.filter((item) => item.label.toLowerCase().includes(q));
  }, [query]);

  const filteredRecentItems = useMemo(() => {
    if (!query.trim()) return recentItems;
    const q = query.toLowerCase();
    return recentItems.filter((item) => item.label.toLowerCase().includes(q));
  }, [query, recentItems]);

  // Build sections with pre-computed flat indices for keyboard navigation
  const paletteItems = useMemo(() => {
    const sections = [];
    if (filteredNavItems.length > 0) sections.push({ label: "Навигация", items: filteredNavItems });
    if (filteredRecentItems.length > 0)
      sections.push({ label: "Недавние", items: filteredRecentItems });
    let i = 0;
    return sections.map((s) => ({
      label: s.label,
      items: s.items.map((item) => ({ ...item, flatIdx: i++ })),
    }));
  }, [filteredNavItems, filteredRecentItems]);

  const flatItems = useMemo(() => paletteItems.flatMap((s) => s.items), [paletteItems]);

  useEffect(() => {
    setSelectedIdx(0);
  }, [query]);

  useEffect(() => {
    if (open) {
      setQuery("");
      setSelectedIdx(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  const selectItem = useCallback(
    (item) => {
      navigate(item.to, { state: item.state });
      onClose();
    },
    [navigate, onClose],
  );

  const handleKeyDown = (e) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIdx((i) => Math.min(i + 1, flatItems.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIdx((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const item = flatItems[selectedIdx];
      if (item) selectItem(item);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          bgcolor: isDark ? "#111" : "#fff",
          border: "1px solid",
          borderColor,
          borderRadius: "16px",
          boxShadow: "0 24px 64px rgba(0,0,0,0.25)",
          overflow: "hidden",
          maxHeight: 450,
        },
      }}
      sx={{ "& .MuiBackdrop-root": { backdropFilter: "blur(4px)" } }}
    >
      <DialogContent sx={{ p: 0, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        {/* Search input */}
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1.5,
            px: 2.5,
            py: 2,
            borderBottom: "1px solid",
            borderColor,
          }}
        >
          <SearchIcon sx={{ fontSize: 18, color: textMuted, flexShrink: 0 }} />
          <InputBase
            inputRef={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Перейти к..."
            sx={{
              flex: 1,
              fontSize: "0.95rem",
              color: textPrimary,
              "& input::placeholder": { color: textMuted },
            }}
          />
          <KbdKey label="Esc" isDark={isDark} />
        </Box>

        {/* Results list */}
        <Box sx={{ overflowY: "auto", flex: 1 }} className="custom-scrollbar">
          {flatItems.length === 0 && (
            <Box sx={{ px: 3, py: 4, textAlign: "center" }}>
              <Typography sx={{ fontSize: "0.85rem", color: textMuted }}>
                Ничего не найдено
              </Typography>
            </Box>
          )}
          {paletteItems.map((section) => (
            <Box key={section.label} sx={{ py: 0.75 }}>
              <Typography
                sx={{
                  fontSize: "0.65rem",
                  fontWeight: 600,
                  color: textMuted,
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                  px: 2.5,
                  pb: 0.5,
                }}
              >
                {section.label}
              </Typography>
              {section.items.map(({ flatIdx, shortcut, date, ...item }) => {
                const isSelected = flatIdx === selectedIdx;
                return (
                  <Box
                    key={item.label}
                    onClick={() => selectItem({ ...item, shortcut, date })}
                    onMouseEnter={() => setSelectedIdx(flatIdx)}
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 1.5,
                      px: 2.5,
                      py: 0.85,
                      mx: 0.75,
                      borderRadius: "8px",
                      bgcolor: isSelected ? itemActive : "transparent",
                      cursor: "pointer",
                      transition: "background 0.1s",
                      "&:hover": { bgcolor: itemActive },
                    }}
                  >
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography
                        sx={{
                          fontSize: "0.875rem",
                          color: textPrimary,
                          fontWeight: isSelected ? 600 : 400,
                        }}
                      >
                        {item.label}
                      </Typography>
                      {date && (
                        <Typography sx={{ fontSize: "0.7rem", color: textMuted }}>
                          {date}
                        </Typography>
                      )}
                    </Box>
                    {shortcut && (
                      <Box sx={{ display: "flex", gap: 0.5, flexShrink: 0 }}>
                        {shortcut.split(" ").map((k, ki) => (
                          <KbdKey key={ki} label={k} isDark={isDark} />
                        ))}
                      </Box>
                    )}
                  </Box>
                );
              })}
            </Box>
          ))}
        </Box>

        {/* Footer hints */}
        <Box
          sx={{
            borderTop: "1px solid",
            borderColor,
            px: 2.5,
            py: 1,
            display: "flex",
            gap: 2.5,
            alignItems: "center",
          }}
        >
          {[
            { keys: ["↑", "↓"], label: "выбор" },
            { keys: ["↵"], label: "перейти" },
            { keys: ["Esc"], label: "закрыть" },
          ].map(({ keys, label }) => (
            <Box key={label} sx={{ display: "flex", alignItems: "center", gap: 0.4 }}>
              {keys.map((k) => (
                <KbdKey key={k} label={k} isDark={isDark} />
              ))}
              <Typography sx={{ fontSize: "0.68rem", color: textMuted, ml: 0.4 }}>
                {label}
              </Typography>
            </Box>
          ))}
        </Box>
      </DialogContent>
    </Dialog>
  );
};

// ───── Global keyboard shortcuts (vim-style, two-key sequences) ─────
const KeyboardShortcutsHandler = ({ onOpenShortcuts, onOpenPalette }) => {
  const navigate = useNavigate();
  const pendingRef = useRef(null);
  const timerRef = useRef(null);

  useEffect(() => {
    const IGNORED_TAGS = ["INPUT", "TEXTAREA", "SELECT"];
    const G_MAP = {
      d: "/dashboard",
      h: "/history",
      r: "/reports",
      a: "/account",
      s: "/settings",
    };

    const handler = (e) => {
      // Ctrl/Cmd+K → command palette (works everywhere)
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        onOpenPalette?.();
        return;
      }

      if (IGNORED_TAGS.includes(e.target.tagName)) return;
      if (e.target.isContentEditable) return;
      if (e.ctrlKey || e.metaKey || e.altKey) return;

      const key = e.key.toLowerCase();

      if (pendingRef.current === "g") {
        clearTimeout(timerRef.current);
        pendingRef.current = null;
        if (G_MAP[key]) {
          e.preventDefault();
          navigate(G_MAP[key]);
        }
        return;
      }

      if (key === "g") {
        pendingRef.current = "g";
        timerRef.current = setTimeout(() => {
          pendingRef.current = null;
        }, 1500);
        return;
      }

      // ? → show keyboard shortcuts help
      if (e.key === "?") {
        e.preventDefault();
        onOpenShortcuts?.();
        return;
      }

      // n → new check (upload page)
      if (key === "n") {
        e.preventDefault();
        navigate("/");
      }
    };

    window.addEventListener("keydown", handler);
    return () => {
      window.removeEventListener("keydown", handler);
      clearTimeout(timerRef.current);
    };
  }, [navigate, onOpenShortcuts, onOpenPalette]);

  return null;
};

const AppContent = () => {
  const [shortcutsOpen, setShortcutsOpen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const openShortcuts = useCallback(() => setShortcutsOpen(true), []);
  const openPalette = useCallback(() => setPaletteOpen(true), []);
  const closeShortcuts = useCallback(() => setShortcutsOpen(false), []);
  const closePalette = useCallback(() => setPaletteOpen(false), []);

  return (
    <UIActionsContext.Provider value={{ openShortcuts, openPalette }}>
      <Box
        sx={{
          position: "relative",
          minHeight: "100vh",
          overflow: "hidden",
          bgcolor: "background.default",
        }}
      >
        <Box
          sx={{
            position: "relative",
            zIndex: 1,
            minHeight: "100vh",
          }}
        >
          <Suspense fallback={<PageLoader />}>
            <KeyboardShortcutsHandler onOpenShortcuts={openShortcuts} onOpenPalette={openPalette} />
            <AnimatedRoutes />
          </Suspense>
          <KeyboardShortcutsModal open={shortcutsOpen} onClose={closeShortcuts} />
          <CommandPalette open={paletteOpen} onClose={closePalette} />
        </Box>
      </Box>
    </UIActionsContext.Provider>
  );
};

function App() {
  const [mode, setMode] = useState(() => localStorage.getItem("colorMode") || "light");
  const [checkHistory, setCheckHistory] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("checkHistory") || "[]");
    } catch {
      return [];
    }
  });

  // ─── Auth state ───────────────────────────────────────────────
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("access_token");
    if (!token) {
      setAuthLoading(false);
      return;
    }
    authApi
      .me(token)
      .then((data) => setUser(data.user || data))
      .catch(() => {
        localStorage.removeItem("access_token");
        localStorage.removeItem("refresh_token");
      })
      .finally(() => setAuthLoading(false));
  }, []);

  const authLogin = useCallback(async (email, password) => {
    const data = await authApi.login(email, password);
    localStorage.setItem("access_token", data.access_token);
    if (data.refresh_token) {
      localStorage.setItem("refresh_token", data.refresh_token);
    } else {
      localStorage.removeItem("refresh_token");
    }
    setUser(data.user || data);
    return data;
  }, []);

  const authLogout = useCallback(() => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    setUser(null);
  }, []);

  const loginWithToken = useCallback(async (accessToken, refreshToken) => {
    localStorage.setItem("access_token", accessToken);
    if (refreshToken) localStorage.setItem("refresh_token", refreshToken);
    try {
      const data = await authApi.me(accessToken);
      setUser(data.user || data);
    } catch {
      // токен недействителен — ничего не делаем
    }
  }, []);

  const updateUser = useCallback((userData) => setUser(userData), []);

  const authContextValue = useMemo(
    () => ({ user, authLoading, login: authLogin, logout: authLogout, loginWithToken, updateUser }),
    [user, authLoading, authLogin, authLogout, loginWithToken, updateUser],
  );

  const colorMode = React.useMemo(
    () => ({
      toggleColorMode: () => {
        setMode((prev) => {
          const next = prev === "light" ? "dark" : "light";
          localStorage.setItem("colorMode", next);
          return next;
        });
      },
    }),
    [],
  );

  const addToHistory = useCallback((entry) => {
    setCheckHistory((prev) => {
      const next = [{ id: Date.now(), ...entry }, ...prev].slice(0, 100);
      localStorage.setItem("checkHistory", JSON.stringify(next));
      return next;
    });
  }, []);

  const removeFromHistory = useCallback((id) => {
    setCheckHistory((prev) => {
      const next = prev.filter((item) => item.id !== id);
      localStorage.setItem("checkHistory", JSON.stringify(next));
      return next;
    });
  }, []);

  const clearHistory = useCallback(() => {
    setCheckHistory([]);
    localStorage.removeItem("checkHistory");
  }, []);

  const historyContextValue = useMemo(
    () => ({ history: checkHistory, addToHistory, removeFromHistory, clearHistory }),
    [checkHistory, addToHistory, removeFromHistory, clearHistory],
  );

  const dynamicTheme = React.useMemo(() => getTheme(mode), [mode]);

  return (
    <ColorModeContext.Provider value={colorMode}>
      <CheckHistoryContext.Provider value={historyContextValue}>
        <AuthContext.Provider value={authContextValue}>
          <ErrorBoundary>
            <ThemeProvider theme={dynamicTheme}>
              <CssBaseline />
              <Router>
                <AppContent />
              </Router>
            </ThemeProvider>
          </ErrorBoundary>
        </AuthContext.Provider>
      </CheckHistoryContext.Provider>
    </ColorModeContext.Provider>
  );
}

export default App;
