import { ThemeProvider, createTheme } from "@mui/material/styles";
import "@testing-library/jest-dom";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";

import { accountApi } from "../../api/client";
import { AuthContext, CheckHistoryContext } from "../../App";
import AccountPage from "../AccountPage";

jest.mock("framer-motion", () => ({
  motion: {
    section: ({ children, ...props }) => <section {...props}>{children}</section>,
  },
}));

jest.mock("../../api/client", () => ({
  accountApi: {
    updateMe: jest.fn(),
    changePassword: jest.fn(),
    setup2fa: jest.fn(),
    enable2fa: jest.fn(),
    disable2fa: jest.fn(),
    resendVerification: jest.fn(),
  },
  getApiErrorMessage: (error, fallback) => error?.message || fallback,
}));

jest.mock("../../App", () => {
  const React = require("react");
  return {
    AuthContext: React.createContext({ user: null, updateUser: () => {} }),
    CheckHistoryContext: React.createContext({ history: [] }),
  };
});

describe("AccountPage", () => {
  const updateUser = jest.fn();
  const theme = createTheme({
    palette: {
      mode: "dark",
    },
  });

  const user = {
    email: "user@example.com",
    first_name: "Иван",
    last_name: "Петров",
    organization: "ИТМО",
    role: "admin",
    is_email_verified: false,
    is_2fa_enabled: false,
    has_password: true,
    oauth_provider: "github",
    created_at: "2026-03-01T00:00:00Z",
  };

  const history = [
    { id: "1", score: 82 },
    { id: "2", score: 96, correctedFilePath: "fixed.docx" },
  ];

  const renderPage = (overrides = {}) =>
    render(
      <ThemeProvider theme={theme}>
        <AuthContext.Provider value={{ user: { ...user, ...overrides }, updateUser }}>
          <CheckHistoryContext.Provider value={{ history }}>
            <AccountPage />
          </CheckHistoryContext.Provider>
        </AuthContext.Provider>
      </ThemeProvider>,
    );

  beforeEach(() => {
    jest.clearAllMocks();
    Storage.prototype.getItem = jest.fn(() => "token-123");
  });

  test("renders account overview and linked provider", () => {
    renderPage();

    expect(screen.getByText(/личный кабинет/i)).toBeInTheDocument();
    expect(screen.getByText(/управляйте профилем/i)).toBeInTheDocument();
    expect(screen.getByText(/иван петров/i)).toBeInTheDocument();
    expect(screen.getByText(/github/i)).toBeInTheDocument();
    expect(screen.getByText(/email не подтверждён/i)).toBeInTheDocument();
    expect(screen.getByText(/средний балл/i)).toBeInTheDocument();
  });

  test("shows validation message when passwords do not match", async () => {
    renderPage();

    fireEvent.click(screen.getByRole("button", { name: /изменить пароль/i }));
    fireEvent.change(screen.getByLabelText(/текущий пароль/i), { target: { value: "old-pass" } });
    fireEvent.change(screen.getByLabelText(/новый пароль/i), { target: { value: "password-1" } });
    fireEvent.change(screen.getByLabelText(/подтверждение/i), { target: { value: "password-2" } });
    fireEvent.click(screen.getByRole("button", { name: /^сохранить$/i }));

    expect(await screen.findByText(/пароли не совпадают/i)).toBeInTheDocument();
    expect(accountApi.changePassword).not.toHaveBeenCalled();
  });

  test("saves edited profile data and updates auth context", async () => {
    accountApi.updateMe.mockResolvedValue({
      user: {
        ...user,
        first_name: "Мария",
        last_name: "Соколова",
        organization: "МФТИ",
      },
    });

    renderPage();

    fireEvent.click(screen.getByRole("button", { name: /редактировать/i }));
    fireEvent.change(screen.getByLabelText(/имя/i), { target: { value: "Мария" } });
    fireEvent.change(screen.getByLabelText(/фамилия/i), { target: { value: "Соколова" } });
    fireEvent.change(screen.getByLabelText(/организация/i), { target: { value: "МФТИ" } });
    fireEvent.click(screen.getByRole("button", { name: /^сохранить$/i }));

    await waitFor(() => {
      expect(accountApi.updateMe).toHaveBeenCalledWith(
        {
          first_name: "Мария",
          last_name: "Соколова",
          organization: "МФТИ",
        },
        "token-123",
      );
    });

    expect(updateUser).toHaveBeenCalledWith({
      ...user,
      first_name: "Мария",
      last_name: "Соколова",
      organization: "МФТИ",
    });
    expect(await screen.findByText(/профиль обновлён/i)).toBeInTheDocument();
  });

  test("resends verification email", async () => {
    accountApi.resendVerification.mockResolvedValue({ success: true });

    renderPage();

    fireEvent.click(screen.getByRole("button", { name: /отправить письмо/i }));

    await waitFor(() => {
      expect(accountApi.resendVerification).toHaveBeenCalledWith("token-123");
    });

    expect(await screen.findByText(/письмо отправлено/i)).toBeInTheDocument();
  });

  test("starts 2fa setup and shows qr dialog", async () => {
    accountApi.setup2fa.mockResolvedValue({
      qr_code: "data:image/png;base64,123",
      secret: "ABCDEF",
    });

    renderPage();

    fireEvent.click(screen.getByRole("button", { name: /настроить 2fa/i }));

    await waitFor(() => {
      expect(accountApi.setup2fa).toHaveBeenCalledWith("token-123");
    });

    expect(
      await screen.findByRole("heading", { name: /настройка двухфакторной аутентификации/i }),
    ).toBeInTheDocument();
    expect(screen.getByText(/код для ручного ввода/i)).toBeInTheDocument();
    expect(screen.getByText(/ABCDEF/i)).toBeInTheDocument();
  });

  test("disables 2fa for enabled account", async () => {
    accountApi.disable2fa.mockResolvedValue({ success: true });

    renderPage({ is_2fa_enabled: true });

    fireEvent.click(screen.getByRole("button", { name: /отключить 2fa/i }));

    await waitFor(() => {
      expect(accountApi.disable2fa).toHaveBeenCalledWith("token-123");
    });

    expect(updateUser).toHaveBeenCalledWith({
      ...user,
      is_2fa_enabled: false,
    });
    expect(await screen.findByText(/2fa отключена/i)).toBeInTheDocument();
  });
});
