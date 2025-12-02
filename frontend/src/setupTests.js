// jest-dom добавляет кастомные матчеры для Jest для утверждений о DOM-элементах.
// позволяет делать вещи вроде:
// expect(element).toHaveTextContent(/react/i)
// больше информации: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom';

// Глобальный мок для window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Мок для ResizeObserver
global.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));

// Подавляем предупреждения в тестах
const originalError = console.error;
beforeAll(() => {
  console.error = (...args) => {
    if (
      typeof args[0] === 'string' &&
      args[0].includes('Warning: ReactDOM.render is no longer supported')
    ) {
      return;
    }
    originalError.call(console, ...args);
  };
});

afterAll(() => {
  console.error = originalError;
});

// Настройка для сброса всех моков после каждого теста
afterEach(() => {
  jest.clearAllMocks();
});
