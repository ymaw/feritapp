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
  IF NOT EXISTS (SELECT 1 FROM pg_class WHERE oid='public.note_labels'::regclass AND relrowsecurity) THEN
    RAISE EXCEPTION 'RLS is not enabled on public.note_labels';
  END IF;
  IF (SELECT count(*) FROM pg_policies WHERE schemaname='public' AND tablename='note_labels') <> 4 THEN
    RAISE EXCEPTION 'Expected four owner-scoped note label policies';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='notes' AND column_name='type_label_id'
  ) OR NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='notes' AND column_name='importance_label_id'
  ) THEN
    RAISE EXCEPTION 'Notes label columns were not created';
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
INSERT INTO public.note_labels(kind,name,color) VALUES ('type','Retiro','#8B5CF6'),('importance','Urgente','#EF4444');
INSERT INTO public.notes(content,client_id,type_label_id,importance_label_id)
VALUES (
  'Nota propia','aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
  (SELECT id FROM public.note_labels WHERE kind='type' AND name='Retiro'),
  (SELECT id FROM public.note_labels WHERE kind='importance' AND name='Urgente')
);
DO $$
DECLARE visible_count integer;
BEGIN
  SELECT count(*) INTO visible_count FROM public.notes;
  IF visible_count <> 1 THEN RAISE EXCEPTION 'Owner cannot read own note'; END IF;
  SELECT count(*) INTO visible_count FROM public.note_labels;
  IF visible_count <> 2 THEN RAISE EXCEPTION 'Owner cannot read own labels'; END IF;
  IF NOT EXISTS (SELECT 1 FROM public.notes WHERE type_label_id IS NOT NULL AND importance_label_id IS NOT NULL) THEN
    RAISE EXCEPTION 'Note type and importance labels were not persisted';
  END IF;
END $$;
SET LOCAL request.jwt.claim.sub = '22222222-2222-4222-8222-222222222222';
DO $$
DECLARE visible_count integer;
BEGIN
  SELECT count(*) INTO visible_count FROM public.notes;
  IF visible_count <> 0 THEN RAISE EXCEPTION 'Cross-user Notes visibility detected'; END IF;
END $$;
ROLLBACK;
