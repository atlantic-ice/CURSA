import React, { useState, createContext, useEffect, useMemo } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { Box } from '@mui/material';
import '@fontsource/montserrat/900.css';
import '@fontsource/montserrat/400.css';
import '@fontsource/montserrat/500.css';
import '@fontsource/montserrat/600.css';
import '@fontsource/montserrat/700.css';
import '@fontsource/roboto/300.css';
import '@fontsource/roboto/400.css';
import '@fontsource/roboto/500.css';
import '@fontsource/roboto/700.css';

import HomePage from './pages/HomePage';
import GuidelinesPage from './pages/GuidelinesPage';
import ExamplesPage from './pages/ExamplesPage';
import CheckPage from './pages/CheckPage';
import ReportPage from './pages/ReportPage';
import ResourcesPage from './pages/ResourcesPage';
import HistoryPage from './pages/HistoryPage';
import AdminPage from './pages/AdminPage';
import Header from './components/Header';

// Создаем контекст для хранения истории проверок
export const CheckHistoryContext = createContext();

// Создаем контекст для управления цветовой темой
export const ColorModeContext = createContext({ toggleColorMode: () => {} });

function App() {
  // Состояние для хранения текущего режима темы
  const [mode, setMode] = useState(() => {
    const savedMode = localStorage.getItem('themeMode');
    return savedMode || 'light';
  });
  
  // Создаём объект colorMode для передачи в контекст
  const colorMode = useMemo(
    () => ({
      toggleColorMode: () => {
        setMode((prevMode) => {
          const newMode = prevMode === 'light' ? 'dark' : 'light';
          localStorage.setItem('themeMode', newMode); // Сохраняем выбор темы в localStorage
          return newMode;
        });
      },
    }),
    []
  );

  // Создаём тему на основе текущего режима
  const theme = useMemo(
    () =>
      createTheme({
        palette: {
          mode,
          primary: {
            main: '#2563eb',
            light: '#60a5fa',
            dark: '#1d4ed8',
            contrastText: '#ffffff',
          },
          secondary: {
            main: '#f43f5e',
            light: '#fb7185',
            dark: '#e11d48',
            contrastText: '#ffffff',
          },
          background: {
            default: mode === 'light' ? '#f8fafc' : '#0f172a',
            paper: mode === 'light' ? '#ffffff' : '#1e293b',
          },
          text: {
            primary: mode === 'light' ? '#1e293b' : '#f8fafc',
            secondary: mode === 'light' ? '#64748b' : '#94a3b8',
          },
          error: {
            main: '#ef4444',
          },
          warning: {
            main: '#f59e0b',
          },
          info: {
            main: '#0ea5e9',
          },
          success: {
            main: '#10b981',
          },
          divider: mode === 'light' ? 'rgba(100, 116, 139, 0.12)' : 'rgba(148, 163, 184, 0.12)',
        },
        typography: {
          fontFamily: '"Montserrat", "Roboto", "Arial", sans-serif',
          h1: {
            fontWeight: 800,
            letterSpacing: '-0.025em',
          },
          h2: {
            fontWeight: 800,
            letterSpacing: '-0.025em',
          },
          h3: {
            fontWeight: 700,
            letterSpacing: '-0.025em',
          },
          h4: {
            fontWeight: 700,
            letterSpacing: '-0.01em',
          },
          h5: {
            fontWeight: 700,
          },
          h6: {
            fontWeight: 600,
          },
          button: {
            fontWeight: 600,
            textTransform: 'none',
          },
          body1: {
            fontSize: '1rem',
            lineHeight: 1.6,
          },
          body2: {
            fontSize: '0.875rem',
            lineHeight: 1.6,
          },
        },
        shape: {
          borderRadius: 12,
        },
        components: {
          MuiButton: {
            styleOverrides: {
              root: {
                borderRadius: 8,
                padding: '8px 16px',
                transition: 'all 0.2s ease-in-out',
                boxShadow: 'none',
              },
              contained: {
                boxShadow: mode === 'light' 
                  ? '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)'
                  : '0 1px 3px 0 rgba(0, 0, 0, 0.3), 0 1px 2px 0 rgba(0, 0, 0, 0.2)',
                '&:hover': {
                  boxShadow: mode === 'light'
                    ? '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
                    : '0 4px 6px -1px rgba(0, 0, 0, 0.3), 0 2px 4px -1px rgba(0, 0, 0, 0.2)',
                  transform: 'translateY(-1px)',
                },
              },
            },
          },
          MuiCard: {
            styleOverrides: {
              root: {
                borderRadius: 16,
                boxShadow: mode === 'light'
                  ? '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)'
                  : '0 1px 3px 0 rgba(0, 0, 0, 0.3), 0 1px 2px 0 rgba(0, 0, 0, 0.2)',
                transition: 'all 0.3s ease-in-out',
              },
            },
          },
          MuiPaper: {
            styleOverrides: {
              root: {
                backgroundImage: 'none',
              },
            },
          },
          MuiAppBar: {
            styleOverrides: {
              root: {
                boxShadow: mode === 'light'
                  ? '0 1px 3px 0 rgba(0, 0, 0, 0.05)'
                  : '0 1px 3px 0 rgba(0, 0, 0, 0.2)',
              },
            },
          },
          MuiInputBase: {
            styleOverrides: {
              root: {
                borderRadius: 8,
              },
            },
          },
          MuiOutlinedInput: {
            styleOverrides: {
              root: {
                borderRadius: 8,
              },
            },
          },
          MuiCssBaseline: {
            styleOverrides: {
              body: {
                scrollbarWidth: 'thin',
                scrollbarColor: mode === 'light' ? '#CBD5E1 #F8FAFC' : '#475569 #1E293B',
                '&::-webkit-scrollbar': {
                  width: '8px',
                  height: '8px',
                },
                '&::-webkit-scrollbar-track': {
                  background: mode === 'light' ? '#F8FAFC' : '#1E293B',
                },
                '&::-webkit-scrollbar-thumb': {
                  background: mode === 'light' ? '#CBD5E1' : '#475569',
                  borderRadius: '4px',
                },
                '&::-webkit-scrollbar-thumb:hover': {
                  background: mode === 'light' ? '#94A3B8' : '#64748B',
                },
              },
            },
          },
        },
      }),
    [mode]
  );

  // Состояние для хранения истории проверок
  const [history, setHistory] = useState([]);

  // Загрузка истории из localStorage при первом рендеринге
  useEffect(() => {
    const savedHistory = localStorage.getItem('checkHistory');
    if (savedHistory) {
      try {
        setHistory(JSON.parse(savedHistory));
      } catch (error) {
        console.error('Ошибка при загрузке истории:', error);
      }
    }
  }, []);

  // Функция для добавления новой проверки в историю
  const addToHistory = (checkData) => {
    // Добавляем новую проверку в начало списка
    const updatedHistory = [checkData, ...history.slice(0, 19)]; // Ограничиваем хранение 20 последними проверками
    setHistory(updatedHistory);
    
    // Сохраняем обновленную историю в localStorage
    try {
      localStorage.setItem('checkHistory', JSON.stringify(updatedHistory));
    } catch (error) {
      console.error('Ошибка при сохранении истории:', error);
    }
  };

  // Функция для удаления записи из истории
  const removeFromHistory = (id) => {
    const updatedHistory = history.filter(item => item.id !== id);
    setHistory(updatedHistory);
    
    // Сохраняем обновленную историю в localStorage
    try {
      localStorage.setItem('checkHistory', JSON.stringify(updatedHistory));
    } catch (error) {
      console.error('Ошибка при сохранении истории:', error);
    }
  };

  // Функция для очистки всей истории
  const clearHistory = () => {
    setHistory([]);
    localStorage.removeItem('checkHistory');
  };

  return (
    <ColorModeContext.Provider value={colorMode}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <CheckHistoryContext.Provider value={{ history, addToHistory, removeFromHistory, clearHistory }}>
          <Router>
            <Box 
              sx={{ 
                display: 'flex', 
                flexDirection: 'column',
                minHeight: '100vh'
              }}
            >
              <Header />
              <Box 
                component="main"
                sx={{ 
                  flexGrow: 1,
                  pt: { xs: 2, sm: 3 },
                  pb: 6,
                  minHeight: 'calc(100vh - 64px)'
                }}
              >
                <Routes>
                  <Route path="/" element={<HomePage />} />
                  <Route path="/guidelines" element={<GuidelinesPage />} />
                  <Route path="/examples" element={<ExamplesPage />} />
                  <Route path="/check" element={<CheckPage />} />
                  <Route path="/report" element={<ReportPage />} />
                  <Route path="/resources" element={<ResourcesPage />} />
                  <Route path="/history" element={<HistoryPage />} />
                  <Route path="/admin" element={<AdminPage />} />
                </Routes>
              </Box>
            </Box>
          </Router>
        </CheckHistoryContext.Provider>
      </ThemeProvider>
    </ColorModeContext.Provider>
  );
}

export default App;
