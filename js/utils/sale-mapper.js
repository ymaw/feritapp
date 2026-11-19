// Convierte una fila persistida de Supabase al modelo de venta utilizado por FeritApp.
export function mapRowToSale(row) {
  return {
    id: row.id,
    fecha: row.fecha,
    semana_asignada: row.semana_asignada || null,
    cliente: row.cliente,
    articulo: row.articulo,
    precio: Number(row.precio),
    pagado: row.pagado,
    retira: row.retira,
    tercero: row.tercero || '',
    categoria: row.categoria || 'Sin categoría',
    entregado: !!row.entregado,
    entregado_en: row.entregado_en || null
  };
}
