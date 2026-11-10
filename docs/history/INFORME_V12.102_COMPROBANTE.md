# FeritApp V12.102 — Corrección de selección de comprobantes

## Corrección
- Las ventas de la semana actual siempre se incluyen.
- De la semana anterior solo se incluyen ventas cuyo campo `pagado` indique que siguen impagas.
- Ventas de semanas anteriores quedan excluidas, aunque `semana_asignada` apunte a la semana actual.
- La vista previa y el PNG siguen usando `pendingReceiptItems` y `pendingReceiptTotal` derivados de una única selección.
- `index.html` continúa cargando `script.js` con un parámetro de caché actualizado.

## Validaciones ejecutadas
- `node --check script.js` y `node --check script-v12.101.js`.
- Prueba de regresión con el escenario informado: $40.200 de ventas previas ya pagadas y $7.800 de la semana actual; el comprobante suma $7.800.
- Prueba de que una venta realmente impaga de la semana anterior sí se agrega.
- Verificación de integridad del ZIP.

## Limitación
Las pruebas son de lógica aislada y sintaxis; no equivalen a una prueba E2E contra una sesión real de Supabase.
