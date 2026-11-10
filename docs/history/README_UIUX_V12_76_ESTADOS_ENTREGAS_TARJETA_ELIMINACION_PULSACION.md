# FeritApp V12.76 — estados visibles en Entregas y eliminación por pulsación prolongada

## Cambios

### Entregas
- Los estados de entrega de cada semana aparecen en la cara principal de la tarjeta del cliente, antes de expandirla.
- Cada indicador muestra la semana y su estado actual; tocarlo cambia únicamente el estado de esa semana.
- Se quitaron del detalle expandido los botones/etiquetas de estado y los indicadores de pago que estaban dentro de cada fila semanal. El detalle conserva la información de la semana, cantidad de artículos y total.
- Se mantiene el agrupamiento de un único cliente por tarjeta, la ventana de tres semanas y el criterio de mostrar entregados y pendientes en la semana actual, pero solo pendientes en las dos semanas anteriores.
- La distinción visual entre semana actual y anteriores sigue siendo sutil.

### Ventas
- La pulsación prolongada se realiza sobre la tarjeta/fila completa del artículo dentro de Ventas.
- Al mantenerla presionada se habilita la X roja en el encabezado de la tarjeta del cliente; la eliminación se confirma mediante el diálogo de FeritApp.
- Se elimina el resaltado visual que marcaba el artículo como seleccionado. No se muestra un botón de borrar permanente en cada artículo.
- Se mantienen la confirmación y las comprobaciones de respuesta de Supabase, sin modificar las políticas RLS.

## Validaciones realizadas
- `node --check script.js`.
- Comprobación estructural de llaves CSS y de selectores/eventos de los nuevos estados en la tarjeta principal.
- `unzip -t` sobre el ZIP generado.

## Límites de verificación
No se ejecutó una prueba visual interactiva completa ni una eliminación real con sesión autenticada de Supabase. Por eso, las verificaciones anteriores no equivalen a una validación end-to-end en navegador.
