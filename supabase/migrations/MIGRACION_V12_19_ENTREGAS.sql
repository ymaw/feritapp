-- FeritApp V12.19 — estado de entrega independiente del estado de cobro.
-- Ejecutar en Supabase SQL Editor antes de usar los botones de Entregas.
-- No cambia ni reinicia el campo pagado.
ALTER TABLE public.sales
  ADD COLUMN IF NOT EXISTS entregado boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN public.sales.entregado IS
  'Indica si el artículo/registro de venta fue entregado. Independiente de sales.pagado.';
