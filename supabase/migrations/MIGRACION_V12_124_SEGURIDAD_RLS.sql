-- FeritApp V12.124 — endurecimiento de privilegios y políticas RLS.
-- Preparada para feature/login-modernization.
-- IMPORTANTE: esta migración NO debe aplicarse manualmente en producción hasta
-- revisar el diff y aprobar el despliegue. Ejecutar como rol postgres.
--
-- Objetivos:
--   1. Eliminar acceso SQL directo del rol anon a las tablas de negocio.
--   2. Conceder a authenticated únicamente CRUD necesario por tabla.
--   3. Limitar políticas de negocio a authenticated y validar también el nuevo
--      user_id en UPDATE (WITH CHECK).
--   4. Evitar que futuras tablas creadas por postgres hereden grants amplios.
--   5. Mantener lectura pública de avatares, pero exigir autenticación para
--      insertar, actualizar o eliminar objetos del bucket avatars.
--
-- No modifica filas ni cambia el carácter público del bucket avatars.

BEGIN;

-- 1) Privilegios mínimos para las tablas de negocio.
REVOKE ALL PRIVILEGES
  ON TABLE public.sales, public.clients, public.categories, public.user_settings
  FROM anon, authenticated;

GRANT SELECT, INSERT, UPDATE, DELETE
  ON TABLE public.sales, public.clients
  TO authenticated;

GRANT SELECT, INSERT, DELETE
  ON TABLE public.categories
  TO authenticated;

GRANT SELECT, INSERT, UPDATE
  ON TABLE public.user_settings
  TO authenticated;

-- 2) Las políticas de negocio se limitan a usuarios autenticados.
--    La subconsulta evita reevaluar auth.uid() por cada fila.
DROP POLICY IF EXISTS sales_select_own ON public.sales;
CREATE POLICY sales_select_own
  ON public.sales FOR SELECT TO authenticated
  USING (user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS sales_insert_own ON public.sales;
CREATE POLICY sales_insert_own
  ON public.sales FOR INSERT TO authenticated
  WITH CHECK (user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS sales_update_own ON public.sales;
CREATE POLICY sales_update_own
  ON public.sales FOR UPDATE TO authenticated
  USING (user_id = (SELECT auth.uid()))
  WITH CHECK (user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS sales_delete_own ON public.sales;
CREATE POLICY sales_delete_own
  ON public.sales FOR DELETE TO authenticated
  USING (user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS clients_select_own ON public.clients;
CREATE POLICY clients_select_own
  ON public.clients FOR SELECT TO authenticated
  USING (user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS clients_insert_own ON public.clients;
CREATE POLICY clients_insert_own
  ON public.clients FOR INSERT TO authenticated
  WITH CHECK (user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS clients_update_own ON public.clients;
CREATE POLICY clients_update_own
  ON public.clients FOR UPDATE TO authenticated
  USING (user_id = (SELECT auth.uid()))
  WITH CHECK (user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS clients_delete_own ON public.clients;
CREATE POLICY clients_delete_own
  ON public.clients FOR DELETE TO authenticated
  USING (user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS categories_select_own ON public.categories;
CREATE POLICY categories_select_own
  ON public.categories FOR SELECT TO authenticated
  USING (user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS categories_insert_own ON public.categories;
CREATE POLICY categories_insert_own
  ON public.categories FOR INSERT TO authenticated
  WITH CHECK (user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS categories_delete_own ON public.categories;
CREATE POLICY categories_delete_own
  ON public.categories FOR DELETE TO authenticated
  USING (user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS user_settings_select_own ON public.user_settings;
CREATE POLICY user_settings_select_own
  ON public.user_settings FOR SELECT TO authenticated
  USING (user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS user_settings_insert_own ON public.user_settings;
CREATE POLICY user_settings_insert_own
  ON public.user_settings FOR INSERT TO authenticated
  WITH CHECK (user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS user_settings_update_own ON public.user_settings;
CREATE POLICY user_settings_update_own
  ON public.user_settings FOR UPDATE TO authenticated
  USING (user_id = (SELECT auth.uid()))
  WITH CHECK (user_id = (SELECT auth.uid()));

-- 3) Defaults de objetos futuros creados por postgres.
--    El REVOKE global evita que funciones nuevas hereden EXECUTE de PUBLIC
--    en cualquier esquema. Es deliberadamente global: los consumidores de
--    funciones futuras deberán recibir EXECUTE mediante GRANT explícito.
--    Los REVOKE por schema eliminan además grants directos a anon/authenticated.
ALTER DEFAULT PRIVILEGES FOR ROLE postgres
  REVOKE EXECUTE ON FUNCTIONS FROM PUBLIC;

-- Defaults específicos de public para tablas, secuencias y funciones.
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public
  REVOKE ALL ON TABLES FROM anon, authenticated;

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public
  REVOKE ALL ON SEQUENCES FROM anon, authenticated;

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public
  REVOKE EXECUTE ON FUNCTIONS FROM anon, authenticated;

-- 4) Storage: preservar lectura pública del bucket avatars; escritura solo autenticada.
REVOKE INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER
  ON TABLE storage.objects FROM anon;

REVOKE TRUNCATE, REFERENCES, TRIGGER
  ON TABLE storage.objects FROM authenticated;

DROP POLICY IF EXISTS avatar_owner_insert ON storage.objects;
CREATE POLICY avatar_owner_insert
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = (SELECT auth.uid())::text
  );

DROP POLICY IF EXISTS avatar_owner_update ON storage.objects;
CREATE POLICY avatar_owner_update
  ON storage.objects FOR UPDATE TO authenticated
  USING (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = (SELECT auth.uid())::text
  )
  WITH CHECK (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = (SELECT auth.uid())::text
  );

DROP POLICY IF EXISTS avatar_owner_delete ON storage.objects;
CREATE POLICY avatar_owner_delete
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = (SELECT auth.uid())::text
  );

DROP POLICY IF EXISTS avatar_public_read ON storage.objects;
CREATE POLICY avatar_public_read
  ON storage.objects FOR SELECT TO public
  USING (bucket_id = 'avatars');

COMMIT;

-- Comprobaciones posteriores recomendadas:
--   * anon no debe tener SELECT/INSERT/UPDATE/DELETE/TRUNCATE sobre las 4 tablas public.
--   * authenticated debe tener solo CRUD permitido por tabla (sin TRUNCATE).
--   * las 14 políticas de negocio deben estar asignadas a authenticated.
--   * UPDATE debe tener USING y WITH CHECK con auth.uid().
--   * avatar_public_read debe seguir siendo pública y las escrituras de avatars
--     deben requerir authenticated + carpeta cuyo primer segmento sea su UID.
