import { categoryById } from './categories'

// Genera un SKU único tipo "CAP-PAP-7K3Q":
//   CAP  = marca Caprichitos
//   PAP  = prefijo de la categoría
//   7K3Q = código aleatorio de 4 caracteres (sin letras/números ambiguos)
const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789' // sin I, O, 0, 1

function randomCode(len: number): string {
  let out = ''
  for (let i = 0; i < len; i++) {
    out += ALPHABET[Math.floor(Math.random() * ALPHABET.length)]
  }
  return out
}

export function generateSku(categoryId: string, existing: string[] = []): string {
  const prefix = categoryById(categoryId)?.prefix ?? 'GEN'
  let sku = ''
  do {
    sku = `CAP-${prefix}-${randomCode(4)}`
  } while (existing.includes(sku))
  return sku
}
