import { ThemeProvider, createTheme } from "@mui/material/styles";
import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import UploadPage from "../UploadPage";

// Mock axios
jest.mock("axios", () => ({
  get: jest.fn().mockResolvedValue({ data: [] }),
}));

// Мок для компонентов
jest.mock("../../components/HealthStatusChip", () => {
  return function MockHealthStatusChip() {
    return <div data-testid="health-status-chip">Health Status</div>;
  };
});

jest.mock("../../components/IdleOverlay", () => {
  return function MockIdleOverlay() {
    return null;
  };
});

// Мок для react-hot-toast
jest.mock("react-hot-toast", () => ({
  Toaster: () => null,
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

// Мок для framer-motion
jest.mock("framer-motion", () => ({
  motion: {
    div: ({ children, ...props }) => <div {...props}>{children}</div>,
  },
}));

describe("UploadPage - Navigation", () => {
  const renderUploadPage = () => {
    const theme = createTheme({
      palette: {
        mode: "dark",
        common: {
          white: "#ffffff",
        },
      },
    });

    return render(
      <ThemeProvider theme={theme}>
        <MemoryRouter>
          <UploadPage />
        </MemoryRouter>
      </ThemeProvider>,
    );
  };

  beforeEach(() => {
    jest.clearAllMocks();
    // Mock localStorage
    Storage.prototype.getItem = jest.fn(() => JSON.stringify([]));
    Storage.prototype.setItem = jest.fn();
  });

  test("renders login button", () => {
    renderUploadPage();

    const loginButton = screen.getByRole("button", { name: /войти/i });
    expect(loginButton).toBeInTheDocument();
    expect(loginButton).toBeVisible();
  });

  test("login button has correct content", () => {
    renderUploadPage();

    const loginButton = screen.getByRole("button", { name: /войти/i });
    expect(loginButton).toHaveTextContent("Войти");
  });

  test("renders profiles button", () => {
    renderUploadPage();

    const profilesButton = screen.getByRole("button", { name: /профили/i });
    expect(profilesButton).toBeInTheDocument();
  });

  test("login button is before profiles button", () => {
    renderUploadPage();

    const buttons = screen.getAllByRole("button");
    const loginButton = screen.getByRole("button", { name: /войти/i });
    const profilesButton = screen.getByRole("button", { name: /профили/i });

    const loginIndex = buttons.indexOf(loginButton);
    const profilesIndex = buttons.indexOf(profilesButton);

    expect(loginIndex).toBeLessThan(profilesIndex);
  });
});
