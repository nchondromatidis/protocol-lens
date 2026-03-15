/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_APP_TITLE?: string;
  // add your own vars here
  VITE_LOG_LEVEL: 'TRACE' | 'DEBUG' | 'INFO' | 'WARN' | 'ERROR';
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
