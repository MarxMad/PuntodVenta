import { useEffect, useMemo, useRef, useState } from 'react'
import { Html5Qrcode } from 'html5-qrcode'
import { db } from '../../lib/db'
import type { Product, SaleItem, Sale } from '../../lib/types'
import { categoryById } from '../../lib/categories'
import { formatMoney } from '../../lib/format'
import { useToast } from '../../components/Toast'
import { Spinner } from './Products'
import { C, font, gradient, shadow } from '../../theme'

const SCANNER_ID = 'cap-qr-reader'

export default function POS() {
  const toast = useToast()
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [cart, setCart] = useState<SaleItem[]>([])
  const [scanning, setScanning] = useState(false)
  const [manual, setManual] = useState('')
  const [payment, setPayment] = useState<Sale['paymentMethod']>('efectivo')
  const [charging, setCharging] = useState(false)

  const productsRef = useRef<Product[]>([])
  const scannerRef = useRef<Html5Qrcode | null>(null)
  const lastScanRef = useRef<{ code: string; at: number }>({ code: '', at: 0 })

  async function load() {
    setLoading(true)
    const all = await db.listProducts()
    setProducts(all)
    productsRef.current = all
    setLoading(false)
  }
  useEffect(() => { load() }, [])

  function addBySku(rawSku: string) {
    const sku = rawSku.trim()
    if (!sku) return
    const product = productsRef.current.find((p) => p.sku.toLowerCase() === sku.toLowerCase())
    if (!product) {
      toast(`No encontré el producto "${sku}".`, 'error')
      return
    }
    addProduct(product)
  }

  function addProduct(product: Product) {
    setCart((prev) => {
      const existing = prev.find((i) => i.productId === product.id)
      const inCart = existing?.qty ?? 0
      if (inCart >= product.stock) {
        toast(`Solo hay ${product.stock} de "${product.name}".`, 'error')
        return prev
      }
      if (existing) {
        return prev.map((i) => (i.productId === product.id ? { ...i, qty: i.qty + 1 } : i))
      }
      return [...prev, { productId: product.id, sku: product.sku, name: product.name, price: product.price, qty: 1 }]
    })
  }

  function changeQty(productId: string, delta: number) {
    setCart((prev) =>
      prev
        .map((i) => (i.productId === productId ? { ...i, qty: i.qty + delta } : i))
        .filter((i) => i.qty > 0),
    )
  }

  // ── Escáner ──────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!scanning) return
    const scanner = new Html5Qrcode(SCANNER_ID)
    scannerRef.current = scanner
    scanner
      .start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 230, height: 230 } },
        (decoded) => {
          const now = Date.now()
          // Evita registrar el mismo código varias veces seguidas
          if (lastScanRef.current.code === decoded && now - lastScanRef.current.at < 1500) return
          lastScanRef.current = { code: decoded, at: now }
          addBySku(decoded)
        },
        () => {},
      )
      .catch(() => {
        toast('No se pudo abrir la cámara. Revisa los permisos.', 'error')
        setScanning(false)
      })

    return () => {
      scanner.stop().then(() => scanner.clear()).catch(() => {})
      scannerRef.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scanning])

  const total = useMemo(() => cart.reduce((s, i) => s + i.price * i.qty, 0), [cart])
  const count = useMemo(() => cart.reduce((s, i) => s + i.qty, 0), [cart])

  const filtered = useMemo(() => {
    const q = manual.trim().toLowerCase()
    if (!q) return []
    return products.filter((p) => p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q)).slice(0, 6)
  }, [products, manual])

  async function charge() {
    if (cart.length === 0) return
    setCharging(true)
    try {
      await db.createSale(cart, payment)
      toast(`Venta registrada · ${formatMoney(total)} 🎉`)
      setCart([])
      load() // refresca stock
    } catch (err) {
      toast(err instanceof Error ? err.message : 'No se pudo registrar la venta.', 'error')
    } finally {
      setCharging(false)
    }
  }

  if (loading) return <Spinner />

  return (
    <div className="cap-fade" style={{ display: 'grid', gridTemplateColumns: '1.1fr 1fr', gap: 22, alignItems: 'start' }}>
      {/* Columna izquierda: escáner + búsqueda */}
      <div>
        <div style={{ background: C.white, borderRadius: 20, border: `1px solid ${C.border}`, boxShadow: shadow.card, padding: 20 }}>
          <div style={{ fontWeight: 700, fontSize: 16, color: C.text, marginBottom: 4 }}>Escanear producto</div>
          <div style={{ fontSize: 13, color: C.muted, marginBottom: 14 }}>Apunta la cámara al código QR de la etiqueta.</div>

          <div id={SCANNER_ID} style={{ width: '100%', borderRadius: 16, overflow: 'hidden', background: scanning ? '#000' : C.bg, minHeight: scanning ? 'auto' : 180, display: scanning ? 'block' : 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {!scanning && <div style={{ textAlign: 'center', color: C.muted, padding: 30 }}><div style={{ fontSize: 40 }}>📷</div><div style={{ fontWeight: 700, marginTop: 6 }}>Cámara apagada</div></div>}
          </div>

          <button
            onClick={() => setScanning((v) => !v)}
            style={{ width: '100%', marginTop: 14, background: scanning ? C.white : gradient.brand, color: scanning ? C.pinkSoft : '#fff', border: scanning ? `1px solid ${C.border}` : 'none', borderRadius: 13, padding: '12px', fontWeight: 700, fontSize: 15, boxShadow: scanning ? 'none' : shadow.btn }}
          >
            {scanning ? 'Detener cámara' : '📷 Encender cámara'}
          </button>

          {/* Alta manual / búsqueda */}
          <div style={{ marginTop: 18 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: C.pinkSoft, marginBottom: 6 }}>…o busca por nombre / SKU</div>
            <input
              value={manual}
              onChange={(e) => setManual(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') { addBySku(manual); setManual('') } }}
              placeholder="Escribe y presiona Enter…"
              style={{ width: '100%', border: `1px solid ${C.borderSoft}`, borderRadius: 12, padding: '11px 14px', fontSize: 14.5, color: C.text, outline: 'none' }}
            />
            {filtered.length > 0 && (
              <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 6 }}>
                {filtered.map((p) => (
                  <button key={p.id} onClick={() => { addProduct(p); setManual('') }} style={{ display: 'flex', alignItems: 'center', gap: 10, textAlign: 'left', background: C.bg, border: `1px solid ${C.border}`, borderRadius: 11, padding: '9px 12px' }}>
                    <span style={{ fontSize: 20 }}>{categoryById(p.category)?.emoji}</span>
                    <span style={{ flex: 1 }}>
                      <span style={{ display: 'block', fontWeight: 700, fontSize: 14, color: C.text }}>{p.name}</span>
                      <span style={{ fontSize: 12, color: C.muted, fontFamily: 'monospace' }}>{p.sku}</span>
                    </span>
                    <span style={{ fontWeight: 700, color: C.pinkDeep }}>{formatMoney(p.price)}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Columna derecha: carrito */}
      <div style={{ background: C.white, borderRadius: 20, border: `1px solid ${C.border}`, boxShadow: shadow.card, padding: 20, display: 'flex', flexDirection: 'column', minHeight: 420 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <div style={{ fontWeight: 700, fontSize: 16, color: C.text }}>Venta actual</div>
          {cart.length > 0 && <button onClick={() => setCart([])} style={{ background: 'transparent', border: 'none', color: C.muted, fontWeight: 700, fontSize: 13 }}>Vaciar</button>}
        </div>

        {cart.length === 0 ? (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: C.muted, textAlign: 'center' }}>
            <div style={{ fontSize: 44 }}>🛒</div>
            <div style={{ fontWeight: 700, color: C.text, marginTop: 8 }}>El carrito está vacío</div>
            <div style={{ fontSize: 13, marginTop: 2 }}>Escanea un producto para empezar.</div>
          </div>
        ) : (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8, overflowY: 'auto' }}>
            {cart.map((i) => (
              <div key={i.productId} style={{ display: 'flex', alignItems: 'center', gap: 10, background: C.bg, borderRadius: 13, padding: '10px 12px' }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: 14, color: C.text }}>{i.name}</div>
                  <div style={{ fontSize: 12.5, color: C.muted }}>{formatMoney(i.price)} c/u</div>
                </div>
                <button onClick={() => changeQty(i.productId, -1)} style={miniBtn}>−</button>
                <span style={{ fontWeight: 700, minWidth: 22, textAlign: 'center' }}>{i.qty}</span>
                <button onClick={() => changeQty(i.productId, 1)} style={miniBtn}>+</button>
                <div style={{ width: 72, textAlign: 'right', fontWeight: 700, color: C.pinkDeep }}>{formatMoney(i.price * i.qty)}</div>
              </div>
            ))}
          </div>
        )}

        {/* Pie: total y cobro */}
        <div style={{ borderTop: `1px solid ${C.border}`, marginTop: 14, paddingTop: 14 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 12 }}>
            <span style={{ fontSize: 14, color: C.muted, fontWeight: 700 }}>{count} artículo{count === 1 ? '' : 's'}</span>
            <span style={{ fontFamily: font.display, fontWeight: 700, fontSize: 32, color: C.pinkDeep }}>{formatMoney(total)}</span>
          </div>
          <div style={{ display: 'flex', gap: 6, marginBottom: 12 }}>
            {(['efectivo', 'tarjeta', 'transferencia'] as const).map((m) => (
              <button key={m} onClick={() => setPayment(m)} style={{ flex: 1, padding: '9px', borderRadius: 11, fontWeight: 700, fontSize: 13, textTransform: 'capitalize', border: `1px solid ${payment === m ? 'transparent' : C.border}`, background: payment === m ? gradient.brand : C.white, color: payment === m ? '#fff' : C.pinkSoft }}>
                {m}
              </button>
            ))}
          </div>
          <button
            onClick={charge}
            disabled={cart.length === 0 || charging}
            style={{ width: '100%', background: gradient.brand, color: '#fff', border: 'none', borderRadius: 14, padding: '14px', fontWeight: 700, fontSize: 16, boxShadow: shadow.btn }}
          >
            {charging ? 'Registrando…' : `Cobrar ${formatMoney(total)}`}
          </button>
        </div>
      </div>
    </div>
  )
}

const miniBtn: React.CSSProperties = { width: 30, height: 30, borderRadius: 9, border: `1px solid ${C.border}`, background: C.white, color: C.pinkDeep, fontWeight: 700, fontSize: 16 }
