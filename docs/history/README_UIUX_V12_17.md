# FeritApp UI/UX V12.17

## Cambios
- Se amplió el espacio útil de las tarjetas de resumen semanal y resumen de ventas actual; el contenedor externo ya no aplica un marco y padding anidados que estrechaban el contenido.
- Rediseño visual del ranking: una sola ubicación por puesto para la cantidad de artículos; se eliminó la repetición de esa cantidad en el subtítulo.
- Nuevo botón «Compartir ranking». Genera una imagen vertical para redes sociales y usa el menú nativo de compartir cuando el navegador lo admite; si no puede compartir archivos, descarga la imagen PNG.
- Aumento del logo de FeritApp en el comprobante aproximadamente un 25 % (88 a 110 px en el PNG y 78 a 98 px en la vista previa), conservando proporciones y ajustando el espacio del encabezado.

## Validación
- `node --check script.js` ejecutado correctamente.
- No se realizaron pruebas de extremo a extremo en móvil ni cambios a Supabase.
- El comportamiento de compartir depende de las capacidades del navegador/sistema operativo.
