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
