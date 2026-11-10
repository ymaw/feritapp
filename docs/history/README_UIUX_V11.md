# FeritApp UI/UX V11

## Pendientes expandibles en Dashboard

V11 parte de V10 y conserva sus cambios. Se mejora la sección **Lo que requiere tu atención**:

- **Por cobrar** ahora aparece como una tarjeta cerrada y expandible.
- Al tocar la tarjeta se despliega **Quiénes deben**, mostrando hasta 5 ventas con cliente, artículo y monto.
- Si hay más, se indica cuántas quedan y se mantiene el acceso a **Ver todas las ventas pendientes**.
- **Entregas** también es expandible y muestra hasta 5 personas, cantidad de artículos y estado de cobro.
- Los botones **Ver todas...** siguen llevando a la sección Ventas correspondiente.
- Se agregan estados ARIA (`aria-expanded`) y foco visible para teclado.
- En móvil se mantiene compacto y sin scroll horizontal.

## No modificado

- No se toca el repositorio original.
- No se modifican Supabase, RLS ni autenticación.
- No se integra Chart.js todavía: queda reservado para el merge posterior con los archivos del otro agente.
- Se conserva el flujo de avatar, branding, V9 responsive sales y V10 dashboard/action bar.
