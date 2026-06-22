import { supabase, isCloud } from './supabase'
import type { Collection, Machine, MachineType, Order, OrderItem, Product, Sale, SaleItem } from './types'
import { generateSku } from './sku'

// ── Capa de datos ────────────────────────────────────────────────────────────
// Una sola interfaz (`db`) con dos implementaciones intercambiables:
//   • LOCAL    → guarda en el navegador (localStorage). Activo si no hay llaves.
//   • SUPABASE → guarda en la nube. Activo en cuanto configuras el .env.
// El resto de la app no necesita saber cuál se está usando.

export interface DB {
  listProducts(): Promise<Product[]>
  getProductBySku(sku: string): Promise<Product | null>
  createProduct(data: Omit<Product, 'id' | 'sku' | 'createdAt'>): Promise<Product>
  updateProduct(id: string, patch: Partial<Product>): Promise<Product>
  deleteProduct(id: string): Promise<void>
  adjustStock(id: string, delta: number): Promise<void>

  listSales(): Promise<Sale[]>
  createSale(items: SaleItem[], paymentMethod: Sale['paymentMethod']): Promise<Sale>

  listOrders(): Promise<Order[]>
  createOrder(supplier: string, items: OrderItem[]): Promise<Order>
  receiveOrder(id: string): Promise<void>

  listMachines(): Promise<Machine[]>
  createMachines(location: string, items: Array<{ name: string; type: MachineType }>): Promise<Machine[]>
  updateMachine(id: string, patch: Partial<Machine>): Promise<Machine>
  deleteMachine(id: string): Promise<void>

  listCollections(): Promise<Collection[]>
  createCollection(machineId: string, amount: number, collectedAt: string, notes: string): Promise<Collection>
}

const uid = () =>
  (crypto.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(16).slice(2)}`)

// ── Implementación LOCAL ──────────────────────────────────────────────────────
const KEYS = {
  products: 'cap.products', sales: 'cap.sales', orders: 'cap.orders',
  machines: 'cap.machines', collections: 'cap.collections',
}

function read<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : fallback
  } catch {
    return fallback
  }
}
function write<T>(key: string, value: T) {
  localStorage.setItem(key, JSON.stringify(value))
}

function seedProducts(): Product[] {
  const now = new Date().toISOString()
  const base: Array<Omit<Product, 'id' | 'sku' | 'createdAt'>> = [
    { name: 'Cuaderno profesional rayado', description: '100 hojas, pasta dura rosa.', category: 'papeleria', price: 45, cost: 22, stock: 30, imageUrl: null, active: true },
    { name: 'Labial mate larga duración', description: 'Tono coral. No transfiere.', category: 'cosmeticos', price: 89, cost: 38, stock: 18, imageUrl: null, active: true },
    { name: 'Peluche conejito 25 cm', description: 'Suave y abrazable.', category: 'juguetes', price: 159, cost: 70, stock: 9, imageUrl: null, active: true },
    { name: 'Paleta de caramelo surtida', description: 'Bolsa con 12 piezas.', category: 'dulces', price: 35, cost: 14, stock: 4, imageUrl: null, active: true },
    { name: 'Mochila escolar pastel', description: 'Resistente al agua, 3 compartimentos.', category: 'mochilas', price: 349, cost: 180, stock: 7, imageUrl: null, active: true },
    { name: 'Perfume floral 50ml', description: 'Aroma fresco de primavera.', category: 'perfumes', price: 420, cost: 210, stock: 12, imageUrl: null, active: true },
    { name: 'Parche caliente lumbar', description: 'Alivio del dolor por 8 horas.', category: 'salud', price: 28, cost: 11, stock: 40, imageUrl: null, active: true },
    { name: 'Collar corazón dorado', description: 'Baño de oro, hipoalergénico.', category: 'joyeria', price: 120, cost: 55, stock: 15, imageUrl: null, active: true },
  ]
  const skus: string[] = []
  const products = base.map((b) => {
    const sku = generateSku(b.category, skus)
    skus.push(sku)
    return { ...b, id: uid(), sku, createdAt: now }
  })
  write(KEYS.products, products)
  return products
}

const localDB: DB = {
  async listProducts() {
    let products = read<Product[]>(KEYS.products, [])
    if (products.length === 0 && localStorage.getItem(KEYS.products) === null) {
      products = seedProducts()
    }
    return [...products].sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
  },
  async getProductBySku(sku) {
    const products = await this.listProducts()
    return products.find((p) => p.sku.toLowerCase() === sku.toLowerCase()) ?? null
  },
  async createProduct(data) {
    const products = read<Product[]>(KEYS.products, [])
    const sku = generateSku(data.category, products.map((p) => p.sku))
    const product: Product = { ...data, id: uid(), sku, createdAt: new Date().toISOString() }
    write(KEYS.products, [product, ...products])
    return product
  },
  async updateProduct(id, patch) {
    const products = read<Product[]>(KEYS.products, [])
    const idx = products.findIndex((p) => p.id === id)
    if (idx === -1) throw new Error('Producto no encontrado')
    products[idx] = { ...products[idx], ...patch, id }
    write(KEYS.products, products)
    return products[idx]
  },
  async deleteProduct(id) {
    write(KEYS.products, read<Product[]>(KEYS.products, []).filter((p) => p.id !== id))
  },
  async adjustStock(id, delta) {
    const products = read<Product[]>(KEYS.products, [])
    const idx = products.findIndex((p) => p.id === id)
    if (idx === -1) return
    products[idx].stock = Math.max(0, products[idx].stock + delta)
    write(KEYS.products, products)
  },

  async listSales() {
    return read<Sale[]>(KEYS.sales, []).sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
  },
  async createSale(items, paymentMethod) {
    const total = items.reduce((s, i) => s + i.price * i.qty, 0)
    const sale: Sale = { id: uid(), items, total, paymentMethod, createdAt: new Date().toISOString() }
    write(KEYS.sales, [sale, ...read<Sale[]>(KEYS.sales, [])])
    // Descuenta stock
    for (const item of items) await this.adjustStock(item.productId, -item.qty)
    return sale
  },

  async listOrders() {
    return read<Order[]>(KEYS.orders, []).sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
  },
  async createOrder(supplier, items) {
    const order: Order = {
      id: uid(), supplier, items, status: 'pendiente',
      createdAt: new Date().toISOString(), receivedAt: null,
    }
    write(KEYS.orders, [order, ...read<Order[]>(KEYS.orders, [])])
    return order
  },
  async receiveOrder(id) {
    const orders = read<Order[]>(KEYS.orders, [])
    const order = orders.find((o) => o.id === id)
    if (!order) return
    order.status = 'recibido'
    order.receivedAt = new Date().toISOString()
    write(KEYS.orders, orders)
    // Suma el stock recibido a los productos que coincidan por SKU
    const products = read<Product[]>(KEYS.products, [])
    for (const item of order.items) {
      const p = products.find((p) => p.sku === item.sku)
      if (p) p.stock += item.qty
    }
    write(KEYS.products, products)
  },

  async listMachines() {
    return read<Machine[]>(KEYS.machines, []).sort((a, b) =>
      a.location === b.location ? (a.name < b.name ? -1 : 1) : a.location < b.location ? -1 : 1,
    )
  },
  async createMachines(location, items) {
    const all = read<Machine[]>(KEYS.machines, [])
    const created = items.map((it) => ({
      id: uid(), name: it.name, location, type: it.type, active: true, createdAt: new Date().toISOString(),
    }))
    write(KEYS.machines, [...all, ...created])
    return created
  },
  async updateMachine(id, patch) {
    const all = read<Machine[]>(KEYS.machines, [])
    const idx = all.findIndex((m) => m.id === id)
    if (idx === -1) throw new Error('Máquina no encontrada')
    all[idx] = { ...all[idx], ...patch, id }
    write(KEYS.machines, all)
    return all[idx]
  },
  async deleteMachine(id) {
    write(KEYS.machines, read<Machine[]>(KEYS.machines, []).filter((m) => m.id !== id))
    write(KEYS.collections, read<Collection[]>(KEYS.collections, []).filter((c) => c.machineId !== id))
  },

  async listCollections() {
    return read<Collection[]>(KEYS.collections, []).sort((a, b) => (a.collectedAt < b.collectedAt ? 1 : -1))
  },
  async createCollection(machineId, amount, collectedAt, notes) {
    const c: Collection = { id: uid(), machineId, amount, collectedAt, notes, createdAt: new Date().toISOString() }
    write(KEYS.collections, [c, ...read<Collection[]>(KEYS.collections, [])])
    return c
  },
}

// ── Implementación SUPABASE ───────────────────────────────────────────────────
type Row = Record<string, unknown>
const toProduct = (r: Row): Product => ({
  id: r.id as string,
  sku: r.sku as string,
  name: r.name as string,
  description: (r.description as string) ?? '',
  category: r.category as string,
  price: Number(r.price),
  cost: Number(r.cost),
  stock: Number(r.stock),
  imageUrl: (r.image_url as string) ?? null,
  active: Boolean(r.active),
  createdAt: r.created_at as string,
})

const cloudDB: DB = {
  async listProducts() {
    const { data, error } = await supabase!.from('products').select('*').order('created_at', { ascending: false })
    if (error) throw error
    return (data ?? []).map(toProduct)
  },
  async getProductBySku(sku) {
    const { data, error } = await supabase!.from('products').select('*').ilike('sku', sku).maybeSingle()
    if (error) throw error
    return data ? toProduct(data) : null
  },
  async createProduct(data) {
    const products = await this.listProducts()
    const sku = generateSku(data.category, products.map((p) => p.sku))
    const { data: row, error } = await supabase!
      .from('products')
      .insert({
        sku, name: data.name, description: data.description, category: data.category,
        price: data.price, cost: data.cost, stock: data.stock,
        image_url: data.imageUrl, active: data.active,
      })
      .select()
      .single()
    if (error) throw error
    return toProduct(row)
  },
  async updateProduct(id, patch) {
    const row: Row = {}
    if (patch.name !== undefined) row.name = patch.name
    if (patch.description !== undefined) row.description = patch.description
    if (patch.category !== undefined) row.category = patch.category
    if (patch.price !== undefined) row.price = patch.price
    if (patch.cost !== undefined) row.cost = patch.cost
    if (patch.stock !== undefined) row.stock = patch.stock
    if (patch.imageUrl !== undefined) row.image_url = patch.imageUrl
    if (patch.active !== undefined) row.active = patch.active
    const { data, error } = await supabase!.from('products').update(row).eq('id', id).select().single()
    if (error) throw error
    return toProduct(data)
  },
  async deleteProduct(id) {
    const { error } = await supabase!.from('products').delete().eq('id', id)
    if (error) throw error
  },
  async adjustStock(id, delta) {
    const { error } = await supabase!.rpc('adjust_stock', { p_id: id, p_delta: delta })
    if (error) throw error
  },

  async listSales() {
    const { data, error } = await supabase!.from('sales').select('*').order('created_at', { ascending: false })
    if (error) throw error
    return (data ?? []).map((r: Row) => ({
      id: r.id as string,
      items: (r.items as SaleItem[]) ?? [],
      total: Number(r.total),
      paymentMethod: r.payment_method as Sale['paymentMethod'],
      createdAt: r.created_at as string,
    }))
  },
  async createSale(items, paymentMethod) {
    const total = items.reduce((s, i) => s + i.price * i.qty, 0)
    const { data, error } = await supabase!
      .from('sales')
      .insert({ items, total, payment_method: paymentMethod })
      .select()
      .single()
    if (error) throw error
    for (const item of items) await this.adjustStock(item.productId, -item.qty)
    return { id: data.id, items, total, paymentMethod, createdAt: data.created_at }
  },

  async listOrders() {
    const { data, error } = await supabase!.from('orders').select('*').order('created_at', { ascending: false })
    if (error) throw error
    return (data ?? []).map((r: Row) => ({
      id: r.id as string,
      supplier: r.supplier as string,
      items: (r.items as OrderItem[]) ?? [],
      status: r.status as Order['status'],
      createdAt: r.created_at as string,
      receivedAt: (r.received_at as string) ?? null,
    }))
  },
  async createOrder(supplier, items) {
    const { data, error } = await supabase!
      .from('orders')
      .insert({ supplier, items, status: 'pendiente' })
      .select()
      .single()
    if (error) throw error
    return { id: data.id, supplier, items, status: 'pendiente', createdAt: data.created_at, receivedAt: null }
  },
  async receiveOrder(id) {
    const { error } = await supabase!.rpc('receive_order', { p_id: id })
    if (error) throw error
  },

  async listMachines() {
    const { data, error } = await supabase!.from('machines').select('*').order('location').order('name')
    if (error) throw error
    return (data ?? []).map((r: Row) => ({
      id: r.id as string, name: r.name as string, location: (r.location as string) ?? '',
      type: r.type as MachineType, active: Boolean(r.active), createdAt: r.created_at as string,
    }))
  },
  async createMachines(location, items) {
    const rows = items.map((it) => ({ name: it.name, location, type: it.type }))
    const { data, error } = await supabase!.from('machines').insert(rows).select()
    if (error) throw error
    return (data ?? []).map((r: Row) => ({
      id: r.id as string, name: r.name as string, location: (r.location as string) ?? '',
      type: r.type as MachineType, active: Boolean(r.active), createdAt: r.created_at as string,
    }))
  },
  async updateMachine(id, patch) {
    const row: Row = {}
    if (patch.name !== undefined) row.name = patch.name
    if (patch.location !== undefined) row.location = patch.location
    if (patch.type !== undefined) row.type = patch.type
    if (patch.active !== undefined) row.active = patch.active
    const { data, error } = await supabase!.from('machines').update(row).eq('id', id).select().single()
    if (error) throw error
    return {
      id: data.id, name: data.name, location: data.location ?? '',
      type: data.type, active: Boolean(data.active), createdAt: data.created_at,
    }
  },
  async deleteMachine(id) {
    const { error } = await supabase!.from('machines').delete().eq('id', id)
    if (error) throw error
  },

  async listCollections() {
    const { data, error } = await supabase!.from('collections').select('*').order('collected_at', { ascending: false })
    if (error) throw error
    return (data ?? []).map((r: Row) => ({
      id: r.id as string, machineId: r.machine_id as string, amount: Number(r.amount),
      collectedAt: r.collected_at as string, notes: (r.notes as string) ?? '', createdAt: r.created_at as string,
    }))
  },
  async createCollection(machineId, amount, collectedAt, notes) {
    const { data, error } = await supabase!
      .from('collections')
      .insert({ machine_id: machineId, amount, collected_at: collectedAt, notes })
      .select()
      .single()
    if (error) throw error
    return { id: data.id, machineId, amount, collectedAt, notes, createdAt: data.created_at }
  },
}

export const db: DB = isCloud ? cloudDB : localDB
