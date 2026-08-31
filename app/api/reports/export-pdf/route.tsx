import { NextResponse, type NextRequest } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";

import type {
  BudgetWithCategory,
  CategorySummary,
  TransactionWithCategory,
} from "@/lib/actions/types";
import {
  calculateBudgetProgress,
  calculateMonthlyTotals,
  type BudgetLike,
  type TransactionLike,
} from "@/lib/domain/calculations";
import {
  isValidMonthKey,
  monthKeyToFirstDay,
  monthKeyToLastDay,
} from "@/lib/domain/date";
import { StatementDocument } from "@/lib/pdf/statement-document";
import { createClient } from "@/lib/supabase/server";
import type { TransactionType } from "@/types/database";

// @react-pdf/renderer needs Node APIs; it cannot run on the edge runtime.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface RawTransaction {
  id: string;
  type: TransactionType;
  amount: number | string;
  date: string;
  description: string | null;
  category_id: string | null;
  category: CategorySummary | null;
}

interface RawBudget {
  id: string;
  category_id: string;
  month: string;
  amount: number | string;
  category: CategorySummary | null;
}

export async function GET(request: NextRequest) {
  const month = request.nextUrl.searchParams.get("month");

  if (!month || !isValidMonthKey(month)) {
    return NextResponse.json(
      { error: "Informe o mês no formato AAAA-MM." },
      { status: 400 },
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // A route handler answers with a status, it does not redirect to /login.
  if (!user) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }

  const first = monthKeyToFirstDay(month)!;
  const last = monthKeyToLastDay(month)!;

  const [transactionsResult, budgetsResult, profileResult] = await Promise.all([
    supabase
      .from("transactions")
      .select(
        "id, type, amount, date, description, category_id, category:categories(id, name, icon, color)",
      )
      .eq("user_id", user.id)
      .gte("date", first)
      .lte("date", last)
      .order("date", { ascending: true })
      .order("created_at", { ascending: true })
      .returns<RawTransaction[]>(),
    supabase
      .from("budgets")
      .select(
        "id, category_id, month, amount, category:categories(id, name, icon, color)",
      )
      .eq("user_id", user.id)
      .eq("month", first)
      .returns<RawBudget[]>(),
    supabase
      .from("profiles")
      .select("full_name")
      .eq("id", user.id)
      .maybeSingle<{ full_name: string | null }>(),
  ]);

  if (transactionsResult.error || budgetsResult.error) {
    return NextResponse.json(
      { error: "Não foi possível carregar os dados do período." },
      { status: 500 },
    );
  }

  const transactions: TransactionWithCategory[] = (
    transactionsResult.data ?? []
  ).map((row) => ({
    id: row.id,
    type: row.type,
    amount: Number(row.amount),
    date: row.date,
    description: row.description,
    category_id: row.category_id,
    category: row.category,
  }));

  const ledger: TransactionLike[] = transactions.map((t) => ({
    type: t.type,
    amount: t.amount,
    date: t.date,
    category_id: t.category_id,
  }));

  const budgetRows = budgetsResult.data ?? [];
  const budgetInputs: BudgetLike[] = budgetRows.map((row) => ({
    category_id: row.category_id,
    month: row.month,
    amount: Number(row.amount),
  }));

  const budgets: BudgetWithCategory[] = calculateBudgetProgress(
    ledger,
    budgetInputs,
  )
    .map((entry, index) => ({
      ...entry,
      id: budgetRows[index].id,
      category: budgetRows[index].category,
    }))
    .sort((a, b) => b.percent - a.percent);

  const ownerName =
    profileResult.data?.full_name?.trim() ||
    (user.user_metadata?.full_name as string | undefined)?.trim() ||
    user.email?.split("@")[0] ||
    "Você";

  const buffer = await renderToBuffer(
    <StatementDocument
      month={month}
      ownerName={ownerName}
      totals={calculateMonthlyTotals(ledger, month)}
      transactions={transactions}
      budgets={budgets}
      generatedAt={new Date()}
    />,
  );

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="cashflow-extrato-${month}.pdf"`,
      "Cache-Control": "no-store",
    },
  });
}
