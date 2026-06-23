import { useEffect, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { C, font } from '../theme'

interface ModalProps {
  title: string
  onClose: () => void
  children: ReactNode
  footer: ReactNode
  wide?: boolean
}

/** Modal a pantalla completa en móvil; centrado con scroll interno en desktop. */
export function Modal({ title, onClose, children, footer, wide }: ModalProps) {
  useEffect(() => {
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = prev }
  }, [])

  return createPortal(
    <div className="cap-modal-overlay" onClick={onClose} role="presentation">
      <div
        className={`cap-pop cap-modal${wide ? ' cap-modal-wide' : ''}`}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="cap-modal-title"
      >
        <div className="cap-modal-header">
          <div id="cap-modal-title" style={{ fontFamily: font.display, fontWeight: 700, fontSize: 20, color: C.text, flex: 1 }}>
            {title}
          </div>
          <button type="button" className="cap-modal-close" onClick={onClose} aria-label="Cerrar">
            ×
          </button>
        </div>
        <div className="cap-modal-body">{children}</div>
        <div className="cap-modal-footer">{footer}</div>
      </div>
    </div>,
    document.body,
  )
}
