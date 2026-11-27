-- Apply before deploying the price-sync route changes. Existing prices keep
-- NULL provenance until their next successful sync; do not infer survey dates
-- from price_updated_at (which records the sync time).
begin;

alter table public.master_ingredients
  add column if not exists price_source text,
  add column if not exists price_as_of date,
  add column if not exists price_market text,
  add column if not exists price_grade text;

comment on column public.master_ingredients.price_source is 'Provider/dataset identifier, independent of sync time';
comment on column public.master_ingredients.price_as_of is 'Actual price observation date supplied by the provider';
comment on column public.master_ingredients.price_updated_at is 'Time the reference price was synchronized';

commit;
