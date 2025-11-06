import React, { useMemo, useRef, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { Box } from '@mui/material';
import { Toaster } from 'react-hot-toast';
import Sidebar from './components/Sidebar';
import DashboardPage from './pages/DashboardPage';
import UploadPage from './pages/UploadPage';
import MaterialsPage from './pages/MaterialsPage';
import ReportPage from './pages/ReportPage';

// Минимальный тёмный тема для полностью чёрного экрана
const theme = createTheme({
  palette: {
    mode: 'dark',
    background: { default: '#000000', paper: '#000000' },
    text: { primary: '#ffffff', secondary: '#9BA3AF' },
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Arial", sans-serif',
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          backgroundColor: '#000000',
          color: '#ffffff',
        },
      },
    },
  },
});

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <BrowserRouter>
        <Toaster 
          position="top-right"
          toastOptions={{
            style: {
              background: '#1a1a1c',
              color: '#fff',
              border: '1px solid rgba(255,255,255,0.1)',
            },
            success: {
              iconTheme: {
                primary: '#10b981',
                secondary: '#fff',
              },
            },
            error: {
              iconTheme: {
                primary: '#ef4444',
                secondary: '#fff',
              },
            },
          }}
        />
        
        {/* Layout with fixed sidebar */}
        <Sidebar />

        {/* Main content: centered grey card slightly smaller than the viewport */}
        <Box
          sx={{
            // account for 10px inset on the sidebar (sidebar left 10px + width 240 = 250)
            ml: '250px',
            minHeight: '100vh',
            bgcolor: '#000',
            color: '#fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            p: '10px',
            boxSizing: 'border-box',
          }}
        >
          <Box
            sx={{
              position: 'relative',
              // card fills the inner area; container padding provides equal offsets on all sides
              width: '100%',
              // make the card taller: fill viewport minus the container's 10px top+bottom padding
              height: 'calc(100vh - 20px)',
              maxWidth: '1600px',
              // increase allowed max height so it can expand on tall displays
              maxHeight: '1400px',
              boxSizing: 'border-box',
              // darker background to reduce overall lightness
              bgcolor: '#0b0b0d',
              // further reduced rounding per request
              borderRadius: 4,
              // deeper, darker shadow
              boxShadow: '0 12px 40px rgba(0,0,0,0.85)',
              // subtler border (less visible)
              border: '1px solid rgba(255,255,255,0.02)',
              overflow: 'hidden',
              px: 4,
              py: 3,
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <Routes>
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/upload" element={<UploadPage />} />
              <Route path="/materials" element={<MaterialsPage />} />
              <Route path="/report" element={<ReportPage />} />
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
          </Box>
        </Box>
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;
