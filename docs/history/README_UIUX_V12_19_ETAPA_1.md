# FeritApp V12.19 — Etapa 1: gestión unificada y entregas

Esta versión parte de V12.18 y trabaja sobre una copia. No modifica el repositorio original ni ejecuta cambios en Supabase.

## Incluido
- Unificación visual de Clientes y Ventas en una única pestaña **Ventas**.
- Búsqueda por cliente, artículo o categoría, filtros Todos / Por cobrar / Por entregar / Entregados y tarjetas con total de clientes, ventas de la semana y saldo por cobrar.
- Tarjetas agrupadas por cliente con acciones de copiar nombre, Messenger, compartir comprobante, agregar artículo y marcar entrega.
- Nueva pantalla **Entregas**, con acciones rápidas para marcar los artículos de un cliente como entregados o volver a marcarlos pendientes.
- Resúmenes e historial semanal en **Inicio**, con detalle expandible por cliente.
- Avatar de usuario en la esquina superior derecha y botón Atrás a la derecha.

## Paso obligatorio para habilitar estado de entrega persistente
El esquema actual de `sales` no garantiza que exista una columna de entrega. Ejecutar manualmente `MIGRACION_V12_19_ENTREGAS.sql` en Supabase SQL Editor. La app no ejecuta migraciones automáticamente. La columna `entregado` es independiente de `pagado`; el código muestra un aviso si la columna todavía no existe.

## Validaciones realizadas
- `node --check script.js`.
- Verificación de estructura HTML y ZIP.
- No se realizaron pruebas E2E con Supabase ni se modificó la base de datos real.

## Antes de publicar
1. Aplicar la migración SQL en un entorno de prueba.
2. Probar actualización de `entregado` con dos usuarios/cuentas para confirmar RLS y persistencia.
3. Probar editar categoría, artículo, quién retira, pagos, Messenger y comprobantes desde la tarjeta unificada.
4. Probar claro/oscuro y navegación en móvil y escritorio.
