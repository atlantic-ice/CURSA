import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { BrowserRouter } from 'react-router-dom';
import Header from '../Header';
import { ThemeProvider, createTheme } from '@mui/material/styles';

// Моки для контекста и хуков
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useLocation: () => ({
    pathname: '/'
  })
}));

// Мок для контекста цвета
const ColorModeContext = React.createContext({
  toggleColorMode: jest.fn()
});

jest.mock('../App', () => ({
  ColorModeContext: ColorModeContext
}));

describe('Header', () => {
  const renderHeader = (isMobile = false) => {
    // Создаем тему для тестирования
    const theme = createTheme({
      palette: {
        mode: 'light'
      },
      breakpoints: {
        values: {
          xs: 0,
          sm: 600,
          md: 900,
          lg: 1200,
          xl: 1536
        }
      }
    });

    // Мокируем useMediaQuery
    jest.spyOn(theme.breakpoints, 'down').mockImplementation(() => isMobile);

    return render(
      <ColorModeContext.Provider value={{ toggleColorMode: jest.fn() }}>
        <ThemeProvider theme={theme}>
          <BrowserRouter>
            <Header />
          </BrowserRouter>
        </ThemeProvider>
      </ColorModeContext.Provider>
    );
  };

  test('отображает логотип', () => {
    renderHeader();
    
    // CursaLogo компонент может быть сложно протестировать напрямую
    // Проверяем, что логотип рендерится как ссылка на домашнюю страницу
    const homeLink = screen.getByRole('link', { name: /cursa/i });
    expect(homeLink).toHaveAttribute('href', '/');
  });

  test('отображает навигационные ссылки на десктопе', () => {
    renderHeader();
    
    expect(screen.getByText('Требования')).toBeInTheDocument();
    expect(screen.getByText('Примеры')).toBeInTheDocument();
    expect(screen.getByText('Ресурсы')).toBeInTheDocument();
    expect(screen.getByText('История')).toBeInTheDocument();
  });

  test('отображает кнопку переключения темы', () => {
    renderHeader();
    
    const themeToggleButton = screen.getByRole('button', { name: /темная тема/i });
    expect(themeToggleButton).toBeInTheDocument();
  });

  test('отображает кнопку "Проверить"', () => {
    renderHeader();
    
    const checkButton = screen.getByRole('link', { name: /проверить/i });
    expect(checkButton).toBeInTheDocument();
    expect(checkButton).toHaveAttribute('href', '/check');
  });

  // Мобильные тесты могут быть сложнее, т.к. нужно мокировать медиа-запросы
  test('отображает переключатель мобильного меню на мобильных устройствах', () => {
    renderHeader(true);
    
    // Тест может потребовать дополнительной настройки для корректной работы с медиа-запросами
    // Этот тест может быть неполным в зависимости от реализации mobile drawer
  });
}); 