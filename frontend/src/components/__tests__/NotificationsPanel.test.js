import "@testing-library/jest-dom";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";

import { notificationsApi } from "../../api/client";
import NotificationsPanel from "../NotificationsPanel";

jest.mock("../../api/client", () => ({
  __esModule: true,
  getApiErrorMessage: jest.fn(() => "api error"),
  notificationsApi: {
    list: jest.fn(),
    markAsRead: jest.fn(),
    markAllAsRead: jest.fn(),
    clearAll: jest.fn(),
  },
}));

describe("NotificationsPanel", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    notificationsApi.list.mockResolvedValue({
      success: true,
      notifications: [
        {
          id: "n1",
          message: "Новый отчет готов",
          level: "info",
          timestamp: "2026-03-15T10:00:00.000Z",
          read: false,
          source: "system",
        },
      ],
      unread_count: 1,
      total_count: 1,
    });
    notificationsApi.markAsRead.mockResolvedValue({ success: true });
    notificationsApi.markAllAsRead.mockResolvedValue({ success: true });
    notificationsApi.clearAll.mockResolvedValue({ success: true });
  });

  test("renders accessible actions for notifications management", async () => {
    render(<NotificationsPanel />);

    await waitFor(() => {
      expect(notificationsApi.list).toHaveBeenCalled();
    });

    fireEvent.click(screen.getByRole("button", { name: /уведомления/i }));

    expect(
      await screen.findByRole("button", { name: /прочитать все уведомления/i }),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /очистить все уведомления/i })).toBeInTheDocument();
    expect(
      screen.getByRole("button", {
        name: /отметить уведомление как прочитанное: новый отчет готов/i,
      }),
    ).toBeInTheDocument();
  });
});
