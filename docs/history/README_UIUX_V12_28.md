# FeritApp UI/UX V12.28

## Correcciones incluidas
- El botón **Ver todas las entregas** de Inicio navega directamente a **Entregas**.
- El historial de Inicio mantiene las tres semanas anteriores agrupadas dentro de una tarjeta unificada, con tarjetas por cliente, artículos e importes en modo de solo lectura.
- En el resumen histórico se ocultan los controles de edición, eliminación, pago y las acciones de Messenger/comprobante.
- La lista de Ventas se filtra primero por la semana corriente; los clientes y artículos de semanas anteriores ya no se mezclan con la lista actual.
- El cambio de estado de pago en Ventas actualiza solo los artículos del cliente pertenecientes a la semana corriente, no sus ventas históricas.
- Se compactó la tarjeta de encabezado de Ventas y se ajustó el diseño del historial semanal para reducir desbordes y contenido cortado en pantallas estrechas.

## Validación realizada
- `node --check script.js` sin errores de sintaxis.
- Comprobaciones estáticas de navegación, filtrado de semana actual, límite de tres semanas, agrupación por cliente y ausencia de controles de edición en el resumen histórico.
- Integridad del archivo ZIP comprobada después de empaquetar.

La validación estática no reemplaza una prueba manual con sesión autenticada y datos reales de Supabase.
