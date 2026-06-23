import { useEffect, useMemo, useState } from 'react'
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { isAuthenticated, signOut } from '../../lib/auth'
import { db } from '../../lib/db'
import { isCloud } from '../../lib/supabase'
import { ADMIN_BASE } from '../../config'
import { formatMoney } from '../../lib/format'
import { usePermissions } from '../../contexts/PermissionsContext'
import { hasPermission } from '../../lib/permissions'
import { C, font, gradient, shadow } from '../../theme'
import { Icon } from '../../components/Icon'

const LOGIN_PATH = `${ADMIN_BASE}/login`
const ALTA_PATH = `${ADMIN_BASE}/alta`

interface NavItem {
  to: string
  routeKey: string
  label: string
  title: string
  subtitle: string
  icon: JSX.Element
  bottom?: boolean
}

const NAV: NavItem[] = [
  { to: ADMIN_BASE, routeKey: '', label: 'Inicio', title: 'Hola de nuevo', subtitle: 'Resumen de tu tienda Caprichitos', icon: icon('M3 3h7v9H3zM14 3h7v5h-7zM14 12h7v9h-7zM3 16h7v5H3z'), bottom: true },
  { to: `${ADMIN_BASE}/catalogo`, routeKey: 'catalogo', label: 'Catálogo', title: 'Catálogo', subtitle: 'Administra los productos de tu tienda', icon: icon('M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3zM14 14h7v7h-7z') },
  { to: `${ADMIN_BASE}/inventario`, routeKey: 'inventario', label: 'Inventario', title: 'Inventario', subtitle: 'Controla el stock de cada producto', icon: icon('M21 8V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v3M3 8h18v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2zM9 12h6'), bottom: true },
  { to: `${ADMIN_BASE}/ventas`, routeKey: 'ventas', label: 'Punto de venta', title: 'Punto de venta', subtitle: 'Escanea, cobra y registra ventas', icon: icon('M2 3h2.5l2.2 12.3a1.5 1.5 0 0 0 1.5 1.2h8.7a1.5 1.5 0 0 0 1.5-1.2L21 7H6'), bottom: true },
  { to: `${ADMIN_BASE}/pedidos`, routeKey: 'pedidos', label: 'Pedidos', title: 'Pedidos', subtitle: 'Reposición y pedidos a proveedor', icon: icon('M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2M9 12l2 2 4-4') },
  { to: `${ADMIN_BASE}/resurtido`, routeKey: 'resurtido', label: 'Resurtido', title: 'Resurtido y ventas', subtitle: 'Lo más vendido y lista de pedido interna', icon: icon('M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2M9 5a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2M9 5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2M9 12h6M9 16h6') },
  { to: `${ADMIN_BASE}/maquinas`, routeKey: 'maquinas', label: 'Máquinas', title: 'Máquinas', subtitle: 'Maquinitas y recolecciones', icon: icon('M5 4h14a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1zM8 8h8M12 13v4') },
  { to: `${ADMIN_BASE}/reportes`, routeKey: 'reportes', label: 'Reportes', title: 'Estado de resultados', subtitle: 'Ingresos, costos y utilidad de tu negocio', icon: icon('M4 19h16M6 17V9M10 17V5M14 17v-6M18 17v-2') },
  { to: `${ADMIN_BASE}/colaboradores`, routeKey: 'colaboradores', label: 'Colaboradores', title: 'Colaboradores', subtitle: 'Equipo, accesos y permisos', icon: icon('M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75') },
  { to: ALTA_PATH, routeKey: 'alta', label: 'Alta de producto', title: 'Alta de producto', subtitle: 'Crea un producto con su SKU y QR', icon: icon('M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zM12 8v8M8 12h8'), bottom: true },
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
  const { session, canRoute, reload } = usePermissions()
  const [authed, setAuthed] = useState<boolean | null>(null)
  const [invValue, setInvValue] = useState(0)
  const [units, setUnits] = useState(0)
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    isAuthenticated().then((ok) => {
      setAuthed(ok)
      if (!ok) nav(LOGIN_PATH, { replace: true })
      else reload()
    })
  }, [nav, reload])

  useEffect(() => { setMenuOpen(false) }, [loc.pathname])

  useEffect(() => {
    if (!authed || !session) return
    const needProducts = hasPermission(session.permissions, 'pos')
      || hasPermission(session.permissions, 'inventory')
      || hasPermission(session.permissions, 'products')
      || hasPermission(session.permissions, 'reports')
    if (!needProducts) return
    db.listProducts().then((all) => {
      setInvValue(all.reduce((s, p) => s + p.cost * p.stock, 0))
      setUnits(all.reduce((s, p) => s + p.stock, 0))
    }).catch(() => {})
  }, [authed, session, loc.pathname])

  const visibleNav = useMemo(
    () => NAV.filter((item) => canRoute(item.routeKey)),
    [canRoute],
  )

  if (authed === null || (authed && !session)) {
    return (
      <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="cap-spinner" />
      </div>
    )
  }
  if (!authed) return null

  const meta = NAV.find((n) => n.to === loc.pathname) ?? { title: 'Caprichitos', subtitle: '' }
  const showNewProduct = session && hasPermission(session.permissions, 'products')
  const showInvSummary = session && (
    hasPermission(session.permissions, 'inventory')
    || hasPermission(session.permissions, 'products')
    || hasPermission(session.permissions, 'reports')
  )

  async function logout() {
    await signOut()
    nav(LOGIN_PATH, { replace: true })
  }

  const bottomNav = visibleNav.filter((n) => n.bottom)

  return (
    <div className="cap-admin-shell" style={{ background: C.bg, color: C.text }}>
      <div className={`cap-sidebar-backdrop${menuOpen ? ' open' : ''}`} onClick={() => setMenuOpen(false)} aria-hidden />

      <aside
        className={`cap-admin-sidebar${menuOpen ? ' open' : ''}`}
        style={{ background: gradient.sidebar, borderRight: `1px solid ${C.border}` }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 11, padding: '4px 8px 22px' }}>
          <div style={{ width: 44, height: 44, flex: 'none', borderRadius: 15, background: gradient.logo, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: shadow.btn }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M12 21s-7-4.35-9.2-8.5C1.3 9.6 2.6 6 6 6c2 0 3.2 1.3 4 2.4C10.8 7.3 12 6 14 6c3.4 0 4.7 3.6 3.2 6.5C19 16.65 12 21 12 21z" fill="#fff" />
            </svg>
          </div>
          <div>
            <div style={{ fontFamily: font.display, fontWeight: 700, fontSize: 20, color: C.pinkDeep, letterSpacing: '.3px' }}>Caprichitos</div>
            <div style={{ fontSize: 11, color: C.muted, fontWeight: 600, letterSpacing: '.5px' }}>{session?.name ?? 'TIENDA'}</div>
          </div>
        </div>

        <nav style={{ display: 'flex', flexDirection: 'column', gap: 4, marginTop: 6, overflowY: 'auto' }}>
          {visibleNav.map((item) => {
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
          {showInvSummary && (
            <div style={{ background: 'rgba(255,255,255,.6)', borderRadius: 16, padding: '14px 16px', border: `1px solid ${C.border}` }}>
              <div style={{ fontSize: 12, color: C.muted, fontWeight: 700 }}>Valor del inventario</div>
              <div style={{ fontFamily: font.display, fontWeight: 700, fontSize: 22, color: C.pinkDeep, marginTop: 2 }}>{formatMoney(invValue)}</div>
              <div style={{ fontSize: 12, color: C.mutedSoft, marginTop: 1 }}>{units} piezas en stock</div>
            </div>
          )}
          <button
            onClick={logout}
            style={{ background: 'transparent', border: `1px solid ${C.border}`, color: C.pinkSoft, padding: '9px', borderRadius: 12, fontWeight: 700, fontSize: 13 }}
          >
            Cerrar sesión
          </button>
        </div>
      </aside>

      <main className="cap-admin-main">
        <header
          className="cap-admin-header"
          style={{
            background: 'rgba(255,248,251,.88)', borderBottom: `1px solid #F4E3EC`, padding: '18px 34px',
          }}
        >
          <button type="button" className="cap-menu-btn" onClick={() => setMenuOpen((v) => !v)} aria-label="Abrir menú">
            <Icon name="menu" size={22} color={C.pinkDeep} />
          </button>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontFamily: font.display, fontWeight: 700, fontSize: 24, color: C.text }}>{meta.title}</div>
            <div style={{ fontSize: 13.5, color: C.muted, fontWeight: 600 }}>{meta.subtitle}</div>
          </div>
          {!isCloud && (
            <div style={{ fontSize: 12, fontWeight: 700, color: C.amber, background: '#FFF4E2', border: '1px solid #F6E2BE', padding: '7px 12px', borderRadius: 10 }}>
              Modo prueba
            </div>
          )}
          {showNewProduct && (
            <Link
              to={ALTA_PATH}
              className="cap-header-new-btn"
              style={{ display: 'flex', alignItems: 'center', gap: 8, background: gradient.brand, color: '#fff', borderRadius: 13, padding: '11px 18px', fontWeight: 700, fontSize: 14, boxShadow: shadow.btn, flex: 'none' }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round"><path d="M12 5v14M5 12h14" /></svg>
              <span>Nuevo producto</span>
            </Link>
          )}
        </header>

        <div className="cap-admin-content" style={{ padding: '28px 34px 48px' }}>
          <Outlet />
        </div>
      </main>

      <nav className="cap-bottom-nav" aria-label="Accesos rápidos">
        {bottomNav.map((item) => {
          const active = loc.pathname === item.to
          const short = item.label === 'Punto de venta' ? 'Venta' : item.label === 'Alta de producto' ? 'Alta' : item.label
          return (
            <Link key={item.to} to={item.to} className={active ? 'active' : ''}>
              {item.icon}
              {short}
            </Link>
          )
        })}
      </nav>
    </div>
  )
}
