-- TRO-297: Postgres schema for funding-platform deals and profiles
--
-- Independent bounded context, namespaced with a funding_ prefix so these
-- tables never collide with the existing dating-app users/profiles tables
-- defined in app/models.py. Conventions match the rest of the FastAPI
-- backend: UUID PKs (uuid_generate_v4/gen_random_uuid), TIMESTAMPTZ audit
-- columns with now() defaults, ON DELETE CASCADE on ownership FKs.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Account for a funding-platform participant (founder or investor).
CREATE TABLE funding_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('founder', 'investor', 'admin')),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    email_verified_at TIMESTAMPTZ,
    last_login_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- One profile per user: public-facing bio/company details.
CREATE TABLE funding_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE REFERENCES funding_users(id) ON DELETE CASCADE,
    display_name TEXT NOT NULL,
    company_name TEXT,
    title TEXT,
    bio TEXT,
    website_url TEXT,
    location TEXT,
    industry_tags TEXT[] NOT NULL DEFAULT '{}',
    avatar_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- A fundraising ask, owned by a founder profile.
CREATE TABLE funding_deals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id UUID NOT NULL REFERENCES funding_users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    summary TEXT,
    stage TEXT NOT NULL CHECK (
        stage IN ('idea', 'pre_seed', 'seed', 'series_a', 'series_b_plus', 'closed')
    ),
    target_amount_cents BIGINT NOT NULL CHECK (target_amount_cents >= 0),
    raised_amount_cents BIGINT NOT NULL DEFAULT 0 CHECK (raised_amount_cents >= 0),
    currency TEXT NOT NULL DEFAULT 'USD',
    status TEXT NOT NULL DEFAULT 'draft' CHECK (
        status IN ('draft', 'open', 'in_negotiation', 'closed', 'withdrawn')
    ),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_funding_deals_owner_id ON funding_deals(owner_id);
CREATE INDEX idx_funding_deals_status ON funding_deals(status);

-- A pitch document/version submitted against a deal.
CREATE TABLE funding_pitches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    deal_id UUID NOT NULL REFERENCES funding_deals(id) ON DELETE CASCADE,
    author_id UUID NOT NULL REFERENCES funding_users(id) ON DELETE CASCADE,
    version INTEGER NOT NULL DEFAULT 1,
    content TEXT NOT NULL,
    deck_url TEXT,
    is_current BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (deal_id, version)
);

CREATE INDEX idx_funding_pitches_deal_id ON funding_pitches(deal_id);

-- A proposed/expressed match between an investor and a deal.
CREATE TABLE funding_investor_matches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    deal_id UUID NOT NULL REFERENCES funding_deals(id) ON DELETE CASCADE,
    investor_id UUID NOT NULL REFERENCES funding_users(id) ON DELETE CASCADE,
    match_score FLOAT,
    status TEXT NOT NULL DEFAULT 'suggested' CHECK (
        status IN ('suggested', 'interested', 'passed', 'meeting_scheduled', 'invested')
    ),
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (deal_id, investor_id)
);

CREATE INDEX idx_funding_investor_matches_investor_id ON funding_investor_matches(investor_id);
CREATE INDEX idx_funding_investor_matches_status ON funding_investor_matches(status);

-- Append-only audit trail of activity across the funding platform.
CREATE TABLE funding_activity_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    actor_id UUID REFERENCES funding_users(id) ON DELETE SET NULL,
    deal_id UUID REFERENCES funding_deals(id) ON DELETE CASCADE,
    action TEXT NOT NULL,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_funding_activity_log_deal_id ON funding_activity_log(deal_id);
CREATE INDEX idx_funding_activity_log_actor_id ON funding_activity_log(actor_id);
CREATE INDEX idx_funding_activity_log_created_at ON funding_activity_log(created_at);
