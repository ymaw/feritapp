-- Verificación post-migración V12.124.
-- Ejecutar en Supabase SQL Editor DESPUÉS de la migración.
-- Solo lectura: no cambia tablas, filas, políticas ni privilegios.
--
-- La prueba valida:
--   * RLS y grants efectivos exactos para anon/authenticated.
--   * Las 14 políticas de negocio, su rol y sus predicados de propiedad.
--   * Las políticas y grants de Storage para avatars.
--   * Defaults globales y por schema de objetos creados por postgres.
--
-- IMPORTANTE: también falla si funciones nuevas heredan EXECUTE de PUBLIC.
-- ALTER DEFAULT PRIVILEGES ... REVOKE EXECUTE FROM anon, authenticated no
-- elimina por sí solo el EXECUTE global de PUBLIC.

DO $$
DECLARE
  table_name text;
  privilege_name text;
  expected_tables text[] := ARRAY['sales','clients','categories','user_settings'];
  expected_policies integer;
  matching_policies integer;
  update_policy_count integer;
  storage_write_policy_count integer;
  avatar_is_public boolean;
  expected_privilege boolean;
  actual_privilege boolean;
  object_type "char";
BEGIN
  -- 1) RLS y privilegios efectivos sobre las tablas de negocio.
  FOREACH table_name IN ARRAY expected_tables LOOP
    IF (SELECT c.relrowsecurity
        FROM pg_class c
        JOIN pg_namespace n ON n.oid = c.relnamespace
        WHERE n.nspname = 'public' AND c.relname = table_name) IS DISTINCT FROM true THEN
      RAISE EXCEPTION 'RLS no está habilitado en public.%', table_name;
    END IF;

    FOREACH privilege_name IN ARRAY ARRAY[
      'SELECT','INSERT','UPDATE','DELETE','TRUNCATE','REFERENCES','TRIGGER'
    ] LOOP
      IF has_table_privilege('anon', 'public.' || table_name, privilege_name) THEN
        RAISE EXCEPTION 'anon conserva % sobre public.%', privilege_name, table_name;
      END IF;

      expected_privilege := CASE
        WHEN privilege_name IN ('SELECT','INSERT') THEN true
        WHEN table_name IN ('sales','clients') AND privilege_name IN ('UPDATE','DELETE') THEN true
        WHEN table_name = 'categories' AND privilege_name = 'DELETE' THEN true
        WHEN table_name = 'user_settings' AND privilege_name = 'UPDATE' THEN true
        ELSE false
      END;

      actual_privilege := has_table_privilege(
        'authenticated', 'public.' || table_name, privilege_name
      );

      IF actual_privilege IS DISTINCT FROM expected_privilege THEN
        RAISE EXCEPTION
          'Permiso inesperado: authenticated.% sobre public.% (esperado %, actual %)',
          privilege_name, table_name, expected_privilege, actual_privilege;
      END IF;
    END LOOP;
  END LOOP;

  -- 2) Deben existir exactamente las 14 políticas previstas, sin políticas
  --    adicionales ni políticas de negocio asignadas a PUBLIC.
  WITH expected(tablename, policyname, cmd) AS (
    VALUES
      ('sales','sales_select_own','SELECT'),
      ('sales','sales_insert_own','INSERT'),
      ('sales','sales_update_own','UPDATE'),
      ('sales','sales_delete_own','DELETE'),
      ('clients','clients_select_own','SELECT'),
      ('clients','clients_insert_own','INSERT'),
      ('clients','clients_update_own','UPDATE'),
      ('clients','clients_delete_own','DELETE'),
      ('categories','categories_select_own','SELECT'),
      ('categories','categories_insert_own','INSERT'),
      ('categories','categories_delete_own','DELETE'),
      ('user_settings','user_settings_select_own','SELECT'),
      ('user_settings','user_settings_insert_own','INSERT'),
      ('user_settings','user_settings_update_own','UPDATE')
  )
  SELECT count(*)
  INTO expected_policies
  FROM expected;

  SELECT count(*)
  INTO matching_policies
  FROM pg_policies p
  JOIN (
    VALUES
      ('sales','sales_select_own','SELECT'),
      ('sales','sales_insert_own','INSERT'),
      ('sales','sales_update_own','UPDATE'),
      ('sales','sales_delete_own','DELETE'),
      ('clients','clients_select_own','SELECT'),
      ('clients','clients_insert_own','INSERT'),
      ('clients','clients_update_own','UPDATE'),
      ('clients','clients_delete_own','DELETE'),
      ('categories','categories_select_own','SELECT'),
      ('categories','categories_insert_own','INSERT'),
      ('categories','categories_delete_own','DELETE'),
      ('user_settings','user_settings_select_own','SELECT'),
      ('user_settings','user_settings_insert_own','INSERT'),
      ('user_settings','user_settings_update_own','UPDATE')
  ) AS e(tablename, policyname, cmd)
    ON e.tablename = p.tablename
   AND e.policyname = p.policyname
   AND e.cmd = p.cmd
  WHERE p.schemaname = 'public'
    AND cardinality(p.roles) = 1
    AND p.roles @> ARRAY['authenticated']::name[]
    AND CASE
      WHEN p.cmd IN ('SELECT','DELETE') THEN
        p.qual IS NOT NULL
        AND p.qual ILIKE '%user_id%'
        AND p.qual ILIKE '%auth.uid()%'
      WHEN p.cmd = 'INSERT' THEN
        p.with_check IS NOT NULL
        AND p.with_check ILIKE '%user_id%'
        AND p.with_check ILIKE '%auth.uid()%'
      WHEN p.cmd = 'UPDATE' THEN
        p.qual IS NOT NULL
        AND p.with_check IS NOT NULL
        AND p.qual ILIKE '%user_id%'
        AND p.qual ILIKE '%auth.uid()%'
        AND p.with_check ILIKE '%user_id%'
        AND p.with_check ILIKE '%auth.uid()%'
      ELSE false
    END;

  IF (SELECT count(*) FROM pg_policies
      WHERE schemaname = 'public'
        AND tablename = ANY(expected_tables)) <> expected_policies
     OR matching_policies <> expected_policies THEN
    RAISE EXCEPTION
      'Políticas de negocio incorrectas: esperadas %, válidas %. Revisar cantidad, roles, comandos y predicados de propiedad.',
      expected_policies, matching_policies;
  END IF;

  SELECT count(*)
  INTO update_policy_count
  FROM pg_policies
  WHERE schemaname = 'public'
    AND tablename IN ('sales','clients','user_settings')
    AND cmd = 'UPDATE'
    AND qual IS NOT NULL
    AND with_check IS NOT NULL
    AND cardinality(roles) = 1
    AND roles @> ARRAY['authenticated']::name[]
    AND qual ILIKE '%user_id%'
    AND qual ILIKE '%auth.uid()%'
    AND with_check ILIKE '%user_id%'
    AND with_check ILIKE '%auth.uid()%';

  IF update_policy_count <> 3 THEN
    RAISE EXCEPTION
      'Se esperaban 3 políticas UPDATE con USING y WITH CHECK de propiedad; se encontraron %',
      update_policy_count;
  END IF;

  -- Storage debe mantener RLS habilitado además de sus grants y policies.
  IF (SELECT c.relrowsecurity
      FROM pg_class c
      JOIN pg_namespace n ON n.oid = c.relnamespace
      WHERE n.nspname = 'storage' AND c.relname = 'objects') IS DISTINCT FROM true THEN
    RAISE EXCEPTION 'RLS no está habilitado en storage.objects';
  END IF;

  -- 3) Storage: privilegios SQL mínimos. SELECT anónimo se conserva para
  --    que las URLs públicas del bucket sigan funcionando.
  FOREACH privilege_name IN ARRAY ARRAY[
    'INSERT','UPDATE','DELETE','TRUNCATE','REFERENCES','TRIGGER'
  ] LOOP
    IF has_table_privilege('anon', 'storage.objects', privilege_name) THEN
      RAISE EXCEPTION 'anon conserva % sobre storage.objects', privilege_name;
    END IF;

    IF has_table_privilege('authenticated', 'storage.objects', privilege_name)
       IS DISTINCT FROM (privilege_name IN ('INSERT','UPDATE','DELETE')) THEN
      RAISE EXCEPTION
        'Permiso inesperado de authenticated sobre storage.objects: %',
        privilege_name;
    END IF;
  END LOOP;

  IF NOT has_table_privilege('anon', 'storage.objects', 'SELECT')
     OR NOT has_table_privilege('authenticated', 'storage.objects', 'SELECT') THEN
    RAISE EXCEPTION 'Falta SELECT requerido en storage.objects';
  END IF;

  SELECT b.public
  INTO avatar_is_public
  FROM storage.buckets AS b
  WHERE b.id = 'avatars';

  IF avatar_is_public IS DISTINCT FROM true THEN
    RAISE EXCEPTION 'El bucket avatars dejó de ser público; revisar el requisito funcional';
  END IF;

  -- Exige las cuatro políticas concretas de avatars y sus predicados.
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects'
      AND policyname = 'avatar_public_read'
      AND cmd = 'SELECT'
      AND cardinality(roles) = 1
      AND roles @> ARRAY['public']::name[]
      AND qual ILIKE '%bucket_id%'
      AND qual ILIKE '%avatars%'
  ) THEN
    RAISE EXCEPTION 'avatar_public_read falta o no conserva la lectura pública exclusiva de avatars';
  END IF;

  SELECT count(*)
  INTO storage_write_policy_count
  FROM pg_policies
  WHERE schemaname = 'storage'
    AND tablename = 'objects'
    AND (
      (policyname = 'avatar_owner_insert'
       AND cmd = 'INSERT'
       AND with_check ILIKE '%bucket_id%'
       AND with_check ILIKE '%avatars%'
       AND with_check ILIKE '%foldername%'
       AND with_check ILIKE '%auth.uid()%')
      OR
      (policyname = 'avatar_owner_update'
       AND cmd = 'UPDATE'
       AND qual ILIKE '%bucket_id%'
       AND qual ILIKE '%avatars%'
       AND qual ILIKE '%foldername%'
       AND qual ILIKE '%auth.uid()%'
       AND with_check ILIKE '%bucket_id%'
       AND with_check ILIKE '%avatars%'
       AND with_check ILIKE '%foldername%'
       AND with_check ILIKE '%auth.uid()%')
      OR
      (policyname = 'avatar_owner_delete'
       AND cmd = 'DELETE'
       AND qual ILIKE '%bucket_id%'
       AND qual ILIKE '%avatars%'
       AND qual ILIKE '%foldername%'
       AND qual ILIKE '%auth.uid()%')
    )
    AND cardinality(roles) = 1
    AND roles @> ARRAY['authenticated']::name[];

  IF storage_write_policy_count <> 3 THEN
    RAISE EXCEPTION
      'Se esperaban 3 políticas de escritura de avatars limitadas a authenticated y a la carpeta del UID; se encontraron %',
      storage_write_policy_count;
  END IF;

  -- 4) Defaults para objetos futuros creados por postgres en public.
  --    Inspecciona los ACL explícitos globales y por schema para tablas,
  --    secuencias y funciones. PostgreSQL elimina filas vacías de pg_default_acl
  --    cuando REVOKE retira todos los grants del schema; por eso la ausencia
  --    de una fila es válida y significa que no hay override específico.
  --    Se comprueba cualquier ACL que exista, sin exigir filas vacías.
  FOREACH object_type IN ARRAY ARRAY['r'::"char",'S'::"char",'f'::"char"] LOOP
    IF EXISTS (
      SELECT 1
      FROM pg_default_acl d
      CROSS JOIN LATERAL aclexplode(d.defaclacl) a
      WHERE d.defaclrole = 'postgres'::regrole
        AND d.defaclnamespace IN (0::oid, 'public'::regnamespace)
        AND d.defaclobjtype = object_type
        AND a.grantee IN ('anon'::regrole, 'authenticated'::regrole)
    ) THEN
      RAISE EXCEPTION
        'Los defaults globales o de public para objetos tipo % aún conceden permisos directos a anon/authenticated',
        object_type;
    END IF;
  END LOOP;

  -- PostgreSQL concede EXECUTE a PUBLIC por defecto para funciones nuevas.
  -- Un REVOKE dirigido solo a anon/authenticated no elimina ese acceso
  -- heredado. Exigimos que el ACL global efectivo de funciones no lo otorgue.
  IF EXISTS (
    SELECT 1
    FROM aclexplode(
      COALESCE(
        (SELECT d.defaclacl
         FROM pg_default_acl d
         WHERE d.defaclrole = 'postgres'::regrole
           AND d.defaclnamespace = 0
           AND d.defaclobjtype = 'f'),
        acldefault('f', 'postgres'::regrole)
      )
    ) a
    WHERE a.grantee = 0
      AND a.privilege_type = 'EXECUTE'
  ) THEN
    RAISE EXCEPTION
      'Las funciones futuras creadas por postgres aún heredan EXECUTE de PUBLIC en el default global.';
  END IF;

  -- Los defaults específicos de public se suman a los globales. Por eso
  -- también deben comprobarse: un REVOKE global no elimina un EXECUTE
  -- concedido explícitamente a PUBLIC solo para este esquema.
  IF EXISTS (
    SELECT 1
    FROM pg_default_acl d
    CROSS JOIN LATERAL aclexplode(d.defaclacl) a
    WHERE d.defaclrole = 'postgres'::regrole
      AND d.defaclnamespace = 'public'::regnamespace
      AND d.defaclobjtype = 'f'
      AND a.grantee = 0
      AND a.privilege_type = 'EXECUTE'
  ) THEN
    RAISE EXCEPTION
      'Las funciones futuras creadas por postgres en public aún heredan EXECUTE de PUBLIC por un default específico del esquema.';
  END IF;

  RAISE NOTICE
    'V12.124: RLS, grants, políticas de propiedad, Storage y defaults verificados.';
END
$$;

-- Diagnóstico visual de los defaults globales y por schema de postgres.
-- Solo lectura; incluye ACL heredado de PostgreSQL cuando no hay override global.
SELECT
  CASE WHEN d.defaclnamespace = 0 THEN '<global>' ELSE n.nspname END AS schema_name,
  d.defaclobjtype AS object_type,
  d.defaclacl AS explicit_acl
FROM pg_default_acl d
JOIN pg_roles r ON r.oid = d.defaclrole
LEFT JOIN pg_namespace n ON n.oid = d.defaclnamespace
WHERE r.rolname = 'postgres'
  AND (d.defaclnamespace = 0 OR n.nspname = 'public')
ORDER BY schema_name, object_type;

SELECT
  'functions_global_effective_default' AS check_name,
  acldefault('f', 'postgres'::regrole) AS built_in_default_acl;
