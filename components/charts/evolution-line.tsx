"use client";

import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { ChartLegend, TooltipCard } from "@/components/charts/chart-frame";
import { useChartTheme } from "@/hooks/use-chart-theme";
import type { MonthlyEvolutionPoint } from "@/lib/domain/calculations";
import { formatAxisMoney, formatMoney } from "@/lib/domain/money";

/**
 * Twelve months of income, spending and the balance they produce.
 *
 * Balance wears the neutral ink rather than a third hue. It is the midpoint of
 * a diverging pair, not a third category — giving it its own colour would make
 * three things compete when only two are being compared.
 */
export function EvolutionLine({ points }: { points: MonthlyEvolutionPoint[] }) {
  const theme = useChartTheme();

  return (
    <div>
      <ChartLegend
        className="mb-3"
        items={[
          { label: "Receitas", color: theme.income, shape: "line" },
          { label: "Despesas", color: theme.expense, shape: "line" },
          { label: "Saldo", color: theme.neutral, shape: "line" },
        ]}
      />

      <ResponsiveContainer width="100%" height={240}>
        <LineChart data={points} margin={{ top: 6, right: 8, bottom: 0, left: 0 }}>
          <CartesianGrid vertical={false} stroke={theme.grid} strokeDasharray="2 4" />
          <XAxis
            dataKey="label"
            tickLine={false}
            axisLine={false}
            tick={{ fill: theme.neutral, fontSize: 11 }}
          />
          <YAxis
            tickLine={false}
            axisLine={false}
            width={58}
            tick={{ fill: theme.neutral, fontSize: 11 }}
            tickFormatter={formatAxisMoney}
          />
          <ReferenceLine y={0} stroke={theme.axis} strokeWidth={1} />
          <Tooltip
            cursor={{ stroke: theme.axis, strokeWidth: 1 }}
            content={({ active, payload }) => {
              if (!active || !payload?.length) return null;
              const point = payload[0].payload as MonthlyEvolutionPoint;
              return (
                <TooltipCard
                  title={point.label}
                  rows={[
                    { label: "Receitas", value: formatMoney(point.income), color: theme.income },
                    { label: "Despesas", value: formatMoney(point.expenses), color: theme.expense },
                    { label: "Saldo", value: formatMoney(point.balance), color: theme.neutral },
                  ]}
                />
              );
            }}
          />
          <Line
            type="linear"
            dataKey="income"
            stroke={theme.income}
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4, strokeWidth: 2, stroke: theme.surface }}
            isAnimationActive={false}
          />
          <Line
            type="linear"
            dataKey="expenses"
            stroke={theme.expense}
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4, strokeWidth: 2, stroke: theme.surface }}
            isAnimationActive={false}
          />
          <Line
            type="linear"
            dataKey="balance"
            stroke={theme.neutral}
            strokeWidth={2}
            strokeDasharray="4 3"
            dot={false}
            activeDot={{ r: 4, strokeWidth: 2, stroke: theme.surface }}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
