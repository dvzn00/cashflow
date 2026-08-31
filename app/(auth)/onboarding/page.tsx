import { redirect } from "next/navigation";

import { OnboardingFlow } from "@/app/(auth)/onboarding/onboarding-flow";
import { getProfile } from "@/lib/actions/profile";
import { getUser } from "@/lib/supabase/server";

export const metadata = { title: "Boas-vindas" };

export default async function OnboardingPage() {
  const user = await getUser();
  if (!user) redirect("/login");

  const profile = await getProfile();

  // Already finished once — no reason to ask again.
  if (profile.ok && profile.data?.onboarded_at) redirect("/");

  const initialName =
    (profile.ok ? profile.data?.full_name : null) ||
    (user.user_metadata?.full_name as string | undefined) ||
    "";

  return <OnboardingFlow initialName={initialName} />;
}
