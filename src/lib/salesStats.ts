import type { Product, Sale } from './types'
import { inRange, periodRange, type ReportPeriod } from './reports'

export interface ProductSalesStat {
  productId: string
  sku: string
  name: string
  category: string
  stock: number
  unitsSold: number
  revenue: number
  /** Veces que apareció en una venta del periodo */
  saleCount: number
  /** Cantidad sugerida para resurtir */
  suggestedQty: number
}

/** Agrupa ventas por producto y calcula cantidades sugeridas de resurtido. */
export function aggregateProductSales(
  sales: Sale[],
  products: Product[],
  period: ReportPeriod,
  now = new Date(),
): ProductSalesStat[] {
  const { from, to } = periodRange(period, now)
  const agg = new Map<string, { units: number; revenue: number; tx: number }>()

  for (const sale of sales) {
    if (!inRange(sale.createdAt, from, to)) continue
    const seen = new Set<string>()
    for (const item of sale.items) {
      const key = item.productId || item.sku.toLowerCase()
      const cur = agg.get(key) ?? { units: 0, revenue: 0, tx: 0 }
      cur.units += item.qty
      cur.revenue += item.price * item.qty
      if (!seen.has(key)) {
        cur.tx++
        seen.add(key)
      }
      agg.set(key, cur)
    }
  }

  return products
    .map((p) => {
      const data = agg.get(p.id) ?? agg.get(p.sku.toLowerCase()) ?? { units: 0, revenue: 0, tx: 0 }
      // Lo vendido menos lo que queda; si sigue bajo, sugerir al menos lo vendido
      let suggested = Math.max(0, data.units - p.stock)
      if (data.units > 0 && p.stock <= 5) {
        suggested = Math.max(suggested, data.units)
      }
      return {
        productId: p.id,
        sku: p.sku,
        name: p.name,
        category: p.category,
        stock: p.stock,
        unitsSold: data.units,
        revenue: data.revenue,
        saleCount: data.tx,
        suggestedQty: suggested,
      }
    })
    .sort((a, b) => b.unitsSold - a.unitsSold)
}

/** Productos con ventas en el periodo (para ranking). */
export function topSellers(stats: ProductSalesStat[], limit = 10): ProductSalesStat[] {
  return stats.filter((s) => s.unitsSold > 0).slice(0, limit)
}

/** Lista inicial de resurtido: vendidos en el periodo con cantidad sugerida > 0. */
export function defaultRestockList(stats: ProductSalesStat[]): Record<string, number> {
  const list: Record<string, number> = {}
  for (const s of stats) {
    if (s.unitsSold > 0 && s.suggestedQty > 0) {
      list[s.productId] = s.suggestedQty
    }
  }
  return list
}
