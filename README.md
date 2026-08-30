# Cashflow

Controle financeiro pessoal: registre receitas e despesas, defina orçamentos por
categoria, acompanhe gráficos e gere o extrato mensal em PDF.

## Stack

| Camada | Tecnologia |
|---|---|
| Framework | Next.js 16.3.3 (App Router, Turbopack, React 19) |
| Linguagem | TypeScript (strict) |
| Estilo | Tailwind CSS v4 + shadcn/ui v4 (base radix) |
| Dados / Auth | Supabase (PostgreSQL + Auth + RLS) |
| Gráficos | Recharts |
| PDF | @react-pdf/renderer |
| Tema | next-themes |
| Validação | Zod |
| Testes | Vitest |

## Como rodar

```bash
npm install
cp .env.example .env.local   # preencha com as credenciais do seu projeto
npm run dev
```

Enquanto `.env.local` estiver vazio o app roda em modo "não configurado":
as rotas protegidas redirecionam para `/login`, que exibe o aviso de setup.

### Variáveis de ambiente

| Variável | Onde encontrar |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase → Project Settings → API → Project URL |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Supabase → Project Settings → API Keys → publishable key (`sb_publishable_…`) |
| `SUPABASE_SECRET_KEY` | Somente servidor. Usada por scripts de seed. Nunca exposta ao cliente. |

## Scripts

| Comando | O que faz |
|---|---|
| `npm run dev` | Servidor de desenvolvimento |
| `npm run build` | Build de produção |
| `npm run lint` | ESLint |
| `npm run typecheck` | `tsc --noEmit` |
| `npm test` | Vitest (execução única) |
| `npm run test:watch` | Vitest em watch |

## Estrutura

```
app/
  (auth)/        login, signup, onboarding — layout editorial de duas colunas
  (dashboard)/   dashboard (/), transactions, reports, settings — AppShell
  api/reports/export-pdf/   geração do extrato mensal
components/
  layout/        AppShell, sidebar, brand, page header
  theme/         ThemeProvider e alternador claro/escuro
  ui/            componentes shadcn/ui
lib/
  actions/       Server Actions
  domain/        regras e cálculos puros (testáveis)
  supabase/      clients de browser, servidor e sessão
types/           tipos do schema
proxy.ts         refresh de sessão + proteção de rotas
```

## Design

Paleta e tipografia são fixas pelo briefing. Papéis semânticos adotados:

- **Turquesa** — ação primária e **receitas**
- **Roxo** — apoio e **despesas**
- **Vermelho** — reservado a ações destrutivas e estouro de orçamento

Tipografia em dois registros: **Cormorant Garamond** para títulos e para os
números-herói dos cards; **Plus Jakarta Sans** (com `tabular-nums`) para todo
valor que precisa alinhar em coluna — tabelas, listas e eixos de gráfico.
