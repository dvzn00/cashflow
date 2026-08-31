"use server";

import { redirect } from "next/navigation";

import { signIn, signUp, type SignUpOutcome } from "@/lib/actions/auth";
import {
  createCategory,
  deleteCategory,
  updateCategory,
} from "@/lib/actions/categories";
import { deleteBudget, upsertBudget } from "@/lib/actions/budgets";
import {
  completeOnboarding,
  skipOnboarding,
  updateProfile,
} from "@/lib/actions/profile";
import {
  createTransaction,
  deleteTransaction,
  updateTransaction,
} from "@/lib/actions/transactions";
import { failure, type ActionResult } from "@/lib/actions/types";

/**
 * Adapters for `useActionState`, which hands the action `(previous, formData)`.
 * Keeping them apart from the actions themselves means the actions stay
 * callable with plain objects — from tests, from other actions, from the PDF
 * route — instead of only from a form.
 */

export type FormState<T = undefined> = ActionResult<T> | null;

const text = (form: FormData, key: string) => {
  const value = form.get(key);
  return typeof value === "string" ? value : "";
};

/** Only same-site paths, so ?next= cannot bounce someone off the app. */
function safeNext(value: string, fallback: string) {
  return value.startsWith("/") && !value.startsWith("//") ? value : fallback;
}

// ---------------------------------------------------------------- auth ------

export async function signInForm(
  _previous: FormState,
  form: FormData,
): Promise<FormState> {
  const result = await signIn({
    email: text(form, "email"),
    password: text(form, "password"),
  });

  if (!result.ok) return result;
  redirect(safeNext(text(form, "next"), "/"));
}

export async function signUpForm(
  _previous: FormState<SignUpOutcome>,
  form: FormData,
): Promise<FormState<SignUpOutcome>> {
  const result = await signUp({
    full_name: text(form, "full_name"),
    email: text(form, "email"),
    password: text(form, "password"),
  });

  // A session means confirmation is off; go straight to the first-run flow.
  if (result.ok && result.data.signedIn) redirect("/onboarding");
  return result;
}

// -------------------------------------------------------- transactions ------

export async function saveTransactionForm(
  _previous: FormState<{ id: string }>,
  form: FormData,
): Promise<FormState<{ id: string }>> {
  const payload = {
    type: text(form, "type"),
    amount: text(form, "amount"),
    category_id: text(form, "category_id"),
    date: text(form, "date"),
    description: text(form, "description"),
  };

  const id = text(form, "id");
  return id ? updateTransaction(id, payload) : createTransaction(payload);
}

export async function deleteTransactionForm(
  _previous: FormState,
  form: FormData,
): Promise<FormState> {
  const id = text(form, "id");
  if (!id) return failure("Transação não informada.");
  return deleteTransaction(id);
}

// ----------------------------------------------------------- categories -----

export async function saveCategoryForm(
  _previous: FormState<unknown>,
  form: FormData,
): Promise<FormState<unknown>> {
  const payload = {
    name: text(form, "name"),
    icon: text(form, "icon"),
    color: text(form, "color"),
  };

  const id = text(form, "id");
  return id ? updateCategory(id, payload) : createCategory(payload);
}

export async function deleteCategoryForm(
  _previous: FormState,
  form: FormData,
): Promise<FormState> {
  const id = text(form, "id");
  if (!id) return failure("Categoria não informada.");
  return deleteCategory(id);
}

// -------------------------------------------------------------- budgets -----

export async function saveBudgetForm(
  _previous: FormState<{ id: string }>,
  form: FormData,
): Promise<FormState<{ id: string }>> {
  return upsertBudget({
    category_id: text(form, "category_id"),
    month: text(form, "month"),
    amount: text(form, "amount"),
  });
}

export async function deleteBudgetForm(
  _previous: FormState,
  form: FormData,
): Promise<FormState> {
  const id = text(form, "id");
  if (!id) return failure("Orçamento não informado.");
  return deleteBudget(id);
}

// -------------------------------------------------------------- profile -----

export async function updateProfileForm(
  _previous: FormState<unknown>,
  form: FormData,
): Promise<FormState<unknown>> {
  return updateProfile({ full_name: text(form, "full_name") });
}

export async function completeOnboardingForm(
  _previous: FormState,
  form: FormData,
): Promise<FormState> {
  const picked = form.getAll("categories").filter((v): v is string => typeof v === "string");

  const categories = picked
    .map((raw) => {
      try {
        return JSON.parse(raw) as { name: string; icon: string; color: string };
      } catch {
        return null;
      }
    })
    .filter((value): value is { name: string; icon: string; color: string } => value !== null);

  const result = await completeOnboarding({
    full_name: text(form, "full_name"),
    categories,
  });

  if (!result.ok) return result;
  redirect("/");
}

export async function skipOnboardingForm(): Promise<void> {
  await skipOnboarding();
  redirect("/");
}
