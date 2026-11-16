-- La navegación móvil permite cuatro secciones elegibles; Inicio no es obligatorio.
-- El logo FeritApp del encabezado es el acceso global a Inicio.
alter table public.user_settings
  drop constraint if exists user_settings_navigation_slots_valid;

update public.user_settings
set navigation_slots = '["dashboard","sales","deliveries","notes"]'::jsonb
where case
  when jsonb_typeof(navigation_slots) = 'array'
    then jsonb_array_length(navigation_slots) <> 4
      or not (navigation_slots <@ '["dashboard","sales","deliveries","notes","ranking"]'::jsonb)
      or (navigation_slots->>0) = (navigation_slots->>1)
      or (navigation_slots->>0) = (navigation_slots->>2)
      or (navigation_slots->>0) = (navigation_slots->>3)
      or (navigation_slots->>1) = (navigation_slots->>2)
      or (navigation_slots->>1) = (navigation_slots->>3)
      or (navigation_slots->>2) = (navigation_slots->>3)
  else true
end;

alter table public.user_settings
  add constraint user_settings_navigation_slots_valid
  check (
    case
      when jsonb_typeof(navigation_slots) = 'array'
      then jsonb_array_length(navigation_slots) = 4
        and navigation_slots <@ '["dashboard","sales","deliveries","notes","ranking"]'::jsonb
        and (navigation_slots->>0) <> (navigation_slots->>1)
        and (navigation_slots->>0) <> (navigation_slots->>2)
        and (navigation_slots->>0) <> (navigation_slots->>3)
        and (navigation_slots->>1) <> (navigation_slots->>2)
        and (navigation_slots->>1) <> (navigation_slots->>3)
        and (navigation_slots->>2) <> (navigation_slots->>3)
      else false
    end
  );
