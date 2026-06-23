import type { CashSession, Sale } from './types'

export interface SessionSummary {
  saleCount: number
  totalRevenue: number
  efectivo: number
  tarjeta: number
  transferencia: number
  expectedCash: number
}

export function summarizeCashSession(session: CashSession, sales: Sale[]): SessionSummary {
  const active = sales.filter(
    (s) => s.cashSessionId === session.id && s.status === 'completed',
  )
  let efectivo = 0
  let tarjeta = 0
  let transferencia = 0
  for (const s of active) {
    if (s.paymentMethod === 'efectivo') efectivo += s.total
    else if (s.paymentMethod === 'tarjeta') tarjeta += s.total
    else if (s.paymentMethod === 'transferencia') transferencia += s.total
  }
  const totalRevenue = efectivo + tarjeta + transferencia
  return {
    saleCount: active.length,
    totalRevenue,
    efectivo,
    tarjeta,
    transferencia,
    expectedCash: session.openingCash + efectivo,
  }
}

export function activeSales(sales: Sale[]): Sale[] {
  return sales.filter((s) => s.status !== 'voided')
}
