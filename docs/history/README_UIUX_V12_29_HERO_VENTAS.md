# FeritApp UI/UX V12.29 — ajuste del encabezado de Ventas

- Se corrigió la tarjeta “Clientes y Ventas” para que use el mismo margen exterior, padding, borde, radio, fondo, sombra y jerarquía tipográfica que la tarjeta de Ranking.
- Se anuló la regla anterior que la hacía más ancha y con espaciado diferente (`margin: 12px 0`, padding reducido y tipografía más pequeña).
- Se mantiene el resto de la lógica y de las correcciones de la V12.28.

## Validaciones
- Se comprobó que las reglas finales de V12.29 prevalecen sobre las reglas antiguas mediante selectores específicos y `!important`.
- Se comprobará la sintaxis JavaScript, la integridad del ZIP y una captura local del encabezado antes de la entrega.
- No se modificó el repositorio remoto ni Supabase.
