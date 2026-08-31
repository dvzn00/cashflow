"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Check, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { CategoryBadge } from "@/components/category-icon";
import { Money } from "@/components/money";
import { MonthPicker } from "@/components/month-picker";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { deleteBudget, upsertBudget } from "@/lib/actions/budgets";
import type { BudgetWithCategory } from "@/lib/actions/types";
import { formatMonthLabel } from "@/lib/domain/date";
import { formatAmountInput } from "@/lib/domain/money";
import type { CategoryRow } from "@/types/database";

/**
 * One row per category, each with the month's limit. Editing in place beats a
 * modal here: the point is comparing limits across categories, and a dialog
 * would hide the very list being tuned.
 */
export function BudgetManager({
  month,
  categories,
  budgets,
}: {
  month: string;
  categories: CategoryRow[];
  budgets: BudgetWithCategory[];
}) {
  const byCategory = new Map(budgets.map((budget) => [budget.categoryId, budget]));

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <p className="text-sm text-muted-foreground">
          Limites de{" "}
          <span className="text-foreground">{formatMonthLabel(month)}</span>.
          Cada mês tem os seus.
        </p>
        <MonthPicker month={month} />
      </div>

      {categories.length === 0 ? (
        <p className="mt-5 text-sm text-muted-foreground">
          Crie uma categoria antes de definir orçamentos.
        </p>
      ) : (
        <ul className="mt-5 divide-y divide-border">
          {categories.map((category) => (
            <BudgetRow
              key={category.id}
              month={month}
              category={category}
              budget={byCategory.get(category.id)}
            />
          ))}
        </ul>
      )}
    </>
  );
}

function BudgetRow({
  month,
  category,
  budget,
}: {
  month: string;
  category: CategoryRow;
  budget?: BudgetWithCategory;
}) {
  const router = useRouter();
  const stored = budget ? formatAmountInput(budget.limit) : "";
  const [value, setValue] = useState(stored);
  const [pending, start] = useTransition();

  const dirty = value.trim() !== stored;
  const canSave = dirty && value.trim() !== "";

  function save() {
    start(async () => {
      const result = await upsertBudget({
        category_id: category.id,
        month,
        amount: value,
      });

      if (result.ok) {
        toast.success(`Orçamento de ${category.name} salvo.`);
        router.refresh();
      } else {
        toast.error(result.fieldErrors?.amount ?? result.error);
      }
    });
  }

  function remove() {
    if (!budget) return;
    start(async () => {
      const result = await deleteBudget(budget.id);
      if (result.ok) {
        setValue("");
        toast.success(`Orçamento de ${category.name} removido.`);
        router.refresh();
      } else {
        toast.error(result.error);
      }
    });
  }

  const inputId = `orcamento-${category.id}`;

  return (
    <li className="flex flex-wrap items-center gap-3 py-3">
      <CategoryBadge name={category.icon} color={category.color} />

      <div className="min-w-0 flex-1">
        <label htmlFor={inputId} className="block truncate text-sm font-medium">
          {category.name}
        </label>
        {budget ? (
          <p className="text-xs text-muted-foreground">
            <Money value={budget.spent} className="tabular" /> gastos ·{" "}
            {Math.round(budget.percent)}% do limite
          </p>
        ) : (
          <p className="text-xs text-muted-foreground">Sem limite definido</p>
        )}
      </div>

      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground">R$</span>
        <Input
          id={inputId}
          value={value}
          inputMode="decimal"
          placeholder="0,00"
          className="tabular h-9 w-28 text-right"
          onChange={(event) => setValue(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter" && canSave) save();
          }}
        />

        {/* Quiet until there is something to save, so the row never looks
            like it has a pending action when it does not. */}
        <Button
          size="icon"
          variant={canSave ? "default" : "ghost"}
          className="size-9"
          disabled={pending || !canSave}
          onClick={save}
          aria-label={`Salvar orçamento de ${category.name}`}
        >
          <Check className="size-4" aria-hidden />
        </Button>

        <Button
          variant="ghost"
          size="icon"
          className="size-9 text-muted-foreground hover:text-destructive"
          disabled={pending || !budget}
          onClick={remove}
          aria-label={`Remover orçamento de ${category.name}`}
        >
          <Trash2 className="size-4" aria-hidden />
        </Button>
      </div>
    </li>
  );
}
