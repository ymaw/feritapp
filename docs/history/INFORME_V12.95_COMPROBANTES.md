# FeritApp V12.95 — Corrección de selección de comprobantes

## Cambio
- Reemplaza la selección basada en claves de semana por límites de fechas locales explícitos, calculados desde el inicio de semana configurado.
- Valida el día de inicio de semana (0–6) y usa lunes como valor seguro si la preferencia no es válida.
- Usa la fecha real de venta (`fecha`), nunca `semana_asignada`.
- Abonado: únicamente ventas de la semana actual, si todas las ventas de referencia están pagadas.
- Pendiente: ventas de la semana actual y de la inmediatamente anterior.
- Las ventas anteriores quedan excluidas incluso si el nombre del cliente coincide. Se conserva la normalización de nombre por espacios y mayúsculas.
- No cambia CSS, diseño, endpoints, base de datos ni otros flujos funcionales.
- Actualiza las referencias de caché de recursos propios a 12.95.

## Pruebas
- `node --check script.js`: aprobado.
- `tests/test-receipt-selection-v12.95.cjs`: ejecuta la función extraída del `script.js` y verifica ventas pendientes, abonadas, cliente distinto, exclusión de ventas históricas y preferencia de semana inválida: aprobado.
- Integridad del ZIP: verificada tras generarlo.

## Limitaciones
No se realizó una prueba E2E en navegador conectado a Supabase ni se modificó el despliegue. La validación cubre la función de selección real, con datos de prueba controlados.
