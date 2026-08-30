"use client";

import { useTheme } from "next-themes";
import { Moon, Sun } from "lucide-react";

import { cn } from "@/lib/utils";

/**
 * Two actions rather than a stateful toggle: the active segment is derived
 * from the `.dark` class on <html>, so it paints correctly on first render
 * with no mounted-flag flash and no hydration mismatch.
 */
export function ThemeToggle({ className }: { className?: string }) {
  const { setTheme } = useTheme();

  const base =
    "flex size-7 items-center justify-center rounded-full transition-colors";

  return (
    <div
      className={cn(
        "inline-flex items-center gap-0.5 rounded-full border border-border bg-surface p-0.5",
        className,
      )}
    >
      <button
        type="button"
        onClick={() => setTheme("light")}
        aria-label="Usar tema claro"
        className={cn(
          base,
          "bg-card text-foreground shadow-sm",
          "dark:bg-transparent dark:text-muted-foreground dark:shadow-none dark:hover:text-foreground",
        )}
      >
        <Sun className="size-3.5" aria-hidden />
      </button>
      <button
        type="button"
        onClick={() => setTheme("dark")}
        aria-label="Usar tema escuro"
        className={cn(
          base,
          "text-muted-foreground hover:text-foreground",
          "dark:bg-card dark:text-foreground dark:shadow-sm dark:hover:text-foreground",
        )}
      >
        <Moon className="size-3.5" aria-hidden />
      </button>
    </div>
  );
}
