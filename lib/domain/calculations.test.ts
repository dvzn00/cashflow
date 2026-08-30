import { describe, expect, it } from "vitest";

import {
  calculateBalance,
  calculateBudgetProgress,
  calculateMonthlyTotals,
  filterByMonth,
  getDailyTotals,
  getMonthlyEvolution,
  groupExpensesByCategory,
  type BudgetLike,
  type TransactionLike,
} from "@/lib/domain/calculations";

const FOOD = "11111111-1111-4111-8111-111111111111";
const TRANSPORT = "22222222-2222-4222-8222-222222222222";
const SALARY = "33333333-3333-4333-8333-333333333333";

function income(
  amount: number,
  date: string,
  categoryId: string | null = SALARY,
): TransactionLike {
  return { type: "income", amount, date, category_id: categoryId };
}

function expense(
  amount: number,
  date: string,
  categoryId: string | null = FOOD,
): TransactionLike {
  return { type: "expense", amount, date, category_id: categoryId };
}

describe("calculateBalance", () => {
  it("returns zero for no transactions", () => {
    expect(calculateBalance([])).toBe(0);
  });

  it("subtracts expenses from income", () => {
    const balance = calculateBalance([
      income(5000, "2026-08-05"),
      expense(1200.5, "2026-08-06"),
      expense(300.25, "2026-08-07"),
    ]);
    expect(balance).toBe(3499.25);
  });

  it("goes negative when spending exceeds income", () => {
    expect(
      calculateBalance([
        income(100, "2026-08-01"),
        expense(250.75, "2026-08-02"),
      ]),
    ).toBe(-150.75);
  });

  it("is exact on amounts that break float addition", () => {
    expect(
      calculateBalance([
        income(0.1, "2026-08-01"),
        income(0.2, "2026-08-02"),
        expense(0.3, "2026-08-03"),
      ]),
    ).toBe(0);
  });

  it("ignores which month each transaction falls in", () => {
    expect(
      calculateBalance([income(1000, "2025-01-15"), expense(400, "2026-08-15")]),
    ).toBe(600);
  });

  it("counts income-only and expense-only sets", () => {
    expect(calculateBalance([income(800, "2026-08-01")])).toBe(800);
    expect(calculateBalance([expense(800, "2026-08-01")])).toBe(-800);
  });
});

describe("filterByMonth", () => {
  const transactions = [
    expense(10, "2026-07-31"),
    expense(20, "2026-08-01"),
    expense(30, "2026-08-31"),
    expense(40, "2026-09-01"),
  ];

  it("includes both boundary days and excludes the neighbours", () => {
    const august = filterByMonth(transactions, "2026-08");
    expect(august.map((t) => t.amount)).toEqual([20, 30]);
  });

  it("returns nothing for an invalid month key", () => {
    expect(filterByMonth(transactions, "agosto")).toEqual([]);
  });
});

describe("calculateMonthlyTotals", () => {
  const transactions = [
    income(5000, "2026-08-01"),
    income(500, "2026-08-20"),
    expense(1500, "2026-08-10"),
    expense(1000, "2026-08-25"),
    income(9999, "2026-07-15"),
    expense(9999, "2026-09-15"),
  ];

  it("totals only the requested month", () => {
    const totals = calculateMonthlyTotals(transactions, "2026-08");
    expect(totals).toMatchObject({
      month: "2026-08",
      income: 5500,
      expenses: 2500,
      balance: 3000,
    });
  });

  it("computes the savings rate as a percentage of income", () => {
    expect(
      calculateMonthlyTotals(transactions, "2026-08").savingsRate,
    ).toBeCloseTo(54.545, 3);
  });

  it("reports a savings rate of zero when there is no income", () => {
    const totals = calculateMonthlyTotals(
      [expense(300, "2026-08-02")],
      "2026-08",
    );
    expect(totals.income).toBe(0);
    expect(totals.expenses).toBe(300);
    expect(totals.balance).toBe(-300);
    expect(totals.savingsRate).toBe(0);
  });

  it("returns zeros for a month with no transactions", () => {
    expect(calculateMonthlyTotals(transactions, "2026-12")).toEqual({
      month: "2026-12",
      income: 0,
      expenses: 0,
      balance: 0,
      savingsRate: 0,
    });
  });

  it("reports a negative savings rate when spending outruns income", () => {
    const totals = calculateMonthlyTotals(
      [income(100, "2026-08-01"), expense(150, "2026-08-02")],
      "2026-08",
    );
    expect(totals.savingsRate).toBe(-50);
  });
});

describe("calculateBudgetProgress", () => {
  const budgets: BudgetLike[] = [
    { category_id: FOOD, month: "2026-08-01", amount: 1000 },
    { category_id: TRANSPORT, month: "2026-08-01", amount: 400 },
  ];

  it("flags a category that spent more than its limit", () => {
    const transactions = [
      expense(700, "2026-08-05", FOOD),
      expense(500, "2026-08-18", FOOD),
      expense(120, "2026-08-09", TRANSPORT),
    ];

    const [food, transport] = calculateBudgetProgress(transactions, budgets);

    expect(food).toMatchObject({
      categoryId: FOOD,
      limit: 1000,
      spent: 1200,
      remaining: -200,
      percent: 120,
      status: "over",
      isOverBudget: true,
    });

    expect(transport).toMatchObject({
      spent: 120,
      remaining: 280,
      percent: 30,
      status: "ok",
      isOverBudget: false,
    });
  });

  it("warns from 80% of the limit up to the limit itself", () => {
    const at80 = calculateBudgetProgress(
      [expense(800, "2026-08-03", FOOD)],
      budgets,
    );
    expect(at80[0]).toMatchObject({
      percent: 80,
      status: "warning",
      isOverBudget: false,
    });

    const at100 = calculateBudgetProgress(
      [expense(1000, "2026-08-03", FOOD)],
      budgets,
    );
    expect(at100[0]).toMatchObject({
      percent: 100,
      status: "warning",
      isOverBudget: false,
    });

    const justOver = calculateBudgetProgress(
      [expense(1000.01, "2026-08-03", FOOD)],
      budgets,
    );
    expect(justOver[0].status).toBe("over");
  });

  it("counts only expenses of that category in that month", () => {
    const transactions = [
      expense(900, "2026-07-31", FOOD), // previous month
      expense(900, "2026-09-01", FOOD), // next month
      expense(900, "2026-08-05", TRANSPORT), // other category
      income(900, "2026-08-05", FOOD), // income, not spending
      expense(150, "2026-08-05", FOOD), // the only one that counts
    ];

    const [food] = calculateBudgetProgress(transactions, budgets);
    expect(food.spent).toBe(150);
  });

  it("reports zeros when nothing was spent", () => {
    const [food] = calculateBudgetProgress([], budgets);
    expect(food).toMatchObject({
      spent: 0,
      remaining: 1000,
      percent: 0,
      status: "ok",
      isOverBudget: false,
    });
  });

  it("treats any spending against a zero limit as over budget", () => {
    const zeroBudget: BudgetLike[] = [
      { category_id: FOOD, month: "2026-08", amount: 0 },
    ];

    expect(
      calculateBudgetProgress([expense(1, "2026-08-05", FOOD)], zeroBudget)[0],
    ).toMatchObject({ percent: 100, status: "over", isOverBudget: true });

    expect(calculateBudgetProgress([], zeroBudget)[0]).toMatchObject({
      percent: 0,
      status: "ok",
      isOverBudget: false,
    });
  });

  it("accepts both YYYY-MM and YYYY-MM-DD month values", () => {
    const spending = [expense(500, "2026-08-05", FOOD)];
    const asKey = calculateBudgetProgress(spending, [
      { category_id: FOOD, month: "2026-08", amount: 1000 },
    ]);
    const asDate = calculateBudgetProgress(spending, [
      { category_id: FOOD, month: "2026-08-01", amount: 1000 },
    ]);
    expect(asKey[0].spent).toBe(asDate[0].spent);
    expect(asKey[0].month).toBe("2026-08");
    expect(asDate[0].month).toBe("2026-08");
  });

  it("returns an empty list when no budgets are defined", () => {
    expect(
      calculateBudgetProgress([expense(100, "2026-08-05", FOOD)], []),
    ).toEqual([]);
  });
});

describe("getMonthlyEvolution", () => {
  const transactions = [
    income(3000, "2026-01-10"),
    expense(1000, "2026-01-20"),
    income(4000, "2026-08-05"),
    expense(1500.75, "2026-08-15"),
    income(9999, "2025-08-05"), // different year
  ];

  it("always returns twelve months in order", () => {
    const evolution = getMonthlyEvolution(transactions, 2026);
    expect(evolution).toHaveLength(12);
    expect(evolution.map((point) => point.month)).toEqual([
      1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12,
    ]);
    expect(evolution[0].label).toBe("Jan");
    expect(evolution[11].monthKey).toBe("2026-12");
  });

  it("returns zeros for months with no transactions", () => {
    const evolution = getMonthlyEvolution(transactions, 2026);
    const emptyMonths = evolution.filter(
      (point) => point.month !== 1 && point.month !== 8,
    );

    expect(emptyMonths).toHaveLength(10);
    for (const point of emptyMonths) {
      expect(point).toMatchObject({ income: 0, expenses: 0, balance: 0 });
    }
  });

  it("totals each month that has transactions", () => {
    const evolution = getMonthlyEvolution(transactions, 2026);
    expect(evolution[0]).toMatchObject({
      income: 3000,
      expenses: 1000,
      balance: 2000,
    });
    expect(evolution[7]).toMatchObject({
      income: 4000,
      expenses: 1500.75,
      balance: 2499.25,
    });
  });

  it("ignores other years", () => {
    const evolution = getMonthlyEvolution(transactions, 2025);
    expect(evolution[7]).toMatchObject({ income: 9999, expenses: 0 });
    expect(evolution.filter((p) => p.income !== 0)).toHaveLength(1);
  });

  it("returns twelve zeroed months when there are no transactions at all", () => {
    const evolution = getMonthlyEvolution([], 2026);
    expect(evolution).toHaveLength(12);
    expect(evolution.every((p) => p.income === 0 && p.expenses === 0)).toBe(
      true,
    );
  });
});

describe("groupExpensesByCategory", () => {
  it("groups, ranks by size and shares out percentages", () => {
    const groups = groupExpensesByCategory(
      [
        expense(300, "2026-08-01", FOOD),
        expense(200, "2026-08-02", FOOD),
        expense(500, "2026-08-03", TRANSPORT),
        income(9999, "2026-08-04", SALARY),
        expense(700, "2026-07-01", FOOD),
      ],
      "2026-08",
    );

    expect(groups).toEqual([
      { categoryId: FOOD, total: 500, percent: 50 },
      { categoryId: TRANSPORT, total: 500, percent: 50 },
    ]);
  });

  it("buckets uncategorised expenses under null", () => {
    const groups = groupExpensesByCategory(
      [expense(120, "2026-08-01", null)],
      "2026-08",
    );
    expect(groups).toEqual([{ categoryId: null, total: 120, percent: 100 }]);
  });

  it("returns an empty list for a month with no expenses", () => {
    expect(
      groupExpensesByCategory([income(100, "2026-08-01")], "2026-08"),
    ).toEqual([]);
  });
});

describe("getDailyTotals", () => {
  it("covers every day of the month, including empty ones", () => {
    const days = getDailyTotals(
      [
        income(100, "2026-02-01"),
        expense(40, "2026-02-01"),
        expense(60, "2026-02-28"),
      ],
      "2026-02",
    );

    expect(days).toHaveLength(28);
    expect(days[0]).toEqual({
      day: 1,
      date: "2026-02-01",
      income: 100,
      expenses: 40,
    });
    expect(days[1]).toMatchObject({ day: 2, income: 0, expenses: 0 });
    expect(days[27]).toMatchObject({ day: 28, expenses: 60 });
  });

  it("uses the real length of a leap February", () => {
    expect(getDailyTotals([], "2024-02")).toHaveLength(29);
  });

  it("returns nothing for an invalid month key", () => {
    expect(getDailyTotals([], "2026")).toEqual([]);
  });
});
