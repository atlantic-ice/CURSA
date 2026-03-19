// jest-dom добавляет кастомные матчеры для Jest для утверждений о DOM-элементах.
// позволяет делать вещи вроде:
// expect(element).toHaveTextContent(/react/i)
// больше информации: https://github.com/testing-library/jest-dom
import "@testing-library/jest-dom";

const installMatchMediaMock = () => {
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    value: (query) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: jest.fn(),
      removeListener: jest.fn(),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
    }),
  });
};

// Унифицированный virtual mock роутинга для тестового окружения,
// где react-router-dom может отсутствовать как резолвимый модуль.
jest.mock(
  "react-router-dom",
  () => ({
    BrowserRouter: ({ children }) => children,
    MemoryRouter: ({ children }) => children,
    Link: ({ to, children, ...props }) => (
      <a href={typeof to === "string" ? to : "/"} {...props}>
        {children}
      </a>
    ),
    NavLink: ({ to, children, ...props }) => (
      <a href={typeof to === "string" ? to : "/"} {...props}>
        {children}
      </a>
    ),
    Navigate: () => null,
    Outlet: ({ children }) => children || null,
    useNavigate: () => jest.fn(),
    useLocation: () => ({ pathname: "/", search: "", hash: "", state: null }),
    useParams: () => ({}),
    useSearchParams: () => [new URLSearchParams(), jest.fn()],
  }),
  { virtual: true },
);

// Глобальный мок для window.matchMedia
installMatchMediaMock();

if (window.HTMLCanvasElement && !window.HTMLCanvasElement.prototype.getContext) {
  window.HTMLCanvasElement.prototype.getContext = jest.fn(() => ({
    clearRect: jest.fn(),
    beginPath: jest.fn(),
    arc: jest.fn(),
    fill: jest.fn(),
    moveTo: jest.fn(),
    lineTo: jest.fn(),
    stroke: jest.fn(),
    createLinearGradient: jest.fn(() => ({
      addColorStop: jest.fn(),
    })),
    shadowBlur: 0,
    shadowColor: "",
    fillStyle: "",
    strokeStyle: "",
    lineWidth: 0,
    lineCap: "",
  }));
}

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
      typeof args[0] === "string" &&
      args[0].includes("Warning: ReactDOM.render is no longer supported")
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
  installMatchMediaMock();
});
