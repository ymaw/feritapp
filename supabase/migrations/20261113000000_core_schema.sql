-- FeritApp: esquema base reproducible para entornos locales.
-- Refleja las tablas de negocio existentes antes de las migraciones versionadas
-- de Notas y preferencias de navegación. No contiene datos de usuarios.
-- Las migraciones V12.19 y V12.82 ya están representadas en sales.entregado,
-- sales.entregado_en y sales.semana_asignada.
-- V12.124 permanece fuera de esta cadena: es una migración de endurecimiento
-- independiente, preparada para revisión y no aplicada al proyecto remoto.

begin;

create table public.sales (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid()
    references auth.users(id) on delete cascade,
  fecha timestamptz not null default now(),
  cliente text not null,
  articulo text not null,
  precio numeric not null,
  pagado boolean not null default false,
  retira text not null default 'cliente',
  tercero text not null default '',
  categoria text null default 'Sin categoría',
  created_at timestamptz not null default now(),
  entregado boolean not null default false,
  entregado_en timestamptz null,
  semana_asignada date null,
  constraint sales_cliente_no_vacio check (btrim(cliente) <> ''),
  constraint sales_articulo_no_vacio check (btrim(articulo) <> ''),
  constraint sales_precio_positivo check (precio > 0)
);

create index idx_sales_user_cliente on public.sales (user_id, cliente);
create index idx_sales_user_fecha on public.sales (user_id, fecha desc);
create index sales_entregado_en_idx on public.sales (entregado, entregado_en);

alter table public.sales enable row level security;
create policy sales_select_own on public.sales for select
  using (auth.uid() = user_id);
create policy sales_insert_own on public.sales for insert
  with check (auth.uid() = user_id);
create policy sales_update_own on public.sales for update
  using (auth.uid() = user_id);
create policy sales_delete_own on public.sales for delete
  using (auth.uid() = user_id);

create table public.clients (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid()
    references auth.users(id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now(),
  messenger_username text null,
  constraint clients_name_no_vacio check (btrim(name) <> '')
);

create index idx_clients_user_name on public.clients (user_id, name);
create index clients_messenger_username_idx
  on public.clients (messenger_username);

alter table public.clients enable row level security;
create policy clients_select_own on public.clients for select
  using (auth.uid() = user_id);
create policy clients_insert_own on public.clients for insert
  with check (auth.uid() = user_id);
create policy clients_update_own on public.clients for update
  using (auth.uid() = user_id);
create policy clients_delete_own on public.clients for delete
  using (auth.uid() = user_id);

create table public.categories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid()
    references auth.users(id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now(),
  constraint categories_name_no_vacio check (btrim(name) <> '')
);

create index idx_categories_user on public.categories (user_id);

alter table public.categories enable row level security;
create policy categories_select_own on public.categories for select
  using (auth.uid() = user_id);
create policy categories_insert_own on public.categories for insert
  with check (auth.uid() = user_id);
create policy categories_delete_own on public.categories for delete
  using (auth.uid() = user_id);

create table public.user_settings (
  user_id uuid primary key default auth.uid()
    references auth.users(id) on delete cascade,
  week_start_day integer not null default 1,
  updated_at timestamptz not null default now(),
  last_purge_semester text null,
  notify_enabled boolean not null default true,
  notify_days_overdue integer not null default 4,
  receipt_message text not null
    default '¡Gracias por tu compra! Te esperamos pronto de nuevo.',
  store_name text null,
  avatar_url text null
);

alter table public.user_settings enable row level security;
create policy user_settings_select_own on public.user_settings for select
  using (auth.uid() = user_id);
create policy user_settings_insert_own on public.user_settings for insert
  with check (auth.uid() = user_id);
create policy user_settings_update_own on public.user_settings for update
  using (auth.uid() = user_id);

-- Permisos de aplicación correspondientes a las políticas existentes.
grant select, insert, update, delete
  on public.sales, public.clients to authenticated;
grant select, insert, delete on public.categories to authenticated;
grant select, insert, update on public.user_settings to authenticated;

comment on column public.sales.entregado is
  'Indica si el artículo/registro de venta fue entregado. Independiente de sales.pagado.';
comment on column public.sales.semana_asignada is
  'Semana operativa asignada manualmente. NULL significa usar la semana derivada de fecha. No reemplaza la fecha real de la venta.';
comment on column public.clients.messenger_username is
  'Usuario o identificador de Messenger asociado al cliente. No almacenar contraseñas ni tokens.';

commit;
