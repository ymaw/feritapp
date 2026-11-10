# FeritApp UI/UX V12.14

## Cambios
- Se movió el saludo personalizado desde Ventas a Inicio, antes del contenido de Inicio.
- Se trasladó el resumen de la semana en curso (totales vendido/cobrado/pendiente y cantidad de artículos) desde Inicio a Ventas.
- El resumen de la semana en curso queda agrupado visualmente en el encabezado de Ventas junto al panel colapsable de Resumen Semanal, que contiene la última semana cerrada.
- Se conserva el renderizado de los datos existentes; no se modificó la lógica de ventas ni la persistencia de Supabase.
- No se modificó el logo. La mejora del logo original queda pendiente.

## Validación
- `node --check script.js`.
- Requiere pruebas visuales en navegador y móvil, y comprobación funcional con datos reales antes de publicar.
