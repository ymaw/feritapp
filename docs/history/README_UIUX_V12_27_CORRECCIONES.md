# FeritApp UI/UX V12.27 — correcciones y validación

Esta entrega parte de la V12.26 y corrige los puntos detectados en la revisión:

- En Ventas queda una sola flecha visible para expandir/contraer cada tarjeta, situada a la derecha del estado de pago.
- El control de pago del encabezado alterna entre «Pendiente de Pago» y «Abonado» sin cerrar tarjetas que ya estaban expandidas.
- Se elimina el botón de pago duplicado de cada artículo dentro de la tarjeta expandida en Ventas.
- Se mantiene el importe y el detalle por artículo; los controles de edición/eliminación conservan su comportamiento en vistas donde correspondan.
- El encabezado de «Clientes y Ventas» comparte la base visual de los encabezados de las otras secciones.
- Se conserva el encabezado de marca con la flecha de volver a la izquierda, el eslogan centrado debajo de FeritApp y los recursos de logo PNG con canal alfa.
- No se modificó el repositorio remoto ni se ejecutaron escrituras sobre Supabase durante esta preparación.

## Comprobaciones realizadas

- `node --check script.js`: correcto.
- Verificación estática: no hay botón «Historial» en las acciones de la tarjeta de Ventas; no se genera el botón «Pago/Pendiente» por artículo en la vista de gestión; existe un solo elemento visual `.sales-group-chevron` por tarjeta.
- Se conserva la expansión al cambiar el estado de pago, según el manejador de actualización.
- Los PNG de marca inspeccionados mantienen modo RGBA con píxeles transparentes.

La comprobación de sintaxis y del código no sustituye una prueba funcional con una sesión autenticada y datos reales en el navegador.
