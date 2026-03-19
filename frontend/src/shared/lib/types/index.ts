/**
 * Utility Types для gRPC API
 * 
 * Стандартизированные типы для ответов и запросов
 */

// Ответ с одним элементом
export type ItemResponse<T> = {
  item: T;
};

// Ответ со списком элементов
export type ItemsResponse<T> = {
  items: T[];
};

// Пагинированный ответ
export type PaginatedResponse<T> = {
  items: T[];
  page: number;
  limit: number;
  total: number;
  hasMore?: boolean;
};

// Запрос с пагинацией
export type PaginatedRequest = {
  page: number;
  limit: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
};

// Maybe type для nullable значений
export type Maybe<T> = T | null | undefined;

// ValueOf для получения типа значений объекта
export type ValueOf<T> = T[keyof T];

// Dictionary item для справочников
export type DictionaryItem<T = number> = {
  id: T;
  name: string;
};

// Ошибки формы (поле -> сообщение)
export type FormErrors = Record<string, string>;

// gRPC статусы
export type GrpcStatus =
  | 'OK'
  | 'CANCELLED'
  | 'UNKNOWN'
  | 'INVALID_ARGUMENT'
  | 'DEADLINE_EXCEEDED'
  | 'NOT_FOUND'
  | 'ALREADY_EXISTS'
  | 'PERMISSION_DENIED'
  | 'RESOURCE_EXHAUSTED'
  | 'FAILED_PRECONDITION'
  | 'ABORTED'
  | 'OUT_OF_RANGE'
  | 'UNIMPLEMENTED'
  | 'INTERNAL'
  | 'UNAVAILABLE'
  | 'DATA_LOSS'
  | 'UNAUTHENTICATED';
