-- ============================================================================
-- Cashflow — cores padrão das categorias
--
-- A paleta de categorias foi revalidada: os oito tons agora passam nos testes
-- de banda de luminosidade, piso de croma e separação para daltonismo, nos dois
-- temas. As duas categorias criadas no cadastro ainda usavam os tons antigos.
--
-- Opcional: o app já resolve as cores antigas para o slot correto ao desenhar.
-- Rodar isto só deixa o banco consistente com o seletor de cores.
-- ============================================================================

-- Novas contas passam a nascer com as cores validadas.
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
    (new.id, 'Alimentação', 'utensils', '#06a295'),
    (new.id, 'Transporte',  'car',      '#6646a8')
  on conflict do nothing;

  return new;
end;
$$;

-- Contas já existentes que nunca trocaram a cor padrão.
update public.categories
set color = '#06a295'
where color = '#00c4b3';

update public.categories
set color = '#6646a8'
where color = '#7a5aff';

update public.categories
set color = '#5bb661'
where color = '#5fd6a0';
