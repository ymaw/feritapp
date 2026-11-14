-- Notas personales por usuario, con vínculo opcional a clientes.
-- Los recordatorios se almacenan como fecha/hora; la entrega push se implementará
-- en una fase posterior mediante un dispatcher seguro del lado servidor.
create table if not exists public.notes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  client_id uuid null references public.clients(id) on delete set null,
  content text not null,
  reminder_at timestamptz null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint notes_content_not_blank check (length(btrim(content)) > 0),
  constraint notes_content_max_length check (length(content) <= 10000)
);

create index if not exists notes_user_updated_idx
  on public.notes (user_id, updated_at desc);
create index if not exists notes_user_reminder_idx
  on public.notes (user_id, reminder_at)
  where reminder_at is not null;

alter table public.notes enable row level security;

drop policy if exists "Users can read their own notes" on public.notes;
create policy "Users can read their own notes"
  on public.notes for select to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "Users can create their own notes" on public.notes;
create policy "Users can create their own notes"
  on public.notes for insert to authenticated
  with check (
    (select auth.uid()) = user_id
    and (
      client_id is null
      or exists (
        select 1 from public.clients c
        where c.id = client_id and c.user_id = (select auth.uid())
      )
    )
  );

drop policy if exists "Users can update their own notes" on public.notes;
create policy "Users can update their own notes"
  on public.notes for update to authenticated
  using ((select auth.uid()) = user_id)
  with check (
    (select auth.uid()) = user_id
    and (
      client_id is null
      or exists (
        select 1 from public.clients c
        where c.id = client_id and c.user_id = (select auth.uid())
      )
    )
  );

drop policy if exists "Users can delete their own notes" on public.notes;
create policy "Users can delete their own notes"
  on public.notes for delete to authenticated
  using ((select auth.uid()) = user_id);

revoke all on public.notes from anon;
grant select, insert, update, delete on public.notes to authenticated;
