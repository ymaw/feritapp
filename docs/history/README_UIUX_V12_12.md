# FeritApp UI/UX V12.12

## Cambios
- El botón Atrás queda alineado a la derecha y mantiene la flecha centrada dentro del botón.
- Se oculta el título global redundante del encabezado para priorizar el título/subtítulo propio de cada pantalla.
- El menú Más fuerza una cuadrícula consistente para alinear icono, texto y flecha en una sola fila.
- En Entregas, la persona que retira aparece una sola vez en la tarjeta del cliente, no repetida por artículo.
- La tarjeta superior se llama Resumen Semanal, comienza colapsada y muestra los clientes/artículos de la última semana cerrada al expandirse.
- El historial de semanas anteriores conserva las ventas agrupadas por cliente y los artículos anidados, igual que la semana actual.
- Cada bloque de ventas usa identificadores únicos para evitar que una tarjeta expandida abra el contenido de otra semana.

## Validación
- `node --check script.js` pasó.
- No se modificó el repositorio original ni la base de datos de producción.
- Falta prueba de interacción real en navegador y móvil, incluida la representación visual del menú y del encabezado.
