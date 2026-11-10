# feritApp UI/UX V6

Esta versión parte de UI/UX V5 y mantiene el repositorio original sin modificar.

## Corrección de foto de perfil
- Se corrigió la CSP para permitir imágenes servidas desde el proyecto Supabase y blobs locales.
- Se mantiene el bucket `avatars` y el flujo de `getPublicUrl()` existente.
- Se verifica el error de `user_settings.upsert()` después de subir la imagen.
- El avatar usa un fallback seguro al icono completo de feritApp si una URL deja de ser accesible.
- Se evita insertar directamente la URL del avatar mediante `innerHTML`.

## Configuración V6
- Menú reorganizado por prioridad:
  1. Cuenta y experiencia
  2. Ventas y comprobantes
  3. Datos y seguridad
- Cada opción tiene título, descripción corta e icono.
- Los paneles internos incorporan encabezado, contexto y tarjetas visuales.
- Mi Perfil separa identidad y seguridad de cuenta.
- Se mantiene la funcionalidad existente y los IDs usados por `script.js`.

## Validaciones
- `script.js` pasa `node --check`.
- `index.html` fue validado con el parser HTML estándar de Python.
- Se verificaron los IDs de configuración y avatar usados por JavaScript.
- Los iconos de instalación no contienen fondo blanco: sus esquinas son navy y no transparentes, formando un icono completo.

## No modificado
- No se modificó el repositorio original.
- No se realizaron cambios en Supabase/RLS.
- No se cambió la lógica de negocio de ventas.
