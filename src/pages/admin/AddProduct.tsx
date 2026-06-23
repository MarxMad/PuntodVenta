import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { db } from '../../lib/db'
import { CATEGORIES } from '../../lib/categories'
import type { Product } from '../../lib/types'
import { useToast } from '../../components/Toast'
import { QRCode } from '../../components/QRCode'
import { ImagePicker, type ImageValue } from '../../components/ImagePicker'
import { uploadProductImage } from '../../lib/storage'
import { categoryById } from '../../lib/categories'
import { printLabel } from '../../lib/print'
import { ADMIN_BASE } from '../../config'
import { formatMoney } from '../../lib/format'
import { C, font, gradient, shadow } from '../../theme'

export default function AddProduct() {
  const nav = useNavigate()
  const toast = useToast()
  const [created, setCreated] = useState<Product | null>(null)
  const [busy, setBusy] = useState(false)

  const [form, setForm] = useState({
    name: '', category: 'papeleria', description: '',
    price: '', cost: '', stock: '', active: true,
  })
  const [image, setImage] = useState<ImageValue>({ file: null, url: null })

  function set<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((f) => ({ ...f, [key]: value }))
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name.trim()) return toast('Ponle un nombre al producto.', 'error')
    if (!form.price || Number(form.price) <= 0) return toast('Indica un precio de venta.', 'error')
    setBusy(true)
    try {
      const imageUrl = image.file ? await uploadProductImage(image.file) : image.url
      const product = await db.createProduct({
        name: form.name.trim(),
        category: form.category,
        description: form.description.trim(),
        price: Number(form.price),
        cost: Number(form.cost) || 0,
        stock: Number(form.stock) || 0,
        imageUrl,
        active: form.active,
      })
      setCreated(product)
      toast('Producto creado con su SKU y QR ✨')
    } catch (err) {
      toast(err instanceof Error ? err.message : 'No se pudo crear.', 'error')
    } finally {
      setBusy(false)
    }
  }

  // Pantalla de éxito con el QR generado
  if (created) {
    return (
      <div className="cap-fade" style={{ maxWidth: 760, margin: '0 auto' }}>
        <div style={{ background: C.white, borderRadius: 22, border: `1px solid ${C.border}`, boxShadow: shadow.card, padding: 30, display: 'flex', gap: 30, flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ flex: '0 0 auto', textAlign: 'center' }}>
            <div style={{ border: `1px solid ${C.border}`, borderRadius: 16, padding: 14, display: 'inline-block', background: '#fff' }}>
              <QRCode value={created.sku} size={180} />
            </div>
          </div>
          <div style={{ flex: 1, minWidth: 240 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: C.green, marginBottom: 6 }}>✅ Producto creado</div>
            <div style={{ fontFamily: font.display, fontWeight: 700, fontSize: 24, color: C.text }}>{created.name}</div>
            <div style={{ display: 'inline-block', marginTop: 10, fontFamily: 'monospace', fontWeight: 700, fontSize: 16, color: C.pinkDeep, background: C.card1, padding: '6px 12px', borderRadius: 10, letterSpacing: '1px' }}>
              {created.sku}
            </div>
            <div style={{ fontFamily: font.display, fontWeight: 700, fontSize: 22, color: C.pinkDeep, marginTop: 14 }}>{formatMoney(created.price)}</div>
            <div style={{ fontSize: 13.5, color: C.muted, marginTop: 2 }}>{created.stock} piezas en stock</div>

            <div style={{ display: 'flex', gap: 10, marginTop: 22, flexWrap: 'wrap' }}>
              <button onClick={() => printLabel(created)} style={primaryBtn}>🖨️ Imprimir etiqueta QR</button>
              <button onClick={() => { setCreated(null); setImage({ file: null, url: null }); setForm({ name: '', category: form.category, description: '', price: '', cost: '', stock: '', active: true }) }} style={ghostBtn}>
                + Crear otro
              </button>
              <button onClick={() => nav(`${ADMIN_BASE}/catalogo`)} style={ghostBtn}>Ver catálogo</button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <form onSubmit={submit} className="cap-fade" style={{ maxWidth: 720, margin: '0 auto' }}>
      <div style={{ background: C.white, borderRadius: 22, border: `1px solid ${C.border}`, boxShadow: shadow.card, padding: 28 }}>
        <Field label="Nombre del producto *">
          <input value={form.name} onChange={(e) => set('name', e.target.value)} placeholder="Ej. Cuaderno profesional rosa" style={inputStyle} />
        </Field>

        <div className="cap-grid-form-2">
          <Field label="Categoría *">
            <select value={form.category} onChange={(e) => set('category', e.target.value)} style={inputStyle}>
              {CATEGORIES.map((c) => (
                <option key={c.id} value={c.id}>{c.emoji} {c.label}</option>
              ))}
            </select>
          </Field>
          <Field label="Stock inicial">
            <input type="number" min="0" value={form.stock} onChange={(e) => set('stock', e.target.value)} placeholder="0" style={inputStyle} />
          </Field>
        </div>

        <Field label="Descripción">
          <textarea value={form.description} onChange={(e) => set('description', e.target.value)} placeholder="Breve descripción para el catálogo…" rows={3} style={{ ...inputStyle, resize: 'vertical' }} />
        </Field>

        <div className="cap-grid-form-2">
          <Field label="Precio de venta *">
            <input type="number" min="0" step="0.01" value={form.price} onChange={(e) => set('price', e.target.value)} placeholder="0.00" style={inputStyle} />
          </Field>
          <Field label="Costo (para tu margen)">
            <input type="number" min="0" step="0.01" value={form.cost} onChange={(e) => set('cost', e.target.value)} placeholder="0.00" style={inputStyle} />
          </Field>
        </div>

        <div style={{ marginBottom: 16 }}>
          <span style={{ display: 'block', fontSize: 13, fontWeight: 700, color: C.pinkSoft, marginBottom: 6 }}>Foto del producto</span>
          <ImagePicker value={image} onChange={setImage} emoji={categoryById(form.category)?.emoji} />
        </div>

        <label style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 6, cursor: 'pointer' }}>
          <input type="checkbox" checked={form.active} onChange={(e) => set('active', e.target.checked)} style={{ width: 18, height: 18, accentColor: C.pink }} />
          <span style={{ fontSize: 14, fontWeight: 600, color: C.text }}>Mostrar en el catálogo público</span>
        </label>

        <div style={{ fontSize: 13, color: C.muted, marginTop: 18, background: C.bg, borderRadius: 12, padding: '12px 14px' }}>
          🔖 El <b>SKU</b> y el <b>código QR</b> se generan automáticamente al guardar.
        </div>

        <div style={{ display: 'flex', gap: 10, marginTop: 22 }}>
          <button type="submit" disabled={busy} style={{ ...primaryBtn, opacity: busy ? 0.6 : 1 }}>
            {busy ? 'Guardando…' : 'Guardar producto'}
          </button>
          <button type="button" onClick={() => nav(`${ADMIN_BASE}/catalogo`)} style={ghostBtn}>Cancelar</button>
        </div>
      </div>
    </form>
  )
}

const inputStyle: React.CSSProperties = {
  width: '100%', border: `1px solid ${C.borderSoft}`, borderRadius: 12, padding: '12px 14px',
  fontSize: 15, color: C.text, outline: 'none', background: '#FFFDFE',
}
const primaryBtn: React.CSSProperties = {
  background: gradient.brand, color: '#fff', border: 'none', borderRadius: 13, padding: '12px 22px', fontWeight: 700, fontSize: 15, boxShadow: shadow.btn,
}
const ghostBtn: React.CSSProperties = {
  background: C.white, color: C.pinkSoft, border: `1px solid ${C.border}`, borderRadius: 13, padding: '12px 20px', fontWeight: 700, fontSize: 15,
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label style={{ display: 'block', marginBottom: 16 }}>
      <span style={{ display: 'block', fontSize: 13, fontWeight: 700, color: C.pinkSoft, marginBottom: 6 }}>{label}</span>
      {children}
    </label>
  )
}
