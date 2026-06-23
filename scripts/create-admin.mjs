// Crea (o actualiza la contraseña de) un usuario administrador en Supabase Auth,
// directo en la base de datos. Útil porque no usamos el dashboard.
//
// USO:  node scripts/create-admin.mjs "correo@dominio.com" "tu_contraseña"
// (Lee la conexión SUPABASE_DB_URL del archivo .env)

import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import dns from 'node:dns'
import { promisify } from 'node:util'
import pg from 'pg'

const lookup = promisify(dns.lookup)
const resolve6 = promisify(dns.resolve6)
const resolve4 = promisify(dns.resolve4)
async function resolveHost(host) {
  try { await lookup(host); return host } catch {}
  try { const a = await resolve6(host); if (a[0]) return a[0] } catch {}
  try { const a = await resolve4(host); if (a[0]) return a[0] } catch {}
  return host
}

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const email = (process.argv[2] || '').trim().toLowerCase()
const password = process.argv[3] || ''
if (!email || !password) {
  console.error('Uso: node scripts/create-admin.mjs "correo" "contraseña"')
  process.exit(1)
}

const env = readFileSync(join(root, '.env'), 'utf8')
const dbUrl = env.split('\n').find((l) => l.startsWith('SUPABASE_DB_URL='))?.split('=').slice(1).join('=').trim()
if (!dbUrl) { console.error('Falta SUPABASE_DB_URL en .env'); process.exit(1) }

const u = new URL(dbUrl)
const host = await resolveHost(u.hostname)
const client = new pg.Client({
  host, port: Number(u.port) || 5432,
  user: decodeURIComponent(u.username), password: decodeURIComponent(u.password),
  database: 'postgres', ssl: { rejectUnauthorized: false },
})

try {
  await client.connect()

  // Esquema donde vive pgcrypto (crypt / gen_salt)
  const { rows } = await client.query(
    `select n.nspname from pg_proc p join pg_namespace n on n.oid = p.pronamespace where p.proname = 'gen_salt' limit 1`,
  )
  const cryptSchema = rows[0]?.nspname || 'public'
  const crypt = `${cryptSchema}.crypt`
  const gen_salt = `${cryptSchema}.gen_salt`

  // ¿Ya existe?
  const existing = await client.query('select id from auth.users where email = $1', [email])

  if (existing.rows.length > 0) {
    const id = existing.rows[0].id
    await client.query(
      `update auth.users set encrypted_password = ${crypt}($1, ${gen_salt}('bf')), email_confirmed_at = now(), updated_at = now() where id = $2`,
      [password, id],
    )
    console.log(`\n✅ Usuario ya existía: se actualizó la contraseña de ${email}\n`)
    await client.query(
      `insert into public.staff (user_id, email, name, permissions)
       values ($1, $2, $3, array['*']::text[])
       on conflict (email) do update set user_id = $1, permissions = array['*']::text[], active = true`,
      [id, email, email.split('@')[0]],
    ).catch(() => {})
  } else {
    const id = (await client.query('select gen_random_uuid() as id')).rows[0].id
    await client.query(
      `insert into auth.users
        (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
         created_at, updated_at, raw_app_meta_data, raw_user_meta_data,
         confirmation_token, recovery_token, email_change, email_change_token_new,
         email_change_token_current, phone_change, phone_change_token, reauthentication_token)
       values
        ('00000000-0000-0000-0000-000000000000', $1, 'authenticated', 'authenticated', $2,
         ${crypt}($3, ${gen_salt}('bf')), now(), now(), now(),
         '{"provider":"email","providers":["email"]}', '{}',
         '', '', '', '', '', '', '', '')`,
      [id, email, password],
    )
    await client.query(
      `insert into auth.identities
        (id, user_id, provider_id, provider, identity_data, last_sign_in_at, created_at, updated_at)
       values
        (gen_random_uuid(), $1::uuid, $2::text, 'email',
         jsonb_build_object('sub', $2::text, 'email', $3::text, 'email_verified', true, 'phone_verified', false),
         now(), now(), now())`,
      [id, id, email],
    )
    console.log(`\n✅ Usuario admin creado: ${email}\n   Contraseña configurada. Ya puedes iniciar sesión.\n`)
    await client.query(
      `insert into public.staff (user_id, email, name, permissions)
       values ($1, $2, $3, array['*']::text[])
       on conflict (email) do update set user_id = $1, name = $3, permissions = array['*']::text[], active = true`,
      [id, email, email.split('@')[0]],
    )
  }
} catch (err) {
  console.error('\n❌ No se pudo crear el usuario:\n   ' + (err?.message || err) + '\n')
  process.exitCode = 1
} finally {
  await client.end().catch(() => {})
}
