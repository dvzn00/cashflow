import { AlertTriangle } from "lucide-react";

import { isSupabaseConfigured } from "@/lib/env";

export const metadata = { title: "Entrar" };

export default function LoginPage() {
  return (
    <div>
      <h1 className="display text-3xl leading-none">Entrar</h1>
      <p className="mt-3 text-sm text-muted-foreground">
        O formulário de acesso entra no Bloco 5.
      </p>

      {isSupabaseConfigured() ? null : (
        <div
          role="status"
          className="mt-6 flex gap-3 rounded-lg border border-border bg-surface p-4 text-sm"
        >
          <AlertTriangle
            className="mt-0.5 size-4 shrink-0 text-warning"
            aria-hidden
          />
          <p className="text-muted-foreground">
            Supabase ainda não configurado. Preencha{" "}
            <code className="rounded bg-card px-1 py-0.5 text-xs">
              NEXT_PUBLIC_SUPABASE_URL
            </code>{" "}
            e{" "}
            <code className="rounded bg-card px-1 py-0.5 text-xs">
              NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
            </code>{" "}
            em <code className="rounded bg-card px-1 py-0.5 text-xs">.env.local</code>.
          </p>
        </div>
      )}
    </div>
  );
}
