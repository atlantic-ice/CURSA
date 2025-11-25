import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { AnimatePresence, motion } from 'framer-motion';
import { Box } from '@mui/material';
import UploadPage from './pages/UploadPage';
import ReportPage from './pages/ReportPage';
import ProfilesPage from './pages/ProfilesPage';

// Более строгая тёмная тема (Neutral Dark / Black)
const theme = createTheme({
  palette: {
    mode: 'dark',
    background: { 
      default: '#050505', // Almost Black
      paper: '#121212',   // Material Dark Surface
    },
    text: { 
      primary: '#ffffff', 
      secondary: '#a0a0a0' 
    },
    primary: { 
      main: '#ffffff', 
    },
    secondary: { 
      main: '#38bdf8', 
    },
    divider: 'rgba(255, 255, 255, 0.08)',
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Arial", sans-serif',
    h1: { fontWeight: 800 },
    h2: { fontWeight: 700 },
    h3: { fontWeight: 700 },
    h4: { fontWeight: 700 },
    h5: { fontWeight: 600 },
    h6: { fontWeight: 600 },
    button: { fontWeight: 600, textTransform: 'none' },
  },
  shape: {
    borderRadius: 8,
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          backgroundColor: '#050505',
          color: '#ffffff',
          overflowX: 'hidden',
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          backgroundColor: '#121212',
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          textTransform: 'none',
        },
      },
    },
  },
});

const PageWrapper = ({ children }) => (
  <motion.div
    initial={{ opacity: 0, y: 20, filter: 'blur(10px)' }}
    animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
    exit={{ opacity: 0, y: -20, filter: 'blur(10px)' }}
    transition={{ duration: 0.4, ease: "easeOut" }}
    style={{ height: '100%', width: '100%', position: 'absolute', top: 0, left: 0 }}
  >
    {children}
  </motion.div>
);

const AnimatedRoutes = () => {
  const location = useLocation();
  
  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<PageWrapper><UploadPage /></PageWrapper>} />
        <Route path="/report" element={<PageWrapper><ReportPage /></PageWrapper>} />
        <Route path="/profiles" element={<PageWrapper><ProfilesPage /></PageWrapper>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AnimatePresence>
  );
};

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      {/* Global Background Noise/Gradient */}
      <Box sx={{ 
        position: 'fixed', 
        inset: 0, 
        zIndex: -1,
        background: 'radial-gradient(circle at 50% 0%, rgba(255,255,255,0.03) 0%, transparent 50%)',
        pointerEvents: 'none'
      }} />
      
      <Router>
        <Box sx={{ position: 'relative', minHeight: '100vh', overflow: 'hidden' }}>
          <AnimatedRoutes />
        </Box>
      </Router>
    </ThemeProvider>
  );
}

export default App;
