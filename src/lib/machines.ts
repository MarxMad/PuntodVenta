import type { MachineType } from './types'

export type MachineIconName = 'circle' | 'circles-2' | 'circles-3' | 'blocks'

export interface MachineTypeInfo {
  id: MachineType
  label: string
  icon: MachineIconName
}

export const MACHINE_TYPES: MachineTypeInfo[] = [
  { id: 'individual', label: 'Individual', icon: 'circle' },
  { id: 'doble', label: 'Doble', icon: 'circles-2' },
  { id: 'triple', label: 'Triple', icon: 'circles-3' },
  { id: 'peluche', label: 'De peluche', icon: 'blocks' },
]

export function machineType(id: string): MachineTypeInfo {
  return MACHINE_TYPES.find((t) => t.id === id) ?? MACHINE_TYPES[0]
}
