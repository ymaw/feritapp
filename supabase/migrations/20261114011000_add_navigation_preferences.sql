-- Preferencias de navegación por cuenta: cuatro accesos, con Inicio incluido por defecto.
alter table public.user_settings
  add column if not exists navigation_slots jsonb not null
  default '["dashboard","sales","deliveries","notes"]'::jsonb;

alter table public.user_settings
  drop constraint if exists user_settings_navigation_slots_valid;

alter table public.user_settings
  add constraint user_settings_navigation_slots_valid
  check (
    case
      when jsonb_typeof(navigation_slots) = 'array'
      then jsonb_array_length(navigation_slots) = 4
        and navigation_slots <@ '["dashboard","sales","deliveries","notes","ranking","settings","settings:profile","settings:appearance","settings:notifications","settings:week","settings:receipt","settings:backup"]'::jsonb
      else false
    end
  );
