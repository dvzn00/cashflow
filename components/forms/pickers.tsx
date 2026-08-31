"use client";

import { Check } from "lucide-react";

import { CategoryIcon } from "@/components/category-icon";
import { Label } from "@/components/ui/label";
import { CATEGORY_COLORS, CATEGORY_ICONS } from "@/lib/domain/icons";
import { cn } from "@/lib/utils";

export function IconPicker({
  value,
  onChange,
  className,
}: {
  value: string;
  onChange: (value: string) => void;
  className?: string;
}) {
  return (
    <div className={cn("grid gap-1.5", className)}>
      <Label asChild>
        <span className="text-xs">Ícone</span>
      </Label>
      <div
        role="radiogroup"
        aria-label="Ícone da categoria"
        className="flex max-h-28 flex-wrap gap-1 overflow-y-auto rounded-md p-0.5"
      >
        {CATEGORY_ICONS.map((option) => (
          <button
            key={option}
            type="button"
            role="radio"
            aria-checked={value === option}
            aria-label={option}
            onClick={() => onChange(option)}
            className={cn(
              "flex size-7 items-center justify-center rounded-md border transition-colors",
              value === option
                ? "border-primary bg-accent text-accent-foreground"
                : "border-transparent hover:bg-surface",
            )}
          >
            <CategoryIcon name={option} className="size-3.5" />
          </button>
        ))}
      </div>
    </div>
  );
}

export function ColorPicker({
  value,
  onChange,
  className,
}: {
  value: string;
  onChange: (value: string) => void;
  className?: string;
}) {
  return (
    <div className={cn("grid gap-1.5", className)}>
      <Label asChild>
        <span className="text-xs">Cor</span>
      </Label>
      <div
        role="radiogroup"
        aria-label="Cor da categoria"
        className="flex flex-wrap gap-1.5"
      >
        {CATEGORY_COLORS.map((option) => (
          <button
            key={option}
            type="button"
            role="radio"
            aria-checked={value === option}
            aria-label={`Cor ${option}`}
            onClick={() => onChange(option)}
            className={cn(
              "flex size-6 items-center justify-center rounded-full ring-offset-2 ring-offset-card transition-shadow",
              value === option && "ring-2 ring-ring",
            )}
            style={{ backgroundColor: option }}
          >
            {value === option ? (
              <Check className="size-3 text-white" aria-hidden />
            ) : null}
          </button>
        ))}
      </div>
    </div>
  );
}
