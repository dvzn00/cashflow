"use client";

import { useState } from "react";
import { Menu } from "lucide-react";

import { BrandLockup } from "@/components/layout/brand";
import { SidebarNav } from "@/components/layout/sidebar-nav";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

export function MobileNav({ footer }: { footer?: React.ReactNode }) {
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" aria-label="Abrir navegação">
          <Menu className="size-5" aria-hidden />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-[280px] bg-sidebar p-0">
        <SheetHeader className="px-5 pt-5 pb-2">
          <SheetTitle className="text-left">
            <BrandLockup />
          </SheetTitle>
        </SheetHeader>
        <div className="px-3">
          <SidebarNav onNavigate={() => setOpen(false)} />
        </div>
        <div className="mt-auto flex flex-col gap-4 border-t border-sidebar-border px-5 py-4">
          <ThemeToggle />
          {footer}
        </div>
      </SheetContent>
    </Sheet>
  );
}
