"use client";

import { AlertTriangle, Check, TriangleAlert } from "lucide-react";

import { CategoryIcon } from "@/components/category-icon";
import { budgetTone, useChartTheme, type ChartTheme } from "@/hooks/use-chart-theme";
import type { BudgetWithCategory } from "@/lib/actions/types";
import { formatMoney } from "@/lib/domain/money";
import { cn } from "@/lib/utils";

const STATUS = {
  ok: { label: "Dentro do limite", Icon: Check },
  warning: { label: "Perto do limite", Icon: TriangleAlert },
  over: { label: "Estourou", Icon: AlertTriangle },
} as const;

/**
 * One ring per budget. Status is carried by colour *and* an icon *and* a
 * worded label — a reader who cannot separate the hues still gets the state.
 */
export function BudgetRings({ budgets }: { budgets: BudgetWithCategory[] }) {
  const theme = useChartTheme();

  return (
    <ul className="grid grid-cols-2 gap-x-4 gap-y-6 sm:grid-cols-3 lg:grid-cols-2 xl:grid-cols-3">
      {budgets.map((budget) => (
        <li key={budget.id} className="flex flex-col items-center text-center">
          <Ring percent={budget.percent} status={budget.status} theme={theme} />

          <p className="mt-3 flex items-center gap-1.5 text-sm font-medium">
            {budget.category ? (
              <CategoryIcon
                name={budget.category.icon}
                className="size-3.5 shrink-0"
              />
            ) : null}
            <span className="truncate">
              {budget.category?.name ?? "Sem categoria"}
            </span>
          </p>

          <p className="tabular mt-0.5 text-xs text-muted-foreground">
            {formatMoney(budget.spent)} de {formatMoney(budget.limit)}
          </p>

          <StatusPill status={budget.status} theme={theme} />
        </li>
      ))}
    </ul>
  );
}

function Ring({
  percent,
  status,
  theme,
}: {
  percent: number;
  status: BudgetWithCategory["status"];
  theme: ChartTheme;
}) {
  const size = 86;
  const stroke = 7;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;

  // The arc caps at a full turn; the number below keeps the real figure.
  const filled = Math.min(100, Math.max(0, percent)) / 100;
  const tone = budgetTone(status, theme);

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg
        width={size}
        height={size}
        role="img"
        aria-label={`${Math.round(percent)}% do orçamento usado`}
        className="-rotate-90"
      >
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={theme.grid}
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={tone}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - filled)}
        />
      </svg>

      <span className="absolute inset-0 flex items-center justify-center">
        <span className="tabular text-sm font-semibold" style={{ color: tone }}>
          {Math.round(percent)}
          <span className="text-[0.7em] font-medium">%</span>
        </span>
      </span>
    </div>
  );
}

function StatusPill({
  status,
  theme,
}: {
  status: BudgetWithCategory["status"];
  theme: ChartTheme;
}) {
  const { label, Icon } = STATUS[status];
  const tone = budgetTone(status, theme);

  return (
    <span
      className={cn(
        "mt-2 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[0.6875rem] font-medium",
      )}
      style={{
        color: tone,
        backgroundColor: `color-mix(in oklab, ${tone} 14%, transparent)`,
      }}
    >
      <Icon className="size-3" aria-hidden />
      {label}
    </span>
  );
}
