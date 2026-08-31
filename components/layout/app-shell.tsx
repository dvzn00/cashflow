import { LogOut } from "lucide-react";

import { BrandLockup } from "@/components/layout/brand";
import { MobileNav } from "@/components/layout/mobile-nav";
import { SidebarNav } from "@/components/layout/sidebar-nav";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { signOut } from "@/lib/actions/auth";

function SignOutButton() {
  return (
    <form action={signOut}>
      <button
        type="submit"
        className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-sidebar-accent/60 hover:text-foreground"
      >
        <LogOut className="size-[18px] shrink-0" aria-hidden />
        Sair
      </button>
    </form>
  );
}

function AccountBlock({ name, email }: { name: string; email: string }) {
  return (
    <div className="flex items-center gap-3 rounded-lg px-3 py-2">
      <span
        aria-hidden
        className="flex size-8 shrink-0 items-center justify-center rounded-full border border-border bg-surface text-xs font-semibold text-foreground"
      >
        {name.slice(0, 1).toUpperCase()}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-medium">{name}</span>
        <span className="block truncate text-xs text-muted-foreground">
          {email}
        </span>
      </span>
    </div>
  );
}

export function AppShell({
  name,
  email,
  children,
}: {
  name: string;
  email: string;
  children: React.ReactNode;
}) {
  const account = (
    <>
      <AccountBlock name={name} email={email} />
      <SignOutButton />
    </>
  );

  return (
    <div className="min-h-svh">
      <a
        href="#conteudo"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-card focus:px-4 focus:py-2 focus:text-sm focus:shadow-lg"
      >
        Pular para o conteúdo
      </a>

      <aside className="fixed inset-y-0 left-0 z-30 hidden w-[264px] flex-col border-r border-sidebar-border bg-sidebar lg:flex">
        <div className="px-5 py-6">
          <BrandLockup />
        </div>
        <div className="flex-1 px-3">
          <SidebarNav />
        </div>
        <div className="flex flex-col gap-3 border-t border-sidebar-border px-3 py-4">
          <div className="px-3">
            <ThemeToggle />
          </div>
          {account}
        </div>
      </aside>

      <div className="flex min-h-svh flex-col lg:pl-[264px]">
        <header className="sticky top-0 z-20 flex items-center gap-3 border-b border-border bg-background/85 px-4 py-3 backdrop-blur-sm lg:hidden">
          <MobileNav footer={account} />
          <BrandLockup className="[&_span:last-child]:text-xl" />
        </header>

        <main
          id="conteudo"
          className="mx-auto w-full max-w-[1440px] flex-1 px-4 py-6 sm:px-6 lg:px-10 lg:py-10"
        >
          {children}
        </main>
      </div>
    </div>
  );
}
