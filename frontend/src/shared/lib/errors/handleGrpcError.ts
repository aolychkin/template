/**
 * gRPC Error Handler
 * 
 * Обрабатывает ошибки gRPC и возвращает формат для RTK Query
 */
import { logger } from 'shared/lib/logger';
import { GrpcCodes } from 'shared/lib/grpc/grpc-client';
import { clearAuth } from 'shared/lib/auth/auth';
import { tokenSync } from 'shared/lib/auth/token-sync';

// gRPC код, требующий logout (только UNAUTHENTICATED)
const UNAUTHENTICATED_CODE = GrpcCodes.UNAUTHENTICATED; // 16

// Маппинг gRPC кодов в статусы
const getErrorStatus = (code: number): string => {
  const statusMap: Record<number, string> = {
    3: 'INVALID_ARGUMENT',
    5: 'NOT_FOUND',
    7: 'PERMISSION_DENIED',
    8: 'RESOURCE_EXHAUSTED',
    14: 'UNAVAILABLE',
    16: 'UNAUTHENTICATED',
  };
  return statusMap[code] || 'UNKNOWN_ERROR';
};

// Маппинг gRPC кодов в русские сообщения
const getUserFriendlyMessage = (code: number, originalMessage: string): string => {
  const messageMap: Record<number, string> = {
    4: 'Превышено время ожидания',
    8: 'Слишком много запросов, подождите',
    14: 'Сервис временно недоступен',
    16: 'Сессия истекла, войдите снова',
  };
  return messageMap[code] || originalMessage || 'Произошла ошибка';
};

// Безопасный редирект
const safeRedirect = (url: string) => {
  try {
    if (typeof window !== 'undefined' && window.location) {
      window.location.href = url;
    }
  } catch (error) {
    logger.error('Failed to redirect:', error);
  }
};

// Получение сообщения об ошибке
const getErrorMessage = (error: unknown): string => {
  try {
    if (error && typeof error === 'object' && 'message' in error) {
      return (error as { message: string }).message || 'Unknown error';
    }
    return String(error) || 'Unknown error';
  } catch {
    return 'Unknown error';
  }
};

export interface GrpcErrorResponse {
  status: string;
  error: string;
  code?: number;
  requestId?: string;
}

/**
 * Обработчик ошибок gRPC для RTK Query
 * 
 * @param error - Ошибка от gRPC клиента
 * @param skipRedirect - Пропустить редирект на /login при 401
 * @returns Объект ошибки для RTK Query
 */
export const handleGrpcError = (
  error: unknown,
  skipRedirect: boolean = false
): { error: GrpcErrorResponse } => {
  try {
    if (!error) {
      return { error: { status: 'UNKNOWN_ERROR', error: 'Unknown error occurred' } };
    }

    // Типизация ошибки
    const grpcError = error as { code?: number; message?: string; requestId?: string };

    // Логируем ошибку
    logger.error('gRPC error', error);

    // Редирект на login при ошибке авторизации
    if (grpcError.code === UNAUTHENTICATED_CODE && !skipRedirect) {
      const currentPath = typeof window !== 'undefined' ? window.location.pathname : '';
      // Не редиректим если уже на странице логина или регистрации
      if (currentPath !== '/login' && currentPath !== '/register') {
        // Уведомляем другие вкладки о logout
        tokenSync.notifyLogout();
        // Очищаем auth state перед редиректом
        clearAuth();
        safeRedirect('/login');
      }
    }

    return {
      error: {
        status: getErrorStatus(grpcError.code || 0),
        error: getUserFriendlyMessage(grpcError.code || 0, getErrorMessage(error)),
        code: grpcError.code,
        requestId: grpcError.requestId || undefined,
      },
    };
  } catch (handlerError) {
    logger.error('Error in handleGrpcError:', handlerError);
    return {
      error: {
        status: 'UNKNOWN_ERROR',
        error: 'Failed to handle error',
      },
    };
  }
};

// Legacy функция для обратной совместимости
export interface GrpcError {
  status: number;
  error: string;
  requestId?: string;
}

interface FetchBaseQueryError {
  status: number | string;
  data?: {
    message?: string;
    error?: string;
  };
}

export function handleGrpcErrorLegacy(error: unknown): GrpcError {
  if (isFetchBaseQueryError(error)) {
    const status = typeof error.status === 'number' ? error.status : 500;
    const message = error.data?.message || error.data?.error || getDefaultMessage(status);

    return {
      status,
      error: message,
    };
  }

  return {
    status: 500,
    error: 'Произошла ошибка, попробуйте позже',
  };
}

function isFetchBaseQueryError(error: unknown): error is FetchBaseQueryError {
  return typeof error === 'object' && error !== null && 'status' in error;
}

function getDefaultMessage(status: number): string {
  switch (status) {
    case 400:
      return 'Некорректный запрос';
    case 401:
      return 'Требуется авторизация';
    case 403:
      return 'Доступ запрещён';
    case 404:
      return 'Ресурс не найден';
    case 429:
      return 'Слишком много запросов';
    case 500:
    default:
      return 'Внутренняя ошибка сервера';
  }
}
