import { ErrorOutline, Refresh } from "@mui/icons-material";
import { Box, Button, Container, Paper, Typography } from "@mui/material";
import PropTypes from "prop-types";
import React from "react";
import logger from "../utils/logger";

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
    window.location.reload();
  };

  render() {
    const { hasError, error, errorInfo } = this.state;
    const { children, fallback, showDetails } = this.props;

    if (hasError) {
      // Если передан кастомный fallback, используем его
      if (fallback) {
        return typeof fallback === "function"
          ? fallback({ error, errorInfo, reset: this.handleReset })
          : fallback;
      }

      // Дефолтный UI ошибки
      return (
        <Container maxWidth="sm">
          <Box
            sx={{
              minHeight: "100vh",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              py: 4,
            }}
          >
            <Paper
              elevation={0}
              sx={{
                p: 4,
                textAlign: "center",
                borderRadius: 60,
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

              <Typography variant="h5" gutterBottom sx={{ color: "text.primary", fontWeight: 600 }}>
                Что-то пошло не так
              </Typography>

              <Typography variant="body1" sx={{ color: "text.secondary", mb: 3 }}>
                Произошла непредвиденная ошибка. Попробуйте перезагрузить страницу.
              </Typography>

              {/* Показываем детали ошибки в dev режиме */}
              {showDetails && error && (
                <Paper
                  sx={{
                    p: 2,
                    mb: 3,
                    bgcolor: "rgba(255, 0, 0, 0.1)",
                    borderRadius: 60,
                    textAlign: "left",
                    maxHeight: 200,
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

              <Box sx={{ display: "flex", gap: 2, justifyContent: "center" }}>
                <Button
                  variant="contained"
                  startIcon={<Refresh />}
                  onClick={this.handleReload}
                  sx={{
                    background: "#ededed",
                    color: "#0a0a0a",
                    fontWeight: 600,
                    textTransform: "none",
                    "&:hover": {
                      background: "#ffffff",
                    },
                  }}
                >
                  Перезагрузить
                </Button>

                <Button variant="outlined" color="secondary" onClick={this.handleReset}>
                  Попробовать снова
                </Button>
              </Box>
            </Paper>
          </Box>
        </Container>
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
};

ErrorBoundary.defaultProps = {
  fallback: null,
  showDetails: process.env.NODE_ENV === "development",
  onError: null,
  onReset: null,
};

export default ErrorBoundary;
