"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useTransition } from "react";
import { MoreHorizontal, Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { CategoryBadge } from "@/components/category-icon";
import { EmptyState } from "@/components/empty-state";
import { Money } from "@/components/money";
import { TransactionDialog } from "@/components/transactions/transaction-dialog";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { deleteTransaction } from "@/lib/actions/transactions";
import type { TransactionWithCategory } from "@/lib/actions/types";
import { formatDateBR } from "@/lib/domain/date";
import type { CategoryRow } from "@/types/database";

export function TransactionTable({
  transactions,
  categories,
  emptyDescription,
  filters,
}: {
  transactions: TransactionWithCategory[];
  categories: CategoryRow[];
  emptyDescription: string;
  /** Rendered on the same row as the new-transaction button. */
  filters?: React.ReactNode;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [editing, setEditing] = useState<TransactionWithCategory | null>(null);
  const [creating, setCreating] = useState(false);
  const [removing, setRemoving] = useState<TransactionWithCategory | null>(null);
  const [pending, start] = useTransition();

  // The dashboard links here with ?nova=1. Derived rather than copied into
  // state, so there is no render where the URL says open and the state says
  // closed. The parameter is dropped from the URL when the dialog closes.
  const openedByUrl = searchParams.get("nova") === "1";
  const createOpen = creating || openedByUrl;

  function setCreateOpen(open: boolean) {
    setCreating(open);

    if (!open && openedByUrl) {
      const params = new URLSearchParams(searchParams);
      params.delete("nova");
      router.replace(`/transactions${params.size ? `?${params}` : ""}`, {
        scroll: false,
      });
    }
  }

  return (
    <>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        {filters}
        <Button onClick={() => setCreating(true)}>
          <Plus className="size-4" aria-hidden />
          Nova transação
        </Button>
      </div>

      {transactions.length === 0 ? (
        <EmptyState
          title="Nenhuma transação neste período"
          description={emptyDescription}
          action={
            <Button variant="outline" onClick={() => setCreating(true)}>
              <Plus className="size-4" aria-hidden />
              Registrar transação
            </Button>
          }
        />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border bg-card">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="w-[7.5rem]">Data</TableHead>
                <TableHead className="w-[13rem]">Categoria</TableHead>
                <TableHead>Descrição</TableHead>
                <TableHead className="w-[9rem] text-right">Valor</TableHead>
                <TableHead className="w-14">
                  <span className="sr-only">Ações</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {transactions.map((transaction) => (
                <TableRow key={transaction.id}>
                  <TableCell className="tabular text-muted-foreground">
                    {formatDateBR(transaction.date)}
                  </TableCell>
                  <TableCell>
                    <span className="flex items-center gap-2.5">
                      {transaction.category ? (
                        <CategoryBadge
                          size="sm"
                          name={transaction.category.icon}
                          color={transaction.category.color}
                        />
                      ) : null}
                      <span className="truncate">
                        {transaction.category?.name ?? "Sem categoria"}
                      </span>
                    </span>
                  </TableCell>
                  <TableCell className="max-w-0 truncate text-muted-foreground">
                    {transaction.description ?? "—"}
                  </TableCell>
                  <TableCell className="text-right">
                    <Money
                      value={transaction.amount}
                      type={transaction.type}
                      signed
                      className="font-medium"
                    />
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-8"
                          aria-label={`Ações da transação de ${formatDateBR(transaction.date)}`}
                        >
                          <MoreHorizontal className="size-4" aria-hidden />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onSelect={() => setEditing(transaction)}>
                          <Pencil className="size-3.5" aria-hidden />
                          Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          variant="destructive"
                          onSelect={() => setRemoving(transaction)}
                        >
                          <Trash2 className="size-3.5" aria-hidden />
                          Excluir
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <TransactionDialog
        categories={categories}
        open={createOpen}
        onOpenChange={setCreateOpen}
      />

      {editing ? (
        <TransactionDialog
          key={editing.id}
          categories={categories}
          transaction={editing}
          open
          onOpenChange={(open) => !open && setEditing(null)}
        />
      ) : null}

      <AlertDialog
        open={removing !== null}
        onOpenChange={(open) => !open && setRemoving(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir esta transação?</AlertDialogTitle>
            <AlertDialogDescription>
              {removing
                ? `${formatDateBR(removing.date)} · ${removing.description ?? removing.category?.name ?? "Sem descrição"}. Isso não pode ser desfeito.`
                : null}
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
                  const result = await deleteTransaction(target.id);
                  if (result.ok) {
                    toast.success("Transação excluída.");
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
