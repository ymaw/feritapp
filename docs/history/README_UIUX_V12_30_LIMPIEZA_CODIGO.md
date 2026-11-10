# FeritApp V12.30 — limpieza controlada de redundancias

Esta versión parte de V12.29. Se trabajó únicamente sobre una copia local del proyecto; no se modificó el repositorio remoto ni se ejecutaron escrituras en Supabase.

## Cambios incluidos

### JavaScript
- Se agregó `salesForWeek(items, key)` como criterio común de filtrado semanal, con validación de fechas inválidas o ausentes.
- Se reutiliza el filtro en Ventas, búsqueda de clientes, detalle de cliente y cambios de pago/entrega por semana.
- El contador de clientes de Ventas ahora se calcula sobre los clientes únicos con ventas de la semana corriente, en consonancia con el alcance del listado.
- `renderSalesGroupedByClient()` declara explícitamente las capacidades de cada variante. `weekly-summary` y el historial del dashboard son de solo lectura y no generan botones de pago, edición o eliminación.
- Se evita generar acciones de edición/eliminación dentro de las tarjetas expandidas de gestión cuando esas acciones ya se ofrecen desde el panel lateral de acciones del cliente.

### CSS
- Se consolidaron los overrides incrementales de marca, encabezado, tarjetas agrupadas, historial semanal y hero de Ventas que se habían ido acumulando entre V12.24 y V12.29.
- Se mantiene una sección final común para los componentes compartidos y las adaptaciones móviles.
- La cantidad de declaraciones `!important` bajó de 258 en la auditoría anterior a 192 en esta copia. Aún quedan casos que conviene revisar por componente, en lugar de retirarlos automáticamente.

### HTML
- Se trasladaron diez estilos de presentación fijos a clases CSS con nombre.
- Se conservaron los estilos inline `display:none` restantes porque representan estados iniciales de visibilidad que controla la lógica de la aplicación; no se cambiaron en bloque para evitar alterar la autenticación, los paneles o la navegación.

## Validaciones ejecutadas
- `node --check script.js`: aprobado.
- Prueba aislada de `salesForWeek`: incluye ventas de la semana objetivo y excluye una semana anterior, fecha inválida y fecha ausente.
- Comprobaciones estáticas: el resumen semanal se marca como solo lectura, Ventas y búsqueda utilizan el filtro común, y los estilos inline restantes son de visibilidad.
- ZIP: verificación de integridad después de empaquetar.

## Alcance y limitaciones
No se ejecutó una prueba end-to-end en navegador con sesión autenticada ni una prueba de escritura en Supabase. La limpieza se hizo de forma conservadora para preservar reglas de negocio y la estructura existente.
