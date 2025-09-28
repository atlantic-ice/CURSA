import React, { useState, createContext, useEffect, useMemo, useCallback } from 'react';
import { ThemeProvider } from '@mui/material/styles';
import ToastProvider from './components/toast/ToastProvider';
import CssBaseline from '@mui/material/CssBaseline';
import { Box } from '@mui/material';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import MiniHeader from './components/MiniHeader';
import HomePage from './pages/Home/HomePage';
import DocumentCheckPage from './pages/DocumentCheck/DocumentCheckPage';
import ReportsPage from './pages/Reports/ReportsPage';
import HistoryPage from './pages/History/HistoryPage';
import '@fontsource/montserrat/900.css';
import '@fontsource/montserrat/400.css';
import '@fontsource/montserrat/500.css';
import '@fontsource/montserrat/600.css';
import '@fontsource/montserrat/700.css';
import '@fontsource/roboto/300.css';
import '@fontsource/roboto/400.css';
import '@fontsource/roboto/500.css';
import '@fontsource/roboto/700.css';

import { createAppTheme } from './theme/createAppTheme';
import './theme/global.css';

// Создаем контекст для хранения истории проверок
export const CheckHistoryContext = createContext();

// Создаем контекст для управления цветовой темой
export const ColorModeContext = createContext({
  mode: 'light',
  isSystem: true,
  toggleColorMode: () => { },
  setPaletteMode: (_mode) => { },
});

const getSystemPreference = () => {
  if (typeof window === 'undefined' || !window.matchMedia) {
    return 'light';
  }
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
};

// getDesignTokens был заменён на фабрику темы createAppTheme

function App() {
  // Удалён minimal режим – единая дизайн система
  const [storedPreference, setStoredPreference] = useState(() => {
    if (typeof window === 'undefined') {
      return null;
    }
    const saved = window.localStorage.getItem('themeMode');
    return saved && (saved === 'light' || saved === 'dark') ? saved : null;
  });

  const [mode, setMode] = useState(() => storedPreference || getSystemPreference());
  const [followSystem, setFollowSystem] = useState(() => storedPreference === null);

  useEffect(() => {
    if (!followSystem) {
      return undefined;
    }

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (event) => setMode(event.matches ? 'dark' : 'light');

    handleChange(mediaQuery);
    mediaQuery.addEventListener('change', handleChange);

    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [followSystem]);

  const setPaletteMode = (value) => {
    if (value === 'system') {
      setStoredPreference(null);
      if (typeof window !== 'undefined') {
        window.localStorage.removeItem('themeMode');
      }
      setFollowSystem(true);
      setMode(getSystemPreference());
      return;
    }

    const nextMode = value === 'dark' ? 'dark' : 'light';
    setFollowSystem(false);
    setStoredPreference(nextMode);
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('themeMode', nextMode);
    }
    setMode(nextMode);
  };

  const colorMode = useMemo(
    () => ({
      mode,
      isSystem: followSystem,
      toggleColorMode: () => {
        setFollowSystem(false);
        setMode((prevMode) => {
          const newMode = prevMode === 'light' ? 'dark' : 'light';
          if (typeof window !== 'undefined') {
            window.localStorage.setItem('themeMode', newMode);
          }
          setStoredPreference(newMode);
          return newMode;
        });
      },
      setPaletteMode,
    }),
    [mode, followSystem]
  );

  const theme = useMemo(() => createAppTheme(mode), [mode]);

  useEffect(() => {
    if (typeof document === 'undefined') {
      return;
    }
    document.documentElement.setAttribute('data-theme', mode);
  }, [mode]);

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

  // Убрана заставка-приветствие (SplashScreen) и связанные состояния/анимации

  return (
    <ColorModeContext.Provider value={colorMode}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <ToastProvider>
          <CheckHistoryContext.Provider value={{ history, addToHistory, removeFromHistory, clearHistory }}>
            <BrowserRouter>
              <Box sx={{
                minHeight: '100vh',
                bgcolor: theme.palette.mode === 'dark' ? '#000' : '#fff',
                display: 'flex',
                flexDirection: 'column'
              }}>
                <MiniHeader />
                <Routes>
                  <Route path="/" element={<HomePage />} />
                  <Route path="/document/:id" element={<DocumentCheckPage />} />
                  <Route path="/reports" element={<ReportsPage />} />
                  <Route path="/history" element={<HistoryPage />} />
                </Routes>
              </Box>
            </BrowserRouter>
          </CheckHistoryContext.Provider>
        </ToastProvider>
      </ThemeProvider>
    </ColorModeContext.Provider>
  );
}

export default App;
