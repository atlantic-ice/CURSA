import { Box, CircularProgress } from "@mui/material";
import CssBaseline from "@mui/material/CssBaseline";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import { AnimatePresence, motion } from "framer-motion";
import { Suspense, lazy } from "react";
import { Navigate, Route, BrowserRouter as Router, Routes, useLocation } from "react-router-dom";
import ErrorBoundary from "./components/ErrorBoundary";

// Lazy loading для страниц - уменьшает начальный bundle
const UploadPage = lazy(() => import("./pages/UploadPage"));
const ReportPage = lazy(() => import("./pages/ReportPage"));
const ProfilesPage = lazy(() => import("./pages/ProfilesPage"));
const PreviewPage = lazy(() => import("./pages/PreviewPage"));

// Компонент загрузки для Suspense
const PageLoader = () => (
  <Box
    sx={{
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      minHeight: "100vh",
      background: "#07070a",
    }}
  >
    <CircularProgress
      sx={{
        color: "#22d3ee",
      }}
    />
  </Box>
);

// Более строгая тёмная тема (Neutral Dark / Black)
const theme = createTheme({
  palette: {
    mode: "dark",
    background: {
      default: "#07070a",
      paper: "#121218",
    },
    text: {
      primary: "#f8fafc",
      secondary: "#94a3b8",
    },
    primary: {
      main: "#22d3ee",
    },
    secondary: {
      main: "#f97316",
    },
    divider: "rgba(255, 255, 255, 0.08)",
  },
  typography: {
    fontFamily: '"Montserrat", "Wix Madefor Display", "Arial", sans-serif',
    h1: {
      fontWeight: 800,
      fontFamily: '"Wix Madefor Display", "Montserrat", sans-serif',
      letterSpacing: "-0.02em",
    },
    h2: {
      fontWeight: 800,
      fontFamily: '"Wix Madefor Display", "Montserrat", sans-serif',
      letterSpacing: "-0.02em",
    },
    h3: {
      fontWeight: 700,
      fontFamily: '"Wix Madefor Display", "Montserrat", sans-serif',
      letterSpacing: "-0.01em",
    },
    h4: { fontWeight: 700, fontFamily: '"Wix Madefor Display", "Montserrat", sans-serif' },
    h5: { fontWeight: 600 },
    h6: { fontWeight: 600 },
    button: { fontWeight: 600, textTransform: "none" },
  },
  shape: {
    borderRadius: 8,
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          backgroundColor: "#07070a",
          color: "#f8fafc",
          overflowX: "hidden",
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: "none",
          backgroundColor: "#121212",
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          textTransform: "none",
        },
      },
    },
  },
});

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
        <Route
          path="/report"
          element={
            <PageWrapper>
              <ReportPage />
            </PageWrapper>
          }
        />
        <Route
          path="/profiles"
          element={
            <PageWrapper>
              <ProfilesPage />
            </PageWrapper>
          }
        />
        <Route
          path="/preview"
          element={
            <PageWrapper>
              <PreviewPage />
            </PageWrapper>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AnimatePresence>
  );
};

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        {/* Global Background Noise/Gradient */}
        <Box
          sx={{
            position: "fixed",
            inset: 0,
            zIndex: -1,
            background:
              "radial-gradient(circle at 50% 0%, rgba(255,255,255,0.03) 0%, transparent 50%)",
            pointerEvents: "none",
          }}
        />

        <Router>
          <Box sx={{ position: "relative", minHeight: "100vh", overflow: "hidden" }}>
            <Suspense fallback={<PageLoader />}>
              <AnimatedRoutes />
            </Suspense>
          </Box>
        </Router>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
