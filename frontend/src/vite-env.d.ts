/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_ENV: 'development' | 'stage' | 'production';
  readonly VITE_GRPC_HOST: string;
  readonly VITE_ENABLE_MOCK_DATA: string;
  readonly VITE_ENABLE_DEBUG_LOGS: string;
  readonly VITE_ENABLE_DEVTOOLS: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
