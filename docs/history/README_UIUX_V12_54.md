# FeritApp UI/UX V12.54

## Cambios
- En la pantalla Ventas, los valores de las tarjetas “Total de clientes”, “Ventas esta semana” y “Por cobrar” quedan centrados horizontalmente; también se centra el texto de las etiquetas para mantener una composición consistente.
- En Nueva venta, cada artículo muestra un indicador numerado que se actualiza automáticamente con la posición del artículo, en lugar de una insignia vacía.
- Se mejora la separación entre artículos y los campos de estado de pago y quién retira.
- La barra inferior con total y acción Guardar permanece visible al desplazarse por el formulario, respetando el área segura inferior del móvil.
- Se conservan los identificadores y la lógica existente del formulario; no se modifica el repositorio original.

## Validaciones realizadas
- `node --check script.js`
- `unzip -t` del paquete generado

No se realizó una prueba visual en navegador ni una prueba de guardado contra Supabase en esta ejecución.
