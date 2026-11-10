# FeritApp V12.22 — nuevo logo transparente

Se reemplazaron los recursos de marca por el logo circular de intercambio de prendas entregado para esta versión, preservando su canal alfa (fondo transparente).

Archivos actualizados:
- `feritapp-icon.png`: marca dentro de la app y fallback visual.
- `icon-192.png` y `icon-512.png`: iconos de instalación PWA referenciados por `manifest.json`.
- `apple-touch-icon.png`: icono para iOS.
- `favicon-32.png`: favicon.
- `feritapp-receipt-logo.png`: logo en comprobantes y recursos compartidos.

No se modificó el repositorio remoto ni se aplicaron cambios a Supabase. Para comprobar el icono instalado, hay que volver a desplegar esta versión y, si el navegador conserva el icono anterior, actualizar/reinstalar la PWA o limpiar su caché.
