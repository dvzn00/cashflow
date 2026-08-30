import { BrandLockup } from "@/components/layout/brand";
import { ThemeToggle } from "@/components/theme/theme-toggle";

export default function AuthLayout({ children }: LayoutProps<"/">) {
  return (
    <div className="grid min-h-svh lg:grid-cols-[1.05fr_1fr]">
      {/* Editorial panel — hidden on small screens, where the form is the page. */}
      <aside className="relative hidden overflow-hidden bg-sidebar p-12 lg:flex lg:flex-col lg:justify-between">
        <BrandLockup />
        <div className="relative z-10 max-w-md">
          <p className="eyebrow mb-4">Controle financeiro pessoal</p>
          <p className="display text-5xl leading-[1.05]">
            Todo mês tem um ritmo. O seu fica visível aqui.
          </p>
          <p className="mt-6 text-sm leading-relaxed text-muted-foreground">
            Registre o que entra e o que sai, defina um limite por categoria e
            acompanhe onde o dinheiro realmente vai parar.
          </p>
        </div>
        <FlowGraphic />
      </aside>

      <main className="flex flex-col">
        <div className="flex items-center justify-between p-6 lg:justify-end">
          <BrandLockup className="lg:hidden" />
          <ThemeToggle />
        </div>
        <div className="flex flex-1 items-center justify-center px-6 pb-16">
          <div className="w-full max-w-sm">{children}</div>
        </div>
      </main>
    </div>
  );
}

/** Ambient rhythm line: the brand gesture, repeated and fading out. */
function FlowGraphic() {
  return (
    <svg
      aria-hidden
      viewBox="0 0 600 260"
      preserveAspectRatio="none"
      className="pointer-events-none absolute inset-x-0 bottom-0 h-64 w-full opacity-70"
    >
      <defs>
        <linearGradient id="flow-fade" x1="0" x2="1" y1="0" y2="0">
          <stop offset="0%" stopColor="var(--primary)" stopOpacity="0.55" />
          <stop offset="60%" stopColor="var(--secondary)" stopOpacity="0.35" />
          <stop offset="100%" stopColor="var(--secondary)" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path
        d="M0 170 C 60 170 60 90 120 90 S 180 200 240 200 300 70 360 70 420 190 480 190 540 110 600 110"
        fill="none"
        stroke="url(#flow-fade)"
        strokeWidth="2"
      />
      <path
        d="M0 210 C 60 210 60 150 120 150 S 180 230 240 230 300 140 360 140 420 220 480 220 540 170 600 170"
        fill="none"
        stroke="url(#flow-fade)"
        strokeWidth="1.5"
        strokeOpacity="0.5"
      />
    </svg>
  );
}
