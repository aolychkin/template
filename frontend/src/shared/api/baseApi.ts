/**
 * Base API Configuration
 * 
 * RTK Query setup с gRPC-Web интеграцией.
 * 
 * Для gRPC вызовов используйте grpcClient напрямую:
 * import { grpcClient } from 'shared/lib/grpc';
 * 
 * RTK Query используется для:
 * - Кеширование данных
 * - Автоматические refetch
 * - Оптимистичные обновления
 * - Инвалидация кеша
 */
import { createApi, fakeBaseQuery } from '@reduxjs/toolkit/query/react';
import { grpcClient, GrpcError } from 'shared/lib/grpc';
import { logger } from 'shared/lib/logger';

// Типы для gRPC ошибок в RTK Query формате
interface GrpcQueryError {
  status: number;
  error: string;
  requestId?: string;
}

/**
 * Обработка gRPC ошибок для RTK Query
 */
export const handleGrpcError = (error: unknown): { error: GrpcQueryError } => {
  if (error instanceof GrpcError) {
    return {
      error: {
        status: error.code,
        error: error.message,
        requestId: error.requestId,
      },
    };
  }

  if (error instanceof Error) {
    logger.error('Unexpected error:', error);
    return {
      error: {
        status: 500,
        error: error.message,
      },
    };
  }

  return {
    error: {
      status: 500,
      error: 'Unknown error',
    },
  };
};

/**
 * Base API с fakeBaseQuery для gRPC
 * 
 * Используем fakeBaseQuery потому что gRPC вызовы делаются через grpcClient,
 * а не через fetch. RTK Query используется только для кеширования.
 */
export const api = createApi({
  reducerPath: 'api',
  baseQuery: fakeBaseQuery<GrpcQueryError>(),
  tagTypes: ['User', 'Session', 'Profile'],
  endpoints: () => ({}),
});

// Re-export grpcClient для удобства
export { grpcClient };
