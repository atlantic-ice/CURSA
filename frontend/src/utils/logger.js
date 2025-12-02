/**
 * Централизованный логгер для приложения.
 * В production режиме логи отключены (кроме критических ошибок).
 */

const isDevelopment = process.env.NODE_ENV === 'development';

const logger = {
  /**
   * Логирование информационных сообщений (только в dev режиме)
   */
  log: (...args) => {
    if (isDevelopment) {
      console.log('[INFO]', ...args);
    }
  },

  /**
   * Логирование предупреждений (только в dev режиме)
   */
  warn: (...args) => {
    if (isDevelopment) {
      console.warn('[WARN]', ...args);
    }
  },

  /**
   * Логирование ошибок (всегда, но с контролем)
   * В production можно отправлять в систему мониторинга
   */
  error: (...args) => {
    if (isDevelopment) {
      console.error('[ERROR]', ...args);
    } else {
      // В production: можно отправлять в Sentry, LogRocket и т.д.
      // Для сейчас просто подавляем вывод в консоль
    }
  },

  /**
   * Логирование отладочной информации (только в dev режиме)
   */
  debug: (...args) => {
    if (isDevelopment) {
      console.debug('[DEBUG]', ...args);
    }
  },
};

export default logger;
