/**
 * Debug утилиты
 * 
 * Логирование только в development режиме
 */
import { config } from 'shared/config';

export const debugLog = (...args: unknown[]) => {
  if (config.enableDebugLogs) {
    console.log(...args);
  }
};

export const debugError = (...args: unknown[]) => {
  if (config.enableDebugLogs) {
    console.error(...args);
  }
};

export const debugWarn = (...args: unknown[]) => {
  if (config.enableDebugLogs) {
    console.warn(...args);
  }
};
