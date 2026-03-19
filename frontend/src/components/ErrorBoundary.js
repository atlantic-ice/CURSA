import { ErrorOutline, Refresh } from "@mui/icons-material";
import { Box, Button, Paper, Typography } from "@mui/material";
import PropTypes from "prop-types";
import React from "react";
import logger from "../utils/logger";

const CHUNK_RELOAD_STORAGE_KEY = "cursa:chunk-reload-attempted";

const CHUNK_ERROR_PATTERNS = [
  /ChunkLoadError/i,
  /Loading chunk [^\s]+ failed/i,
  /Failed to fetch dynamically imported module/i,
];

function isChunkLoadError(error) {
  const message = error?.message || error?.toString?.() || "";
  const name = error?.name || "";
  return CHUNK_ERROR_PATTERNS.some((pattern) => pattern.test(message) || pattern.test(name));
}

/**
 * ErrorBoundary - компонент для глобальной обработки ошибок React.
 *
 * Перехватывает JavaScript ошибки в дочерних компонентах,
 * логирует их и отображает fallback UI вместо белого экрана.
 *
 * @example
 * <ErrorBoundary>
 *   <App />
 * </ErrorBoundary>
 *
 * @example С кастомным fallback
 * <ErrorBoundary fallback={<CustomErrorPage />}>
 *   <App />
 * </ErrorBoundary>
 */
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  /**
   * Обновляет состояние при возникновении ошибки
   */
  static getDerivedStateFromError(error) {
    return {
      hasError: true,
      error,
    };
  }

  /**
   * Логирует информацию об ошибке
   */
  componentDidCatch(error, errorInfo) {
    // Логируем ошибку через централизованный logger
    logger.error("ErrorBoundary caught an error:", {
      error: error?.toString(),
      stack: error?.stack,
      componentStack: errorInfo?.componentStack,
    });

    this.setState({
      errorInfo,
    });

    // При ошибке загрузки чанка пробуем одно автоматическое восстановление.
    if (isChunkLoadError(error)) {
      const alreadyRetried = sessionStorage.getItem(CHUNK_RELOAD_STORAGE_KEY) === "1";
      if (!alreadyRetried) {
        sessionStorage.setItem(CHUNK_RELOAD_STORAGE_KEY, "1");
        this.props.reloadPage();
        return;
      }
    }

    // Вызываем callback если передан
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  /**
   * Сбрасывает состояние ошибки и перезагружает
   */
  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });

    // Если передан onReset callback, вызываем его
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  /**
   * Перезагружает страницу
   */
  handleReload = () => {
    sessionStorage.removeItem(CHUNK_RELOAD_STORAGE_KEY);
    this.props.reloadPage();
  };

  render() {
    const { hasError, error, errorInfo } = this.state;
    const { children, fallback, showDetails } = this.props;
    const chunkLoadFailed = isChunkLoadError(error);

    if (hasError) {
      // Если передан кастомный fallback, используем его
      if (fallback) {
        return typeof fallback === "function"
          ? fallback({ error, errorInfo, reset: this.handleReset })
          : fallback;
      }

      // Дефолтный UI ошибки
      return (
        <Box sx={{ minHeight: "100vh", px: { xs: 2, md: 3 }, py: { xs: 4, md: 6 } }}>
          <Box
            sx={{
              mx: "auto",
              width: "100%",
              maxWidth: "1480px",
              minHeight: "calc(100vh - 48px)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Paper
              elevation={0}
              sx={{
                width: "100%",
                maxWidth: 760,
                p: { xs: 4, md: 6 },
                textAlign: "center",
                borderRadius: 8,
                background: "rgba(10, 10, 10, 0.8)",
                border: "1px solid rgba(255, 255, 255, 0.08)",
              }}
            >
              <ErrorOutline
                sx={{
                  fontSize: 64,
                  color: "error.main",
                  mb: 2,
                }}
              />

              <Typography variant="h4" gutterBottom sx={{ color: "text.primary", fontWeight: 700 }}>
                Что-то пошло не так
              </Typography>

              <Typography
                variant="body1"
                sx={{ color: "text.secondary", mb: 4, fontSize: "1.05rem" }}
              >
                {chunkLoadFailed
                  ? "Ошибка загрузки части интерфейса. Обновите приложение, чтобы подтянуть актуальные ресурсы."
                  : "Произошла непредвиденная ошибка. Попробуйте перезагрузить страницу."}
              </Typography>

              {/* Показываем детали ошибки в dev режиме */}
              {showDetails && error && (
                <Paper
                  sx={{
                    p: 2,
                    mb: 4,
                    bgcolor: "rgba(255, 0, 0, 0.1)",
                    borderRadius: 4,
                    textAlign: "left",
                    maxHeight: 240,
                    overflow: "auto",
                  }}
                >
                  <Typography
                    variant="caption"
                    component="pre"
                    sx={{
                      color: "error.light",
                      fontFamily: "monospace",
                      whiteSpace: "pre-wrap",
                      wordBreak: "break-word",
                      m: 0,
                    }}
                  >
                    {error.toString()}
                    {errorInfo?.componentStack && (
                      <>
                        {"\n\nComponent Stack:"}
                        {errorInfo.componentStack}
                      </>
                    )}
                  </Typography>
                </Paper>
              )}

              <Box sx={{ display: "flex", gap: 2, justifyContent: "center", flexWrap: "wrap" }}>
                <Button
                  variant="contained"
                  startIcon={<Refresh />}
                  onClick={this.handleReload}
                  size="large"
                  sx={{
                    background: "#ededed",
                    color: "#0a0a0a",
                    fontWeight: 600,
                    textTransform: "none",
                    minWidth: 200,
                    "&:hover": {
                      background: "#ffffff",
                    },
                  }}
                >
                  {chunkLoadFailed ? "Обновить приложение" : "Перезагрузить"}
                </Button>

                <Button
                  variant="outlined"
                  color="secondary"
                  onClick={this.handleReset}
                  size="large"
                  sx={{ minWidth: 200 }}
                >
                  Попробовать снова
                </Button>
              </Box>
            </Paper>
          </Box>
        </Box>
      );
    }

    return children;
  }
}

ErrorBoundary.propTypes = {
  /** Дочерние компоненты */
  children: PropTypes.node.isRequired,
  /** Кастомный fallback UI или функция (error, errorInfo, reset) => JSX */
  fallback: PropTypes.oneOfType([PropTypes.node, PropTypes.func]),
  /** Показывать детали ошибки (для разработки) */
  showDetails: PropTypes.bool,
  /** Callback при возникновении ошибки */
  onError: PropTypes.func,
  /** Callback при сбросе состояния */
  onReset: PropTypes.func,
  /** Функция перезагрузки страницы (для тестов/кастомизации) */
  reloadPage: PropTypes.func,
};

ErrorBoundary.defaultProps = {
  fallback: null,
  showDetails: process.env.NODE_ENV === "development",
  onError: null,
  onReset: null,
  reloadPage: () => window.location.reload(),
};

export default ErrorBoundary;
