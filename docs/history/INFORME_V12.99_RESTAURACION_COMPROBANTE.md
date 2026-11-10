# FeritApp V12.99 — restauración conservadora del comprobante

## Base y alcance
- Base independiente: paquete de trabajo V12.98, que conserva los cambios y funcionalidades recientes.
- Se restauró únicamente la selección de ventas del comprobante y el flujo de compartir a la lógica comprobada del archivo V12.70.
- No se modificó `receipt.css`, el diseño del comprobante, la función de Entregas ni la lógica de `semana_asignada`.
- No se tocó el repositorio original, Vercel ni Supabase.

## Comportamiento restaurado
- `shareReceipt()` vuelve a filtrar por cliente y por `fecha` en semana actual o semana anterior, con los helpers `weekKey()` y `previousWeekKey()` existentes.
- No usa `semana_asignada` para el comprobante.
- Se elimina la nueva selección `getReceiptSelectionForClient()` y la segunda selección en `performReceiptShare()`.
- Vista previa, total e imagen usan `pendingReceiptItems`, la misma lista establecida al abrir el editor.
- Se conserva la regla original de mensaje de agradecimiento cuando todos los artículos seleccionados están marcados como pagados.
- Se mantiene la generación de imagen y el diseño actual del canvas.
- Se utiliza el archivo `script-v12.99.js` para evitar confundirlo con scripts de versiones anteriores en caché.

## Verificaciones realizadas
- Sintaxis JavaScript (`node --check`).
- Prueba automatizada de la selección semanal con datos sintéticos: semana actual + anterior admitidas; semana más antigua y ventas de otro cliente excluidas; semana operativa asignada no usada.
- Integridad del ZIP (`unzip -t`).

## Limitación
Las pruebas son locales y con datos sintéticos. No constituyen una prueba E2E en navegador ni validación contra la base de datos real. La corrección debe confirmarse en una copia/despliegue de prueba antes de publicar.
