import { NextResponse, type NextRequest } from "next/server";

import { isSupabaseConfigured } from "@/lib/env";
import { updateSession } from "@/lib/supabase/session";

export default async function proxy(request: NextRequest) {
  // Without credentials there is no session to check; let the pages render
  // their own "configure Supabase" message instead of redirect-looping.
  if (!isSupabaseConfigured()) {
    return NextResponse.next({ request });
  }
  return updateSession(request);
}

export const config = {
  matcher: [
    /*
     * Every route except Next internals and static assets. Auth pages are
     * matched too, so signed-in users get bounced back to the dashboard.
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\.(?:svg|png|jpg|jpeg|gif|webp|ico|woff2?)$).*)",
  ],
};
