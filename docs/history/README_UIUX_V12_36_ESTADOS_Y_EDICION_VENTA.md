# FeritApp V12.36 — Estados del Resumen Semanal y edición de venta

Base: V12.35. Esta versión corrige dos comportamientos solicitados.

## Inicio → Resumen Semanal
- La vista se construye exclusivamente con las ventas de la semana calendario inmediatamente anterior.
- En esa vista se muestra siempre el estado de entrega por cliente: `Entregado` si todos sus artículos están entregados; `Por Entregar` si al menos uno está pendiente.
- El estado se muestra junto al estado de pago. La condición no vuelve a filtrar/comparar cada fecha del grupo, evitando que la insignia desaparezca por discrepancias en el parseo de fecha.
- Las semanas históricas más antiguas no reutilizan este resumen y no muestran esos estados.

## Ventas → Editar Venta
- El botón de la tarjeta de un cliente abre una edición conjunta de los artículos de ese cliente correspondientes a la semana actual.
- Permite corregir nombre, precio y categoría de los artículos existentes.
- Permite quitar artículos existentes; se eliminan al guardar.
- Permite agregar artículos nuevos en la misma edición.
- Guarda los cambios en Supabase solo cuando el usuario presiona Guardar cambios. No se ejecutaron escrituras durante la preparación de este ZIP.

## Validaciones
- `node --check script.js`
- Integridad del ZIP con `unzip -t`
- Revisión estática de los cambios.
- No se realizó prueba visual autenticada en navegador ni escritura de prueba en Supabase.
