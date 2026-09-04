-- Starter rows for public.master_ingredients: names/categories/units only —
-- no prices are seeded here (that would mean guessing at numbers). Run this
-- once against a real project after applying schema.sql, then run the
-- /api/cron/sync-kamis-prices job (once KAMIS_ITEM_MAP in
-- src/lib/kamis/item-map.ts is filled in with real codes) to fill in
-- reference_price for the items KAMIS actually covers.
insert into public.master_ingredients (name, category, reference_unit) values
  ('돼지고기(삼겹살)', 'meat', 'kg'),
  ('돼지고기(앞다리살)', 'meat', 'kg'),
  ('소고기(등심)', 'meat', 'kg'),
  ('닭고기(가슴살)', 'meat', 'kg'),
  ('닭고기(다리살)', 'meat', 'kg'),
  ('양파', 'vegetable', 'kg'),
  ('대파', 'vegetable', 'kg'),
  ('마늘', 'vegetable', 'kg'),
  ('생강', 'vegetable', 'kg'),
  ('배추', 'vegetable', 'kg'),
  ('무', 'vegetable', 'kg'),
  ('감자', 'vegetable', 'kg'),
  ('당근', 'vegetable', 'kg'),
  ('애호박', 'vegetable', 'kg'),
  ('청양고추', 'vegetable', 'kg'),
  ('깻잎', 'vegetable', 'kg'),
  ('상추', 'vegetable', 'kg'),
  ('오이', 'vegetable', 'kg'),
  ('버섯(느타리)', 'vegetable', 'kg'),
  ('두부', 'vegetable', 'kg'),
  ('계란', 'dairy', 'kg'),
  ('우유', 'dairy', 'l'),
  ('갈치', 'seafood', 'kg'),
  ('고등어', 'seafood', 'kg'),
  ('오징어', 'seafood', 'kg'),
  ('새우', 'seafood', 'kg'),
  ('멸치', 'seafood', 'kg'),
  ('쌀', 'etc', 'kg'),
  ('식용유', 'etc', 'l'),
  ('설탕', 'seasoning', 'kg'),
  ('소금', 'seasoning', 'kg'),
  ('고춧가루', 'seasoning', 'kg'),
  ('고추장', 'sauce', 'kg'),
  ('된장', 'sauce', 'kg'),
  ('간장', 'sauce', 'l'),
  ('참기름', 'seasoning', 'l')
on conflict do nothing;
