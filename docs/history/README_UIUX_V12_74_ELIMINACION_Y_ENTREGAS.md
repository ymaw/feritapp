# FeritApp V12.74 — eliminación accesible y Entregas agrupadas

## Cambios

### Eliminación de una venta
- Reforcé la detección de pulsación prolongada con eventos táctiles explícitos y tolerancia a pequeños movimientos del dedo; el movimiento propio del desplazamiento cancela la selección.
- En escritorio se conserva la pulsación prolongada con mouse/pen.
- La flecha de la tarjeta de cliente se reemplaza por una X roja cuando se selecciona una venta. La X permanente no se agrega dentro de cada artículo.
- La X abre un diálogo propio con los estilos y variables de FeritApp (superficie, bordes, colores de tema, contraste, foco visible y botones Cancelar/Eliminar), en lugar del `confirm()` nativo del navegador.
- Se usa el mismo diálogo para los otros botones de eliminación existentes.
- La eliminación continúa pasando por `deleteSale`, que verifica el error de Supabase y que se haya eliminado una fila; no se modificaron políticas RLS ni credenciales.
- La activación con teclado (Enter/Espacio) y salida con Escape se conserva.

### Entregas
- Un cliente aparece una sola vez aunque tenga artículos correspondientes a varias semanas.
- Dentro de su tarjeta se separan las semanas en filas independientes, con controles de estado propios por semana.
- La semana actual se distingue con el fondo habitual de superficie y el texto de semana en color primario; las semanas anteriores usan un fondo gris muy sutil.
- Se conserva la regla acordada: semana actual muestra entregados y pendientes; las dos semanas previas solo muestran pendientes; semanas más antiguas quedan fuera de la lista. No se eliminan ni alteran registros por el mero cambio de semana.

## Validaciones realizadas
- `node --check script.js`.
- Análisis sintáctico de CSS con `tinycss2`.
- Comprobación de integridad del ZIP (`unzip -t`).
- Revisiones estáticas de los nuevos eventos de pulsación, el diálogo de eliminación y la agrupación por cliente/semana.

## Pendiente de validar manualmente
No se pudo comprobar el borrado real en una sesión autenticada de Supabase ni el comportamiento táctil en un dispositivo físico. Antes de publicar, probar con una venta de prueba: mantener presionado, comprobar el cambio de flecha a X, cancelar, volver a abrir y confirmar. Verificar también un cliente con ventas de la semana actual y una o ambas semanas anteriores, y cambiar por separado el estado de cada fila semanal.

## Seguridad y alcance
Trabajado sobre una copia local. No se modificó el repositorio remoto ni se realizaron escrituras en producción.
