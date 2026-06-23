import { useMemo, useState } from 'react'
import { db } from '../../../lib/db'
import type { Sale } from '../../../lib/types'
import { formatMoney, formatDateTime } from '../../../lib/format'
import { printReceipt } from '../../../lib/print'
import { useToast } from '../../../components/Toast'
import { C, font, gradient, shadow } from '../../../theme'

interface Props {
  sales: Sale[]
  onReload: () => void
}

export default function HistoryPanel({ sales, onReload }: Props) {
  const toast = useToast()
  const [search, setSearch] = useState('')
  const [busy, setBusy] = useState<string | null>(null)

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase()
    return sales.filter((s) => {
      if (!q) return true
      return (
        s.soldByName.toLowerCase().includes(q)
        || s.items.some((i) => i.name.toLowerCase().includes(q) || i.sku.toLowerCase().includes(q))
        || s.paymentMethod.includes(q)
      )
    })
  }, [sales, search])

  async function voidSale(sale: Sale) {
    if (sale.status === 'voided') return
    if (!confirm(`¿Cancelar esta venta de ${formatMoney(sale.total)}? El stock volverá al inventario.`)) return
    setBusy(sale.id)
    try {
      await db.voidSale(sale.id)
      toast('Venta cancelada · stock restaurado')
      onReload()
    } catch (err) {
      toast(err instanceof Error ? err.message : 'No se pudo cancelar.', 'error')
    } finally {
      setBusy(null)
    }
  }

  return (
    <div>
      <input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Buscar por producto, cajero o forma de pago…"
        style={{ width: '100%', maxWidth: 420, border: `1px solid ${C.borderSoft}`, borderRadius: 12, padding: '11px 14px', fontSize: 14, marginBottom: 16, outline: 'none' }}
      />

      {visible.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '50px 20px', color: C.muted }}>
          <div style={{ fontSize: 48 }}>🧾</div>
          <div style={{ fontWeight: 700, fontSize: 17, color: C.text, marginTop: 10 }}>Sin ventas registradas</div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {visible.map((s) => {
            const voided = s.status === 'voided'
            const pieces = s.items.reduce((a, i) => a + i.qty, 0)
            return (
              <div key={s.id} style={{ background: C.white, border: `1px solid ${voided ? '#F6E2BE' : C.border}`, borderRadius: 18, padding: '16px 18px', boxShadow: shadow.sm, opacity: voided ? 0.8 : 1 }}>
                <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-start', gap: 12 }}>
                  <div style={{ flex: 1, minWidth: 200 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                      <span style={{ fontFamily: font.display, fontWeight: 700, fontSize: 20, color: voided ? C.muted : C.pinkDeep }}>{formatMoney(s.total)}</span>
                      {voided && <span style={{ fontSize: 11, fontWeight: 700, color: C.red, background: '#FDECEF', padding: '4px 10px', borderRadius: 999 }}>Cancelada</span>}
                    </div>
                    <div style={{ fontSize: 13, color: C.muted, marginTop: 4 }}>
                      {formatDateTime(s.createdAt)} · {pieces} pzs · {s.paymentMethod}
                    </div>
                    <div style={{ fontSize: 12.5, color: C.pinkSoft, fontWeight: 700, marginTop: 4 }}>Cobró: {s.soldByName || '—'}</div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 10 }}>
                      {s.items.map((i, idx) => (
                        <span key={idx} style={{ fontSize: 12, background: C.bg, border: `1px solid ${C.border}`, borderRadius: 9, padding: '4px 9px', color: C.text }}>
                          {i.name} ×{i.qty}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    <button onClick={() => printReceipt(s)} style={ghostBtn}>🖨️ Ticket</button>
                    {!voided && (
                      <button onClick={() => voidSale(s)} disabled={busy === s.id} style={{ ...ghostBtn, color: C.red, borderColor: '#F6D0D8' }}>
                        {busy === s.id ? '…' : 'Cancelar venta'}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

const ghostBtn: React.CSSProperties = {
  background: C.white, color: C.pinkSoft, border: `1px solid ${C.border}`,
  borderRadius: 11, padding: '9px 14px', fontWeight: 700, fontSize: 13,
}
