import { ThemeProvider, createTheme } from "@mui/material/styles";
import "@testing-library/jest-dom";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import ReportPage from "../ReportPage";

const mockNavigate = jest.fn();
const mockLocation = jest.fn();
const mockAutocorrect = jest.fn();
const mockDownloadCorrected = jest.fn();

jest.mock("../../components/DocumentViewer.js", () => ({
  __esModule: true,
  default: ({
    originalPath,
    correctedPath,
    highlightedIssues = [],
    activePhaseTitle,
    isProcessing,
  }) => (
    <div data-testid="document-viewer-mock">
      {originalPath}::{correctedPath}::{activePhaseTitle}::{String(isProcessing)}::
      {highlightedIssues.length}
    </div>
  ),
}));

jest.mock(
  "react-router-dom",
  () => ({
    useLocation: () => mockLocation(),
    useNavigate: () => mockNavigate,
  }),
  { virtual: true },
);

jest.mock("framer-motion", () => ({
  motion: {
    div: ({ children, ...props }) => <div {...props}>{children}</div>,
  },
}));

jest.mock("../../api/client", () => ({
  documentsApi: {
    autocorrect: (...args) => mockAutocorrect(...args),
    downloadCorrected: (...args) => mockDownloadCorrected(...args),
  },
  getApiErrorMessage: (error, fallback) => error?.message || fallback,
}));

describe("ReportPage", () => {
  const theme = createTheme({
    palette: {
      mode: "dark",
    },
  });

  beforeEach(() => {
    jest.clearAllMocks();
    Storage.prototype.getItem = jest.fn(() => "token-123");
    global.URL.createObjectURL = jest.fn(() => "blob:download");
    global.URL.revokeObjectURL = jest.fn();
  });

  const renderPage = () =>
    render(
      <ThemeProvider theme={theme}>
        <ReportPage />
      </ThemeProvider>,
    );

  test("starts autocorrect from report when analyzed file is available", async () => {
    mockLocation.mockReturnValue({
      state: {
        fileName: "report.docx",
        profileId: "default_gost",
        profileName: "ГОСТ",
        reportData: {
          id: "report-1",
          document_id: "doc-1",
          document_name: "report.docx",
          profile_id: "default_gost",
          profile_name: "ГОСТ",
          created_at: "2026-03-06T00:00:00Z",
          validation_result: {
            document_id: "doc-1",
            status: "failed",
            summary: {
              total_issues: 0,
              critical_issues: 0,
              error_issues: 0,
              warning_issues: 0,
              info_issues: 0,
              autocorrectable: 0,
              issues_by_category: {},
              completion_time_ms: 0,
            },
            issues: [],
            issues_by_severity: {
              critical: [],
              error: [],
              warning: [],
              info: [],
            },
            recommendations: [],
            completion_percentage: 0,
            metadata: {
              validators_executed: [],
              total_validators: 0,
              skipped_validators: [],
              external_tools_used: [],
            },
          },
          document_token: "session-123",
          check_results: {
            total_issues_count: 1,
            issues: [
              {
                type: "font",
                severity: "high",
                description: "Шрифт не соответствует ГОСТ",
                location: "Страница 1",
                auto_fixable: true,
              },
            ],
          },
        },
      },
    });
    mockAutocorrect.mockResolvedValue({
      success: true,
      corrected_file_path: "report_multipass.docx",
      original_preview_path: "report_original.docx",
      check_results: {
        total_issues_count: 2,
        issues: [
          {
            type: "spacing",
            severity: "medium",
            description: "Интервал абзаца требует ручной проверки",
            location: "Страница 2",
            auto_fixable: false,
          },
        ],
      },
      improvement: {
        resolved_total_issues: 3,
        resolved_font_issues: 1,
        after_total_issues: 2,
      },
      report: {
        passes_completed: 2,
        total_issues_fixed: 1,
        remaining_issues: 0,
        actions_by_phase: {
          structure: 1,
          styles: 3,
          formatting: 2,
          verification: 1,
        },
        verification_results: {
          fonts: { passed: true, message: "Все шрифты корректны" },
        },
      },
    });

    renderPage();

    fireEvent.click(screen.getByRole("button", { name: /исправить автоматически/i }));

    await waitFor(() => {
      expect(mockAutocorrect).toHaveBeenCalledWith("session-123", "report.docx", "token-123");
    });

    expect(await screen.findByRole("button", { name: /скачать исправленный файл/i })).toBeVisible();
    expect(screen.getByText(/исправлено: 1/i)).toBeVisible();
    expect(screen.getByText(/убрано проблем: 3/i)).toBeVisible();
    expect(screen.getByText(/исправлено шрифтов: 1/i)).toBeVisible();
    expect(screen.getByRole("heading", { name: /после автокоррекции/i })).toBeVisible();
    expect(screen.getByText(/осталось проблем/i)).toBeVisible();
    expect(screen.getByText(/до исправления:\s*хорошо/i)).toBeVisible();
    expect(screen.getByRole("heading", { name: /^хорошо$/i })).toBeVisible();
    expect(screen.getByText(/проблем после коррекции/i)).toBeVisible();
    expect(screen.getByText(/интервал абзаца требует ручной проверки/i)).toBeVisible();
    expect(screen.getByRole("heading", { name: /живой режим исправлений/i })).toBeVisible();
    expect(screen.getByText(/фокус playback:\s*структура/i)).toBeVisible();
    expect(screen.getByRole("button", { name: /запустить walkthrough/i })).toBeVisible();
    expect(screen.getByRole("button", { name: /сначала/i })).toBeVisible();
    expect(screen.getByText(/шаг 1 из 4/i)).toBeVisible();
    expect(screen.getByTestId("document-viewer-mock")).toHaveTextContent(
      /report_original\.docx::report_multipass\.docx::структура::false::1/i,
    );
    expect(screen.queryByText(/шрифт не соответствует гост/i)).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /запустить walkthrough/i }));
    expect(screen.getByRole("button", { name: /пауза walkthrough/i })).toBeVisible();
  });

  test("downloads corrected file when correction already exists", async () => {
    mockLocation.mockReturnValue({
      state: {
        fileName: "report.docx",
        profileId: "default_gost",
        profileName: "ГОСТ",
        reportData: {
          id: "report-2",
          document_id: "doc-2",
          document_name: "report.docx",
          profile_id: "default_gost",
          profile_name: "ГОСТ",
          created_at: "2026-03-06T00:00:00Z",
          validation_result: {
            document_id: "doc-2",
            status: "warning",
            summary: {
              total_issues: 0,
              critical_issues: 0,
              error_issues: 0,
              warning_issues: 0,
              info_issues: 0,
              autocorrectable: 0,
              issues_by_category: {},
              completion_time_ms: 0,
            },
            issues: [],
            issues_by_severity: {
              critical: [],
              error: [],
              warning: [],
              info: [],
            },
            recommendations: [],
            completion_percentage: 0,
            metadata: {
              validators_executed: [],
              total_validators: 0,
              skipped_validators: [],
              external_tools_used: [],
            },
          },
          corrected_file_path: "report_corrected.docx",
        },
      },
    });
    mockDownloadCorrected.mockResolvedValue(new Blob(["docx"]));

    renderPage();

    expect(screen.getByTestId("document-viewer-mock")).toHaveTextContent(
      /::report_corrected\.docx::/i,
    );
    expect(
      screen.getByText(/исходный снимок недоступен, поэтому показываем исправленный документ/i),
    ).toBeVisible();

    fireEvent.click(screen.getByRole("button", { name: /скачать исправленный файл/i }));

    await waitFor(() => {
      expect(mockDownloadCorrected).toHaveBeenCalledWith("report_corrected.docx", "token-123");
    });
  });
});
