import { supabase, isCloud } from './supabase'
import { db } from './db'
import type { SessionInfo } from './types'

const LOCAL_FLAG = 'cap.admin.session'
const LOCAL_PASSWORD = 'caprichitos'
const SESSION_KEY = 'cap.session'

export async function signIn(email: string, password: string): Promise<SessionInfo> {
  if (isCloud) {
    const { error } = await supabase!.auth.signInWithPassword({ email, password })
    if (error) throw new Error('Correo o contraseña incorrectos.')
    const info = await db.getSessionInfo()
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(info))
    return info
  }

  const info = await db.localSignIn(email, password)
  if (!info) {
    if (password === LOCAL_PASSWORD) {
      const admin: SessionInfo = { email: email || 'admin@local', name: 'Administrador', permissions: ['*'] }
      localStorage.setItem(LOCAL_FLAG, '1')
      sessionStorage.setItem(SESSION_KEY, JSON.stringify(admin))
      return admin
    }
    throw new Error('Correo o contraseña incorrectos.')
  }
  localStorage.setItem(LOCAL_FLAG, '1')
  sessionStorage.setItem(SESSION_KEY, JSON.stringify(info))
  return info
}

export async function signOut(): Promise<void> {
  if (isCloud) await supabase!.auth.signOut()
  localStorage.removeItem(LOCAL_FLAG)
  sessionStorage.removeItem(SESSION_KEY)
}

export async function isAuthenticated(): Promise<boolean> {
  if (isCloud) {
    const { data } = await supabase!.auth.getSession()
    return Boolean(data.session)
  }
  return localStorage.getItem(LOCAL_FLAG) === '1'
}

export async function getSession(): Promise<SessionInfo> {
  const cached = sessionStorage.getItem(SESSION_KEY)
  if (cached) {
    try { return JSON.parse(cached) as SessionInfo } catch { /* refresh below */ }
  }
  const info = await db.getSessionInfo()
  sessionStorage.setItem(SESSION_KEY, JSON.stringify(info))
  return info
}

export async function refreshSession(): Promise<SessionInfo> {
  sessionStorage.removeItem(SESSION_KEY)
  return getSession()
}
