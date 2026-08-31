"use client";

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";

import { TooltipCard } from "@/components/charts/chart-frame";
import { useChartTheme } from "@/hooks/use-chart-theme";
import type { CategorySummary } from "@/lib/actions/types";
import { resolveChartColor } from "@/lib/domain/chart-palette";
import type { CategoryTotal } from "@/lib/domain/calculations";
import { formatMoney } from "@/lib/domain/money";

type Slice = CategoryTotal & { category: CategorySummary | null };

/**
 * Expenses by category. A donut, so the month's total can sit in the middle
 * where people look first.
 *
 * The list beside it is not decoration: several palette slots land under 3:1
 * against the card, which the colour method allows only with a relief channel.
 * The list is that channel — every slice is named with its value and share, so
 * the chart never depends on telling two fills apart.
 */
export function ExpensePie({ slices }: { slices: Slice[] }) {
  const theme = useChartTheme();

  const data = slices.map((slice) => ({
    ...slice,
    name: slice.category?.name ?? "Sem categoria",
    color: slice.category
      ? resolveChartColor(slice.category.color, theme.isDark)
      : theme.neutral,
  }));

  const total = data.reduce((sum, slice) => sum + slice.total, 0);

  return (
    <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
      <div className="relative mx-auto shrink-0" style={{ width: 176, height: 176 }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="total"
              nameKey="name"
              innerRadius={56}
              outerRadius={84}
              paddingAngle={2}
              stroke={theme.surface}
              strokeWidth={2}
              isAnimationActive={false}
            >
              {data.map((slice) => (
                <Cell key={slice.name} fill={slice.color} />
              ))}
            </Pie>
            <Tooltip
              content={({ active, payload }) => {
                if (!active || !payload?.length) return null;
                const slice = payload[0].payload as (typeof data)[number];
                return (
                  <TooltipCard
                    title={slice.name}
                    rows={[
                      {
                        label: `${slice.percent.toFixed(1).replace(".", ",")}% do mês`,
                        value: formatMoney(slice.total),
                        color: slice.color,
                      },
                    ]}
                  />
                );
              }}
            />
          </PieChart>
        </ResponsiveContainer>

        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="eyebrow">Total</span>
          <span className="tabular mt-0.5 text-sm font-semibold">
            {formatMoney(total)}
          </span>
        </div>
      </div>

      <ul className="min-w-0 flex-1 space-y-2.5">
        {data.map((slice) => (
          <li key={slice.name} className="flex items-center gap-2.5 text-sm">
            <span
              aria-hidden
              className="size-2.5 shrink-0 rounded-full"
              style={{ backgroundColor: slice.color }}
            />
            <span className="min-w-0 flex-1 truncate">{slice.name}</span>
            <span className="tabular shrink-0 font-medium">
              {formatMoney(slice.total)}
            </span>
            <span className="tabular w-12 shrink-0 text-right text-xs text-muted-foreground">
              {slice.percent.toFixed(0)}%
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
