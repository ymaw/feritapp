# FeritApp V12.35 — Corrección de estados de entrega duplicados

Esta versión parte de la V12.34 y corrige la presentación de estados solicitada.

## Cambios

- En la pantalla **Entregas**, se quitó la insignia redundante `Entregado` / `Por Entregar` que se repetía junto a los botones de cambio de estado. Se conservan los botones de acción para marcar una entrega y el estado de pago.
- En **Inicio → Resumen Semanal**, el resumen ahora consulta exclusivamente la semana calendario inmediatamente anterior a la actual, no la semana histórica más reciente que tenga ventas.
- Los estados informativos `Entregado` / `Por Entregar` permanecen en las tarjetas del Resumen Semanal solo para esa semana anterior. Las semanas históricas más antiguas no reciben esos estados.
- No se cambió el comportamiento de persistencia ni las consultas a Supabase.

## Validaciones

- `node --check script.js`.
- Comprobación estática de que la tarjeta de Entregas conserva una única zona de acciones de entrega y no repite una insignia de estado.
- Comprobación de que el Resumen Semanal usa `previousWeekKey()` y no `pastKeys[0]`.
- Integridad del ZIP (`unzip -t`).

No se ejecutó una prueba visual en navegador con sesión autenticada; la validación es estática y de sintaxis.
