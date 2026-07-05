    -- Trackros Supabase schema (single-user, server-side access via service_role)
    -- Run this in Supabase Dashboard → SQL Editor after creating your project.
    --
    -- Setup checklist:
    -- 1. Create a project at https://supabase.com/dashboard
    -- 2. Settings → API: copy Project URL and service_role secret key (server-only)
    -- 3. Settings → General: note the Project Reference ID (for type generation)
    -- 4. Paste this entire file into SQL Editor and run

    -- ---------------------------------------------------------------------------
    -- Tables
    -- ---------------------------------------------------------------------------

    create table if not exists public.foods (
      id bigint generated always as identity primary key,
      name text not null unique,
      serving_size double precision not null,
      serving_unit text not null,
      calories double precision not null,
      protein double precision not null,
      carbs double precision not null,
      fat double precision not null,
      fiber double precision,
      sugar double precision,
      sodium double precision,
      saturated_fat double precision,
      trans_fat double precision,
      cholesterol double precision,
      potassium double precision,
      calcium double precision,
      iron double precision,
      source text not null default 'gemini',
      created_at timestamptz not null default now()
    );

    create table if not exists public.daily_logs (
      id bigint generated always as identity primary key,
      log_date date not null unique,
      created_at timestamptz not null default now()
    );

    create table if not exists public.log_entries (
      id bigint generated always as identity primary key,
      log_id bigint not null references public.daily_logs (id) on delete cascade,
      food_id bigint not null references public.foods (id) on delete restrict,
      meal_type text not null check (meal_type in ('breakfast', 'lunch', 'dinner', 'snacks')),
      servings double precision not null default 1,
      serving_label text,
      display_name text,
      created_at timestamptz not null default now()
    );

    create index if not exists log_entries_log_id_idx on public.log_entries (log_id);
    create index if not exists log_entries_food_id_idx on public.log_entries (food_id);

    create table if not exists public.meal_presets (
      id bigint generated always as identity primary key,
      name text not null,
      meal_type text not null check (meal_type in ('breakfast', 'lunch', 'dinner', 'snacks')),
      created_at timestamptz not null default now()
    );

    create table if not exists public.meal_preset_items (
      id bigint generated always as identity primary key,
      preset_id bigint not null references public.meal_presets (id) on delete cascade,
      food_id bigint not null references public.foods (id) on delete restrict,
      servings double precision not null default 1,
      serving_label text,
      created_at timestamptz not null default now()
    );

    create index if not exists meal_preset_items_preset_id_idx on public.meal_preset_items (preset_id);
    create index if not exists meal_preset_items_food_id_idx on public.meal_preset_items (food_id);

    create table if not exists public.user_goals (
      id bigint generated always as identity primary key,
      age integer not null default 25,
      gender text not null default 'male' check (gender in ('male', 'female')),
      calories double precision not null default 2000,
      protein_g double precision not null default 150,
      carbs_g double precision not null default 250,
      fat_g double precision not null default 65,
      fiber_g double precision not null default 30,
      sugar_g double precision not null default 50,
      sodium_mg double precision not null default 2300,
      saturated_fat_g double precision not null default 20,
      cholesterol_mg double precision not null default 300,
      potassium_mg double precision not null default 3500,
      calcium_mg double precision not null default 1000,
      iron_mg double precision not null default 18,
      updated_at timestamptz not null default now()
    );

    -- Migrations for existing databases (safe to re-run; must run before seed INSERT)
    alter table public.user_goals add column if not exists age integer not null default 25;
    alter table public.user_goals add column if not exists gender text not null default 'male';
    alter table public.user_goals drop constraint if exists user_goals_gender_check;
    alter table public.user_goals add constraint user_goals_gender_check check (gender in ('male', 'female'));

    alter table public.log_entries add column if not exists display_name text;

    -- Capitalize existing food names (sentence case). Safe to re-run.
    do $$
    declare
      r record;
      formatted text;
      existing_id bigint;
    begin
      for r in select id, name from public.foods loop
        formatted := upper(left(btrim(r.name), 1)) || lower(substring(btrim(r.name) from 2));
        if formatted = '' or formatted = r.name then
          continue;
        end if;

        select id into existing_id
        from public.foods
        where lower(btrim(name)) = lower(btrim(formatted)) and id <> r.id
        limit 1;

        if existing_id is not null then
          update public.log_entries set food_id = existing_id where food_id = r.id;
          update public.meal_preset_items set food_id = existing_id where food_id = r.id;
          delete from public.foods where id = r.id;
        else
          update public.foods set name = formatted where id = r.id;
        end if;
      end loop;
    end $$;

    -- Seed singleton goals row (matches lib/nutrients.ts defaults)
    insert into public.user_goals (
      age,
      calories,
      protein_g,
      carbs_g,
      fat_g,
      fiber_g,
      sugar_g,
      sodium_mg,
      saturated_fat_g,
      cholesterol_mg,
      potassium_mg,
      calcium_mg,
      iron_mg
    )
    select
      25, 2000, 150, 250, 65,
      30, 50, 2300, 20, 300, 3500, 1000, 18
    where not exists (select 1 from public.user_goals limit 1);

-- ---------------------------------------------------------------------------
-- Row Level Security (locked down — server uses service_role which bypasses RLS)
-- Safe to re-run: drops all public policies. Anon/authenticated roles are denied.
-- ---------------------------------------------------------------------------

alter table public.foods enable row level security;
alter table public.daily_logs enable row level security;
alter table public.log_entries enable row level security;
alter table public.meal_presets enable row level security;
alter table public.meal_preset_items enable row level security;
alter table public.user_goals enable row level security;

-- Drop legacy permissive policies (anon + authenticated)
drop policy if exists "foods_select_anon" on public.foods;
drop policy if exists "foods_insert_anon" on public.foods;
drop policy if exists "foods_update_anon" on public.foods;
drop policy if exists "foods_select_authenticated" on public.foods;
drop policy if exists "foods_insert_authenticated" on public.foods;
drop policy if exists "foods_update_authenticated" on public.foods;

drop policy if exists "daily_logs_select_anon" on public.daily_logs;
drop policy if exists "daily_logs_insert_anon" on public.daily_logs;
drop policy if exists "daily_logs_update_anon" on public.daily_logs;
drop policy if exists "daily_logs_delete_anon" on public.daily_logs;
drop policy if exists "daily_logs_select_authenticated" on public.daily_logs;
drop policy if exists "daily_logs_insert_authenticated" on public.daily_logs;
drop policy if exists "daily_logs_update_authenticated" on public.daily_logs;
drop policy if exists "daily_logs_delete_authenticated" on public.daily_logs;

drop policy if exists "log_entries_select_anon" on public.log_entries;
drop policy if exists "log_entries_insert_anon" on public.log_entries;
drop policy if exists "log_entries_update_anon" on public.log_entries;
drop policy if exists "log_entries_delete_anon" on public.log_entries;
drop policy if exists "log_entries_select_authenticated" on public.log_entries;
drop policy if exists "log_entries_insert_authenticated" on public.log_entries;
drop policy if exists "log_entries_update_authenticated" on public.log_entries;
drop policy if exists "log_entries_delete_authenticated" on public.log_entries;

drop policy if exists "meal_presets_select_anon" on public.meal_presets;
drop policy if exists "meal_presets_insert_anon" on public.meal_presets;
drop policy if exists "meal_presets_update_anon" on public.meal_presets;
drop policy if exists "meal_presets_delete_anon" on public.meal_presets;
drop policy if exists "meal_presets_select_authenticated" on public.meal_presets;
drop policy if exists "meal_presets_insert_authenticated" on public.meal_presets;
drop policy if exists "meal_presets_update_authenticated" on public.meal_presets;
drop policy if exists "meal_presets_delete_authenticated" on public.meal_presets;

drop policy if exists "meal_preset_items_select_anon" on public.meal_preset_items;
drop policy if exists "meal_preset_items_insert_anon" on public.meal_preset_items;
drop policy if exists "meal_preset_items_update_anon" on public.meal_preset_items;
drop policy if exists "meal_preset_items_delete_anon" on public.meal_preset_items;
drop policy if exists "meal_preset_items_select_authenticated" on public.meal_preset_items;
drop policy if exists "meal_preset_items_insert_authenticated" on public.meal_preset_items;
drop policy if exists "meal_preset_items_update_authenticated" on public.meal_preset_items;
drop policy if exists "meal_preset_items_delete_authenticated" on public.meal_preset_items;

drop policy if exists "user_goals_select_anon" on public.user_goals;
drop policy if exists "user_goals_update_anon" on public.user_goals;
drop policy if exists "user_goals_select_authenticated" on public.user_goals;
drop policy if exists "user_goals_update_authenticated" on public.user_goals;

-- No public policies: anon and authenticated roles cannot access tables.
-- The Next.js server uses SUPABASE_SERVICE_ROLE_KEY which bypasses RLS.

-- ---------------------------------------------------------------------------
-- Data integrity constraints (safe to re-run)
-- ---------------------------------------------------------------------------

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'foods_serving_size_positive') then
    alter table public.foods add constraint foods_serving_size_positive check (serving_size > 0);
  end if;

  if not exists (select 1 from pg_constraint where conname = 'foods_calories_non_negative') then
    alter table public.foods add constraint foods_calories_non_negative check (calories >= 0);
  end if;

  if not exists (select 1 from pg_constraint where conname = 'foods_protein_non_negative') then
    alter table public.foods add constraint foods_protein_non_negative check (protein >= 0);
  end if;

  if not exists (select 1 from pg_constraint where conname = 'foods_carbs_non_negative') then
    alter table public.foods add constraint foods_carbs_non_negative check (carbs >= 0);
  end if;

  if not exists (select 1 from pg_constraint where conname = 'foods_fat_non_negative') then
    alter table public.foods add constraint foods_fat_non_negative check (fat >= 0);
  end if;

  if not exists (select 1 from pg_constraint where conname = 'foods_fiber_non_negative') then
    alter table public.foods add constraint foods_fiber_non_negative check (fiber is null or fiber >= 0);
  end if;

  if not exists (select 1 from pg_constraint where conname = 'foods_sugar_non_negative') then
    alter table public.foods add constraint foods_sugar_non_negative check (sugar is null or sugar >= 0);
  end if;

  if not exists (select 1 from pg_constraint where conname = 'foods_sodium_non_negative') then
    alter table public.foods add constraint foods_sodium_non_negative check (sodium is null or sodium >= 0);
  end if;

  if not exists (select 1 from pg_constraint where conname = 'log_entries_servings_positive') then
    alter table public.log_entries add constraint log_entries_servings_positive check (servings > 0);
  end if;

  if not exists (select 1 from pg_constraint where conname = 'meal_preset_items_servings_positive') then
    alter table public.meal_preset_items add constraint meal_preset_items_servings_positive check (servings > 0);
  end if;

  if not exists (select 1 from pg_constraint where conname = 'user_goals_age_range') then
    alter table public.user_goals add constraint user_goals_age_range check (age >= 1 and age <= 120);
  end if;

  if not exists (select 1 from pg_constraint where conname = 'user_goals_calories_non_negative') then
    alter table public.user_goals add constraint user_goals_calories_non_negative check (calories >= 0);
  end if;

  if not exists (select 1 from pg_constraint where conname = 'user_goals_protein_non_negative') then
    alter table public.user_goals add constraint user_goals_protein_non_negative check (protein_g >= 0);
  end if;

  if not exists (select 1 from pg_constraint where conname = 'user_goals_carbs_non_negative') then
    alter table public.user_goals add constraint user_goals_carbs_non_negative check (carbs_g >= 0);
  end if;

  if not exists (select 1 from pg_constraint where conname = 'user_goals_fat_non_negative') then
    alter table public.user_goals add constraint user_goals_fat_non_negative check (fat_g >= 0);
  end if;
end $$;
