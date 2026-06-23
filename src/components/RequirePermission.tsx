import { Navigate } from 'react-router-dom'
import { ADMIN_BASE } from '../config'
import { usePermissions } from '../contexts/PermissionsContext'
import { defaultLandingPath } from '../lib/permissions'
import { C, font } from '../theme'
import { Icon } from './Icon'

export function RequirePermission({ routeKey, children }: { routeKey: string; children: React.ReactNode }) {
  const { session, loading, canRoute } = usePermissions()

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}>
        <div className="cap-spinner" />
      </div>
    )
  }

  if (!session) return null

  if (!canRoute(routeKey)) {
    const fallback = defaultLandingPath(session.permissions, ADMIN_BASE)
    if (fallback !== `${ADMIN_BASE}/${routeKey}` && fallback !== ADMIN_BASE + (routeKey ? `/${routeKey}` : '')) {
      return <Navigate to={fallback} replace />
    }
    return (
      <div style={{ textAlign: 'center', padding: '60px 20px', color: C.muted }}>
        <Icon name="lock" size={48} color={C.pinkSoft} style={{ margin: '0 auto', opacity: 0.85 }} />
        <div style={{ fontFamily: font.display, fontWeight: 700, fontSize: 18, color: C.text, marginTop: 10 }}>
          No tienes permiso para ver esta sección
        </div>
        <div style={{ fontSize: 14, marginTop: 6 }}>Pide acceso a quien administra la tienda.</div>
      </div>
    )
  }

  return <>{children}</>
}
