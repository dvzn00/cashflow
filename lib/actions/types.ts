import type { BudgetProgress, MonthlyEvolutionPoint, MonthlyTotals, CategoryTotal, DailyTotal } from "@/lib/domain/calculations";
import type { CategoryRow, TransactionType } from "@/types/database";

/**
 * What every action returns. Actions never throw for expected failures —
 * a form needs to render the message, not hit an error boundary.
 */
export type ActionResult<T = undefined> =
  | { ok: true; data: T }
  | { ok: false; error: string; fieldErrors?: Record<string, string> };

export function success(): ActionResult<undefined>;
export function success<T>(data: T): ActionResult<T>;
export function success<T>(data?: T): ActionResult<T | undefined> {
  return { ok: true, data };
}

export function failure(
  error: string,
  fieldErrors?: Record<string, string>,
): ActionResult<never> {
  return { ok: false, error, fieldErrors };
}

/** The slice of a category that travels with a transaction row. */
export interface CategorySummary {
  id: string;
  name: string;
  icon: string;
  color: string;
}

export interface TransactionWithCategory {
  id: string;
  type: TransactionType;
  amount: number;
  date: string;
  description: string | null;
  category_id: string | null;
  category: CategorySummary | null;
}

export interface PaginatedTransactions {
  items: TransactionWithCategory[];
  total: number;
  page: number;
  pageSize: number;
  pageCount: number;
}

export interface BudgetWithCategory extends BudgetProgress {
  id: string;
  category: CategorySummary | null;
}

export interface DashboardData {
  month: string;
  totals: MonthlyTotals;
  /** Balance across every transaction ever recorded, not just this month. */
  overallBalance: number;
  daily: DailyTotal[];
  byCategory: Array<CategoryTotal & { category: CategorySummary | null }>;
  budgets: BudgetWithCategory[];
  categories: CategoryRow[];
  hasAnyTransaction: boolean;
}

export type { MonthlyEvolutionPoint };
