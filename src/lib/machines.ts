import type { MachineType } from './types'

export interface MachineTypeInfo {
  id: MachineType
  label: string
  emoji: string
}

export const MACHINE_TYPES: MachineTypeInfo[] = [
  { id: 'individual', label: 'Individual', emoji: '🔘' },
  { id: 'doble', label: 'Doble', emoji: '🔘🔘' },
  { id: 'triple', label: 'Triple', emoji: '🔘🔘🔘' },
  { id: 'peluche', label: 'De peluche', emoji: '🧸' },
]

export function machineType(id: string): MachineTypeInfo {
  return MACHINE_TYPES.find((t) => t.id === id) ?? MACHINE_TYPES[0]
}
