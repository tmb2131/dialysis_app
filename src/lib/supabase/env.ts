/**
 * `supabase start` (local) API URL. Used only when `NODE_ENV` is
 * `development` and no URL is configured.
 * @see https://supabase.com/docs/guides/local-development
 */
const LOCAL_DEV_SUPABASE_URL = "http://127.0.0.1:54321";

/**
 * Default anon JWT for local Supabase (`supabase start`). Safe for local
 * only — never a production secret.
 * @see https://supabase.com/docs/guides/local-development#access-your-local-website
 */
const LOCAL_DEV_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0";

const trim = (s: string | undefined) => s?.trim() || undefined;

function useLocalSupabaseStackInDev(): boolean {
  const v = trim(process.env.SUPABASE_USE_LOCAL_DEV);
  return v === "1" || v === "true";
}

/**
 * API URL. Accepts `NEXT_PUBLIC_SUPABASE_URL` or the server-side name
 * `SUPABASE_URL` (common in CI and Supabase templates).
 *
 * In development, the hosted project (e.g. production) is the default: you must
 * set URL and key in `.env.local` unless you opt into local `supabase start`
 * with `SUPABASE_USE_LOCAL_DEV=1`.
 */
export function getSupabaseUrl(): string {
  const u =
    trim(process.env.NEXT_PUBLIC_SUPABASE_URL) || trim(process.env.SUPABASE_URL);
  if (u) return u;
  if (process.env.NODE_ENV === "development" && useLocalSupabaseStackInDev()) {
    return LOCAL_DEV_SUPABASE_URL;
  }
  throw new Error(
    "Missing Supabase URL. Set NEXT_PUBLIC_SUPABASE_URL (or SUPABASE_URL) in your environment " +
      "(use the same project as production for local dev, or set SUPABASE_USE_LOCAL_DEV=1 for local `supabase start` " +
      `at ${LOCAL_DEV_SUPABASE_URL}).`,
  );
}

/**
 * Returns the Supabase client API key. Accepts the publishable or anon
 * key under either `NEXT_PUBLIC_*` (browser) or `SUPABASE_*` (CI / server).
 */
export function getSupabaseKey(): string {
  const key =
    trim(process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY) ||
    trim(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) ||
    trim(process.env.SUPABASE_PUBLISHABLE_KEY) ||
    trim(process.env.SUPABASE_ANON_KEY);
  if (key) return key;
  if (process.env.NODE_ENV === "development" && useLocalSupabaseStackInDev()) {
    return LOCAL_DEV_ANON_KEY;
  }
  throw new Error(
    "Missing Supabase client key. Set one of: NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY, " +
      "NEXT_PUBLIC_SUPABASE_ANON_KEY, SUPABASE_PUBLISHABLE_KEY, or SUPABASE_ANON_KEY " +
      "(same values as production for local dev). For local `supabase start` only, set " +
      "SUPABASE_USE_LOCAL_DEV=1 to use the bundled local demo anon key.",
  );
}
