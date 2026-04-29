/// <reference types="vite/client" />
/// <reference types="vite-plugin-vue-layouts-next/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL: string
  readonly VITE_DEFAULT_LOCALE: string
  readonly VITE_LAYOUT: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
