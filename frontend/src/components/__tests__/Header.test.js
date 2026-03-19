import { ThemeProvider, createTheme } from "@mui/material/styles";
import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import { ColorModeContext } from "../../App";
import Header from "../Header";

jest.mock(
  "react-router-dom",
  () => ({
    Link: ({ to, children, ...props }) => (
      <a href={to} {...props}>
        {children}
      </a>
    ),
    useLocation: () => ({ pathname: "/" }),
  }),
  { virtual: true },
);

const setMatchMedia = (matches) => {
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    value: (query) => ({
      matches,
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

describe("Header", () => {
  const mockToggleColorMode = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    setMatchMedia(false);
  });

  const renderHeader = (isMobile = false) => {
    setMatchMedia(isMobile);

    // Создаем тему для тестирования
    const theme = createTheme({
      palette: {
        mode: "light",
      },
      breakpoints: {
        values: {
          xs: 0,
          sm: 600,
          md: 900,
          lg: 1200,
          xl: 1536,
        },
      },
    });

    return render(
      <ColorModeContext.Provider value={{ toggleColorMode: mockToggleColorMode }}>
        <ThemeProvider theme={theme}>
          <Header />
        </ThemeProvider>
      </ColorModeContext.Provider>,
    );
  };

  test("отображает логотип", () => {
    renderHeader();

    // CursaLogo компонент может быть сложно протестировать напрямую
    // Проверяем, что логотип рендерится как ссылка на домашнюю страницу
    const homeLink = screen.getByRole("link", { name: /cursa/i });
    expect(homeLink).toHaveAttribute("href", "/");
  });

  test("отображает навигационные ссылки на десктопе", () => {
    renderHeader();

    expect(screen.getByText("Требования")).toBeInTheDocument();
    expect(screen.getByText("Примеры")).toBeInTheDocument();
    expect(screen.getByText("Ресурсы")).toBeInTheDocument();
    expect(screen.getByText("История")).toBeInTheDocument();
  });

  test("отображает кнопку переключения темы", () => {
    renderHeader();

    const themeToggleButton = screen.getByRole("button", { name: /переключить тему/i });
    expect(themeToggleButton).toBeInTheDocument();
  });

  test('отображает кнопку "Проверить"', () => {
    renderHeader();

    const checkButton = screen.getByRole("link", { name: /проверить/i });
    expect(checkButton).toBeInTheDocument();
    expect(checkButton).toHaveAttribute("href", "/");
  });

  test("отображает переключатель мобильного меню на мобильных устройствах", () => {
    renderHeader(true);

    const menuToggleButton = screen.getByRole("button", { name: /открыть меню/i });
    expect(menuToggleButton).toBeInTheDocument();
  });
});
