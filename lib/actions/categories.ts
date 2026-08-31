"use server";

import {
  fieldErrorsFrom,
  messageFromPostgrest,
  requireUser,
  revalidateMoneyViews,
} from "@/lib/actions/helpers";
import { failure, success, type ActionResult } from "@/lib/actions/types";
import { categorySchema } from "@/lib/domain/schemas";
import type { CategoryRow } from "@/types/database";

export async function getCategories(): Promise<ActionResult<CategoryRow[]>> {
  const { supabase, user } = await requireUser();

  const { data, error } = await supabase
    .from("categories")
    .select("*")
    .eq("user_id", user.id)
    .order("name", { ascending: true })
    .returns<CategoryRow[]>();

  if (error) {
    return failure(
      messageFromPostgrest(error, "Não foi possível carregar as categorias."),
    );
  }

  return success(data ?? []);
}

/** How many transactions each category holds — drives the delete guard. */
export async function getCategoryUsage(): Promise<
  ActionResult<Record<string, number>>
> {
  const { supabase, user } = await requireUser();

  const { data, error } = await supabase
    .from("transactions")
    .select("category_id")
    .eq("user_id", user.id)
    .returns<Array<{ category_id: string | null }>>();

  if (error) {
    return failure(messageFromPostgrest(error, "Não foi possível contar o uso."));
  }

  const usage: Record<string, number> = {};
  for (const row of data ?? []) {
    if (row.category_id) usage[row.category_id] = (usage[row.category_id] ?? 0) + 1;
  }

  return success(usage);
}

export async function createCategory(
  input: unknown,
): Promise<ActionResult<CategoryRow>> {
  const parsed = categorySchema.safeParse(input);
  if (!parsed.success) {
    return failure("Revise os campos destacados.", fieldErrorsFrom(parsed.error));
  }

  const { supabase, user } = await requireUser();

  const { data, error } = await supabase
    .from("categories")
    .insert({ ...parsed.data, user_id: user.id })
    .select("*")
    .single<CategoryRow>();

  if (error) {
    return failure(
      messageFromPostgrest(error, "Não foi possível criar a categoria."),
      error.code === "23505" ? { name: "Você já tem uma categoria com esse nome." } : undefined,
    );
  }

  revalidateMoneyViews();
  return success(data);
}

export async function updateCategory(
  id: string,
  input: unknown,
): Promise<ActionResult<CategoryRow>> {
  const parsed = categorySchema.safeParse(input);
  if (!parsed.success) {
    return failure("Revise os campos destacados.", fieldErrorsFrom(parsed.error));
  }

  const { supabase, user } = await requireUser();

  const { data, error } = await supabase
    .from("categories")
    .update(parsed.data)
    .eq("id", id)
    .eq("user_id", user.id)
    .select("*")
    .maybeSingle<CategoryRow>();

  if (error) {
    return failure(
      messageFromPostgrest(error, "Não foi possível atualizar a categoria."),
      error.code === "23505" ? { name: "Você já tem uma categoria com esse nome." } : undefined,
    );
  }
  if (!data) return failure("Categoria não encontrada.");

  revalidateMoneyViews();
  return success(data);
}

/**
 * Removing a category is blocked while it still holds transactions. The
 * database enforces this too (FK, ON DELETE NO ACTION); the count here exists
 * so the message can say how many, instead of surfacing a constraint error.
 *
 * Budgets are not a blocker — they cascade, since a limit without a category
 * has no meaning.
 */
export async function deleteCategory(
  id: string,
): Promise<ActionResult<undefined>> {
  const { supabase, user } = await requireUser();

  const { count, error: countError } = await supabase
    .from("transactions")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id)
    .eq("category_id", id);

  if (countError) {
    return failure(
      messageFromPostgrest(countError, "Não foi possível verificar a categoria."),
    );
  }

  if ((count ?? 0) > 0) {
    return failure(
      count === 1
        ? "Esta categoria tem 1 transação. Mova ou exclua a transação antes."
        : `Esta categoria tem ${count} transações. Mova ou exclua as transações antes.`,
    );
  }

  const { data, error } = await supabase
    .from("categories")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id)
    .select("id")
    .maybeSingle();

  if (error) {
    return failure(
      messageFromPostgrest(error, "Não foi possível excluir a categoria."),
    );
  }
  if (!data) return failure("Categoria não encontrada.");

  revalidateMoneyViews();
  return success();
}
