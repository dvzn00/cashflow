/**
 * Money helpers.
 *
 * Amounts travel as numbers of reais, but every sum goes through cents:
 * 0.1 + 0.2 === 0.30000000000000004 in floating point, and a statement that
 * is off by a hundredth of a cent is a bug users will find.
 */

/** Reais to whole cents. */
export function toCents(amount: number): number {
  return Math.round(amount * 100);
}

/** Whole cents back to reais. */
export function fromCents(cents: number): number {
  return cents / 100;
}

/** Rounds to the nearest cent. */
export function roundMoney(amount: number): number {
  return fromCents(toCents(amount));
}

/** Sums in cents so repeated addition cannot drift. */
export function sumMoney(amounts: number[]): number {
  return fromCents(amounts.reduce((total, a) => total + toCents(a), 0));
}

const BRL = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

const BRL_COMPACT = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
  notation: "compact",
  maximumFractionDigits: 1,
});

export function formatMoney(amount: number): string {
  // Avoid "-R$ 0,00" when a rounded total lands on zero.
  const value = roundMoney(amount);
  return BRL.format(value === 0 ? 0 : value);
}

/** Short form for chart axes, where full currency strings do not fit. */
export function formatMoneyCompact(amount: number): string {
  const value = roundMoney(amount);
  if (Math.abs(value) < 1000) return BRL.format(value === 0 ? 0 : value);
  return BRL_COMPACT.format(value);
}

/** Value for a text input the user will edit: "700,00", never "700". */
export function formatAmountInput(amount: number): string {
  return roundMoney(amount).toFixed(2).replace(".", ",");
}

const COMPACT_NUMBER = new Intl.NumberFormat("pt-BR", {
  notation: "compact",
  maximumFractionDigits: 1,
});

/**
 * Chart axis tick: compact, and without the currency symbol. The unit belongs
 * in the chart title and the tooltip, not repeated down every tick.
 */
export function formatAxisMoney(amount: number): string {
  const value = roundMoney(amount);
  if (value === 0) return "0";
  return COMPACT_NUMBER.format(value);
}

/** "1.234,56" / "1234.56" / "R$ 1.234,56" -> 1234.56. NaN when unparseable. */
export function parseMoneyInput(input: string | number): number {
  if (typeof input === "number") return input;

  const cleaned = input.replace(/[^\d,.-]/g, "").trim();
  if (cleaned === "") return Number.NaN;

  const lastComma = cleaned.lastIndexOf(",");
  const lastDot = cleaned.lastIndexOf(".");

  // Whichever separator comes last is the decimal one; the other groups digits.
  let normalized: string;
  if (lastComma > lastDot) {
    normalized = cleaned.replace(/\./g, "").replace(",", ".");
  } else if (lastDot > lastComma) {
    normalized = cleaned.replace(/,/g, "");
  } else {
    normalized = cleaned;
  }

  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : Number.NaN;
}

/** Share of `part` in `whole`, as a percentage. 0 when `whole` is 0. */
export function percentOf(part: number, whole: number): number {
  if (whole === 0) return 0;
  return (toCents(part) / toCents(whole)) * 100;
}
