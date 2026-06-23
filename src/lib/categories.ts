// Categorías de Caprichitos. Cada una tiene un prefijo de 3 letras para el SKU.
export type CategoryIconName =
  | 'pencil'
  | 'sparkles'
  | 'blocks'
  | 'candy'
  | 'shirt'
  | 'backpack'
  | 'flower'
  | 'gem'
  | 'coins'
  | 'gift'
  | 'bandage'
  | 'ribbon'

export interface Category {
  id: string
  label: string
  prefix: string
  icon: CategoryIconName
}

export const CATEGORIES: Category[] = [
  { id: 'papeleria', label: 'Papelería', prefix: 'PAP', icon: 'pencil' },
  { id: 'cosmeticos', label: 'Cosméticos', prefix: 'COS', icon: 'sparkles' },
  { id: 'juguetes', label: 'Juguetes', prefix: 'JUG', icon: 'blocks' },
  { id: 'dulces', label: 'Dulces', prefix: 'DUL', icon: 'candy' },
  { id: 'ropa', label: 'Ropa', prefix: 'ROP', icon: 'shirt' },
  { id: 'mochilas', label: 'Mochilas', prefix: 'MOC', icon: 'backpack' },
  { id: 'perfumes', label: 'Perfumes', prefix: 'PER', icon: 'flower' },
  { id: 'joyeria', label: 'Joyería', prefix: 'JOY', icon: 'gem' },
  { id: 'vending', label: 'Máquinas vending', prefix: 'VEN', icon: 'coins' },
  { id: 'bolsas_regalo', label: 'Bolsas de regalo', prefix: 'BOL', icon: 'gift' },
  { id: 'salud', label: 'Productos de salud', prefix: 'SAL', icon: 'bandage' },
]

export function categoryById(id: string): Category | undefined {
  return CATEGORIES.find((c) => c.id === id)
}

export function categoryLabel(id: string): string {
  return categoryById(id)?.label ?? id
}
