import { useMemo, useState } from 'react'
import { db } from '../../../lib/db'
import type { CashSession, Sale } from '../../../lib/types'
import { summarizeCashSession } from '../../../lib/cashSession'
import { parseMoneyInput } from '../../../lib/saleCalc'
import { formatMoney, formatDateTime } from '../../../lib/format'
import { useToast } from '../../../components/Toast'
import { C, font, gradient, shadow } from '../../../theme'

interface Props {
  cashSession: CashSession | null
  sales: Sale[]
  soldBy: { name: string; email: string }
  onReload: () => void
}

export default function CashPanel({ cashSession, sales, soldBy, onReload }: Props) {
  const toast = useToast()
  const [opening, setOpening] = useState('')
  const [closing, setClosing] = useState('')
  const [notes, setNotes] = useState('')
  const [busy, setBusy] = useState(false)

  const summary = useMemo(
    () => (cashSession ? summarizeCashSession(cashSession, sales) : null),
    [cashSession, sales],
  )

  const diff = useMemo(() => {
    if (!summary || !closing) return null
    return parseMoneyInput(closing) - summary.expectedCash
  }, [summary, closing])

  async function openSession() {
    setBusy(true)
    try {
      await db.openCashSession(parseMoneyInput(opening), soldBy.name, soldBy.email)
      toast('Caja abierta')
      setOpening('')
      onReload()
    } catch (err) {
      toast(err instanceof Error ? err.message : 'No se pudo abrir la caja.', 'error')
    } finally {
      setBusy(false)
    }
  }

  async function closeSession() {
    if (!cashSession) return
    setBusy(true)
    try {
      const closed = await db.closeCashSession(cashSession.id, parseMoneyInput(closing), notes)
      const d = (closed.closingCash ?? 0) - (closed.expectedCash ?? 0)
      toast(d === 0 ? 'Corte de caja cerrado · cuadra perfecto ✓' : `Corte cerrado · diferencia ${formatMoney(d)}`)
      setClosing('')
      setNotes('')
      onReload()
    } catch (err) {
      toast(err instanceof Error ? err.message : 'No se pudo cerrar la caja.', 'error')
    } finally {
      setBusy(false)
    }
  }

  if (!cashSession) {
    return (
      <div style={{ maxWidth: 480 }}>
        <div style={{ background: C.white, borderRadius: 20, border: `1px solid ${C.border}`, boxShadow: shadow.card, padding: 24 }}>
          <div style={{ fontWeight: 700, fontSize: 17, color: C.text, marginBottom: 8 }}>Abrir caja</div>
          <div style={{ fontSize: 13.5, color: C.muted, marginBottom: 18, lineHeight: 1.5 }}>
            Cuenta el efectivo con el que empiezas el turno. Las ventas en efectivo se sumarán para el corte al cerrar.
          </div>
          <label style={{ display: 'block', marginBottom: 16 }}>
            <span style={{ display: 'block', fontSize: 13, fontWeight: 700, color: C.pinkSoft, marginBottom: 6 }}>Efectivo inicial en caja</span>
            <input
              value={opening}
              onChange={(e) => setOpening(e.target.value)}
              placeholder="0.00"
              style={{ width: '100%', border: `1px solid ${C.borderSoft}`, borderRadius: 12, padding: '12px 14px', fontSize: 15, outline: 'none' }}
            />
          </label>
          <button
            onClick={openSession}
            disabled={busy}
            style={{ background: gradient.brand, color: '#fff', border: 'none', borderRadius: 13, padding: '12px 22px', fontWeight: 700, fontSize: 15, boxShadow: shadow.btn }}
          >
            {busy ? 'Abriendo…' : 'Abrir caja'}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="cap-grid-2">
      <div style={{ background: gradient.card, borderRadius: 20, padding: 22, boxShadow: shadow.card }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: C.pinkSoft }}>Turno actual</div>
        <div style={{ fontFamily: font.display, fontWeight: 700, fontSize: 22, color: C.text, marginTop: 6 }}>Caja abierta</div>
        <div style={{ fontSize: 13, color: C.muted, marginTop: 8, lineHeight: 1.5 }}>
          Abierta {formatDateTime(cashSession.openedAt)}<br />
          Por: {cashSession.openedByName}<br />
          Fondo inicial: {formatMoney(cashSession.openingCash)}
        </div>
        {summary && (
          <div style={{ marginTop: 18, display: 'flex', flexDirection: 'column', gap: 8 }}>
            <Row label="Ventas del turno" value={String(summary.saleCount)} />
            <Row label="Total vendido" value={formatMoney(summary.totalRevenue)} />
            <Row label="En efectivo" value={formatMoney(summary.efectivo)} />
            <Row label="Tarjeta" value={formatMoney(summary.tarjeta)} />
            <Row label="Transferencia" value={formatMoney(summary.transferencia)} />
            <div style={{ borderTop: `1px solid ${C.border}`, marginTop: 6, paddingTop: 10 }}>
              <Row label="Efectivo esperado en caja" value={formatMoney(summary.expectedCash)} bold />
            </div>
          </div>
        )}
      </div>

      <div style={{ background: C.white, borderRadius: 20, border: `1px solid ${C.border}`, boxShadow: shadow.card, padding: 24 }}>
        <div style={{ fontWeight: 700, fontSize: 17, color: C.text, marginBottom: 8 }}>Cerrar caja (corte)</div>
        <div style={{ fontSize: 13.5, color: C.muted, marginBottom: 18 }}>
          Cuenta el efectivo físico en la caja y compáralo con lo esperado.
        </div>
        <label style={{ display: 'block', marginBottom: 14 }}>
          <span style={{ display: 'block', fontSize: 13, fontWeight: 700, color: C.pinkSoft, marginBottom: 6 }}>Efectivo contado</span>
          <input
            value={closing}
            onChange={(e) => setClosing(e.target.value)}
            placeholder="0.00"
            style={{ width: '100%', border: `1px solid ${C.borderSoft}`, borderRadius: 12, padding: '12px 14px', fontSize: 15, outline: 'none' }}
          />
        </label>
        {summary && closing && diff !== null && (
          <div style={{
            background: diff === 0 ? '#E8F7EF' : '#FFF4E2',
            color: diff === 0 ? C.green : C.amber,
            borderRadius: 12, padding: '10px 14px', fontWeight: 700, fontSize: 14, marginBottom: 14,
          }}>
            {diff === 0 ? '✓ Cuadra con lo esperado' : `Diferencia: ${formatMoney(diff)}`}
          </div>
        )}
        <label style={{ display: 'block', marginBottom: 16 }}>
          <span style={{ display: 'block', fontSize: 13, fontWeight: 700, color: C.pinkSoft, marginBottom: 6 }}>Notas (opcional)</span>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            placeholder="Ej. faltante por cambio mal dado…"
            style={{ width: '100%', border: `1px solid ${C.borderSoft}`, borderRadius: 12, padding: '10px 14px', fontSize: 14, resize: 'vertical', outline: 'none' }}
          />
        </label>
        <button
          onClick={closeSession}
          disabled={busy || !closing}
          style={{ background: gradient.brand, color: '#fff', border: 'none', borderRadius: 13, padding: '12px 22px', fontWeight: 700, fontSize: 15, boxShadow: shadow.btn, opacity: closing ? 1 : 0.55 }}
        >
          {busy ? 'Cerrando…' : 'Cerrar caja'}
        </button>
      </div>
    </div>
  )
}

function Row({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, fontSize: 14 }}>
      <span style={{ color: C.muted, fontWeight: 600 }}>{label}</span>
      <span style={{ fontWeight: bold ? 700 : 600, color: bold ? C.pinkDeep : C.text }}>{value}</span>
    </div>
  )
}
