import { useState } from 'react'
import type { Sale } from '../../../lib/types'
import { formatMoney } from '../../../lib/format'
import { emailReceipt, printReceipt } from '../../../lib/print'
import { Modal } from '../../../components/Modal'
import { C, font, gradient, shadow } from '../../../theme'
import { Icon, StatusBadge } from '../../../components/Icon'

/** Pantalla de confirmación tras cobrar: imprimir o enviar el ticket por correo. */
export default function SaleConfirmedModal({ sale, onClose }: { sale: Sale; onClose: () => void }) {
  const [email, setEmail] = useState('')
  const [printed, setPrinted] = useState(false)
  const [sent, setSent] = useState(false)

  return (
    <Modal
      title="Venta confirmada"
      onClose={onClose}
      footer={
        <button
          onClick={onClose}
          style={{ background: gradient.brand, color: '#fff', border: 'none', borderRadius: 13, padding: '13px', fontWeight: 700, fontSize: 15, boxShadow: shadow.btn, flex: 1 }}
        >
          Nueva venta
        </button>
      }
    >
      <div style={{ textAlign: 'center', marginBottom: 22 }}>
        <div style={{ margin: '0 auto 14px', display: 'flex', justifyContent: 'center' }}>
          <StatusBadge kind="ok" size={34} />
        </div>
        <div style={{ fontSize: 14, color: C.muted }}>Venta registrada por</div>
        <div style={{ fontFamily: font.display, fontWeight: 700, fontSize: 38, color: C.pinkDeep, marginTop: 2 }}>
          {formatMoney(sale.total)}
        </div>
        <div style={{ fontSize: 13, color: C.muted, marginTop: 4 }}>Pago: {sale.paymentMethod}</div>
      </div>

      <div style={{ fontSize: 13, fontWeight: 700, color: C.pinkSoft, marginBottom: 8 }}>¿Qué quieres hacer con el ticket?</div>

      <button
        onClick={() => { printReceipt(sale); setPrinted(true) }}
        style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 12, background: C.bg, border: `1px solid ${C.border}`, borderRadius: 14, padding: '14px 16px', marginBottom: 12, textAlign: 'left' }}
      >
        <span style={{ width: 40, height: 40, borderRadius: 12, background: C.white, border: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <Icon name="printer" size={22} color={C.pinkSoft} />
        </span>
        <span style={{ flex: 1 }}>
          <span style={{ display: 'block', fontWeight: 700, fontSize: 15, color: C.text }}>Imprimir ticket</span>
          <span style={{ fontSize: 12.5, color: C.muted }}>{printed ? 'Abierto para imprimir ✓' : 'Abre la ventana de impresión'}</span>
        </span>
      </button>

      <div style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: 14, padding: '14px 16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
          <span style={{ width: 40, height: 40, borderRadius: 12, background: C.white, border: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Icon name="mail" size={22} color={C.pinkSoft} />
          </span>
          <span style={{ flex: 1 }}>
            <span style={{ display: 'block', fontWeight: 700, fontSize: 15, color: C.text }}>Enviar por correo</span>
            <span style={{ fontSize: 12.5, color: C.muted }}>{sent ? 'Se abrió tu app de correo ✓' : 'Se abre tu correo con el ticket escrito'}</span>
          </span>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Correo del cliente (opcional)"
            style={{ flex: 1, border: `1px solid ${C.borderSoft}`, borderRadius: 11, padding: '10px 13px', fontSize: 14, color: C.text, outline: 'none', background: '#fff' }}
          />
          <button
            onClick={() => { emailReceipt(sale, email.trim()); setSent(true) }}
            style={{ background: gradient.brand, color: '#fff', border: 'none', borderRadius: 11, padding: '10px 16px', fontWeight: 700, fontSize: 14, boxShadow: shadow.btn, flex: 'none' }}
          >
            Enviar
          </button>
        </div>
      </div>
    </Modal>
  )
}
