import { useEffect, useMemo, useRef, useState } from 'react'
import { Html5Qrcode } from 'html5-qrcode'
import { db } from '../../../lib/db'
import type { CashSession, Product, Sale, SaleItem } from '../../../lib/types'
import { cartSubtotal, cartTotal, lineNet, parseMoneyInput } from '../../../lib/saleCalc'
import { formatMoney } from '../../../lib/format'
import { useToast } from '../../../components/Toast'
import SaleConfirmedModal from './SaleConfirmedModal'
import { C, font, gradient, shadow } from '../../../theme'
import { CategoryIcon, Icon, IconText } from '../../../components/Icon'

const SCANNER_ID = 'cap-qr-reader'

interface Props {
  products: Product[]
  cashSession: CashSession | null
  soldBy: { name: string; email: string }
  onReload: () => void
}

export default function ChargePanel({ products, cashSession, soldBy, onReload }: Props) {
  const toast = useToast()
  const [cart, setCart] = useState<SaleItem[]>([])
  const [scanning, setScanning] = useState(false)
  const [manual, setManual] = useState('')
  const [payment, setPayment] = useState<Sale['paymentMethod']>('efectivo')
  const [cartDiscount, setCartDiscount] = useState('')
  const [charging, setCharging] = useState(false)
  const [confirmed, setConfirmed] = useState<Sale | null>(null)

  const productsRef = useRef<Product[]>(products)
  const scannerRef = useRef<Html5Qrcode | null>(null)
  const lastScanRef = useRef<{ code: string; at: number }>({ code: '', at: 0 })

  useEffect(() => { productsRef.current = products }, [products])

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

  function setLineDiscount(productId: string, raw: string) {
    const amount = parseMoneyInput(raw)
    setCart((prev) =>
      prev.map((i) => {
        if (i.productId !== productId) return i
        const max = i.price * i.qty
        return { ...i, lineDiscount: Math.min(amount, max) || undefined }
      }),
    )
  }

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

  const discountAmount = useMemo(() => parseMoneyInput(cartDiscount), [cartDiscount])
  const subtotal = useMemo(() => cartSubtotal(cart), [cart])
  const total = useMemo(() => cartTotal(cart, discountAmount), [cart, discountAmount])
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
      const sale = await db.createSale({
        items: cart,
        paymentMethod: payment,
        subtotal,
        discount: discountAmount,
        total,
        soldByName: soldBy.name,
        soldByEmail: soldBy.email,
        cashSessionId: cashSession?.id ?? null,
      })
      setConfirmed(sale)
      setCart([])
      setCartDiscount('')
      onReload()
    } catch (err) {
      toast(err instanceof Error ? err.message : 'No se pudo registrar la venta.', 'error')
    } finally {
      setCharging(false)
    }
  }

  return (
    <div className="cap-grid-pos">
      {confirmed && <SaleConfirmedModal sale={confirmed} onClose={() => setConfirmed(null)} />}
      <div>
        {!cashSession && (
          <div style={{ background: '#FFF4E2', border: '1px solid #F6E2BE', borderRadius: 14, padding: '12px 14px', marginBottom: 14, fontSize: 13, color: C.amber, fontWeight: 600, display: 'flex', alignItems: 'flex-start', gap: 8 }}>
            <Icon name="alert" size={18} color={C.amber} style={{ flexShrink: 0, marginTop: 1 }} />
            <span>No hay caja abierta. Puedes cobrar igual; abre caja en la pestaña <b>Corte de caja</b> para llevar el control del efectivo.</span>
          </div>
        )}
        <div style={{ background: C.white, borderRadius: 20, border: `1px solid ${C.border}`, boxShadow: shadow.card, padding: 20 }}>
          <div style={{ fontWeight: 700, fontSize: 16, color: C.text, marginBottom: 4 }}>Escanear producto</div>
          <div style={{ fontSize: 13, color: C.muted, marginBottom: 14 }}>Apunta la cámara al código QR de la etiqueta.</div>

          <div id={SCANNER_ID} style={{ width: '100%', borderRadius: 16, overflow: 'hidden', background: scanning ? '#000' : C.bg, minHeight: scanning ? 'auto' : 180, display: scanning ? 'block' : 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {!scanning && (
              <div style={{ textAlign: 'center', color: C.muted, padding: 30 }}>
                <Icon name="camera" size={40} color={C.muted} style={{ margin: '0 auto' }} />
                <div style={{ fontWeight: 700, marginTop: 6 }}>Cámara apagada</div>
              </div>
            )}
          </div>

          <button
            onClick={() => setScanning((v) => !v)}
            style={{ width: '100%', marginTop: 14, background: scanning ? C.white : gradient.brand, color: scanning ? C.pinkSoft : '#fff', border: scanning ? `1px solid ${C.border}` : 'none', borderRadius: 13, padding: '12px', fontWeight: 700, fontSize: 15, boxShadow: scanning ? 'none' : shadow.btn, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
          >
            {scanning ? 'Detener cámara' : <IconText icon="camera" size={17} color="#fff">Encender cámara</IconText>}
          </button>

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
                    <CategoryIcon categoryId={p.category} size={20} color={C.pinkSoft} />
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

      <div style={{ background: C.white, borderRadius: 20, border: `1px solid ${C.border}`, boxShadow: shadow.card, padding: 20, display: 'flex', flexDirection: 'column', minHeight: 420 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <div style={{ fontWeight: 700, fontSize: 16, color: C.text }}>Venta actual</div>
          {cart.length > 0 && <button onClick={() => { setCart([]); setCartDiscount('') }} style={{ background: 'transparent', border: 'none', color: C.muted, fontWeight: 700, fontSize: 13 }}>Vaciar</button>}
        </div>

        {cart.length === 0 ? (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: C.muted, textAlign: 'center' }}>
            <Icon name="shopping-cart" size={44} color={C.pinkSoft} style={{ opacity: 0.85 }} />
            <div style={{ fontWeight: 700, color: C.text, marginTop: 8 }}>El carrito está vacío</div>
            <div style={{ fontSize: 13, marginTop: 2 }}>Escanea un producto para empezar.</div>
          </div>
        ) : (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8, overflowY: 'auto' }}>
            {cart.map((i) => (
              <div key={i.productId} style={{ background: C.bg, borderRadius: 13, padding: '10px 12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: 14, color: C.text }}>{i.name}</div>
                    <div style={{ fontSize: 12.5, color: C.muted }}>{formatMoney(i.price)} c/u</div>
                  </div>
                  <button onClick={() => changeQty(i.productId, -1)} style={miniBtn}>−</button>
                  <span style={{ fontWeight: 700, minWidth: 22, textAlign: 'center' }}>{i.qty}</span>
                  <button onClick={() => changeQty(i.productId, 1)} style={miniBtn}>+</button>
                  <div style={{ width: 72, textAlign: 'right', fontWeight: 700, color: C.pinkDeep }}>{formatMoney(lineNet(i))}</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8 }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: C.muted }}>Desc. línea $</span>
                  <input
                    type="number"
                    min={0}
                    step="0.01"
                    value={i.lineDiscount ?? ''}
                    onChange={(e) => setLineDiscount(i.productId, e.target.value)}
                    placeholder="0"
                    style={{ width: 72, border: `1px solid ${C.borderSoft}`, borderRadius: 8, padding: '5px 8px', fontSize: 13, outline: 'none' }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}

        <div style={{ borderTop: `1px solid ${C.border}`, marginTop: 14, paddingTop: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: C.muted, flex: 'none' }}>Descuento total $</span>
            <input
              value={cartDiscount}
              onChange={(e) => setCartDiscount(e.target.value)}
              placeholder="0"
              style={{ flex: 1, border: `1px solid ${C.borderSoft}`, borderRadius: 10, padding: '8px 12px', fontSize: 14, outline: 'none' }}
            />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: C.muted, marginBottom: 4 }}>
            <span>Subtotal ({count} pzs)</span>
            <span>{formatMoney(subtotal)}</span>
          </div>
          {discountAmount > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: C.pinkSoft, fontWeight: 700, marginBottom: 4 }}>
              <span>Descuento</span>
              <span>−{formatMoney(discountAmount)}</span>
            </div>
          )}
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 12 }}>
            <span style={{ fontSize: 14, color: C.muted, fontWeight: 700 }}>Total</span>
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
