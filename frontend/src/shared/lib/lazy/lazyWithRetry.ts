import { lazy, ComponentType } from 'react';

interface LazyOptions {
  retries?: number;
  retryDelay?: number;
  onError?: (error: Error) => void;
}

const DEFAULT_RETRIES = 3;
const DEFAULT_RETRY_DELAY = 1000; // 1s

/**
 * Wrapper for React.lazy with retry logic and exponential backoff.
 * Retries failed chunk loads before giving up.
 *
 * @param importFn - Dynamic import function returning component module
 * @param options - Configuration for retry behavior
 * @returns React.LazyExoticComponent with retry logic
 *
 * @example
 * const HomePage = lazyWithRetry(() => import('pages/home/HomePage'));
 * const AdminPage = lazyWithRetry(
 *   () => import('pages/admin/AdminPage'),
 *   { retries: 5, retryDelay: 500 }
 * );
 */
export function lazyWithRetry<T extends ComponentType<unknown>>(
  importFn: () => Promise<{ default: T }>,
  options: LazyOptions = {}
): React.LazyExoticComponent<T> {
  const {
    retries = DEFAULT_RETRIES,
    retryDelay = DEFAULT_RETRY_DELAY,
    onError
  } = options;

  return lazy(async () => {
    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        return await importFn();
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));

        if (attempt < retries) {
          // Exponential backoff: 1s, 2s, 4s...
          const delay = retryDelay * Math.pow(2, attempt);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    // All retries failed
    if (onError && lastError) {
      onError(lastError);
    }
    throw lastError;
  });
}
