# FeritApp V12.68 — alineación, categoría y depuración CSS

Cambios sobre V12.67:
- Se reemplazó el bloque específico V12.67 por un bloque único V12.68 al final de `style.css`.
- Los títulos de Nombre del artículo, Precio y Categoría quedan como bloques con margen inferior uniforme.
- Los tres controles comparten altura de 44 px, borde, radio, tipografía, fondo y tamaño; Categoría ya no queda visualmente distinta de Precio.
- El selector deja 16 px de margen visual a la flecha y reserva espacio a la derecha para que el texto no se superponga.
- Ajuste aplicado tanto a Nueva Venta como a Editar Venta.
- Se añadió espacio bajo el título de la ventana y bajo el encabezado de artículos.
- Se mantiene el micrófono como botón compacto y el SVG de 15 px.

Depuración: se eliminó el bloque final V12.67 duplicado y se consolidaron sus reglas de categoría en el bloque V12.68. El resto del archivo conserva reglas históricas porque no se ha realizado una regresión visual completa de todas las pantallas.

Validaciones: sintaxis de JavaScript con Node.js, balance de llaves CSS, y prueba de integridad del ZIP. No se pudo completar una prueba visual real en navegador ni verificar ambos temas en ejecución. No se modificó el repositorio original ni la base de datos de producción.
