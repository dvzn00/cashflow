import { describe, expect, it } from "vitest";

import {
  budgetSchema,
  categorySchema,
  profileSchema,
  signInSchema,
  signUpSchema,
  transactionFiltersSchema,
  transactionSchema,
} from "@/lib/domain/schemas";

const CATEGORY_ID = "11111111-1111-4111-8111-111111111111";

function transaction(overrides: Record<string, unknown> = {}) {
  return {
    type: "expense",
    amount: "1.234,56",
    category_id: CATEGORY_ID,
    date: "2026-08-30",
    description: "Mercado",
    ...overrides,
  };
}

describe("transactionSchema", () => {
  it("parses a typed pt-BR amount into a number", () => {
    const result = transactionSchema.parse(transaction());
    expect(result.amount).toBe(1234.56);
  });

  it("accepts a plain number amount", () => {
    expect(transactionSchema.parse(transaction({ amount: 99.9 })).amount).toBe(
      99.9,
    );
  });

  it("rounds to cents", () => {
    expect(
      transactionSchema.parse(transaction({ amount: 10.005 })).amount,
    ).toBe(10.01);
  });

  it("rejects zero and negative amounts", () => {
    expect(transactionSchema.safeParse(transaction({ amount: 0 })).success).toBe(
      false,
    );
    expect(
      transactionSchema.safeParse(transaction({ amount: -10 })).success,
    ).toBe(false);
  });

  it("rejects an unparseable amount", () => {
    expect(
      transactionSchema.safeParse(transaction({ amount: "abc" })).success,
    ).toBe(false);
  });

  it("rejects an amount above the column limit", () => {
    expect(
      transactionSchema.safeParse(transaction({ amount: 1e12 })).success,
    ).toBe(false);
  });

  it("rejects an impossible date", () => {
    expect(
      transactionSchema.safeParse(transaction({ date: "2026-02-30" })).success,
    ).toBe(false);
    expect(
      transactionSchema.safeParse(transaction({ date: "30/08/2026" })).success,
    ).toBe(false);
  });

  it("rejects a type outside income/expense", () => {
    expect(
      transactionSchema.safeParse(transaction({ type: "transfer" })).success,
    ).toBe(false);
  });

  it("requires a category", () => {
    expect(
      transactionSchema.safeParse(transaction({ category_id: "" })).success,
    ).toBe(false);
    expect(
      transactionSchema.safeParse(transaction({ category_id: "nao-e-uuid" }))
        .success,
    ).toBe(false);
  });

  it("normalises an empty description to null", () => {
    expect(
      transactionSchema.parse(transaction({ description: "   " })).description,
    ).toBeNull();
    expect(
      transactionSchema.parse(transaction({ description: undefined }))
        .description,
    ).toBeNull();
  });

  it("trims the description and caps its length", () => {
    expect(
      transactionSchema.parse(transaction({ description: "  Padaria  " }))
        .description,
    ).toBe("Padaria");
    expect(
      transactionSchema.safeParse(transaction({ description: "x".repeat(141) }))
        .success,
    ).toBe(false);
  });

  it("reports the field that failed", () => {
    const result = transactionSchema.safeParse(transaction({ amount: "0" }));
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].path).toEqual(["amount"]);
      expect(result.error.issues[0].message).toMatch(/maior que zero/);
    }
  });
});

describe("categorySchema", () => {
  const valid = { name: "Alimentação", icon: "utensils", color: "#00c4b3" };

  it("accepts a valid category", () => {
    expect(categorySchema.parse(valid)).toEqual(valid);
  });

  it("trims and requires a name", () => {
    expect(categorySchema.parse({ ...valid, name: "  Lazer " }).name).toBe(
      "Lazer",
    );
    expect(categorySchema.safeParse({ ...valid, name: "   " }).success).toBe(
      false,
    );
    expect(
      categorySchema.safeParse({ ...valid, name: "x".repeat(41) }).success,
    ).toBe(false);
  });

  it("only accepts icons from the registry", () => {
    expect(categorySchema.safeParse({ ...valid, icon: "utensils" }).success).toBe(
      true,
    );
    expect(
      categorySchema.safeParse({ ...valid, icon: "nao-existe" }).success,
    ).toBe(false);
  });

  it("normalises the colour to lowercase hex", () => {
    expect(categorySchema.parse({ ...valid, color: "#00C4B3" }).color).toBe(
      "#00c4b3",
    );
  });

  it("rejects colours that are not #RRGGBB", () => {
    for (const color of ["00c4b3", "#00c", "#00c4b33", "turquesa"]) {
      expect(categorySchema.safeParse({ ...valid, color }).success).toBe(false);
    }
  });
});

describe("budgetSchema", () => {
  const valid = { category_id: CATEGORY_ID, month: "2026-08", amount: "500" };

  it("accepts a valid budget", () => {
    expect(budgetSchema.parse(valid)).toEqual({
      category_id: CATEGORY_ID,
      month: "2026-08",
      amount: 500,
    });
  });

  it("rejects a malformed month", () => {
    for (const month of ["2026-8", "08/2026", "2026-13", "2026-08-01"]) {
      expect(budgetSchema.safeParse({ ...valid, month }).success).toBe(false);
    }
  });

  it("rejects a non-positive amount", () => {
    expect(budgetSchema.safeParse({ ...valid, amount: 0 }).success).toBe(false);
  });
});

describe("profileSchema", () => {
  it("trims the name", () => {
    expect(profileSchema.parse({ full_name: "  Ana  " }).full_name).toBe("Ana");
  });

  it("requires a name", () => {
    expect(profileSchema.safeParse({ full_name: "" }).success).toBe(false);
  });
});

describe("auth schemas", () => {
  it("normalises the e-mail", () => {
    const result = signInSchema.parse({
      email: "  Pessoa@Exemplo.COM ",
      password: "segredo",
    });
    expect(result.email).toBe("pessoa@exemplo.com");
  });

  it("rejects a malformed e-mail", () => {
    expect(
      signInSchema.safeParse({ email: "pessoa@", password: "segredo" }).success,
    ).toBe(false);
  });

  it("requires at least 8 characters on signup", () => {
    const base = { full_name: "Ana", email: "ana@exemplo.com" };
    expect(signUpSchema.safeParse({ ...base, password: "1234567" }).success).toBe(
      false,
    );
    expect(signUpSchema.safeParse({ ...base, password: "12345678" }).success).toBe(
      true,
    );
  });
});

describe("transactionFiltersSchema", () => {
  it("defaults to the first page", () => {
    expect(transactionFiltersSchema.parse({})).toMatchObject({
      page: 1,
      pageSize: 20,
    });
  });

  it("coerces pagination coming from the query string", () => {
    expect(
      transactionFiltersSchema.parse({ page: "3", pageSize: "50" }),
    ).toMatchObject({ page: 3, pageSize: 50 });
  });

  it("caps the page size", () => {
    expect(transactionFiltersSchema.safeParse({ pageSize: 500 }).success).toBe(
      false,
    );
  });

  it("rejects an invalid filter value", () => {
    expect(
      transactionFiltersSchema.safeParse({ type: "transferencia" }).success,
    ).toBe(false);
    expect(transactionFiltersSchema.safeParse({ month: "2026" }).success).toBe(
      false,
    );
  });
});
