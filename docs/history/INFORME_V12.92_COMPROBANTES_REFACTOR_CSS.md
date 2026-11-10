# FeritApp V12.92 — comprobantes y refactorización CSS

## Corrección de comprobantes
- La selección ahora normaliza el nombre del cliente y valida fechas antes de filtrar.
- El estado pagado se interpreta de forma explícita para booleanos `true`, `1` y texto `"true"`; el texto `"false"` ya no se considera pagado por coerción de JavaScript.
- Se aplica un filtro final por lista permitida de semanas justo antes de guardar los artículos para el comprobante: abonado = semana actual; pendiente = semana actual + semana anterior.
- Se mantiene la fecha real de la venta como referencia; `semana_asignada` no altera el período del comprobante.
- Se agrega versionado a `script.js` para evitar que el navegador siga ejecutando una copia en caché.

## Continuación de la refactorización CSS
- Se movieron las reglas existentes del editor/preview de comprobantes desde `style.css` a `receipt.css`, sin reescribir sus declaraciones.
- Se agregó la hoja al HTML después de `style.css`, manteniendo los estilos de componentes existentes.

## Validaciones realizadas
- `node --check script.js`.
- Comparación estructural de las declaraciones CSS movidas: bloque extraído sin cambios de contenido.
- Prueba unitaria aislada de la regla de período con escenarios pagado/pendiente e historial antiguo.
- Integridad del ZIP.

## Limitaciones
No se ejecutaron pruebas E2E con navegador ni pruebas conectadas a Supabase real. No se modificó el repositorio remoto, Vercel ni la base de datos.
