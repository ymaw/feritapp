# FeritApp V12.66 — rediseño Nueva Venta y corrección del micrófono gigante

## Cambios
- Corrección del SVG de micrófono que aparece inline dentro de la ayuda de dictado. La causa probable era que ese SVG está fuera de `.mic-btn`, por lo que las reglas anteriores que limitaban el icono solo dentro del botón no lo alcanzaban. Ahora el icono inline tiene tamaño 13x13, `fill:none` y trazo explícito dentro de cualquier `.hint` del formulario.
- El pie con total y Guardar se oculta hasta que haya al menos un artículo con nombre no vacío y precio mayor que cero; vuelve a mostrarse en cuanto se completa el artículo. Se actualiza al escribir el nombre o el precio y al eliminar artículos.
- El pie ahora es compacto, con botón más bajo, menos padding y sombra sutil.
- Nueva Venta recibe una reorganización más marcada: campos en tarjetas, encabezados de artículo separados, nombre/precio en dos columnas y categoría a ancho completo, controles más compactos y mejor jerarquía de etiquetas.
- Los cambios respetan variables de tema y se aplican a Nueva Venta; los estilos comunes del pie y el SVG inline también cubren Editar Venta.

## Validaciones
- `node --check script.js`
- balance de llaves CSS
- comprobación de integridad del ZIP
- revisión estática de los puntos de entrada JS modificados y del selector `.hint .mic-icon`.

No se pudo realizar prueba visual en navegador ni dictado real; el resultado en ejecución sigue pendiente de confirmación. No se modificó el repositorio original ni Supabase de producción.
