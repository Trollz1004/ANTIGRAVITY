/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_PAPERCLIP_URL: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
