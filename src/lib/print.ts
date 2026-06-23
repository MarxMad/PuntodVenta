import QR from 'qrcode'
import type { Product, Sale } from './types'
import { formatMoney, formatDateTime } from './format'
import { lineNet } from './saleCalc'

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

/** Ticket de venta para imprimir o entregar al cliente. */
export function printReceipt(sale: Sale) {
  const voided = sale.status === 'voided'
  const rows = sale.items.map((i) => {
    const net = lineNet(i)
    const disc = i.lineDiscount ? `<div class="disc">−${formatMoney(i.lineDiscount)}</div>` : ''
    return `<tr>
      <td class="qty">${i.qty}</td>
      <td class="name">${escapeHtml(i.name)}${disc}</td>
      <td class="amt">${formatMoney(net)}</td>
    </tr>`
  }).join('')

  const html = `<!DOCTYPE html><html lang="es"><head><meta charset="utf-8"><title>Ticket ${sale.id.slice(0, 8)}</title>
    <style>
      @page { margin: 6mm; size: 80mm auto; }
      body { font-family: 'Nunito', system-ui, sans-serif; margin: 0; padding: 10px; color: #333; max-width: 300px; }
      .brand { text-align: center; font-weight: 800; font-size: 18px; color: #C04F7E; }
      .sub { text-align: center; font-size: 11px; color: #888; margin: 2px 0 10px; }
      .meta { font-size: 11px; color: #666; margin-bottom: 10px; line-height: 1.45; }
      table { width: 100%; border-collapse: collapse; font-size: 12px; }
      td { padding: 5px 0; vertical-align: top; border-bottom: 1px dotted #e8d4de; }
      .qty { width: 24px; font-weight: 700; }
      .name { line-height: 1.25; }
      .amt { text-align: right; font-weight: 700; white-space: nowrap; }
      .disc { font-size: 10px; color: #C04F7E; font-weight: 600; }
      .totals { margin-top: 10px; font-size: 12px; }
      .totals div { display: flex; justify-content: space-between; margin: 4px 0; }
      .total { font-size: 18px; font-weight: 800; color: #C04F7E; border-top: 2px solid #F4DEEA; padding-top: 8px; margin-top: 8px; }
      .void { text-align: center; color: #c0392b; font-weight: 800; font-size: 14px; margin-top: 8px; }
      .thanks { text-align: center; font-size: 11px; color: #888; margin-top: 12px; }
    </style></head><body>
    <div class="brand">Caprichitos</div>
    <div class="sub">Ticket de venta</div>
    <div class="meta">
      ${formatDateTime(sale.createdAt)}<br/>
      Atendió: ${escapeHtml(sale.soldByName || '—')}<br/>
      Pago: ${escapeHtml(sale.paymentMethod)}
    </div>
    <table><tbody>${rows}</tbody></table>
    <div class="totals">
      <div><span>Subtotal</span><span>${formatMoney(sale.subtotal)}</span></div>
      ${sale.discount > 0 ? `<div><span>Descuento</span><span>−${formatMoney(sale.discount)}</span></div>` : ''}
      <div class="total"><span>Total</span><span>${formatMoney(sale.total)}</span></div>
    </div>
    ${voided ? '<div class="void">VENTA CANCELADA</div>' : '<div class="thanks">¡Gracias por tu compra! 🌸</div>'}
    <script>window.onload = () => { window.print(); }<\/script>
    </body></html>`

  const w = window.open('', '_blank', 'width=360,height=640')
  if (!w) {
    alert('Permite las ventanas emergentes para imprimir el ticket.')
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
