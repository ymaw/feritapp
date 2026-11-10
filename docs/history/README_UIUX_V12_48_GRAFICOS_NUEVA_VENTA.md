# FeritApp V12.48 — comparación semanal y rediseño Nueva Venta

## Cambios
- La comparación semanal ahora muestra el importe vendido por semana (últimas seis semanas), con barras redondeadas, gradiente y resaltado de la semana actual, respetando los colores CSS del tema.
- Se agrega un gráfico de dona para cobrado vs. pendiente de la semana más reciente con ventas, con importe total al centro, leyenda e importes por estado.
- Se conserva la tabla comparativa debajo de los gráficos, incluyendo cantidad de artículos, total vendido, cobrado y pendiente.
- Nueva Venta se diferencia visualmente de Editar Venta: encabezado con subtítulo, campos en bloques, mejor jerarquía de artículos, controles táctiles mayores y total más destacado. Los estilos se aplican mediante `new-sale-mode` para limitar el rediseño al alta.

## Validación
- `node --check script.js`.
- Integridad del ZIP.
- No se hizo una prueba visual interactiva en navegador ni una prueba funcional conectada a Supabase. Revisar especialmente los tamaños de los campos de artículo en móvil y el cambio entre Nueva Venta y Editar Venta.
