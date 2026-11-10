# FeritApp V12.61 — consistencia entre Nueva Venta y Editar venta

## Cambios
- El formulario de edición agrupada (`Editar venta · cliente`) activa una clase visual propia para reutilizar ajustes de alineación del flujo de Nueva Venta.
- Normaliza la cabecera de artículos, el botón de quitar, los campos, el selector de categoría, el total y la barra inferior en espacios angostos.
- El modo se determina a partir del título al abrir el formulario y se limpia al reiniciar el formulario.
- La edición individual (`Editar artículo`) queda fuera de estos estilos.
- No se modifican IDs, eventos de guardado, validaciones, dictado, lógica de categorías, cálculo de totales ni llamadas a Supabase.
- No se cambió el tamaño de los micrófonos.
- No se modificó el repositorio original ni la base de datos de producción.

## Validaciones
- Comprobación estática de los cambios de clase y selectores CSS.
- Pendiente: prueba visual real de Nueva Venta/Editar venta, gestos en móvil y persistencia contra una cuenta de prueba.
