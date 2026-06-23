// Permisos del panel de administración

export type Permission =
  | 'pos'        // Punto de venta / cobrar
  | 'inventory'  // Ajustar stock
  | 'products'   // Catálogo y alta de productos
  | 'orders'     // Pedidos a proveedor
  | 'machines'   // Máquinas y recolecciones
  | 'reports'    // Reportes y resurtido
  | 'staff'      // Gestionar colaboradores

export const ALL_PERMISSIONS: Permission[] = [
  'pos', 'inventory', 'products', 'orders', 'machines', 'reports', 'staff',
]

export const PERMISSION_META: Record<Permission, { label: string; desc: string }> = {
  pos: { label: 'Cobrar (punto de venta)', desc: 'Registrar ventas y escanear productos' },
  inventory: { label: 'Inventario', desc: 'Ajustar cantidades en stock' },
  products: { label: 'Productos', desc: 'Crear, editar y dar de alta productos' },
  orders: { label: 'Pedidos', desc: 'Pedidos a proveedor y recepción' },
  machines: { label: 'Máquinas', desc: 'Maquinitas y recolecciones' },
  reports: { label: 'Reportes y resurtido', desc: 'Estados de resultados y listas de pedido' },
  staff: { label: 'Colaboradores', desc: 'Agregar y configurar permisos del equipo' },
}

export interface RolePreset {
  id: string
  label: string
  desc: string
  permissions: string[]
}

export const ROLE_PRESETS: RolePreset[] = [
  { id: 'admin', label: 'Administrador', desc: 'Acceso completo a todo', permissions: ['*'] },
  { id: 'cajero', label: 'Cajero', desc: 'Solo cobrar en punto de venta', permissions: ['pos'] },
  { id: 'inventario', label: 'Inventario', desc: 'Stock y productos nuevos', permissions: ['inventory', 'products'] },
  { id: 'supervisor', label: 'Supervisor', desc: 'Venta, inventario, pedidos y reportes', permissions: ['pos', 'inventory', 'products', 'orders', 'reports'] },
]

/** Permiso requerido por cada ruta del panel (path relativo a ADMIN_BASE) */
export const ROUTE_PERMISSION: Record<string, Permission | null> = {
  '': null,
  catalogo: 'products',
  inventario: 'inventory',
  ventas: 'pos',
  pedidos: 'orders',
  resurtido: 'reports',
  maquinas: 'machines',
  reportes: 'reports',
  alta: 'products',
  colaboradores: 'staff',
}

export function hasPermission(perms: string[], perm: Permission): boolean {
  if (perms.includes('*')) return true
  return perms.includes(perm)
}

export function canAccessRoute(perms: string[], routeKey: string): boolean {
  const need = ROUTE_PERMISSION[routeKey]
  if (need === null) return perms.length > 0 || perms.includes('*')
  return hasPermission(perms, need)
}

export function defaultLandingPath(perms: string[], base: string): string {
  if (hasPermission(perms, 'pos')) return `${base}/ventas`
  if (canAccessRoute(perms, '')) return base
  for (const [key, perm] of Object.entries(ROUTE_PERMISSION)) {
    if (perm && hasPermission(perms, perm)) {
      return key ? `${base}/${key}` : base
    }
  }
  return base
}

export function permissionsLabel(perms: string[]): string {
  if (perms.includes('*')) return 'Administrador'
  if (perms.length === 0) return 'Sin permisos'
  return perms.map((p) => PERMISSION_META[p as Permission]?.label ?? p).join(' · ')
}

export function presetFromPermissions(perms: string[]): string | null {
  const sorted = [...perms].sort().join(',')
  const match = ROLE_PRESETS.find((r) => [...r.permissions].sort().join(',') === sorted)
  return match?.id ?? null
}
