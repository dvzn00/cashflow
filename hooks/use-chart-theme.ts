"use client";

import { useIsDark } from "@/hooks/use-is-dark";

/**
 * Resolved colours for chart marks. SVG fills need real values, not CSS
 * variables, so these are read from the theme rather than inherited.
 *
 * Income and expense are a *diverging* pair — polarity around a zero baseline,
 * not two categories — so they keep the brand's turquoise and violet hues.
 * The dark steps are re-stepped versions of the brand colours: the interface
 * turquoise (#00e5d1) sits at OKLCH L 0.83, above the 0.48–0.67 band a chart
 * mark has to stay inside, so the mark uses the same hue one step down.
 *
 *   light  #00a394 / #6b46c1  — CVD ΔE 21.6, normal-vision 28.2, both ≥ 3:1
 *   dark   #02a99b / #8a66d9  — CVD ΔE 15.5, normal-vision 24.5, both ≥ 3:1
 */
export interface ChartTheme {
  isDark: boolean;
  income: string;
  expense: string;
  /** The neutral midpoint of the diverging pair — the derived balance line. */
  neutral: string;
  grid: string;
  axis: string;
  ink: string;
  surface: string;
  good: string;
  warning: string;
  critical: string;
}

const LIGHT: Omit<ChartTheme, "isDark"> = {
  income: "#00a394",
  expense: "#6b46c1",
  neutral: "#6b728e",
  grid: "#e8eaf0",
  axis: "#d1d5db",
  ink: "#1a1d2b",
  surface: "#ffffff",
  good: "#00a394",
  warning: "#b45309",
  critical: "#d92d4e",
};

const DARK: Omit<ChartTheme, "isDark"> = {
  income: "#02a99b",
  expense: "#8a66d9",
  neutral: "#a3aac6",
  grid: "#2e3552",
  axis: "#3d4465",
  ink: "#ffffff",
  surface: "#252c42",
  good: "#02a99b",
  warning: "#f2b544",
  critical: "#ff5e7a",
};

export function useChartTheme(): ChartTheme {
  const isDark = useIsDark();
  return { isDark, ...(isDark ? DARK : LIGHT) };
}

/** Status colour for a budget, matched with a label so it is never colour alone. */
export function budgetTone(
  status: "ok" | "warning" | "over",
  theme: ChartTheme,
) {
  if (status === "over") return theme.critical;
  if (status === "warning") return theme.warning;
  return theme.good;
}
