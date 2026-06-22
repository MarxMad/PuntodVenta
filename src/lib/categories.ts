// Categorías de Caprichitos. Cada una tiene un prefijo de 3 letras para el SKU.
export interface Category {
  id: string
  label: string
  prefix: string
  emoji: string
}

export const CATEGORIES: Category[] = [
  { id: 'papeleria', label: 'Papelería', prefix: 'PAP', emoji: '✏️' },
  { id: 'cosmeticos', label: 'Cosméticos', prefix: 'COS', emoji: '💄' },
  { id: 'juguetes', label: 'Juguetes', prefix: 'JUG', emoji: '🧸' },
  { id: 'dulces', label: 'Dulces', prefix: 'DUL', emoji: '🍬' },
  { id: 'ropa', label: 'Ropa', prefix: 'ROP', emoji: '👕' },
  { id: 'mochilas', label: 'Mochilas', prefix: 'MOC', emoji: '🎒' },
  { id: 'perfumes', label: 'Perfumes', prefix: 'PER', emoji: '🌸' },
  { id: 'joyeria', label: 'Joyería', prefix: 'JOY', emoji: '💍' },
  { id: 'vending', label: 'Máquinas vending', prefix: 'VEN', emoji: '🪙' },
  { id: 'bolsas_regalo', label: 'Bolsas de regalo', prefix: 'BOL', emoji: '🎁' },
  { id: 'salud', label: 'Productos de salud', prefix: 'SAL', emoji: '🩹' },
]

export function categoryById(id: string): Category | undefined {
  return CATEGORIES.find((c) => c.id === id)
}

export function categoryLabel(id: string): string {
  return categoryById(id)?.label ?? id
}
