import {
  monthKey,
  monthKeyOf,
  MONTH_NAMES_SHORT,
  daysInMonth,
  parseISODate,
  parseMonthKey,
  type ISODate,
  type MonthKey,
} from "@/lib/domain/date";
import { percentOf, roundMoney, sumMoney } from "@/lib/domain/money";
import type { TransactionType } from "@/types/database";

/** Minimum shape the calculations need — any transaction row satisfies it. */
export interface TransactionLike {
  type: TransactionType;
  amount: number;
  date: ISODate;
  category_id?: string | null;
}

/** Budgets arrive from Postgres as `YYYY-MM-01`; `YYYY-MM` is accepted too. */
export interface BudgetLike {
  category_id: string;
  month: string;
  amount: number;
}

export interface MonthlyTotals {
  month: MonthKey;
  income: number;
  expenses: number;
  balance: number;
  /** (income - expenses) / income, as a percentage. 0 when there is no income. */
  savingsRate: number;
}

export type BudgetStatus = "ok" | "warning" | "over";

export interface BudgetProgress {
  categoryId: string;
  month: MonthKey;
  limit: number;
  spent: number;
  /** Negative once the limit is passed. */
  remaining: number;
  /** Uncapped, so 137 means 37% over the limit. */
  percent: number;
  status: BudgetStatus;
  isOverBudget: boolean;
}

export interface MonthlyEvolutionPoint {
  month: number; // 1-12
  monthKey: MonthKey;
  label: string; // "Jan"
  income: number;
  expenses: number;
  balance: number;
}

export interface CategoryTotal {
  categoryId: string | null;
  total: number;
  /** Share of the period's expenses, as a percentage. */
  percent: number;
}

export interface DailyTotal {
  day: number;
  date: ISODate;
  income: number;
  expenses: number;
}

/** Spending is "warning" from here up to the limit. */
export const BUDGET_WARNING_THRESHOLD = 80;

/** Accepts `YYYY-MM` or `YYYY-MM-DD` and returns `YYYY-MM`. */
function toMonthKey(value: string): MonthKey | null {
  return parseMonthKey(value) ? value : monthKeyOf(value);
}

function amountsOfType(
  transactions: readonly TransactionLike[],
  type: TransactionType,
): number[] {
  return transactions.filter((t) => t.type === type).map((t) => t.amount);
}

/** Income minus expenses across every transaction given. */
export function calculateBalance(
  transactions: readonly TransactionLike[],
): number {
  const income = sumMoney(amountsOfType(transactions, "income"));
  const expenses = sumMoney(amountsOfType(transactions, "expense"));
  return roundMoney(income - expenses);
}

/** Transactions falling inside `month` (`YYYY-MM`). */
export function filterByMonth(
  transactions: readonly TransactionLike[],
  month: MonthKey,
): TransactionLike[] {
  const key = toMonthKey(month);
  if (!key) return [];
  return transactions.filter((t) => monthKeyOf(t.date) === key);
}

export function calculateMonthlyTotals(
  transactions: readonly TransactionLike[],
  month: MonthKey,
): MonthlyTotals {
  const key = toMonthKey(month) ?? month;
  const inMonth = filterByMonth(transactions, key);

  const income = sumMoney(amountsOfType(inMonth, "income"));
  const expenses = sumMoney(amountsOfType(inMonth, "expense"));
  const balance = roundMoney(income - expenses);

  return {
    month: key,
    income,
    expenses,
    balance,
    savingsRate: income === 0 ? 0 : percentOf(balance, income),
  };
}

/**
 * How much of each budget has been spent. One entry per budget, so a category
 * with no budget is simply absent — the UI decides how to prompt for one.
 */
export function calculateBudgetProgress(
  transactions: readonly TransactionLike[],
  budgets: readonly BudgetLike[],
): BudgetProgress[] {
  return budgets.map((budget) => {
    const key = toMonthKey(budget.month) ?? budget.month;
    const limit = roundMoney(budget.amount);

    const spent = sumMoney(
      transactions
        .filter(
          (t) =>
            t.type === "expense" &&
            t.category_id === budget.category_id &&
            monthKeyOf(t.date) === key,
        )
        .map((t) => t.amount),
    );

    // A zero or missing limit cannot be divided into; any spending is over it.
    const percent = limit > 0 ? percentOf(spent, limit) : spent > 0 ? 100 : 0;
    const isOverBudget = limit > 0 ? spent > limit : spent > 0;

    let status: BudgetStatus = "ok";
    if (isOverBudget) status = "over";
    else if (percent >= BUDGET_WARNING_THRESHOLD) status = "warning";

    return {
      categoryId: budget.category_id,
      month: key,
      limit,
      spent,
      remaining: roundMoney(limit - spent),
      percent,
      status,
      isOverBudget,
    };
  });
}

/** Twelve points, always. Months with no transactions come back as zeros. */
export function getMonthlyEvolution(
  transactions: readonly TransactionLike[],
  year: number,
): MonthlyEvolutionPoint[] {
  return Array.from({ length: 12 }, (_, index) => {
    const month = index + 1;
    const key = monthKey(year, month);
    const totals = calculateMonthlyTotals(transactions, key);

    return {
      month,
      monthKey: key,
      label: MONTH_NAMES_SHORT[index],
      income: totals.income,
      expenses: totals.expenses,
      balance: totals.balance,
    };
  });
}

/**
 * Expenses grouped by category for one month, largest first.
 * Uncategorised expenses group under `categoryId: null`.
 */
export function groupExpensesByCategory(
  transactions: readonly TransactionLike[],
  month: MonthKey,
): CategoryTotal[] {
  const expenses = filterByMonth(transactions, month).filter(
    (t) => t.type === "expense",
  );

  const byCategory = new Map<string | null, number[]>();
  for (const transaction of expenses) {
    const key = transaction.category_id ?? null;
    const bucket = byCategory.get(key);
    if (bucket) bucket.push(transaction.amount);
    else byCategory.set(key, [transaction.amount]);
  }

  const total = sumMoney(expenses.map((t) => t.amount));

  return [...byCategory.entries()]
    .map(([categoryId, amounts]) => {
      const categoryTotal = sumMoney(amounts);
      return {
        categoryId,
        total: categoryTotal,
        percent: percentOf(categoryTotal, total),
      };
    })
    .sort((a, b) => b.total - a.total);
}

/** One entry per calendar day of the month, including days with no movement. */
export function getDailyTotals(
  transactions: readonly TransactionLike[],
  month: MonthKey,
): DailyTotal[] {
  const parts = parseMonthKey(month);
  if (!parts) return [];

  const inMonth = filterByMonth(transactions, month);
  const length = daysInMonth(parts.year, parts.month);

  return Array.from({ length }, (_, index) => {
    const day = index + 1;
    const onDay = inMonth.filter((t) => parseISODate(t.date)?.day === day);

    return {
      day,
      date: `${month}-${String(day).padStart(2, "0")}`,
      income: sumMoney(amountsOfType(onDay, "income")),
      expenses: sumMoney(amountsOfType(onDay, "expense")),
    };
  });
}
