import { FileText } from "lucide-react";

import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/layout/page-header";
import { Money } from "@/components/money";
import { MonthPicker } from "@/components/month-picker";
import { ExportButton } from "@/components/reports/export-button";
import { getBudgets } from "@/lib/actions/budgets";
import { getTransactionsForMonth } from "@/lib/actions/transactions";
import { calculateMonthlyTotals } from "@/lib/domain/calculations";
import { currentMonthKey, formatMonthLabel, isValidMonthKey } from "@/lib/domain/date";

export const metadata = { title: "Relatórios" };

export default async function ReportsPage({ searchParams }: PageProps<"/reports">) {
  const params = await searchParams;
  const requested = typeof params.mes === "string" ? params.mes : "";
  const month = isValidMonthKey(requested) ? requested : currentMonthKey();

  const [transactionsResult, budgetsResult] = await Promise.all([
    getTransactionsForMonth(month),
    getBudgets(month),
  ]);

  const transactions = transactionsResult.ok ? transactionsResult.data : [];
  const budgets = budgetsResult.ok ? budgetsResult.data : [];
  const totals = calculateMonthlyTotals(transactions, month);
  const monthLabel = formatMonthLabel(month);
  const isEmpty = transactions.length === 0;

  return (
    <>
      <PageHeader
        eyebrow="Extratos"
        title="Relatórios"
        description="Escolha o período e leve o extrato em PDF."
        actions={<MonthPicker month={month} />}
      />

      <div className="rounded-xl border border-border bg-card p-6">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <p className="eyebrow">Extrato mensal</p>
            <h2 className="display mt-1 text-3xl leading-none">
              {monthLabel}
            </h2>
            <p className="mt-3 text-sm text-muted-foreground">
              {isEmpty
                ? "Nenhuma transação neste período."
                : `${transactions.length} ${transactions.length === 1 ? "lançamento" : "lançamentos"}${budgets.length > 0 ? ` e ${budgets.length} ${budgets.length === 1 ? "orçamento" : "orçamentos"}` : ""}.`}
            </p>
          </div>

          <ExportButton month={month} disabled={isEmpty} />
        </div>

        {isEmpty ? (
          <EmptyState
            className="mt-6"
            icon={<FileText className="size-5" aria-hidden />}
            title="Nada para exportar neste mês"
            description={`Registre lançamentos em ${monthLabel.toLowerCase()} ou escolha outro período.`}
          />
        ) : (
          <>
            <dl className="mt-6 grid gap-4 border-t border-border pt-6 sm:grid-cols-3">
              <Summary label="Receitas">
                <Money value={totals.income} type="income" />
              </Summary>
              <Summary label="Despesas">
                <Money value={totals.expenses} type="expense" />
              </Summary>
              <Summary label="Saldo do mês">
                <Money
                  value={totals.balance}
                  className={totals.balance < 0 ? "text-destructive" : undefined}
                />
              </Summary>
            </dl>

            <p className="mt-6 text-xs text-muted-foreground">
              O PDF traz o resumo acima, o andamento dos orçamentos e a lista
              completa de lançamentos do período, com data, categoria, descrição
              e valor.
            </p>
          </>
        )}
      </div>
    </>
  );
}

function Summary({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <dt className="eyebrow">{label}</dt>
      <dd className="mt-1.5 text-xl font-semibold">{children}</dd>
    </div>
  );
}
