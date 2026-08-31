"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { ChartLegend, TooltipCard } from "@/components/charts/chart-frame";
import { useChartTheme } from "@/hooks/use-chart-theme";
import type { DailyTotal } from "@/lib/domain/calculations";
import { formatDateBR } from "@/lib/domain/date";
import { formatAxisMoney, formatMoney } from "@/lib/domain/money";

/** Rounds up to a round number, so the axis reads 6 mil rather than 5,2 mil. */
function niceCeil(value: number): number {
  if (value <= 0) return 1;
  const magnitude = 10 ** Math.floor(Math.log10(value));
  const normalised = value / magnitude;

  for (const step of [1, 1.5, 2, 2.5, 3, 4, 5, 6, 8, 10]) {
    if (normalised <= step) return step * magnitude;
  }
  return 10 * magnitude;
}

/**
 * The month's rhythm: one column per day, income rising above the baseline and
 * spending falling below it. Same gesture as the brand mark.
 *
 * Diverging rather than side-by-side bars because the question the chart
 * answers is directional — did more come in than went out — and a shared
 * baseline answers that at a glance where paired bars make you compare heights.
 */
export function MonthRibbon({ daily }: { daily: DailyTotal[] }) {
  const theme = useChartTheme();

  const data = daily.map((day) => ({
    day: day.day,
    date: day.date,
    income: day.income,
    // Negated so the stack renders below the zero line.
    expense: -day.expenses,
    rawExpense: day.expenses,
  }));

  /*
   * One symmetric scale for both halves. An axis that fitted each side to its
   * own maximum would be two scales in one chart, and the whole point of the
   * shared baseline is that a bar above and a bar below can be compared.
   */
  const busiest = Math.max(
    1,
    ...daily.map((day) => Math.max(day.income, day.expenses)),
  );
  const top = niceCeil(busiest);
  const ticks = [-top, -top / 2, 0, top / 2, top];

  return (
    <div>
      <ChartLegend
        className="mb-3"
        items={[
          { label: "Receitas", color: theme.income },
          { label: "Despesas", color: theme.expense },
        ]}
      />

      <ResponsiveContainer width="100%" height={220}>
        <BarChart
          data={data}
          stackOffset="sign"
          margin={{ top: 4, right: 4, bottom: 0, left: 0 }}
          barCategoryGap="18%"
        >
          <CartesianGrid
            vertical={false}
            stroke={theme.grid}
            strokeDasharray="2 4"
          />
          <XAxis
            dataKey="day"
            tickLine={false}
            axisLine={false}
            tick={{ fill: theme.neutral, fontSize: 11 }}
            interval={daily.length > 20 ? 4 : 1}
            minTickGap={4}
          />
          <YAxis
            tickLine={false}
            axisLine={false}
            width={58}
            tick={{ fill: theme.neutral, fontSize: 11 }}
            tickFormatter={formatAxisMoney}
            domain={[-top, top]}
            ticks={ticks}
          />
          <ReferenceLine y={0} stroke={theme.axis} strokeWidth={1} />
          <Tooltip
            cursor={{ fill: theme.grid, opacity: 0.55 }}
            content={({ active, payload }) => {
              if (!active || !payload?.length) return null;
              const point = payload[0].payload as (typeof data)[number];
              return (
                <TooltipCard
                  title={formatDateBR(point.date)}
                  rows={[
                    {
                      label: "Receitas",
                      value: formatMoney(point.income),
                      color: theme.income,
                    },
                    {
                      label: "Despesas",
                      value: formatMoney(point.rawExpense),
                      color: theme.expense,
                    },
                  ]}
                />
              );
            }}
          />
          <Bar
            dataKey="income"
            stackId="fluxo"
            fill={theme.income}
            radius={[3, 3, 0, 0]}
            isAnimationActive={false}
          />
          <Bar
            dataKey="expense"
            stackId="fluxo"
            fill={theme.expense}
            radius={[0, 0, 3, 3]}
            isAnimationActive={false}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
