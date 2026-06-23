import { createContext, useCallback, useContext, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { C, font, gradient, shadow } from '../theme'

type ResultKind = 'ok' | 'error'

export interface ResultAction {
  label: string
  onClick?: () => void
  variant?: 'primary' | 'ghost'
}

export interface ResultOpts {
  kind?: ResultKind
  title: string
  message?: string
  /** Botones de acción. Si se omite, muestra un único botón "Entendido" que cierra. */
  actions?: ResultAction[]
}

const ResultCtx = createContext<(opts: ResultOpts) => void>(() => {})

/** Muestra una pantalla central de confirmación (✅) o error (⚠️). */
export function useResult() {
  return useContext(ResultCtx)
}

export function ResultProvider({ children }: { children: ReactNode }) {
  const [result, setResult] = useState<ResultOpts | null>(null)
  const show = useCallback((opts: ResultOpts) => setResult(opts), [])
  const close = () => setResult(null)

  const isError = result?.kind === 'error'
  const actions = result?.actions ?? [{ label: 'Entendido' }]

  return (
    <ResultCtx.Provider value={show}>
      {children}
      {result &&
        createPortal(
          <div className="cap-modal-overlay" onClick={close} role="presentation">
            <div
              className="cap-pop"
              onClick={(e) => e.stopPropagation()}
              role="dialog"
              aria-modal="true"
              style={{
                background: C.white, borderRadius: 24, padding: '34px 28px 28px',
                width: '100%', maxWidth: 380, textAlign: 'center', boxShadow: shadow.pop,
              }}
            >
              <div
                style={{
                  width: 76, height: 76, borderRadius: '50%', margin: '0 auto 18px',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 40,
                  background: isError ? '#FDECEF' : '#E8F7EF',
                }}
              >
                {isError ? '⚠️' : '✅'}
              </div>
              <div style={{ fontFamily: font.display, fontWeight: 700, fontSize: 21, color: C.text }}>
                {result.title}
              </div>
              {result.message && (
                <div style={{ fontSize: 14, color: C.muted, marginTop: 8, lineHeight: 1.5 }}>
                  {result.message}
                </div>
              )}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 26 }}>
                {actions.map((a, i) => (
                  <button
                    key={i}
                    onClick={() => { a.onClick?.(); close() }}
                    style={a.variant === 'ghost' ? ghostBtn : primaryBtn}
                  >
                    {a.label}
                  </button>
                ))}
              </div>
            </div>
          </div>,
          document.body,
        )}
    </ResultCtx.Provider>
  )
}

const primaryBtn: React.CSSProperties = {
  background: gradient.brand, color: '#fff', border: 'none', borderRadius: 13,
  padding: '13px', fontWeight: 700, fontSize: 15, boxShadow: shadow.btn,
}
const ghostBtn: React.CSSProperties = {
  background: C.white, color: C.pinkSoft, border: `1px solid ${C.border}`, borderRadius: 13,
  padding: '13px', fontWeight: 700, fontSize: 15,
}
