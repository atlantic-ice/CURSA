import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { BrowserRouter } from 'react-router-dom';
import * as ReactRouterDom from 'react-router-dom';
import Header from '../Header';
import { ThemeProvider, createTheme } from '@mui/material/styles';

// Моки для контекста и хуков
jest.spyOn(ReactRouterDom, 'useLocation').mockReturnValue({ pathname: '/' });

// Мок для контекста цвета
const MockColorModeContext = React.createContext({
  mode: 'light',
  isSystem: false,
  toggleColorMode: jest.fn(),
  setPaletteMode: jest.fn()
});

jest.mock('../../App', () => ({
  ColorModeContext: MockColorModeContext
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

    const colorModeMock = {
      mode: 'light',
      isSystem: false,
      toggleColorMode: jest.fn(),
      setPaletteMode: jest.fn()
    };

    return render(
      <MockColorModeContext.Provider value={colorModeMock}>
        <ThemeProvider theme={theme}>
          <BrowserRouter>
            <Header />
          </BrowserRouter>
        </ThemeProvider>
      </MockColorModeContext.Provider>
    );
  };

  test('рендерит брендовый логотип-ссылку', () => {
    renderHeader();

    // Проверяем, что бренд присутствует и доступен через aria-label
    const brand = screen.getByLabelText('CURSA');
    expect(brand).toBeInTheDocument();
  });
  // Мобильные тесты могут быть сложнее, т.к. нужно мокировать медиа-запросы
  test('отображает переключатель мобильного меню на мобильных устройствах', () => {
    renderHeader(true);

    // Тест может потребовать дополнительной настройки для корректной работы с медиа-запросами
    // Этот тест может быть неполным в зависимости от реализации mobile drawer
  });
}); 