import { useEffect, useMemo, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { db } from '../../lib/db'
import type { Order, OrderItem, Product } from '../../lib/types'
import { formatMoney, formatDate } from '../../lib/format'
import { useToast } from '../../components/Toast'
import { useResult } from '../../components/ResultModal'
import { Modal } from '../../components/Modal'
import { Spinner } from './Products'
import { C, font, gradient, shadow } from '../../theme'

const STATUS_META: Record<Order['status'], { label: string; color: string; bg: string }> = {
  pendiente: { label: 'Pendiente', color: C.amber, bg: '#FFF4E2' },
  en_camino: { label: 'En camino', color: C.blue, bg: '#E7F1FC' },
  recibido: { label: 'Recibido', color: C.green, bg: '#E8F7EF' },
}

export default function Orders() {
  const result = useResult()
  const location = useLocation()
  const [orders, setOrders] = useState<Order[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [initialItems, setInitialItems] = useState<Record<string, number>>({})

  async function load() {
    setLoading(true)
    const [o, p] = await Promise.all([db.listOrders(), db.listProducts()])
    setOrders(o)
    setProducts(p)
    setLoading(false)
  }
  useEffect(() => { load() }, [])

  useEffect(() => {
    const st = location.state as { openNew?: boolean; items?: Record<string, number> } | null
    if (st?.openNew) {
      setInitialItems(st.items ?? {})
      setCreating(true)
      window.history.replaceState({}, document.title)
    }
  }, [location.state])

  async function receive(o: Order) {
    if (!confirm(`¿Marcar el pedido a "${o.supplier}" como recibido? Se sumará el stock.`)) return
    try {
      await db.receiveOrder(o.id)
      load()
      result({ title: '¡Pedido recibido!', message: `Se sumó el stock del pedido a ${o.supplier}.` })
    } catch (err) {
      result({ kind: 'error', title: 'No se pudo recibir', message: err instanceof Error ? err.message : 'Inténtalo de nuevo.' })
    }
  }

  if (loading) return <Spinner />

  return (
    <div className="cap-fade">
      <button onClick={() => setCreating(true)} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: gradient.brand, color: '#fff', border: 'none', borderRadius: 13, padding: '11px 18px', fontWeight: 700, fontSize: 14, boxShadow: shadow.btn, marginBottom: 18 }}>
        + Nuevo pedido
      </button>

      {orders.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: C.muted }}>
          <div style={{ fontSize: 48 }}>📦</div>
          <div style={{ fontWeight: 700, fontSize: 17, color: C.text, marginTop: 10 }}>Sin pedidos todavía</div>
          <div style={{ fontSize: 14, marginTop: 4 }}>Crea un pedido a proveedor para reponer stock.</div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {orders.map((o) => {
            const meta = STATUS_META[o.status]
            const total = o.items.reduce((s, i) => s + i.cost * i.qty, 0)
            const units = o.items.reduce((s, i) => s + i.qty, 0)
            return (
              <div key={o.id} style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: 18, padding: '16px 20px', boxShadow: shadow.sm }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                  <div style={{ flex: 1, minWidth: 180 }}>
                    <div style={{ fontWeight: 700, fontSize: 16, color: C.text }}>{o.supplier}</div>
                    <div style={{ fontSize: 12.5, color: C.muted }}>{formatDate(o.createdAt)} · {units} piezas · {o.items.length} productos</div>
                  </div>
                  <span style={{ fontSize: 12.5, fontWeight: 700, color: meta.color, background: meta.bg, padding: '6px 12px', borderRadius: 999 }}>{meta.label}</span>
                  <div style={{ fontFamily: font.display, fontWeight: 700, fontSize: 18, color: C.pinkDeep, width: 100, textAlign: 'right' }}>{formatMoney(total)}</div>
                  {o.status !== 'recibido' && (
                    <button onClick={() => receive(o)} style={{ background: C.green, color: '#fff', border: 'none', borderRadius: 11, padding: '9px 14px', fontWeight: 700, fontSize: 13 }}>Marcar recibido</button>
                  )}
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 12 }}>
                  {o.items.map((i, idx) => (
                    <span key={idx} style={{ fontSize: 12.5, color: C.pinkSoft, background: C.bg, border: `1px solid ${C.border}`, borderRadius: 9, padding: '5px 10px' }}>
                      {i.name} ×{i.qty}
                    </span>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {creating && (
        <NewOrderModal
          products={products}
          initialItems={initialItems}
          onClose={() => { setCreating(false); setInitialItems({}) }}
          onSaved={() => { setCreating(false); setInitialItems({}); load() }}
        />
      )}
    </div>
  )
}

function NewOrderModal({ products, initialItems = {}, onClose, onSaved }: {
  products: Product[]; initialItems?: Record<string, number>; onClose: () => void; onSaved: () => void
}) {
  const toast = useToast()
  const result = useResult()
  const [supplier, setSupplier] = useState('')
  const [items, setItems] = useState<Record<string, number>>(initialItems)
  const [search, setSearch] = useState('')
  const [busy, setBusy] = useState(false)

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return products.slice(0, 8)
    return products.filter((p) => p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q)).slice(0, 8)
  }, [products, search])

  const chosen = useMemo(() => Object.entries(items).filter(([, q]) => q > 0), [items])

  function setQty(id: string, qty: number) {
    setItems((m) => ({ ...m, [id]: Math.max(0, qty) }))
  }

  async function save() {
    if (!supplier.trim()) return toast('Indica el nombre del proveedor.', 'error')
    if (chosen.length === 0) return toast('Agrega al menos un producto.', 'error')
    setBusy(true)
    try {
      const orderItems: OrderItem[] = chosen.map(([id, qty]) => {
        const p = products.find((x) => x.id === id)!
        return { sku: p.sku, name: p.name, qty, cost: p.cost }
      })
      await db.createOrder(supplier.trim(), orderItems)
      onSaved()
      result({ title: '¡Pedido creado!', message: `Pedido a ${supplier.trim()} con ${chosen.length} producto${chosen.length === 1 ? '' : 's'}.` })
    } catch (err) {
      result({ kind: 'error', title: 'No se pudo crear', message: err instanceof Error ? err.message : 'Inténtalo de nuevo.' })
    } finally {
      setBusy(false)
    }
  }

  return (
    <Modal
      wide
      title="Nuevo pedido"
      onClose={onClose}
      footer={(
        <>
          <button onClick={save} disabled={busy} style={{ background: gradient.brand, color: '#fff', border: 'none', borderRadius: 12, padding: '11px 22px', fontWeight: 700, boxShadow: shadow.btn, flex: 1, minWidth: 140 }}>
            {busy ? 'Creando…' : `Crear pedido (${chosen.length})`}
          </button>
          <button onClick={onClose} style={{ background: C.white, color: C.pinkSoft, border: `1px solid ${C.border}`, borderRadius: 12, padding: '11px 20px', fontWeight: 700, flex: 1, minWidth: 100 }}>Cancelar</button>
        </>
      )}
    >
      <label style={{ display: 'block', marginBottom: 16 }}>
        <span style={{ display: 'block', fontSize: 12.5, fontWeight: 700, color: C.pinkSoft, marginBottom: 5 }}>Proveedor</span>
        <input value={supplier} onChange={(e) => setSupplier(e.target.value)} placeholder="Nombre del proveedor" style={inputStyle} />
      </label>

      <div style={{ fontSize: 12.5, fontWeight: 700, color: C.pinkSoft, marginBottom: 5 }}>Productos a pedir</div>
      <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar producto…" style={{ ...inputStyle, marginBottom: 12 }} />

      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {filtered.map((p) => (
          <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 10, background: C.bg, borderRadius: 11, padding: '9px 12px' }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 700, fontSize: 14, color: C.text }}>{p.name}</div>
              <div style={{ fontSize: 12, color: C.muted, fontFamily: 'monospace' }}>{p.sku} · stock {p.stock}</div>
            </div>
            <button type="button" onClick={() => setQty(p.id, (items[p.id] ?? 0) - 1)} style={miniBtn}>−</button>
            <span style={{ minWidth: 22, textAlign: 'center', fontWeight: 700 }}>{items[p.id] ?? 0}</span>
            <button type="button" onClick={() => setQty(p.id, (items[p.id] ?? 0) + 1)} style={miniBtn}>+</button>
          </div>
        ))}
        {filtered.length === 0 && <div style={{ color: C.muted, fontSize: 13, padding: 8 }}>Sin resultados.</div>}
      </div>
    </Modal>
  )
}

const inputStyle: React.CSSProperties = { width: '100%', border: `1px solid ${C.borderSoft}`, borderRadius: 11, padding: '10px 13px', fontSize: 14.5, color: C.text, outline: 'none', background: '#FFFDFE' }
const miniBtn: React.CSSProperties = { width: 30, height: 30, borderRadius: 9, border: `1px solid ${C.border}`, background: C.white, color: C.pinkDeep, fontWeight: 700, fontSize: 16 }
