import { ThemeProvider, createTheme } from "@mui/material/styles";
import "@testing-library/jest-dom";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { CheckHistoryContext } from "../../App";
import { documentsApi } from "../../api/client";
import UploadPage from "../UploadPage";

const mockProfiles = [
  {
    id: "default_gost",
    name: "ГОСТ 7.32-2017",
    university: "ГОСТ",
    description: "Базовый системный шаблон",
    is_system: true,
  },
  {
    id: "bmstu",
    name: "МГТУ им. Баумана",
    university: "МГТУ",
    description: "Методические рекомендации вуза",
    is_system: false,
  },
];

const mockNavigate = jest.fn();

jest.mock(
  "react-router-dom",
  () => ({
    MemoryRouter: ({ children }) => children,
    useNavigate: () => mockNavigate,
  }),
  { virtual: true },
);

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
  AnimatePresence: ({ children }) => <>{children}</>,
  motion: {
    div: ({ children, ...props }) => <div {...props}>{children}</div>,
  },
}));

describe("UploadPage - Navigation", () => {
  const renderUploadPage = async () => {
    const theme = createTheme({
      palette: {
        mode: "dark",
        common: {
          white: "#ffffff",
        },
      },
    });

    const view = render(
      <ThemeProvider theme={theme}>
        <CheckHistoryContext.Provider
          value={{
            history: [],
            addToHistory: jest.fn(),
            removeFromHistory: jest.fn(),
            clearHistory: jest.fn(),
          }}
        >
          <MemoryRouter>
            <UploadPage />
          </MemoryRouter>
        </CheckHistoryContext.Provider>
      </ThemeProvider>,
    );

    await screen.findByLabelText("Активный профиль");
    return view;
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockNavigate.mockReset();
    jest.spyOn(documentsApi, "getProfiles").mockResolvedValue(mockProfiles);
    jest.spyOn(documentsApi, "validate").mockResolvedValue({
      score: 0,
      check_results: { total_issues_count: 0 },
    });
    // Mock localStorage
    Storage.prototype.getItem = jest.fn((key) => {
      if (key === "cursa_profile") {
        return "default_gost";
      }

      return null;
    });
    Storage.prototype.setItem = jest.fn();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test("renders profile controls on upload screen", async () => {
    await renderUploadPage();

    await waitFor(() => {
      expect(screen.getByTestId("selected-profile-summary")).toHaveTextContent("Системный");
    });

    expect(screen.getByRole("heading", { name: /гост 7.32-2017/i })).toBeInTheDocument();
    expect(screen.getByLabelText("Активный профиль")).toHaveValue("default_gost");
    expect(screen.getByRole("button", { name: /профили/i })).toBeInTheDocument();
    expect(screen.getByTestId("manage-profiles-button")).toBeInTheDocument();
    expect(screen.getByTestId("quick-edit-profile-button")).toBeInTheDocument();
    expect(screen.getByTestId("quick-import-export-button")).toBeInTheDocument();
    expect(screen.getByTestId("selected-profile-summary")).toHaveTextContent("Системный");
  });

  test("navigates to profiles management from quick action", async () => {
    await renderUploadPage();

    fireEvent.click(screen.getByTestId("manage-profiles-button"));

    expect(mockNavigate).toHaveBeenCalledWith("/profiles", {
      state: {
        mode: "manage",
        profileId: "default_gost",
        source: "upload",
      },
    });
  });

  test("opens profile editor route state from quick edit action", async () => {
    await renderUploadPage();

    fireEvent.click(screen.getByTestId("quick-edit-profile-button"));

    expect(mockNavigate).toHaveBeenCalledWith("/profiles", {
      state: {
        mode: "edit",
        profileId: "default_gost",
        source: "upload",
      },
    });
  });

  test("opens import export route state from quick action", async () => {
    await renderUploadPage();

    fireEvent.click(screen.getByTestId("quick-import-export-button"));

    expect(mockNavigate).toHaveBeenCalledWith("/profiles", {
      state: {
        mode: "import-export",
        profileId: "default_gost",
        source: "upload",
      },
    });
  });

  test("updates selected profile from dropdown", async () => {
    await renderUploadPage();

    await waitFor(() => {
      expect(screen.getByTestId("selected-profile-summary")).toHaveTextContent("Системный");
    });

    fireEvent.change(screen.getByLabelText("Активный профиль"), {
      target: { value: "bmstu" },
    });

    await waitFor(() => {
      expect(screen.getByLabelText("Активный профиль")).toHaveValue("bmstu");
    });
    expect(screen.getByTestId("selected-profile-summary")).toHaveTextContent("Пользовательский");
    expect(Storage.prototype.setItem).toHaveBeenCalledWith("cursa_profile", "bmstu");
  });
});
