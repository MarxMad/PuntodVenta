import { useEffect, useMemo, useState } from 'react'
import { db } from '../../lib/db'
import type { Collection, Machine, MachineType } from '../../lib/types'
import { MACHINE_TYPES, machineType } from '../../lib/machines'
import { formatMoney, formatDate } from '../../lib/format'
import { useToast } from '../../components/Toast'
import { Spinner } from './Products'
import { C, font, gradient, shadow } from '../../theme'

const today = () => new Date().toISOString().slice(0, 10)
const monthKey = (iso: string) => iso.slice(0, 7) // YYYY-MM

export default function Machines() {
  const [machines, setMachines] = useState<Machine[]>([])
  const [collections, setCollections] = useState<Collection[]>([])
  const [loading, setLoading] = useState(true)

  const [adding, setAdding] = useState(false)
  const [collectFor, setCollectFor] = useState<Machine | null>(null)
  const [historyFor, setHistoryFor] = useState<Machine | null>(null)
  const [editing, setEditing] = useState<Machine | null>(null)

  async function load() {
    setLoading(true)
    const [m, c] = await Promise.all([db.listMachines(), db.listCollections()])
    setMachines(m)
    setCollections(c)
    setLoading(false)
  }
  useEffect(() => { load() }, [])

  // Totales por máquina y por ubicación
  const totalByMachine = useMemo(() => {
    const map: Record<string, { total: number; last: string | null }> = {}
    for (const c of collections) {
      const e = (map[c.machineId] ??= { total: 0, last: null })
      e.total += c.amount
      if (!e.last || c.collectedAt > e.last) e.last = c.collectedAt
    }
    return map
  }, [collections])

  const stats = useMemo(() => {
    const thisMonth = monthKey(today())
    return {
      machines: machines.length,
      locations: new Set(machines.map((m) => m.location)).size,
      monthTotal: collections.filter((c) => monthKey(c.collectedAt) === thisMonth).reduce((s, c) => s + c.amount, 0),
    }
  }, [machines, collections])

  // Agrupa por ubicación
  const grouped = useMemo(() => {
    const map = new Map<string, Machine[]>()
    for (const m of machines) {
      const key = m.location || 'Sin ubicación'
      if (!map.has(key)) map.set(key, [])
      map.get(key)!.push(m)
    }
    return [...map.entries()]
  }, [machines])

  if (loading) return <Spinner />

  return (
    <div className="cap-fade">
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 20 }}>
        <Stat label="Máquinas" value={String(stats.machines)} />
        <Stat label="Ubicaciones" value={String(stats.locations)} />
        <Stat label="Recolectado este mes" value={formatMoney(stats.monthTotal)} />
      </div>

      <button onClick={() => setAdding(true)} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: gradient.brand, color: '#fff', border: 'none', borderRadius: 13, padding: '11px 18px', fontWeight: 700, fontSize: 14, boxShadow: shadow.btn, marginBottom: 20 }}>
        + Agregar máquinas a una ubicación
      </button>

      {machines.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: C.muted }}>
          <div style={{ fontSize: 48 }}>🕹️</div>
          <div style={{ fontWeight: 700, fontSize: 17, color: C.text, marginTop: 10 }}>Aún no tienes máquinas</div>
          <div style={{ fontSize: 14, marginTop: 4 }}>Da de alta tus maquinitas y empieza a registrar recolecciones.</div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
          {grouped.map(([location, list]) => {
            const locTotal = list.reduce((s, m) => s + (totalByMachine[m.id]?.total ?? 0), 0)
            return (
              <div key={location}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                  <span style={{ fontSize: 18 }}>📍</span>
                  <span style={{ fontFamily: font.display, fontWeight: 700, fontSize: 18, color: C.text }}>{location}</span>
                  <span style={{ fontSize: 12.5, color: C.muted, fontWeight: 600 }}>· {list.length} máquina{list.length === 1 ? '' : 's'}</span>
                  <span style={{ marginLeft: 'auto', fontWeight: 700, color: C.pinkDeep }}>{formatMoney(locTotal)} recolectado</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {list.map((m) => {
                    const t = machineType(m.type)
                    const info = totalByMachine[m.id]
                    return (
                      <div key={m.id} style={rowStyle}>
                        <div style={{ width: 52, height: 52, flex: 'none', borderRadius: 13, background: gradient.card, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>
                          {m.type === 'peluche' ? '🧸' : '🕹️'}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontWeight: 700, fontSize: 15, color: C.text }}>{m.name}</div>
                          <div style={{ fontSize: 12.5, color: C.muted }}>
                            {t.label}{info?.last ? ` · última recolección ${formatDate(info.last)}` : ' · sin recolecciones'}
                          </div>
                        </div>
                        <div style={{ textAlign: 'right', flex: 'none', width: 110 }}>
                          <div style={{ fontFamily: font.display, fontWeight: 700, fontSize: 17, color: C.pinkDeep }}>{formatMoney(info?.total ?? 0)}</div>
                          <div style={{ fontSize: 11.5, color: C.mutedSoft, fontWeight: 600 }}>total recolectado</div>
                        </div>
                        <button onClick={() => setCollectFor(m)} style={{ ...iconBtn, background: gradient.brand, color: '#fff', border: 'none' }}>💰 Recolección</button>
                        <button onClick={() => setHistoryFor(m)} style={iconBtn}>Historial</button>
                        <button onClick={() => setEditing(m)} style={iconBtn}>Editar</button>
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {adding && <AddMachinesModal onClose={() => setAdding(false)} onSaved={() => { setAdding(false); load() }} />}
      {collectFor && <CollectionModal machine={collectFor} onClose={() => setCollectFor(null)} onSaved={() => { setCollectFor(null); load() }} />}
      {historyFor && <HistoryModal machine={historyFor} collections={collections.filter((c) => c.machineId === historyFor.id)} onClose={() => setHistoryFor(null)} />}
      {editing && <EditMachineModal machine={editing} onClose={() => setEditing(null)} onSaved={() => { setEditing(null); load() }} onDeleted={() => { setEditing(null); load() }} />}
    </div>
  )
}

// ── Alta de varias máquinas en una ubicación ──────────────────────────────────
function AddMachinesModal({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const toast = useToast()
  const [location, setLocation] = useState('')
  const [rows, setRows] = useState<Array<{ name: string; type: MachineType }>>([{ name: '', type: 'individual' }])
  const [busy, setBusy] = useState(false)

  function setRow(i: number, patch: Partial<{ name: string; type: MachineType }>) {
    setRows((r) => r.map((x, idx) => (idx === i ? { ...x, ...patch } : x)))
  }

  async function save() {
    if (!location.trim()) return toast('Indica la ubicación.', 'error')
    const valid = rows.filter((r) => r.name.trim())
    if (valid.length === 0) return toast('Agrega al menos una máquina con nombre.', 'error')
    setBusy(true)
    try {
      await db.createMachines(location.trim(), valid.map((r) => ({ name: r.name.trim(), type: r.type })))
      toast(`${valid.length} máquina${valid.length === 1 ? '' : 's'} dada${valid.length === 1 ? '' : 's'} de alta 🕹️`)
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
        <div style={{ fontFamily: font.display, fontWeight: 700, fontSize: 20, color: C.text, marginBottom: 16 }}>Agregar máquinas</div>

        <label style={{ display: 'block', marginBottom: 16 }}>
          <span style={lbl}>Ubicación</span>
          <input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Ej. Plaza del Sol, local 12" style={inputStyle} />
        </label>

        <div style={{ ...lbl, marginBottom: 8 }}>Máquinas en esta ubicación</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 10 }}>
          {rows.map((r, i) => (
            <div key={i} style={{ display: 'flex', gap: 8 }}>
              <input value={r.name} onChange={(e) => setRow(i, { name: e.target.value })} placeholder={`Nombre de la máquina ${i + 1}`} style={{ ...inputStyle, flex: 1 }} />
              <select value={r.type} onChange={(e) => setRow(i, { type: e.target.value as MachineType })} style={{ ...inputStyle, width: 150 }}>
                {MACHINE_TYPES.map((t) => <option key={t.id} value={t.id}>{t.label}</option>)}
              </select>
              {rows.length > 1 && (
                <button onClick={() => setRows((rr) => rr.filter((_, idx) => idx !== i))} style={{ ...iconBtn, color: C.red }}>✕</button>
              )}
            </div>
          ))}
        </div>
        <button onClick={() => setRows((r) => [...r, { name: '', type: 'individual' }])} style={{ ...iconBtn, marginBottom: 18 }}>+ Agregar otra máquina</button>

        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={save} disabled={busy} style={primaryBtn}>{busy ? 'Guardando…' : 'Guardar máquinas'}</button>
          <button onClick={onClose} style={ghostBtn}>Cancelar</button>
        </div>
      </div>
    </div>
  )
}

// ── Registrar recolección ─────────────────────────────────────────────────────
function CollectionModal({ machine, onClose, onSaved }: { machine: Machine; onClose: () => void; onSaved: () => void }) {
  const toast = useToast()
  const [date, setDate] = useState(today())
  const [amount, setAmount] = useState('')
  const [notes, setNotes] = useState('')
  const [busy, setBusy] = useState(false)

  async function save() {
    if (!amount || Number(amount) < 0) return toast('Indica el monto recolectado.', 'error')
    setBusy(true)
    try {
      await db.createCollection(machine.id, Number(amount), date, notes.trim())
      toast(`Recolección registrada · ${formatMoney(Number(amount))} 💰`)
      onSaved()
    } catch (err) {
      toast(err instanceof Error ? err.message : 'No se pudo registrar.', 'error')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div onClick={onClose} style={overlay}>
      <div onClick={(e) => e.stopPropagation()} className="cap-pop" style={{ ...modal, maxWidth: 420 }}>
        <div style={{ fontFamily: font.display, fontWeight: 700, fontSize: 20, color: C.text }}>Registrar recolección</div>
        <div style={{ fontSize: 13.5, color: C.muted, marginBottom: 18 }}>{machine.name} · {machine.location}</div>

        <label style={{ display: 'block', marginBottom: 14 }}>
          <span style={lbl}>Fecha de la recolección</span>
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} max={today()} style={inputStyle} />
        </label>
        <label style={{ display: 'block', marginBottom: 14 }}>
          <span style={lbl}>Monto recolectado</span>
          <input type="number" min="0" step="0.5" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.00" autoFocus style={inputStyle} />
        </label>
        <label style={{ display: 'block', marginBottom: 18 }}>
          <span style={lbl}>Notas (opcional)</span>
          <input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Ej. cambié premios, se atascó…" style={inputStyle} />
        </label>

        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={save} disabled={busy} style={primaryBtn}>{busy ? 'Guardando…' : 'Guardar'}</button>
          <button onClick={onClose} style={ghostBtn}>Cancelar</button>
        </div>
      </div>
    </div>
  )
}

// ── Historial de recolecciones ────────────────────────────────────────────────
function HistoryModal({ machine, collections, onClose }: { machine: Machine; collections: Collection[]; onClose: () => void }) {
  const sorted = [...collections].sort((a, b) => (a.collectedAt < b.collectedAt ? 1 : -1))
  const total = collections.reduce((s, c) => s + c.amount, 0)
  return (
    <div onClick={onClose} style={overlay}>
      <div onClick={(e) => e.stopPropagation()} className="cap-pop" style={modal}>
        <div style={{ fontFamily: font.display, fontWeight: 700, fontSize: 20, color: C.text }}>Historial · {machine.name}</div>
        <div style={{ fontSize: 13.5, color: C.muted, marginBottom: 16 }}>{machine.location} · Total recolectado: <b style={{ color: C.pinkDeep }}>{formatMoney(total)}</b></div>

        {sorted.length === 0 ? (
          <div style={{ color: C.muted, textAlign: 'center', padding: 24 }}>Aún no hay recolecciones.</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 360, overflowY: 'auto' }}>
            {sorted.map((c) => (
              <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: 12, background: C.bg, borderRadius: 12, padding: '11px 14px' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: 14, color: C.text }}>{formatDate(c.collectedAt)}</div>
                  {c.notes && <div style={{ fontSize: 12.5, color: C.muted }}>{c.notes}</div>}
                </div>
                <div style={{ fontWeight: 700, color: C.pinkDeep }}>{formatMoney(c.amount)}</div>
              </div>
            ))}
          </div>
        )}
        <div style={{ marginTop: 18 }}><button onClick={onClose} style={ghostBtn}>Cerrar</button></div>
      </div>
    </div>
  )
}

// ── Editar / eliminar máquina ─────────────────────────────────────────────────
function EditMachineModal({ machine, onClose, onSaved, onDeleted }: { machine: Machine; onClose: () => void; onSaved: () => void; onDeleted: () => void }) {
  const toast = useToast()
  const [name, setName] = useState(machine.name)
  const [location, setLocation] = useState(machine.location)
  const [type, setType] = useState<MachineType>(machine.type)
  const [busy, setBusy] = useState(false)

  async function save() {
    if (!name.trim()) return toast('Ponle un nombre.', 'error')
    setBusy(true)
    try {
      await db.updateMachine(machine.id, { name: name.trim(), location: location.trim(), type })
      toast('Máquina actualizada')
      onSaved()
    } catch (err) {
      toast(err instanceof Error ? err.message : 'No se pudo guardar.', 'error')
    } finally {
      setBusy(false)
    }
  }
  async function remove() {
    if (!confirm(`¿Eliminar la máquina "${machine.name}"? Se borrará también su historial de recolecciones.`)) return
    await db.deleteMachine(machine.id)
    toast('Máquina eliminada')
    onDeleted()
  }

  return (
    <div onClick={onClose} style={overlay}>
      <div onClick={(e) => e.stopPropagation()} className="cap-pop" style={{ ...modal, maxWidth: 440 }}>
        <div style={{ fontFamily: font.display, fontWeight: 700, fontSize: 20, color: C.text, marginBottom: 16 }}>Editar máquina</div>
        <label style={{ display: 'block', marginBottom: 14 }}><span style={lbl}>Nombre</span><input value={name} onChange={(e) => setName(e.target.value)} style={inputStyle} /></label>
        <label style={{ display: 'block', marginBottom: 14 }}><span style={lbl}>Ubicación</span><input value={location} onChange={(e) => setLocation(e.target.value)} style={inputStyle} /></label>
        <label style={{ display: 'block', marginBottom: 18 }}>
          <span style={lbl}>Tipo</span>
          <select value={type} onChange={(e) => setType(e.target.value as MachineType)} style={inputStyle}>
            {MACHINE_TYPES.map((t) => <option key={t.id} value={t.id}>{t.label}</option>)}
          </select>
        </label>
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={save} disabled={busy} style={primaryBtn}>{busy ? 'Guardando…' : 'Guardar'}</button>
          <button onClick={onClose} style={ghostBtn}>Cancelar</button>
          <button onClick={remove} style={{ ...ghostBtn, color: C.red, marginLeft: 'auto' }}>Eliminar</button>
        </div>
      </div>
    </div>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ background: gradient.card, borderRadius: 20, padding: '18px 20px', boxShadow: shadow.card }}>
      <div style={{ fontSize: 13, fontWeight: 700, color: C.pinkSoft }}>{label}</div>
      <div style={{ fontFamily: font.display, fontWeight: 700, fontSize: 26, color: C.pinkDeep, marginTop: 4 }}>{value}</div>
    </div>
  )
}

const rowStyle: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: 14, background: C.white, border: `1px solid ${C.border}`, borderRadius: 16, padding: '12px 16px', boxShadow: shadow.sm }
const iconBtn: React.CSSProperties = { background: C.white, border: `1px solid ${C.border}`, color: C.pinkSoft, borderRadius: 10, padding: '8px 12px', fontWeight: 700, fontSize: 13 }
const inputStyle: React.CSSProperties = { width: '100%', border: `1px solid ${C.borderSoft}`, borderRadius: 11, padding: '10px 13px', fontSize: 14.5, color: C.text, outline: 'none', background: '#FFFDFE' }
const lbl: React.CSSProperties = { display: 'block', fontSize: 12.5, fontWeight: 700, color: C.pinkSoft, marginBottom: 5 }
const primaryBtn: React.CSSProperties = { background: gradient.brand, color: '#fff', border: 'none', borderRadius: 12, padding: '11px 22px', fontWeight: 700, boxShadow: shadow.btn }
const ghostBtn: React.CSSProperties = { background: C.white, color: C.pinkSoft, border: `1px solid ${C.border}`, borderRadius: 12, padding: '11px 20px', fontWeight: 700 }
const overlay: React.CSSProperties = { position: 'fixed', inset: 0, background: 'rgba(74,63,74,.35)', backdropFilter: 'blur(3px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, zIndex: 100 }
const modal: React.CSSProperties = { background: C.white, borderRadius: 22, padding: 26, width: '100%', maxWidth: 560, maxHeight: '90vh', overflowY: 'auto', boxShadow: shadow.pop }
