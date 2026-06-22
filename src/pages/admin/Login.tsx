import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { isAuthenticated, signIn } from '../../lib/auth'
import { isCloud } from '../../lib/supabase'
import { ADMIN_BASE } from '../../config'
import { C, font, gradient, shadow } from '../../theme'

export default function Login() {
  const nav = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    isAuthenticated().then((ok) => ok && nav(ADMIN_BASE, { replace: true }))
  }, [nav])

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setBusy(true)
    try {
      await signIn(email, password)
      nav(ADMIN_BASE, { replace: true })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo iniciar sesión.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: gradient.sidebar, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <form
        onSubmit={submit}
        className="cap-pop"
        style={{ width: '100%', maxWidth: 380, background: C.white, borderRadius: 24, padding: '34px 30px', boxShadow: shadow.pop, border: `1px solid ${C.border}` }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, marginBottom: 24 }}>
          <div style={{ width: 56, height: 56, borderRadius: 18, background: gradient.logo, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: shadow.btn }}>
            <svg width="30" height="30" viewBox="0 0 24 24" fill="none">
              <path d="M12 21s-7-4.35-9.2-8.5C1.3 9.6 2.6 6 6 6c2 0 3.2 1.3 4 2.4C10.8 7.3 12 6 14 6c3.4 0 4.7 3.6 3.2 6.5C19 16.65 12 21 12 21z" fill="#fff" />
            </svg>
          </div>
          <div style={{ fontFamily: font.display, fontWeight: 700, fontSize: 24, color: C.pinkDeep }}>Caprichitos</div>
          <div style={{ fontSize: 13.5, color: C.muted, fontWeight: 600 }}>Panel de administración</div>
        </div>

        <Field label="Correo">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={isCloud ? 'tu@correo.com' : 'admin@caprichitos.mx'}
            autoComplete="username"
            style={inputStyle}
          />
        </Field>
        <Field label="Contraseña">
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            autoComplete="current-password"
            style={inputStyle}
          />
        </Field>

        {error && (
          <div style={{ background: '#FDECEF', color: C.red, fontSize: 13, fontWeight: 600, padding: '10px 12px', borderRadius: 11, marginBottom: 14 }}>
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={busy}
          style={{ width: '100%', background: gradient.brand, color: '#fff', border: 'none', borderRadius: 14, padding: '13px', fontWeight: 700, fontSize: 15, boxShadow: shadow.btn }}
        >
          {busy ? 'Entrando…' : 'Entrar'}
        </button>

        {!isCloud && (
          <div style={{ fontSize: 12, color: C.muted, textAlign: 'center', marginTop: 16, lineHeight: 1.5 }}>
            Modo prueba: contraseña <b>caprichitos</b><br />(el correo puede ser cualquiera)
          </div>
        )}
      </form>
    </div>
  )
}

const inputStyle: React.CSSProperties = {
  width: '100%', border: `1px solid ${C.borderSoft}`, borderRadius: 12, padding: '12px 14px',
  fontSize: 15, color: C.text, outline: 'none', background: '#FFFDFE',
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label style={{ display: 'block', marginBottom: 14 }}>
      <span style={{ display: 'block', fontSize: 13, fontWeight: 700, color: C.pinkSoft, marginBottom: 6 }}>{label}</span>
      {children}
    </label>
  )
}
