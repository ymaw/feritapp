-- La importancia es un conjunto cerrado de etiquetas del sistema.
-- NOT VALID conserva filas históricas fuera del catálogo, pero impide nuevas
-- escrituras (incluidas modificaciones) que introduzcan valores no permitidos.
alter table public.note_labels
  add constraint note_labels_importance_catalog_valid
  check (
    kind <> 'importance'
    or (name = 'Baja' and color = '#16A34A')
    or (name = 'Media' and color = '#EAB308')
    or (name = 'Alta' and color = '#F97316')
    or (name = 'Urgente' and color = '#DC2626')
  ) not valid;
