# feritApp UI/UX V7

## Objetivo
Rediseño específico de Configuración, manteniendo la funcionalidad existente y preservando el flujo de avatar que funciona en V6.

## Cambios
- Configuración reorganizada por importancia: Cuenta y experiencia / Ventas y comprobantes / Datos y seguridad.
- Mi Perfil, Apariencia y Notificaciones reciben mayor jerarquía visual.
- Cada panel de configuración incorpora encabezados internos, iconografía y tarjetas diferenciadas sin cambiar sus IDs ni controles existentes.
- Semana de ventas, Mensaje del comprobante y Copia de seguridad tienen bloques propios y más claros.
- Zona crítica mantiene tratamiento visual de riesgo y separación reforzada.
- Responsive mejorado para configuración en desktop y móvil.

## Avatar — preservado deliberadamente
No se modificó la lógica de avatar de V6.
- CSP permite `data:`, `blob:` y `https://tzajchnflgvdbmiwfyvj.supabase.co` en `img-src`.
- Upload usa `avatars/<user_id>/avatar.jpg`.
- Se comprueba `upRes.error`.
- Se obtiene `getPublicUrl()` y se agrega cache-busting.
- Se comprueba el error del `user_settings.upsert()`.
- `updateAvatarDisplay()` usa DOM y fallback a `feritapp-icon.png` si la imagen falla.
- La foto se sigue mostrando en Perfil, saludo y Resumen del Dashboard.

## No modificado
- Supabase/RLS.
- Lógica de negocio.
- Nombres de IDs usados por JavaScript.
- Repositorio original.

## Validación
- `node --check script.js` OK.
