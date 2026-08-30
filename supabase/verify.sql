-- ============================================================================
-- Cashflow — verificação da estrutura
--
-- Rode no SQL Editor depois da migration. Cada consulta devolve uma coluna
-- `status` com OK ou FALHA, e a última linha resume tudo.
-- ============================================================================

-- 1. As quatro tabelas existem?
select
  'tabelas' as verificacao,
  count(*)  as encontradas,
  case when count(*) = 4 then 'OK' else 'FALHA' end as status,
  string_agg(table_name, ', ' order by table_name) as detalhe
from information_schema.tables
where table_schema = 'public'
  and table_name in ('profiles', 'categories', 'transactions', 'budgets');


-- 2. RLS ligada nas quatro?
select
  'rls habilitada' as verificacao,
  count(*) filter (where rowsecurity) as com_rls,
  case when count(*) filter (where rowsecurity) = 4 then 'OK' else 'FALHA' end as status,
  string_agg(tablename || '=' || rowsecurity::text, ', ' order by tablename) as detalhe
from pg_tables
where schemaname = 'public'
  and tablename in ('profiles', 'categories', 'transactions', 'budgets');


-- 3. Políticas por tabela — esperado 4 em cada (select/insert/update/delete)
select
  tablename,
  count(*) as politicas,
  case when count(*) = 4 then 'OK' else 'FALHA' end as status,
  string_agg(cmd, ', ' order by cmd) as comandos
from pg_policies
where schemaname = 'public'
  and tablename in ('profiles', 'categories', 'transactions', 'budgets')
group by tablename
order by tablename;


-- 4. Índices exigidos
select
  'indices' as verificacao,
  count(*)  as encontrados,
  case when count(*) >= 5 then 'OK' else 'FALHA' end as status,
  string_agg(indexname, ', ' order by indexname) as detalhe
from pg_indexes
where schemaname = 'public'
  and indexname in (
    'transactions_user_date_idx',
    'transactions_user_category_idx',
    'budgets_user_month_idx',
    'categories_user_idx',
    'categories_user_name_key'
  );


-- 5. Isolamento por dono: as FKs compostas que impedem apontar para categoria alheia
select
  'fk composta (id, user_id)' as verificacao,
  count(*)                    as encontradas,
  case when count(*) = 2 then 'OK' else 'FALHA' end as status,
  string_agg(cl.relname || '.' || c.conname, ', ' order by cl.relname) as detalhe
from pg_constraint c
join pg_class cl on cl.oid = c.conrelid
where c.conname in ('transactions_category_fkey', 'budgets_category_fkey');


-- 6. Gatilho de novo usuário
select
  'gatilho de signup' as verificacao,
  case when count(*) = 1 then 'OK' else 'FALHA' end as status
from pg_trigger
where tgname = 'on_auth_user_created'
  and not tgisinternal;


-- 7. Contagem dos dados (rode depois do seed)
select
  'dados' as verificacao,
  (select count(*) from public.profiles)     as perfis,
  (select count(*) from public.categories)   as categorias,
  (select count(*) from public.transactions) as transacoes,
  (select count(*) from public.budgets)      as orcamentos;
