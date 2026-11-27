-- Run the whole script in a development Supabase SQL Editor as postgres,
-- after applying schema.sql or 20261106_recipe_integrity.sql.
-- The final ROLLBACK removes all fixtures, copies, and the failure trigger.
begin;

create temporary table recipe_test_ids (key text primary key, id uuid not null);
insert into recipe_test_ids values ('user', gen_random_uuid()), ('other_user', gen_random_uuid()),
  ('ingredient', gen_random_uuid()), ('other_ingredient', gen_random_uuid()), ('recipe', gen_random_uuid());
grant select on recipe_test_ids to authenticated;

insert into auth.users (id, email)
select id, id::text || '@recipe-test.invalid' from recipe_test_ids where key in ('user', 'other_user');
insert into recipe_test_ids
select 'store', s.id from public.stores s join recipe_test_ids t on s.user_id = t.id where t.key = 'user';
insert into recipe_test_ids
select 'other_store', s.id from public.stores s join recipe_test_ids t on s.user_id = t.id where t.key = 'other_user';

insert into public.ingredients (id, store_id, name, purchase_price, purchase_quantity, purchase_unit, base_unit)
values ((select id from recipe_test_ids where key = 'ingredient'), (select id from recipe_test_ids where key = 'store'), 'test ingredient', 1000, 1, 'kg', 'kg'),
       ((select id from recipe_test_ids where key = 'other_ingredient'), (select id from recipe_test_ids where key = 'other_store'), 'foreign ingredient', 2000, 1, 'kg', 'kg');
insert into public.recipes (id, store_id, name, servings, selling_price, image_url, is_favorite)
values ((select id from recipe_test_ids where key = 'recipe'), (select id from recipe_test_ids where key = 'store'), 'test recipe', 4, 9000, '/test.jpg', true);
insert into public.recipe_ingredients (recipe_id, ingredient_id, quantity, unit)
values ((select id from recipe_test_ids where key = 'recipe'), (select id from recipe_test_ids where key = 'ingredient'), 200, 'g');
insert into public.extra_costs (recipe_id, name, amount, cost_type)
values ((select id from recipe_test_ids where key = 'recipe'), 'test packaging', 500, 'packaging');

select set_config('request.jwt.claim.sub', (select id::text from recipe_test_ids where key = 'user'), true);
set local role authenticated;

do $$
declare
  copied_id uuid;
begin
  copied_id := public.duplicate_recipe((select id from recipe_test_ids where key = 'recipe'), (select id from recipe_test_ids where key = 'store'));
  if not exists (select 1 from public.recipes where id = copied_id and name = 'test recipe (복사본)' and servings = 4 and selling_price = 9000 and image_url = '/test.jpg' and not is_favorite)
     or (select count(*) from public.recipe_ingredients where recipe_id = copied_id and quantity = 200 and unit = 'g') <> 1
     or (select count(*) from public.extra_costs where recipe_id = copied_id and amount = 500) <> 1 then
    raise exception 'FAIL: copy did not preserve recipe and child data';
  end if;

  begin
    perform public.duplicate_recipe((select id from recipe_test_ids where key = 'recipe'), (select id from recipe_test_ids where key = 'other_store'));
    raise exception 'FAIL: foreign store accepted';
  exception when no_data_found then null;
  end;

  begin
    insert into public.recipe_ingredients (recipe_id, ingredient_id, quantity, unit)
    values ((select id from recipe_test_ids where key = 'recipe'), (select id from recipe_test_ids where key = 'other_ingredient'), 1, 'kg');
    raise exception 'FAIL: foreign ingredient accepted';
  exception when insufficient_privilege then null;
  end;
end;
$$;

reset role;
create function pg_temp.reject_recipe_copy_cost() returns trigger language plpgsql as $$
begin
  raise exception using errcode = '23514', message = 'forced child insert failure';
end;
$$;
create trigger recipe_copy_failure_test before insert on public.extra_costs
  for each row execute function pg_temp.reject_recipe_copy_cost();

set local role authenticated;
do $$
declare
  recipes_before bigint;
  lines_before bigint;
begin
  select count(*) into recipes_before from public.recipes;
  select count(*) into lines_before from public.recipe_ingredients;
  begin
    perform public.duplicate_recipe((select id from recipe_test_ids where key = 'recipe'), (select id from recipe_test_ids where key = 'store'));
    raise exception 'FAIL: forced child failure did not abort';
  exception when check_violation then null;
  end;
  if (select count(*) from public.recipes) <> recipes_before
     or (select count(*) from public.recipe_ingredients) <> lines_before then
    raise exception 'FAIL: partial copy survived child failure';
  end if;
end;
$$;

reset role;
rollback;
