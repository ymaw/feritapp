# FeritApp UI/UX V12.10

Cambios incluidos sobre la copia V12.9:
- Pestaña Ventas renombrada a **Entregas** y una sola vista de clientes expandibles con artículos, precio, estado de pago, edición y eliminación por artículo.
- Agrupación visual de artículos por cliente en Entregas; no fusiona registros en la base de datos para preservar estados de pago, fechas e identificadores individuales.
- Las fichas de Clientes se insertan debajo de la tarjeta seleccionada dentro del flujo de la lista, de modo que las siguientes tarjetas se desplazan y vuelven al lugar al cerrar.
- Control de tamaño de letra del mensaje del comprobante (10–16 px) aplicado a la vista previa y a la imagen exportada.
- Vista previa del comprobante con foto de perfil de tienda junto al nombre. Imagen exportada con foto en el encabezado y nombre de la tienda + logo de FeritApp en el pie.
- Flecha del botón Atrás centrada horizontal y verticalmente en su contenedor.

Validación: `node --check script.js` pasó. No se realizaron pruebas end-to-end con Supabase ni pruebas reales en dispositivos. Revisar visualmente en desktop y móvil antes de publicar.
