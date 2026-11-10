# FeritApp UI/UX V12.50

## Cambios
- Rediseño visual de **Nueva venta** con jerarquía por etapas (cliente, artículos/total, pago y entrega), campos más claros y artículos organizados en dos columnas en móvil. Se conservan los IDs, controles, dictado por micrófono, categorías, estados de pago/retiro y guardado existentes. El modo de edición mantiene su clase y estilo separado.
- El comprobante se limita a artículos de la semana actual y la inmediatamente anterior según el día de inicio de semana configurado.
- Si todos los artículos incluidos están abonados, el comprobante muestra `Muchas Gracias por tu compra!, espero que lo disfrutes! ❤️` y el campo queda bloqueado para ese envío. El mensaje personalizado guardado no se pisa.
- Si queda algún artículo pendiente de pago, se mantiene el mensaje personalizado habitual.

## Validaciones realizadas
- `node --check script.js`
- Integridad del ZIP (`unzip -t`).
- No se modificó el repositorio original ni se realizó una prueba visual en navegador conectado a Supabase.
