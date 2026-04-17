/**
 * Returns the Supabase client-side API key. Accepts either
 * NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY (newer, sb_publishable_…) or
 * NEXT_PUBLIC_SUPABASE_ANON_KEY (legacy JWT).
 */
export function getSupabaseKey(): string {
  const key =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!key) {
    throw new Error(
      "Missing Supabase client key. Set NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY " +
        "(or NEXT_PUBLIC_SUPABASE_ANON_KEY) in your environment.",
    );
  }
  return key;
}
