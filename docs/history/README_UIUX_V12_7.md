# FeritApp UI/UX V12.7

## Cambios incluidos
- Menú desplegable de «Más» rediseñado con jerarquía visual, iconos, descripciones y agrupación de opciones existentes.
- Botón de retroceso global en pantallas distintas de Inicio; también se puede usar Escape en teclado. Desde el detalle del cliente vuelve al listado, y desde un panel de Configuración vuelve al menú de Configuración.
- Ranking con medallas/puestos, nombre y subtítulo centrados en una columna estable y una insignia separada para la cantidad de artículos.
- Comprobante: el encabezado usa únicamente el nombre de la tienda configurado, manteniendo la tipografía destacada y sin anteponer «Tienda» ni mostrar «FeritApp» en esa posición.
- Acciones Messenger intentan abrir la app mediante `fb-messenger://` en lugar de redirigir a `messenger.com`.

## Límites y comprobaciones
- Una conversación concreta de Messenger no se puede identificar de forma fiable solo con el nombre visible de un cliente. Para abrir directamente ese chat hace falta su URL/perfil o username de Messenger.
- La apertura nativa depende de que el dispositivo tenga Messenger instalado y permita el esquema `fb-messenger://`. No se incluye redirección automática a la web.
- `node --check script.js` pasó. Se verificaron estáticamente las cadenas de navegación, el nombre de tienda y el enlace nativo. No se ejecutó una prueba E2E con Supabase ni en dispositivos reales.
- Esta es una copia de trabajo basada en V12.6. No se modificó el repositorio original ni la base de datos.
