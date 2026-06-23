import { createContext, useCallback, useContext, useState, type ReactNode } from 'react'
import { C, shadow } from '../theme'
import { Icon } from './Icon'

type ToastKind = 'ok' | 'error'
interface ToastMsg { id: number; text: string; kind: ToastKind }

const ToastCtx = createContext<(text: string, kind?: ToastKind) => void>(() => {})

export function useToast() {
  return useContext(ToastCtx)
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastMsg[]>([])

  const push = useCallback((text: string, kind: ToastKind = 'ok') => {
    const id = Date.now() + Math.random()
    setToasts((t) => [...t, { id, text, kind }])
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 2800)
  }, [])

  return (
    <ToastCtx.Provider value={push}>
      {children}
      <div style={{ position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)', display: 'flex', flexDirection: 'column', gap: 8, zIndex: 1000 }}>
        {toasts.map((t) => (
          <div
            key={t.id}
            className="cap-pop"
            style={{
              background: t.kind === 'ok' ? C.white : '#FDECEF',
              color: t.kind === 'ok' ? C.text : C.red,
              border: `1px solid ${t.kind === 'ok' ? C.border : '#F6C9D2'}`,
              padding: '12px 20px',
              borderRadius: 14,
              fontWeight: 700,
              fontSize: 14,
              boxShadow: shadow.pop,
              display: 'flex',
              alignItems: 'center',
              gap: 9,
            }}
          >
            <Icon name={t.kind === 'ok' ? 'check' : 'alert'} size={18} color={t.kind === 'ok' ? C.green : C.red} strokeWidth={2.5} />
            {t.text}
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  )
}
