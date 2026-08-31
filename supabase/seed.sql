-- ============================================================================
-- Cashflow — dados de exemplo
--
-- Rode DEPOIS da migration e DEPOIS de criar a conta pelo app (/signup).
-- O gatilho de signup já cria o perfil e as duas categorias padrão; este
-- script só acrescenta os cinco lançamentos de exemplo do mês corrente.
--
-- Seguro de repetir: se o usuário já tiver qualquer transação, o script não
-- faz nada e avisa. Ele nunca apaga dado seu.
-- ============================================================================

do $$
declare
  -- Deixe vazio para usar a primeira conta criada no projeto.
  -- Ou preencha com o e-mail da conta de teste.
  v_email text := '';

  v_user      uuid;
  v_food      uuid;
  v_transport uuid;
  v_salary    uuid;
  v_month     date := date_trunc('month', current_date)::date;
  v_existing  integer;
begin
  ---------------------------------------------------------------------------
  -- Usuário alvo
  ---------------------------------------------------------------------------
  if btrim(v_email) = '' then
    select id into v_user from auth.users order by created_at limit 1;
  else
    select id into v_user from auth.users where email = lower(btrim(v_email));
  end if;

  if v_user is null then
    raise exception
      'Nenhum usuário encontrado. Crie a conta em /signup antes de rodar o seed.';
  end if;

  select count(*) into v_existing
  from public.transactions
  where user_id = v_user;

  if v_existing > 0 then
    raise notice
      'Usuário % já possui % transação(ões). Seed ignorado para não duplicar.',
      v_user, v_existing;
    return;
  end if;

  ---------------------------------------------------------------------------
  -- Categorias
  --
  -- Alimentação e Transporte são as duas padrão, criadas no signup — o insert
  -- abaixo só cobre o caso de terem sido apagadas. "Salário" não é padrão:
  -- existe porque toda transação carrega categoria, e sem ela não há como
  -- lançar as receitas de exemplo.
  ---------------------------------------------------------------------------
  insert into public.categories (user_id, name, icon, color)
  values
    (v_user, 'Alimentação', 'utensils', '#06a295'),
    (v_user, 'Transporte',  'car',      '#6646a8'),
    (v_user, 'Salário',     'banknote', '#5bb661')
  on conflict do nothing;

  select id into v_food
  from public.categories
  where user_id = v_user and lower(btrim(name)) = 'alimentação';

  select id into v_transport
  from public.categories
  where user_id = v_user and lower(btrim(name)) = 'transporte';

  select id into v_salary
  from public.categories
  where user_id = v_user and lower(btrim(name)) = 'salário';

  ---------------------------------------------------------------------------
  -- Cinco lançamentos do mês corrente: duas receitas, três despesas
  ---------------------------------------------------------------------------
  insert into public.transactions (user_id, category_id, type, amount, date, description)
  values
    (v_user, v_salary,    'income',  5200.00, v_month + 4,  'Salário do mês'),
    (v_user, v_salary,    'income',   850.00, v_month + 17, 'Projeto freelance'),
    (v_user, v_food,      'expense',  420.90, v_month + 2,  'Compras do mês'),
    (v_user, v_transport, 'expense',   96.40, v_month + 7,  'Recarga do transporte'),
    (v_user, v_food,      'expense',  187.30, v_month + 21, 'Restaurante e delivery');

  ---------------------------------------------------------------------------
  -- Orçamentos do mês
  --
  -- Não estão no escopo mínimo do seed, mas sem nenhum limite definido os
  -- indicadores de orçamento do dashboard nascem vazios. Alimentação fica
  -- perto do teto de propósito, para o estado de alerta aparecer.
  -- Apague este bloco se preferir começar sem orçamento nenhum.
  ---------------------------------------------------------------------------
  insert into public.budgets (user_id, category_id, month, amount)
  values
    (v_user, v_food,      v_month, 700.00),
    (v_user, v_transport, v_month, 300.00)
  on conflict on constraint budgets_unique_per_month do nothing;

  raise notice 'Seed aplicado para o usuário %.', v_user;
end
$$;
