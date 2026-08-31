"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { CategoryBadge } from "@/components/category-icon";
import { Field, FormError } from "@/components/forms/field";
import { ColorPicker, IconPicker } from "@/components/forms/pickers";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  createCategory,
  deleteCategory,
  updateCategory,
} from "@/lib/actions/categories";
import { CATEGORY_COLORS, CATEGORY_ICONS } from "@/lib/domain/icons";
import type { CategoryRow } from "@/types/database";

export function CategoryManager({
  categories,
  usage,
}: {
  categories: CategoryRow[];
  usage: Record<string, number>;
}) {
  const router = useRouter();
  const [editing, setEditing] = useState<CategoryRow | null>(null);
  const [creating, setCreating] = useState(false);
  const [removing, setRemoving] = useState<CategoryRow | null>(null);
  const [pending, start] = useTransition();

  return (
    <>
      <div className="flex items-center justify-between gap-4">
        <p className="text-sm text-muted-foreground">
          {categories.length}{" "}
          {categories.length === 1 ? "categoria" : "categorias"}. Uma categoria
          só pode ser excluída depois que suas transações saírem dela.
        </p>
        <Button size="sm" onClick={() => setCreating(true)}>
          <Plus className="size-4" aria-hidden />
          Nova
        </Button>
      </div>

      <ul className="mt-5 divide-y divide-border">
        {categories.map((category) => {
          const count = usage[category.id] ?? 0;
          return (
            <li key={category.id} className="flex items-center gap-3 py-3">
              <CategoryBadge name={category.icon} color={category.color} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{category.name}</p>
                <p className="text-xs text-muted-foreground">
                  {count === 0
                    ? "Sem transações"
                    : `${count} ${count === 1 ? "transação" : "transações"}`}
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="size-8"
                aria-label={`Editar ${category.name}`}
                onClick={() => setEditing(category)}
              >
                <Pencil className="size-4" aria-hidden />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="size-8 text-muted-foreground hover:text-destructive"
                aria-label={`Excluir ${category.name}`}
                onClick={() => setRemoving(category)}
              >
                <Trash2 className="size-4" aria-hidden />
              </Button>
            </li>
          );
        })}
      </ul>

      <CategoryDialog
        key={editing?.id ?? "nova"}
        category={editing ?? undefined}
        open={creating || editing !== null}
        onOpenChange={(open) => {
          if (!open) {
            setCreating(false);
            setEditing(null);
          }
        }}
      />

      <AlertDialog
        open={removing !== null}
        onOpenChange={(open) => !open && setRemoving(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Excluir {removing?.name}?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Os orçamentos dessa categoria saem junto. Isso não pode ser
              desfeito.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Manter</AlertDialogCancel>
            <AlertDialogAction
              disabled={pending}
              onClick={(event) => {
                event.preventDefault();
                const target = removing;
                if (!target) return;

                start(async () => {
                  const result = await deleteCategory(target.id);
                  if (result.ok) {
                    toast.success(`Categoria "${target.name}" excluída.`);
                    setRemoving(null);
                    router.refresh();
                  } else {
                    toast.error(result.error);
                  }
                });
              }}
            >
              {pending ? "Excluindo…" : "Excluir"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

function CategoryDialog({
  category,
  open,
  onOpenChange,
}: {
  category?: CategoryRow;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();
  const [name, setName] = useState(category?.name ?? "");
  const [icon, setIcon] = useState<string>(category?.icon ?? CATEGORY_ICONS[0]);
  const [color, setColor] = useState<string>(
    category?.color ?? CATEGORY_COLORS[0],
  );
  const [error, setError] = useState<string | null>(null);
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  const editing = Boolean(category);

  function save() {
    start(async () => {
      setError(null);
      setFieldError(null);

      const payload = { name, icon, color };
      const result = category
        ? await updateCategory(category.id, payload)
        : await createCategory(payload);

      if (result.ok) {
        toast.success(editing ? "Categoria atualizada." : "Categoria criada.");
        onOpenChange(false);
        router.refresh();
        return;
      }

      if (result.fieldErrors?.name) setFieldError(result.fieldErrors.name);
      else setError(result.error);
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[25rem]">
        <DialogHeader>
          <DialogTitle className="display text-2xl">
            {editing ? "Editar categoria" : "Nova categoria"}
          </DialogTitle>
          <DialogDescription>
            O ícone e a cor aparecem na tabela e nos gráficos.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4">
          <FormError message={error ?? undefined} />

          <Field
            name="name"
            label="Nome"
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Mercado, Aluguel, Salário…"
            maxLength={40}
            autoFocus
            error={fieldError ?? undefined}
          />

          <IconPicker value={icon} onChange={setIcon} />
          <ColorPicker value={color} onChange={setColor} />
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={save} disabled={pending || name.trim() === ""}>
            {pending ? "Salvando…" : editing ? "Salvar alterações" : "Criar categoria"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
