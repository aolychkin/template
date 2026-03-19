/**
 * Auth утилиты
 * 
 * Работа с токенами и состоянием авторизации
 */
import { getCookie, setCookie, deleteCookie } from '../cookies';
import { ACCESS_TOKEN_COOKIE, REFRESH_TOKEN_COOKIE } from './constants';
import { broadcastLogout } from './sync';

export const setAccessToken = (token: string) => {
  if (!token) {
    throw new Error('Token is required');
  }
  try {
    setCookie(ACCESS_TOKEN_COOKIE, token, 1);
  } catch (error) {
    console.error('Failed to set access token:', error);
    throw error;
  }
};

export const setRefreshToken = (token: string) => {
  if (!token) {
    throw new Error('Token is required');
  }
  try {
    setCookie(REFRESH_TOKEN_COOKIE, token, 7);
  } catch (error) {
    console.error('Failed to set refresh token:', error);
    throw error;
  }
};

export const getAccessToken = (): string | null => {
  try {
    const token = getCookie(ACCESS_TOKEN_COOKIE);
    return token || null;
  } catch (error) {
    console.error('Failed to get access token:', error);
    return null;
  }
};

export const getRefreshToken = (): string | null => {
  try {
    const token = getCookie(REFRESH_TOKEN_COOKIE);
    return token || null;
  } catch (error) {
    console.error('Failed to get refresh token:', error);
    return null;
  }
};

export const isLoggedIn = (): boolean => {
  try {
    const token = getAccessToken();

    // Constant-time проверка невалидных значений
    const invalidValues = new Set(['0', 'null', 'undefined']);
    if (!token || invalidValues.has(token)) {
      return false;
    }

    return true;
  } catch (error) {
    console.error('Unexpected error in isLoggedIn:', error);
    return false;
  }
};

export const logout = async () => {
  // Сначала очищаем локальные данные (важнее всего)
  try {
    deleteCookie(ACCESS_TOKEN_COOKIE);
    deleteCookie(REFRESH_TOKEN_COOKIE);
    localStorage.removeItem('isAuthenticated');
    broadcastLogout();
  } catch (error) {
    console.error('Failed to clear local auth:', error);
  }

  // Backend logout - best effort
  // Вызываем ПОСЛЕ очистки локальных данных, чтобы не блокировать UI
  try {
    const { grpcClient } = await import('../grpc/grpc-client');
    const { LogoutRequest } = await import('shared/api/generated/auth/auth_pb');
    const request = new LogoutRequest();
    await grpcClient.auth.logout(request);
  } catch {
    // Игнорируем ошибки - локальный logout важнее
  }
};

export const clearAuth = logout; // Alias для совместимости
