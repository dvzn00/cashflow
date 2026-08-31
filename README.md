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
| `NEXT_PUBLIC_SITE_URL` | Origem pública da app, sem barra no fim. Só em produção — é para onde o link de confirmação de e-mail volta. |
| `SUPABASE_SECRET_KEY` | Somente servidor, usada por scripts de seed. A aplicação não lê esta variável em tempo de execução. |

## Scripts

| Comando | O que faz |
|---|---|
| `npm run dev` | Servidor de desenvolvimento |
| `npm run build` | Build de produção |
| `npm run lint` | ESLint |
| `npm run typecheck` | `tsc --noEmit` |
| `npm test` | Vitest (execução única) |
| `npm run test:watch` | Vitest em watch |

## Deploy na Vercel

1. **Importe o repositório.** vercel.com → *Add New* → *Project* → escolha
   `cashflow`. O Next.js é detectado sozinho; não mexa em build command,
   output directory nem install command.

2. **Defina as variáveis de ambiente** antes do primeiro build, em
   *Settings → Environment Variables*:

   | Variável | Valor |
   |---|---|
   | `NEXT_PUBLIC_SUPABASE_URL` | a URL do seu projeto Supabase |
   | `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | a chave publicável |
   | `NEXT_PUBLIC_SITE_URL` | `https://SEU-APP.vercel.app` (só em *Production*) |

   `SUPABASE_SECRET_KEY` não é necessária: a aplicação nunca a lê.

3. **Libere o domínio no Supabase** — sem isto o link de confirmação de e-mail
   falha em produção. Em *Authentication → URL Configuration*:

   - **Site URL**: `https://SEU-APP.vercel.app`
   - **Redirect URLs**: acrescente `https://SEU-APP.vercel.app/**` e, se quiser
     que os *preview deployments* também funcionem, `https://*-SEU-ESCOPO.vercel.app/**`

4. **Aplique o schema** no projeto Supabase de produção, caso seja outro:
   `supabase/migrations/` na ordem, depois `supabase/seed.sql` se quiser os
   dados de exemplo.

5. **Confira depois do primeiro deploy**: criar conta → receber o e-mail →
   o link voltar para `/auth/confirm` → cair no onboarding.

### Pontos de atenção

- **E-mail.** O SMTP padrão do Supabase entrega poucas mensagens por hora e não
  serve para uso real. Configure um SMTP próprio em *Authentication → Emails*,
  ou desligue a confirmação de e-mail se o projeto for só demonstração.
- **Tamanho da função de PDF.** `@react-pdf/renderer` é pesado e roda na
  função serverless de `/api/reports/export-pdf`. Se o deploy reclamar de
  limite de tamanho, é esse o motivo.
- **Região.** Vale colocar a função na região mais próxima do seu projeto
  Supabase para reduzir latência das consultas.

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
