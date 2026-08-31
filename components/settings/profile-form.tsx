"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import { Field, FormError, SubmitButton } from "@/components/forms/field";
import { updateProfileForm, type FormState } from "@/lib/actions/forms";

export function ProfileForm({
  fullName,
  email,
}: {
  fullName: string;
  email: string;
}) {
  const router = useRouter();
  const [state, setState] = useState<FormState<unknown>>(null);

  async function handleSubmit(formData: FormData) {
    const result = await updateProfileForm(null, formData);
    setState(result);

    if (result?.ok) {
      toast.success("Perfil atualizado.");
      router.refresh();
    }
  }

  const fieldErrors = state && !state.ok ? state.fieldErrors : undefined;

  return (
    <form action={handleSubmit} className="grid max-w-sm gap-4" noValidate>
      <FormError message={state && !state.ok ? state.error : undefined} />

      <Field
        name="full_name"
        label="Nome"
        defaultValue={fullName}
        maxLength={80}
        required
        error={fieldErrors?.full_name}
      />

      <div className="grid gap-1.5">
        <span className="text-sm font-medium">E-mail</span>
        <p className="rounded-md border border-border bg-surface px-3 py-2 text-sm">
          {email}
        </p>
        <p className="text-xs text-muted-foreground">
          O e-mail é a sua identificação de acesso e não pode ser alterado aqui.
        </p>
      </div>

      <SubmitButton className="justify-self-start" pendingLabel="Salvando…">
        Salvar perfil
      </SubmitButton>
    </form>
  );
}
