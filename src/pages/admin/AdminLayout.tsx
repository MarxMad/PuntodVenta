import { useEffect, useState } from 'react'
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { isAuthenticated, signOut } from '../../lib/auth'
import { db } from '../../lib/db'
import { isCloud } from '../../lib/supabase'
import { ADMIN_BASE } from '../../config'
import { formatMoney } from '../../lib/format'
import { C, font, gradient, shadow } from '../../theme'

const LOGIN_PATH = `${ADMIN_BASE}/login`
const ALTA_PATH = `${ADMIN_BASE}/alta`

interface NavItem {
  to: string
  label: string
  title: string
  subtitle: string
  icon: JSX.Element
}

const NAV: NavItem[] = [
  { to: ADMIN_BASE, label: 'Inicio', title: 'Hola de nuevo 🌸', subtitle: 'Resumen de tu tienda Caprichitos', icon: icon('M3 3h7v9H3zM14 3h7v5h-7zM14 12h7v9h-7zM3 16h7v5H3z') },
  { to: `${ADMIN_BASE}/catalogo`, label: 'Catálogo', title: 'Catálogo', subtitle: 'Administra los productos de tu tienda', icon: icon('M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3zM14 14h7v7h-7z') },
  { to: `${ADMIN_BASE}/inventario`, label: 'Inventario', title: 'Inventario', subtitle: 'Controla el stock de cada producto', icon: icon('M21 8V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v3M3 8h18v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2zM9 12h6') },
  { to: `${ADMIN_BASE}/ventas`, label: 'Punto de venta', title: 'Punto de venta', subtitle: 'Escanea, cobra y registra ventas', icon: icon('M2 3h2.5l2.2 12.3a1.5 1.5 0 0 0 1.5 1.2h8.7a1.5 1.5 0 0 0 1.5-1.2L21 7H6') },
  { to: `${ADMIN_BASE}/pedidos`, label: 'Pedidos', title: 'Pedidos', subtitle: 'Reposición y pedidos a proveedor', icon: icon('M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2M9 12l2 2 4-4') },
  { to: `${ADMIN_BASE}/maquinas`, label: 'Máquinas', title: 'Máquinas', subtitle: 'Maquinitas y recolecciones', icon: icon('M5 4h14a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1zM8 8h8M12 13v4') },
  { to: ALTA_PATH, label: 'Alta de producto', title: 'Alta de producto', subtitle: 'Crea un producto con su SKU y QR', icon: icon('M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zM12 8v8M8 12h8') },
]

function icon(d: string) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      {d.split('M').filter(Boolean).map((seg, i) => (
        <path key={i} d={'M' + seg} />
      ))}
    </svg>
  )
}

export default function AdminLayout() {
  const nav = useNavigate()
  const loc = useLocation()
  const [authed, setAuthed] = useState<boolean | null>(null)
  const [invValue, setInvValue] = useState(0)
  const [units, setUnits] = useState(0)

  useEffect(() => {
    isAuthenticated().then((ok) => {
      setAuthed(ok)
      if (!ok) nav(LOGIN_PATH, { replace: true })
    })
  }, [nav])

  // Recalcula el resumen del inventario cada vez que cambia de pantalla
  useEffect(() => {
    if (!authed) return
    db.listProducts().then((all) => {
      setInvValue(all.reduce((s, p) => s + p.cost * p.stock, 0))
      setUnits(all.reduce((s, p) => s + p.stock, 0))
    })
  }, [authed, loc.pathname])

  if (authed === null) {
    return (
      <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="cap-spinner" />
      </div>
    )
  }
  if (!authed) return null

  const meta = NAV.find((n) => n.to === loc.pathname) ?? { title: 'Caprichitos', subtitle: '' }

  async function logout() {
    await signOut()
    nav(LOGIN_PATH, { replace: true })
  }

  return (
    <div style={{ display: 'flex', height: '100vh', width: '100%', background: C.bg, color: C.text, overflow: 'hidden' }}>
      {/* SIDEBAR */}
      <aside
        style={{
          width: 256, flex: 'none', background: gradient.sidebar, display: 'flex',
          flexDirection: 'column', padding: '26px 18px', borderRight: `1px solid ${C.border}`,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 11, padding: '4px 8px 22px' }}>
          <div style={{ width: 44, height: 44, flex: 'none', borderRadius: 15, background: gradient.logo, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: shadow.btn }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M12 21s-7-4.35-9.2-8.5C1.3 9.6 2.6 6 6 6c2 0 3.2 1.3 4 2.4C10.8 7.3 12 6 14 6c3.4 0 4.7 3.6 3.2 6.5C19 16.65 12 21 12 21z" fill="#fff" />
            </svg>
          </div>
          <div>
            <div style={{ fontFamily: font.display, fontWeight: 700, fontSize: 20, color: C.pinkDeep, letterSpacing: '.3px' }}>Caprichitos</div>
            <div style={{ fontSize: 11, color: C.muted, fontWeight: 600, letterSpacing: '.5px' }}>TIENDA · GESTIÓN</div>
          </div>
        </div>

        <nav style={{ display: 'flex', flexDirection: 'column', gap: 4, marginTop: 6 }}>
          {NAV.map((item) => {
            const active = loc.pathname === item.to
            return (
              <Link
                key={item.to}
                to={item.to}
                style={{
                  display: 'flex', alignItems: 'center', gap: 12, padding: '11px 14px', borderRadius: 14,
                  fontWeight: 700, fontSize: 14.5, color: active ? C.pinkDeep : '#8A7682',
                  background: active ? 'rgba(255,255,255,.85)' : 'transparent',
                  boxShadow: active ? shadow.sm : 'none', transition: 'all .15s',
                }}
              >
                {item.icon}
                {item.label}
              </Link>
            )
          })}
        </nav>

        <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ background: 'rgba(255,255,255,.6)', borderRadius: 16, padding: '14px 16px', border: `1px solid ${C.border}` }}>
            <div style={{ fontSize: 12, color: C.muted, fontWeight: 700 }}>Valor del inventario</div>
            <div style={{ fontFamily: font.display, fontWeight: 700, fontSize: 22, color: C.pinkDeep, marginTop: 2 }}>{formatMoney(invValue)}</div>
            <div style={{ fontSize: 12, color: C.mutedSoft, marginTop: 1 }}>{units} piezas en stock</div>
          </div>
          <button
            onClick={logout}
            style={{ background: 'transparent', border: `1px solid ${C.border}`, color: C.pinkSoft, padding: '9px', borderRadius: 12, fontWeight: 700, fontSize: 13 }}
          >
            Cerrar sesión
          </button>
        </div>
      </aside>

      {/* MAIN */}
      <main style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
        <header
          style={{
            position: 'sticky', top: 0, zIndex: 5, background: 'rgba(255,248,251,.88)', backdropFilter: 'blur(10px)',
            borderBottom: `1px solid #F4E3EC`, padding: '18px 34px', display: 'flex', alignItems: 'center', gap: 18,
          }}
        >
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: font.display, fontWeight: 700, fontSize: 24, color: C.text }}>{meta.title}</div>
            <div style={{ fontSize: 13.5, color: C.muted, fontWeight: 600 }}>{meta.subtitle}</div>
          </div>
          {!isCloud && (
            <div style={{ fontSize: 12, fontWeight: 700, color: C.amber, background: '#FFF4E2', border: '1px solid #F6E2BE', padding: '7px 12px', borderRadius: 10 }}>
              Modo prueba (datos locales)
            </div>
          )}
          <Link
            to={ALTA_PATH}
            style={{ display: 'flex', alignItems: 'center', gap: 8, background: gradient.brand, color: '#fff', borderRadius: 13, padding: '11px 18px', fontWeight: 700, fontSize: 14, boxShadow: shadow.btn }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round"><path d="M12 5v14M5 12h14" /></svg>
            Nuevo producto
          </Link>
        </header>

        <div style={{ padding: '28px 34px 48px', flex: 1 }}>
          <Outlet />
        </div>
      </main>
    </div>
  )
}
