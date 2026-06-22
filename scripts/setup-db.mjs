// Arma las tablas, la seguridad y el almacenamiento de Caprichitos en Supabase,
// corriendo supabase/schema.sql directo contra tu base de datos.
//
// CÓMO USARLO:
//   1. En Supabase ve a: Project Settings → Database → "Connection string" → URI.
//   2. Copia esa cadena y reemplaza [YOUR-PASSWORD] por la contraseña de tu base.
//   3. Pégala en el archivo .env como una línea nueva:
//        SUPABASE_DB_URL=postgresql://postgres:TU_PASSWORD@db.xxxx.supabase.co:5432/postgres
//   4. Ejecuta:  npm run db:setup
//
// (SUPABASE_DB_URL NO se expone al navegador: Vite solo publica variables que
//  empiezan con VITE_. Tu contraseña se queda en tu computadora.)

import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import dns from 'node:dns'
import { promisify } from 'node:util'
import pg from 'pg'

const lookup = promisify(dns.lookup)
const resolve6 = promisify(dns.resolve6)
const resolve4 = promisify(dns.resolve4)

// Supabase entrega la conexión directa solo por IPv6, y a veces el resolvedor
// del sistema no la encuentra. Si falla, la resolvemos consultando el DNS a mano.
async function resolveHost(host) {
  try { await lookup(host); return host } catch {}
  try { const a = await resolve6(host); if (a[0]) return a[0] } catch {}
  try { const a = await resolve4(host); if (a[0]) return a[0] } catch {}
  return host
}

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = join(__dirname, '..')

// Lee SUPABASE_DB_URL desde el entorno o desde el archivo .env
function getDbUrl() {
  if (process.env.SUPABASE_DB_URL) return process.env.SUPABASE_DB_URL.trim()
  try {
    const env = readFileSync(join(root, '.env'), 'utf8')
    const line = env.split('\n').find((l) => l.trim().startsWith('SUPABASE_DB_URL='))
    if (line) return line.slice(line.indexOf('=') + 1).trim().replace(/^["']|["']$/g, '')
  } catch {}
  return null
}

const dbUrl = getDbUrl()
if (!dbUrl) {
  console.error('\n❌ Falta SUPABASE_DB_URL.\n')
  console.error('Agrega esta línea a tu archivo .env (cambia la contraseña):')
  console.error('  SUPABASE_DB_URL=postgresql://postgres:TU_PASSWORD@db.xxxx.supabase.co:5432/postgres\n')
  console.error('La encuentras en: Supabase → Project Settings → Database → Connection string (URI).\n')
  process.exit(1)
}

const sql = readFileSync(join(root, 'supabase', 'schema.sql'), 'utf8')

const u = new URL(dbUrl)
const host = await resolveHost(u.hostname)
const client = new pg.Client({
  host,
  port: Number(u.port) || 5432,
  user: decodeURIComponent(u.username),
  password: decodeURIComponent(u.password),
  database: u.pathname.replace(/^\//, '') || 'postgres',
  ssl: { rejectUnauthorized: false }, // Supabase requiere conexión segura
})

try {
  console.log('🔌 Conectando a tu base de datos de Supabase…')
  await client.connect()
  console.log('🛠️  Creando tablas, seguridad y almacenamiento…')
  await client.query(sql)
  console.log('\n✅ ¡Listo! Tu base de datos quedó armada:')
  console.log('   • Tablas: products, sales, orders')
  console.log('   • Reglas de seguridad (clientes solo leen, admin gestiona)')
  console.log('   • Almacenamiento de fotos (bucket "productos")')
  console.log('\nSiguiente paso: crea tu usuario admin en Supabase → Authentication → Users.\n')
} catch (err) {
  console.error('\n❌ No se pudo configurar la base de datos:')
  console.error('   ' + (err?.message || err))
  console.error('\nRevisa que la contraseña en SUPABASE_DB_URL sea correcta y que copiaste la cadena completa.\n')
  process.exitCode = 1
} finally {
  await client.end().catch(() => {})
}
