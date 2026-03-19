import { render, screen } from "@testing-library/react";
import ErrorBoundary from "../ErrorBoundary";

// Компонент, который выбрасывает ошибку
const ThrowError = ({ shouldThrow }) => {
  if (shouldThrow) {
    throw new Error("Test error");
  }
  return <div>No error</div>;
};

const ThrowChunkLoadError = () => {
  const error = new Error("Loading chunk vendors-node_modules_lucide-react failed.");
  error.name = "ChunkLoadError";
  throw error;
};

// Мокаем console.error чтобы не засорять вывод
const originalError = console.error;
beforeAll(() => {
  console.error = jest.fn();
});

afterAll(() => {
  console.error = originalError;
});

describe("ErrorBoundary", () => {
  beforeEach(() => {
    sessionStorage.clear();
  });

  test("renders children when there is no error", () => {
    render(
      <ErrorBoundary>
        <div>Test content</div>
      </ErrorBoundary>,
    );

    expect(screen.getByText("Test content")).toBeInTheDocument();
  });

  test("renders fallback UI when there is an error", () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>,
    );

    expect(screen.getByText("Что-то пошло не так")).toBeInTheDocument();
    expect(screen.getByText("Перезагрузить")).toBeInTheDocument();
    expect(screen.getByText("Попробовать снова")).toBeInTheDocument();
  });

  test("renders custom fallback when provided", () => {
    render(
      <ErrorBoundary fallback={<div>Custom error message</div>}>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>,
    );

    expect(screen.getByText("Custom error message")).toBeInTheDocument();
  });

  test("calls onError callback when error occurs", () => {
    const onError = jest.fn();

    render(
      <ErrorBoundary onError={onError}>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>,
    );

    expect(onError).toHaveBeenCalled();
  });

  test("renders fallback function with error info", () => {
    const fallbackFn = jest.fn(({ error, reset }) => (
      <div>
        <span>Error: {error.message}</span>
        <button onClick={reset}>Reset</button>
      </div>
    ));

    render(
      <ErrorBoundary fallback={fallbackFn}>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>,
    );

    expect(fallbackFn).toHaveBeenCalled();
    expect(screen.getByText("Error: Test error")).toBeInTheDocument();
  });

  test("retries once automatically on chunk load error", () => {
    const reloadPage = jest.fn();

    render(
      <ErrorBoundary reloadPage={reloadPage}>
        <ThrowChunkLoadError />
      </ErrorBoundary>,
    );

    expect(reloadPage).toHaveBeenCalledTimes(1);
    expect(sessionStorage.getItem("cursa:chunk-reload-attempted")).toBe("1");
  });

  test("shows chunk-specific recovery UI after retry was already attempted", () => {
    const reloadPage = jest.fn();
    sessionStorage.setItem("cursa:chunk-reload-attempted", "1");

    render(
      <ErrorBoundary reloadPage={reloadPage}>
        <ThrowChunkLoadError />
      </ErrorBoundary>,
    );

    expect(reloadPage).not.toHaveBeenCalled();
    expect(screen.getByText("Обновить приложение")).toBeInTheDocument();
    expect(
      screen.getByText(
        "Ошибка загрузки части интерфейса. Обновите приложение, чтобы подтянуть актуальные ресурсы.",
      ),
    ).toBeInTheDocument();
  });
});
