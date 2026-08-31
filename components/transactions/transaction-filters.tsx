"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";
import { X } from "lucide-react";

import { CategoryIcon } from "@/components/category-icon";
import { MonthPicker } from "@/components/month-picker";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { CategoryRow } from "@/types/database";

const ALL = "todas";

/** Filters live in one row above the table, and every change resets to page 1. */
export function TransactionFilters({
  month,
  categoryId,
  type,
  categories,
}: {
  month: string;
  categoryId?: string;
  type?: string;
  categories: CategoryRow[];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [pending, start] = useTransition();

  const hasFilters = Boolean(categoryId || type);

  function setParam(key: string, value: string) {
    const params = new URLSearchParams(searchParams);
    if (value === ALL) params.delete(key);
    else params.set(key, value);
    params.delete("pagina");
    start(() => router.push(`${pathname}?${params}`, { scroll: false }));
  }

  return (
    <div className="flex flex-wrap items-center gap-2" data-pending={pending}>
      <MonthPicker month={month} />

      <Select
        value={categoryId ?? ALL}
        onValueChange={(value) => setParam("categoria", value)}
      >
        <SelectTrigger className="h-10 w-[11rem]" aria-label="Filtrar por categoria">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL}>Todas as categorias</SelectItem>
          {categories.map((category) => (
            <SelectItem key={category.id} value={category.id}>
              <span className="flex items-center gap-2">
                <CategoryIcon name={category.icon} className="size-3.5" />
                {category.name}
              </span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={type ?? ALL} onValueChange={(value) => setParam("tipo", value)}>
        <SelectTrigger className="h-10 w-[10.5rem]" aria-label="Filtrar por tipo">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL}>Todos os tipos</SelectItem>
          <SelectItem value="income">Só receitas</SelectItem>
          <SelectItem value="expense">Só despesas</SelectItem>
        </SelectContent>
      </Select>

      {hasFilters ? (
        <Button
          variant="ghost"
          onClick={() => {
            const params = new URLSearchParams(searchParams);
            params.delete("categoria");
            params.delete("tipo");
            params.delete("pagina");
            start(() => router.push(`${pathname}?${params}`, { scroll: false }));
          }}
        >
          <X className="size-4" aria-hidden />
          Limpar filtros
        </Button>
      ) : null}
    </div>
  );
}
