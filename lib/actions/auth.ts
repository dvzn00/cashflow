"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

import { fieldErrorsFrom } from "@/lib/actions/helpers";
import { failure, success, type ActionResult } from "@/lib/actions/types";
import { signInSchema, signUpSchema } from "@/lib/domain/schemas";
import { isSupabaseConfigured } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";

/**
 * Guard for the actions a signed-out visitor can reach. Without credentials
 * createClient() throws, and a Server Action that throws renders the generic
 * error page — which tells the person nothing and looks like the app is
 * broken. This turns a deployment mistake into a sentence they can act on.
 */
const NOT_CONFIGURED =
  "O aplicativo ainda não está conectado ao banco de dados. Se você é quem publicou, defina NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY nas variáveis de ambiente e publique de novo.";

/** Absolute origin of the current request, for the confirmation link. */
async function currentOrigin() {
  const headerList = await headers();
  const explicit = process.env.NEXT_PUBLIC_SITE_URL;
  if (explicit) return explicit.replace(/\/$/, "");

  const host = headerList.get("x-forwarded-host") ?? headerList.get("host");
  const protocol =
    headerList.get("x-forwarded-proto") ??
    (host?.startsWith("localhost") ? "http" : "https");

  return `${protocol}://${host}`;
}

export interface SignUpOutcome {
  /** False when the account needs the e-mail link before it can be used. */
  signedIn: boolean;
  email: string;
}

export async function signUp(
  input: unknown,
): Promise<ActionResult<SignUpOutcome>> {
  if (!isSupabaseConfigured()) return failure(NOT_CONFIGURED);

  const parsed = signUpSchema.safeParse(input);
  if (!parsed.success) {
    return failure("Revise os campos destacados.", fieldErrorsFrom(parsed.error));
  }

  const { full_name, email, password } = parsed.data;
  const supabase = await createClient();
  const origin = await currentOrigin();

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name },
      emailRedirectTo: `${origin}/auth/confirm?next=/onboarding`,
    },
  });

  if (error) {
    if (error.code === "user_already_exists" || error.code === "email_exists") {
      return failure("Já existe uma conta com esse e-mail.", {
        email: "Já existe uma conta com esse e-mail.",
      });
    }
    if (error.code === "weak_password") {
      return failure("Escolha uma senha mais forte.", {
        password: "Escolha uma senha mais forte.",
      });
    }
    if (error.code === "signup_disabled") {
      return failure("Cadastro desativado no momento.");
    }
    return failure(error.message || "Não foi possível criar a conta.");
  }

  // With e-mail confirmation on, Supabase returns the user but no session.
  const signedIn = Boolean(data.session);

  if (signedIn) {
    revalidatePath("/", "layout");
  }

  return success({ signedIn, email });
}

export async function signIn(input: unknown): Promise<ActionResult<undefined>> {
  if (!isSupabaseConfigured()) return failure(NOT_CONFIGURED);

  const parsed = signInSchema.safeParse(input);
  if (!parsed.success) {
    return failure("Revise os campos destacados.", fieldErrorsFrom(parsed.error));
  }

  const { email, password } = parsed.data;
  const supabase = await createClient();

  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    if (error.code === "email_not_confirmed") {
      return failure(
        "Confirme seu e-mail antes de entrar. Procure a mensagem que enviamos ao criar a conta.",
      );
    }
    if (error.code === "invalid_credentials") {
      return failure("E-mail ou senha incorretos.");
    }
    if (error.code === "over_request_rate_limit") {
      return failure("Muitas tentativas. Espere um minuto e tente de novo.");
    }
    return failure(error.message || "Não foi possível entrar.");
  }

  revalidatePath("/", "layout");
  return success();
}

/** Re-sends the confirmation e-mail for an account that never activated. */
export async function resendConfirmation(
  email: string,
): Promise<ActionResult<undefined>> {
  if (!isSupabaseConfigured()) return failure(NOT_CONFIGURED);

  const supabase = await createClient();
  const origin = await currentOrigin();

  const { error } = await supabase.auth.resend({
    type: "signup",
    email,
    options: { emailRedirectTo: `${origin}/auth/confirm?next=/onboarding` },
  });

  if (error) {
    if (error.code === "over_email_send_rate_limit") {
      return failure(
        "Limite de envios atingido. Espere alguns minutos antes de pedir outro e-mail.",
      );
    }
    return failure(error.message || "Não foi possível reenviar o e-mail.");
  }

  return success();
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/login");
}
