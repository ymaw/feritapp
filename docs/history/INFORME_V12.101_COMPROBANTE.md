# FeritApp V12.101 — corrección de selección de comprobantes

## Qué se corrigió
- Se restauró una selección explícita de ventas por cliente y por semana para el comprobante.
- El comprobante usa `fecha` real y no `semana_asignada`.
- Cliente abonado: solo ventas de la semana actual.
- Cliente pendiente: ventas de la semana actual y de la semana anterior.
- Ventas de semanas anteriores quedan excluidas.
- Vista previa, total e imagen comparten `pendingReceiptItems`; no se vuelve a recalcular una selección diferente al generar la imagen.
- Se mantuvo el HTML y el resto de funciones de la base V12.100, salvo el cache-busting del script y el código de selección del comprobante.

## Validaciones ejecutadas
- `node --check script.js`: OK.
- `node --check script-v12.101.js`: OK.
- Verificación de que el código de selección no consulta `semana_asignada`: OK.
- Verificación del ZIP: OK.

## Limitación
No se ejecutó una prueba E2E en navegador autenticado contra Supabase. La corrección debe probarse en una copia antes de publicar. No se modificó el repositorio original, Vercel ni Supabase.
