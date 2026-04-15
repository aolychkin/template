/**
 * gRPC-Web Client
 * 
 * Production-ready клиент с:
 * - Retry с exponential backoff
 * - Circuit breaker
 * - Auto token refresh
 * - Request timeout
 * - Security: whitelist services/methods
 */
import { config } from 'shared/config';
import { debugLog, debugError } from 'shared/lib/debug';
import { withRetry } from 'shared/lib/retry';
import { grpcCircuitBreaker } from 'shared/lib/circuit-breaker';
import type {
  LoginRequest as LoginRequestType,
  LoginResponse as LoginResponseType,
  RegisterRequest as RegisterRequestType,
  RegisterResponse as RegisterResponseType,
  RefreshTokenRequest as RefreshTokenRequestType,
  RefreshTokenResponse as RefreshTokenResponseType,
  LogoutRequest as LogoutRequestType,
  LogoutResponse as LogoutResponseType,
  SaveProgressRequest as SaveProgressRequestType,
  SaveProgressResponse as SaveProgressResponseType,
  GetProgressRequest as GetProgressRequestType,
  GetProgressResponse as GetProgressResponseType,
} from 'shared/api/generated/auth/auth_pb.d';
import type {
  GetProfileRequest as GetProfileRequestType,
  GetProfileResponse as GetProfileResponseType,
  UpdateProfileRequest as UpdateProfileRequestType,
  UpdateProfileResponse as UpdateProfileResponseType,
  DeleteAccountRequest as DeleteAccountRequestType,
  DeleteAccountResponse as DeleteAccountResponseType,
  ListUsersRequest as ListUsersRequestType,
  ListUsersResponse as ListUsersResponseType,
} from 'shared/api/generated/user/user_pb.d';
import type {
  GetDashboardStatsRequest as GetDashboardStatsRequestType,
  GetDashboardStatsResponse as GetDashboardStatsResponseType,
} from 'shared/api/generated/admin/admin_pb.d';

const GRPC_HOST = config.grpcHost;
const MAX_MESSAGE_SIZE = 10 * 1024 * 1024; // 10MB
const REQUEST_TIMEOUT = 8000; // 8s

// === SERVICES ===
const AUTH_SERVICE = 'auth.AuthService';
const USER_SERVICE = 'user.UserService';
const ADMIN_SERVICE = 'admin.AdminService';

const ALLOWED_SERVICES = new Set([AUTH_SERVICE, USER_SERVICE, ADMIN_SERVICE]);

// === METHODS ===
const METHODS = {
  // Auth
  REGISTER: 'Register',
  LOGIN: 'Login',
  LOGOUT: 'Logout',
  REFRESH_TOKEN: 'RefreshToken',
  SAVE_REGISTRATION_PROGRESS: 'SaveRegistrationProgress',
  GET_REGISTRATION_PROGRESS: 'GetRegistrationProgress',
  // User
  GET_PROFILE: 'GetProfile',
  UPDATE_PROFILE: 'UpdateProfile',
  DELETE_ACCOUNT: 'DeleteAccount',
  LIST_USERS: 'ListUsers',
  // Admin
  GET_DASHBOARD_STATS: 'GetDashboardStats',
} as const;

const ALLOWED_METHODS = new Set(Object.values(METHODS));
type AllowedMethod = typeof METHODS[keyof typeof METHODS];

// Публичные методы (не требуют авторизации)
const PUBLIC_METHODS: AllowedMethod[] = [
  METHODS.LOGIN,
  METHODS.REGISTER,
  METHODS.REFRESH_TOKEN,
  METHODS.SAVE_REGISTRATION_PROGRESS,
  METHODS.GET_REGISTRATION_PROGRESS,
];

// === GRPC FRAME UTILS ===

function createGrpcFrame(serializedRequest: Uint8Array): Uint8Array {
  const messageLength = serializedRequest.length;
  if (messageLength > MAX_MESSAGE_SIZE) {
    throw new Error('Message size limit exceeded');
  }

  const frame = new Uint8Array(5 + messageLength);
  frame[0] = 0;
  frame[1] = (messageLength >> 24) & 0xff;
  frame[2] = (messageLength >> 16) & 0xff;
  frame[3] = (messageLength >> 8) & 0xff;
  frame[4] = messageLength & 0xff;
  frame.set(serializedRequest, 5);

  return frame;
}

function readInt32BigEndian(bytes: Uint8Array, offset: number): number {
  if (offset + 4 > bytes.length) throw new Error('Invalid data format');
  return (bytes[offset] << 24) | (bytes[offset + 1] << 16) | (bytes[offset + 2] << 8) | bytes[offset + 3];
}

function parseGrpcFrame(uint8Array: Uint8Array): Uint8Array | null {
  if (!uint8Array || uint8Array.length === 0) throw new Error('Invalid data format');

  let offset = 0;
  while (offset < uint8Array.length) {
    if (offset + 5 > uint8Array.length) break;

    const length = readInt32BigEndian(uint8Array, offset + 1);
    if (length < 0 || length > MAX_MESSAGE_SIZE || offset + 5 + length > uint8Array.length) {
      throw new Error('Invalid message format');
    }

    if (uint8Array[offset] === 0) {
      return uint8Array.slice(offset + 5, offset + 5 + length);
    }

    offset += 5 + length;
  }
  return null;
}

// === GRPC STATUS CODES ===
// https://grpc.github.io/grpc/core/md_doc_statuscodes.html

export const GrpcCodes = {
  OK: 0,
  CANCELLED: 1,
  UNKNOWN: 2,
  INVALID_ARGUMENT: 3,
  DEADLINE_EXCEEDED: 4,
  NOT_FOUND: 5,
  ALREADY_EXISTS: 6,
  PERMISSION_DENIED: 7,
  RESOURCE_EXHAUSTED: 8,
  FAILED_PRECONDITION: 9,
  ABORTED: 10,
  OUT_OF_RANGE: 11,
  UNIMPLEMENTED: 12,
  INTERNAL: 13,
  UNAVAILABLE: 14,
  DATA_LOSS: 15,
  UNAUTHENTICATED: 16,
} as const;

export type GrpcCode = typeof GrpcCodes[keyof typeof GrpcCodes];

// === GRPC ERROR ===

export class GrpcError extends Error {
  public code: number;
  public requestId?: string;

  constructor(code: number, message?: string, requestId?: string) {
    super(message || 'gRPC error');
    this.code = code;
    this.requestId = requestId;
    this.name = 'GrpcError';
    Object.setPrototypeOf(this, GrpcError.prototype);
  }
}

// === HEADERS ===

const GRPC_HEADERS = {
  'Content-Type': 'application/grpc-web+proto',
  'Accept': 'application/grpc-web+proto',
};

// Получение токена из cookies (избегаем циклической зависимости с auth модулем)
import { getCookie } from 'shared/lib/cookies';
import { ACCESS_TOKEN_COOKIE } from 'shared/lib/auth/constants';

function getAccessToken(): string | null {
  try {
    return getCookie(ACCESS_TOKEN_COOKIE) || null;
  } catch {
    return null;
  }
}

// === MAIN GRPC CALL ===

interface GrpcRequest {
  serializeBinary(): Uint8Array;
}

interface GrpcResponseClass<T> {
  deserializeBinary(bytes: Uint8Array): T;
}

async function grpcCall<TReq extends GrpcRequest, TRes>(
  service: string,
  method: AllowedMethod,
  request: TReq,
  ResponseClass: GrpcResponseClass<TRes>
): Promise<TRes> {
  if (!ALLOWED_SERVICES.has(service)) throw new Error('Invalid service');
  if (!ALLOWED_METHODS.has(method)) throw new Error('Invalid method');
  if (!request?.serializeBinary) throw new Error('Invalid request');

  // Auto refresh token для защищённых методов
  if (!PUBLIC_METHODS.includes(method)) {
    try {
      const { refreshTokenIfNeeded } = await import('shared/lib/auth/refresh-interceptor');
      const refreshed = await refreshTokenIfNeeded();
      if (!refreshed) {
        throw new GrpcError(GrpcCodes.UNAUTHENTICATED, 'Authentication required');
      }
    } catch (refreshError) {
      debugError('Token refresh failed:', refreshError);
      throw new GrpcError(GrpcCodes.UNAUTHENTICATED, 'Authentication required');
    }
  }

  return withRetry(async () => {
    return grpcCircuitBreaker.execute(async () => {
      return performGrpcCall<TReq, TRes>(service, method, request, ResponseClass);
    });
  });
}

async function performGrpcCall<TReq extends GrpcRequest, TRes>(
  service: string,
  method: AllowedMethod,
  request: TReq,
  ResponseClass: GrpcResponseClass<TRes>
): Promise<TRes> {
  const url = `${GRPC_HOST}/${service}/${method}`;

  let serialized: Uint8Array;
  try {
    serialized = request.serializeBinary();
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Unknown error';
    throw new GrpcError(400, `Failed to serialize request: ${msg}`);
  }

  let frame: Uint8Array;
  try {
    frame = createGrpcFrame(serialized);
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Unknown error';
    throw new GrpcError(400, `Failed to create gRPC frame: ${msg}`);
  }

  const headers: Record<string, string> = { ...GRPC_HEADERS };
  const token = getAccessToken();
  if (token) headers['authorization'] = `Bearer ${token}`;

  if (config.enableDebugLogs) {
    debugLog(`🔌 gRPC call: ${service}/${method}`);
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);

  const response = await fetch(url, {
    method: 'POST',
    mode: 'cors',
    headers,
    body: frame as BodyInit,
    signal: controller.signal,
  }).catch((e: unknown) => {
    clearTimeout(timeoutId);
    if (e instanceof Error && e.name === 'AbortError') {
      throw new GrpcError(0, 'Request timeout');
    }
    debugError('Network error:', e);
    throw new GrpcError(0, 'Network error');
  }).finally(() => clearTimeout(timeoutId));

  const requestId = response.headers.get('x-request-id') || undefined;

  if (!response.ok) {
    throw new GrpcError(response.status, response.statusText || 'Request failed', requestId);
  }

  const data = await response.arrayBuffer().catch(() => {
    throw new GrpcError(500, 'Failed to read response');
  });

  const grpcStatus = response.headers.get('grpc-status');
  const grpcMessage = response.headers.get('grpc-message');

  // Логируем размер ответа и статус
  if (config.enableDebugLogs) {
    debugLog(`📦 Response size: ${data.byteLength} bytes, status: ${response.status}`);
  }

  if (grpcStatus && grpcStatus !== '0') {
    const decodedMessage = grpcMessage ? decodeURIComponent(grpcMessage) : 'Unknown error';
    throw new GrpcError(parseInt(grpcStatus), decodedMessage, requestId);
  }

  if (!data || data.byteLength === 0) {
    if (grpcStatus === '0') {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return {} as any as TRes;
    }
    throw new GrpcError(500, 'Empty response data', requestId);
  }

  let messageBytes: Uint8Array | null;
  try {
    messageBytes = parseGrpcFrame(new Uint8Array(data));
  } catch {
    throw new GrpcError(500, 'Failed to parse response frame', requestId);
  }

  if (!messageBytes) {
    throw new GrpcError(500, 'Invalid response frame', requestId);
  }

  try {
    return ResponseClass.deserializeBinary(messageBytes);
  } catch {
    throw new GrpcError(500, 'Failed to deserialize response', requestId);
  }
}

// === RESPONSE CLASS CACHE ===

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const authResponseCache: Record<string, any> = {};
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const userResponseCache: Record<string, any> = {};
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const adminResponseCache: Record<string, any> = {};

const getAuthResponseClass = async <T>(className: string): Promise<GrpcResponseClass<T>> => {
  if (!authResponseCache[className]) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const module = await import('shared/api/generated/auth/auth_pb_wrapper') as any;
    authResponseCache[className] = module[className];
  }
  return authResponseCache[className];
};

const getUserResponseClass = async <T>(className: string): Promise<GrpcResponseClass<T>> => {
  if (!userResponseCache[className]) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const module = await import('shared/api/generated/user/user_pb_wrapper') as any;
    userResponseCache[className] = module[className];
  }
  return userResponseCache[className];
};

const getAdminResponseClass = async <T>(className: string): Promise<GrpcResponseClass<T>> => {
  if (!adminResponseCache[className]) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const module = await import('shared/api/generated/admin/admin_pb_wrapper') as any;
    adminResponseCache[className] = module[className];
  }
  return adminResponseCache[className];
};

// === EXPORTED CLIENT ===

export const grpcClient = {
  auth: {
    login: async (request: LoginRequestType): Promise<LoginResponseType> => {
      const ResponseClass = await getAuthResponseClass<LoginResponseType>('LoginResponse');
      return grpcCall(AUTH_SERVICE, METHODS.LOGIN, request, ResponseClass);
    },
    register: async (request: RegisterRequestType): Promise<RegisterResponseType> => {
      const ResponseClass = await getAuthResponseClass<RegisterResponseType>('RegisterResponse');
      return grpcCall(AUTH_SERVICE, METHODS.REGISTER, request, ResponseClass);
    },
    logout: async (request: LogoutRequestType): Promise<LogoutResponseType> => {
      const ResponseClass = await getAuthResponseClass<LogoutResponseType>('LogoutResponse');
      return grpcCall(AUTH_SERVICE, METHODS.LOGOUT, request, ResponseClass);
    },
    refreshToken: async (request: RefreshTokenRequestType): Promise<RefreshTokenResponseType> => {
      const ResponseClass = await getAuthResponseClass<RefreshTokenResponseType>('RefreshTokenResponse');
      return grpcCall(AUTH_SERVICE, METHODS.REFRESH_TOKEN, request, ResponseClass);
    },
    saveRegistrationProgress: async (request: SaveProgressRequestType): Promise<SaveProgressResponseType> => {
      const ResponseClass = await getAuthResponseClass<SaveProgressResponseType>('SaveProgressResponse');
      return grpcCall(AUTH_SERVICE, METHODS.SAVE_REGISTRATION_PROGRESS, request, ResponseClass);
    },
    getRegistrationProgress: async (request: GetProgressRequestType): Promise<GetProgressResponseType> => {
      const ResponseClass = await getAuthResponseClass<GetProgressResponseType>('GetProgressResponse');
      return grpcCall(AUTH_SERVICE, METHODS.GET_REGISTRATION_PROGRESS, request, ResponseClass);
    },
  },
  user: {
    getProfile: async (request: GetProfileRequestType): Promise<GetProfileResponseType> => {
      const ResponseClass = await getUserResponseClass<GetProfileResponseType>('GetProfileResponse');
      return grpcCall(USER_SERVICE, METHODS.GET_PROFILE, request, ResponseClass);
    },
    updateProfile: async (request: UpdateProfileRequestType): Promise<UpdateProfileResponseType> => {
      const ResponseClass = await getUserResponseClass<UpdateProfileResponseType>('UpdateProfileResponse');
      return grpcCall(USER_SERVICE, METHODS.UPDATE_PROFILE, request, ResponseClass);
    },
    deleteAccount: async (request: DeleteAccountRequestType): Promise<DeleteAccountResponseType> => {
      const ResponseClass = await getUserResponseClass<DeleteAccountResponseType>('DeleteAccountResponse');
      return grpcCall(USER_SERVICE, METHODS.DELETE_ACCOUNT, request, ResponseClass);
    },
    listUsers: async (request: ListUsersRequestType): Promise<ListUsersResponseType> => {
      const ResponseClass = await getUserResponseClass<ListUsersResponseType>('ListUsersResponse');
      return grpcCall(USER_SERVICE, METHODS.LIST_USERS, request, ResponseClass);
    },
  },
  admin: {
    getDashboardStats: async (request: GetDashboardStatsRequestType): Promise<GetDashboardStatsResponseType> => {
      const ResponseClass = await getAdminResponseClass<GetDashboardStatsResponseType>('GetDashboardStatsResponse');
      return grpcCall(ADMIN_SERVICE, METHODS.GET_DASHBOARD_STATS, request, ResponseClass);
    },
  },
};
