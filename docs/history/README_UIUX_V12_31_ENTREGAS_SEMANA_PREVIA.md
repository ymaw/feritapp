# FeritApp V12.31 — Entregas de semana actual y previa

## Cambios

- La vista **Entregas** muestra las ventas de la semana corriente y de la semana calendario inmediatamente anterior.
- Los filtros se aplican por cliente agrupado: **Todos** muestra clientes entregados y pendientes; **Por Entregar** muestra clientes que todavía tienen al menos un artículo pendiente; **Entregado** muestra clientes cuyos artículos de las dos semanas visibles están todos entregados.
- Marcar un cliente como entregado o pendiente actualiza únicamente sus ventas de la semana corriente y la semana inmediatamente anterior, no sus ventas históricas más antiguas.
- El **Resumen Semanal** de Inicio muestra una insignia de estado **Entregado / Por Entregar** para los clientes de la semana calendario inmediatamente anterior. La insignia es informativa y no añade controles de edición.
- Se añadió una función `previousWeekKey()` para centralizar el cálculo de la semana anterior.

## Validaciones realizadas

- `node --check script.js`.
- Pruebas aisladas de selección de semanas, filtrado de clientes entregados/pendientes y estado visible en el resumen semanal.
- Verificación de integridad del ZIP.

No se modificó el repositorio remoto ni se realizaron escrituras en Supabase durante la preparación de esta versión. No se ejecutó una sesión completa del navegador con datos reales, por lo que la validación de integración visual queda pendiente.
