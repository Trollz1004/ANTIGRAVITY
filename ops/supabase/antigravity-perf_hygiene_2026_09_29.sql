-- Applied 2026-09-29 to the ANTIGRAVITY project (jmvgdqomvnkfgknmgwxp) as migration perf_hygiene_2026_09_29.
--
-- Record of what ran, and one correction to the form kept here. The version applied live hard-coded
-- `for all` and the default PERMISSIVE / TO public when recreating each policy. Verified before (the
-- pg_policies query in the audit) and after (2026-09-29 02:38 UTC: 26 rows, all PERMISSIVE, roles
-- {public}, cmd ALL) that every policy it matched was exactly that, so the live effect is identical.
-- The block below is the attribute-preserving form (permissive, roles, cmd carried over), which is
-- what any re-run elsewhere must use; GitHub code scanning flagged the hard-coded form on the pull request.
--
-- 1. Advisor 0003: recreate every service_role policy with (select auth.role()), same semantics, evaluated once per statement.
do $$
declare p record;
begin
  for p in
    select schemaname, tablename, policyname, permissive, roles, cmd from pg_policies
    where schemaname = 'public'
      and qual = '(auth.role() = ''service_role''::text)'
      and with_check = '(auth.role() = ''service_role''::text)'
  loop
    execute format('drop policy %I on %I.%I', p.policyname, p.schemaname, p.tablename);
    execute format(
      'create policy %I on %I.%I as %s for %s to %s using ((select auth.role()) = ''service_role'') with check ((select auth.role()) = ''service_role'')',
      p.policyname, p.schemaname, p.tablename,
      case when p.permissive = 'RESTRICTIVE' then 'restrictive' else 'permissive' end,
      case when p.cmd = '*' or p.cmd is null then 'all' else p.cmd end,
      coalesce((select string_agg(quote_ident(r), ', ') from unnest(p.roles) as r), 'public'));
  end loop;
end $$;
-- 2. Advisor 0001: index the first column of each single-column foreign key that had no covering index.
do $$
declare fk record;
begin
  for fk in
    select c.conrelid::regclass as tbl, a.attname as col
    from pg_constraint c
    join pg_attribute a on a.attrelid = c.conrelid and a.attnum = c.conkey[1]
    join pg_namespace n on n.oid = c.connamespace
    where c.contype = 'f' and n.nspname = 'public' and array_length(c.conkey, 1) = 1
      and not exists (select 1 from pg_index i where i.indrelid = c.conrelid and i.indkey[0] = c.conkey[1])
  loop
    execute format('create index if not exists %I on %s (%I)', 'ix_' || replace(fk.tbl::text, 'public.', '') || '_' || fk.col, fk.tbl, fk.col);
  end loop;
end $$;
