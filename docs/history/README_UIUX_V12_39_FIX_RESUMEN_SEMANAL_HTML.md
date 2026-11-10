# FeritApp V12.39 — corrección de Resumen Semanal en Inicio

## Causa encontrada
`script.js` buscaba `weeklySummaryContent`, `weeklySummaryMeta` y `weeklySummaryToggle`, pero `index.html` no incluía esos elementos. Por eso el bloque `if(summaryContent && summaryToggle)` no se ejecutaba y no se renderizaban los clientes ni el estado de entrega. Las correcciones solo en CSS/JS no podían resolver la ausencia de esos nodos.

## Cambios
- `index.html`: agrega el contenedor y botón colapsable que `renderDashboard()` espera.
- `index.html`: conserva el historial de semanas, renombrándolo como “Historial semanal” para distinguirlo del resumen de la semana inmediatamente anterior.
- `style.css`: agrega estilos para el nuevo encabezado y el contenido del resumen; mantiene el estado de entrega visible solo dentro de Inicio > Resumen Semanal.
- `script.js`: se conserva la lógica existente de la versión previa. No se modifica la vista Entregas.

## Validaciones
Se verifican integridad del ZIP y sintaxis de `script.js`. La comprobación final de renderizado con sesión real y datos de Supabase requiere probar la app desplegada; no se afirma haber realizado esa prueba.
