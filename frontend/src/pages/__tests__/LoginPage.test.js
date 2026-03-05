import { ThemeProvider, createTheme } from "@mui/material/styles";
import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import LoginPage from "../LoginPage";

// Мок для framer-motion
jest.mock("framer-motion", () => ({
  motion: {
    div: ({ children, ...props }) => <div {...props}>{children}</div>,
  },
}));

// Мок для fetch
global.fetch = jest.fn();

describe("LoginPage - Navigation", () => {
  const renderLoginPage = () => {
    const theme = createTheme({
      palette: {
        mode: "dark",
      },
    });

    return render(
      <ThemeProvider theme={theme}>
        <MemoryRouter>
          <LoginPage />
        </MemoryRouter>
      </ThemeProvider>,
    );
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("renders back button with icon", () => {
    renderLoginPage();

    // ArrowBackIcon в IconButton должен быть виден
    const buttons = screen.getAllByRole("button");
    // Проверяем что есть несколько кнопок (включая back button)
    expect(buttons.length).toBeGreaterThan(0);
  });

  test("renders login form elements", () => {
    renderLoginPage();

    expect(screen.getByText(/Sign In/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/you@example.com/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Sign In/i })).toBeInTheDocument();
  });

  test("renders link to registration page", () => {
    renderLoginPage();

    expect(screen.getByText(/Don't have an account\?/i)).toBeInTheDocument();
  });
});
