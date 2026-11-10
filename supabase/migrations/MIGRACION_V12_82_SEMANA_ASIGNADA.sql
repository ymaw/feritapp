-- FeritApp V12.82
-- Separa la fecha real de la venta de su semana operativa asignada.
-- No modifica datos existentes ni políticas RLS.
ALTER TABLE public.sales
  ADD COLUMN IF NOT EXISTS semana_asignada date NULL;

COMMENT ON COLUMN public.sales.semana_asignada IS
  'Semana operativa asignada manualmente. NULL significa usar la semana derivada de fecha. No reemplaza la fecha real de la venta.';
