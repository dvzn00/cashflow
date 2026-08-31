"use server";

import {
  fieldErrorsFrom,
  messageFromPostgrest,
  requireUser,
  revalidateMoneyViews,
} from "@/lib/actions/helpers";
import {
  failure,
  success,
  type ActionResult,
  type BudgetWithCategory,
  type CategorySummary,
} from "@/lib/actions/types";
import {
  calculateBudgetProgress,
  type BudgetLike,
  type TransactionLike,
} from "@/lib/domain/calculations";
import {
  monthKeyToFirstDay,
  monthKeyToLastDay,
  isValidMonthKey,
} from "@/lib/domain/date";
import { budgetSchema } from "@/lib/domain/schemas";
import type { TransactionType } from "@/types/database";

interface RawBudget {
  id: string;
  category_id: string;
  month: string;
  amount: number | string;
  category: CategorySummary | null;
}

/**
 * Budgets of one month, already resolved into spent / remaining / status.
 * The percentages come from the same pure function the unit tests cover.
 */
export async function getBudgets(
  month: string,
): Promise<ActionResult<BudgetWithCategory[]>> {
  if (!isValidMonthKey(month)) return failure("Mês inválido.");

  const { supabase, user } = await requireUser();
  const first = monthKeyToFirstDay(month)!;
  const last = monthKeyToLastDay(month)!;

  const [budgetsResult, transactionsResult] = await Promise.all([
    supabase
      .from("budgets")
      .select("id, category_id, month, amount, category:categories(id, name, icon, color)")
      .eq("user_id", user.id)
      .eq("month", first)
      .returns<RawBudget[]>(),
    supabase
      .from("transactions")
      .select("type, amount, date, category_id")
      .eq("user_id", user.id)
      .eq("type", "expense")
      .gte("date", first)
      .lte("date", last)
      .returns<
        Array<{
          type: TransactionType;
          amount: number | string;
          date: string;
          category_id: string | null;
        }>
      >(),
  ]);

  if (budgetsResult.error) {
    return failure(
      messageFromPostgrest(budgetsResult.error, "Não foi possível carregar os orçamentos."),
    );
  }
  if (transactionsResult.error) {
    return failure(
      messageFromPostgrest(transactionsResult.error, "Não foi possível carregar os gastos."),
    );
  }

  const rows = budgetsResult.data ?? [];

  const budgets: BudgetLike[] = rows.map((row) => ({
    category_id: row.category_id,
    month: row.month,
    amount: Number(row.amount),
  }));

  const transactions: TransactionLike[] = (transactionsResult.data ?? []).map(
    (row) => ({
      type: row.type,
      amount: Number(row.amount),
      date: row.date,
      category_id: row.category_id,
    }),
  );

  const progress = calculateBudgetProgress(transactions, budgets);

  const withCategory = progress.map((entry, index) => ({
    ...entry,
    id: rows[index].id,
    category: rows[index].category,
  }));

  // Tightest budgets first: the one about to burst is the one worth seeing.
  withCategory.sort((a, b) => b.percent - a.percent);

  return success(withCategory);
}

/**
 * Creates or replaces the limit for a category in a month. The unique
 * constraint on (user_id, category_id, month) is what makes this idempotent.
 */
export async function upsertBudget(
  input: unknown,
): Promise<ActionResult<{ id: string }>> {
  const parsed = budgetSchema.safeParse(input);
  if (!parsed.success) {
    return failure("Revise os campos destacados.", fieldErrorsFrom(parsed.error));
  }

  const { category_id, month, amount } = parsed.data;
  const { supabase, user } = await requireUser();

  const { data, error } = await supabase
    .from("budgets")
    .upsert(
      {
        user_id: user.id,
        category_id,
        month: monthKeyToFirstDay(month)!,
        amount,
      },
      { onConflict: "user_id,category_id,month" },
    )
    .select("id")
    .single();

  if (error) {
    return failure(
      messageFromPostgrest(error, "Não foi possível salvar o orçamento."),
    );
  }

  revalidateMoneyViews();
  return success({ id: data.id });
}

export async function deleteBudget(
  id: string,
): Promise<ActionResult<undefined>> {
  const { supabase, user } = await requireUser();

  const { data, error } = await supabase
    .from("budgets")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id)
    .select("id")
    .maybeSingle();

  if (error) {
    return failure(
      messageFromPostgrest(error, "Não foi possível excluir o orçamento."),
    );
  }
  if (!data) return failure("Orçamento não encontrado.");

  revalidateMoneyViews();
  return success();
}
