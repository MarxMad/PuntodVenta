import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { db } from '../../lib/db'
import type { Product, Sale } from '../../lib/types'
import { ADMIN_BASE } from '../../config'
import { formatMoney, formatDateTime, isToday } from '../../lib/format'
import { Spinner } from './Products'
import { C, font, gradient, shadow } from '../../theme'
import { CategoryIcon, Icon, type IconName } from '../../components/Icon'

const LOW_STOCK = 5

export default function Dashboard() {
  const [products, setProducts] = useState<Product[]>([])
  const [sales, setSales] = useState<Sale[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([db.listProducts(), db.listSales()])
      .then(([p, s]) => { setProducts(p); setSales(s) })
      .finally(() => setLoading(false))
  }, [])

  const stats = useMemo(() => {
    const today = sales.filter((s) => isToday(s.createdAt) && s.status !== 'voided')
    return {
      salesToday: today.reduce((s, x) => s + x.total, 0),
      salesTodayCount: today.length,
      invValue: products.reduce((s, p) => s + p.cost * p.stock, 0),
      activeProducts: products.filter((p) => p.active).length,
      lowStock: products.filter((p) => p.stock <= LOW_STOCK),
    }
  }, [products, sales])

  if (loading) return <Spinner />

  return (
    <div className="cap-fade">
      <div className="cap-grid-4" style={{ marginBottom: 24 }}>
        <Card title="Ventas de hoy" value={formatMoney(stats.salesToday)} sub={`${stats.salesTodayCount} ventas registradas`} />
        <Card title="Valor del inventario" value={formatMoney(stats.invValue)} sub={`${products.reduce((s, p) => s + p.stock, 0)} piezas en stock`} />
        <Card title="Productos activos" value={String(stats.activeProducts)} sub="visibles en el catálogo" />
        <Card title="Stock bajo" value={String(stats.lowStock.length)} sub="necesitan reposición" accent={stats.lowStock.length > 0 ? C.amber : undefined} />
      </div>

      <div className="cap-grid-2">
        {/* Últimas ventas */}
        <Panel title="Últimas ventas" action={<Link to={`${ADMIN_BASE}/ventas`} style={linkStyle}>Ir al punto de venta →</Link>}>
          {sales.length === 0 ? (
            <Empty text="Aún no registras ventas." />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {sales.slice(0, 6).map((s) => (
                <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 10, background: C.bg, borderRadius: 12, padding: '10px 13px' }}>
                  <div style={{ width: 34, height: 34, borderRadius: 10, background: gradient.card, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Icon name="receipt" size={18} color={C.pinkSoft} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: 14, color: C.text }}>{s.items.reduce((a, i) => a + i.qty, 0)} artículos · {s.paymentMethod}{s.status === 'voided' ? ' · cancelada' : ''}</div>
                    <div style={{ fontSize: 12, color: C.muted }}>{formatDateTime(s.createdAt)}</div>
                  </div>
                  <div style={{ fontWeight: 700, color: C.pinkDeep }}>{formatMoney(s.total)}</div>
                </div>
              ))}
            </div>
          )}
        </Panel>

        {/* Stock bajo */}
        <Panel title="Reponer pronto" action={<Link to={`${ADMIN_BASE}/inventario`} style={linkStyle}>Ver inventario →</Link>}>
          {stats.lowStock.length === 0 ? (
            <Empty text="Todo tu stock está sano" icon="leaf" />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {stats.lowStock.slice(0, 7).map((p) => (
                <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <CategoryIcon categoryId={p.category} size={18} color={C.pinkSoft} />
                  <span style={{ flex: 1, fontWeight: 700, fontSize: 14, color: C.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</span>
                  <span style={{ fontSize: 12.5, fontWeight: 700, color: p.stock === 0 ? C.red : C.amber, background: p.stock === 0 ? '#FDECEF' : '#FFF4E2', padding: '4px 10px', borderRadius: 999 }}>{p.stock} pzs</span>
                </div>
              ))}
            </div>
          )}
        </Panel>
      </div>
    </div>
  )
}

function Card({ title, value, sub, accent }: { title: string; value: string; sub: string; accent?: string }) {
  return (
    <div style={{ background: gradient.card, borderRadius: 20, padding: '20px 22px', boxShadow: shadow.card }}>
      <div style={{ fontSize: 13, fontWeight: 700, color: C.pinkSoft }}>{title}</div>
      <div style={{ fontFamily: font.display, fontWeight: 700, fontSize: 30, color: accent ?? C.pinkDeep, marginTop: 6 }}>{value}</div>
      <div style={{ fontSize: 12.5, color: '#B48799', fontWeight: 600, marginTop: 2 }}>{sub}</div>
    </div>
  )
}

function Panel({ title, action, children }: { title: string; action?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div style={{ background: C.white, borderRadius: 20, border: `1px solid ${C.border}`, boxShadow: shadow.sm, padding: 20 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <div style={{ fontWeight: 700, fontSize: 16, color: C.text }}>{title}</div>
        {action}
      </div>
      {children}
    </div>
  )
}

function Empty({ text, icon }: { text: string; icon?: IconName }) {
  return (
    <div style={{ color: C.muted, fontSize: 14, textAlign: 'center', padding: '24px 0', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
      {icon && <Icon name={icon} size={28} color={C.pinkSoft} style={{ opacity: 0.85 }} />}
      {text}
    </div>
  )
}

const linkStyle: React.CSSProperties = { fontSize: 13, fontWeight: 700, color: C.pinkSoft }
