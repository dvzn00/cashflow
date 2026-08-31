import { NextResponse, type NextRequest } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";

import { createClient } from "@/lib/supabase/server";

/**
 * Lands the confirmation link from the signup e-mail.
 *
 * Supabase sends one of two shapes depending on the project's e-mail template:
 * `?code=` for the PKCE flow (the default when the client is @supabase/ssr),
 * and `?token_hash=&type=` for templates using `{{ .TokenHash }}`. Both are
 * handled, so switching the template later does not break the link.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;

  const code = searchParams.get("code");
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;

  // Only same-site paths, so the link cannot be repointed at another host.
  const requestedNext = searchParams.get("next") ?? "/onboarding";
  const next = requestedNext.startsWith("/") ? requestedNext : "/onboarding";

  const supabase = await createClient();

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(new URL(next, origin));

    return NextResponse.redirect(
      new URL(`/login?erro=${encodeURIComponent(error.message)}`, origin),
    );
  }

  if (tokenHash && type) {
    const { error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash });
    if (!error) return NextResponse.redirect(new URL(next, origin));

    return NextResponse.redirect(
      new URL(`/login?erro=${encodeURIComponent(error.message)}`, origin),
    );
  }

  return NextResponse.redirect(
    new URL("/login?erro=Link%20de%20confirma%C3%A7%C3%A3o%20inv%C3%A1lido.", origin),
  );
}
