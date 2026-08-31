"use client";

import Link from "next/link";
import { useActionState } from "react";

import { Field, FormError, SubmitButton } from "@/components/forms/field";
import { signInForm } from "@/lib/actions/forms";

export function LoginForm({ next, notice }: { next?: string; notice?: string }) {
  const [state, action] = useActionState(signInForm, null);

  const fieldErrors = state && !state.ok ? state.fieldErrors : undefined;
  const error = state && !state.ok ? state.error : notice;

  return (
    <form action={action} className="grid gap-5" noValidate>
      {next ? <input type="hidden" name="next" value={next} /> : null}

      <FormError message={error} />

      <Field
        name="email"
        label="E-mail"
        type="email"
        autoComplete="email"
        placeholder="voce@exemplo.com"
        required
        error={fieldErrors?.email}
      />

      <Field
        name="password"
        label="Senha"
        type="password"
        autoComplete="current-password"
        required
        error={fieldErrors?.password}
      />

      <SubmitButton className="mt-1 w-full" pendingLabel="Entrando…">
        Entrar
      </SubmitButton>

      <p className="text-center text-sm text-muted-foreground">
        Ainda não tem conta?{" "}
        <Link
          href="/signup"
          className="font-medium text-foreground underline underline-offset-4 hover:text-primary"
        >
          Criar conta
        </Link>
      </p>
    </form>
  );
}
