/**
 * Date helpers for calendar dates stored as `YYYY-MM-DD` (Postgres `date`).
 *
 * These are calendar dates, not instants — they have no timezone. Passing them
 * through `new Date(iso)` parses them as UTC midnight, so in Brazil (UTC-3)
 * `new Date("2026-08-01").getMonth()` returns July. Everything here works on
 * the string parts instead, and only touches `Date` in UTC.
 */

export type ISODate = string; // YYYY-MM-DD
export type MonthKey = string; // YYYY-MM

export interface DateParts {
  year: number;
  month: number; // 1-12
  day: number; // 1-31
}

const ISO_DATE = /^(\d{4})-(\d{2})-(\d{2})$/;
const MONTH_KEY = /^(\d{4})-(\d{2})$/;

/** Days in a month. `month` is 1-12. */
export function daysInMonth(year: number, month: number): number {
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

/** Parses `YYYY-MM-DD`, rejecting impossible dates like 2026-02-30. */
export function parseISODate(iso: string): DateParts | null {
  const match = ISO_DATE.exec(iso);
  if (!match) return null;

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);

  if (month < 1 || month > 12) return null;
  if (day < 1 || day > daysInMonth(year, month)) return null;

  return { year, month, day };
}

export function isValidISODate(iso: string): boolean {
  return parseISODate(iso) !== null;
}

export function monthKey(year: number, month: number): MonthKey {
  return `${String(year).padStart(4, "0")}-${String(month).padStart(2, "0")}`;
}

/** `YYYY-MM-DD` -> `YYYY-MM`. Null when the date is invalid. */
export function monthKeyOf(iso: string): MonthKey | null {
  const parts = parseISODate(iso);
  return parts ? monthKey(parts.year, parts.month) : null;
}

export function parseMonthKey(key: string): { year: number; month: number } | null {
  const match = MONTH_KEY.exec(key);
  if (!match) return null;

  const year = Number(match[1]);
  const month = Number(match[2]);
  if (month < 1 || month > 12) return null;

  return { year, month };
}

export function isValidMonthKey(key: string): boolean {
  return parseMonthKey(key) !== null;
}

/**
 * `YYYY-MM` -> `YYYY-MM-01`. Budgets are stored on a `date` column anchored to
 * the first day of the month, so the database can index and compare them.
 */
export function monthKeyToFirstDay(key: MonthKey): ISODate | null {
  const parts = parseMonthKey(key);
  return parts ? `${key}-01` : null;
}

/** Last day of a month, as `YYYY-MM-DD`. */
export function monthKeyToLastDay(key: MonthKey): ISODate | null {
  const parts = parseMonthKey(key);
  if (!parts) return null;
  const last = daysInMonth(parts.year, parts.month);
  return `${key}-${String(last).padStart(2, "0")}`;
}

/** Shifts a month key by `amount` months, forward or back. */
export function addMonths(key: MonthKey, amount: number): MonthKey | null {
  const parts = parseMonthKey(key);
  if (!parts) return null;

  const zeroBased = parts.year * 12 + (parts.month - 1) + amount;
  return monthKey(Math.floor(zeroBased / 12), (zeroBased % 12) + 1);
}

/** Today in the user's local calendar, as `YYYY-MM-DD`. */
export function todayISO(now: Date = new Date()): ISODate {
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(
    now.getDate(),
  ).padStart(2, "0")}`;
}

export function currentMonthKey(now: Date = new Date()): MonthKey {
  return monthKey(now.getFullYear(), now.getMonth() + 1);
}

/** `2026-08-30` -> `30/08/2026`. Returns the input unchanged when invalid. */
export function formatDateBR(iso: string): string {
  const parts = parseISODate(iso);
  if (!parts) return iso;
  return `${String(parts.day).padStart(2, "0")}/${String(parts.month).padStart(2, "0")}/${parts.year}`;
}

export const MONTH_NAMES = [
  "Janeiro",
  "Fevereiro",
  "Março",
  "Abril",
  "Maio",
  "Junho",
  "Julho",
  "Agosto",
  "Setembro",
  "Outubro",
  "Novembro",
  "Dezembro",
] as const;

export const MONTH_NAMES_SHORT = [
  "Jan",
  "Fev",
  "Mar",
  "Abr",
  "Mai",
  "Jun",
  "Jul",
  "Ago",
  "Set",
  "Out",
  "Nov",
  "Dez",
] as const;

/** `2026-08` -> `Agosto de 2026`. Returns the input unchanged when invalid. */
export function formatMonthLabel(key: MonthKey): string {
  const parts = parseMonthKey(key);
  if (!parts) return key;
  return `${MONTH_NAMES[parts.month - 1]} de ${parts.year}`;
}
