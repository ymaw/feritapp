# FeritApp V12.34 — Optimización conservadora del renderizado

Esta versión parte directamente del ZIP V12.33 (`feritApp-uiux-v12.33-resumen-semanal-estados.zip`). Se trabajó en una copia local; no se modificó el repositorio remoto ni se ejecutaron escrituras en Supabase.

## Cambios

- En `renderSalesGroupedByClient()`, el total de compras y el importe pendiente de cada cliente se calculan en una sola pasada por sus artículos, en vez de recorrer el grupo dos veces.
- La clave de la semana anterior se calcula una sola vez por renderizado del Resumen Semanal, no repetidamente por cada cliente y artículo.
- Se conserva la condición de solo lectura del Resumen Semanal y del historial del dashboard, así como la presentación de los estados de entrega únicamente para la semana inmediatamente anterior.
- No se alteraron estilos, estructura de navegación, reglas de persistencia ni consultas a Supabase.

## Validaciones

- `node --check script.js`.
- Comprobación estática de que el cálculo agregado reemplaza los dos recorridos previos y que `previousWeekKey()` se calcula fuera del bucle de clientes.
- Integridad del ZIP mediante `unzip -t`.

No se ejecutó una prueba end-to-end en navegador con sesión autenticada; por tanto, esta entrega no afirma validación visual ni de integración con datos reales.
