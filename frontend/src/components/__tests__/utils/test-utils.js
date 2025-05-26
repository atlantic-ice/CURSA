import React from 'react';
import { render } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';

// Создаем контекст для переключения темы
const ColorModeContext = React.createContext({
  toggleColorMode: jest.fn()
});

// Экспортируем его для использования в тестах
export { ColorModeContext };

/**
 * Кастомная функция рендера для компонентов, которым нужен ThemeProvider и Router
 * @param {JSX.Element} ui - Компонент для рендера
 * @param {Object} options - Дополнительные опции рендера
 * @returns {Object} - Объект с методами testing-library
 */
export function renderWithProviders(ui, options = {}) {
  const {
    theme = createTheme({
      palette: {
        mode: 'light',
        primary: { main: '#2563eb', contrastText: '#ffffff' },
        text: { primary: '#000000', secondary: '#666666' },
        divider: '#e0e0e0',
        action: { selected: '#f5f5f5' }
      }
    }), 
    colorMode = { toggleColorMode: jest.fn() },
    route = '/',
    ...renderOptions
  } = options;

  // Устанавливаем начальный маршрут
  window.history.pushState({}, 'Test page', route);

  function Wrapper({ children }) {
    return (
      <ColorModeContext.Provider value={colorMode}>
        <ThemeProvider theme={theme}>
          <BrowserRouter>
            {children}
          </BrowserRouter>
        </ThemeProvider>
      </ColorModeContext.Provider>
    );
  }

  return render(ui, { wrapper: Wrapper, ...renderOptions });
}

/**
 * Мок для медиа-запроса (для тестирования мобильных компонентов)
 * @param {boolean} matches - Должен ли медиа-запрос совпадать
 */
export function mockMediaQuery(matches) {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: jest.fn().mockImplementation(query => ({
      matches,
      media: query,
      onchange: null,
      addListener: jest.fn(), // устаревший
      removeListener: jest.fn(), // устаревший
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
    })),
  });
}

/**
 * Функция для создания моков маршрутизации
 * @param {string} pathname - Текущий путь
 * @returns {Object} - Моки для react-router-dom
 */
export function createRouterMocks(pathname = '/') {
  // Мок для useLocation
  jest.mock('react-router-dom', () => ({
    ...jest.requireActual('react-router-dom'),
    useLocation: jest.fn().mockReturnValue({ pathname }),
    useNavigate: jest.fn().mockReturnValue(jest.fn()),
    useParams: jest.fn().mockReturnValue({})
  }));
} 