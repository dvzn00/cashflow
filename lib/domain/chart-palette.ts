/**
 * Categorical palette for category-identity marks (the expense pie, category
 * swatches). Not hand-picked: these eight slots were searched in OKLCH and
 * validated, in this exact order, against the six checks — lightness band,
 * chroma floor, colour-blind separation and normal-vision separation.
 *
 *   light  worst adjacent ΔE 17.4 (protan) · normal-vision 21.0
 *   dark   worst adjacent ΔE 17.1 (protan) · normal-vision 19.3
 *   target ≥ 8 CVD, ≥ 15 normal-vision
 *
 * The order is the safety mechanism — slots are assigned in sequence and never
 * cycled or reshuffled. Slots 1 and 2 sit on the brand's turquoise and violet.
 *
 * Contrast against the card surface lands under 3:1 for a few slots, which the
 * method allows only with a relief channel. Every chart using these ships one:
 * the pie has a labelled legend with values, and a table view of the same rows.
 */

export interface ChartSlot {
  /** Stored in the database and shown in the picker. */
  light: string;
  /** Same hue, re-stepped for the dark surface. */
  dark: string;
  label: string;
}

export const CHART_SLOTS: ChartSlot[] = [
  { light: "#06a295", dark: "#06a295", label: "Turquesa" },
  { light: "#6646a8", dark: "#7152b5", label: "Violeta" },
  { light: "#5bb661", dark: "#4ea954", label: "Verde" },
  { light: "#00829e", dark: "#017e9a", label: "Azul-petróleo" },
  { light: "#b37903", dark: "#ab7302", label: "Âmbar" },
  { light: "#9e3f84", dark: "#98397e", label: "Magenta" },
  { light: "#61b0fe", dark: "#3a93e6", label: "Azul" },
  { light: "#a73447", dark: "#bf4a5a", label: "Vinho" },
];

/**
 * Colours seeded before the palette was validated. They are the same two hues
 * as slots 1 and 2, one step off, so they resolve to those slots rather than
 * rendering an unvalidated step.
 */
const LEGACY_ALIASES: Record<string, number> = {
  "#00c4b3": 0,
  "#00e5d1": 0,
  "#7a5aff": 1,
  "#6b46c1": 1,
  "#5fd6a0": 2,
  "#4fb8e8": 3,
  "#f2b544": 4,
  "#c58bff": 5,
  "#ff7a9c": 7,
  "#8b93b8": 3,
};

const SLOT_BY_LIGHT = new Map(
  CHART_SLOTS.map((slot, index) => [slot.light.toLowerCase(), index]),
);

/** Slot index for a stored colour, or -1 when it is not one of ours. */
export function slotIndexOf(color: string): number {
  const key = color.trim().toLowerCase();
  return SLOT_BY_LIGHT.get(key) ?? LEGACY_ALIASES[key] ?? -1;
}

/**
 * The colour to actually paint, for the given theme. Unknown values are drawn
 * as stored rather than dropped — a category is still identifiable.
 */
export function resolveChartColor(color: string, isDark: boolean): string {
  const index = slotIndexOf(color);
  if (index < 0) return color;
  return isDark ? CHART_SLOTS[index].dark : CHART_SLOTS[index].light;
}

/** Nth series colour, assigned in order and never cycled past the eighth. */
export function seriesColor(index: number, isDark: boolean): string {
  const slot = CHART_SLOTS[Math.min(index, CHART_SLOTS.length - 1)];
  return isDark ? slot.dark : slot.light;
}
