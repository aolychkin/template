/**
 * Конфигурация приложения
 * 
 * Централизованная конфигурация с валидацией
 */

type Environment = 'development' | 'stage' | 'production';

interface Config {
  env: Environment;
  grpcHost: string;
  enableMockData: boolean;
  enableDebugLogs: boolean;
  enableDevtools: boolean;
  isProduction: boolean;
  isStage: boolean;
  isLocal: boolean;
}

const getEnv = (): Environment => {
  const env = import.meta.env.VITE_ENV as Environment;
  if (!['development', 'stage', 'production'].includes(env)) {
    console.warn(`Invalid VITE_ENV: ${env}, defaulting to development`);
    return 'development';
  }
  return env;
};

const getBooleanEnv = (key: string, defaultValue: boolean): boolean => {
  const value = import.meta.env[key];
  if (value === undefined) return defaultValue;
  return value === 'true' || value === true;
};

const env = getEnv();

export const config: Config = {
  env,
  grpcHost: import.meta.env.VITE_GRPC_HOST || 'http://localhost:44044',
  enableMockData: getBooleanEnv('VITE_ENABLE_MOCK_DATA', env !== 'production'),
  enableDebugLogs: getBooleanEnv('VITE_ENABLE_DEBUG_LOGS', env === 'development'),
  enableDevtools: getBooleanEnv('VITE_ENABLE_DEVTOOLS', env === 'development'),
  isProduction: env === 'production',
  isStage: env === 'stage',
  isLocal: env === 'development',
};

// Валидация конфигурации
if (!config.grpcHost) {
  throw new Error('VITE_GRPC_HOST is required');
}

if (config.isProduction && config.enableMockData) {
  throw new Error('Mock data cannot be enabled in production');
}

if (config.isProduction && !config.grpcHost.startsWith('https://')) {
  throw new Error('Production must use HTTPS');
}

// Реэкспорт стилей
export * from './styles';
