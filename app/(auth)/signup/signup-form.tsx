"use client";

import Link from "next/link";
import { useActionState, useState, useTransition } from "react";
import { MailCheck } from "lucide-react";

import { Field, FormError, SubmitButton } from "@/components/forms/field";
import { Button } from "@/components/ui/button";
import { resendConfirmation } from "@/lib/actions/auth";
import { signUpForm } from "@/lib/actions/forms";

export function SignupForm() {
  const [state, action] = useActionState(signUpForm, null);

  // Confirmation is on for this project, so the account exists but has no
  // session yet. Say what to do next instead of dropping the person on /login.
  if (state?.ok && !state.data.signedIn) {
    return <CheckInbox email={state.data.email} />;
  }

  const fieldErrors = state && !state.ok ? state.fieldErrors : undefined;

  return (
    <form action={action} className="grid gap-5" noValidate>
      <div>
        <h1 className="display text-3xl leading-none">Criar conta</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Leva menos de um minuto. Sem cartão, sem plano.
        </p>
      </div>

      <FormError message={state && !state.ok ? state.error : undefined} />

      <Field
        name="full_name"
        label="Nome"
        autoComplete="name"
        placeholder="Como você quer ser chamado"
        required
        error={fieldErrors?.full_name}
      />

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
        autoComplete="new-password"
        required
        hint="Pelo menos 8 caracteres."
        error={fieldErrors?.password}
      />

      <SubmitButton className="mt-1 w-full" pendingLabel="Criando conta…">
        Criar conta
      </SubmitButton>

      <p className="text-center text-sm text-muted-foreground">
        Já tem conta?{" "}
        <Link
          href="/login"
          className="font-medium text-foreground underline underline-offset-4 hover:text-primary"
        >
          Entrar
        </Link>
      </p>
    </form>
  );
}

function CheckInbox({ email }: { email: string }) {
  const [pending, start] = useTransition();
  const [message, setMessage] = useState<string | null>(null);

  return (
    <div>
      <span className="mb-5 flex size-11 items-center justify-center rounded-full bg-accent text-accent-foreground">
        <MailCheck className="size-5" aria-hidden />
      </span>

      <h1 className="display text-3xl leading-none">Confira sua caixa</h1>
      <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
        Enviamos um link de confirmação para{" "}
        <span className="font-medium text-foreground">{email}</span>. Clique nele
        para ativar a conta e entrar.
      </p>

      <div className="mt-6 grid gap-3">
        <Button
          variant="outline"
          disabled={pending}
          onClick={() =>
            start(async () => {
              const result = await resendConfirmation(email);
              setMessage(
                result.ok
                  ? "E-mail reenviado. Pode levar um minuto para chegar."
                  : result.error,
              );
            })
          }
        >
          {pending ? "Reenviando…" : "Reenviar e-mail"}
        </Button>

        {message ? (
          <p role="status" className="text-xs text-muted-foreground">
            {message}
          </p>
        ) : null}

        <Link
          href="/login"
          className="text-center text-sm text-muted-foreground underline underline-offset-4 hover:text-foreground"
        >
          Voltar para o login
        </Link>
      </div>
    </div>
  );
}
