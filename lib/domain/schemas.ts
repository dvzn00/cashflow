import { z } from "zod";

import { isValidISODate, isValidMonthKey } from "@/lib/domain/date";
import { CATEGORY_ICONS } from "@/lib/domain/icons";
import { parseMoneyInput, roundMoney } from "@/lib/domain/money";

/** Largest amount the numeric(14,2) column accepts with room to spare. */
const MAX_AMOUNT = 999_999_999.99;

export const transactionTypeSchema = z.enum(["income", "expense"]);

/**
 * Accepts a number or a typed string ("1.234,56", "R$ 1.234,56", "1234.56")
 * and always yields a positive value rounded to cents.
 */
export const amountSchema = z
  .union([z.number(), z.string()])
  .transform((value) => parseMoneyInput(value))
  .refine((value) => Number.isFinite(value), {
    error: "Informe um valor numérico.",
  })
  .refine((value) => value > 0, {
    error: "O valor deve ser maior que zero.",
  })
  .refine((value) => value <= MAX_AMOUNT, {
    error: "Valor acima do limite permitido.",
  })
  .transform(roundMoney);

export const isoDateSchema = z
  .string()
  .trim()
  .refine(isValidISODate, { error: "Data inválida." });

export const monthKeySchema = z
  .string()
  .trim()
  .refine(isValidMonthKey, { error: "Mês inválido. Use o formato AAAA-MM." });

export const hexColorSchema = z
  .string()
  .trim()
  .toLowerCase()
  .regex(/^#[0-9a-f]{6}$/, { error: "Use uma cor no formato #RRGGBB." });

export const categoryIconSchema = z.enum(CATEGORY_ICONS, {
  error: "Ícone inválido.",
});

/** Trims, and turns an empty field into null rather than an empty string. */
const optionalText = (max: number, label: string) =>
  z
    .string()
    .trim()
    .max(max, { error: `${label} deve ter no máximo ${max} caracteres.` })
    .transform((value) => (value === "" ? null : value))
    .nullish()
    .transform((value) => value ?? null);

// ---------------------------------------------------------------------------
// Entities
// ---------------------------------------------------------------------------

export const transactionSchema = z.object({
  type: transactionTypeSchema,
  amount: amountSchema,
  category_id: z.uuid({ error: "Selecione uma categoria." }),
  date: isoDateSchema,
  description: optionalText(140, "A descrição"),
});

export const categorySchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, { error: "Informe um nome para a categoria." })
    .max(40, { error: "O nome deve ter no máximo 40 caracteres." }),
  icon: categoryIconSchema,
  color: hexColorSchema,
});

export const budgetSchema = z.object({
  category_id: z.uuid({ error: "Selecione uma categoria." }),
  month: monthKeySchema,
  amount: amountSchema,
});

export const profileSchema = z.object({
  full_name: z
    .string()
    .trim()
    .min(1, { error: "Informe seu nome." })
    .max(80, { error: "O nome deve ter no máximo 80 caracteres." }),
});

// ---------------------------------------------------------------------------
// Auth
// ---------------------------------------------------------------------------

const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .pipe(z.email({ error: "Informe um e-mail válido." }));

export const signInSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, { error: "Informe sua senha." }),
});

export const signUpSchema = z.object({
  full_name: profileSchema.shape.full_name,
  email: emailSchema,
  password: z
    .string()
    .min(8, { error: "A senha deve ter pelo menos 8 caracteres." })
    .max(72, { error: "A senha deve ter no máximo 72 caracteres." }),
});

// ---------------------------------------------------------------------------
// Queries
// ---------------------------------------------------------------------------

export const transactionFiltersSchema = z.object({
  month: monthKeySchema.optional(),
  categoryId: z.uuid().optional(),
  type: transactionTypeSchema.optional(),
  search: optionalText(80, "A busca").optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

// ---------------------------------------------------------------------------
// Inferred types
// ---------------------------------------------------------------------------

export type TransactionInput = z.infer<typeof transactionSchema>;
export type CategoryInput = z.infer<typeof categorySchema>;
export type BudgetInput = z.infer<typeof budgetSchema>;
export type ProfileInput = z.infer<typeof profileSchema>;
export type SignInInput = z.infer<typeof signInSchema>;
export type SignUpInput = z.infer<typeof signUpSchema>;
export type TransactionFilters = z.infer<typeof transactionFiltersSchema>;
