# feritApp V12.5 — acciones de clientes y comprobante

## Cambios
- Se elimina el flujo de asociación/enlace de Messenger. FeritApp solo copia el nombre del cliente al portapapeles para que el vendedor lo pegue manualmente en el buscador de Messenger.
- Se agrega acción de copiar nombre junto a compartir comprobante en cada fila de Clientes.
- Se agregan botones con iconografía SVG coherente dentro del detalle de la ficha del cliente: Copiar nombre y Compartir comprobante.
- Se rediseña la vista previa del comprobante con jerarquía de marca, fecha, artículos, total destacado y editor de mensaje.
- Se rediseña también la imagen PNG generada para compartir, para que el comprobante exportado use la nueva identidad visual y no solo la vista previa.
- No se modifican las reglas de ventas ni se toca el repositorio original ni la base de datos.

## Validación
- `node --check script.js` pasó correctamente.
- No se ejecutó una prueba end-to-end con Supabase ni una prueba de compartir desde un dispositivo móvil real.
