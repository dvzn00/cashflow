import { PageHeader } from "@/components/layout/page-header";
import { BudgetManager } from "@/components/settings/budget-manager";
import { CategoryManager } from "@/components/settings/category-manager";
import { ProfileForm } from "@/components/settings/profile-form";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { getBudgets } from "@/lib/actions/budgets";
import { getCategories, getCategoryUsage } from "@/lib/actions/categories";
import { getProfile } from "@/lib/actions/profile";
import { currentMonthKey, isValidMonthKey } from "@/lib/domain/date";
import { getUser } from "@/lib/supabase/server";

export const metadata = { title: "Configurações" };

export default async function SettingsPage({
  searchParams,
}: PageProps<"/settings">) {
  const params = await searchParams;
  const requested = typeof params.mes === "string" ? params.mes : "";
  const month = isValidMonthKey(requested) ? requested : currentMonthKey();

  const [user, categoriesResult, usageResult, budgetsResult, profileResult] =
    await Promise.all([
      getUser(),
      getCategories(),
      getCategoryUsage(),
      getBudgets(month),
      getProfile(),
    ]);

  const categories = categoriesResult.ok ? categoriesResult.data : [];
  const usage = usageResult.ok ? usageResult.data : {};
  const budgets = budgetsResult.ok ? budgetsResult.data : [];

  const fullName =
    (profileResult.ok ? profileResult.data?.full_name : null) ??
    (user?.user_metadata?.full_name as string | undefined) ??
    "";

  return (
    <>
      <PageHeader
        eyebrow="Preferências"
        title="Configurações"
        description="Categorias, orçamentos, perfil e aparência."
      />

      <div className="grid gap-5">
        <Section
          id="categorias"
          eyebrow="Organização"
          title="Categorias"
          description="Como suas transações são agrupadas nos gráficos e no extrato."
        >
          <CategoryManager categories={categories} usage={usage} />
        </Section>

        <Section
          id="orcamentos"
          eyebrow="Limites"
          title="Orçamentos mensais"
          description="Quanto você pretende gastar em cada categoria no mês."
        >
          <BudgetManager month={month} categories={categories} budgets={budgets} />
        </Section>

        <Section id="perfil" eyebrow="Conta" title="Perfil">
          <ProfileForm fullName={fullName} email={user?.email ?? ""} />
        </Section>

        <Section
          id="aparencia"
          eyebrow="Interface"
          title="Aparência"
          description="A escolha fica salva neste navegador."
        >
          <div className="flex items-center gap-4">
            <ThemeToggle />
            <p className="text-sm text-muted-foreground">Tema claro ou escuro</p>
          </div>
        </Section>
      </div>
    </>
  );
}

function Section({
  id,
  eyebrow,
  title,
  description,
  children,
}: {
  id: string;
  eyebrow: string;
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section
      id={id}
      className="scroll-mt-24 rounded-xl border border-border bg-card p-5 sm:p-6"
    >
      <header className="mb-5">
        <p className="eyebrow">{eyebrow}</p>
        <h2 className="mt-1 text-lg font-semibold tracking-tight">{title}</h2>
        {description ? (
          <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        ) : null}
      </header>
      {children}
    </section>
  );
}
