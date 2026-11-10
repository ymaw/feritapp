# FeritApp V12.42 — Fase 1: Inicio + base visual mobile de Nueva Venta

## Cambios incluidos
- En Inicio, se oculta únicamente el avatar del header; el avatar del saludo permanece visible.
- Tocar/clicar el avatar del saludo abre Configuración > Mi Perfil. También admite teclado (Enter/Espacio).
- Historial semanal excluye la semana inmediatamente anterior, porque ya se presenta en la tarjeta Resumen Semanal. Las semanas históricas más antiguas continúan disponibles.
- En Inicio > Resumen Semanal, los estados de entrega quedan debajo de los estados de pago para evitar que compitan por el ancho de la card.
- Primera fase visual de Nueva Venta: mejora de jerarquía, tarjetas de artículos, inputs táctiles, controles de pago/retiro y barra inferior fija. No se reemplazaron los IDs, campos, handlers, lógica de validación, micrófono, edición ni persistencia existentes.

## Alcance y validación
- Se modificaron `index.html`, `script.js` y `style.css`; no se cambió el esquema de base de datos ni la lógica de guardado de ventas.
- `node --check script.js` pasó.
- El archivo ZIP fue verificado por integridad.
- No se ejecutó una sesión interactiva de navegador ni una sesión real de Supabase. La prueba manual sigue pendiente: crear una venta con dictado, categoría, precio, retiro y pago; guardar; navegar a Inicio y comprobar avatar, historial y estados.

## Fases siguientes sugeridas
1. Revisar el formulario mobile en dispositivo real y ajustar detalles visuales sin cambiar comportamiento.
2. Ejecutar regresión funcional de creación/edición, dictado, total, categoría, retiro y estado de pago.
3. Entregar una fase aparte solo si las pruebas muestran ajustes necesarios.
