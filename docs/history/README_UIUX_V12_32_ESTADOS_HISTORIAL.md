# FeritApp UI/UX V12.32 — Estados de entrega en semanas anteriores

## Corrección
- Se muestran los estados de entrega `Entregado` / `Por Entregar` en las tarjetas de clientes dentro de cada semana del historial.
- Cada estado se calcula únicamente con los artículos de ese cliente dentro de la semana histórica abierta.
- El resumen semanal de la última semana cerrada conserva los estados de entrega para la semana inmediatamente anterior a la actual.
- Los estados del historial son informativos; no habilitan modificar entregas desde semanas históricas.

## Alcance
- Modificado `script.js`.
- No se modificó el repositorio remoto ni Supabase.

## Validación
- `node --check script.js`.
- Verificación de que el render del historial agrega el estado por grupo de cliente.
- No se ejecutó una prueba visual autenticada contra Supabase.
