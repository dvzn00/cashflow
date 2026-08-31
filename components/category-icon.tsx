import {
  Baby,
  Banknote,
  Bike,
  BookOpen,
  Briefcase,
  Bus,
  Car,
  CircleDollarSign,
  Clapperboard,
  Coffee,
  CreditCard,
  Dog,
  Dumbbell,
  Fuel,
  Gamepad2,
  Gift,
  GraduationCap,
  Hammer,
  HeartPulse,
  House,
  Landmark,
  Music,
  PiggyBank,
  Pill,
  Plane,
  Receipt,
  Scissors,
  Shirt,
  ShoppingBag,
  ShoppingCart,
  Smartphone,
  Sparkles,
  Stethoscope,
  Ticket,
  Train,
  TrendingUp,
  Utensils,
  Wallet,
  Wifi,
  Zap,
  type LucideIcon,
} from "lucide-react";

import { cn } from "@/lib/utils";

/** Keys match CATEGORY_ICONS in lib/domain/icons.ts. */
const ICONS: Record<string, LucideIcon> = {
  utensils: Utensils,
  "shopping-cart": ShoppingCart,
  "shopping-bag": ShoppingBag,
  car: Car,
  bus: Bus,
  train: Train,
  bike: Bike,
  fuel: Fuel,
  house: House,
  zap: Zap,
  wifi: Wifi,
  smartphone: Smartphone,
  "heart-pulse": HeartPulse,
  stethoscope: Stethoscope,
  pill: Pill,
  dumbbell: Dumbbell,
  "graduation-cap": GraduationCap,
  "book-open": BookOpen,
  clapperboard: Clapperboard,
  music: Music,
  "gamepad-2": Gamepad2,
  ticket: Ticket,
  plane: Plane,
  coffee: Coffee,
  shirt: Shirt,
  scissors: Scissors,
  sparkles: Sparkles,
  baby: Baby,
  dog: Dog,
  gift: Gift,
  hammer: Hammer,
  briefcase: Briefcase,
  landmark: Landmark,
  "credit-card": CreditCard,
  receipt: Receipt,
  wallet: Wallet,
  "piggy-bank": PiggyBank,
  banknote: Banknote,
  "trending-up": TrendingUp,
  "circle-dollar-sign": CircleDollarSign,
};

export function CategoryIcon({
  name,
  className,
}: {
  name: string;
  className?: string;
}) {
  const Icon = ICONS[name] ?? Wallet;
  return <Icon className={cn("size-4", className)} aria-hidden />;
}

/**
 * Icon on a tinted disc in the category's own colour. The tint is the colour at
 * low alpha so it sits quietly behind the glyph in both themes.
 */
export function CategoryBadge({
  name,
  color,
  label,
  className,
  size = "md",
}: {
  name: string;
  color: string;
  label?: string;
  className?: string;
  size?: "sm" | "md";
}) {
  return (
    <span
      className={cn(
        "flex shrink-0 items-center justify-center rounded-full",
        size === "sm" ? "size-7" : "size-9",
        className,
      )}
      style={{
        backgroundColor: `color-mix(in oklab, ${color} 18%, transparent)`,
        color,
      }}
      title={label}
    >
      <CategoryIcon name={name} className={size === "sm" ? "size-3.5" : "size-4"} />
    </span>
  );
}
