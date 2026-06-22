// Tipos centrales de Caprichitos

export interface Product {
  id: string
  sku: string
  name: string
  description: string
  category: string
  price: number // precio de venta
  cost: number // costo (para calcular ganancia y valor de inventario)
  stock: number
  imageUrl: string | null
  active: boolean // si aparece o no en el catálogo público
  createdAt: string
}

export interface SaleItem {
  productId: string
  sku: string
  name: string
  price: number
  qty: number
}

export interface Sale {
  id: string
  items: SaleItem[]
  total: number
  paymentMethod: 'efectivo' | 'tarjeta' | 'transferencia' | 'otro'
  createdAt: string
}

export type OrderStatus = 'pendiente' | 'en_camino' | 'recibido'

export interface OrderItem {
  sku: string
  name: string
  qty: number
  cost: number
}

export interface Order {
  id: string
  supplier: string
  items: OrderItem[]
  status: OrderStatus
  createdAt: string
  receivedAt: string | null
}

// Datos para crear un producto (sin los campos que se generan solos)
export type NewProduct = Omit<Product, 'id' | 'sku' | 'createdAt'> & {
  sku?: string
}

// ── Máquinas (vending / peluche) ─────────────────────────────────────────────
export type MachineType = 'individual' | 'doble' | 'triple' | 'peluche'

export interface Machine {
  id: string
  name: string
  location: string
  type: MachineType
  active: boolean
  createdAt: string
}

export interface Collection {
  id: string
  machineId: string
  amount: number
  collectedAt: string // fecha de la recolección (YYYY-MM-DD)
  notes: string
  createdAt: string
}
