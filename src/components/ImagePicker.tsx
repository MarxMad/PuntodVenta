import { useEffect, useRef, useState } from 'react'
import { C, gradient, shadow } from '../theme'

export interface ImageValue {
  file: File | null // foto nueva, aún sin guardar
  url: string | null // foto ya guardada (al editar)
}

interface Props {
  value: ImageValue
  onChange: (v: ImageValue) => void
  emoji?: string
}

export function ImagePicker({ value, onChange, emoji = '🎀' }: Props) {
  const fileRef = useRef<HTMLInputElement>(null)
  const [cameraOpen, setCameraOpen] = useState(false)
  const [preview, setPreview] = useState<string | null>(value.url)

  // Genera/limpia la vista previa cuando hay un archivo nuevo
  useEffect(() => {
    if (value.file) {
      const u = URL.createObjectURL(value.file)
      setPreview(u)
      return () => URL.revokeObjectURL(u)
    }
    setPreview(value.url)
  }, [value.file, value.url])

  function pickFromGallery(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]
    if (f) onChange({ file: f, url: value.url })
    e.target.value = '' // permite volver a elegir el mismo archivo
  }

  function onCaptured(file: File) {
    setCameraOpen(false)
    onChange({ file, url: value.url })
  }

  return (
    <div>
      <div
        style={{
          width: '100%', height: 180, borderRadius: 16, border: `1px dashed ${C.border}`,
          background: preview ? `url(${preview}) center/cover` : gradient.card,
          display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden',
        }}
      >
        {!preview && <div style={{ fontSize: 46, opacity: 0.7 }}>{emoji}</div>}
        {preview && (
          <button
            type="button"
            onClick={() => onChange({ file: null, url: null })}
            title="Quitar foto"
            style={{ position: 'absolute', top: 8, right: 8, width: 30, height: 30, borderRadius: 999, border: 'none', background: 'rgba(74,63,74,.6)', color: '#fff', fontWeight: 700, fontSize: 15 }}
          >
            ✕
          </button>
        )}
      </div>

      <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
        <button type="button" onClick={() => fileRef.current?.click()} style={btn}>🖼️ Subir foto</button>
        <button type="button" onClick={() => setCameraOpen(true)} style={btn}>📷 Tomar foto</button>
      </div>
      <input ref={fileRef} type="file" accept="image/*" onChange={pickFromGallery} style={{ display: 'none' }} />

      {cameraOpen && <CameraModal onCapture={onCaptured} onClose={() => setCameraOpen(false)} />}
    </div>
  )
}

function CameraModal({ onCapture, onClose }: { onCapture: (f: File) => void; onClose: () => void }) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false
    navigator.mediaDevices
      .getUserMedia({ video: { facingMode: 'environment' }, audio: false })
      .then((stream) => {
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop())
          return
        }
        streamRef.current = stream
        if (videoRef.current) videoRef.current.srcObject = stream
      })
      .catch(() => setError('No se pudo abrir la cámara. Revisa los permisos del navegador.'))

    return () => {
      cancelled = true
      streamRef.current?.getTracks().forEach((t) => t.stop())
    }
  }, [])

  function snap() {
    const video = videoRef.current
    if (!video) return
    const canvas = document.createElement('canvas')
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    canvas.getContext('2d')!.drawImage(video, 0, 0)
    canvas.toBlob((blob) => {
      if (blob) onCapture(new File([blob], 'foto.jpg', { type: 'image/jpeg' }))
    }, 'image/jpeg', 0.9)
  }

  return (
    <div onClick={onClose} style={overlay}>
      <div onClick={(e) => e.stopPropagation()} className="cap-pop" style={{ background: C.white, borderRadius: 22, padding: 20, width: '100%', maxWidth: 460, boxShadow: shadow.pop }}>
        <div style={{ fontWeight: 700, fontSize: 17, color: C.text, marginBottom: 12 }}>Tomar foto</div>
        {error ? (
          <div style={{ background: '#FDECEF', color: C.red, borderRadius: 12, padding: 14, fontSize: 14, fontWeight: 600 }}>{error}</div>
        ) : (
          <video ref={videoRef} autoPlay playsInline style={{ width: '100%', borderRadius: 14, background: '#000' }} />
        )}
        <div style={{ display: 'flex', gap: 10, marginTop: 14 }}>
          {!error && (
            <button onClick={snap} style={{ flex: 1, background: gradient.brand, color: '#fff', border: 'none', borderRadius: 13, padding: '12px', fontWeight: 700, fontSize: 15, boxShadow: shadow.btn }}>
              📸 Capturar
            </button>
          )}
          <button onClick={onClose} style={{ background: C.white, color: C.pinkSoft, border: `1px solid ${C.border}`, borderRadius: 13, padding: '12px 20px', fontWeight: 700 }}>Cancelar</button>
        </div>
      </div>
    </div>
  )
}

const btn: React.CSSProperties = {
  flex: 1, background: C.white, color: C.pinkSoft, border: `1px solid ${C.border}`,
  borderRadius: 12, padding: '11px', fontWeight: 700, fontSize: 14,
}
const overlay: React.CSSProperties = {
  position: 'fixed', inset: 0, background: 'rgba(74,63,74,.45)', backdropFilter: 'blur(3px)',
  display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, zIndex: 200,
}
