import { describe, expect, it } from "vitest";

import {
  formatMoney,
  formatMoneyCompact,
  parseMoneyInput,
  percentOf,
  roundMoney,
  sumMoney,
  toCents,
} from "@/lib/domain/money";

describe("sumMoney", () => {
  it("does not drift on values that float addition gets wrong", () => {
    // 0.1 + 0.2 === 0.30000000000000004 in plain floating point.
    expect(sumMoney([0.1, 0.2])).toBe(0.3);
    expect(sumMoney([1.1, 2.2, 3.3])).toBe(6.6);
  });

  it("stays exact across many small amounts", () => {
    const cents = Array.from({ length: 1000 }, () => 0.01);
    expect(sumMoney(cents)).toBe(10);
  });

  it("returns zero for an empty list", () => {
    expect(sumMoney([])).toBe(0);
  });

  it("handles negative amounts", () => {
    expect(sumMoney([100.5, -50.25])).toBe(50.25);
  });
});

describe("roundMoney", () => {
  it("rounds to the nearest cent", () => {
    expect(roundMoney(10.005)).toBe(10.01);
    expect(roundMoney(10.004)).toBe(10);
  });
});

describe("toCents", () => {
  it("converts without floating point residue", () => {
    expect(toCents(19.99)).toBe(1999);
    expect(toCents(0.07)).toBe(7);
  });
});

describe("parseMoneyInput", () => {
  it("reads pt-BR formatting", () => {
    expect(parseMoneyInput("1.234,56")).toBe(1234.56);
    expect(parseMoneyInput("R$ 1.234,56")).toBe(1234.56);
    expect(parseMoneyInput("0,99")).toBe(0.99);
  });

  it("reads plain and en-US formatting", () => {
    expect(parseMoneyInput("1234.56")).toBe(1234.56);
    expect(parseMoneyInput("1,234.56")).toBe(1234.56);
    expect(parseMoneyInput("42")).toBe(42);
  });

  it("passes numbers through untouched", () => {
    expect(parseMoneyInput(12.34)).toBe(12.34);
  });

  it("returns NaN when there is nothing to parse", () => {
    expect(parseMoneyInput("")).toBeNaN();
    expect(parseMoneyInput("abc")).toBeNaN();
  });

  it("keeps the sign", () => {
    expect(parseMoneyInput("-1.234,56")).toBe(-1234.56);
  });
});

describe("formatMoney", () => {
  it("formats as Brazilian currency", () => {
    // The separator Intl emits is a non-breaking space, not a plain one.
    expect(formatMoney(1234.5).replace(/\u00a0/g, " ")).toBe("R$ 1.234,50");
  });

  it("never renders a negative zero", () => {
    expect(formatMoney(-0.001).replace(/\u00a0/g, " ")).toBe("R$ 0,00");
  });

  it("keeps real negatives", () => {
    expect(formatMoney(-50).replace(/\u00a0/g, " ")).toBe("-R$ 50,00");
  });
});

describe("formatMoneyCompact", () => {
  it("stays exact below one thousand", () => {
    expect(formatMoneyCompact(999).replace(/\u00a0/g, " ")).toBe("R$ 999,00");
  });

  it("abbreviates larger values", () => {
    expect(formatMoneyCompact(12500)).toMatch(/12,5/);
  });
});

describe("percentOf", () => {
  it("computes a share", () => {
    expect(percentOf(25, 200)).toBe(12.5);
  });

  it("returns zero instead of dividing by zero", () => {
    expect(percentOf(100, 0)).toBe(0);
  });
});
