-- Preferencias de navegación por cuenta: cuatro accesos, con Inicio incluido por defecto.
alter table public.user_settings
  add column if not exists navigation_slots jsonb not null
  default '["dashboard","sales","deliveries","notes"]'::jsonb;

alter table public.user_settings
  drop constraint if exists user_settings_navigation_slots_valid;

alter table public.user_settings
  add constraint user_settings_navigation_slots_valid
  check (
    jsonb_typeof(navigation_slots) = 'array'
    and jsonb_array_length(navigation_slots) = 4
    and (
      select count(distinct value) = 4
      from jsonb_array_elements_text(navigation_slots) as value
    )
  );
