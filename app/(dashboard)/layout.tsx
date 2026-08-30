import { redirect } from "next/navigation";

import { AppShell } from "@/components/layout/app-shell";
import { getUser } from "@/lib/supabase/server";

export default async function DashboardLayout({
  children,
}: LayoutProps<"/">) {
  const user = await getUser();

  if (!user) {
    redirect("/login");
  }

  const email = user.email ?? "";
  const name =
    (user.user_metadata?.full_name as string | undefined) ||
    email.split("@")[0] ||
    "Você";

  return (
    <AppShell name={name} email={email}>
      {children}
    </AppShell>
  );
}
