-- Supabase Schema for FinanceFlow (Find)
-- Execute in Supabase SQL Editor

-- Extensions (uuid and crypto)
create extension if not exists "pgcrypto";

-- Enums
do $$ begin
  create type public.transaction_type as enum ('income','expense');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.transaction_status as enum ('pending','paid','overdue');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.spreadsheet_type as enum ('investments','income','expenses');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.column_type as enum ('text','number','date','select');
exception when duplicate_object then null; end $$;

-- Tables
create table if not exists public.transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  type transaction_type not null,
  amount numeric(14,2) not null check (amount >= 0),
  description text not null,
  category text not null,
  date date not null,
  is_recurring boolean not null default false,
  due_date date,
  status transaction_status,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.capital_divisions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  percentage numeric(5,2) not null check (percentage >= 0 and percentage <= 100),
  color text not null default '#10B981',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.spreadsheets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  type spreadsheet_type not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.spreadsheet_columns (
  id uuid primary key default gen_random_uuid(),
  spreadsheet_id uuid not null references public.spreadsheets(id) on delete cascade,
  key text not null,
  label text not null,
  type column_type not null,
  options jsonb,
  position int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (spreadsheet_id, key)
);

create table if not exists public.spreadsheet_rows (
  id uuid primary key default gen_random_uuid(),
  spreadsheet_id uuid not null references public.spreadsheets(id) on delete cascade,
  data jsonb not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Updated_at trigger
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

do $$ begin
  create trigger set_timestamp_transactions
    before update on public.transactions
    for each row execute procedure public.set_updated_at();
exception when duplicate_object then null; end $$;

do $$ begin
  create trigger set_timestamp_capital_divisions
    before update on public.capital_divisions
    for each row execute procedure public.set_updated_at();
exception when duplicate_object then null; end $$;

do $$ begin
  create trigger set_timestamp_spreadsheets
    before update on public.spreadsheets
    for each row execute procedure public.set_updated_at();
exception when duplicate_object then null; end $$;

do $$ begin
  create trigger set_timestamp_spreadsheet_columns
    before update on public.spreadsheet_columns
    for each row execute procedure public.set_updated_at();
exception when duplicate_object then null; end $$;

do $$ begin
  create trigger set_timestamp_spreadsheet_rows
    before update on public.spreadsheet_rows
    for each row execute procedure public.set_updated_at();
exception when duplicate_object then null; end $$;

-- Indexes
create index if not exists idx_transactions_user_type_date on public.transactions (user_id, type, date desc);
create index if not exists idx_divisions_user on public.capital_divisions (user_id);
create index if not exists idx_spreadsheets_user on public.spreadsheets (user_id);
create index if not exists idx_columns_spreadsheet_position on public.spreadsheet_columns (spreadsheet_id, position);
create index if not exists idx_rows_spreadsheet on public.spreadsheet_rows (spreadsheet_id);

-- RLS
alter table public.transactions enable row level security;
alter table public.capital_divisions enable row level security;
alter table public.spreadsheets enable row level security;
alter table public.spreadsheet_columns enable row level security;
alter table public.spreadsheet_rows enable row level security;

-- Policies (owner-based) - compatível com Postgres sem IF NOT EXISTS
-- transactions
drop policy if exists "transactions_select_own" on public.transactions;
create policy "transactions_select_own"
  on public.transactions for select
  using (auth.uid() = user_id);

drop policy if exists "transactions_write_own" on public.transactions;
create policy "transactions_write_own"
  on public.transactions for insert
  with check (auth.uid() = user_id);

drop policy if exists "transactions_update_own" on public.transactions;
create policy "transactions_update_own"
  on public.transactions for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "transactions_delete_own" on public.transactions;
create policy "transactions_delete_own"
  on public.transactions for delete
  using (auth.uid() = user_id);

-- capital_divisions
drop policy if exists "divisions_select_own" on public.capital_divisions;
create policy "divisions_select_own"
  on public.capital_divisions for select
  using (auth.uid() = user_id);

drop policy if exists "divisions_write_own" on public.capital_divisions;
create policy "divisions_write_own"
  on public.capital_divisions for insert
  with check (auth.uid() = user_id);

drop policy if exists "divisions_update_own" on public.capital_divisions;
create policy "divisions_update_own"
  on public.capital_divisions for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "divisions_delete_own" on public.capital_divisions;
create policy "divisions_delete_own"
  on public.capital_divisions for delete
  using (auth.uid() = user_id);

-- Auto-fill user_id on insert using auth.uid() if not provided
create or replace function public.set_user_id()
returns trigger as $$
begin
  if new.user_id is null then
    new.user_id := auth.uid();
  end if;
  return new;
end;
$$ language plpgsql;

do $$ begin
  create trigger set_user_id_transactions
    before insert on public.transactions
    for each row execute procedure public.set_user_id();
exception when duplicate_object then null; end $$;

do $$ begin
  create trigger set_user_id_divisions
    before insert on public.capital_divisions
    for each row execute procedure public.set_user_id();
exception when duplicate_object then null; end $$;

do $$ begin
  create trigger set_user_id_spreadsheets
    before insert on public.spreadsheets
    for each row execute procedure public.set_user_id();
exception when duplicate_object then null; end $$;

-- spreadsheets
drop policy if exists "spreadsheets_select_own" on public.spreadsheets;
create policy "spreadsheets_select_own"
  on public.spreadsheets for select
  using (auth.uid() = user_id);

drop policy if exists "spreadsheets_write_own" on public.spreadsheets;
create policy "spreadsheets_write_own"
  on public.spreadsheets for insert
  with check (auth.uid() = user_id);

drop policy if exists "spreadsheets_update_own" on public.spreadsheets;
create policy "spreadsheets_update_own"
  on public.spreadsheets for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "spreadsheets_delete_own" on public.spreadsheets;
create policy "spreadsheets_delete_own"
  on public.spreadsheets for delete
  using (auth.uid() = user_id);

-- Child tables follow ownership via parent spreadsheet
-- spreadsheet_columns
drop policy if exists "columns_select_own" on public.spreadsheet_columns;
create policy "columns_select_own"
  on public.spreadsheet_columns for select
  using (exists (
    select 1 from public.spreadsheets s where s.id = spreadsheet_id and s.user_id = auth.uid()
  ));

drop policy if exists "columns_write_own" on public.spreadsheet_columns;
create policy "columns_write_own"
  on public.spreadsheet_columns for insert
  with check (exists (
    select 1 from public.spreadsheets s where s.id = spreadsheet_id and s.user_id = auth.uid()
  ));

drop policy if exists "columns_update_own" on public.spreadsheet_columns;
create policy "columns_update_own"
  on public.spreadsheet_columns for update
  using (exists (
    select 1 from public.spreadsheets s where s.id = spreadsheet_id and s.user_id = auth.uid()
  ))
  with check (exists (
    select 1 from public.spreadsheets s where s.id = spreadsheet_id and s.user_id = auth.uid()
  ));

drop policy if exists "columns_delete_own" on public.spreadsheet_columns;
create policy "columns_delete_own"
  on public.spreadsheet_columns for delete
  using (exists (
    select 1 from public.spreadsheets s where s.id = spreadsheet_id and s.user_id = auth.uid()
  ));

-- spreadsheet_rows
drop policy if exists "rows_select_own" on public.spreadsheet_rows;
create policy "rows_select_own"
  on public.spreadsheet_rows for select
  using (exists (
    select 1 from public.spreadsheets s where s.id = spreadsheet_id and s.user_id = auth.uid()
  ));

drop policy if exists "rows_write_own" on public.spreadsheet_rows;
create policy "rows_write_own"
  on public.spreadsheet_rows for insert
  with check (exists (
    select 1 from public.spreadsheets s where s.id = spreadsheet_id and s.user_id = auth.uid()
  ));

drop policy if exists "rows_update_own" on public.spreadsheet_rows;
create policy "rows_update_own"
  on public.spreadsheet_rows for update
  using (exists (
    select 1 from public.spreadsheets s where s.id = spreadsheet_id and s.user_id = auth.uid()
  ))
  with check (exists (
    select 1 from public.spreadsheets s where s.id = spreadsheet_id and s.user_id = auth.uid()
  ));

drop policy if exists "rows_delete_own" on public.spreadsheet_rows;
create policy "rows_delete_own"
  on public.spreadsheet_rows for delete
  using (exists (
    select 1 from public.spreadsheets s where s.id = spreadsheet_id and s.user_id = auth.uid()
  ));

-- Seed helper: create default capital divisions for a user
create or replace function public.create_default_divisions(p_user_id uuid)
returns void as $$
begin
  insert into public.capital_divisions (user_id, name, percentage, color)
  values
    (p_user_id, 'Gastos Essenciais', 50, '#10B981'),
    (p_user_id, 'Poupança', 20, '#3B82F6'),
    (p_user_id, 'Investimentos', 20, '#8B5CF6'),
    (p_user_id, 'Lazer', 10, '#F59E0B')
  on conflict do nothing;
end;
$$ language plpgsql security definer;

-- Seed automático ao criar usuário (signup)
create or replace function public.handle_new_user()
returns trigger as $$
begin
  perform public.create_default_divisions(new.id);
  return new;
end;
$$ language plpgsql security definer;

do $$ begin
  drop trigger if exists on_auth_user_created on auth.users;
  create trigger on_auth_user_created
    after insert on auth.users
    for each row execute function public.handle_new_user();
exception when undefined_table then null; end $$;
