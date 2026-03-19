/**
 * Retry с Exponential Backoff
 * 
 * - Exponential backoff (1s, 2s, 4s) с jitter (±20%)
 * - Max 3 attempts
 * - Retry только на network errors и 5xx
 * - Координация с circuit breaker
 * 
 * ВАЖНО: Единственный слой retry — только withRetry
 * RTK Query retry, browser retry, gRPC-Web retry — ОТКЛЮЧЕНЫ
 */
import { logger } from './logger';
import { grpcCircuitBreaker } from './circuit-breaker';

interface RetryOptions {
  maxAttempts?: number;
  baseDelay?: number;
  maxDelay?: number;
  shouldRetry?: (error: unknown) => boolean;
  // Координация с circuit breaker
  checkCircuitBreaker?: boolean;
}

const DEFAULT_OPTIONS: Required<RetryOptions> = {
  maxAttempts: 3,
  baseDelay: 1000,  // 1s
  maxDelay: 4000,   // 4s
  shouldRetry: (error: unknown) => {
    // Retry только на network errors и 5xx
    if (error instanceof Error) {
      if (error.name === 'TypeError' || error.message.includes('Network')) {
        return true;
      }
      // НЕ retry если circuit breaker open
      if (error.message.includes('temporarily unavailable')) {
        return false;
      }
    }
    // GrpcError с кодом 0 (network) или >= 500
    if (typeof error === 'object' && error !== null && 'code' in error) {
      const code = (error as { code: number }).code;
      return code === 0 || code >= 500;
    }
    return false;
  },
  checkCircuitBreaker: true,
};

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Добавляем jitter для предотвращения thundering herd
const addJitter = (delay: number): number => {
  // ±20% jitter
  const jitter = delay * 0.2 * (Math.random() * 2 - 1);
  return Math.max(0, delay + jitter);
};

export async function withRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  let lastError: unknown;

  for (let attempt = 1; attempt <= opts.maxAttempts; attempt++) {
    // Проверяем circuit breaker ПЕРЕД каждой попыткой
    if (opts.checkCircuitBreaker && grpcCircuitBreaker.getState() === 'open') {
      logger.warn('Circuit breaker is open, skipping retry');
      throw new Error('Service temporarily unavailable');
    }

    try {
      return await fn();
    } catch (error) {
      lastError = error;

      if (attempt === opts.maxAttempts || !opts.shouldRetry(error)) {
        throw error;
      }

      // Exponential backoff с jitter: ~1s, ~2s, ~4s
      const baseDelay = Math.min(
        opts.baseDelay * Math.pow(2, attempt - 1),
        opts.maxDelay
      );
      const delay = addJitter(baseDelay);

      logger.warn(`Retry attempt ${attempt}/${opts.maxAttempts} after ${Math.round(delay)}ms`, error);
      await sleep(delay);
    }
  }

  throw lastError;
}

// Хелпер для проверки, стоит ли retry
export const isRetryableError = (error: unknown): boolean => {
  return DEFAULT_OPTIONS.shouldRetry(error);
};
