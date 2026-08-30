import { PageHeader, SectionPlaceholder } from "@/components/layout/page-header";

export default function DashboardPage() {
  return (
    <>
      <PageHeader
        eyebrow="Visão geral"
        title="Dashboard"
        description="Saldo, receitas, despesas e orçamentos do período."
      />
      <SectionPlaceholder>
        Indicadores e gráficos entram no Bloco 5.
      </SectionPlaceholder>
    </>
  );
}
