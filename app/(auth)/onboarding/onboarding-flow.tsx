"use client";

import { useActionState, useState } from "react";
import { useTheme } from "next-themes";
import { ArrowLeft, ArrowRight, Check, Moon, Sun } from "lucide-react";

import { CategoryIcon } from "@/components/category-icon";
import { Field, FormError, SubmitButton } from "@/components/forms/field";
import { Button } from "@/components/ui/button";
import { completeOnboardingForm, skipOnboardingForm } from "@/lib/actions/forms";
import { CHART_SLOTS } from "@/lib/domain/chart-palette";
import { cn } from "@/lib/utils";

/**
 * Suggestions beyond the two that already exist. Colours are handed out in
 * slot order so the palette stays the validated sequence.
 */
const SUGGESTIONS = [
  { name: "Salário", icon: "banknote" },
  { name: "Moradia", icon: "house" },
  { name: "Mercado", icon: "shopping-cart" },
  { name: "Saúde", icon: "heart-pulse" },
  { name: "Lazer", icon: "clapperboard" },
  { name: "Educação", icon: "graduation-cap" },
  { name: "Assinaturas", icon: "credit-card" },
  { name: "Academia", icon: "dumbbell" },
] as const;

const STEPS = ["Seu nome", "Aparência", "Categorias"] as const;

export function OnboardingFlow({ initialName }: { initialName: string }) {
  const [step, setStep] = useState(0);
  const [name, setName] = useState(initialName);
  const [picked, setPicked] = useState<string[]>([]);
  const [state, action] = useActionState(completeOnboardingForm, null);

  const fieldErrors = state && !state.ok ? state.fieldErrors : undefined;
  const canAdvance = step > 0 || name.trim().length > 0;

  const chosen = SUGGESTIONS.filter((s) => picked.includes(s.name)).map(
    (suggestion, index) => ({
      name: suggestion.name,
      icon: suggestion.icon,
      // Slots 1 and 2 belong to the two default categories already created.
      color: CHART_SLOTS[(index + 2) % CHART_SLOTS.length].light,
    }),
  );

  return (
    <form action={action} className="grid gap-7" noValidate>
      <input type="hidden" name="full_name" value={name} />
      {chosen.map((category) => (
        <input
          key={category.name}
          type="hidden"
          name="categories"
          value={JSON.stringify(category)}
        />
      ))}

      <StepIndicator current={step} />

      <FormError message={state && !state.ok ? state.error : undefined} />

      {step === 0 ? (
        <section className="grid gap-5">
          <div>
            <h1 className="display text-3xl leading-none">Bem-vindo</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Vamos deixar o Cashflow do seu jeito. Leva três telas.
            </p>
          </div>

          <Field
            name="nome_visivel"
            label="Como podemos te chamar?"
            value={name}
            onChange={(event) => setName(event.target.value)}
            autoFocus
            required
            error={fieldErrors?.full_name}
          />

          <div className="rounded-lg border border-border bg-surface px-4 py-3">
            <p className="eyebrow">Moeda</p>
            <p className="mt-1 text-sm">
              Real brasileiro <span className="text-muted-foreground">(R$)</span>
            </p>
          </div>
        </section>
      ) : null}

      {step === 1 ? <ThemeStep /> : null}

      {step === 2 ? (
        <section className="grid gap-5">
          <div>
            <h1 className="display text-3xl leading-none">Categorias</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Você já tem <strong className="font-medium text-foreground">Alimentação</strong> e{" "}
              <strong className="font-medium text-foreground">Transporte</strong>. Escolha
              outras se quiser — dá para criar e apagar depois.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-2">
            {SUGGESTIONS.map((suggestion) => {
              const active = picked.includes(suggestion.name);
              return (
                <button
                  key={suggestion.name}
                  type="button"
                  aria-pressed={active}
                  onClick={() =>
                    setPicked((current) =>
                      active
                        ? current.filter((n) => n !== suggestion.name)
                        : [...current, suggestion.name],
                    )
                  }
                  className={cn(
                    "flex items-center gap-2.5 rounded-lg border px-3 py-2.5 text-left text-sm transition-colors",
                    active
                      ? "border-primary bg-accent text-accent-foreground"
                      : "border-border hover:bg-surface",
                  )}
                >
                  <CategoryIcon
                    name={suggestion.icon}
                    className={cn("size-4 shrink-0", active && "text-primary")}
                  />
                  <span className="flex-1 truncate">{suggestion.name}</span>
                  {active ? (
                    <Check className="size-3.5 shrink-0 text-primary" aria-hidden />
                  ) : null}
                </button>
              );
            })}
          </div>
        </section>
      ) : null}

      <div className="flex items-center justify-between gap-3">
        {step > 0 ? (
          <Button
            type="button"
            variant="ghost"
            onClick={() => setStep((s) => s - 1)}
          >
            <ArrowLeft className="size-4" aria-hidden />
            Voltar
          </Button>
        ) : (
          <SkipButton />
        )}

        {step < STEPS.length - 1 ? (
          <Button
            type="button"
            disabled={!canAdvance}
            onClick={() => setStep((s) => s + 1)}
          >
            Continuar
            <ArrowRight className="size-4" aria-hidden />
          </Button>
        ) : (
          <SubmitButton pendingLabel="Salvando…">
            {picked.length > 0
              ? `Concluir com ${picked.length} ${picked.length === 1 ? "categoria" : "categorias"}`
              : "Concluir"}
          </SubmitButton>
        )}
      </div>
    </form>
  );
}

function SkipButton() {
  return (
    <Button
      type="button"
      variant="ghost"
      className="text-muted-foreground"
      onClick={() => skipOnboardingForm()}
    >
      Pular
    </Button>
  );
}

/** A real sequence, so numbering it carries information rather than decorating. */
function StepIndicator({ current }: { current: number }) {
  return (
    <ol className="flex items-center gap-2" aria-label="Progresso">
      {STEPS.map((label, index) => {
        const done = index < current;
        const active = index === current;
        return (
          <li key={label} className="flex flex-1 flex-col gap-1.5">
            <span
              aria-hidden
              className={cn(
                "h-[3px] rounded-full transition-colors",
                done || active ? "bg-primary" : "bg-border",
              )}
            />
            <span
              className={cn(
                "text-[0.6875rem] font-medium tracking-wide",
                active ? "text-foreground" : "text-muted-foreground",
              )}
            >
              {index + 1}. {label}
            </span>
          </li>
        );
      })}
    </ol>
  );
}

function ThemeStep() {
  const { setTheme, theme, resolvedTheme } = useTheme();
  const active = theme === "system" ? resolvedTheme : theme;

  const options = [
    { value: "dark", label: "Escuro", hint: "Padrão do Cashflow", Icon: Moon },
    { value: "light", label: "Claro", hint: "Para ambientes iluminados", Icon: Sun },
  ] as const;

  return (
    <section className="grid gap-5">
      <div>
        <h1 className="display text-3xl leading-none">Aparência</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Escolha e veja mudar na hora. Dá para trocar quando quiser nas
          Configurações.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {options.map(({ value, label, hint, Icon }) => (
          <button
            key={value}
            type="button"
            aria-pressed={active === value}
            onClick={() => setTheme(value)}
            className={cn(
              "flex flex-col gap-3 rounded-xl border p-4 text-left transition-colors",
              active === value
                ? "border-primary ring-1 ring-primary"
                : "border-border hover:bg-surface",
            )}
          >
            <ThemePreview dark={value === "dark"} />
            <span className="flex items-center gap-2 text-sm font-medium">
              <Icon className="size-4" aria-hidden />
              {label}
              {active === value ? (
                <Check className="ml-auto size-4 text-primary" aria-hidden />
              ) : null}
            </span>
            <span className="text-xs text-muted-foreground">{hint}</span>
          </button>
        ))}
      </div>
    </section>
  );
}

/** Miniature of the app: sidebar rail, two cards, a chart line. */
function ThemePreview({ dark }: { dark: boolean }) {
  const bg = dark ? "#1a1d2b" : "#f8f9fc";
  const card = dark ? "#252c42" : "#ffffff";
  const line = dark ? "#3d4465" : "#d1d5db";
  const accent = dark ? "#00e5d1" : "#00c4b3";

  return (
    <svg viewBox="0 0 160 90" className="w-full rounded-md" role="img" aria-hidden>
      <rect width="160" height="90" rx="5" fill={bg} />
      <rect x="0" y="0" width="34" height="90" rx="5" fill={card} />
      <rect x="7" y="10" width="14" height="3" rx="1.5" fill={accent} />
      <rect x="7" y="20" width="20" height="2.5" rx="1.25" fill={line} />
      <rect x="7" y="27" width="16" height="2.5" rx="1.25" fill={line} />
      <rect x="7" y="34" width="18" height="2.5" rx="1.25" fill={line} />
      <rect x="42" y="10" width="50" height="22" rx="3" fill={card} />
      <rect x="98" y="10" width="50" height="22" rx="3" fill={card} />
      <rect x="47" y="16" width="20" height="3" rx="1.5" fill={accent} />
      <rect x="103" y="16" width="26" height="3" rx="1.5" fill={line} />
      <rect x="42" y="38" width="106" height="42" rx="3" fill={card} />
      <path
        d="M50 68 L64 58 L78 63 L92 49 L106 55 L120 46 L134 52"
        fill="none"
        stroke={accent}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
