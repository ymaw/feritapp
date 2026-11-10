# FeritApp V12.59 — Auditoría transversal de alineación

## Base y alcance
- Parte de V12.58, que el usuario confirmó que tiene el micrófono de Precio con el tamaño correcto.
- Conserva el ajuste de micrófono específico de Precio; no introduce nuevas reglas de dimensiones para todos los micrófonos.
- Añade normalización CSS para centrar glifos e iconos de botones, flechas de expansión/colapso, flechas laterales de menús y selectores nativos.
- Refuerza `box-sizing`, alturas mínimas y alineación vertical de filas de controles, sin modificar IDs ni lógica de negocio.
- Se mantienen el rediseño de Nueva Venta y los gestos heredados de V12.58.
- No se modificó el repositorio original ni Supabase.

## Validación realizada
- `node --check script.js`.
- Integridad del archivo ZIP.
- Inspección estática de selectores CSS y estructura de archivos.

## Limitación
No se completó una validación visual automatizada ni pruebas interactivas en navegador/móvil. Por eso, los ajustes son una pasada de alineación transversal basada en el CSS existente; los estados visuales y posiciones exactas deben confirmarse con una sesión real de la aplicación.
