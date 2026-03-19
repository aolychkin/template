/**
 * Централизованный Logger
 * 
 * - Поддержка уровней error, warn, info, debug
 * - Уважает config.enableDebugLogs
 * - Подготовка для Sentry
 */
import { config } from 'shared/config';

type LogLevel = 'error' | 'warn' | 'info' | 'debug';

interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  data?: unknown;
}

// Подготовка для Sentry: можно добавить callback для отправки ошибок
type ErrorCallback = (entry: LogEntry) => void;
let errorCallback: ErrorCallback | null = null;

export const setErrorCallback = (callback: ErrorCallback) => {
  errorCallback = callback;
};

const formatLog = (level: LogLevel, message: string, data?: unknown): LogEntry => ({
  level,
  message,
  timestamp: new Date().toISOString(),
  data,
});

const shouldLog = (level: LogLevel): boolean => {
  // В production логируем только errors
  // В development — всё если enableDebugLogs
  if (level === 'error') return true;
  return config.enableDebugLogs;
};

export const logger = {
  error: (message: string, ...args: unknown[]) => {
    const entry = formatLog('error', message, args.length > 0 ? args : undefined);

    if (shouldLog('error')) {
      console.error(`[ERROR] ${message}`, ...args);
    }

    // Отправляем в Sentry (когда подключим)
    errorCallback?.(entry);
  },

  warn: (message: string, ...args: unknown[]) => {
    if (!shouldLog('warn')) return;
    console.warn(`[WARN] ${message}`, ...args);
  },

  info: (message: string, ...args: unknown[]) => {
    if (!shouldLog('info')) return;
    console.info(`[INFO] ${message}`, ...args);
  },

  debug: (message: string, ...args: unknown[]) => {
    if (!shouldLog('debug')) return;
    console.debug(`[DEBUG] ${message}`, ...args);
  },
};
