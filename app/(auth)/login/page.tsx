import { LoginForm } from "@/app/(auth)/login/login-form";

export const metadata = { title: "Entrar" };

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const params = await searchParams;
  const next = typeof params.next === "string" ? params.next : undefined;
  const notice = typeof params.erro === "string" ? params.erro : undefined;

  return (
    <div>
      <h1 className="display text-3xl leading-none">Entrar</h1>
      <p className="mt-2 mb-7 text-sm text-muted-foreground">
        Use o e-mail e a senha da sua conta.
      </p>
      <LoginForm next={next} notice={notice} />
    </div>
  );
}
