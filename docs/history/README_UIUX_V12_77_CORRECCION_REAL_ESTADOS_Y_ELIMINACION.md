# FeritApp V12.77 — Corrección de estados y eliminación desde tarjeta principal

## Cambios

### Entregas
- Se muestra un único estado por cliente en la cabecera principal de su tarjeta: **Por Entregar** o **Entregado**.
- El estado se presenta compacto, junto a la flecha de expansión/colapso, para reservar espacio.
- Al tocar el estado se alterna entre pendiente y entregado para las entregas visibles de ese cliente.
- Los detalles internos por semana mantienen fechas, cantidades de artículos y totales, pero no repiten estados.
- La flecha y el área del nombre abren/cierran las semanas de la tarjeta.

### Ventas
- La pulsación prolongada se vincula a la cabecera de la tarjeta principal del cliente, no a la fila de un artículo.
- La X roja aparece en el lugar de la flecha y abre una confirmación con la cantidad de ventas/artículos que se eliminarán.
- Confirmar elimina las ventas contenidas en esa tarjeta mediante Supabase y actualiza la interfaz solo después de recibir respuesta.
- No se añade un botón de eliminación permanente a cada artículo.

## Verificaciones realizadas
- `node --check script.js`.
- Balance de llaves CSS.
- Revisión estática de selectores de estado, expansión y pulsación prolongada.
- Integridad del ZIP con `unzip -t`.

## Límites de verificación
No se probó una sesión autenticada de Supabase ni una interacción real en navegador. La eliminación en bloque afecta a los registros incluidos en la tarjeta del cliente; leer cuidadosamente el diálogo antes de confirmar. No se modificó el repositorio original ni las políticas RLS.
