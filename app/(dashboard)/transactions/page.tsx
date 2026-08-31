import Link from "next/link";

import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/layout/page-header";
import { Money } from "@/components/money";
import { TransactionFilters } from "@/components/transactions/transaction-filters";
import { TransactionTable } from "@/components/transactions/transaction-table";
import { Button } from "@/components/ui/button";
import { getCategories } from "@/lib/actions/categories";
import { getTransactions } from "@/lib/actions/transactions";
import { calculateMonthlyTotals } from "@/lib/domain/calculations";
import { currentMonthKey, formatMonthLabel, isValidMonthKey } from "@/lib/domain/date";

export const metadata = { title: "Transações" };

const PAGE_SIZE = 20;

export default async function TransactionsPage({
  searchParams,
}: PageProps<"/transactions">) {
  const params = await searchParams;

  const requestedMonth = typeof params.mes === "string" ? params.mes : "";
  const month = isValidMonthKey(requestedMonth) ? requestedMonth : currentMonthKey();

  const categoryId = typeof params.categoria === "string" ? params.categoria : undefined;
  const type =
    params.tipo === "income" || params.tipo === "expense" ? params.tipo : undefined;

  const requestedPage = Number(typeof params.pagina === "string" ? params.pagina : 1);
  const page = Number.isInteger(requestedPage) && requestedPage > 0 ? requestedPage : 1;

  const [result, categoriesResult] = await Promise.all([
    getTransactions({ month, categoryId, type, page, pageSize: PAGE_SIZE }),
    getCategories(),
  ]);

  const categories = categoriesResult.ok ? categoriesResult.data : [];
  const monthLabel = formatMonthLabel(month);

  if (!result.ok) {
    return (
      <>
        <PageHeader eyebrow="Movimentações" title="Transações" />
        <EmptyState title="Não foi possível carregar" description={result.error} />
      </>
    );
  }

  const { items, total, pageCount } = result.data;
  const totals = calculateMonthlyTotals(items, month);

  return (
    <>
      <PageHeader
        eyebrow="Movimentações"
        title="Transações"
        description={`${total} ${total === 1 ? "lançamento" : "lançamentos"} em ${monthLabel.toLowerCase()}.`}
      />

      {categories.length === 0 ? (
        <EmptyState
          title="Crie uma categoria primeiro"
          description="Toda transação pertence a uma categoria. Crie a primeira nas Configurações."
          action={
            <Button asChild>
              <Link href="/settings#categorias">Ir para categorias</Link>
            </Button>
          }
        />
      ) : (
        <>
          <TransactionTable
            transactions={items}
            categories={categories}
            filters={
              <TransactionFilters
                month={month}
                categoryId={categoryId}
                type={type}
                categories={categories}
              />
            }
            emptyDescription={
              categoryId || type
                ? "Nenhum lançamento corresponde aos filtros. Tente limpá-los."
                : `Não há movimentação registrada em ${monthLabel.toLowerCase()}.`
            }
          />

          {items.length > 0 ? (
            <div className="mt-4 flex flex-col-reverse items-start justify-between gap-4 sm:flex-row sm:items-center">
              <p className="text-sm text-muted-foreground">
                {pageCount > 1 ? `Página ${page} de ${pageCount} · ` : null}
                Nesta página:{" "}
                <Money value={totals.income} type="income" className="font-medium" /> em
                receitas e{" "}
                <Money value={totals.expenses} type="expense" className="font-medium" /> em
                despesas
              </p>

              {pageCount > 1 ? (
                <Pagination
                  page={page}
                  pageCount={pageCount}
                  month={month}
                  categoryId={categoryId}
                  type={type}
                />
              ) : null}
            </div>
          ) : null}
        </>
      )}
    </>
  );
}

function Pagination({
  page,
  pageCount,
  month,
  categoryId,
  type,
}: {
  page: number;
  pageCount: number;
  month: string;
  categoryId?: string;
  type?: string;
}) {
  const href = (target: number) => {
    const params = new URLSearchParams({ mes: month, pagina: String(target) });
    if (categoryId) params.set("categoria", categoryId);
    if (type) params.set("tipo", type);
    return `/transactions?${params}`;
  };

  return (
    <nav className="flex items-center gap-2" aria-label="Paginação">
      <Button asChild={page > 1} variant="outline" size="sm" disabled={page <= 1}>
        {page > 1 ? <Link href={href(page - 1)}>Anterior</Link> : <span>Anterior</span>}
      </Button>
      <Button
        asChild={page < pageCount}
        variant="outline"
        size="sm"
        disabled={page >= pageCount}
      >
        {page < pageCount ? (
          <Link href={href(page + 1)}>Próxima</Link>
        ) : (
          <span>Próxima</span>
        )}
      </Button>
    </nav>
  );
}
