/**
 * Shape of the Cashflow schema (see supabase/migrations).
 * Kept hand-written so the app compiles without a generated types step.
 */

export type TransactionType = "income" | "expense";

export interface ProfileRow {
  id: string;
  full_name: string | null;
  currency: string;
  onboarded_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface CategoryRow {
  id: string;
  user_id: string;
  name: string;
  icon: string;
  color: string;
  created_at: string;
}

export interface TransactionRow {
  id: string;
  user_id: string;
  category_id: string | null;
  type: TransactionType;
  amount: number;
  date: string;
  description: string | null;
  created_at: string;
  updated_at: string;
}

export interface BudgetRow {
  id: string;
  user_id: string;
  category_id: string;
  month: string;
  amount: number;
  created_at: string;
  updated_at: string;
}

type Table<Row, Insert, Update> = {
  Row: Row;
  Insert: Insert;
  Update: Update;
  Relationships: [];
};

export interface Database {
  public: {
    Tables: {
      profiles: Table<
        ProfileRow,
        Partial<ProfileRow> & { id: string },
        Partial<ProfileRow>
      >;
      categories: Table<
        CategoryRow,
        Omit<CategoryRow, "id" | "created_at"> & { id?: string },
        Partial<CategoryRow>
      >;
      transactions: Table<
        TransactionRow,
        Omit<TransactionRow, "id" | "created_at" | "updated_at"> & {
          id?: string;
        },
        Partial<TransactionRow>
      >;
      budgets: Table<
        BudgetRow,
        Omit<BudgetRow, "id" | "created_at" | "updated_at"> & { id?: string },
        Partial<BudgetRow>
      >;
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      transaction_type: TransactionType;
    };
    CompositeTypes: Record<string, never>;
  };
}
