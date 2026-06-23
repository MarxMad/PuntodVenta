import type { CSSProperties, ReactNode } from 'react'
import { categoryById, type CategoryIconName } from '../lib/categories'
import type { MachineIconName } from '../lib/machines'
import { C } from '../theme'

export type UiIconName =
  | 'check'
  | 'alert'
  | 'x'
  | 'printer'
  | 'camera'
  | 'image'
  | 'shopping-cart'
  | 'receipt'
  | 'map-pin'
  | 'phone'
  | 'message'
  | 'clock'
  | 'map'
  | 'mail'
  | 'instagram'
  | 'users'
  | 'banknote'
  | 'gamepad'
  | 'tag'
  | 'shopping-bag'
  | 'leaf'
  | 'heart'
  | 'package'
  | 'user'
  | 'moon'
  | 'lock'
  | 'menu'

export type IconName = CategoryIconName | MachineIconName | UiIconName

const PATHS: Record<IconName, string | string[]> = {
  // Categorías
  pencil: 'M12 20h9 M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z',
  sparkles: [
    'M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .962 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z',
    'M20 3v4 M22 5h-4 M4 17v2 M5 18H3',
  ],
  blocks: ['M12 2L2 7l10 5 10-5-10-5z', 'M2 17l10 5 10-5', 'M2 12l10 5 10-5'],
  candy: ['M12 8v8', 'M8 12h8', 'M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8z'],
  shirt: 'M20.38 3.46 16 2 12 3.5 8 2 3.62 3.46 2 8v13a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V8l-1.62-4.54z M12 3.5V20',
  backpack: 'M4 10a4 4 0 0 1 4-4h8a4 4 0 0 1 4 4v10a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V10z M9 6V4a3 3 0 0 1 6 0v2',
  flower: [
    'M12 7.5a4.5 4.5 0 1 1 4.5 4.5',
    'M12 7.5A4.5 4.5 0 1 0 7.5 12',
    'M12 7.5V9m-4.5 4.5H9m7.5 0H15M12 14.5V16m-4.5-4.5H9m7.5 0H15',
  ],
  gem: 'M6 3h12l4 6-10 13L2 9l4-6z',
  coins: 'M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6',
  gift: 'M20 12v10H4V12M2 7h20v5H2zM12 22V7M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7zM12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z',
  bandage: 'M18 11.5V9a2 2 0 0 0-2-2h-1.5M6 11.5V9a2 2 0 0 1 2-2h1.5M6 18h12a2 2 0 0 0 2-2v-3M6 13v3a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2v-3M12 12v6M9.5 14.5h5',
  ribbon: 'M12 11.5 9.5 8.5a3.5 3.5 0 0 0-5 0L3 9.5V20l4.5-2.5L12 20l4.5-2.5L21 20V9.5l-.5-.5a3.5 3.5 0 0 0-5 0L12 11.5z',
  // Tipos de máquina
  circle: 'M12 12m-4 0a4 4 0 1 0 8 0a4 4 0 1 0-8 0',
  'circles-2': ['M8 12m-3 0a3 3 0 1 0 6 0a3 3 0 1 0-6 0', 'M16 12m-3 0a3 3 0 1 0 6 0a3 3 0 1 0-6 0'],
  'circles-3': [
    'M6 14m-2.5 0a2.5 2.5 0 1 0 5 0a2.5 2.5 0 1 0-5 0',
    'M12 10m-2.5 0a2.5 2.5 0 1 0 5 0a2.5 2.5 0 1 0-5 0',
    'M18 14m-2.5 0a2.5 2.5 0 1 0 5 0a2.5 2.5 0 1 0-5 0',
  ],
  // UI general
  check: 'M20 6 9 17l-5-5',
  alert: 'M12 9v4 M12 17h.01 M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z',
  x: 'M18 6 6 18 M6 6l12 12',
  printer: 'M6 9V2h12v7M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2M6 14h12v8H6z',
  camera: 'M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z M12 17a3 3 0 1 0 0-6 3 3 0 0 0 0 6z',
  image: 'M21 19V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2z M8.5 10a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3z M21 15l-5-5L5 21',
  'shopping-cart': 'M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z M3 6h18 M16 10a4 4 0 0 1-8 0',
  receipt: 'M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1-2-1z M8 10h8 M8 14h8',
  'map-pin': 'M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 1 1 16 0z M12 10a3 3 0 1 0 0-6 3 3 0 0 0 0 6z',
  phone: 'M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z',
  message: 'M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z',
  clock: 'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20z M12 6v6l4 2',
  map: 'M1 6v16l7-4 8 4 7-4V2l-7 4-8-4-7 4z M8 2v16 M16 6v16',
  mail: 'M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z M22 6 12 13 2 6',
  instagram: 'M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-4 0v7h-4v-12h4v2 M2 9h4v12H2z M4 2h4v4H4z',
  users: 'M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2 M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z M23 21v-2a4 4 0 0 0-3-3.87 M16 3.13a4 4 0 0 1 0 7.75',
  banknote: 'M4 10h16M4 14h16M4 6h16a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2z M8 10a2 2 0 1 0 0 4 2 2 0 0 0 0-4z',
  gamepad: 'M6 11h4M8 9v4 M15 12h.01 M18 10h.01 M17 16a6 6 0 0 0-6-6 6 6 0 1 0 6 6z',
  tag: 'M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z M7 7h.01',
  'shopping-bag': 'M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z M3 6h18 M16 10a4 4 0 0 1-8 0',
  leaf: 'M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10z M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12',
  heart: 'M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7.5 7.5L19 14z',
  package: 'M16.5 9.4 7.5 4.21 M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z M3.3 7l8.7 5 8.7-5 M12 22V12',
  user: 'M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2 M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z',
  moon: 'M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z',
  lock: 'M19 11H5a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7a2 2 0 0 0-2-2z M7 11V7a5 5 0 0 1 10 0v4',
  menu: 'M4 6h16 M4 12h16 M4 18h16',
}

export interface IconProps {
  name: IconName
  size?: number
  color?: string
  strokeWidth?: number
  style?: CSSProperties
  className?: string
}

export function Icon({ name, size = 20, color = 'currentColor', strokeWidth = 2, style, className }: IconProps) {
  const d = PATHS[name]
  const paths = Array.isArray(d) ? d : [d]
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ flexShrink: 0, display: 'block', ...style }}
      className={className}
      aria-hidden
    >
      {paths.map((p, i) => <path key={i} d={p} />)}
    </svg>
  )
}

export function CategoryIcon({ categoryId, ...props }: { categoryId: string } & Omit<IconProps, 'name'>) {
  const cat = categoryById(categoryId)
  return <Icon name={cat?.icon ?? 'ribbon'} {...props} />
}

export function MachineIcon({ type, ...props }: { type: string } & Omit<IconProps, 'name'>) {
  const icons: Record<string, MachineIconName> = {
    individual: 'circle',
    doble: 'circles-2',
    triple: 'circles-3',
    peluche: 'blocks',
  }
  return <Icon name={icons[type] ?? 'gamepad'} {...props} />
}

export function IconText({
  icon,
  children,
  gap = 7,
  size = 18,
  color,
  ...rest
}: { icon: IconName; children: ReactNode; gap?: number; size?: number; color?: string } & Omit<IconProps, 'name' | 'size' | 'children'>) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap }}>
      <Icon name={icon} size={size} color={color} {...rest} />
      <span>{children}</span>
    </span>
  )
}

export function StatusBadge({ kind, size = 36 }: { kind: 'ok' | 'error'; size?: number }) {
  const isError = kind === 'error'
  return (
    <div
      style={{
        width: size * 2.1,
        height: size * 2.1,
        borderRadius: '50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: isError ? '#FDECEF' : '#E8F7EF',
      }}
    >
      <Icon name={isError ? 'alert' : 'check'} size={size} color={isError ? C.red : C.green} strokeWidth={2.5} />
    </div>
  )
}
