import React, { useState, createContext, useEffect, useMemo } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { Box } from '@mui/material';
import '@fontsource/montserrat/900.css';

import HomePage from './pages/HomePage';
import GuidelinesPage from './pages/GuidelinesPage';
import ExamplesPage from './pages/ExamplesPage';
import CheckPage from './pages/CheckPage';
import ReportPage from './pages/ReportPage';
import ResourcesPage from './pages/ResourcesPage';
import HistoryPage from './pages/HistoryPage';
import AdminPage from './pages/AdminPage';
import Header from './components/Header';
import Footer from './components/Footer';

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
            main: '#1976d2',
          },
          secondary: {
            main: '#f50057',
          },
        },
        typography: {
          fontFamily: '"Roboto", "Arial", sans-serif',
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
              <Footer />
            </Box>
          </Router>
        </CheckHistoryContext.Provider>
      </ThemeProvider>
    </ColorModeContext.Provider>
  );
}

export default App;
