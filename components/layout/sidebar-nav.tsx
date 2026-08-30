"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";
import { isActivePath, NAV_ITEMS } from "@/components/layout/nav-items";

export function SidebarNav({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();

  return (
    <nav aria-label="Navegação principal" className="flex flex-col gap-1">
      {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
        const active = isActivePath(pathname, href);
        return (
          <Link
            key={href}
            href={href}
            onClick={onNavigate}
            aria-current={active ? "page" : undefined}
            className={cn(
              "group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
              active
                ? "bg-sidebar-accent text-sidebar-accent-foreground"
                : "text-muted-foreground hover:bg-sidebar-accent/60 hover:text-foreground",
            )}
          >
            <span
              aria-hidden
              className={cn(
                "absolute left-0 h-5 w-[3px] rounded-r-full bg-primary transition-opacity",
                active ? "opacity-100" : "opacity-0",
              )}
            />
            <Icon
              className={cn(
                "size-[18px] shrink-0",
                active ? "text-primary" : "text-current",
              )}
              aria-hidden
            />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
