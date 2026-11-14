DO $$
DECLARE
  notes_oid oid := 'public.notes'::regclass;
BEGIN
  IF NOT (SELECT relrowsecurity FROM pg_class WHERE oid=notes_oid) THEN
    RAISE EXCEPTION 'RLS is not enabled on public.notes';
  END IF;
  IF (SELECT count(*) FROM pg_policies WHERE schemaname='public' AND tablename='notes') <> 4 THEN
    RAISE EXCEPTION 'Expected four owner-scoped Notes policies';
  END IF;
  IF has_table_privilege('anon','public.notes','SELECT')
    OR has_table_privilege('anon','public.notes','INSERT')
    OR has_table_privilege('anon','public.notes','UPDATE')
    OR has_table_privilege('anon','public.notes','DELETE') THEN
    RAISE EXCEPTION 'anon must not have Notes table privileges';
  END IF;
  IF NOT (
    has_table_privilege('authenticated','public.notes','SELECT')
    AND has_table_privilege('authenticated','public.notes','INSERT')
    AND has_table_privilege('authenticated','public.notes','UPDATE')
    AND has_table_privilege('authenticated','public.notes','DELETE')
  ) THEN
    RAISE EXCEPTION 'authenticated is missing Notes CRUD privileges';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='user_settings' AND column_name='navigation_slots'
  ) THEN
    RAISE EXCEPTION 'navigation_slots column was not created';
  END IF;
END $$;

-- Verify tenant isolation and optional client ownership through RLS.
BEGIN;
SET LOCAL ROLE authenticated;
SET LOCAL request.jwt.claim.sub = '11111111-1111-4111-8111-111111111111';
INSERT INTO public.notes(content,client_id) VALUES ('Nota propia','aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa');
DO $$
DECLARE visible_count integer;
BEGIN
  SELECT count(*) INTO visible_count FROM public.notes;
  IF visible_count <> 1 THEN RAISE EXCEPTION 'Owner cannot read own note'; END IF;
END $$;
SET LOCAL request.jwt.claim.sub = '22222222-2222-4222-8222-222222222222';
DO $$
DECLARE visible_count integer;
BEGIN
  SELECT count(*) INTO visible_count FROM public.notes;
  IF visible_count <> 0 THEN RAISE EXCEPTION 'Cross-user Notes visibility detected'; END IF;
END $$;
ROLLBACK;
