import publicConfig from "../config/public-client.json";

/** Only public browser connection settings belong in this fallback. */
export function resolvePublicClientEnv(env: Record<string, string | undefined>) {
  return {
    VITE_SUPABASE_URL: env.VITE_SUPABASE_URL?.trim() || publicConfig.url,
    VITE_SUPABASE_PUBLISHABLE_KEY:
      env.VITE_SUPABASE_PUBLISHABLE_KEY?.trim() || publicConfig.publishableKey,
  };
}