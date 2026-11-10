# feritApp UI/UX V10

Cambios realizados sobre la copia V9, sin modificar el repositorio original.

## Objetivo
Hacer que feritApp sea más accionable en el uso diario, reduciendo pasos y haciendo visibles los pendientes.

## Cambios
- Dashboard orientado a tareas: pagos pendientes y personas/entregas a gestionar.
- Vista rápida de los principales pagos pendientes desde el Dashboard.
- Acciones directas para ir a Ventas o Entregas.
- Estado vacío del Dashboard con CTA para registrar la primera venta.
- Nueva Venta con barra de cierre sticky: total + Guardar venta siempre accesibles.
- Total del formulario sincronizado con la barra inferior.
- Confirmación antes de eliminar una venta.
- Se conserva el diseño responsive V9: tabla desktop y tarjetas móviles sin scroll horizontal.
- No se modificó Supabase, RLS ni autenticación.
- Chart.js no se integró todavía: queda preparado para integrar posteriormente los archivos que entregue el otro agente.

## Validación
- `node --check script.js` OK.
