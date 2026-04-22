import type { NextConfig } from "next";

/**
 * So CI, Supabase tools, and server-only `SUPABASE_*` env names still resolve.
 * `src/lib/supabase/env.ts` also reads `SUPABASE_*` at runtime; this mirrors
 * them to `NEXT_PUBLIC_*` for Edge and any code that only sees the public names.
 */
const nextConfig: NextConfig = {
  env: {
    ...(!process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_URL
      ? { NEXT_PUBLIC_SUPABASE_URL: process.env.SUPABASE_URL }
      : {}),
    ...(!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY && process.env.SUPABASE_ANON_KEY
      ? { NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY }
      : {}),
    ...(!process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY && process.env.SUPABASE_PUBLISHABLE_KEY
      ? { NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: process.env.SUPABASE_PUBLISHABLE_KEY }
      : {}),
  },
  experimental: {
    serverActions: {
      bodySizeLimit: "2mb",
    },
  },
};

export default nextConfig;
