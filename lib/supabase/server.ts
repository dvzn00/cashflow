import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

import { getSupabaseEnv, isSupabaseConfigured } from "@/lib/env";
import type { Database } from "@/types/database";

/**
 * Supabase client for Server Components, Server Actions and Route Handlers.
 * Always create a fresh one per request — never hoist it to a module global.
 */
export async function createClient() {
  const { url, publishableKey } = getSupabaseEnv();
  const cookieStore = await cookies();

  return createServerClient<Database>(url, publishableKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          for (const { name, value, options } of cookiesToSet) {
            cookieStore.set(name, value, options);
          }
        } catch {
          // Called from a Server Component: the proxy refreshes the session
          // cookies instead, so this is safe to ignore.
        }
      },
    },
  });
}

/**
 * The signed-in user, or null. Also null when Supabase has no credentials yet,
 * so the app shows a setup notice instead of crashing.
 */
export async function getUser() {
  if (!isSupabaseConfigured()) return null;

  const supabase = await createClient();
  const { data } = await supabase.auth
    .getUser()
    .catch(() => ({ data: { user: null } }));

  return data.user;
}
