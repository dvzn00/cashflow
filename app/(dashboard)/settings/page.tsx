import { PageHeader, SectionPlaceholder } from "@/components/layout/page-header";

export const metadata = { title: "Configurações" };

export default function SettingsPage() {
  return (
    <>
      <PageHeader
        eyebrow="Preferências"
        title="Configurações"
        description="Categorias, orçamentos mensais, perfil e tema."
      />
      <SectionPlaceholder>
        Gestão de categorias, orçamentos e perfil entram no Bloco 5.
      </SectionPlaceholder>
    </>
  );
}
