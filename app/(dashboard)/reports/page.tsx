import { PageHeader, SectionPlaceholder } from "@/components/layout/page-header";

export const metadata = { title: "Relatórios" };

export default function ReportsPage() {
  return (
    <>
      <PageHeader
        eyebrow="Extratos"
        title="Relatórios"
        description="Gere o extrato mensal em PDF."
      />
      <SectionPlaceholder>
        Seletor de período e exportação entram no Bloco 5.
      </SectionPlaceholder>
    </>
  );
}
