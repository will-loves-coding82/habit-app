import { createBrowserClient } from "@supabase/ssr";

/**
 * Creates a Supabase client instance for browser usage.
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
