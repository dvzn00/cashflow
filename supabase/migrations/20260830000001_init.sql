-- ============================================================================
-- Cashflow — schema inicial
--
-- Cole este arquivo inteiro no SQL Editor do Supabase e execute uma vez.
-- O script é idempotente: rodar de novo não quebra nem duplica nada.
--
-- Convenções adotadas aqui:
--   • Dinheiro em numeric(14,2). Nunca float — 0.1 + 0.2 não fecha em binário.
--   • Datas de lançamento em `date` (data de calendário, sem fuso). Carimbos de
--     auditoria em timestamptz.
--   • Orçamento é mensal: `month` é sempre o dia 1º do mês, garantido por CHECK.
--   • Toda tabela tem RLS ligada e política por operação amarrada em auth.uid().
-- ============================================================================


-- ----------------------------------------------------------------------------
-- 1. Tipos
-- ----------------------------------------------------------------------------

do $$
begin
  create type public.transaction_type as enum ('income', 'expense');
exception
  when duplicate_object then null;
end
$$;


-- ----------------------------------------------------------------------------
-- 2. Funções utilitárias
-- ----------------------------------------------------------------------------

create or replace function public.handle_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;


-- ----------------------------------------------------------------------------
-- 3. Tabelas
-- ----------------------------------------------------------------------------

-- profiles ───────────────────────────────────────────────────────────────────
-- Uma linha por usuário, criada pelo gatilho de signup. `onboarded_at` nulo
-- significa que o primeiro acesso ainda não foi concluído.

create table if not exists public.profiles (
  id           uuid primary key references auth.users (id) on delete cascade,
  full_name    text,
  currency     text        not null default 'BRL',
  onboarded_at timestamptz,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),

  constraint profiles_full_name_length
    check (full_name is null or char_length(btrim(full_name)) between 1 and 80),
  constraint profiles_currency_format
    check (currency ~ '^[A-Z]{3}$')
);

-- categories ─────────────────────────────────────────────────────────────────
-- `unique (id, user_id)` é redundante como chave, mas é o alvo das FKs
-- compostas abaixo: é assim que o banco garante que ninguém aponte uma
-- transação para a categoria de outro usuário.

create table if not exists public.categories (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid        not null references auth.users (id) on delete cascade,
  name       text        not null,
  icon       text        not null default 'wallet',
  color      text        not null default '#00c4b3',
  created_at timestamptz not null default now(),

  constraint categories_name_length
    check (char_length(btrim(name)) between 1 and 40),
  constraint categories_icon_length
    check (char_length(btrim(icon)) between 1 and 40),
  constraint categories_color_format
    check (color ~ '^#[0-9a-f]{6}$'),
  constraint categories_id_user_key unique (id, user_id)
);

-- transactions ───────────────────────────────────────────────────────────────
-- A FK é composta em (category_id, user_id): uma categoria de terceiro é
-- rejeitada pelo banco, não só pela aplicação.
--
-- ON DELETE NO ACTION, e não RESTRICT, de propósito. Os dois bloqueiam apagar
-- uma categoria que ainda tem lançamentos — que é a regra de negócio. Mas
-- NO ACTION é verificado no fim do comando, então apagar o usuário (que cascata
-- para categorias e transações no mesmo comando) continua funcionando.
-- RESTRICT verifica na hora e faria a exclusão da conta falhar.

create table if not exists public.transactions (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid                    not null references auth.users (id) on delete cascade,
  category_id uuid,
  type        public.transaction_type not null,
  amount      numeric(14, 2)          not null,
  date        date                    not null,
  description text,
  created_at  timestamptz             not null default now(),
  updated_at  timestamptz             not null default now(),

  constraint transactions_amount_positive
    check (amount > 0),
  constraint transactions_description_length
    check (description is null or char_length(description) <= 140),
  constraint transactions_category_fkey
    foreign key (category_id, user_id)
    references public.categories (id, user_id)
    on update cascade
    on delete no action
);

-- budgets ────────────────────────────────────────────────────────────────────
-- Um limite por categoria por mês. Apagar a categoria leva junto os orçamentos
-- dela — ao contrário das transações, um limite órfão não tem valor histórico.

create table if not exists public.budgets (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid           not null references auth.users (id) on delete cascade,
  category_id uuid           not null,
  month       date           not null,
  amount      numeric(14, 2) not null,
  created_at  timestamptz    not null default now(),
  updated_at  timestamptz    not null default now(),

  constraint budgets_amount_positive
    check (amount > 0),
  constraint budgets_month_is_first_day
    check (extract(day from month) = 1),
  constraint budgets_unique_per_month
    unique (user_id, category_id, month),
  constraint budgets_category_fkey
    foreign key (category_id, user_id)
    references public.categories (id, user_id)
    on update cascade
    on delete cascade
);


-- ----------------------------------------------------------------------------
-- 4. Índices
--
-- Toda consulta da aplicação começa filtrando por user_id, por causa da RLS.
-- Por isso user_id é sempre a primeira coluna do índice.
-- ----------------------------------------------------------------------------

create index if not exists transactions_user_date_idx
  on public.transactions (user_id, date desc);

create index if not exists transactions_user_category_idx
  on public.transactions (user_id, category_id);

create index if not exists budgets_user_month_idx
  on public.budgets (user_id, month desc);

create index if not exists categories_user_idx
  on public.categories (user_id);

-- Nome de categoria único por usuário, ignorando caixa: "Mercado" e "mercado"
-- são a mesma coisa para quem digitou.
create unique index if not exists categories_user_name_key
  on public.categories (user_id, lower(btrim(name)));


-- ----------------------------------------------------------------------------
-- 5. Gatilhos de updated_at
-- ----------------------------------------------------------------------------

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.handle_updated_at();

drop trigger if exists transactions_set_updated_at on public.transactions;
create trigger transactions_set_updated_at
  before update on public.transactions
  for each row execute function public.handle_updated_at();

drop trigger if exists budgets_set_updated_at on public.budgets;
create trigger budgets_set_updated_at
  before update on public.budgets
  for each row execute function public.handle_updated_at();


-- ----------------------------------------------------------------------------
-- 6. Row Level Security
--
-- `(select auth.uid())` em vez de `auth.uid()` puro: com o select, o planner
-- avalia a função uma vez por comando em vez de uma vez por linha.
--
-- `to authenticated` evita rodar a política para requisições anônimas.
-- ----------------------------------------------------------------------------

alter table public.profiles     enable row level security;
alter table public.categories   enable row level security;
alter table public.transactions enable row level security;
alter table public.budgets      enable row level security;

-- profiles ───────────────────────────────────────────────────────────────────
drop policy if exists profiles_select_own on public.profiles;
create policy profiles_select_own on public.profiles
  for select to authenticated
  using ((select auth.uid()) = id);

drop policy if exists profiles_insert_own on public.profiles;
create policy profiles_insert_own on public.profiles
  for insert to authenticated
  with check ((select auth.uid()) = id);

drop policy if exists profiles_update_own on public.profiles;
create policy profiles_update_own on public.profiles
  for update to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

drop policy if exists profiles_delete_own on public.profiles;
create policy profiles_delete_own on public.profiles
  for delete to authenticated
  using ((select auth.uid()) = id);

-- categories ─────────────────────────────────────────────────────────────────
drop policy if exists categories_select_own on public.categories;
create policy categories_select_own on public.categories
  for select to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists categories_insert_own on public.categories;
create policy categories_insert_own on public.categories
  for insert to authenticated
  with check ((select auth.uid()) = user_id);

drop policy if exists categories_update_own on public.categories;
create policy categories_update_own on public.categories
  for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists categories_delete_own on public.categories;
create policy categories_delete_own on public.categories
  for delete to authenticated
  using ((select auth.uid()) = user_id);

-- transactions ───────────────────────────────────────────────────────────────
drop policy if exists transactions_select_own on public.transactions;
create policy transactions_select_own on public.transactions
  for select to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists transactions_insert_own on public.transactions;
create policy transactions_insert_own on public.transactions
  for insert to authenticated
  with check ((select auth.uid()) = user_id);

drop policy if exists transactions_update_own on public.transactions;
create policy transactions_update_own on public.transactions
  for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists transactions_delete_own on public.transactions;
create policy transactions_delete_own on public.transactions
  for delete to authenticated
  using ((select auth.uid()) = user_id);

-- budgets ────────────────────────────────────────────────────────────────────
drop policy if exists budgets_select_own on public.budgets;
create policy budgets_select_own on public.budgets
  for select to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists budgets_insert_own on public.budgets;
create policy budgets_insert_own on public.budgets
  for insert to authenticated
  with check ((select auth.uid()) = user_id);

drop policy if exists budgets_update_own on public.budgets;
create policy budgets_update_own on public.budgets
  for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists budgets_delete_own on public.budgets;
create policy budgets_delete_own on public.budgets
  for delete to authenticated
  using ((select auth.uid()) = user_id);


-- ----------------------------------------------------------------------------
-- 7. Novo usuário: perfil + categorias padrão
--
-- Roda dentro da transação de signup. Se falhar, o cadastro falha inteiro com
-- "Database error saving new user" — por isso todo insert aqui é tolerante a
-- conflito.
-- ----------------------------------------------------------------------------

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, full_name)
  values (
    new.id,
    nullif(btrim(coalesce(new.raw_user_meta_data ->> 'full_name', '')), '')
  )
  on conflict (id) do nothing;

  insert into public.categories (user_id, name, icon, color)
  values
    (new.id, 'Alimentação', 'utensils', '#00c4b3'),
    (new.id, 'Transporte',  'car',      '#7a5aff')
  on conflict do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();


-- ----------------------------------------------------------------------------
-- 8. Permissões
--
-- A RLS é quem decide quais linhas; o grant decide quais tabelas. Sem os dois,
-- nada passa.
-- ----------------------------------------------------------------------------

grant usage on schema public to authenticated;

grant select, insert, update, delete on
  public.profiles,
  public.categories,
  public.transactions,
  public.budgets
to authenticated;
