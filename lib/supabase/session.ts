import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

import { getSupabaseEnv } from "@/lib/env";
import type { Database } from "@/types/database";

/** Routes reachable without a session. Everything else requires auth. */
const PUBLIC_ROUTES = ["/login", "/signup", "/auth"];

function isPublicRoute(pathname: string) {
  return PUBLIC_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`),
  );
}

/** Refreshes the Supabase session cookie and gates the dashboard routes. */
export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  const { url, publishableKey } = getSupabaseEnv();

  const supabase = createServerClient<Database>(url, publishableKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        for (const { name, value } of cookiesToSet) {
          request.cookies.set(name, value);
        }
        response = NextResponse.next({ request });
        for (const { name, value, options } of cookiesToSet) {
          response.cookies.set(name, value, options);
        }
      },
    },
  });

  // Do not put code between createServerClient and getUser: an early return
  // here would ship a stale session cookie to the browser.
  // A rejected call means Supabase is unreachable — treat as anonymous.
  const { data } = await supabase.auth
    .getUser()
    .catch(() => ({ data: { user: null } }));
  const user = data.user;

  const { pathname, search } = request.nextUrl;

  if (!user && !isPublicRoute(pathname)) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/login";
    loginUrl.search = "";
    if (pathname !== "/") {
      loginUrl.searchParams.set("next", `${pathname}${search}`);
    }
    return NextResponse.redirect(loginUrl);
  }

  if (user && (pathname === "/login" || pathname === "/signup")) {
    const homeUrl = request.nextUrl.clone();
    homeUrl.pathname = "/";
    homeUrl.search = "";
    return NextResponse.redirect(homeUrl);
  }

  return response;
}
