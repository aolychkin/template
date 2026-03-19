/**
 * JWT утилиты
 * 
 * Декодирование и проверка токенов
 */

interface JWTPayload {
  user_id: string;
  email: string;
  role: string;
  exp: number;
  iat: number;
}

export const decodeJWT = (token: string): JWTPayload | null => {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) {
      return null;
    }

    const payload = parts[1];
    const decoded = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
    return JSON.parse(decoded) as JWTPayload;
  } catch (error) {
    console.error('Failed to decode JWT:', error);
    return null;
  }
};

export const isTokenExpired = (token: string): boolean => {
  const payload = decodeJWT(token);
  if (!payload || !payload.exp) {
    return true;
  }

  const now = Math.floor(Date.now() / 1000);
  return payload.exp <= now;
};

export const isTokenExpiringSoon = (token: string, thresholdSeconds: number = 60): boolean => {
  const payload = decodeJWT(token);
  if (!payload || !payload.exp) {
    return true;
  }

  const now = Math.floor(Date.now() / 1000);
  return payload.exp - now <= thresholdSeconds;
};
