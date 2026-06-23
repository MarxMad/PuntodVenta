import { useEffect, useMemo, useState } from 'react'
import { db } from '../../lib/db'
import type { StaffMember } from '../../lib/types'
import {
  ALL_PERMISSIONS, PERMISSION_META, ROLE_PRESETS, permissionsLabel, presetFromPermissions, type Permission,
} from '../../lib/permissions'
import { useToast } from '../../components/Toast'
import { Spinner } from './Products'
import { C, font, gradient, shadow } from '../../theme'

export default function Collaborators() {
  const toast = useToast()
  const [list, setList] = useState<StaffMember[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [editing, setEditing] = useState<StaffMember | null>(null)

  async function load() {
    setLoading(true)
    setList(await db.listStaff())
    setLoading(false)
  }
  useEffect(() => { load() }, [])

  if (loading) return <Spinner />

  return (
    <div className="cap-fade">
      <button
        onClick={() => setCreating(true)}
        style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: gradient.brand, color: '#fff', border: 'none', borderRadius: 13, padding: '11px 18px', fontWeight: 700, fontSize: 14, boxShadow: shadow.btn, marginBottom: 18 }}
      >
        + Agregar colaborador
      </button>

      <div style={{ background: C.bg, borderRadius: 14, padding: '14px 16px', marginBottom: 20, fontSize: 13.5, color: C.muted, lineHeight: 1.5 }}>
        Cada colaborador entra con su <b>correo y contraseña</b> al mismo panel. Tú eliges qué puede hacer: solo cobrar, manejar inventario, etc.
      </div>

      {list.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '50px 20px', color: C.muted }}>
          <div style={{ fontSize: 48 }}>👥</div>
          <div style={{ fontWeight: 700, fontSize: 17, color: C.text, marginTop: 10 }}>Sin colaboradores registrados</div>
          <div style={{ fontSize: 14, marginTop: 4 }}>Agrega a tu equipo para que cobren o suban productos sin ver todo.</div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {list.map((s) => (
            <div key={s.id} style={{ background: C.white, border: `1px solid ${s.active ? C.border : '#F6E2BE'}`, borderRadius: 18, padding: '16px 20px', boxShadow: shadow.sm, opacity: s.active ? 1 : 0.75 }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, flexWrap: 'wrap' }}>
                <div style={{ width: 44, height: 44, borderRadius: 14, background: gradient.card, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, flex: 'none' }}>
                  {s.active ? '👤' : '💤'}
                </div>
                <div style={{ flex: 1, minWidth: 180 }}>
                  <div style={{ fontWeight: 700, fontSize: 16, color: C.text }}>{s.name}</div>
                  <div style={{ fontSize: 13, color: C.muted }}>{s.email}</div>
                  <div style={{ fontSize: 12.5, color: C.pinkSoft, fontWeight: 700, marginTop: 6 }}>{permissionsLabel(s.permissions)}</div>
                </div>
                {!s.active && (
                  <span style={{ fontSize: 12, fontWeight: 700, color: C.amber, background: '#FFF4E2', padding: '5px 10px', borderRadius: 999 }}>Inactivo</span>
                )}
                <button
                  onClick={() => setEditing(s)}
                  style={{ background: C.white, border: `1px solid ${C.border}`, color: C.pinkSoft, borderRadius: 11, padding: '9px 14px', fontWeight: 700, fontSize: 13 }}
                >
                  Editar
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {creating && <StaffModal onClose={() => setCreating(false)} onSaved={() => { setCreating(false); load() }} />}
      {editing && <StaffModal member={editing} onClose={() => setEditing(null)} onSaved={() => { setEditing(null); load() }} />}
    </div>
  )
}

function StaffModal({ member, onClose, onSaved }: { member?: StaffMember; onClose: () => void; onSaved: () => void }) {
  const toast = useToast()
  const isEdit = Boolean(member)
  const [name, setName] = useState(member?.name ?? '')
  const [email, setEmail] = useState(member?.email ?? '')
  const [password, setPassword] = useState('')
  const [active, setActive] = useState(member?.active ?? true)
  const [preset, setPreset] = useState(presetFromPermissions(member?.permissions ?? ['pos']) ?? 'cajero')
  const [custom, setCustom] = useState<string[]>(member?.permissions.includes('*') ? [] : (member?.permissions ?? ['pos']))
  const [useCustom, setUseCustom] = useState(!presetFromPermissions(member?.permissions ?? ['pos']))
  const [busy, setBusy] = useState(false)

  const permissions = useMemo(() => {
    if (useCustom) return custom.length ? custom : ['pos']
    return ROLE_PRESETS.find((r) => r.id === preset)?.permissions ?? ['pos']
  }, [useCustom, custom, preset])

  function togglePerm(p: Permission) {
    setUseCustom(true)
    setCustom((prev) => (prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p]))
  }

  function applyPreset(id: string) {
    setPreset(id)
    setUseCustom(false)
    if (id !== 'admin') setCustom(ROLE_PRESETS.find((r) => r.id === id)?.permissions ?? [])
  }

  async function save() {
    if (!name.trim()) return toast('Escribe el nombre del colaborador.', 'error')
    if (!isEdit && !email.trim()) return toast('Indica un correo.', 'error')
    if (!isEdit && password.length < 6) return toast('La contraseña debe tener al menos 6 caracteres.', 'error')
    if (permissions.length === 0) return toast('Elige al menos un permiso.', 'error')

    setBusy(true)
    try {
      if (isEdit && member) {
        await db.updateStaff(member.id, name, permissions, active)
        if (password.length >= 6) await db.resetStaffPassword(member.id, password)
        toast('Colaborador actualizado')
      } else {
        await db.createStaff(email, password, name, permissions)
        toast('Colaborador creado · ya puede iniciar sesión')
      }
      onSaved()
    } catch (err) {
      toast(err instanceof Error ? err.message : 'No se pudo guardar.', 'error')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div onClick={onClose} style={overlay}>
      <div onClick={(e) => e.stopPropagation()} className="cap-pop" style={modal}>
        <div style={{ fontFamily: font.display, fontWeight: 700, fontSize: 20, color: C.text, marginBottom: 16 }}>
          {isEdit ? 'Editar colaborador' : 'Nuevo colaborador'}
        </div>

        <Field label="Nombre *">
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ej. María López" style={inputStyle} />
        </Field>

        <Field label="Correo *">
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} disabled={isEdit} placeholder="colaborador@correo.com" style={{ ...inputStyle, opacity: isEdit ? 0.7 : 1 }} />
        </Field>

        <Field label={isEdit ? 'Nueva contraseña (opcional)' : 'Contraseña *'}>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder={isEdit ? 'Dejar vacío para no cambiar' : 'Mínimo 6 caracteres'} style={inputStyle} />
        </Field>

        {isEdit && (
          <label style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16, cursor: 'pointer' }}>
            <input type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)} style={{ width: 18, height: 18, accentColor: C.pink }} />
            <span style={{ fontSize: 14, fontWeight: 600 }}>Cuenta activa (puede iniciar sesión)</span>
          </label>
        )}

        <div style={{ fontSize: 12.5, fontWeight: 700, color: C.pinkSoft, marginBottom: 8 }}>Rol rápido</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
          {ROLE_PRESETS.map((r) => (
            <button
              key={r.id}
              type="button"
              onClick={() => applyPreset(r.id)}
              style={{
                padding: '8px 14px', borderRadius: 999, fontWeight: 700, fontSize: 13,
                border: `1px solid ${!useCustom && preset === r.id ? 'transparent' : C.border}`,
                background: !useCustom && preset === r.id ? gradient.brand : C.white,
                color: !useCustom && preset === r.id ? '#fff' : C.pinkSoft,
              }}
            >
              {r.label}
            </button>
          ))}
        </div>

        <div style={{ fontSize: 12.5, fontWeight: 700, color: C.pinkSoft, marginBottom: 8 }}>Permisos personalizados</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 18 }}>
          {ALL_PERMISSIONS.map((p) => (
            <label key={p} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, cursor: 'pointer', background: C.bg, borderRadius: 12, padding: '10px 12px', border: `1px solid ${custom.includes(p) && useCustom ? C.pink : C.border}` }}>
              <input
                type="checkbox"
                checked={useCustom ? custom.includes(p) : (ROLE_PRESETS.find((r) => r.id === preset)?.permissions.includes(p) ?? false) || preset === 'admin'}
                onChange={() => togglePerm(p)}
                style={{ width: 18, height: 18, accentColor: C.pink, marginTop: 2 }}
              />
              <span>
                <span style={{ display: 'block', fontWeight: 700, fontSize: 14, color: C.text }}>{PERMISSION_META[p].label}</span>
                <span style={{ fontSize: 12.5, color: C.muted }}>{PERMISSION_META[p].desc}</span>
              </span>
            </label>
          ))}
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={save} disabled={busy} style={{ background: gradient.brand, color: '#fff', border: 'none', borderRadius: 12, padding: '11px 22px', fontWeight: 700, boxShadow: shadow.btn }}>
            {busy ? 'Guardando…' : isEdit ? 'Guardar cambios' : 'Crear colaborador'}
          </button>
          <button onClick={onClose} style={{ background: C.white, color: C.pinkSoft, border: `1px solid ${C.border}`, borderRadius: 12, padding: '11px 20px', fontWeight: 700 }}>Cancelar</button>
        </div>
      </div>
    </div>
  )
}

const inputStyle: React.CSSProperties = { width: '100%', border: `1px solid ${C.borderSoft}`, borderRadius: 11, padding: '10px 13px', fontSize: 14.5, color: C.text, outline: 'none', background: '#FFFDFE' }
const overlay: React.CSSProperties = { position: 'fixed', inset: 0, background: 'rgba(74,63,74,.35)', backdropFilter: 'blur(3px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, zIndex: 100 }
const modal: React.CSSProperties = { background: C.white, borderRadius: 22, padding: 26, width: '100%', maxWidth: 520, maxHeight: '90vh', overflowY: 'auto', boxShadow: shadow.pop }

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label style={{ display: 'block', marginBottom: 14 }}>
      <span style={{ display: 'block', fontSize: 12.5, fontWeight: 700, color: C.pinkSoft, marginBottom: 5 }}>{label}</span>
      {children}
    </label>
  )
}
