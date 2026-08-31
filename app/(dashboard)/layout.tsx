import { redirect } from "next/navigation";

import { AppShell } from "@/components/layout/app-shell";
import { getProfile } from "@/lib/actions/profile";
import { getUser } from "@/lib/supabase/server";

export default async function DashboardLayout({
  children,
}: LayoutProps<"/">) {
  const user = await getUser();

  if (!user) {
    redirect("/login");
  }

  const profile = await getProfile();

  // First run has not been completed yet.
  if (profile.ok && profile.data && !profile.data.onboarded_at) {
    redirect("/onboarding");
  }

  const email = user.email ?? "";
  const name =
    (profile.ok ? profile.data?.full_name : null) ||
    (user.user_metadata?.full_name as string | undefined) ||
    email.split("@")[0] ||
    "Você";

  return (
    <AppShell name={name} email={email}>
      {children}
    </AppShell>
  );
}
