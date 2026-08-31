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
  type CategorySummary,
  type PaginatedTransactions,
  type TransactionWithCategory,
} from "@/lib/actions/types";
import {
  getMonthlyEvolution as computeMonthlyEvolution,
  type MonthlyEvolutionPoint,
  type TransactionLike,
} from "@/lib/domain/calculations";
import { monthKeyToFirstDay, monthKeyToLastDay } from "@/lib/domain/date";
import {
  transactionFiltersSchema,
  transactionSchema,
} from "@/lib/domain/schemas";
import type { TransactionType } from "@/types/database";

const SELECT_WITH_CATEGORY =
  "id, type, amount, date, description, category_id, category:categories(id, name, icon, color)";

interface RawTransaction {
  id: string;
  type: TransactionType;
  amount: number | string;
  date: string;
  description: string | null;
  category_id: string | null;
  category: CategorySummary | null;
}

/** PostgREST serialises `numeric` as a JSON number, but never trust the wire. */
function normalise(row: RawTransaction): TransactionWithCategory {
  return {
    id: row.id,
    type: row.type,
    amount: Number(row.amount),
    date: row.date,
    description: row.description,
    category_id: row.category_id,
    category: row.category,
  };
}

/**
 * Paginated list, newest first. Filters are validated here rather than trusted
 * from the query string.
 */
export async function getTransactions(
  input: unknown = {},
): Promise<ActionResult<PaginatedTransactions>> {
  const parsed = transactionFiltersSchema.safeParse(input ?? {});
  if (!parsed.success) {
    return failure("Filtros inválidos.", fieldErrorsFrom(parsed.error));
  }

  const { month, categoryId, type, search, page, pageSize } = parsed.data;
  const { supabase, user } = await requireUser();

  let query = supabase
    .from("transactions")
    .select(SELECT_WITH_CATEGORY, { count: "exact" })
    .eq("user_id", user.id);

  if (month) {
    query = query
      .gte("date", monthKeyToFirstDay(month)!)
      .lte("date", monthKeyToLastDay(month)!);
  }
  if (categoryId) query = query.eq("category_id", categoryId);
  if (type) query = query.eq("type", type);
  if (search) query = query.ilike("description", `%${search}%`);

  const from = (page - 1) * pageSize;

  const { data, error, count } = await query
    .order("date", { ascending: false })
    .order("created_at", { ascending: false })
    .range(from, from + pageSize - 1)
    .returns<RawTransaction[]>();

  if (error) {
    return failure(
      messageFromPostgrest(error, "Não foi possível carregar as transações."),
    );
  }

  const total = count ?? 0;

  return success({
    items: (data ?? []).map(normalise),
    total,
    page,
    pageSize,
    pageCount: Math.max(1, Math.ceil(total / pageSize)),
  });
}

/** Every transaction of one month, unpaginated — for charts and the PDF. */
export async function getTransactionsForMonth(
  month: string,
): Promise<ActionResult<TransactionWithCategory[]>> {
  const first = monthKeyToFirstDay(month);
  const last = monthKeyToLastDay(month);
  if (!first || !last) return failure("Mês inválido.");

  const { supabase, user } = await requireUser();

  const { data, error } = await supabase
    .from("transactions")
    .select(SELECT_WITH_CATEGORY)
    .eq("user_id", user.id)
    .gte("date", first)
    .lte("date", last)
    .order("date", { ascending: true })
    .returns<RawTransaction[]>();

  if (error) {
    return failure(
      messageFromPostgrest(error, "Não foi possível carregar o período."),
    );
  }

  return success((data ?? []).map(normalise));
}

export async function createTransaction(
  input: unknown,
): Promise<ActionResult<{ id: string }>> {
  const parsed = transactionSchema.safeParse(input);
  if (!parsed.success) {
    return failure("Revise os campos destacados.", fieldErrorsFrom(parsed.error));
  }

  const { supabase, user } = await requireUser();

  const { data, error } = await supabase
    .from("transactions")
    .insert({ ...parsed.data, user_id: user.id })
    .select("id")
    .single();

  if (error) {
    return failure(
      messageFromPostgrest(error, "Não foi possível salvar a transação."),
    );
  }

  revalidateMoneyViews();
  return success({ id: data.id });
}

export async function updateTransaction(
  id: string,
  input: unknown,
): Promise<ActionResult<{ id: string }>> {
  const parsed = transactionSchema.safeParse(input);
  if (!parsed.success) {
    return failure("Revise os campos destacados.", fieldErrorsFrom(parsed.error));
  }

  const { supabase, user } = await requireUser();

  // The `user_id` filter is belt-and-braces: RLS already scopes the update.
  const { data, error } = await supabase
    .from("transactions")
    .update(parsed.data)
    .eq("id", id)
    .eq("user_id", user.id)
    .select("id")
    .maybeSingle();

  if (error) {
    return failure(
      messageFromPostgrest(error, "Não foi possível atualizar a transação."),
    );
  }
  if (!data) return failure("Transação não encontrada.");

  revalidateMoneyViews();
  return success({ id: data.id });
}

export async function deleteTransaction(
  id: string,
): Promise<ActionResult<undefined>> {
  const { supabase, user } = await requireUser();

  const { data, error } = await supabase
    .from("transactions")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id)
    .select("id")
    .maybeSingle();

  if (error) {
    return failure(
      messageFromPostgrest(error, "Não foi possível excluir a transação."),
    );
  }
  if (!data) return failure("Transação não encontrada.");

  revalidateMoneyViews();
  return success();
}

/**
 * Twelve months of income, expenses and balance.
 *
 * Aggregated in the application rather than in SQL: a personal ledger is a few
 * thousand rows at most, and this reuses the same tested pure function the
 * dashboard and the tests already run through.
 */
export async function getMonthlyEvolution(
  year: number,
): Promise<ActionResult<MonthlyEvolutionPoint[]>> {
  if (!Number.isInteger(year) || year < 1970 || year > 2999) {
    return failure("Ano inválido.");
  }

  const { supabase, user } = await requireUser();

  const { data, error } = await supabase
    .from("transactions")
    .select("type, amount, date, category_id")
    .eq("user_id", user.id)
    .gte("date", `${year}-01-01`)
    .lte("date", `${year}-12-31`)
    .returns<Array<{ type: TransactionType; amount: number | string; date: string; category_id: string | null }>>();

  if (error) {
    return failure(
      messageFromPostgrest(error, "Não foi possível carregar a evolução anual."),
    );
  }

  const transactions: TransactionLike[] = (data ?? []).map((row) => ({
    type: row.type,
    amount: Number(row.amount),
    date: row.date,
    category_id: row.category_id,
  }));

  return success(computeMonthlyEvolution(transactions, year));
}

/** Years that actually have data, newest first — feeds the year selector. */
export async function getYearsWithData(): Promise<ActionResult<number[]>> {
  const { supabase, user } = await requireUser();

  const { data, error } = await supabase
    .from("transactions")
    .select("date")
    .eq("user_id", user.id)
    .order("date", { ascending: false })
    .returns<Array<{ date: string }>>();

  if (error) {
    return failure(messageFromPostgrest(error, "Não foi possível carregar os anos."));
  }

  const years = new Set<number>();
  for (const row of data ?? []) {
    const year = Number(row.date.slice(0, 4));
    if (Number.isInteger(year)) years.add(year);
  }
  years.add(new Date().getFullYear());

  return success([...years].sort((a, b) => b - a));
}
