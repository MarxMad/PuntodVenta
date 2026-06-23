import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { db } from '../../lib/db'
import type { Product, Sale } from '../../lib/types'
import { aggregateProductSales, defaultRestockList, topSellers } from '../../lib/salesStats'
import { type ReportPeriod } from '../../lib/reports'
import { ADMIN_BASE } from '../../config'
import { formatMoney } from '../../lib/format'
import { Spinner } from './Products'
import { C, gradient, shadow } from '../../theme'
import { CategoryIcon, IconText } from '../../components/Icon'

const PERIODS: { id: ReportPeriod; label: string }[] = [
  { id: 'week', label: '7 días' },
  { id: 'month', label: 'Este mes' },
  { id: 'year', label: 'Este año' },
  { id: 'all', label: 'Todo' },
]

export default function Restock() {
  const nav = useNavigate()
  const [products, setProducts] = useState<Product[]>([])
  const [sales, setSales] = useState<Sale[]>([])
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState<ReportPeriod>('month')
  const [pick, setPick] = useState<Record<string, number>>({})

  useEffect(() => {
    Promise.all([db.listProducts(), db.listSales()])
      .then(([p, s]) => { setProducts(p); setSales(s) })
      .finally(() => setLoading(false))
  }, [])

  const stats = useMemo(
    () => aggregateProductSales(sales, products, period),
    [sales, products, period],
  )

  const leaders = useMemo(() => topSellers(stats, 8), [stats])
  const maxUnits = leaders[0]?.unitsSold ?? 1

  useEffect(() => {
    setPick(defaultRestockList(stats))
  }, [stats])

  const picked = useMemo(
    () => Object.entries(pick).filter(([, q]) => q > 0),
    [pick],
  )

  function setQty(id: string, qty: number) {
    setPick((m) => {
      const next = { ...m, [id]: Math.max(0, qty) }
      if (next[id] === 0) delete next[id]
      return next
    })
  }

  function toggle(id: string, suggested: number) {
    setPick((m) => {
      if (m[id] && m[id] > 0) {
        const next = { ...m }
        delete next[id]
        return next
      }
      return { ...m, [id]: suggested || 1 }
    })
  }

  function printList() {
    const lines = picked.map(([id, qty]) => {
      const s = stats.find((x) => x.productId === id)!
      return `${s.name} · ${s.sku} · pedir ${qty} pzs (stock ${s.stock}, vendidos ${s.unitsSold})`
    })
    const w = window.open('', '_blank', 'width=480,height=640')
    if (!w) return
    const periodLabel = PERIODS.find((p) => p.id === period)?.label ?? period
    w.document.write(`<!DOCTYPE html><html lang="es"><head><meta charset="utf-8"><title>Lista de resurtido</title>
      <style>body{font-family:system-ui,sans-serif;padding:24px;color:#333}h1{font-size:18px}ul{padding-left:18px}li{margin:8px 0;font-size:14px}.meta{color:#666;font-size:13px;margin-bottom:20px}</style></head><body>
      <h1>Caprichitos · Lista de resurtido</h1>
      <div class="meta">Periodo: ${periodLabel} · ${picked.length} productos · ${new Date().toLocaleDateString('es-MX')}</div>
      <ul>${lines.map((l) => `<li>${l}</li>`).join('')}</ul>
      </body></html>`)
    w.document.close()
    w.print()
  }

  function createOrder() {
    if (picked.length === 0) return
    nav(`${ADMIN_BASE}/pedidos`, { state: { openNew: true, items: Object.fromEntries(picked) } })
  }

  if (loading) return <Spinner />

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
            }}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* Lo más vendido */}
      <div style={{ background: C.white, borderRadius: 20, border: `1px solid ${C.border}`, boxShadow: shadow.sm, padding: 22, marginBottom: 20 }}>
        <div style={{ fontWeight: 700, fontSize: 16, color: C.text, marginBottom: 4 }}>Lo más vendido</div>
        <div style={{ fontSize: 13, color: C.muted, marginBottom: 18 }}>Ranking por piezas vendidas en el periodo</div>

        {leaders.length === 0 ? (
          <div style={{ textAlign: 'center', color: C.muted, padding: '24px 0', fontSize: 14 }}>
            Aún no hay ventas en este periodo.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {leaders.map((s, i) => {
              const pct = Math.round((s.unitsSold / maxUnits) * 100)
              return (
                <div key={s.productId}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 5 }}>
                    <span style={{ width: 22, fontWeight: 800, fontSize: 13, color: i < 3 ? C.pinkDeep : C.muted }}>#{i + 1}</span>
                    <CategoryIcon categoryId={s.category} size={18} color={C.pinkSoft} />
                    <span style={{ flex: 1, fontWeight: 700, fontSize: 14, color: C.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.name}</span>
                    <span style={{ fontWeight: 700, fontSize: 14, color: C.pinkDeep }}>{s.unitsSold} pzs</span>
                    <span style={{ fontSize: 12.5, color: C.muted, minWidth: 72, textAlign: 'right' }}>{formatMoney(s.revenue)}</span>
                  </div>
                  <div style={{ marginLeft: 32, height: 8, background: C.bg, borderRadius: 999, overflow: 'hidden' }}>
                    <div style={{ width: `${pct}%`, height: '100%', background: gradient.brand, borderRadius: 999, transition: 'width .3s' }} />
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Lista de resurtido */}
      <div style={{ background: C.white, borderRadius: 20, border: `1px solid ${C.border}`, boxShadow: shadow.card, padding: 22 }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-start', gap: 12, marginBottom: 16 }}>
          <div style={{ flex: 1, minWidth: 200 }}>
            <div style={{ fontWeight: 700, fontSize: 16, color: C.text }}>Lista de pedido (resurtido)</div>
            <div style={{ fontSize: 13, color: C.muted, marginTop: 2 }}>
              Basada en lo vendido y el stock actual. Ajusta cantidades y créala como pedido a proveedor.
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button
              onClick={printList}
              disabled={picked.length === 0}
              style={{ padding: '10px 16px', borderRadius: 12, fontWeight: 700, fontSize: 13.5, border: `1px solid ${C.border}`, background: C.white, color: C.pinkSoft }}
            >
              <IconText icon="printer" size={15} color={C.pinkSoft}>Imprimir lista</IconText>
            </button>
            <button
              onClick={createOrder}
              disabled={picked.length === 0}
              style={{ padding: '10px 16px', borderRadius: 12, fontWeight: 700, fontSize: 13.5, border: 'none', background: gradient.brand, color: '#fff', boxShadow: shadow.btn }}
            >
              Crear pedido ({picked.length})
            </button>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {stats.filter((s) => s.unitsSold > 0).map((s) => {
            const checked = (pick[s.productId] ?? 0) > 0
            const low = s.stock <= 5
            return (
              <div
                key={s.productId}
                style={{
                  display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap',
                  background: checked ? '#FFF8FB' : C.bg, border: `1px solid ${checked ? C.pink : C.border}`,
                  borderRadius: 14, padding: '11px 14px',
                }}
              >
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => toggle(s.productId, s.suggestedQty)}
                  style={{ width: 18, height: 18, accentColor: C.pink, flex: 'none' }}
                />
                <CategoryIcon categoryId={s.category} size={20} color={C.pinkSoft} style={{ flex: 'none' }} />
                <div style={{ flex: '1 1 140px', minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: 14, color: C.text }}>{s.name}</div>
                  <div style={{ fontSize: 12, color: C.muted }}>
                    Vendidos: <b>{s.unitsSold}</b> · Stock: <b style={{ color: low ? C.amber : C.text }}>{s.stock}</b>
                    {s.suggestedQty > 0 && <span> · Sugerido: {s.suggestedQty}</span>}
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: C.muted }}>Pedir</span>
                  <button onClick={() => setQty(s.productId, (pick[s.productId] ?? 0) - 1)} style={stepBtn}>−</button>
                  <input
                    type="number"
                    min={0}
                    value={pick[s.productId] ?? 0}
                    onChange={(e) => setQty(s.productId, Number(e.target.value))}
                    style={{ width: 52, textAlign: 'center', border: `1px solid ${C.borderSoft}`, borderRadius: 10, padding: '7px 4px', fontWeight: 700, fontSize: 14, outline: 'none' }}
                  />
                  <button onClick={() => setQty(s.productId, (pick[s.productId] ?? 0) + 1)} style={stepBtn}>+</button>
                </div>
              </div>
            )
          })}
          {stats.every((s) => s.unitsSold === 0) && (
            <div style={{ textAlign: 'center', color: C.muted, padding: 32, fontSize: 14 }}>
              No hay ventas en este periodo para sugerir resurtido.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

const stepBtn: React.CSSProperties = {
  width: 32, height: 32, borderRadius: 9, border: `1px solid ${C.border}`, background: C.white,
  color: C.pinkDeep, fontWeight: 700, fontSize: 16,
}
