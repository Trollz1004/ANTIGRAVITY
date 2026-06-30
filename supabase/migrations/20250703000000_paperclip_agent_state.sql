-- Supabase brain table for Paperclip agent STATE.md persistence.
-- Apply via Supabase SQL Editor or `supabase-execute_sql`.
create table if not exists public.paperclip_agent_state (
  agent_id text primary key,
  state_md text not null,
  checksum text not null,
  updated_at timestamptz not null default now(),
  node_id text not null default 'unknown',
  session_count int not null default 0
);

-- Service-role-only access. Agents read/write via backend with secret key.
alter table public.paperclip_agent_state enable row level security;

-- No public access. RLS policy blocks anon/authenticated reads/writes.
create policy "paperclip_agent_state_service_only"
  on public.paperclip_agent_state
  for all
  to public, authenticated
  using (false)
  with check (false);
