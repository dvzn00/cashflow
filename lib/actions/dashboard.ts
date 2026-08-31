"use server";

import { messageFromPostgrest, requireUser } from "@/lib/actions/helpers";
import {
  failure,
  success,
  type ActionResult,
  type CategorySummary,
  type DashboardData,
} from "@/lib/actions/types";
import {
  calculateBalance,
  calculateBudgetProgress,
  calculateMonthlyTotals,
  getDailyTotals,
  groupExpensesByCategory,
  type BudgetLike,
  type TransactionLike,
} from "@/lib/domain/calculations";
import { isValidMonthKey, monthKeyToFirstDay } from "@/lib/domain/date";
import type { CategoryRow, TransactionType } from "@/types/database";

interface RawLedgerRow {
  type: TransactionType;
  amount: number | string;
  date: string;
  category_id: string | null;
}

interface RawBudgetRow {
  id: string;
  category_id: string;
  month: string;
  amount: number | string;
}

/**
 * Everything the dashboard renders, in three round trips.
 *
 * The whole ledger is pulled rather than aggregated in SQL. A personal ledger
 * is thousands of rows of four small columns, and doing it here means the
 * dashboard, the tests and the PDF all agree by construction — they run the
 * same pure functions. Revisit if a user ever crosses tens of thousands of rows.
 */
export async function getDashboardData(
  month: string,
): Promise<ActionResult<DashboardData>> {
  if (!isValidMonthKey(month)) return failure("Mês inválido.");

  const { supabase, user } = await requireUser();
  const firstDay = monthKeyToFirstDay(month)!;

  const [ledgerResult, categoriesResult, budgetsResult] = await Promise.all([
    supabase
      .from("transactions")
      .select("type, amount, date, category_id")
      .eq("user_id", user.id)
      .returns<RawLedgerRow[]>(),
    supabase
      .from("categories")
      .select("*")
      .eq("user_id", user.id)
      .order("name")
      .returns<CategoryRow[]>(),
    supabase
      .from("budgets")
      .select("id, category_id, month, amount")
      .eq("user_id", user.id)
      .eq("month", firstDay)
      .returns<RawBudgetRow[]>(),
  ]);

  if (ledgerResult.error) {
    return failure(
      messageFromPostgrest(ledgerResult.error, "Não foi possível carregar os lançamentos."),
    );
  }
  if (categoriesResult.error) {
    return failure(
      messageFromPostgrest(categoriesResult.error, "Não foi possível carregar as categorias."),
    );
  }
  if (budgetsResult.error) {
    return failure(
      messageFromPostgrest(budgetsResult.error, "Não foi possível carregar os orçamentos."),
    );
  }

  const transactions: TransactionLike[] = (ledgerResult.data ?? []).map((row) => ({
    type: row.type,
    amount: Number(row.amount),
    date: row.date,
    category_id: row.category_id,
  }));

  const categories = categoriesResult.data ?? [];
  const summaryById = new Map<string, CategorySummary>(
    categories.map((category) => [
      category.id,
      {
        id: category.id,
        name: category.name,
        icon: category.icon,
        color: category.color,
      },
    ]),
  );

  const budgetRows = budgetsResult.data ?? [];
  const budgetInputs: BudgetLike[] = budgetRows.map((row) => ({
    category_id: row.category_id,
    month: row.month,
    amount: Number(row.amount),
  }));

  const budgets = calculateBudgetProgress(transactions, budgetInputs)
    .map((entry, index) => ({
      ...entry,
      id: budgetRows[index].id,
      category: summaryById.get(entry.categoryId) ?? null,
    }))
    .sort((a, b) => b.percent - a.percent);

  const byCategory = groupExpensesByCategory(transactions, month).map((group) => ({
    ...group,
    category: group.categoryId ? (summaryById.get(group.categoryId) ?? null) : null,
  }));

  return success({
    month,
    totals: calculateMonthlyTotals(transactions, month),
    overallBalance: calculateBalance(transactions),
    daily: getDailyTotals(transactions, month),
    byCategory,
    budgets,
    categories,
    hasAnyTransaction: transactions.length > 0,
  });
}
