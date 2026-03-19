/**
 * Token Refresh Interceptor
 * 
 * Автоматическое обновление токенов с retry логикой
 */
import { getAccessToken, getRefreshToken, setAccessToken, setRefreshToken, clearAuth } from './auth';
import { isTokenExpired, isTokenExpiringSoon } from './jwt';
import { logger } from '../logger';

let isRefreshing = false;
let refreshPromise: Promise<boolean> | null = null;

/** Максимум попыток refresh при network ошибках */
const MAX_REFRESH_RETRIES = 3;
/** Задержка между попытками (ms) */
const RETRY_DELAY_MS = 1000;

export const refreshTokenIfNeeded = async (): Promise<boolean> => {
  const accessToken = getAccessToken();

  if (!accessToken) {
    return false;
  }

  // Если токен истёк или скоро истечёт - обновляем
  if (isTokenExpired(accessToken) || isTokenExpiringSoon(accessToken, 60)) {
    if (isRefreshing && refreshPromise) {
      return refreshPromise;
    }

    isRefreshing = true;
    refreshPromise = performRefreshWithRetry();

    try {
      const result = await refreshPromise;
      if (!result) {
        // Refresh не удался после всех попыток - очищаем auth
        clearAuth();
      }
      return result;
    } finally {
      isRefreshing = false;
      refreshPromise = null;
    }
  }

  return true;
};

/**
 * Проверяет, является ли ошибка network-ошибкой (можно retry)
 */
function isNetworkError(error: unknown): boolean {
  if (error instanceof Error) {
    const message = error.message.toLowerCase();
    // gRPC network errors
    if (message.includes('failed to fetch') ||
      message.includes('network') ||
      message.includes('unavailable') ||
      message.includes('deadline exceeded') ||
      message.includes('connection') ||
      message.includes('timeout')) {
      return true;
    }
  }
  return false;
}

/**
 * Задержка между попытками
 */
function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Refresh с retry логикой для network ошибок
 * Позволяет пережить кратковременный downtime при деплое
 */
async function performRefreshWithRetry(): Promise<boolean> {
  let lastError: unknown;

  for (let attempt = 1; attempt <= MAX_REFRESH_RETRIES; attempt++) {
    try {
      const result = await performRefresh();
      return result;
    } catch (error) {
      lastError = error;

      // Если это network ошибка и есть ещё попытки - retry
      if (isNetworkError(error) && attempt < MAX_REFRESH_RETRIES) {
        logger.warn(`[refresh] Network error, retry ${attempt}/${MAX_REFRESH_RETRIES}...`);
        await delay(RETRY_DELAY_MS * attempt); // Exponential backoff
        continue;
      }

      // Не network ошибка или закончились попытки
      break;
    }
  }

  // Все попытки исчерпаны
  logger.warn('[refresh] All retries failed', lastError);
  return false;
}

async function performRefresh(): Promise<boolean> {
  const refreshToken = getRefreshToken();
  if (!refreshToken) {
    return false;
  }

  const { grpcClient } = await import('../grpc/grpc-client');
  const { RefreshTokenRequest } = await import('shared/api/generated/auth/auth_pb_wrapper');

  const request = new RefreshTokenRequest();
  request.setRefreshToken(refreshToken);

  const response = await grpcClient.auth.refreshToken(request);

  const newAccessToken = response.getAccessToken();
  const newRefreshToken = response.getRefreshToken();

  if (!newAccessToken || !newRefreshToken) {
    return false;
  }

  setAccessToken(newAccessToken);
  setRefreshToken(newRefreshToken);

  return true;
}
