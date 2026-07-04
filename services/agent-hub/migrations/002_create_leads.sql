-- Agent Hub: Lead-gen CRM tables (ported from Emergent civic-marketplace CRM)
-- Run on the Supabase Postgres instance (project jmvgdqomvnkfgknmgwxp).
--
-- Source: Emergent lead-gen CRM for youandinotai.com (civic-marketplace-1.preview.emergentagent.com),
-- captured 2026-07-04 (see scratchpad crm-export-manifest.md / crm-port-map.md for full recon).
--
-- Design notes:
--   * Every field observed in the live export is preserved losslessly.
--   * The live `leads.score` field (0-100 lead-quality number, always present) is preserved
--     under `crm_score` to avoid colliding with the NEW nullable agent-hub/DREAM `score int`
--     column requested for this phase — these are two distinct scoring concepts (CRM quality
--     score vs. agent-hub/game score) and must not silently overwrite one another.
--   * The live `leads.status` field (enum: new/contacted/qualified/engaged/converted/lost) is
--     preserved as `status`, distinct from the new agent-hub `stage` column.
--   * RLS is enabled on all six tables (secure default). The hub connects with a BYPASSRLS
--     service role, so no anon/authenticated policies are created here — Postgres has no
--     visibility into the platform API-key header; that gate lives in the Express layer
--     (services/agent-hub/src/leads/routes/leads.js).
--   * platforms.api_key_hash stores a sha256 hash only. The 4 live plaintext keys observed
--     during recon (Youandinotai.com, Recycle.org, AI-Solutions.store, Aidiesitall.website)
--     were exposed unauthenticated on the source host and should be treated as burned /
--     rotation-listed — never re-store plaintext values here.

create extension if not exists "pgcrypto";

-- ============================================================================
-- templates (created before campaigns due to campaigns.template_id FK)
-- ============================================================================
create table if not exists templates (
  id            uuid primary key default gen_random_uuid(),
  name          text not null,
  subject       text not null,
  html_content  text not null,
  category      text,                      -- live enum: onboarding | engagement | reengagement
  variables     text[] default '{}',       -- e.g. ["name"]
  created_at    timestamptz not null default now()
);

-- ============================================================================
-- campaigns
-- ============================================================================
create table if not exists campaigns (
  id              uuid primary key default gen_random_uuid(),
  name            text not null,
  -- template_id references templates(id) BY CONVENTION ONLY — no DB foreign key.
  -- The live Emergent export contains campaigns whose template_id values are absent
  -- from the captured templates export (upstream data-integrity gap in the source
  -- system, not introduced here). A hard FK would reject the real captured data;
  -- preserved losslessly instead of being nulled or backed by fabricated placeholder
  -- template rows. See column comment applied below.
  template_id     uuid,
  target_segment  jsonb default '{}'::jsonb,   -- free-form targeting filter, e.g. {"city":"New York","min_score":30}
  status          text default 'draft',        -- live values observed: completed
  scheduled_at    timestamptz,
  sent_count      integer default 0,
  open_count      integer default 0,
  click_count     integer default 0,
  bounce_count    integer default 0,
  created_at      timestamptz not null default now()
);

comment on column campaigns.template_id is
  'References templates(id) by convention, but NOT enforced with a DB foreign key: the live Emergent export contains campaigns whose template_id values are absent from the captured templates export (upstream data-integrity gap in the source system, not introduced here). Preserved losslessly rather than nulled or backed by fabricated placeholder rows.';

-- ============================================================================
-- leads
-- ============================================================================
create table if not exists leads (
  id                uuid primary key default gen_random_uuid(),
  name              text not null,
  email             text not null,
  phone             text,                              -- nullable in live data (22/100 null)
  city              text,
  interests         text[] default '{}',
  source            text,                               -- event, referral, partner, website, social_media, landing_page, cold_outreach
  crm_score         integer default 0,                  -- live "score" field (0-100 lead quality), renamed to avoid collision
  status            text default 'new',                 -- live enum: new/contacted/qualified/engaged/converted/lost
  tags              text[] default '{}',
  notes             text default '',
  last_contacted    timestamptz,                         -- always null in captured export, kept nullable
  email_opens       integer default 0,
  email_clicks      integer default 0,
  conversion_value  numeric default 0,
  campaign_id       uuid references campaigns(id),       -- always null in captured export, kept nullable + FK
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),

  -- --- agent-hub / DREAM additive columns (nullable, new for this phase) ---
  platform          text,
  stage             text,
  score             integer,
  game_data         jsonb,
  ai_summary        text
);

create index if not exists idx_leads_email on leads (email);
create index if not exists idx_leads_platform on leads (platform);
create index if not exists idx_leads_stage on leads (stage);

-- ============================================================================
-- rules (no live equivalent observed — 404 on source host; created per dispatch spec)
-- ============================================================================
create table if not exists rules (
  id            uuid primary key default gen_random_uuid(),
  name          text not null,
  condition     jsonb not null default '{}'::jsonb,
  action        jsonb not null default '{}'::jsonb,
  active        boolean default true,
  fired_count   integer default 0,
  created_at    timestamptz not null default now()
);

-- ============================================================================
-- pages (no live equivalent observed — 404 on source host; created per dispatch spec)
-- ============================================================================
create table if not exists pages (
  id            uuid primary key default gen_random_uuid(),
  slug          text unique not null,
  template      text,
  body_json     jsonb,
  views         integer default 0,
  submits       integer default 0,
  created_at    timestamptz not null default now()
);

-- ============================================================================
-- platforms
-- ============================================================================
-- SECURITY: api_key_hash stores sha256(plaintext key) ONLY. Never store or log the
-- plaintext key. The 4 keys captured from the live Emergent host during recon
-- (Youandinotai.com, Recycle.org, AI-Solutions.store, Aidiesitall.website) were served
-- unauthenticated in plaintext by the source system and must be treated as
-- burned/rotation-listed — rotate them before relying on this table for real auth.
create table if not exists platforms (
  id            uuid primary key default gen_random_uuid(),
  slug          text unique not null,
  name          text not null,
  api_key_hash  text not null,               -- sha256 hex digest of the (rotated) plaintext key
  leads_sent    integer default 0,
  active        boolean default true,
  created_at    timestamptz not null default now()
);

-- ============================================================================
-- Row Level Security — secure default. The hub connects as a BYPASSRLS role,
-- so these tables are locked to everything else by default (no anon/authenticated
-- policies are defined). Platform-key gating for public ingest endpoints happens
-- in the Express layer, not in Postgres RLS.
-- ============================================================================
alter table leads enable row level security;
alter table campaigns enable row level security;
alter table templates enable row level security;
alter table rules enable row level security;
alter table pages enable row level security;
alter table platforms enable row level security;
