import { createClient, type SupabaseClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

// Si hay llaves configuradas usamos Supabase (nube). Si no, la app
// funciona en modo local con datos de prueba guardados en el navegador.
export const isCloud = Boolean(url && anonKey)

export const supabase: SupabaseClient | null = isCloud
  ? createClient(url!, anonKey!)
  : null
