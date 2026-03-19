// Префикс из env для изоляции cookies между проектами на одном домене
const APP_PREFIX = import.meta.env.VITE_APP_NAME || 'app';

export const ACCESS_TOKEN_COOKIE = `${APP_PREFIX}_access_token`;
export const REFRESH_TOKEN_COOKIE = `${APP_PREFIX}_refresh_token`;
