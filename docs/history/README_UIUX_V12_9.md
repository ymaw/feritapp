# FeritApp UI/UX V12.9

## Cambios
- Menú inferior «Más» compactado: se eliminaron subtítulos y etiquetas de grupo que provocaban varias líneas; cada opción queda en una sola línea con truncado responsive.
- Botón Messenger: copia el nombre del cliente y navega al enlace universal oficial `https://m.me/`; en Android se utiliza un `intent://` HTTPS con paquete `com.facebook.orca` y fallback web.
- Comprobante: la vista previa y el PNG consultan el nombre de tienda del estado de sesión y, como respaldo, el campo de perfil. Se mantiene el icono de la app junto al nombre en el PNG y en la vista previa.

## Limitaciones conocidas
- Un nombre de cliente no basta para abrir una conversación específica de Messenger. Hace falta guardar un enlace válido del perfil/chat o un identificador admitido por Meta.
- La apertura de una app externa depende del navegador, el sistema operativo, el tipo de instalación y la asociación de enlaces del dispositivo; no se pudo validar en el dispositivo del usuario.
- No se modificó el repositorio original ni la base de datos. No se ejecutaron pruebas end-to-end de Supabase.
