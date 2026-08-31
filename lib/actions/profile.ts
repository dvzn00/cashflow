"use server";

import { z } from "zod";

import {
  fieldErrorsFrom,
  messageFromPostgrest,
  requireUser,
  revalidateMoneyViews,
} from "@/lib/actions/helpers";
import { failure, success, type ActionResult } from "@/lib/actions/types";
import { categorySchema, profileSchema } from "@/lib/domain/schemas";
import type { ProfileRow } from "@/types/database";

export async function getProfile(): Promise<ActionResult<ProfileRow | null>> {
  const { supabase, user } = await requireUser();

  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle<ProfileRow>();

  if (error) {
    return failure(messageFromPostgrest(error, "Não foi possível carregar o perfil."));
  }

  return success(data);
}

export async function updateProfile(
  input: unknown,
): Promise<ActionResult<ProfileRow>> {
  const parsed = profileSchema.safeParse(input);
  if (!parsed.success) {
    return failure("Revise os campos destacados.", fieldErrorsFrom(parsed.error));
  }

  const { supabase, user } = await requireUser();

  const { data, error } = await supabase
    .from("profiles")
    .update({ full_name: parsed.data.full_name })
    .eq("id", user.id)
    .select("*")
    .maybeSingle<ProfileRow>();

  if (error) {
    return failure(messageFromPostgrest(error, "Não foi possível salvar o perfil."));
  }
  if (!data) return failure("Perfil não encontrado.");

  // Keep the auth metadata in step, since the shell reads the name from there
  // before the profile row is loaded.
  await supabase.auth.updateUser({ data: { full_name: parsed.data.full_name } });

  revalidateMoneyViews();
  return success(data);
}

const onboardingSchema = z.object({
  full_name: profileSchema.shape.full_name,
  categories: z.array(categorySchema).max(12).default([]),
});

/**
 * Closes the first-run flow: saves the name, creates whatever extra categories
 * were picked, and stamps `onboarded_at` so the dashboard stops redirecting.
 *
 * Currency is fixed at BRL by product decision, so it is not asked for.
 */
export async function completeOnboarding(
  input: unknown,
): Promise<ActionResult<undefined>> {
  const parsed = onboardingSchema.safeParse(input);
  if (!parsed.success) {
    return failure("Revise os campos destacados.", fieldErrorsFrom(parsed.error));
  }

  const { supabase, user } = await requireUser();

  if (parsed.data.categories.length > 0) {
    // Uniqueness is enforced by an expression index on lower(btrim(name)),
    // which PostgREST cannot use as an upsert target — so filter first.
    // A name the user already has is not an error here: the two default
    // categories exist before this screen is ever shown.
    const { data: existing } = await supabase
      .from("categories")
      .select("name")
      .eq("user_id", user.id)
      .returns<Array<{ name: string }>>();

    const taken = new Set(
      (existing ?? []).map((category) => category.name.trim().toLowerCase()),
    );

    const rows = parsed.data.categories
      .filter((category) => !taken.has(category.name.trim().toLowerCase()))
      .map((category) => ({ ...category, user_id: user.id }));

    if (rows.length > 0) {
      const { error } = await supabase.from("categories").insert(rows);

      if (error && error.code !== "23505") {
        return failure(
          messageFromPostgrest(error, "Não foi possível criar as categorias."),
        );
      }
    }
  }

  const { error } = await supabase
    .from("profiles")
    .update({
      full_name: parsed.data.full_name,
      onboarded_at: new Date().toISOString(),
    })
    .eq("id", user.id);

  if (error) {
    return failure(
      messageFromPostgrest(error, "Não foi possível concluir o primeiro acesso."),
    );
  }

  await supabase.auth.updateUser({ data: { full_name: parsed.data.full_name } });

  revalidateMoneyViews();
  return success();
}

/** Lets someone skip the questions without being asked again. */
export async function skipOnboarding(): Promise<ActionResult<undefined>> {
  const { supabase, user } = await requireUser();

  const { error } = await supabase
    .from("profiles")
    .update({ onboarded_at: new Date().toISOString() })
    .eq("id", user.id);

  if (error) {
    return failure(messageFromPostgrest(error, "Não foi possível continuar."));
  }

  revalidateMoneyViews();
  return success();
}
