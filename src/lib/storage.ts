import { supabase, isCloud } from './supabase'

const BUCKET = 'productos'
const MAX_SIZE = 1100 // lado máximo en px (se reduce para no pesar tanto)
const QUALITY = 0.82

// Reduce y comprime una imagen en el navegador antes de guardarla.
// Devuelve un Blob JPEG y su versión dataURL (para el modo local).
async function processImage(file: File | Blob): Promise<{ blob: Blob; dataUrl: string }> {
  const bitmap = await createImageBitmap(file)
  let { width, height } = bitmap
  if (width > MAX_SIZE || height > MAX_SIZE) {
    const scale = MAX_SIZE / Math.max(width, height)
    width = Math.round(width * scale)
    height = Math.round(height * scale)
  }
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')!
  ctx.drawImage(bitmap, 0, 0, width, height)
  bitmap.close?.()

  const dataUrl = canvas.toDataURL('image/jpeg', QUALITY)
  const blob = await new Promise<Blob>((resolve) =>
    canvas.toBlob((b) => resolve(b!), 'image/jpeg', QUALITY),
  )
  return { blob, dataUrl }
}

// Sube la imagen y devuelve una URL para guardar en el producto.
//  • Modo NUBE  → la sube a Supabase Storage (bucket "productos") y devuelve su URL pública.
//  • Modo LOCAL → devuelve un dataURL para guardarlo en el navegador.
export async function uploadProductImage(file: File | Blob): Promise<string> {
  const { blob, dataUrl } = await processImage(file)

  if (!isCloud) return dataUrl

  const path = `${crypto.randomUUID()}.jpg`
  const { error } = await supabase!.storage.from(BUCKET).upload(path, blob, {
    contentType: 'image/jpeg',
    upsert: false,
  })
  if (error) throw new Error('No se pudo subir la imagen: ' + error.message)

  const { data } = supabase!.storage.from(BUCKET).getPublicUrl(path)
  return data.publicUrl
}
