# FeritApp V12.38 — Corrección de estado en Resumen Semanal

## Alcance
- Cambio limitado al estado informativo de entrega en Inicio > Resumen Semanal.
- No modifica la vista Entregas ni sus controles.

## Cambio
- El estado informativo del resumen tiene ahora una clase propia (`weekly-summary-delivery-status`) y un atributo de diagnóstico (`data-weekly-delivery-status`).
- `style.css` fuerza su visibilidad dentro de `#weeklySummaryContent`, evitando que reglas genéricas de estados puedan ocultarlo.
- El texto sigue derivándose de `entregado` de los artículos de ese cliente en la semana anterior: todos entregados => `Entregado`; si falta alguno => `Por Entregar`.

## Validación
- Validar sintaxis con `node --check script.js`.
- Validar integridad con `unzip -t`.
- La prueba visual autenticada contra Supabase queda pendiente; no se afirma que se haya realizado.
