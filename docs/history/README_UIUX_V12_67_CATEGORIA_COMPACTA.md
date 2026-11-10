# FeritApp V12.67 — selector de categoría y cierre del rediseño de Nueva Venta

## Cambios
- Reduje la altura del selector de Categoría a 38 px (36 px en pantallas de hasta 380 px), manteniendo el ancho disponible para no recortar nombres de categoría.
- Añadí espacio interno a la derecha y coloqué la flecha a 14–15 px del borde, para que no quede pegada al contenedor.
- Ajusté el espacio entre la etiqueta Categoría y el selector.
- La misma regla se aplica a Nueva Venta y Editar Venta. Está acotada a `.item-field-category select.row-categoria` para no cambiar dropdowns de otras pantallas.
- El bloque se agrega al final de `style.css` para prevalecer sobre reglas históricas contradictorias de altura y padding.
- Se mantienen los cambios de V12.66 para el diseño de Nueva Venta y el icono inline de ayuda del micrófono.

## Validaciones
- `node --check script.js`.
- Balance de llaves de CSS.
- Integridad del ZIP.
- Revisión estática de las reglas previas de categoría: la nueva regla final especifica el selector de ambos modos y prevalece en altura, padding y posición de fondo.

No se pudo realizar una prueba visual/interactiva real en navegador. La apariencia final debe confirmarse en móvil, en ambos temas. No se modificó el repositorio original ni la base de datos de producción.
