// jest-dom добавляет кастомные матчеры для Jest для утверждений о DOM-элементах.
// позволяет делать вещи вроде:
// expect(element).toHaveTextContent(/react/i)
// больше информации: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom';

// Моки для компонентов Material-UI, которые могут вызывать проблемы
jest.mock('@mui/material/styles', () => {
  const originalModule = jest.requireActual('@mui/material/styles');
  
  return {
    __esModule: true,
    ...originalModule,
    useTheme: () => ({
      palette: {
        mode: 'light',
        primary: { main: '#2563eb', contrastText: '#ffffff' },
        text: { primary: '#000000', secondary: '#666666' },
        divider: '#e0e0e0',
        action: { selected: '#f5f5f5' }
      },
      breakpoints: {
        down: jest.fn().mockImplementation(() => false),
        up: jest.fn(),
        values: { xs: 0, sm: 600, md: 900, lg: 1200, xl: 1536 }
      },
      typography: {
        fontFamily: "'Roboto', 'Helvetica', 'Arial', sans-serif",
      },
      spacing: (factor) => `${0.25 * factor}rem`
    })
  };
});

// Мок для react-router-dom
jest.mock('react-router-dom', () => {
  const originalModule = jest.requireActual('react-router-dom');
  
  return {
    __esModule: true,
    ...originalModule,
    useLocation: jest.fn().mockReturnValue({ pathname: '/' }),
    useNavigate: jest.fn().mockReturnValue(jest.fn()),
    useParams: jest.fn().mockReturnValue({}),
  };
});

// Настройка для сброса всех моков после каждого теста
afterEach(() => {
  jest.clearAllMocks();
});
