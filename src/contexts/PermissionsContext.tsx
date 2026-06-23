import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { getSession, isAuthenticated, refreshSession } from '../lib/auth'
import type { SessionInfo } from '../lib/types'
import { canAccessRoute, hasPermission, type Permission } from '../lib/permissions'

interface PermissionsContextValue {
  session: SessionInfo | null
  loading: boolean
  can: (perm: Permission) => boolean
  canRoute: (routeKey: string) => boolean
  reload: () => Promise<void>
}

const PermissionsContext = createContext<PermissionsContextValue>({
  session: null,
  loading: true,
  can: () => false,
  canRoute: () => false,
  reload: async () => {},
})

export function PermissionsProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<SessionInfo | null>(null)
  const [loading, setLoading] = useState(true)

  async function load() {
    setLoading(true)
    try {
      const ok = await isAuthenticated()
      if (!ok) {
        setSession(null)
        return
      }
      setSession(await getSession())
    } catch {
      setSession(null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const value: PermissionsContextValue = {
    session,
    loading,
    can: (perm) => (session ? hasPermission(session.permissions, perm) : false),
    canRoute: (routeKey) => (session ? canAccessRoute(session.permissions, routeKey) : false),
    reload: async () => {
      const ok = await isAuthenticated()
      if (!ok) { setSession(null); return }
      setSession(await refreshSession())
    },
  }

  return <PermissionsContext.Provider value={value}>{children}</PermissionsContext.Provider>
}

export function usePermissions() {
  return useContext(PermissionsContext)
}
