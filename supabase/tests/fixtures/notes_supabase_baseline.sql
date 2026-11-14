-- Minimal isolated schema for the Notes and navigation migrations.
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname='anon') THEN CREATE ROLE anon NOLOGIN; END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname='authenticated') THEN CREATE ROLE authenticated NOLOGIN; END IF;
END $$;

CREATE SCHEMA auth;
CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql STABLE AS $$
  SELECT NULLIF(current_setting('request.jwt.claim.sub', true), '')::uuid
$$;
CREATE TABLE auth.users(id uuid PRIMARY KEY);
CREATE TABLE public.clients(
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id),
  name text NOT NULL
);
CREATE TABLE public.user_settings(
  user_id uuid PRIMARY KEY REFERENCES auth.users(id),
  week_start_day integer NOT NULL DEFAULT 1
);
GRANT USAGE ON SCHEMA public,auth TO anon,authenticated;
GRANT EXECUTE ON FUNCTION auth.uid() TO anon,authenticated;
GRANT SELECT ON public.clients TO authenticated;
GRANT SELECT,INSERT,UPDATE,DELETE ON public.user_settings TO authenticated;
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY clients_select_own ON public.clients FOR SELECT TO authenticated USING (user_id=auth.uid());
CREATE POLICY settings_all_own ON public.user_settings FOR ALL TO authenticated USING (user_id=auth.uid()) WITH CHECK (user_id=auth.uid());

INSERT INTO auth.users(id) VALUES
 ('11111111-1111-4111-8111-111111111111'),
 ('22222222-2222-4222-8222-222222222222');
INSERT INTO public.clients(id,user_id,name) VALUES
 ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','11111111-1111-4111-8111-111111111111','Cliente propio'),
 ('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb','22222222-2222-4222-8222-222222222222','Cliente ajeno');
INSERT INTO public.user_settings(user_id) SELECT id FROM auth.users;
