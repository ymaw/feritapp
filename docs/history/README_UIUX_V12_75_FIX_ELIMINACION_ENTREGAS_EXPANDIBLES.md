# FeritApp V12.75 — corrección de eliminación y Entregas

## Cambios

### Ventas: eliminación por pulsación prolongada
- Reemplacé la combinación de manejadores táctiles/pointer parcialmente solapados por un flujo basado en Pointer Events.
- La pulsación prolongada se activa a los 600 ms si el puntero no se desplaza más de 20 px.
- Se ignoran los controles interactivos internos para no activar la eliminación al usar botones.
- Se cancela el temporizador al soltar, cancelar o perder el puntero; se evita el menú contextual sobre el artículo.
- Al seleccionar un artículo, la flecha del encabezado de su tarjeta de cliente se convierte en una X roja. La X abre el diálogo estilizado ya existente.
- Se mantiene la confirmación y la validación de la respuesta de Supabase al eliminar.

### Entregas: una tarjeta por cliente, expandible
- Cada cliente tiene una única tarjeta colapsada por defecto.
- Al expandirla se muestran las filas de semana actual y hasta las dos semanas anteriores que cumplan los filtros de estado existentes.
- Los controles de estado permanecen separados por semana y cada cambio apunta a la clave semanal correspondiente.
- La semana actual se distingue con un fondo/borde levemente teñido; las semanas anteriores usan un fondo neutro más sutil.
- Se conserva la ventana máxima de tres semanas y el historial de ventas; no se borran registros al salir de la ventana.

## Validaciones realizadas
- `node --check script.js`.
- Revisión sintáctica/estructural del CSS y comprobación de llaves.
- Revisión estática de los selectores y eventos que conectan la pulsación prolongada, la X, el diálogo y la expansión de clientes.
- `unzip -t` sobre el ZIP final.

## Pendiente
No se pudo ejecutar una prueba visual interactiva completa ni probar el borrado contra una sesión autenticada de Supabase. La autorización final sigue dependiendo de las políticas RLS existentes.
