-- Applied 2026-09-29 to the ANTIGRAVITY project (jmvgdqomvnkfgknmgwxp) as migration perf_hygiene_2026_09_29.
-- 1. Advisor 0003: recreate every service_role policy with (select auth.role()), same semantics, evaluated once per statement.
do $$
declare p record;
begin
  for p in
    select schemaname, tablename, policyname from pg_policies
    where schemaname = 'public'
      and qual = '(auth.role() = ''service_role''::text)'
      and with_check = '(auth.role() = ''service_role''::text)'
  loop
    execute format('drop policy %I on %I.%I', p.policyname, p.schemaname, p.tablename);
    execute format('create policy %I on %I.%I for all using ((select auth.role()) = ''service_role'') with check ((select auth.role()) = ''service_role'')',
      p.policyname, p.schemaname, p.tablename);
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
