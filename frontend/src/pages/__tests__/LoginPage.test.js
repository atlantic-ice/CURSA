import { ThemeProvider, createTheme } from "@mui/material/styles";
import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import { AuthContext, ColorModeContext } from "../../App";
import LoginPage from "../LoginPage";

const mockNavigate = jest.fn();
const mockLogin = jest.fn();
const mockToggleColorMode = jest.fn();

jest.mock(
  "react-router-dom",
  () => ({
    MemoryRouter: ({ children }) => <>{children}</>,
    Link: ({ children, to, ...props }) => (
      <a href={to} {...props}>
        {children}
      </a>
    ),
    useNavigate: () => mockNavigate,
  }),
  { virtual: true },
);

jest.mock("../../App", () => {
  const React = require("react");
  return {
    AuthContext: React.createContext({ login: async () => {} }),
    ColorModeContext: React.createContext({ toggleColorMode: () => {} }),
  };
});

jest.mock("framer-motion", () => ({
  motion: {
    div: ({ children, ...props }) => <div {...props}>{children}</div>,
  },
}));

describe("LoginPage", () => {
  beforeAll(() => {
    global.ResizeObserver = class ResizeObserver {
      observe() {}
      unobserve() {}
      disconnect() {}
    };
  });

  const renderLoginPage = () => {
    const theme = createTheme({
      palette: {
        mode: "dark",
      },
    });

    return render(
      <ThemeProvider theme={theme}>
        <ColorModeContext.Provider value={{ toggleColorMode: mockToggleColorMode }}>
          <AuthContext.Provider value={{ login: mockLogin }}>
            <LoginPage />
          </AuthContext.Provider>
        </ColorModeContext.Provider>
      </ThemeProvider>,
    );
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("renders redesigned login shell and form", () => {
    renderLoginPage();

    expect(screen.getByText(/с возвращением в cursa/i)).toBeInTheDocument();
    expect(screen.getByText(/введите email ниже, чтобы войти в аккаунт/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/m@example.com/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/пароль/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /^войти$/i })).toBeInTheDocument();
  });

  test("renders link to registration page", () => {
    renderLoginPage();

    expect(screen.getByRole("link", { name: /создать/i })).toHaveAttribute("href", "/register");
  });
});
