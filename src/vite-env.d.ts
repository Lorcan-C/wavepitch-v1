/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_CLERK_PUBLISHABLE_KEY: string
  readonly VITE_LANGFUSE_PUBLIC_KEY: string
  readonly VITE_LANGFUSE_SECRET_KEY: string
  readonly VITE_LANGFUSE_BASEURL: string
  readonly VITE_OPENAI_API_KEY: string
  readonly VITE_PERPLEXITY_API_KEY: string
  readonly VITE_SUPABASE_URL: string
  readonly VITE_SUPABASE_ANON_KEY: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}