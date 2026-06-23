import { supabase, isCloud } from './supabase'
import type { CashSession, Collection, CreateSaleParams, Machine, MachineType, Order, OrderItem, Product, Sale, SaleItem, SessionInfo, StaffMember } from './types'
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
  createSale(params: CreateSaleParams): Promise<Sale>
  voidSale(id: string): Promise<void>

  getOpenCashSession(): Promise<CashSession | null>
  openCashSession(openingCash: number, openedByName: string, openedByEmail: string): Promise<CashSession>
  closeCashSession(id: string, closingCash: number, notes?: string): Promise<CashSession>
  listCashSessions(): Promise<CashSession[]>

  listOrders(): Promise<Order[]>
  createOrder(supplier: string, items: OrderItem[]): Promise<Order>
  receiveOrder(id: string): Promise<void>

  listMachines(): Promise<Machine[]>
  createMachines(location: string, items: Array<{ name: string; type: MachineType }>): Promise<Machine[]>
  updateMachine(id: string, patch: Partial<Machine>): Promise<Machine>
  deleteMachine(id: string): Promise<void>

  listCollections(): Promise<Collection[]>
  createCollection(machineId: string, amount: number, collectedAt: string, notes: string): Promise<Collection>

  listStaff(): Promise<StaffMember[]>
  createStaff(email: string, password: string, name: string, permissions: string[]): Promise<StaffMember>
  updateStaff(id: string, name: string, permissions: string[], active: boolean): Promise<void>
  resetStaffPassword(id: string, password: string): Promise<void>
  getSessionInfo(): Promise<SessionInfo>
  localSignIn(email: string, password: string): Promise<SessionInfo | null>
}

const uid = () =>
  (crypto.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(16).slice(2)}`)

// ── Implementación LOCAL ──────────────────────────────────────────────────────
const KEYS = {
  products: 'cap.products', sales: 'cap.sales', orders: 'cap.orders',
  machines: 'cap.machines', collections: 'cap.collections', staff: 'cap.staff',
  cashSessions: 'cap.cashSessions',
}

function normalizeSale(s: Sale): Sale {
  const subtotal = s.subtotal ?? s.items.reduce((sum, i) => sum + i.price * i.qty - (i.lineDiscount ?? 0), 0)
  return {
    ...s,
    subtotal,
    discount: s.discount ?? 0,
    soldByName: s.soldByName ?? '',
    soldByEmail: s.soldByEmail ?? '',
    status: s.status ?? 'completed',
    voidedAt: s.voidedAt ?? null,
    cashSessionId: s.cashSessionId ?? null,
  }
}

function toSale(r: Row): Sale {
  const items = (r.items as SaleItem[]) ?? []
  const total = Number(r.total)
  return normalizeSale({
    id: r.id as string,
    items,
    subtotal: Number(r.subtotal ?? total),
    discount: Number(r.discount ?? 0),
    total,
    paymentMethod: r.payment_method as Sale['paymentMethod'],
    soldByName: (r.sold_by_name as string) ?? '',
    soldByEmail: (r.sold_by_email as string) ?? '',
    status: (r.status as Sale['status']) ?? 'completed',
    voidedAt: (r.voided_at as string) ?? null,
    cashSessionId: (r.cash_session_id as string) ?? null,
    createdAt: r.created_at as string,
  })
}

function toCashSession(r: Row): CashSession {
  return {
    id: r.id as string,
    openedByName: r.opened_by_name as string,
    openedByEmail: (r.opened_by_email as string) ?? '',
    openingCash: Number(r.opening_cash),
    openedAt: r.opened_at as string,
    closedAt: (r.closed_at as string) ?? null,
    closingCash: r.closing_cash != null ? Number(r.closing_cash) : null,
    expectedCash: r.expected_cash != null ? Number(r.expected_cash) : null,
    notes: (r.notes as string) ?? '',
    status: (r.status as CashSession['status']) ?? 'open',
  }
}

type LocalStaffRow = StaffMember & { password: string }

const toStaff = (r: LocalStaffRow): StaffMember => ({
  id: r.id, userId: r.userId, email: r.email, name: r.name,
  permissions: r.permissions, active: r.active, createdAt: r.createdAt,
})

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
    return read<Sale[]>(KEYS.sales, []).map(normalizeSale)
      .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
  },
  async createSale(params) {
    const sale: Sale = {
      id: uid(),
      items: params.items,
      subtotal: params.subtotal,
      discount: params.discount,
      total: params.total,
      paymentMethod: params.paymentMethod,
      soldByName: params.soldByName,
      soldByEmail: params.soldByEmail,
      status: 'completed',
      voidedAt: null,
      cashSessionId: params.cashSessionId ?? null,
      createdAt: new Date().toISOString(),
    }
    write(KEYS.sales, [sale, ...read<Sale[]>(KEYS.sales, [])])
    for (const item of params.items) await this.adjustStock(item.productId, -item.qty)
    return sale
  },
  async voidSale(id) {
    const sales = read<Sale[]>(KEYS.sales, []).map(normalizeSale)
    const idx = sales.findIndex((s) => s.id === id)
    if (idx === -1) throw new Error('Venta no encontrada')
    if (sales[idx].status === 'voided') throw new Error('Esta venta ya fue cancelada')
    for (const item of sales[idx].items) await this.adjustStock(item.productId, item.qty)
    sales[idx] = { ...sales[idx], status: 'voided', voidedAt: new Date().toISOString() }
    write(KEYS.sales, sales)
  },

  async getOpenCashSession() {
    return read<CashSession[]>(KEYS.cashSessions, []).find((s) => s.status === 'open') ?? null
  },
  async openCashSession(openingCash, openedByName, openedByEmail) {
    const open = await this.getOpenCashSession()
    if (open) throw new Error('Ya hay una caja abierta. Ciérrala antes de abrir otra.')
    const session: CashSession = {
      id: uid(),
      openedByName,
      openedByEmail,
      openingCash,
      openedAt: new Date().toISOString(),
      closedAt: null,
      closingCash: null,
      expectedCash: null,
      notes: '',
      status: 'open',
    }
    write(KEYS.cashSessions, [session, ...read<CashSession[]>(KEYS.cashSessions, [])])
    return session
  },
  async closeCashSession(id, closingCash, notes = '') {
    const all = read<CashSession[]>(KEYS.cashSessions, [])
    const idx = all.findIndex((s) => s.id === id)
    if (idx === -1) throw new Error('Corte de caja no encontrado')
    const sales = await this.listSales()
    const efectivo = sales
      .filter((s) => s.cashSessionId === id && s.status === 'completed' && s.paymentMethod === 'efectivo')
      .reduce((sum, s) => sum + s.total, 0)
    const expectedCash = all[idx].openingCash + efectivo
    all[idx] = {
      ...all[idx],
      status: 'closed',
      closedAt: new Date().toISOString(),
      closingCash,
      expectedCash,
      notes,
    }
    write(KEYS.cashSessions, all)
    return all[idx]
  },
  async listCashSessions() {
    return read<CashSession[]>(KEYS.cashSessions, [])
      .sort((a, b) => (a.openedAt < b.openedAt ? 1 : -1))
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

  async listStaff() {
    return read<LocalStaffRow[]>(KEYS.staff, []).map(toStaff)
      .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
  },
  async createStaff(email, password, name, permissions) {
    const all = read<LocalStaffRow[]>(KEYS.staff, [])
    if (all.some((s) => s.email.toLowerCase() === email.toLowerCase())) {
      throw new Error('Ya existe un colaborador con ese correo.')
    }
    const row: LocalStaffRow = {
      id: uid(), userId: null, email: email.toLowerCase().trim(), name: name.trim(),
      permissions, active: true, createdAt: new Date().toISOString(), password,
    }
    write(KEYS.staff, [row, ...all])
    return toStaff(row)
  },
  async updateStaff(id, name, permissions, active) {
    const all = read<LocalStaffRow[]>(KEYS.staff, [])
    const idx = all.findIndex((s) => s.id === id)
    if (idx === -1) throw new Error('Colaborador no encontrado')
    all[idx] = { ...all[idx], name: name.trim(), permissions, active }
    write(KEYS.staff, all)
  },
  async resetStaffPassword(id, password) {
    const all = read<LocalStaffRow[]>(KEYS.staff, [])
    const idx = all.findIndex((s) => s.id === id)
    if (idx === -1) throw new Error('Colaborador no encontrado')
    all[idx].password = password
    write(KEYS.staff, all)
  },
  async getSessionInfo() {
    const cached = sessionStorage.getItem('cap.session')
    if (cached) return JSON.parse(cached) as SessionInfo
    return { email: 'admin@local', name: 'Administrador', permissions: ['*'] }
  },
  async localSignIn(email, password) {
    const member = read<LocalStaffRow[]>(KEYS.staff, []).find(
      (s) => s.active && s.email.toLowerCase() === email.toLowerCase().trim() && s.password === password,
    )
    if (!member) return null
    return { email: member.email, name: member.name, permissions: member.permissions }
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
    return (data ?? []).map(toSale)
  },
  async createSale(params) {
    const { data, error } = await supabase!
      .from('sales')
      .insert({
        items: params.items,
        subtotal: params.subtotal,
        discount: params.discount,
        total: params.total,
        payment_method: params.paymentMethod,
        sold_by_name: params.soldByName,
        sold_by_email: params.soldByEmail,
        cash_session_id: params.cashSessionId ?? null,
        status: 'completed',
      })
      .select()
      .single()
    if (error) throw error
    for (const item of params.items) await this.adjustStock(item.productId, -item.qty)
    return toSale(data)
  },
  async voidSale(id) {
    const { error } = await supabase!.rpc('void_sale', { p_id: id })
    if (error) throw error
  },

  async getOpenCashSession() {
    const { data, error } = await supabase!
      .from('cash_sessions')
      .select('*')
      .eq('status', 'open')
      .maybeSingle()
    if (error) throw error
    return data ? toCashSession(data) : null
  },
  async openCashSession(openingCash, openedByName, openedByEmail) {
    const { data, error } = await supabase!
      .from('cash_sessions')
      .insert({
        opening_cash: openingCash,
        opened_by_name: openedByName,
        opened_by_email: openedByEmail,
        status: 'open',
      })
      .select()
      .single()
    if (error) throw error
    return toCashSession(data)
  },
  async closeCashSession(id, closingCash, notes = '') {
    const { data: row, error: fetchErr } = await supabase!.from('cash_sessions').select('*').eq('id', id).single()
    if (fetchErr) throw fetchErr
    const sales = await this.listSales()
    const efectivo = sales
      .filter((s) => s.cashSessionId === id && s.status === 'completed' && s.paymentMethod === 'efectivo')
      .reduce((sum, s) => sum + s.total, 0)
    const expectedCash = Number(row.opening_cash) + efectivo
    const { data, error } = await supabase!
      .from('cash_sessions')
      .update({
        status: 'closed',
        closed_at: new Date().toISOString(),
        closing_cash: closingCash,
        expected_cash: expectedCash,
        notes,
      })
      .eq('id', id)
      .select()
      .single()
    if (error) throw error
    return toCashSession(data)
  },
  async listCashSessions() {
    const { data, error } = await supabase!.from('cash_sessions').select('*').order('opened_at', { ascending: false })
    if (error) throw error
    return (data ?? []).map(toCashSession)
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

  async listStaff() {
    const { data, error } = await supabase!.from('staff').select('*').order('created_at', { ascending: false })
    if (error) throw error
    return (data ?? []).map((r: Row) => ({
      id: r.id as string,
      userId: (r.user_id as string) ?? null,
      email: r.email as string,
      name: r.name as string,
      permissions: (r.permissions as string[]) ?? [],
      active: Boolean(r.active),
      createdAt: r.created_at as string,
    }))
  },
  async createStaff(email, password, name, permissions) {
    const { data, error } = await supabase!.rpc('create_collaborator', {
      p_email: email, p_password: password, p_name: name, p_permissions: permissions,
    })
    if (error) throw error
    const list = await this.listStaff()
    return list.find((s) => s.id === data) ?? list[0]
  },
  async updateStaff(id, name, permissions, active) {
    const { error } = await supabase!.rpc('update_collaborator', {
      p_id: id, p_name: name, p_permissions: permissions, p_active: active,
    })
    if (error) throw error
  },
  async resetStaffPassword(id, password) {
    const { error } = await supabase!.rpc('reset_collaborator_password', { p_id: id, p_password: password })
    if (error) throw error
  },
  async getSessionInfo() {
    const { data: userData } = await supabase!.auth.getUser()
    const email = userData.user?.email ?? ''
    const { data: perms, error: permErr } = await supabase!.rpc('get_my_permissions')
    if (permErr) throw permErr
    const permissions = (perms as string[]) ?? ['*']
    const { data: row } = await supabase!
      .from('staff')
      .select('name')
      .eq('user_id', userData.user?.id ?? '')
      .maybeSingle()
    const name = (row?.name as string) ?? email.split('@')[0] ?? 'Usuario'
    return { email, name, permissions }
  },
  async localSignIn() {
    return null
  },
}

export const db: DB = isCloud ? cloudDB : localDB
