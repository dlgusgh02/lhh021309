-- FoodCost Lab database schema
-- Target: Supabase Postgres
-- Run this against a fresh Supabase project (SQL Editor or `supabase db push`).
--
-- Design notes (see TRD §21-33):
-- - Money is stored as integer KRW (no decimals).
-- - recipe_ingredients does NOT store calculated_cost — it is always derived at
--   read time from the ingredient's current price, so a price change is reflected
--   everywhere immediately without a background job.
-- - RLS is enforced on every table via the owning store's user_id.

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- profiles
-- ---------------------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  display_name text,
  currency text not null default 'KRW',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- stores
-- ---------------------------------------------------------------------------
create table if not exists public.stores (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  name text not null,
  currency text not null default 'KRW',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists stores_user_id_idx on public.stores (user_id);

-- ---------------------------------------------------------------------------
-- ingredients
-- ---------------------------------------------------------------------------
create table if not exists public.ingredients (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores (id) on delete cascade,
  name text not null,
  category text not null default 'etc',
  purchase_price bigint not null check (purchase_price >= 0),
  purchase_quantity numeric not null check (purchase_quantity > 0),
  purchase_unit text not null,
  base_unit text not null,
  yield_rate numeric not null default 100 check (yield_rate > 0 and yield_rate <= 100),
  supplier text,
  memo text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists ingredients_store_id_idx on public.ingredients (store_id);

-- ---------------------------------------------------------------------------
-- recipes
-- ---------------------------------------------------------------------------
create table if not exists public.recipes (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores (id) on delete cascade,
  name text not null,
  category text not null default 'etc',
  description text,
  servings numeric not null default 1 check (servings > 0),
  selling_price bigint not null default 0 check (selling_price >= 0),
  image_url text,
  is_favorite boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists recipes_store_id_idx on public.recipes (store_id);

-- ---------------------------------------------------------------------------
-- recipe_ingredients
-- ---------------------------------------------------------------------------
create table if not exists public.recipe_ingredients (
  id uuid primary key default gen_random_uuid(),
  recipe_id uuid not null references public.recipes (id) on delete cascade,
  ingredient_id uuid not null references public.ingredients (id) on delete restrict,
  quantity numeric not null check (quantity > 0),
  unit text not null,
  created_at timestamptz not null default now()
);

create index if not exists recipe_ingredients_recipe_id_idx on public.recipe_ingredients (recipe_id);
create index if not exists recipe_ingredients_ingredient_id_idx on public.recipe_ingredients (ingredient_id);

-- ---------------------------------------------------------------------------
-- extra_costs
-- ---------------------------------------------------------------------------
create table if not exists public.extra_costs (
  id uuid primary key default gen_random_uuid(),
  recipe_id uuid not null references public.recipes (id) on delete cascade,
  name text not null,
  amount bigint not null check (amount >= 0),
  cost_type text not null default 'packaging',
  created_at timestamptz not null default now()
);

create index if not exists extra_costs_recipe_id_idx on public.extra_costs (recipe_id);

-- ---------------------------------------------------------------------------
-- ingredient_price_history
-- ---------------------------------------------------------------------------
create table if not exists public.ingredient_price_history (
  id uuid primary key default gen_random_uuid(),
  ingredient_id uuid not null references public.ingredients (id) on delete cascade,
  purchase_price bigint not null check (purchase_price >= 0),
  purchase_quantity numeric not null check (purchase_quantity > 0),
  purchase_unit text not null,
  recorded_at timestamptz not null default now()
);

create index if not exists ingredient_price_history_ingredient_id_idx
  on public.ingredient_price_history (ingredient_id);

-- ---------------------------------------------------------------------------
-- updated_at triggers
-- ---------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_updated_at on public.profiles;
create trigger set_updated_at before update on public.profiles
  for each row execute function public.set_updated_at();

drop trigger if exists set_updated_at on public.stores;
create trigger set_updated_at before update on public.stores
  for each row execute function public.set_updated_at();

drop trigger if exists set_updated_at on public.ingredients;
create trigger set_updated_at before update on public.ingredients
  for each row execute function public.set_updated_at();

drop trigger if exists set_updated_at on public.recipes;
create trigger set_updated_at before update on public.recipes
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.stores enable row level security;
alter table public.ingredients enable row level security;
alter table public.recipes enable row level security;
alter table public.recipe_ingredients enable row level security;
alter table public.extra_costs enable row level security;
alter table public.ingredient_price_history enable row level security;

-- profiles: a user can only see/edit their own profile row
drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own" on public.profiles
  for select using (auth.uid() = id);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own" on public.profiles
  for update using (auth.uid() = id);

drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own" on public.profiles
  for insert with check (auth.uid() = id);

-- stores: owned directly by user_id
drop policy if exists "stores_all_own" on public.stores;
create policy "stores_all_own" on public.stores
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ingredients: owned via store.user_id
drop policy if exists "ingredients_all_own" on public.ingredients;
create policy "ingredients_all_own" on public.ingredients
  for all using (
    exists (
      select 1 from public.stores s
      where s.id = ingredients.store_id and s.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.stores s
      where s.id = ingredients.store_id and s.user_id = auth.uid()
    )
  );

-- recipes: owned via store.user_id
drop policy if exists "recipes_all_own" on public.recipes;
create policy "recipes_all_own" on public.recipes
  for all using (
    exists (
      select 1 from public.stores s
      where s.id = recipes.store_id and s.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.stores s
      where s.id = recipes.store_id and s.user_id = auth.uid()
    )
  );

-- recipe_ingredients: owned via recipe -> store.user_id
drop policy if exists "recipe_ingredients_all_own" on public.recipe_ingredients;
create policy "recipe_ingredients_all_own" on public.recipe_ingredients
  for all using (
    exists (
      select 1 from public.recipes r
      join public.stores s on s.id = r.store_id
      where r.id = recipe_ingredients.recipe_id and s.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.recipes r
      join public.stores s on s.id = r.store_id
      where r.id = recipe_ingredients.recipe_id and s.user_id = auth.uid()
    )
  );

-- extra_costs: owned via recipe -> store.user_id
drop policy if exists "extra_costs_all_own" on public.extra_costs;
create policy "extra_costs_all_own" on public.extra_costs
  for all using (
    exists (
      select 1 from public.recipes r
      join public.stores s on s.id = r.store_id
      where r.id = extra_costs.recipe_id and s.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.recipes r
      join public.stores s on s.id = r.store_id
      where r.id = extra_costs.recipe_id and s.user_id = auth.uid()
    )
  );

-- ingredient_price_history: owned via ingredient -> store.user_id
drop policy if exists "ingredient_price_history_all_own" on public.ingredient_price_history;
create policy "ingredient_price_history_all_own" on public.ingredient_price_history
  for all using (
    exists (
      select 1 from public.ingredients i
      join public.stores s on s.id = i.store_id
      where i.id = ingredient_price_history.ingredient_id and s.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.ingredients i
      join public.stores s on s.id = i.store_id
      where i.id = ingredient_price_history.ingredient_id and s.user_id = auth.uid()
    )
  );

-- ---------------------------------------------------------------------------
-- New user bootstrap: profile + default store created automatically on signup
-- (mirrors TRD §34 flow: Sign Up -> Profile 생성 -> 기본 Store 생성)
-- ---------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email, display_name)
  values (new.id, new.email, coalesce(new.raw_user_meta_data ->> 'display_name', new.email));

  insert into public.stores (user_id, name)
  values (new.id, '기본 매장');

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
