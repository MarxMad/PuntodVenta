import { useEffect, useMemo, useState } from 'react'
import { db } from '../../lib/db'
import type { Product } from '../../lib/types'
import { categoryById } from '../../lib/categories'
import { formatMoney } from '../../lib/format'
import { useToast } from '../../components/Toast'
import { SearchBar, Spinner } from './Products'
import { C, font, gradient, shadow } from '../../theme'

const LOW_STOCK = 5

export default function Inventory() {
  const toast = useToast()
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [onlyLow, setOnlyLow] = useState(false)

  async function load() {
    setLoading(true)
    setProducts(await db.listProducts())
    setLoading(false)
  }
  useEffect(() => { load() }, [])

  async function adjust(p: Product, delta: number) {
    await db.adjustStock(p.id, delta)
    setProducts((list) => list.map((x) => (x.id === p.id ? { ...x, stock: Math.max(0, x.stock + delta) } : x)))
  }
  async function setExact(p: Product, value: number) {
    const v = Math.max(0, Math.floor(value))
    await db.updateProduct(p.id, { stock: v })
    setProducts((list) => list.map((x) => (x.id === p.id ? { ...x, stock: v } : x)))
  }

  const stats = useMemo(() => ({
    value: products.reduce((s, p) => s + p.cost * p.stock, 0),
    units: products.reduce((s, p) => s + p.stock, 0),
    low: products.filter((p) => p.stock <= LOW_STOCK).length,
  }), [products])

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase()
    return products.filter((p) => {
      if (onlyLow && p.stock > LOW_STOCK) return false
      return !q || p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q)
    })
  }, [products, search, onlyLow])

  if (loading) return <Spinner />

  return (
    <div className="cap-fade">
      <div className="cap-grid-3" style={{ marginBottom: 20 }}>
        <Stat label="Valor del inventario" value={formatMoney(stats.value)} />
        <Stat label="Piezas en stock" value={String(stats.units)} />
        <Stat label="Productos con stock bajo" value={String(stats.low)} accent={stats.low > 0 ? C.amber : undefined} />
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
        <SearchBar value={search} onChange={setSearch} />
        <button
          onClick={() => setOnlyLow((v) => !v)}
          style={{ marginBottom: 16, padding: '10px 15px', borderRadius: 12, fontWeight: 700, fontSize: 13.5, border: `1px solid ${onlyLow ? 'transparent' : C.border}`, background: onlyLow ? C.amber : C.white, color: onlyLow ? '#fff' : C.pinkSoft }}
        >
          ⚠️ Solo stock bajo
        </button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {visible.map((p) => {
          const cat = categoryById(p.category)
          const low = p.stock <= LOW_STOCK
          return (
            <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 14, background: C.white, border: `1px solid ${low ? '#F6E2BE' : C.border}`, borderRadius: 16, padding: '12px 16px', boxShadow: shadow.sm }}>
              <div style={{ width: 46, height: 46, flex: 'none', borderRadius: 12, background: p.imageUrl ? `url(${p.imageUrl}) center/cover` : gradient.card, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 }}>
                {!p.imageUrl && (cat?.emoji ?? '🎀')}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 700, fontSize: 15, color: C.text }}>{p.name}</div>
                <div style={{ fontSize: 12.5, color: C.muted }}><span style={{ fontFamily: 'monospace', color: C.pinkSoft }}>{p.sku}</span> · {cat?.label}</div>
              </div>
              {low && <span style={{ fontSize: 12, fontWeight: 700, color: C.amber, background: '#FFF4E2', padding: '5px 10px', borderRadius: 999 }}>Stock bajo</span>}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <button onClick={() => adjust(p, -1)} style={stepBtn}>−</button>
                <input
                  type="number"
                  value={p.stock}
                  onChange={(e) => setExact(p, Number(e.target.value))}
                  style={{ width: 60, textAlign: 'center', border: `1px solid ${C.borderSoft}`, borderRadius: 10, padding: '8px 4px', fontWeight: 700, fontSize: 15, color: C.text, outline: 'none' }}
                />
                <button onClick={() => adjust(p, 1)} style={stepBtn}>+</button>
              </div>
            </div>
          )
        })}
        {visible.length === 0 && <div style={{ textAlign: 'center', color: C.muted, padding: 40 }}>Sin resultados.</div>}
      </div>
    </div>
  )
}

function Stat({ label, value, accent }: { label: string; value: string; accent?: string }) {
  return (
    <div style={{ background: gradient.card, borderRadius: 20, padding: '18px 20px', boxShadow: shadow.card }}>
      <div style={{ fontSize: 13, fontWeight: 700, color: C.pinkSoft }}>{label}</div>
      <div style={{ fontFamily: font.display, fontWeight: 700, fontSize: 26, color: accent ?? C.pinkDeep, marginTop: 4 }}>{value}</div>
    </div>
  )
}

const stepBtn: React.CSSProperties = {
  width: 36, height: 36, borderRadius: 11, border: `1px solid ${C.border}`, background: C.white,
  color: C.pinkDeep, fontWeight: 700, fontSize: 18, display: 'flex', alignItems: 'center', justifyContent: 'center',
}
