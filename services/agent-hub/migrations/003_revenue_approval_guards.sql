-- Agent Hub: revenue approval guards.
-- Adds draft/no-send and founder approval fields without exposing private
-- accounting or public-benefit claims.

alter table leads
  add column if not exists no_send boolean not null default true,
  add column if not exists approval_status text not null default 'pending',
  add column if not exists approved_by text,
  add column if not exists approved_at timestamptz,
  add column if not exists approval_notes text,
  add column if not exists copy_risk_flags text[] not null default '{}';

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'leads_approval_status_check'
  ) then
    alter table leads
      add constraint leads_approval_status_check
      check (approval_status in ('pending', 'approved', 'rejected', 'blocked'));
  end if;
end $$;

create table if not exists lead_approval_events (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references leads(id) on delete cascade,
  action text not null,
  actor text,
  notes text,
  no_send boolean,
  approval_status text,
  created_at timestamptz not null default now()
);

create index if not exists idx_leads_no_send on leads (no_send);
create index if not exists idx_leads_approval_status on leads (approval_status);
create index if not exists idx_lead_approval_events_lead_id on lead_approval_events (lead_id);
