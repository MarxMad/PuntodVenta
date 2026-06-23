import { useEffect, useMemo, useState } from 'react'
import { db } from '../../lib/db'
import type { Product } from '../../lib/types'
import { CATEGORIES, categoryById } from '../../lib/categories'
import { formatMoney } from '../../lib/format'
import { printLabel } from '../../lib/print'
import { useResult } from '../../components/ResultModal'
import { Modal } from '../../components/Modal'
import { QRCode } from '../../components/QRCode'
import { ImagePicker, type ImageValue } from '../../components/ImagePicker'
import { uploadProductImage } from '../../lib/storage'
import { C, font, gradient, shadow } from '../../theme'
import { CategoryIcon, Icon, IconText } from '../../components/Icon'

export default function Products() {
  const result = useResult()
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [editing, setEditing] = useState<Product | null>(null)

  async function load() {
    setLoading(true)
    setProducts(await db.listProducts())
    setLoading(false)
  }
  useEffect(() => { load() }, [])

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return products
    return products.filter((p) => p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q))
  }, [products, search])

  async function toggleActive(p: Product) {
    try {
      await db.updateProduct(p.id, { active: !p.active })
      load()
    } catch (err) {
      result({ kind: 'error', title: 'No se pudo cambiar', message: err instanceof Error ? err.message : 'Inténtalo de nuevo.' })
    }
  }
  async function remove(p: Product) {
    if (!confirm(`¿Eliminar "${p.name}"? Esta acción no se puede deshacer.`)) return
    try {
      await db.deleteProduct(p.id)
      load()
      result({ title: 'Producto eliminado', message: `Se eliminó ${p.name}.` })
    } catch (err) {
      result({ kind: 'error', title: 'No se pudo eliminar', message: err instanceof Error ? err.message : 'Inténtalo de nuevo.' })
    }
  }

  if (loading) return <Spinner />
  if (products.length === 0) return <EmptyProducts />

  return (
    <div className="cap-fade">
      <SearchBar value={search} onChange={setSearch} />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {visible.map((p) => {
          const cat = categoryById(p.category)
          return (
            <div key={p.id} className="cap-list-row" style={rowStyle}>
              <div className="cap-list-main">
                <div style={{ width: 52, height: 52, flex: 'none', borderRadius: 13, background: p.imageUrl ? `url(${p.imageUrl}) center/cover` : gradient.card, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24 }}>
                  {!p.imageUrl && <CategoryIcon categoryId={p.category} size={26} color={C.pinkSoft} />}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: 15, color: C.text }}>{p.name}</div>
                  <div style={{ fontSize: 12.5, color: C.muted }}>
                    <span style={{ fontFamily: 'monospace', color: C.pinkSoft }}>{p.sku}</span> · {cat?.label}
                  </div>
                </div>
                <div style={{ textAlign: 'right', flex: 'none', width: 90 }}>
                  <div style={{ fontFamily: font.display, fontWeight: 700, fontSize: 17, color: C.pinkDeep }}>{formatMoney(p.price)}</div>
                  <div style={{ fontSize: 12, color: p.stock <= 5 ? C.amber : C.mutedSoft, fontWeight: 600 }}>{p.stock} pzs</div>
                </div>
              </div>
              <div className="cap-list-actions">
                <button onClick={() => toggleActive(p)} title={p.active ? 'Visible en catálogo' : 'Oculto'} style={{ ...pillBtn, background: p.active ? '#E8F7EF' : '#F3EDF0', color: p.active ? C.green : C.muted, border: 'none' }}>
                  {p.active ? 'Visible' : 'Oculto'}
                </button>
                <button onClick={() => setEditing(p)} style={iconBtn}>Editar</button>
                <button onClick={() => printLabel(p)} style={iconBtn}>QR</button>
                <button onClick={() => remove(p)} style={{ ...iconBtn, color: C.red, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', padding: '7px 9px' }} aria-label="Eliminar">
                  <Icon name="x" size={16} color={C.red} strokeWidth={2.5} />
                </button>
              </div>
            </div>
          )
        })}
      </div>

      {editing && <EditModal product={editing} onClose={() => setEditing(null)} onSaved={() => { setEditing(null); load() }} />}
    </div>
  )
}

function EditModal({ product, onClose, onSaved }: { product: Product; onClose: () => void; onSaved: () => void }) {
  const result = useResult()
  const [form, setForm] = useState({
    name: product.name, category: product.category, description: product.description,
    price: String(product.price), cost: String(product.cost), stock: String(product.stock),
    active: product.active,
  })
  const [image, setImage] = useState<ImageValue>({ file: null, url: product.imageUrl })
  const [busy, setBusy] = useState(false)

  function set<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((f) => ({ ...f, [key]: value }))
  }

  async function save() {
    setBusy(true)
    try {
      const imageUrl = image.file ? await uploadProductImage(image.file) : image.url
      await db.updateProduct(product.id, {
        name: form.name.trim(), category: form.category, description: form.description.trim(),
        price: Number(form.price) || 0, cost: Number(form.cost) || 0, stock: Number(form.stock) || 0,
        imageUrl, active: form.active,
      })
      onSaved()
      result({ title: 'Cambios guardados', message: `Se actualizó ${form.name.trim() || product.name}.` })
    } catch (err) {
      result({ kind: 'error', title: 'No se pudo guardar', message: err instanceof Error ? err.message : 'Inténtalo de nuevo.' })
    } finally {
      setBusy(false)
    }
  }

  return (
    <Modal
      wide
      title="Editar producto"
      onClose={onClose}
      footer={(
        <>
          <button onClick={save} disabled={busy} style={{ background: gradient.brand, color: '#fff', border: 'none', borderRadius: 12, padding: '11px 22px', fontWeight: 700, boxShadow: shadow.btn, flex: 1, minWidth: 140 }}>
            {busy ? 'Guardando…' : 'Guardar'}
          </button>
          <button onClick={onClose} style={{ background: C.white, color: C.pinkSoft, border: `1px solid ${C.border}`, borderRadius: 12, padding: '11px 20px', fontWeight: 700, flex: 1, minWidth: 100 }}>Cancelar</button>
        </>
      )}
    >
      <div style={{ display: 'flex', gap: 18, alignItems: 'flex-start', marginBottom: 18 }}>
        <div style={{ border: `1px solid ${C.border}`, borderRadius: 13, padding: 8, background: '#fff', flex: 'none' }}>
          <QRCode value={product.sku} size={88} />
        </div>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontFamily: 'monospace', fontSize: 13, color: C.pinkSoft }}>{product.sku}</div>
          <button type="button" onClick={() => printLabel(product)} style={{ ...iconBtn, marginTop: 8, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            <IconText icon="printer" size={15} color={C.pinkSoft}>Imprimir QR</IconText>
          </button>
        </div>
      </div>

      <Field label="Nombre"><input value={form.name} onChange={(e) => set('name', e.target.value)} style={inputStyle} /></Field>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <Field label="Categoría">
          <select value={form.category} onChange={(e) => set('category', e.target.value)} style={inputStyle}>
            {CATEGORIES.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
          </select>
        </Field>
        <Field label="Stock"><input type="number" min="0" value={form.stock} onChange={(e) => set('stock', e.target.value)} style={inputStyle} /></Field>
      </div>
      <Field label="Descripción"><textarea value={form.description} onChange={(e) => set('description', e.target.value)} rows={2} style={{ ...inputStyle, resize: 'vertical' }} /></Field>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <Field label="Precio"><input type="number" min="0" step="0.01" value={form.price} onChange={(e) => set('price', e.target.value)} style={inputStyle} /></Field>
        <Field label="Costo"><input type="number" min="0" step="0.01" value={form.cost} onChange={(e) => set('cost', e.target.value)} style={inputStyle} /></Field>
      </div>
      <div style={{ marginBottom: 14 }}>
        <span style={{ display: 'block', fontSize: 12.5, fontWeight: 700, color: C.pinkSoft, marginBottom: 5 }}>Foto del producto</span>
        <ImagePicker value={image} onChange={setImage} categoryId={form.category} />
      </div>
      <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
        <input type="checkbox" checked={form.active} onChange={(e) => set('active', e.target.checked)} style={{ width: 18, height: 18, accentColor: C.pink }} />
        <span style={{ fontSize: 14, fontWeight: 600 }}>Mostrar en el catálogo público</span>
      </label>
    </Modal>
  )
}

export function SearchBar({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 9, background: C.white, border: `1px solid ${C.borderSoft}`, borderRadius: 13, padding: '10px 14px', boxShadow: shadow.sm, maxWidth: 360, marginBottom: 16 }}>
      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#C9A8B8" strokeWidth="2.2" strokeLinecap="round"><circle cx="11" cy="11" r="7" /><path d="m21 21-4.3-4.3" /></svg>
      <input value={value} onChange={(e) => onChange(e.target.value)} placeholder="Buscar por nombre o SKU…" style={{ border: 'none', outline: 'none', flex: 1, fontSize: 14, color: C.text, background: 'transparent' }} />
    </div>
  )
}

export function Spinner() {
  return <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}><div className="cap-spinner" /></div>
}

function EmptyProducts() {
  return (
    <div style={{ textAlign: 'center', padding: '70px 20px', color: C.muted }}>
      <Icon name="ribbon" size={52} color={C.pinkSoft} style={{ margin: '0 auto', opacity: 0.85 }} />
      <div style={{ fontWeight: 700, fontSize: 18, color: C.text, marginTop: 10 }}>Todavía no tienes productos</div>
      <div style={{ fontSize: 14, marginTop: 4 }}>Crea tu primer producto desde “Nuevo producto”.</div>
    </div>
  )
}

const rowStyle: React.CSSProperties = {
  display: 'flex', alignItems: 'center', gap: 14, background: C.white, border: `1px solid ${C.border}`,
  borderRadius: 16, padding: '12px 16px', boxShadow: shadow.sm,
}
const pillBtn: React.CSSProperties = { padding: '6px 12px', borderRadius: 999, fontWeight: 700, fontSize: 12.5 }
const iconBtn: React.CSSProperties = { background: C.white, border: `1px solid ${C.border}`, color: C.pinkSoft, borderRadius: 10, padding: '7px 11px', fontWeight: 700, fontSize: 13 }
const inputStyle: React.CSSProperties = { width: '100%', border: `1px solid ${C.borderSoft}`, borderRadius: 11, padding: '10px 13px', fontSize: 14.5, color: C.text, outline: 'none', background: '#FFFDFE' }

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label style={{ display: 'block', marginBottom: 14 }}>
      <span style={{ display: 'block', fontSize: 12.5, fontWeight: 700, color: C.pinkSoft, marginBottom: 5 }}>{label}</span>
      {children}
    </label>
  )
}
