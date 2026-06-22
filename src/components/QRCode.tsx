import { useEffect, useState } from 'react'
import QR from 'qrcode'

interface Props {
  value: string
  size?: number
}

// Genera un código QR como imagen a partir de un texto (el SKU del producto).
export function QRCode({ value, size = 160 }: Props) {
  const [url, setUrl] = useState<string>('')

  useEffect(() => {
    let active = true
    QR.toDataURL(value, {
      width: size * 2, // doble resolución para que se vea nítido al imprimir
      margin: 1,
      color: { dark: '#4A3F4A', light: '#FFFFFF' },
    })
      .then((u) => active && setUrl(u))
      .catch(() => active && setUrl(''))
    return () => {
      active = false
    }
  }, [value, size])

  if (!url) return <div style={{ width: size, height: size }} />
  return <img src={url} width={size} height={size} alt={`QR ${value}`} style={{ display: 'block' }} />
}
