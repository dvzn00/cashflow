import { describe, expect, it } from "vitest";

import {
  addMonths,
  currentMonthKey,
  daysInMonth,
  formatDateBR,
  formatMonthLabel,
  isValidISODate,
  isValidMonthKey,
  monthKey,
  monthKeyOf,
  monthKeyToFirstDay,
  monthKeyToLastDay,
  parseISODate,
  parseMonthKey,
  todayISO,
} from "@/lib/domain/date";

describe("parseISODate", () => {
  it("parses a well-formed date", () => {
    expect(parseISODate("2026-08-30")).toEqual({
      year: 2026,
      month: 8,
      day: 30,
    });
  });

  it("rejects days the month does not have", () => {
    expect(parseISODate("2026-02-30")).toBeNull();
    expect(parseISODate("2026-04-31")).toBeNull();
    expect(parseISODate("2026-02-29")).toBeNull();
  });

  it("accepts February 29 in a leap year", () => {
    expect(parseISODate("2024-02-29")).not.toBeNull();
  });

  it("rejects malformed input", () => {
    expect(parseISODate("30/08/2026")).toBeNull();
    expect(parseISODate("2026-8-30")).toBeNull();
    expect(parseISODate("2026-13-01")).toBeNull();
    expect(parseISODate("")).toBeNull();
  });
});

describe("monthKeyOf", () => {
  /**
   * The reason this module never touches `new Date(iso)`: that parses as UTC
   * midnight, so in any negative UTC offset (Brazil is UTC-3) the first of the
   * month reads as the last day of the previous month.
   */
  it("keeps the first day of the month in its own month", () => {
    expect(monthKeyOf("2026-08-01")).toBe("2026-08");
    expect(monthKeyOf("2026-01-01")).toBe("2026-01");
    expect(monthKeyOf("2026-12-31")).toBe("2026-12");
  });

  it("returns null for an invalid date", () => {
    expect(monthKeyOf("not-a-date")).toBeNull();
  });
});

describe("month keys", () => {
  it("pads single-digit months", () => {
    expect(monthKey(2026, 3)).toBe("2026-03");
  });

  it("round-trips", () => {
    expect(parseMonthKey("2026-03")).toEqual({ year: 2026, month: 3 });
  });

  it("rejects an out-of-range month", () => {
    expect(parseMonthKey("2026-00")).toBeNull();
    expect(parseMonthKey("2026-13")).toBeNull();
    expect(isValidMonthKey("2026-3")).toBe(false);
  });

  it("expands to the first and last day", () => {
    expect(monthKeyToFirstDay("2026-02")).toBe("2026-02-01");
    expect(monthKeyToLastDay("2026-02")).toBe("2026-02-28");
    expect(monthKeyToLastDay("2024-02")).toBe("2024-02-29");
    expect(monthKeyToLastDay("2026-08")).toBe("2026-08-31");
  });
});

describe("addMonths", () => {
  it("moves forward across a year boundary", () => {
    expect(addMonths("2026-11", 3)).toBe("2027-02");
  });

  it("moves backward across a year boundary", () => {
    expect(addMonths("2026-01", -1)).toBe("2025-12");
    expect(addMonths("2026-01", -13)).toBe("2024-12");
  });

  it("is a no-op for zero", () => {
    expect(addMonths("2026-08", 0)).toBe("2026-08");
  });
});

describe("daysInMonth", () => {
  it("knows month lengths, including leap years", () => {
    expect(daysInMonth(2026, 1)).toBe(31);
    expect(daysInMonth(2026, 2)).toBe(28);
    expect(daysInMonth(2024, 2)).toBe(29);
    expect(daysInMonth(2026, 4)).toBe(30);
  });
});

describe("formatting", () => {
  it("formats a date for pt-BR readers", () => {
    expect(formatDateBR("2026-08-05")).toBe("05/08/2026");
  });

  it("returns invalid input unchanged", () => {
    expect(formatDateBR("qualquer coisa")).toBe("qualquer coisa");
  });

  it("names the month", () => {
    expect(formatMonthLabel("2026-03")).toBe("Março de 2026");
  });
});

describe("today", () => {
  it("uses the local calendar day, not UTC", () => {
    // 23:30 local on the 30th is already the 31st in UTC for UTC-3.
    const localLateNight = new Date(2026, 7, 30, 23, 30, 0);
    expect(todayISO(localLateNight)).toBe("2026-08-30");
    expect(currentMonthKey(localLateNight)).toBe("2026-08");
  });

  it("produces a valid ISO date", () => {
    expect(isValidISODate(todayISO())).toBe(true);
  });
});
