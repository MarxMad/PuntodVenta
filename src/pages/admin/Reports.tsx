import { useEffect, useMemo, useState } from 'react'
import { db } from '../../lib/db'
import type { Collection, Product, Sale } from '../../lib/types'
import { computeIncomeStatement, type ReportPeriod } from '../../lib/reports'
import { formatMoney, formatDate } from '../../lib/format'
import { Spinner } from './Products'
import { C, font, gradient, shadow } from '../../theme'

const PERIODS: { id: ReportPeriod; label: string }[] = [
  { id: 'today', label: 'Hoy' },
  { id: 'week', label: '7 días' },
  { id: 'month', label: 'Este mes' },
  { id: 'year', label: 'Este año' },
  { id: 'all', label: 'Todo' },
]

export default function Reports() {
  const [products, setProducts] = useState<Product[]>([])
  const [sales, setSales] = useState<Sale[]>([])
  const [collections, setCollections] = useState<Collection[]>([])
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState<ReportPeriod>('month')

  useEffect(() => {
    Promise.all([db.listProducts(), db.listSales(), db.listCollections()])
      .then(([p, s, c]) => { setProducts(p); setSales(s); setCollections(c) })
      .finally(() => setLoading(false))
  }, [])

  const report = useMemo(
    () => computeIncomeStatement(sales, products, collections, period),
    [sales, products, collections, period],
  )

  if (loading) return <Spinner />

  const marginPct = `${(report.grossMargin * 100).toFixed(1)}%`

  return (
    <div className="cap-fade">
      <div className="cap-no-print" style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 20, alignItems: 'center' }}>
        {PERIODS.map((p) => (
          <button
            key={p.id}
            onClick={() => setPeriod(p.id)}
            style={{
              padding: '9px 16px', borderRadius: 999, fontWeight: 700, fontSize: 13.5,
              border: `1px solid ${period === p.id ? 'transparent' : C.border}`,
              background: period === p.id ? gradient.brand : C.white,
              color: period === p.id ? '#fff' : C.pinkSoft,
              boxShadow: period === p.id ? shadow.btn : 'none',
            }}
          >
            {p.label}
          </button>
        ))}
        <button
          onClick={() => window.print()}
          style={{ marginLeft: 'auto', padding: '9px 16px', borderRadius: 12, fontWeight: 700, fontSize: 13.5, border: `1px solid ${C.border}`, background: C.white, color: C.pinkSoft }}
        >
          🖨️ Imprimir
        </button>
      </div>

      <div style={{ background: C.white, borderRadius: 22, border: `1px solid ${C.border}`, boxShadow: shadow.card, padding: 28, marginBottom: 20 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: C.pinkSoft, marginBottom: 4 }}>Estado de resultados</div>
        <div style={{ fontFamily: font.display, fontWeight: 700, fontSize: 26, color: C.text, marginBottom: 4 }}>{report.periodLabel}</div>
        <div style={{ fontSize: 13, color: C.muted, marginBottom: 24 }}>
          {period === 'all' ? 'Desde el inicio de los registros' : `${formatDate(report.from.toISOString())} — ${formatDate(report.to.toISOString())}`}
          {' · '}{report.saleCount} venta{report.saleCount === 1 ? '' : 's'} · {report.unitsSold} piezas vendidas
        </div>

        <StatementRow label="Ingresos por ventas en tienda" value={formatMoney(report.revenue)} bold />
        <StatementRow label="Costo de mercancía vendida" value={formatMoney(report.cogs)} muted />
        <StatementRow label="Utilidad bruta" value={formatMoney(report.grossProfit)} accent={report.grossProfit >= 0 ? C.green : C.red} bold divider />
        <StatementRow label="Margen bruto" value={marginPct} muted />

        {report.machineIncome > 0 && (
          <>
            <div style={{ height: 16 }} />
            <StatementRow label="Recolecciones de máquinas" value={formatMoney(report.machineIncome)} />
            <StatementRow label="Ingresos totales (tienda + máquinas)" value={formatMoney(report.totalIncome)} bold divider />
          </>
        )}
      </div>

      <div className="cap-grid-3" style={{ marginBottom: 20 }}>
        <Snapshot title="Inventario actual" value={formatMoney(report.inventoryValue)} sub={`${report.inventoryUnits} piezas en stock`} />
        <Snapshot title="Ticket promedio" value={formatMoney(report.saleCount ? report.revenue / report.saleCount : 0)} sub="por venta en el periodo" />
        <Snapshot title="Piezas por venta" value={report.saleCount ? (report.unitsSold / report.saleCount).toFixed(1) : '0'} sub="promedio en el periodo" />
      </div>

      <div style={{ fontSize: 13, color: C.muted, background: C.bg, borderRadius: 14, padding: '14px 16px', lineHeight: 1.5 }}>
        <b>Nota:</b> el costo de mercancía se calcula con el costo actual de cada producto.
        Si cambias el costo después de vender, el reporte histórico puede variar ligeramente.
        Para un margen exacto, registra el costo al momento de cada venta (mejora futura).
      </div>
    </div>
  )
}

function StatementRow({ label, value, bold, muted, accent, divider }: {
  label: string; value: string; bold?: boolean; muted?: boolean; accent?: string; divider?: boolean
}) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16,
      padding: '11px 0', borderTop: divider ? `1px solid ${C.border}` : 'none',
      marginTop: divider ? 8 : 0, paddingTop: divider ? 16 : 11,
    }}>
      <span style={{ fontSize: 14.5, fontWeight: bold ? 700 : 600, color: muted ? C.muted : C.text }}>{label}</span>
      <span style={{ fontFamily: font.display, fontWeight: 700, fontSize: bold ? 22 : 18, color: accent ?? (bold ? C.pinkDeep : C.text), whiteSpace: 'nowrap' }}>{value}</span>
    </div>
  )
}

function Snapshot({ title, value, sub }: { title: string; value: string; sub: string }) {
  return (
    <div style={{ background: gradient.card, borderRadius: 20, padding: '18px 20px', boxShadow: shadow.card }}>
      <div style={{ fontSize: 13, fontWeight: 700, color: C.pinkSoft }}>{title}</div>
      <div style={{ fontFamily: font.display, fontWeight: 700, fontSize: 26, color: C.pinkDeep, marginTop: 4 }}>{value}</div>
      <div style={{ fontSize: 12.5, color: '#B48799', fontWeight: 600, marginTop: 2 }}>{sub}</div>
    </div>
  )
}
