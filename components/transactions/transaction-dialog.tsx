"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Plus, X } from "lucide-react";
import { toast } from "sonner";

import { CategoryIcon } from "@/components/category-icon";
import { Field, FormError, SubmitButton } from "@/components/forms/field";
import { ColorPicker, IconPicker } from "@/components/forms/pickers";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createCategory } from "@/lib/actions/categories";
import { saveTransactionForm, type FormState } from "@/lib/actions/forms";
import type { TransactionWithCategory } from "@/lib/actions/types";
import { CATEGORY_COLORS, CATEGORY_ICONS } from "@/lib/domain/icons";
import { todayISO } from "@/lib/domain/date";
import { formatAmountInput } from "@/lib/domain/money";
import type { CategoryRow, TransactionType } from "@/types/database";
import { cn } from "@/lib/utils";

export function TransactionDialog({
  categories,
  transaction,
  open,
  onOpenChange,
}: {
  categories: CategoryRow[];
  transaction?: TransactionWithCategory;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();

  const [state, setState] = useState<FormState<{ id: string }>>(null);
  const [type, setType] = useState<TransactionType>(transaction?.type ?? "expense");
  const [categoryId, setCategoryId] = useState(transaction?.category_id ?? "");
  const [creatingCategory, setCreatingCategory] = useState(false);

  /*
   * Reset when the dialog opens. Adjusting state during render is React's
   * documented answer to "a prop changed"; an effect would paint the previous
   * transaction's values once before correcting them.
   */
  const [wasOpen, setWasOpen] = useState(open);
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) {
      setState(null);
      setType(transaction?.type ?? "expense");
      setCategoryId(transaction?.category_id ?? "");
      setCreatingCategory(false);
    }
  }

  const editing = Boolean(transaction);
  const fieldErrors = state && !state.ok ? state.fieldErrors : undefined;

  /*
   * Submitting through a plain form action rather than useActionState, so
   * success is handled in the same turn as the result. Closing from an effect
   * would mean reacting to state instead of to what just happened.
   */
  async function handleSubmit(formData: FormData) {
    const result = await saveTransactionForm(null, formData);
    setState(result);

    if (result?.ok) {
      toast.success(editing ? "Transação atualizada." : "Transação registrada.");
      onOpenChange(false);
      router.refresh();
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[27rem]">
        <DialogHeader>
          <DialogTitle className="display text-2xl">
            {editing ? "Editar transação" : "Nova transação"}
          </DialogTitle>
          <DialogDescription>
            {editing
              ? "Altere o que precisar e salve."
              : "Registre uma entrada ou uma saída."}
          </DialogDescription>
        </DialogHeader>

        <form action={handleSubmit} className="grid gap-4" noValidate>
          {transaction ? (
            <input type="hidden" name="id" value={transaction.id} />
          ) : null}
          <input type="hidden" name="type" value={type} />
          <input type="hidden" name="category_id" value={categoryId} />

          <FormError message={state && !state.ok ? state.error : undefined} />

          <TypeToggle value={type} onChange={setType} />

          <Field
            name="amount"
            label="Valor"
            inputMode="decimal"
            placeholder="0,00"
            defaultValue={transaction ? formatAmountInput(transaction.amount) : ""}
            autoFocus
            required
            error={fieldErrors?.amount}
          />

          <div className="grid gap-1.5">
            <div className="flex items-center justify-between">
              <Label htmlFor="categoria">Categoria</Label>
              <button
                type="button"
                onClick={() => setCreatingCategory((value) => !value)}
                className="flex items-center gap-1 text-xs font-medium text-primary hover:underline"
              >
                {creatingCategory ? (
                  <>
                    <X className="size-3" aria-hidden /> Cancelar
                  </>
                ) : (
                  <>
                    <Plus className="size-3" aria-hidden /> Criar categoria
                  </>
                )}
              </button>
            </div>

            {creatingCategory ? (
              <InlineCategoryForm
                onCreated={(category) => {
                  setCategoryId(category.id);
                  setCreatingCategory(false);
                  router.refresh();
                }}
              />
            ) : (
              <Select value={categoryId} onValueChange={setCategoryId}>
                <SelectTrigger
                  id="categoria"
                  aria-invalid={fieldErrors?.category_id ? true : undefined}
                >
                  <SelectValue placeholder="Escolha uma categoria" />
                </SelectTrigger>
                <SelectContent>
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
            )}

            {fieldErrors?.category_id ? (
              <p className="text-xs font-medium text-destructive">
                {fieldErrors.category_id}
              </p>
            ) : null}
          </div>

          <Field
            name="date"
            label="Data"
            type="date"
            defaultValue={transaction?.date ?? todayISO()}
            required
            error={fieldErrors?.date}
          />

          <Field
            name="description"
            label="Descrição"
            placeholder="Opcional"
            maxLength={140}
            defaultValue={transaction?.description ?? ""}
            error={fieldErrors?.description}
          />

          <DialogFooter className="mt-1">
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <SubmitButton pendingLabel="Salvando…">
              {editing ? "Salvar alterações" : "Registrar"}
            </SubmitButton>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

/** Two actions, not a checkbox: the choice colours the whole row afterwards. */
function TypeToggle({
  value,
  onChange,
}: {
  value: TransactionType;
  onChange: (value: TransactionType) => void;
}) {
  const options = [
    {
      value: "expense" as const,
      label: "Despesa",
      active: "bg-expense text-white dark:text-background",
    },
    {
      value: "income" as const,
      label: "Receita",
      active: "bg-income text-white dark:text-background",
    },
  ];

  return (
    <div className="grid gap-1.5">
      <Label asChild>
        <span>Tipo</span>
      </Label>
      <div
        role="group"
        aria-label="Tipo de transação"
        className="grid grid-cols-2 gap-1 rounded-lg border border-border bg-surface p-1"
      >
        {options.map((option) => (
          <button
            key={option.value}
            type="button"
            aria-pressed={value === option.value}
            onClick={() => onChange(option.value)}
            className={cn(
              "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
              value === option.value
                ? option.active
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
}

/** Create a category without losing the transaction being written. */
function InlineCategoryForm({
  onCreated,
}: {
  onCreated: (category: CategoryRow) => void;
}) {
  const [pending, start] = useTransition();
  const [name, setName] = useState("");
  const [icon, setIcon] = useState<string>(CATEGORY_ICONS[0]);
  const [color, setColor] = useState<string>(CATEGORY_COLORS[0]);
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="grid gap-3 rounded-lg border border-border bg-surface p-3">
      <Field
        name="nova_categoria"
        label="Nome da categoria"
        value={name}
        onChange={(event) => setName(event.target.value)}
        placeholder="Mercado, Aluguel, Salário…"
        maxLength={40}
        error={error ?? undefined}
      />

      <IconPicker value={icon} onChange={setIcon} />
      <ColorPicker value={color} onChange={setColor} />

      <Button
        type="button"
        size="sm"
        disabled={pending || name.trim() === ""}
        onClick={() =>
          start(async () => {
            setError(null);
            const result = await createCategory({ name, icon, color });
            if (result.ok) {
              toast.success(`Categoria "${result.data.name}" criada.`);
              onCreated(result.data);
            } else {
              setError(result.fieldErrors?.name ?? result.error);
            }
          })
        }
      >
        {pending ? "Criando…" : "Criar e usar"}
      </Button>
    </div>
  );
}
