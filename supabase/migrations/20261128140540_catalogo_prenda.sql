-- CUEVA? No: FeritApp Catalogo de prendas.
-- Esquema inicial aislado. No implementa aun RPCs de asignacion ni borrado.
-- Las transiciones a "deleting" y la cola se reservan para operaciones servidoras.

begin;

create table public.catalog_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid()
    references auth.users(id) on delete cascade,
  category text not null,
  article text not null,
  price bigint not null default 0,
  brand text null,
  size text null,
  observations text null,
  measurements jsonb not null default '{}'::jsonb,
  publication_status text not null default 'unpublished',
  published_at timestamptz null,
  lifecycle_status text not null default 'active',
  deletion_started_at timestamptz null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint catalog_items_id_user_key unique (id, user_id),
  constraint catalog_items_category_not_blank check (length(btrim(category)) > 0),
  constraint catalog_items_article_not_blank check (length(btrim(article)) > 0),
  constraint catalog_items_price_nonnegative check (price >= 0),
  constraint catalog_items_measurements_object
    check (jsonb_typeof(measurements) = 'object'),
  constraint catalog_items_publication_status
    check (publication_status in ('unpublished', 'published')),
  constraint catalog_items_publication_timestamp
    check (
      (publication_status = 'published' and published_at is not null)
      or (publication_status = 'unpublished' and published_at is null)
    ),
  constraint catalog_items_lifecycle_status
    check (lifecycle_status in ('active', 'archived', 'deleting')),
  constraint catalog_items_deletion_timestamp
    check (
      (lifecycle_status = 'deleting' and deletion_started_at is not null)
      or (lifecycle_status in ('active', 'archived') and deletion_started_at is null)
    )
);

create index catalog_items_user_lifecycle_created_idx
  on public.catalog_items (user_id, lifecycle_status, created_at desc);
create index catalog_items_user_publication_idx
  on public.catalog_items (user_id, publication_status);

alter table public.catalog_items enable row level security;

create policy catalog_items_select_own
  on public.catalog_items for select to authenticated
  using ((select auth.uid()) = user_id);

create policy catalog_items_insert_own
  on public.catalog_items for insert to authenticated
  with check (
    (select auth.uid()) = user_id
    and lifecycle_status = 'active'
    and deletion_started_at is null
  );

create policy catalog_items_update_own
  on public.catalog_items for update to authenticated
  using (
    (select auth.uid()) = user_id
    and lifecycle_status in ('active', 'archived')
  )
  with check (
    (select auth.uid()) = user_id
    and lifecycle_status in ('active', 'archived')
    and deletion_started_at is null
  );

revoke all on public.catalog_items from public, anon, authenticated;
grant select on public.catalog_items to authenticated;
grant insert (
  category, article, price, brand, size, observations, measurements,
  publication_status, published_at
) on public.catalog_items to authenticated;
grant update (
  category, article, price, brand, size, observations, measurements,
  publication_status, published_at, lifecycle_status, updated_at
) on public.catalog_items to authenticated;
grant all on public.catalog_items to service_role;

-- La venta conserva su propio ciclo de vida. Borrar la prenda elimina su venta;
-- borrar la venta no elimina la prenda.
alter table public.sales
  add column catalog_item_id uuid null;

alter table public.sales
  add constraint sales_catalog_item_owner_fkey
  foreign key (catalog_item_id, user_id)
  references public.catalog_items (id, user_id)
  on delete cascade;

create unique index sales_catalog_item_id_unique
  on public.sales (catalog_item_id)
  where catalog_item_id is not null;

create index sales_user_catalog_item_idx
  on public.sales (user_id, catalog_item_id)
  where catalog_item_id is not null;

create table public.catalog_item_photos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid()
    references auth.users(id) on delete cascade,
  catalog_item_id uuid not null,
  storage_path text not null,
  mime_type text not null,
  byte_size bigint not null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),

  constraint catalog_item_photos_item_owner_fkey
    foreign key (catalog_item_id, user_id)
    references public.catalog_items (id, user_id)
    on delete cascade,
  constraint catalog_item_photos_storage_path_unique unique (storage_path),
  constraint catalog_item_photos_mime_type
    check (mime_type in ('image/jpeg', 'image/png', 'image/webp')),
  constraint catalog_item_photos_byte_size
    check (byte_size between 1 and 12582912),
  constraint catalog_item_photos_sort_order
    check (sort_order >= 0),
  constraint catalog_item_photos_storage_path_shape
    check (
      storage_path ~ (
        '^' || user_id::text || '/' || catalog_item_id::text || '/'
        || id::text || '[.](jpg|jpeg|png|webp)$'
      )
    )
);

create index catalog_item_photos_user_item_order_idx
  on public.catalog_item_photos (user_id, catalog_item_id, sort_order);

alter table public.catalog_item_photos enable row level security;

create policy catalog_item_photos_select_own
  on public.catalog_item_photos for select to authenticated
  using (
    (select auth.uid()) = user_id
    and exists (
      select 1
      from public.catalog_items ci
      where ci.id = catalog_item_id
        and ci.user_id = (select auth.uid())
        and ci.lifecycle_status in ('active', 'archived')
    )
  );

create policy catalog_item_photos_insert_own
  on public.catalog_item_photos for insert to authenticated
  with check (
    (select auth.uid()) = user_id
    and exists (
      select 1
      from public.catalog_items ci
      where ci.id = catalog_item_id
        and ci.user_id = (select auth.uid())
        and ci.lifecycle_status = 'active'
    )
  );

create policy catalog_item_photos_update_own
  on public.catalog_item_photos for update to authenticated
  using (
    (select auth.uid()) = user_id
    and exists (
      select 1
      from public.catalog_items ci
      where ci.id = catalog_item_id
        and ci.user_id = (select auth.uid())
        and ci.lifecycle_status in ('active', 'archived')
    )
  )
  with check (
    (select auth.uid()) = user_id
    and exists (
      select 1
      from public.catalog_items ci
      where ci.id = catalog_item_id
        and ci.user_id = (select auth.uid())
        and ci.lifecycle_status in ('active', 'archived')
    )
  );

revoke all on public.catalog_item_photos from public, anon, authenticated;
grant select on public.catalog_item_photos to authenticated;
grant insert (id, catalog_item_id, storage_path, mime_type, byte_size, sort_order)
  on public.catalog_item_photos to authenticated;
grant update (sort_order) on public.catalog_item_photos to authenticated;
grant all on public.catalog_item_photos to service_role;

-- La cola solo sera manipulada por procesos de confianza. No se concede acceso
-- directo a clientes; las tareas se incorporaran en la fase de borrado seguro.
create table public.catalog_item_deletion_jobs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  catalog_item_id uuid not null,
  storage_path text not null,
  attempts integer not null default 0,
  last_error text null,
  completed_at timestamptz null,
  created_at timestamptz not null default now(),

  constraint catalog_item_deletion_jobs_item_owner_fkey
    foreign key (catalog_item_id, user_id)
    references public.catalog_items (id, user_id)
    on delete cascade,
  constraint catalog_item_deletion_jobs_storage_path_unique unique (storage_path),
  constraint catalog_item_deletion_jobs_attempts_nonnegative check (attempts >= 0),
  constraint catalog_item_deletion_jobs_path_owner
    check (
      storage_path like user_id::text || '/' || catalog_item_id::text || '/%'
    )
);

create index catalog_item_deletion_jobs_pending_idx
  on public.catalog_item_deletion_jobs (created_at)
  where completed_at is null;

alter table public.catalog_item_deletion_jobs enable row level security;
revoke all on public.catalog_item_deletion_jobs from public, anon, authenticated;
grant all on public.catalog_item_deletion_jobs to service_role;

-- Bucket privado dedicado. No se modifica el bucket existente "avatars".
insert into storage.buckets (
  id, name, public, file_size_limit, allowed_mime_types
)
values (
  'catalogo-prendas',
  'catalogo-prendas',
  false,
  12582912,
  array['image/jpeg', 'image/png', 'image/webp']::text[]
);

create policy catalogo_prendas_select_own
  on storage.objects for select to authenticated
  using (
    bucket_id = 'catalogo-prendas'
    and (storage.foldername(name))[1] = (select auth.uid())::text
    and exists (
      select 1
      from public.catalog_items ci
      where ci.id::text = (storage.foldername(name))[2]
        and ci.user_id = (select auth.uid())
        and ci.lifecycle_status in ('active', 'archived')
    )
  );

create policy catalogo_prendas_insert_own
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'catalogo-prendas'
    and (storage.foldername(name))[1] = (select auth.uid())::text
    and exists (
      select 1
      from public.catalog_items ci
      where ci.id::text = (storage.foldername(name))[2]
        and ci.user_id = (select auth.uid())
        and ci.lifecycle_status = 'active'
    )
  );

create policy catalogo_prendas_update_own
  on storage.objects for update to authenticated
  using (
    bucket_id = 'catalogo-prendas'
    and (storage.foldername(name))[1] = (select auth.uid())::text
    and exists (
      select 1
      from public.catalog_items ci
      where ci.id::text = (storage.foldername(name))[2]
        and ci.user_id = (select auth.uid())
        and ci.lifecycle_status = 'active'
    )
  )
  with check (
    bucket_id = 'catalogo-prendas'
    and (storage.foldername(name))[1] = (select auth.uid())::text
    and exists (
      select 1
      from public.catalog_items ci
      where ci.id::text = (storage.foldername(name))[2]
        and ci.user_id = (select auth.uid())
        and ci.lifecycle_status = 'active'
    )
  );

create policy catalogo_prendas_delete_own
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'catalogo-prendas'
    and (storage.foldername(name))[1] = (select auth.uid())::text
    and exists (
      select 1
      from public.catalog_items ci
      where ci.id::text = (storage.foldername(name))[2]
        and ci.user_id = (select auth.uid())
    )
  );

commit;
