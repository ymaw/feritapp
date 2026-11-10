# FeritApp V12.93 — corrección de comprobantes y restauración visual

## Cambios
- Se corrigió `getReceiptSelectionForClient()` en `script.js`: normaliza el nombre del cliente, valida fechas y filtra explícitamente los artículos que pertenecen a las semanas permitidas.
- Regla conservada: abonado = solo semana actual; pendiente = semana actual + semana anterior. Las ventas anteriores a esas semanas quedan excluidas. `semana_asignada` no altera el período del comprobante.
- Se evita que el texto `"false"` se interprete como verdadero al evaluar el pago.
- Se corrigió el orden de carga de estilos: `receipt.css` se carga antes de `style.css`, para que las reglas visuales específicas y los ajustes posteriores ya existentes en `style.css` tengan prioridad. Esto recupera el diseño de la vista previa que se sobrescribía al cargar `receipt.css` al final.
- Se agregó versionado `v=12.93` a los CSS y al JS referenciados desde `index.html` para reducir problemas de caché. No se modificaron `category-picker.css` ni `weekly-summary-menu.css`.

## Pruebas ejecutadas
- `node --check script.js`.
- Prueba automatizada que extrae y ejecuta la función real `getReceiptSelectionForClient()` del `script.js`, cubriendo abonado, pendiente, texto `"false"`, nombre de cliente con distinta capitalización/espacios y exclusión de ventas históricas.
- Validación del orden de hojas de estilo y de integridad del ZIP.

## Alcance y limitaciones
Se trabajó sobre una copia independiente del ZIP V12.92. No se modificó el repositorio remoto, Vercel ni Supabase. No se ejecutó una prueba visual en un navegador real conectado a Supabase; el estilo se corrigió por inspección de cascada CSS y debe confirmarse visualmente al desplegar esta versión.
