import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * Server-side client that carries the *caller's* session (anon key + JWT
 * cookie), so every query still goes through Postgres RLS as that user.
 * Never use the service-role key here — that would bypass tenant isolation.
 */
export function createClient() {
  const cookieStore = cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options) {
          try {
            cookieStore.set({ name, value, ...options });
          } catch {
            // called from a Server Component — safe to ignore, middleware refreshes it
          }
        },
        remove(name: string, options) {
          try {
            cookieStore.set({ name, value: "", ...options });
          } catch {
            // same as above
          }
        },
      },
    }
  );
}
