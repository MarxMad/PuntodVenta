import { useEffect, useMemo, useState } from 'react'
import { db } from '../lib/db'
import type { Product } from '../lib/types'
import { CATEGORIES, categoryById } from '../lib/categories'
import { formatMoney } from '../lib/format'
import { STORE } from '../config'
import { C, font, gradient, shadow } from '../theme'

export default function Catalog() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [cat, setCat] = useState<string>('todos')

  useEffect(() => {
    db.listProducts()
      .then((all) => setProducts(all.filter((p) => p.active && p.stock > 0)))
      .finally(() => setLoading(false))
  }, [])

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase()
    return products.filter((p) => {
      const matchCat = cat === 'todos' || p.category === cat
      const matchSearch =
        !q || p.name.toLowerCase().includes(q) || p.description.toLowerCase().includes(q)
      return matchCat && matchSearch
    })
  }, [products, search, cat])

  // Solo mostramos categorías que tienen al menos un producto disponible
  const activeCats = useMemo(() => {
    const ids = new Set(products.map((p) => p.category))
    return CATEGORIES.filter((c) => ids.has(c.id))
  }, [products])

  return (
    <div style={{ minHeight: '100vh', background: C.bg }}>
      {/* Encabezado */}
      <header
        style={{
          background: gradient.sidebar,
          padding: '38px 24px 30px',
          borderBottom: `1px solid ${C.border}`,
        }}
      >
        <div style={{ maxWidth: 1100, margin: '0 auto', display: 'flex', alignItems: 'center', gap: 14 }}>
          <div
            style={{
              width: 52, height: 52, flex: 'none', borderRadius: 17, background: gradient.logo,
              display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: shadow.btn,
            }}
          >
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
              <path d="M12 21s-7-4.35-9.2-8.5C1.3 9.6 2.6 6 6 6c2 0 3.2 1.3 4 2.4C10.8 7.3 12 6 14 6c3.4 0 4.7 3.6 3.2 6.5C19 16.65 12 21 12 21z" fill="#fff" />
            </svg>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: font.display, fontWeight: 700, fontSize: 30, color: C.pinkDeep }}>
              {STORE.name}
            </div>
            <div style={{ fontSize: 14, color: C.muted, fontWeight: 600 }}>
              {STORE.tagline}
            </div>
          </div>
        </div>
      </header>

      <main style={{ maxWidth: 1100, margin: '0 auto', padding: '26px 24px 60px' }}>
        {/* Buscador */}
        <div
          style={{
            display: 'flex', alignItems: 'center', gap: 9, background: C.white,
            border: `1px solid ${C.borderSoft}`, borderRadius: 14, padding: '12px 16px',
            boxShadow: shadow.sm, maxWidth: 460, marginBottom: 18,
          }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#C9A8B8" strokeWidth="2.2" strokeLinecap="round">
            <circle cx="11" cy="11" r="7" /><path d="m21 21-4.3-4.3" />
          </svg>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar producto…"
            style={{ border: 'none', outline: 'none', flex: 1, fontSize: 15, color: C.text, background: 'transparent' }}
          />
        </div>

        {/* Filtro de categorías */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 24 }}>
          <Chip label="Todos" active={cat === 'todos'} onClick={() => setCat('todos')} />
          {activeCats.map((c) => (
            <Chip key={c.id} label={`${c.emoji} ${c.label}`} active={cat === c.id} onClick={() => setCat(c.id)} />
          ))}
        </div>

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}>
            <div className="cap-spinner" />
          </div>
        ) : visible.length === 0 ? (
          <Empty />
        ) : (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
              gap: 18,
            }}
          >
            {visible.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        )}
      </main>

      <Footer />
    </div>
  )
}

function Footer() {
  const s = STORE
  const hasContact = s.email || s.whatsapp || s.phone
  const hasLocation = s.address || s.city || s.hours || s.mapsUrl
  const hasSocial = s.instagram || s.facebook
  const waLink = s.whatsapp ? `https://wa.me/${s.whatsapp.replace(/\D/g, '')}` : ''

  return (
    <footer style={{ background: gradient.sidebar, borderTop: `1px solid ${C.border}`, marginTop: 40 }}>
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '34px 24px', display: 'flex', flexWrap: 'wrap', gap: 32 }}>
        <div style={{ flex: '1 1 220px' }}>
          <div style={{ fontFamily: font.display, fontWeight: 700, fontSize: 22, color: C.pinkDeep }}>{s.name}</div>
          <div style={{ fontSize: 13.5, color: C.muted, fontWeight: 600, marginTop: 2 }}>{s.tagline}</div>
        </div>

        {hasContact && (
          <div style={{ flex: '1 1 200px' }}>
            <div style={colTitle}>Contacto</div>
            {s.email && <FooterLink href={`mailto:${s.email}`} icon="✉️" text={s.email} />}
            {s.whatsapp && <FooterLink href={waLink} icon="💬" text="Escríbenos por WhatsApp" />}
            {s.phone && <FooterLink href={`tel:${s.phone.replace(/\s/g, '')}`} icon="📞" text={s.phone} />}
          </div>
        )}

        {hasLocation && (
          <div style={{ flex: '1 1 200px' }}>
            <div style={colTitle}>Ubicación</div>
            {(s.address || s.city) && (
              <div style={footerText}>
                <span style={{ marginRight: 7 }}>📍</span>
                {[s.address, s.city].filter(Boolean).join(', ')}
              </div>
            )}
            {s.hours && <div style={footerText}><span style={{ marginRight: 7 }}>🕒</span>{s.hours}</div>}
            {s.mapsUrl && <FooterLink href={s.mapsUrl} icon="🗺️" text="Ver en el mapa" />}
          </div>
        )}

        {hasSocial && (
          <div style={{ flex: '1 1 160px' }}>
            <div style={colTitle}>Síguenos</div>
            {s.instagram && <FooterLink href={`https://instagram.com/${s.instagram}`} icon="📸" text={`@${s.instagram}`} />}
            {s.facebook && <FooterLink href={`https://facebook.com/${s.facebook}`} icon="👍" text={s.facebook} />}
          </div>
        )}
      </div>
      <div style={{ borderTop: `1px solid ${C.border}`, padding: '14px 24px', textAlign: 'center', fontSize: 12.5, color: C.muted }}>
        © {new Date().getFullYear()} {s.name}. Hecho con cariño 🌸
      </div>
    </footer>
  )
}

function FooterLink({ href, icon, text }: { href: string; icon: string; text: string }) {
  return (
    <a href={href} target="_blank" rel="noreferrer" style={{ ...footerText, display: 'flex', alignItems: 'center' }}>
      <span style={{ marginRight: 7 }}>{icon}</span>
      <span style={{ textDecoration: 'underline', textUnderlineOffset: 2 }}>{text}</span>
    </a>
  )
}

const colTitle: React.CSSProperties = { fontFamily: font.display, fontWeight: 700, fontSize: 15, color: C.text, marginBottom: 10 }
const footerText: React.CSSProperties = { fontSize: 13.5, color: '#7C6B76', fontWeight: 600, marginBottom: 8, lineHeight: 1.4 }

function Chip({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        border: `1px solid ${active ? 'transparent' : C.border}`,
        background: active ? gradient.brand : C.white,
        color: active ? C.white : C.pinkSoft,
        padding: '8px 15px', borderRadius: 999, fontWeight: 700, fontSize: 13.5,
        boxShadow: active ? shadow.btn : 'none', transition: 'all .15s',
      }}
    >
      {label}
    </button>
  )
}

function ProductCard({ product }: { product: Product }) {
  const cat = categoryById(product.category)
  return (
    <div
      className="cap-fade"
      style={{
        background: C.white, borderRadius: 20, overflow: 'hidden',
        border: `1px solid ${C.border}`, boxShadow: shadow.card, display: 'flex', flexDirection: 'column',
      }}
    >
      <div
        style={{
          height: 160, background: product.imageUrl ? `url(${product.imageUrl}) center/cover` : gradient.card,
          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 46,
        }}
      >
        {!product.imageUrl && (cat?.emoji ?? '🎀')}
      </div>
      <div style={{ padding: '14px 16px 16px', display: 'flex', flexDirection: 'column', gap: 4, flex: 1 }}>
        <div style={{ fontSize: 11.5, fontWeight: 700, color: C.pinkSoft, letterSpacing: '.3px' }}>
          {cat?.label.toUpperCase()}
        </div>
        <div style={{ fontWeight: 700, fontSize: 15.5, color: C.text, lineHeight: 1.25 }}>{product.name}</div>
        <div style={{ fontSize: 13, color: C.mutedSoft, flex: 1, lineHeight: 1.35 }}>{product.description}</div>
        <div style={{ fontFamily: font.display, fontWeight: 700, fontSize: 22, color: C.pinkDeep, marginTop: 6 }}>
          {formatMoney(product.price)}
        </div>
      </div>
    </div>
  )
}

function Empty() {
  return (
    <div style={{ textAlign: 'center', padding: '70px 20px', color: C.muted }}>
      <div style={{ fontSize: 52 }}>🛍️</div>
      <div style={{ fontWeight: 700, fontSize: 18, color: C.text, marginTop: 10 }}>
        Aún no hay productos para mostrar
      </div>
      <div style={{ fontSize: 14, marginTop: 4 }}>Vuelve pronto, estamos preparando cosas lindas.</div>
    </div>
  )
}
