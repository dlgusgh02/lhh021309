-- Apply before deploying the duplicateRecipe Server Action.
begin;

-- A recipe's ownership alone is insufficient: a supplied ingredient UUID
-- must belong to that same store, including direct PostgREST writes.
drop policy if exists "recipe_ingredients_all_own" on public.recipe_ingredients;
create policy "recipe_ingredients_all_own" on public.recipe_ingredients
  for all to authenticated using (
    exists (
      select 1 from public.recipes r
      join public.stores s on s.id = r.store_id
      where r.id = recipe_ingredients.recipe_id and s.user_id = (select auth.uid())
    )
  )
  with check (
    exists (
      select 1 from public.recipes r
      join public.stores s on s.id = r.store_id
      join public.ingredients i on i.id = recipe_ingredients.ingredient_id and i.store_id = r.store_id
      where r.id = recipe_ingredients.recipe_id and s.user_id = (select auth.uid())
    )
  );

create or replace function public.duplicate_recipe(p_recipe_id uuid, p_store_id uuid)
returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  source_recipe public.recipes%rowtype;
  new_recipe_id uuid;
begin
  -- Invoker rights retain RLS. The explicit check also rejects callers who
  -- pass another user's store ID or who have no authenticated session.
  select r.* into source_recipe
  from public.recipes r
  join public.stores s on s.id = r.store_id
  where r.id = p_recipe_id and r.store_id = p_store_id and s.user_id = auth.uid()
  for share of r;

  if not found then
    raise exception using errcode = 'P0002', message = '레시피를 찾을 수 없습니다.';
  end if;

  insert into public.recipes (store_id, name, category, description, servings, selling_price, image_url)
  values (source_recipe.store_id, source_recipe.name || ' (복사본)', source_recipe.category,
          source_recipe.description, source_recipe.servings, source_recipe.selling_price, source_recipe.image_url)
  returning id into new_recipe_id;

  insert into public.recipe_ingredients (recipe_id, ingredient_id, quantity, unit)
  select new_recipe_id, ri.ingredient_id, ri.quantity, ri.unit
  from public.recipe_ingredients ri where ri.recipe_id = p_recipe_id;

  insert into public.extra_costs (recipe_id, name, amount, cost_type)
  select new_recipe_id, ec.name, ec.amount, ec.cost_type
  from public.extra_costs ec where ec.recipe_id = p_recipe_id;

  -- No exception handler: any failed child insert aborts the whole RPC.
  return new_recipe_id;
end;
$$;

revoke all on function public.duplicate_recipe(uuid, uuid) from public, anon;
grant execute on function public.duplicate_recipe(uuid, uuid) to authenticated;

commit;
