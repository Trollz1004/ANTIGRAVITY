-- Supabase RLS policy backfill for ANTIGRAVITY / YouAndINotAI
-- Project ref: jmvgdqomvnkfgknmgwxp
-- Applied: 2026-08-26 (migration `20260826_rls_service_role_policies`)
--
-- Clears the Supabase linter finding `rls_enabled_no_policy` (0008) on 26
-- tables that had RLS enabled with zero policies.
--
-- Matches the house convention in 20260618_supabase_members_revenue_allocations.sql:
-- the backend connects as the postgres superuser (SUPABASE_DB_URL), which
-- bypasses RLS entirely; service_role also bypasses RLS. These policies make
-- the boundary explicit in the schema and clear the linter without granting
-- anon/authenticated any access.
--
-- Safe to run repeatedly (create policy is idempotent per policy name; if a
-- policy already exists, drop it first or the create will error).

create policy boards_service_role_all
    on public.boards for all
    using (auth.role() = 'service_role') with check (auth.role() = 'service_role');
create policy comments_service_role_all
    on public.comments for all
    using (auth.role() = 'service_role') with check (auth.role() = 'service_role');
create policy data_privacy_logs_service_role_all
    on public.data_privacy_logs for all
    using (auth.role() = 'service_role') with check (auth.role() = 'service_role');
create policy double_date_acceptances_service_role_all
    on public.double_date_acceptances for all
    using (auth.role() = 'service_role') with check (auth.role() = 'service_role');
create policy double_date_sessions_service_role_all
    on public.double_date_sessions for all
    using (auth.role() = 'service_role') with check (auth.role() = 'service_role');
create policy event_rsvps_service_role_all
    on public.event_rsvps for all
    using (auth.role() = 'service_role') with check (auth.role() = 'service_role');
create policy events_service_role_all
    on public.events for all
    using (auth.role() = 'service_role') with check (auth.role() = 'service_role');
create policy marketing_content_service_role_all
    on public.marketing_content for all
    using (auth.role() = 'service_role') with check (auth.role() = 'service_role');
create policy matches_service_role_all
    on public.matches for all
    using (auth.role() = 'service_role') with check (auth.role() = 'service_role');
create policy messages_service_role_all
    on public.messages for all
    using (auth.role() = 'service_role') with check (auth.role() = 'service_role');
create policy posts_service_role_all
    on public.posts for all
    using (auth.role() = 'service_role') with check (auth.role() = 'service_role');
create policy profiles_service_role_all
    on public.profiles for all
    using (auth.role() = 'service_role') with check (auth.role() = 'service_role');
create policy refresh_tokens_service_role_all
    on public.refresh_tokens for all
    using (auth.role() = 'service_role') with check (auth.role() = 'service_role');
create policy revenue_allocations_service_role_all
    on public.revenue_allocations for all
    using (auth.role() = 'service_role') with check (auth.role() = 'service_role');
create policy support_tickets_service_role_all
    on public.support_tickets for all
    using (auth.role() = 'service_role') with check (auth.role() = 'service_role');
create policy swipes_service_role_all
    on public.swipes for all
    using (auth.role() = 'service_role') with check (auth.role() = 'service_role');
create policy user_blocks_service_role_all
    on public.user_blocks for all
    using (auth.role() = 'service_role') with check (auth.role() = 'service_role');
create policy user_reports_service_role_all
    on public.user_reports for all
    using (auth.role() = 'service_role') with check (auth.role() = 'service_role');
create policy users_service_role_all
    on public.users for all
    using (auth.role() = 'service_role') with check (auth.role() = 'service_role');
create policy verification_events_service_role_all
    on public.verification_events for all
    using (auth.role() = 'service_role') with check (auth.role() = 'service_role');
create policy video_calls_service_role_all
    on public.video_calls for all
    using (auth.role() = 'service_role') with check (auth.role() = 'service_role');
create policy volunteer_opportunities_service_role_all
    on public.volunteer_opportunities for all
    using (auth.role() = 'service_role') with check (auth.role() = 'service_role');
create policy volunteer_signups_service_role_all
    on public.volunteer_signups for all
    using (auth.role() = 'service_role') with check (auth.role() = 'service_role');
create policy webhook_dead_letter_service_role_all
    on public.webhook_dead_letter for all
    using (auth.role() = 'service_role') with check (auth.role() = 'service_role');
create policy webhook_events_service_role_all
    on public.webhook_events for all
    using (auth.role() = 'service_role') with check (auth.role() = 'service_role');
create policy webhook_retry_queue_service_role_all
    on public.webhook_retry_queue for all
    using (auth.role() = 'service_role') with check (auth.role() = 'service_role');
