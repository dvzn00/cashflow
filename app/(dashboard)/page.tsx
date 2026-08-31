import Link from "next/link";
import {
  ArrowDownLeft,
  ArrowUpRight,
  PiggyBank,
  Plus,
  Target,
  Wallet,
} from "lucide-react";

import { BudgetRings } from "@/components/charts/budget-rings";
import { ChartFrame } from "@/components/charts/chart-frame";
import { EvolutionLine } from "@/components/charts/evolution-line";
import { ExpensePie } from "@/components/charts/expense-pie";
import { MonthRibbon } from "@/components/charts/month-ribbon";
import { StatCard } from "@/components/dashboard/stat-card";
import { YearSelect } from "@/components/dashboard/year-select";
import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/layout/page-header";
import { MonthPicker } from "@/components/month-picker";
import { Button } from "@/components/ui/button";
import { getDashboardData } from "@/lib/actions/dashboard";
import { getMonthlyEvolution, getYearsWithData } from "@/lib/actions/transactions";
import { currentMonthKey, formatMonthLabel, isValidMonthKey } from "@/lib/domain/date";

export default async function DashboardPage({ searchParams }: PageProps<"/">) {
  const params = await searchParams;

  const requestedMonth = typeof params.mes === "string" ? params.mes : "";
  const month = isValidMonthKey(requestedMonth) ? requestedMonth : currentMonthKey();

  const requestedYear = Number(typeof params.ano === "string" ? params.ano : NaN);
  const year = Number.isInteger(requestedYear)
    ? requestedYear
    : Number(month.slice(0, 4));

  const [dashboard, evolution, years] = await Promise.all([
    getDashboardData(month),
    getMonthlyEvolution(year),
    getYearsWithData(),
  ]);

  if (!dashboard.ok) {
    return (
      <>
        <PageHeader eyebrow="Visão geral" title="Dashboard" />
        <EmptyState
          title="Não foi possível carregar o painel"
          description={dashboard.error}
        />
      </>
    );
  }

  const { totals, overallBalance, daily, byCategory, budgets, hasAnyTransaction } =
    dashboard.data;

  const monthLabel = formatMonthLabel(month);
  const movedThisMonth = totals.income > 0 || totals.expenses > 0;

  return (
    <>
      <PageHeader
        eyebrow="Visão geral"
        title="Dashboard"
        description={`Como o dinheiro se moveu em ${monthLabel.toLowerCase()}.`}
        actions={
          <>
            <MonthPicker month={month} />
            <Button asChild>
              <Link href="/transactions?nova=1">
                <Plus className="size-4" aria-hidden />
                Nova transação
              </Link>
            </Button>
          </>
        }
      />

      {!hasAnyTransaction ? (
        <EmptyState
          icon={<Wallet className="size-5" aria-hidden />}
          title="Nenhuma transação ainda"
          description="Registre a primeira receita ou despesa e o painel começa a mostrar para onde o dinheiro vai."
          action={
            <Button asChild>
              <Link href="/transactions?nova=1">
                <Plus className="size-4" aria-hidden />
                Registrar transação
              </Link>
            </Button>
          }
        />
      ) : (
        <div className="grid gap-5">
          <section className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard
              label="Saldo total"
              value={overallBalance}
              caption="Todas as transações registradas"
              tone={overallBalance < 0 ? "critical" : "neutral"}
              icon={<Wallet className="size-4" aria-hidden />}
            />
            <StatCard
              label="Receitas do mês"
              value={totals.income}
              caption={monthLabel}
              tone="income"
              icon={<ArrowUpRight className="size-4" aria-hidden />}
            />
            <StatCard
              label="Despesas do mês"
              value={totals.expenses}
              caption={monthLabel}
              tone="expense"
              icon={<ArrowDownLeft className="size-4" aria-hidden />}
            />
            <StatCard
              label="Taxa de economia"
              value={
                totals.income > 0
                  ? `${totals.savingsRate.toFixed(1).replace(".", ",")}%`
                  : "—"
              }
              caption={
                totals.income > 0
                  ? "Do que entrou, quanto sobrou"
                  : "Sem receitas neste mês"
              }
              tone={totals.savingsRate < 0 ? "critical" : "neutral"}
              icon={<PiggyBank className="size-4" aria-hidden />}
            />
          </section>

          <ChartFrame
            eyebrow="Dia a dia"
            title="O ritmo do mês"
            caption="Receitas acima da linha, despesas abaixo."
          >
            {movedThisMonth ? (
              <MonthRibbon daily={daily} />
            ) : (
              <EmptyState
                title="Nenhuma transação neste período"
                description={`Não há movimentação registrada em ${monthLabel.toLowerCase()}.`}
              />
            )}
          </ChartFrame>

          <div className="grid gap-5 lg:grid-cols-2">
            <ChartFrame
              eyebrow="Para onde foi"
              title="Despesas por categoria"
              caption={monthLabel}
            >
              {byCategory.length > 0 ? (
                <ExpensePie slices={byCategory} />
              ) : (
                <EmptyState
                  title="Nenhuma despesa neste período"
                  description="Quando houver gastos, eles aparecem divididos por categoria."
                />
              )}
            </ChartFrame>

            <ChartFrame
              eyebrow="Limites"
              title="Orçamentos"
              caption={monthLabel}
              action={
                <Button asChild variant="outline" size="sm">
                  <Link href="/settings#orcamentos">Gerenciar</Link>
                </Button>
              }
            >
              {budgets.length > 0 ? (
                <BudgetRings budgets={budgets} />
              ) : (
                <EmptyState
                  icon={<Target className="size-5" aria-hidden />}
                  title="Nenhum orçamento definido"
                  description="Defina um limite mensal por categoria para acompanhar quanto já foi gasto."
                  action={
                    <Button asChild variant="outline">
                      <Link href="/settings#orcamentos">Definir orçamento</Link>
                    </Button>
                  }
                />
              )}
            </ChartFrame>
          </div>

          <ChartFrame
            eyebrow="Ao longo do ano"
            title="Evolução mensal"
            caption="Receitas, despesas e o saldo que sobra de cada mês."
            action={
              <YearSelect year={year} years={years.ok ? years.data : [year]} />
            }
          >
            {evolution.ok ? (
              <EvolutionLine points={evolution.data} />
            ) : (
              <EmptyState title="Não foi possível carregar a evolução anual" />
            )}
          </ChartFrame>
        </div>
      )}
    </>
  );
}
