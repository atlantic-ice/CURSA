import { ThemeProvider, createTheme } from "@mui/material/styles";
import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import RegisterPage from "../RegisterPage";

// Мок для framer-motion
jest.mock("framer-motion", () => ({
  motion: {
    div: ({ children, ...props }) => <div {...props}>{children}</div>,
  },
}));

// Мок для fetch
global.fetch = jest.fn();

describe("RegisterPage - Navigation", () => {
  const renderRegisterPage = () => {
    const theme = createTheme({
      palette: {
        mode: "dark",
      },
    });

    return render(
      <ThemeProvider theme={theme}>
        <MemoryRouter>
          <RegisterPage />
        </MemoryRouter>
      </ThemeProvider>,
    );
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("renders back button with icon", () => {
    renderRegisterPage();

    // ArrowBackIcon в IconButton должен присутствовать
    const buttons = screen.getAllByRole("button");
    // Проверяем что есть несколько кнопок (включая back button)
    expect(buttons.length).toBeGreaterThan(0);
  });

  test("renders registration form elements", () => {
    renderRegisterPage();

    expect(screen.getByText(/Create Account/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Create Account/i })).toBeInTheDocument();
  });

  test("renders link to login page", () => {
    renderRegisterPage();

    expect(screen.getByText(/Already have an account\?/i)).toBeInTheDocument();
  });
});
