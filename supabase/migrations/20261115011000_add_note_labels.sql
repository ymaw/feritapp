-- Etiquetas reutilizables de Notas: Tipo (borde de tarjeta) e Importancia (distintivo).
create table if not exists public.note_labels (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  kind text not null check (kind in ('type','importance')),
  name text not null check (length(btrim(name)) between 1 and 32),
  color text not null check (color ~ '^#[0-9A-Fa-f]{6}$'),
  created_at timestamptz not null default now(),
  constraint note_labels_name_trimmed check (name = btrim(name))
);
create unique index if not exists note_labels_user_kind_name_idx
  on public.note_labels (user_id, kind, lower(name));

alter table public.notes
  add column if not exists type_label_id uuid null references public.note_labels(id) on delete set null,
  add column if not exists importance_label_id uuid null references public.note_labels(id) on delete set null;
create index if not exists notes_user_type_label_idx on public.notes(user_id,type_label_id);
create index if not exists notes_user_importance_label_idx on public.notes(user_id,importance_label_id);

alter table public.note_labels enable row level security;
drop policy if exists "Users can read their own note labels" on public.note_labels;
create policy "Users can read their own note labels" on public.note_labels for select to authenticated using ((select auth.uid()) = user_id);
drop policy if exists "Users can create their own note labels" on public.note_labels;
create policy "Users can create their own note labels" on public.note_labels for insert to authenticated with check ((select auth.uid()) = user_id);
drop policy if exists "Users can update their own note labels" on public.note_labels;
create policy "Users can update their own note labels" on public.note_labels for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
drop policy if exists "Users can delete their own note labels" on public.note_labels;
create policy "Users can delete their own note labels" on public.note_labels for delete to authenticated using ((select auth.uid()) = user_id);
revoke all on public.note_labels from anon;
grant select, insert, update, delete on public.note_labels to authenticated;

-- Las etiquetas asignadas a una nota deben pertenecer al mismo usuario y al grupo correcto.
drop policy if exists "Users can create their own notes" on public.notes;
create policy "Users can create their own notes" on public.notes for insert to authenticated with check (
  (select auth.uid()) = user_id
  and (client_id is null or exists (select 1 from public.clients c where c.id = client_id and c.user_id = (select auth.uid())))
  and (type_label_id is null or exists (select 1 from public.note_labels l where l.id = type_label_id and l.user_id = (select auth.uid()) and l.kind = 'type'))
  and (importance_label_id is null or exists (select 1 from public.note_labels l where l.id = importance_label_id and l.user_id = (select auth.uid()) and l.kind = 'importance'))
);
drop policy if exists "Users can update their own notes" on public.notes;
create policy "Users can update their own notes" on public.notes for update to authenticated using ((select auth.uid()) = user_id) with check (
  (select auth.uid()) = user_id
  and (client_id is null or exists (select 1 from public.clients c where c.id = client_id and c.user_id = (select auth.uid())))
  and (type_label_id is null or exists (select 1 from public.note_labels l where l.id = type_label_id and l.user_id = (select auth.uid()) and l.kind = 'type'))
  and (importance_label_id is null or exists (select 1 from public.note_labels l where l.id = importance_label_id and l.user_id = (select auth.uid()) and l.kind = 'importance'))
);
