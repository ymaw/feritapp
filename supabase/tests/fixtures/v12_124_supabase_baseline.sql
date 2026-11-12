-- FeritApp V12.124 CI fixture.
-- Recreates only the PostgreSQL/Supabase contracts required by the migration
-- and verifier. This is intentionally NOT a full Supabase installation.
-- Runs in a disposable PostgreSQL service created for one GitHub Actions job.

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN
    CREATE ROLE anon NOLOGIN;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
    CREATE ROLE authenticated NOLOGIN;
  END IF;
END
$$;

CREATE SCHEMA auth;
CREATE SCHEMA storage;

CREATE FUNCTION auth.uid()
RETURNS uuid
LANGUAGE sql
STABLE
AS $$
  SELECT NULLIF(current_setting('request.jwt.claim.sub', true), '')::uuid
$$;

CREATE FUNCTION storage.foldername(object_name text)
RETURNS text[]
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT string_to_array(object_name, '/')
$$;

GRANT USAGE ON SCHEMA public, auth, storage TO anon, authenticated;
GRANT EXECUTE ON FUNCTION auth.uid() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION storage.foldername(text) TO anon, authenticated;

CREATE TABLE public.sales (
  id bigint PRIMARY KEY,
  user_id uuid NOT NULL
);

CREATE TABLE public.clients (
  id bigint PRIMARY KEY,
  user_id uuid NOT NULL
);

CREATE TABLE public.categories (
  id bigint PRIMARY KEY,
  user_id uuid NOT NULL
);

CREATE TABLE public.user_settings (
  id bigint PRIMARY KEY,
  user_id uuid NOT NULL
);

ALTER TABLE public.sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;

-- Deliberately permissive pre-migration grants; V12.124 must reduce them.
GRANT ALL PRIVILEGES ON TABLE
  public.sales, public.clients, public.categories, public.user_settings
TO anon, authenticated;

CREATE TABLE storage.objects (
  id text PRIMARY KEY,
  bucket_id text NOT NULL,
  name text NOT NULL
);

CREATE TABLE storage.buckets (
  id text PRIMARY KEY,
  name text NOT NULL,
  public boolean NOT NULL DEFAULT false
);

GRANT SELECT ON TABLE storage.objects TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER
  ON TABLE storage.objects TO authenticated;
GRANT SELECT ON TABLE storage.buckets TO anon, authenticated;

INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true);

-- Seed explicit schema defaults so the migration has real grants to revoke.
-- The verifier then checks the resulting effective catalog state.
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public
  GRANT ALL ON TABLES TO anon, authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public
  GRANT ALL ON SEQUENCES TO anon, authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public
  GRANT EXECUTE ON FUNCTIONS TO anon, authenticated, PUBLIC;
