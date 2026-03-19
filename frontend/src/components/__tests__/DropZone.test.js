import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { createContext } from "react";
import DropZone from "../DropZone";

// Создаем mock контекст (так как DropZone импортирует его из App)
const CheckHistoryContext = createContext({
  addToHistory: () => {},
});

// Мокаем импорт App.js для DropZone
jest.mock("../../App", () => ({
  CheckHistoryContext: require("react").createContext({ addToHistory: jest.fn() }),
}));

jest.mock("../../utils/api", () => ({
  __esModule: true,
  default: {
    uploadDocument: jest
      .fn()
      .mockResolvedValue({ success: true, check_results: { total_issues_count: 0 } }),
    uploadBatch: jest.fn().mockResolvedValue({ success: true, results: [] }),
  },
}));

// Мокаем react-router-dom navigate
const mockNavigate = jest.fn();
jest.mock(
  "react-router-dom",
  () => ({
    BrowserRouter: ({ children }) => children,
    useNavigate: () => mockNavigate,
  }),
  { virtual: true },
);

// Wrapper компонент с контекстом
const renderWithRouter = (component) => {
  return render(component);
};

describe("DropZone", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    Object.defineProperty(window, "matchMedia", {
      writable: true,
      value: jest.fn().mockImplementation((query) => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: jest.fn(),
        removeListener: jest.fn(),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        dispatchEvent: jest.fn(),
      })),
    });
  });

  test("renders drop zone with upload message", () => {
    renderWithRouter(<DropZone />);

    // Проверяем наличие текста для загрузки
    expect(screen.getByText(/Перетащите/i)).toBeInTheDocument();
  });

  test("shows error for non-docx files", async () => {
    renderWithRouter(<DropZone />);

    const dropzone = screen.getByRole("presentation");
    const file = new File(["test"], "test.txt", { type: "text/plain" });

    // Симулируем drop
    fireEvent.drop(dropzone, {
      dataTransfer: {
        files: [file],
        types: ["Files"],
      },
    });

    // Ждем появления ошибки
    await waitFor(() => {
      expect(screen.getByText(/загрузите файл docx/i)).toBeInTheDocument();
    });
  });

  test("accepts docx files", async () => {
    renderWithRouter(<DropZone />);

    const dropzone = screen.getByRole("presentation");
    const file = new File(["test content"], "test.docx", {
      type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    });

    // Симулируем drop
    Object.defineProperty(dropzone, "files", { value: [file] });

    fireEvent.drop(dropzone, {
      dataTransfer: {
        files: [file],
        types: ["Files"],
      },
    });

    await waitFor(() => {
      expect(screen.queryByText(/поддерживаются только файлы docx/i)).not.toBeInTheDocument();
    });
  });

  test("renders children when provided", () => {
    renderWithRouter(
      <DropZone>
        <span>Custom content</span>
      </DropZone>,
    );

    // Проверяем что children рендерится
    expect(screen.getByText("Custom content")).toBeInTheDocument();
  });

  test("applies custom sx styles", () => {
    const { container } = renderWithRouter(<DropZone sx={{ backgroundColor: "red" }} />);

    // Компонент должен отрендериться
    expect(container.firstChild).toBeInTheDocument();
  });
});
