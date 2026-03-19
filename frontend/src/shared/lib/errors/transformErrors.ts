/**
 * transformErrors - преобразование ошибок gRPC в формат формы
 * 
 * gRPC возвращает ошибки в разных форматах, этот модуль
 * нормализует их для отображения в формах
 */
import type { FormErrors } from 'shared/lib/types';

type PlainObject = Record<string, unknown>;

/**
 * Преобразует объект ошибок в формат для формы
 * - массив → строка через запятую
 * - строка → без изменений
 * - остальное → пустая строка
 * 
 * @example
 * transformErrors({
 *   email: ['Invalid format', 'Already exists'],
 *   password: 'Too short',
 *   name: 123
 * });
 * // { email: 'Invalid format, Already exists', password: 'Too short', name: '' }
 */
export function transformErrors(errors: PlainObject): FormErrors {
  return Object.entries(errors).reduce<FormErrors>((acc, [key, value]) => {
    if (Array.isArray(value)) {
      acc[key] = value.map(String).join(', ');
    } else if (typeof value === 'string') {
      acc[key] = value;
    } else if (value !== null && value !== undefined) {
      acc[key] = String(value);
    } else {
      acc[key] = '';
    }
    return acc;
  }, {});
}

/**
 * Извлекает ошибки валидации из gRPC ответа
 * 
 * gRPC может возвращать ошибки в metadata или в message
 */
export function extractGrpcValidationErrors(error: unknown): FormErrors {
  if (!error || typeof error !== 'object') {
    return {};
  }

  const grpcError = error as {
    message?: string;
    metadata?: Record<string, string>;
    details?: Array<{ field?: string; message?: string }>;
  };

  // Если есть details с полями
  if (Array.isArray(grpcError.details)) {
    return grpcError.details.reduce<FormErrors>((acc, detail) => {
      if (detail.field && detail.message) {
        acc[detail.field] = detail.message;
      }
      return acc;
    }, {});
  }

  // Если есть metadata
  if (grpcError.metadata) {
    return transformErrors(grpcError.metadata);
  }

  // Пытаемся распарсить message как JSON
  if (grpcError.message) {
    try {
      const parsed = JSON.parse(grpcError.message);
      if (typeof parsed === 'object' && parsed !== null) {
        return transformErrors(parsed);
      }
    } catch {
      // Не JSON, возвращаем как общую ошибку
      return { _error: grpcError.message };
    }
  }

  return {};
}

/**
 * Проверяет, есть ли ошибки в объекте
 */
export function hasErrors(errors: FormErrors): boolean {
  return Object.keys(errors).length > 0;
}

/**
 * Получает первую ошибку из объекта
 */
export function getFirstError(errors: FormErrors): string | undefined {
  const keys = Object.keys(errors);
  return keys.length > 0 ? errors[keys[0]] : undefined;
}
