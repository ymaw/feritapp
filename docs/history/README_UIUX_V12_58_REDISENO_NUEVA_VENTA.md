# FeritApp UI/UX V12.58 — cierre visual de Nueva Venta

## Cambios
- Se conserva la corrección puntual del micrófono de Precio; los demás micrófonos mantienen sus dimensiones y estilos previos.
- Se ajustan la jerarquía del encabezado, el botón de cierre y la cabecera sticky durante el desplazamiento.
- Se mejora la consistencia de los bloques de comprador, artículos, pago y retiro, con campos más legibles y espaciado más compacto.
- Se refuerzan la tarjeta numerada de cada artículo, el total, la acción para agregar artículos y la barra inferior fija de total/guardado.
- Se pulen la creación de categorías, los mensajes de voz, los estados de foco y los tamaños para pantallas angostas.
- Los cambios son de presentación CSS: no se modifican IDs, handlers de guardado, dictado, estados de pago/retiro ni acceso a Supabase.
- Se conservan los gestos de swipe de la versión anterior. No se modificó el repositorio original ni la base de datos de producción.

## Validaciones
- `node --check script.js`
- Integridad del ZIP (`unzip -t`).
- No se realizó una prueba visual automatizada ni una prueba funcional real en navegador/móvil/Supabase; por lo tanto, el acabado visual final debe confirmarse al probar esta copia en la app.
