import { ThemeProvider, createTheme } from "@mui/material/styles";
import "@testing-library/jest-dom";
import { fireEvent, render, screen } from "@testing-library/react";
import { AuthContext, ColorModeContext } from "../../App";
import RegisterPage from "../RegisterPage";

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

jest.mock("../../api/client", () => ({
  authApi: {
    register: jest.fn(),
  },
}));

jest.mock("framer-motion", () => ({
  motion: {
    div: ({ children, ...props }) => <div {...props}>{children}</div>,
  },
}));

describe("RegisterPage", () => {
  beforeAll(() => {
    global.ResizeObserver = class ResizeObserver {
      observe() {}
      unobserve() {}
      disconnect() {}
    };
  });

  const renderRegisterPage = () => {
    const theme = createTheme({
      palette: {
        mode: "dark",
      },
    });

    return render(
      <ThemeProvider theme={theme}>
        <ColorModeContext.Provider value={{ toggleColorMode: mockToggleColorMode }}>
          <AuthContext.Provider value={{ login: mockLogin }}>
            <RegisterPage />
          </AuthContext.Provider>
        </ColorModeContext.Provider>
      </ThemeProvider>,
    );
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("renders redesigned registration shell and form", () => {
    renderRegisterPage();

    expect(screen.getByText(/добро пожаловать в cursa/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/m@example.com/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /создать аккаунт/i })).toBeInTheDocument();
  });

  test("renders link to login page", () => {
    renderRegisterPage();

    expect(screen.getByRole("link", { name: /войти/i })).toHaveAttribute("href", "/login");
  });

  test("opens completion dialog after first signup step", () => {
    renderRegisterPage();

    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: "m@example.com" },
    });
    fireEvent.click(screen.getByRole("button", { name: /создать аккаунт/i }));

    expect(
      screen.getByRole("heading", { name: /завершите создание аккаунта/i }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText(/имя/i)).toBeInTheDocument();
  });
});
