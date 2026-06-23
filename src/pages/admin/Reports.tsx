import { useEffect, useMemo, useState } from 'react'
import { db } from '../../lib/db'
import type { Collection, Product, Sale } from '../../lib/types'
import { computeIncomeStatement, type ReportPeriod } from '../../lib/reports'
import { formatMoney, formatDate } from '../../lib/format'
import { printLabelSheet } from '../../lib/print'
import { Spinner } from './Products'
import { C, font, gradient, shadow } from '../../theme'
import { CategoryIcon, IconText } from '../../components/Icon'

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
  const [qrSearch, setQrSearch] = useState('')
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [printing, setPrinting] = useState(false)

  useEffect(() => {
    Promise.all([db.listProducts(), db.listSales(), db.listCollections()])
      .then(([p, s, c]) => {
        setProducts(p)
        setSales(s)
        setCollections(c)
        setSelected(new Set(p.map((x) => x.id)))
      })
      .finally(() => setLoading(false))
  }, [])

  const report = useMemo(
    () => computeIncomeStatement(sales, products, collections, period),
    [sales, products, collections, period],
  )

  const filteredProducts = useMemo(() => {
    const q = qrSearch.trim().toLowerCase()
    if (!q) return products
    return products.filter((p) => p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q))
  }, [products, qrSearch])

  const selectedProducts = useMemo(
    () => products.filter((p) => selected.has(p.id)),
    [products, selected],
  )

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function selectAll() {
    setSelected(new Set(filteredProducts.map((p) => p.id)))
  }

  function selectNone() {
    setSelected((prev) => {
      const next = new Set(prev)
      for (const p of filteredProducts) next.delete(p.id)
      return next
    })
  }

  async function printQrSheet() {
    if (selectedProducts.length === 0) return
    setPrinting(true)
    try {
      await printLabelSheet(selectedProducts)
    } finally {
      setPrinting(false)
    }
  }

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
          style={{ marginLeft: 'auto', padding: '9px 16px', borderRadius: 12, fontWeight: 700, fontSize: 13.5, border: `1px solid ${C.border}`, background: C.white, color: C.pinkSoft, display: 'inline-flex', alignItems: 'center', gap: 7 }}
        >
          <IconText icon="printer" size={15} color={C.pinkSoft}>Imprimir</IconText>
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

      <div style={{ fontSize: 13, color: C.muted, background: C.bg, borderRadius: 14, padding: '14px 16px', lineHeight: 1.5, marginBottom: 28 }}>
        <b>Nota:</b> el costo de mercancía se calcula con el costo actual de cada producto.
        Si cambias el costo después de vender, el reporte histórico puede variar ligeramente.
      </div>

      {/* Etiquetas QR en hoja */}
      <div style={{ background: C.white, borderRadius: 22, border: `1px solid ${C.border}`, boxShadow: shadow.card, padding: 24 }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-start', gap: 12, marginBottom: 16 }}>
          <div style={{ flex: 1, minWidth: 200 }}>
            <div style={{ fontWeight: 700, fontSize: 16, color: C.text }}>Etiquetas QR en hoja</div>
            <div style={{ fontSize: 13, color: C.muted, marginTop: 4 }}>
              Imprime todos los códigos juntos, 4 por fila, listos para recortar y pegar.
            </div>
          </div>
          <button
            onClick={printQrSheet}
            disabled={printing || selectedProducts.length === 0}
            style={{
              padding: '11px 18px', borderRadius: 13, fontWeight: 700, fontSize: 14,
              border: 'none', background: gradient.brand, color: '#fff', boxShadow: shadow.btn,
              opacity: selectedProducts.length === 0 ? 0.55 : 1,
              display: 'inline-flex', alignItems: 'center', gap: 8,
            }}
          >
            {printing ? 'Preparando…' : (
              <IconText icon="printer" size={16} color="#fff">
                {`Imprimir ${selectedProducts.length} etiqueta${selectedProducts.length === 1 ? '' : 's'}`}
              </IconText>
            )}
          </button>
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'center', marginBottom: 14 }}>
          <input
            value={qrSearch}
            onChange={(e) => setQrSearch(e.target.value)}
            placeholder="Buscar producto o SKU…"
            style={{ flex: '1 1 200px', border: `1px solid ${C.borderSoft}`, borderRadius: 12, padding: '10px 14px', fontSize: 14, outline: 'none' }}
          />
          <button onClick={selectAll} style={chipBtn}>Seleccionar todos</button>
          <button onClick={selectNone} style={chipBtn}>Quitar selección</button>
        </div>

        {products.length === 0 ? (
          <div style={{ textAlign: 'center', color: C.muted, padding: '32px 0', fontSize: 14 }}>
            Aún no hay productos. Da de alta productos para imprimir sus QR.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 420, overflowY: 'auto' }}>
            {filteredProducts.map((p) => {
              const checked = selected.has(p.id)
              return (
                <label
                  key={p.id}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer',
                    background: checked ? '#FFF8FB' : C.bg, border: `1px solid ${checked ? C.pink : C.border}`,
                    borderRadius: 14, padding: '10px 14px',
                  }}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggle(p.id)}
                    style={{ width: 18, height: 18, accentColor: C.pink, flex: 'none' }}
                  />
                  <CategoryIcon categoryId={p.category} size={20} color={C.pinkSoft} style={{ flex: 'none' }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: 14, color: C.text }}>{p.name}</div>
                    <div style={{ fontSize: 12, color: C.muted, fontFamily: 'monospace' }}>{p.sku}</div>
                  </div>
                  <div style={{ fontWeight: 700, color: C.pinkDeep, fontSize: 14, flex: 'none' }}>{formatMoney(p.price)}</div>
                </label>
              )
            })}
            {filteredProducts.length === 0 && (
              <div style={{ textAlign: 'center', color: C.muted, padding: 24 }}>Sin resultados.</div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

const chipBtn: React.CSSProperties = {
  padding: '9px 14px', borderRadius: 12, fontWeight: 700, fontSize: 13,
  border: `1px solid ${C.border}`, background: C.white, color: C.pinkSoft,
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
