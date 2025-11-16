import React from 'react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import UploadPage from './pages/UploadPage';

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
      <UploadPage />
    </ThemeProvider>
  );
}

export default App;
