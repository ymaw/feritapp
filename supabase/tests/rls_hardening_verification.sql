-- Verificación post-migración V12.124.
-- Ejecutar en Supabase SQL Editor DESPUÉS de MIGRACION_V12_124_SEGURIDAD_RLS.sql.
-- Solo lectura: no cambia tablas, filas, políticas ni privilegios.

DO $$
DECLARE
  table_name text;
  expected_tables text[] := ARRAY['sales','clients','categories','user_settings'];
  update_policy_count integer;
  business_policy_count integer;
  avatar_is_public boolean;
BEGIN
  FOREACH table_name IN ARRAY expected_tables LOOP
    IF (SELECT c.relrowsecurity
        FROM pg_class c
        JOIN pg_namespace n ON n.oid = c.relnamespace
        WHERE n.nspname = 'public' AND c.relname = table_name) IS DISTINCT FROM true THEN
      RAISE EXCEPTION 'RLS no está habilitado en public.%', table_name;
    END IF;

    IF has_table_privilege('anon', 'public.' || table_name, 'SELECT')
       OR has_table_privilege('anon', 'public.' || table_name, 'INSERT')
       OR has_table_privilege('anon', 'public.' || table_name, 'UPDATE')
       OR has_table_privilege('anon', 'public.' || table_name, 'DELETE')
       OR has_table_privilege('anon', 'public.' || table_name, 'TRUNCATE') THEN
      RAISE EXCEPTION 'anon conserva privilegios sobre public.%', table_name;
    END IF;

    IF has_table_privilege('authenticated', 'public.' || table_name, 'TRUNCATE')
       OR has_table_privilege('authenticated', 'public.' || table_name, 'REFERENCES')
       OR has_table_privilege('authenticated', 'public.' || table_name, 'TRIGGER') THEN
      RAISE EXCEPTION 'authenticated conserva privilegios excesivos sobre public.%', table_name;
    END IF;

    IF NOT has_table_privilege('authenticated', 'public.' || table_name, 'SELECT')
       OR NOT has_table_privilege('authenticated', 'public.' || table_name, 'INSERT') THEN
      RAISE EXCEPTION 'Faltan permisos de lectura/alta para authenticated en public.%', table_name;
    END IF;
  END LOOP;

  IF NOT has_table_privilege('authenticated', 'public.sales', 'UPDATE')
     OR NOT has_table_privilege('authenticated', 'public.sales', 'DELETE')
     OR NOT has_table_privilege('authenticated', 'public.clients', 'UPDATE')
     OR NOT has_table_privilege('authenticated', 'public.clients', 'DELETE')
     OR NOT has_table_privilege('authenticated', 'public.categories', 'DELETE')
     OR NOT has_table_privilege('authenticated', 'public.user_settings', 'UPDATE')
     OR has_table_privilege('authenticated', 'public.user_settings', 'DELETE')
     OR has_table_privilege('authenticated', 'public.categories', 'UPDATE') THEN
    RAISE EXCEPTION 'Los grants CRUD no coinciden con las operaciones previstas por FeritApp';
  END IF;

  SELECT count(*) INTO business_policy_count
  FROM pg_policies
  WHERE schemaname = 'public'
    AND tablename = ANY(expected_tables)
    AND cardinality(roles) = 1
    AND roles @> ARRAY['authenticated']::name[];

  IF business_policy_count <> 14 THEN
    RAISE EXCEPTION 'Se esperaban 14 políticas de negocio para authenticated; se encontraron %', business_policy_count;
  END IF;

  SELECT count(*) INTO update_policy_count
  FROM pg_policies
  WHERE schemaname = 'public'
    AND tablename IN ('sales','clients','user_settings')
    AND cmd = 'UPDATE'
    AND qual IS NOT NULL
    AND with_check IS NOT NULL
    AND cardinality(roles) = 1
    AND roles @> ARRAY['authenticated']::name[];

  IF update_policy_count <> 3 THEN
    RAISE EXCEPTION 'Se esperaban 3 políticas UPDATE con USING y WITH CHECK; se encontraron %', update_policy_count;
  END IF;

  IF has_table_privilege('anon', 'storage.objects', 'INSERT')
     OR has_table_privilege('anon', 'storage.objects', 'UPDATE')
     OR has_table_privilege('anon', 'storage.objects', 'DELETE')
     OR has_table_privilege('anon', 'storage.objects', 'TRUNCATE') THEN
    RAISE EXCEPTION 'anon conserva permisos de escritura sobre storage.objects';
  END IF;

  IF NOT has_table_privilege('anon', 'storage.objects', 'SELECT')
     OR NOT has_table_privilege('authenticated', 'storage.objects', 'INSERT')
     OR NOT has_table_privilege('authenticated', 'storage.objects', 'UPDATE')
     OR NOT has_table_privilege('authenticated', 'storage.objects', 'DELETE')
     OR has_table_privilege('authenticated', 'storage.objects', 'TRUNCATE') THEN
    RAISE EXCEPTION 'Los grants de storage.objects no coinciden con la política prevista';
  END IF;

  SELECT b.public INTO avatar_is_public
  FROM storage.buckets AS b
  WHERE b.id = 'avatars';

  IF avatar_is_public IS DISTINCT FROM true THEN
    RAISE EXCEPTION 'El bucket avatars dejó de ser público; revisar el requisito funcional';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects'
      AND policyname = 'avatar_public_read'
      AND cmd = 'SELECT'
      AND cardinality(roles) = 1
      AND roles @> ARRAY['public']::name[]
  ) THEN
    RAISE EXCEPTION 'No se encontró la política de lectura pública de avatars';
  END IF;

  IF EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects'
      AND policyname IN ('avatar_owner_insert','avatar_owner_update','avatar_owner_delete')
      AND (cardinality(roles) <> 1 OR NOT (roles @> ARRAY['authenticated']::name[]))
  ) THEN
    RAISE EXCEPTION 'Una política de escritura de avatars no está limitada a authenticated';
  END IF;

  RAISE NOTICE 'V12.124: comprobaciones de grants, RLS y Storage aprobadas.';
END
$$;

-- Verificación visual complementaria de los grants por defecto:
SELECT defaclobjtype, defaclacl
FROM pg_default_acl
WHERE defaclrole = 'postgres'::regrole
  AND defaclnamespace = 'public'::regnamespace
ORDER BY defaclobjtype;
