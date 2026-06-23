import type { Collection, Product, Sale } from './types'

export type ReportPeriod = 'today' | 'week' | 'month' | 'year' | 'all'

export interface IncomeStatement {
  periodLabel: string
  from: Date
  to: Date
  saleCount: number
  unitsSold: number
  revenue: number
  cogs: number
  grossProfit: number
  grossMargin: number
  machineIncome: number
  totalIncome: number
  inventoryValue: number
  inventoryUnits: number
}

function startOfDay(d: Date): Date {
  const x = new Date(d)
  x.setHours(0, 0, 0, 0)
  return x
}

function endOfDay(d: Date): Date {
  const x = new Date(d)
  x.setHours(23, 59, 59, 999)
  return x
}

export function periodRange(period: ReportPeriod, now = new Date()): { from: Date; to: Date; label: string } {
  const to = endOfDay(now)
  if (period === 'all') {
    return { from: new Date(0), to, label: 'Todo el historial' }
  }
  if (period === 'today') {
    return { from: startOfDay(now), to, label: 'Hoy' }
  }
  if (period === 'week') {
    const from = startOfDay(now)
    from.setDate(from.getDate() - 6)
    return { from, to, label: 'Últimos 7 días' }
  }
  if (period === 'month') {
    const from = startOfDay(new Date(now.getFullYear(), now.getMonth(), 1))
    return { from, to, label: 'Este mes' }
  }
  const from = startOfDay(new Date(now.getFullYear(), 0, 1))
  return { from, to, label: 'Este año' }
}

function inRange(iso: string, from: Date, to: Date): boolean {
  const d = new Date(iso)
  return d >= from && d <= to
}

export { inRange }

/** Calcula ingresos, costo de mercancía vendida y utilidad bruta del periodo. */
export function computeIncomeStatement(
  sales: Sale[],
  products: Product[],
  collections: Collection[],
  period: ReportPeriod,
  now = new Date(),
): IncomeStatement {
  const { from, to, label } = periodRange(period, now)
  const costById = new Map(products.map((p) => [p.id, p.cost]))
  const costBySku = new Map(products.map((p) => [p.sku.toLowerCase(), p.cost]))

  let revenue = 0
  let cogs = 0
  let unitsSold = 0
  let saleCount = 0

  for (const sale of sales) {
    if (!inRange(sale.createdAt, from, to)) continue
    if (sale.status === 'voided') continue
    saleCount++
    revenue += sale.total
    for (const item of sale.items) {
      unitsSold += item.qty
      const cost = costById.get(item.productId) ?? costBySku.get(item.sku.toLowerCase()) ?? 0
      cogs += cost * item.qty
    }
  }

  const machineIncome = collections
    .filter((c) => inRange(c.collectedAt + 'T12:00:00', from, to))
    .reduce((s, c) => s + c.amount, 0)

  const grossProfit = revenue - cogs

  return {
    periodLabel: label,
    from,
    to,
    saleCount,
    unitsSold,
    revenue,
    cogs,
    grossProfit,
    grossMargin: revenue > 0 ? grossProfit / revenue : 0,
    machineIncome,
    totalIncome: revenue + machineIncome,
    inventoryValue: products.reduce((s, p) => s + p.cost * p.stock, 0),
    inventoryUnits: products.reduce((s, p) => s + p.stock, 0),
  }
}
