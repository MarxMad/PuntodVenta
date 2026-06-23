import QR from 'qrcode'
import type { Product } from './types'
import { formatMoney } from './format'

// Abre una ventana de impresión con una etiqueta lista para pegar al producto:
// QR + nombre + precio + SKU. Puedes imprimir una o varias copias.
export async function printLabel(product: Product, copies = 1) {
  const qrDataUrl = await QR.toDataURL(product.sku, {
    width: 360,
    margin: 1,
    color: { dark: '#000000', light: '#FFFFFF' },
  })

  const label = `
    <div class="label">
      <img src="${qrDataUrl}" />
      <div class="info">
        <div class="brand">Caprichitos</div>
        <div class="name">${escapeHtml(product.name)}</div>
        <div class="price">${formatMoney(product.price)}</div>
        <div class="sku">${product.sku}</div>
      </div>
    </div>`

  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Etiqueta ${product.sku}</title>
    <style>
      @page { margin: 8mm; }
      body { font-family: 'Nunito', system-ui, sans-serif; margin: 0; padding: 12px; }
      .sheet { display: flex; flex-wrap: wrap; gap: 10px; }
      .label {
        display: flex; align-items: center; gap: 12px; border: 1px dashed #d9c0cc;
        border-radius: 10px; padding: 10px 14px; width: 260px; box-sizing: border-box;
        page-break-inside: avoid;
      }
      .label img { width: 96px; height: 96px; }
      .info { display: flex; flex-direction: column; }
      .brand { font-size: 11px; font-weight: 700; color: #C04F7E; letter-spacing: .4px; }
      .name { font-size: 14px; font-weight: 700; color: #333; line-height: 1.2; margin: 2px 0; }
      .price { font-size: 18px; font-weight: 700; color: #C04F7E; }
      .sku { font-family: monospace; font-size: 12px; color: #777; margin-top: 3px; }
    </style></head>
    <body><div class="sheet">${label.repeat(Math.max(1, copies))}</div>
    <script>window.onload = () => { window.print(); }<\/script>
    </body></html>`

  const w = window.open('', '_blank', 'width=420,height=560')
  if (!w) {
    alert('Permite las ventanas emergentes para imprimir la etiqueta.')
    return
  }
  w.document.write(html)
  w.document.close()
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!))
}

/** Imprime una hoja (o varias) con etiquetas QR de varios productos en cuadrícula. */
export async function printLabelSheet(products: Product[]) {
  if (products.length === 0) {
    alert('No hay productos seleccionados para imprimir.')
    return
  }

  const labels = await Promise.all(
    products.map(async (product) => {
      const qrDataUrl = await QR.toDataURL(product.sku, {
        width: 200,
        margin: 1,
        color: { dark: '#000000', light: '#FFFFFF' },
      })
      return `
    <div class="label">
      <img src="${qrDataUrl}" alt="" />
      <div class="name">${escapeHtml(product.name)}</div>
      <div class="price">${formatMoney(product.price)}</div>
      <div class="sku">${product.sku}</div>
    </div>`
    }),
  )

  const html = `<!DOCTYPE html><html lang="es"><head><meta charset="utf-8"><title>Etiquetas QR · Caprichitos</title>
    <style>
      @page { size: letter; margin: 10mm; }
      * { box-sizing: border-box; }
      body { font-family: 'Nunito', system-ui, sans-serif; margin: 0; padding: 0; }
      h1 { font-size: 14px; font-weight: 700; color: #C04F7E; margin: 0 0 10px; }
      .meta { font-size: 11px; color: #888; margin-bottom: 12px; }
      .sheet {
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        gap: 6px;
      }
      .label {
        display: flex; flex-direction: column; align-items: center; text-align: center;
        border: 1px dashed #d9c0cc; border-radius: 6px;
        padding: 6px 4px; page-break-inside: avoid;
        min-height: 0;
      }
      .label img { width: 56px; height: 56px; flex: none; }
      .name { font-size: 9px; font-weight: 700; color: #333; line-height: 1.15; margin-top: 4px; word-break: break-word; max-width: 100%; }
      .price { font-size: 11px; font-weight: 700; color: #C04F7E; margin-top: 2px; }
      .sku { font-family: monospace; font-size: 7px; color: #777; margin-top: 2px; word-break: break-all; line-height: 1.1; }
      @media print {
        h1, .meta { display: none; }
        .sheet { gap: 4px; }
      }
    </style></head>
    <body>
      <h1>Caprichitos · Etiquetas QR</h1>
      <div class="meta">${products.length} producto${products.length === 1 ? '' : 's'} · ${new Date().toLocaleDateString('es-MX')}</div>
      <div class="sheet">${labels.join('')}</div>
      <script>window.onload = () => { window.print(); }<\/script>
    </body></html>`

  const w = window.open('', '_blank', 'width=800,height=700')
  if (!w) {
    alert('Permite las ventanas emergentes para imprimir las etiquetas.')
    return
  }
  w.document.write(html)
  w.document.close()
}
