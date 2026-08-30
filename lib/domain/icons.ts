/**
 * Icon keys a category may use. Kebab-case is what goes in the database;
 * the picker maps each key to its Lucide component.
 *
 * Every key here is verified to exist in lucide-react.
 */
export const CATEGORY_ICONS = [
  "utensils",
  "shopping-cart",
  "shopping-bag",
  "car",
  "bus",
  "train",
  "bike",
  "fuel",
  "house",
  "zap",
  "wifi",
  "smartphone",
  "heart-pulse",
  "stethoscope",
  "pill",
  "dumbbell",
  "graduation-cap",
  "book-open",
  "clapperboard",
  "music",
  "gamepad-2",
  "ticket",
  "plane",
  "coffee",
  "shirt",
  "scissors",
  "sparkles",
  "baby",
  "dog",
  "gift",
  "hammer",
  "briefcase",
  "landmark",
  "credit-card",
  "receipt",
  "wallet",
  "piggy-bank",
  "banknote",
  "trending-up",
  "circle-dollar-sign",
] as const;

export type CategoryIcon = (typeof CATEGORY_ICONS)[number];

export const DEFAULT_CATEGORY_ICON: CategoryIcon = "wallet";

export function isCategoryIcon(value: string): value is CategoryIcon {
  return (CATEGORY_ICONS as readonly string[]).includes(value);
}

/**
 * Palette offered when creating a category. Drawn from the chart ramp so a
 * category always reads correctly against the pie and bar charts.
 */
export const CATEGORY_COLORS = [
  "#00c4b3",
  "#7a5aff",
  "#4fb8e8",
  "#c58bff",
  "#5fd6a0",
  "#f2b544",
  "#ff7a9c",
  "#8b93b8",
] as const;

export const DEFAULT_CATEGORY_COLOR = CATEGORY_COLORS[0];
