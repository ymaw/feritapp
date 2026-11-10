# FeritApp V12.60 — refinamiento del flujo de Nueva Venta

## Cambios
- Refuerza la distribución del encabezado de Artículos y el enlace para crear categorías en espacios angostos.
- Evita que el nombre del artículo, el selector de categoría y los botones de quitar se desalineen o desborden.
- Mejora la lectura del total y la distribución de la barra inferior de total/guardado en móviles angostos.
- Normaliza el ancho de los campos de artículo y el espacio interno del dropdown de categoría.
- Los ajustes quedan limitados a `#sheet.new-sale-mode`; no rediseñan el formulario de Editar artículo.
- No cambia el tamaño de ningún micrófono, incluido el de Precio, cuyo tamaño correcto en V12.58 fue confirmado por el usuario.
- No modifica IDs, handlers, dictado, cálculo del total, categorías, guardado, estados de pago/retiro ni acceso a Supabase.
- No se modificó el repositorio original ni la base de datos de producción.

## Validaciones
- `node --check script.js`.
- Integridad del ZIP.
- Inspección estática de los selectores agregados.

## Pendiente de prueba real
No se completó prueba visual automatizada ni interacción en móvil/navegador. Antes de considerar terminado el rediseño, todavía deben probarse dictado, creación de categoría, alta de varios artículos, total, guardado, edición, cierre por botón/gesto y temas claro/oscuro.
