# feritApp UI/UX V8

## Alcance

V8 aplica el lenguaje visual de V7 a las cuatro áreas principales de uso:

- Dashboard
- Ventas
- Clientes
- Ranking

El cambio es principalmente visual. No se modificó la lógica de negocio, Supabase, RLS ni el flujo de autenticación.

## Avatar / foto de perfil

Se preservó el flujo de avatar de V7 sin reemplazarlo por otra implementación:

- `img-src` de la CSP permite el dominio de Supabase Storage.
- El upload usa `avatars/<user_id>/avatar.jpg`.
- Se comprueba el error de Storage.
- Se guarda la URL en `user_settings.avatar_url`.
- Se agrega cache-busting.
- `updateAvatarDisplay()` se mantiene como fuente común para perfil, saludo y resumen del Dashboard.
- Si la URL falla, se utiliza `feritapp-icon.png` como fallback.

## Cambios visuales

### Dashboard
- Hero de resumen.
- Tarjeta de resumen con avatar real.
- Métricas con mayor jerarquía.
- Gráfico de categorías dentro de una superficie dedicada.
- Comparación semanal/mensual más claramente delimitada.

### Ventas
- Hero de contexto.
- Selector Artículos / Para entregar más claro.
- Tablas con mayor aire y superficies.
- Semanas anteriores convertidas visualmente en tarjetas/accordions.

### Clientes
- Hero de contexto.
- Búsqueda tratada como acción principal.
- Listado de clientes con tarjetas más claras.
- Mejor separación de acciones editar/eliminar.

### Ranking
- Hero de contexto.
- Ranking en tarjetas con jerarquía por posición.
- Monto opcional como dato secundario.
- Botón de mostrar más de ancho completo en móvil.

## Integridad

Esta versión parte de V7 y no modifica el repositorio original.
