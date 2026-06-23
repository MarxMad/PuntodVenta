// Cálculos de venta (subtotal, descuentos, total)

import type { SaleItem } from './types'

export function lineGross(item: SaleItem): number {
  return item.price * item.qty
}

export function lineNet(item: SaleItem): number {
  return Math.max(0, lineGross(item) - (item.lineDiscount ?? 0))
}

export function cartSubtotal(items: SaleItem[]): number {
  return items.reduce((s, i) => s + lineNet(i), 0)
}

export function cartTotal(items: SaleItem[], cartDiscount: number): number {
  return Math.max(0, cartSubtotal(items) - Math.max(0, cartDiscount))
}

export function parseMoneyInput(raw: string): number {
  const n = Number(raw.replace(/,/g, '.'))
  return Number.isFinite(n) && n >= 0 ? Math.round(n * 100) / 100 : 0
}
