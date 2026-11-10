# FeritApp V12.100 — corrección conservadora de inicialización

## Correcciones
- Restaurada `updateReceiptPreviewMessage()` desde V12.98 en `script.js` y `script-v12.99.js`. V12.99 la invocaba y registraba como callback, pero había eliminado su definición. La referencia indefinida podía lanzar `ReferenceError` durante la inicialización y evitar que se registraran pasos posteriores, incluida la carga de vistas/datos.
- `index.html` ahora carga `script.js?v=12.100`, evitando depender de que se publique un archivo con nombre versionado y reduciendo el riesgo de que HTML y JavaScript queden desincronizados.
- No se modificaron URL/clave de Supabase, políticas, base de datos, estilos ni lógica de autenticación. Se conserva la lógica de selección de comprobantes que traía V12.99; esta entrega no afirma resolver la regla comercial de selección de semanas.

## Verificaciones realizadas
- Sintaxis JavaScript con `node --check` en ambos archivos JS.
- Verificado que la función esté definida antes de los registros de eventos que la usan.
- Verificado que el HTML apunte a `script.js?v=12.100` y que el archivo exista en el ZIP.
- Integridad del ZIP.

## Limitación
No se ejecutó una prueba E2E real en navegador con sesión de Supabase. Antes de publicar, probar login, dashboard, clientes, ventas y abrir/editar/compartir comprobante en una copia de prueba.
