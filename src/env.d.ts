/// <reference types="vite/client" />

// Ensure import.meta.env is typed (Vite provides this; fallback for strict builds)
interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string
  readonly VITE_SUPABASE_ANON_KEY: string
  readonly VITE_MAPBOX_ACCESS_TOKEN: string
  readonly VITE_BACKEND_URL: string
  readonly DEV: boolean
  readonly MODE: string
  readonly PROD: boolean
  readonly SSR: boolean
  readonly BASE_URL: string
}
interface ImportMeta {
  readonly env: ImportMetaEnv
}
