import { supabase, isCloud } from './supabase'

// Autenticación del panel de administración.
//  • En modo NUBE usa el login real de Supabase (email + contraseña).
//  • En modo LOCAL usa una contraseña simple guardada en el navegador,
//    pensada solo para probar. Contraseña por defecto: "caprichitos".
const LOCAL_FLAG = 'cap.admin.session'
const LOCAL_PASSWORD = 'caprichitos'

export async function signIn(email: string, password: string): Promise<void> {
  if (isCloud) {
    const { error } = await supabase!.auth.signInWithPassword({ email, password })
    if (error) throw new Error('Correo o contraseña incorrectos.')
    return
  }
  if (password !== LOCAL_PASSWORD) {
    throw new Error('Contraseña incorrecta. (Modo prueba: "caprichitos")')
  }
  localStorage.setItem(LOCAL_FLAG, '1')
}

export async function signOut(): Promise<void> {
  if (isCloud) await supabase!.auth.signOut()
  localStorage.removeItem(LOCAL_FLAG)
}

export async function isAuthenticated(): Promise<boolean> {
  if (isCloud) {
    const { data } = await supabase!.auth.getSession()
    return Boolean(data.session)
  }
  return localStorage.getItem(LOCAL_FLAG) === '1'
}
