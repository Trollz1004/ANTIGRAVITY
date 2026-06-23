-- Supabase bootstrap for ANTIGRAVITY / YouAndINotAI
-- Project ref: jmvgdqomvnkfgknmgwxp
-- Safe to run repeatedly. Secrets are not stored here.

create extension if not exists pgcrypto;

create table if not exists public.members (
    id uuid primary key default gen_random_uuid(),
    email text not null unique,
    plan text not null check (plan in ('bot_shield', 'founding', '3month', '12month', 'royalty')),
    square_payment_id text,
    created_at timestamptz not null default now(),
    active boolean not null default true,
    is_minor boolean not null default false,
    free_tier boolean not null default false
);

create index if not exists ix_members_email on public.members (email);
create index if not exists ix_members_square_payment_id on public.members (square_payment_id);
create index if not exists ix_members_active on public.members (active);

-- Keep this compatible with the existing SQLAlchemy RevenueAllocation model.
-- The requested Supabase launch fields are: id, amount_cents, source, bucket, created_at.
-- Existing Square ledger fields stay present so live payment allocation logic does not break.
create table if not exists public.revenue_allocations (
    id uuid primary key default gen_random_uuid(),
    user_id uuid,
    source text not null default 'square',
    source_event_id text,
    square_payment_id text,
    payment_tier text not null default 'unknown',
    gross_amount_cents integer,
    business_reserve_amount_cents integer,
    operating_amount_cents integer,
    business_reserve_percent integer not null default 10,
    beneficiary_lane text not null default 'kids_support',
    status text not null default 'reserved',
    payer_type text not null default 'customer',
    amount_cents integer,
    bucket text,
    created_at timestamptz not null default now(),
    disbursed_at timestamptz
);

alter table public.revenue_allocations
    add column if not exists user_id uuid,
    add column if not exists source text not null default 'square',
    add column if not exists source_event_id text,
    add column if not exists square_payment_id text,
    add column if not exists payment_tier text not null default 'unknown',
    add column if not exists gross_amount_cents integer,
    add column if not exists business_reserve_amount_cents integer,
    add column if not exists operating_amount_cents integer,
    add column if not exists business_reserve_percent integer not null default 10,
    add column if not exists beneficiary_lane text not null default 'kids_support',
    add column if not exists status text not null default 'reserved',
    add column if not exists payer_type text not null default 'customer',
    add column if not exists amount_cents integer,
    add column if not exists bucket text,
    add column if not exists created_at timestamptz not null default now(),
    add column if not exists disbursed_at timestamptz;

alter table public.revenue_allocations
    alter column source set default 'square',
    alter column payment_tier set default 'unknown',
    alter column business_reserve_percent set default 10,
    alter column beneficiary_lane set default 'kids_support',
    alter column status set default 'reserved',
    alter column payer_type set default 'customer',
    alter column created_at set default now();

do $$
begin
    if exists (
        select 1
        from information_schema.columns
        where table_schema = 'public'
          and table_name = 'revenue_allocations'
          and column_name = 'gross_amount_cents'
    ) then
        execute 'update public.revenue_allocations set amount_cents = gross_amount_cents where amount_cents is null';
    end if;
end
$$;

alter table public.revenue_allocations
    drop constraint if exists ck_revenue_allocations_source_square,
    add constraint ck_revenue_allocations_source_square check (source in ('square'));

alter table public.revenue_allocations
    drop constraint if exists ck_revenue_allocations_bucket,
    add constraint ck_revenue_allocations_bucket check (bucket is null or bucket in ('kids_reserve', 'ops', 'staked'));

create unique index if not exists uq_revenue_allocations_source_event_id
    on public.revenue_allocations (source_event_id)
    where source_event_id is not null;
create unique index if not exists uq_revenue_allocations_square_payment_id
    on public.revenue_allocations (square_payment_id)
    where square_payment_id is not null;
create index if not exists ix_revenue_allocations_user_id on public.revenue_allocations (user_id);
create index if not exists ix_revenue_allocations_source on public.revenue_allocations (source);
create index if not exists ix_revenue_allocations_bucket on public.revenue_allocations (bucket);
create index if not exists ix_revenue_allocations_created_at on public.revenue_allocations (created_at);

alter table public.members enable row level security;
alter table public.revenue_allocations enable row level security;

-- Explicit service-role-only policies for now. Supabase service_role also bypasses RLS,
-- but keeping policies documented makes the boundary visible in the schema.
drop policy if exists members_service_role_all on public.members;
create policy members_service_role_all
    on public.members
    for all
    using (auth.role() = 'service_role')
    with check (auth.role() = 'service_role');

drop policy if exists revenue_allocations_service_role_all on public.revenue_allocations;
create policy revenue_allocations_service_role_all
    on public.revenue_allocations
    for all
    using (auth.role() = 'service_role')
    with check (auth.role() = 'service_role');
