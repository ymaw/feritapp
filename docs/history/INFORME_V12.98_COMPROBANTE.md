# FeritApp V12.98 — corrección de selección de comprobantes

## Cambios
- La selección vuelve a usar `weekKey()` y `previousWeekKey()` con `salesForWeek()`, como la lógica semanal de referencia V12.79.
- Se conserva la regla de pago: abonado incluye solo semana actual; pendiente incluye semana actual y anterior.
- Se excluyen explícitamente fechas fuera de esas dos semanas y se ignora `semana_asignada` para comprobantes.
- Se añade una segunda validación al confirmar el envío: se vuelve a obtener la selección autorizada antes de generar el PNG.
- `index.html` carga `script-v12.98.js` con nombre nuevo para evitar reutilizar el archivo JS anterior desde caché.
- No se cambió el repositorio original, Vercel ni Supabase.

## Validaciones ejecutadas
- `node --check script-v12.98.js`.
- Prueba aislada de selección con ventas de semana actual, anterior y dos semanas atrás (abonado y pendiente).
- Integridad del ZIP.

## Limitación
No se ejecutó una prueba de navegador autenticada ni envío real por Messenger. Probar primero en una copia antes de publicar.
