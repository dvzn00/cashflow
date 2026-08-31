import "server-only";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import type { PostgrestError } from "@supabase/supabase-js";
import type { ZodError } from "zod";

import { createClient } from "@/lib/supabase/server";

/**
 * Every action starts here. Bounces to /login rather than returning an error,
 * because a missing session is a navigation problem, not a form problem.
 */
export async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  return { supabase, user };
}

/** Turns a Zod failure into `{ campo: mensagem }` for the form to render. */
export function fieldErrorsFrom(error: ZodError): Record<string, string> {
  const fields: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path.join(".") || "form";
    fields[key] ??= issue.message;
  }
  return fields;
}

/**
 * Postgres error codes into messages a person can act on. The constraint names
 * come from the migration, so a rename there must be reflected here.
 */
export function messageFromPostgrest(
  error: PostgrestError,
  fallback: string,
): string {
  switch (error.code) {
    case "23505":
      if (error.message.includes("categories_user_name_key")) {
        return "Você já tem uma categoria com esse nome.";
      }
      if (error.message.includes("budgets_unique_per_month")) {
        return "Já existe um orçamento para essa categoria neste mês.";
      }
      return "Esse registro já existe.";

    case "23503":
      if (error.message.includes("transactions_category_fkey")) {
        return "Categoria não encontrada. Atualize a página e tente de novo.";
      }
      return "Não foi possível concluir: há registros ligados a este item.";

    case "23514":
      if (error.message.includes("amount_positive")) {
        return "O valor deve ser maior que zero.";
      }
      if (error.message.includes("budgets_month_is_first_day")) {
        return "O orçamento precisa começar no primeiro dia do mês.";
      }
      return "Algum campo está fora do formato esperado.";

    case "42501":
      return "Você não tem permissão para alterar este registro.";

    default:
      return fallback;
  }
}

/** Screens that show money. Every mutation invalidates all of them. */
const MONEY_PATHS = ["/", "/transactions", "/reports", "/settings"] as const;

export function revalidateMoneyViews() {
  for (const path of MONEY_PATHS) {
    revalidatePath(path);
  }
}
