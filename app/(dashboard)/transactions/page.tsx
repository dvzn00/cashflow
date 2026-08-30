import { PageHeader, SectionPlaceholder } from "@/components/layout/page-header";

export const metadata = { title: "Transações" };

export default function TransactionsPage() {
  return (
    <>
      <PageHeader
        eyebrow="Movimentações"
        title="Transações"
        description="Registre receitas e despesas e filtre por mês, categoria e tipo."
      />
      <SectionPlaceholder>
        Tabela, filtros e modal entram no Bloco 5.
      </SectionPlaceholder>
    </>
  );
}
