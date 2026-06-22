# CLAUDE.md — Guía de implementación y handoff de Caprichitos

> Documento para una futura sesión de Claude (o cualquier dev) que retome este proyecto.
> Resume **qué es**, **cómo está hecho**, **decisiones tomadas** y **trampas ya resueltas**.
> ⚠️ Este archivo NO contiene secretos. Las llaves/contraseñas viven solo en `.env` (ignorado por git).

---

## 1. Qué es

**Caprichitos** es la tienda + sistema de gestión de inventario del usuario (dueño de tienda,
**no técnico**: explicarle en español, simple, con pasos concretos; prefiere ver las cosas
**funcionando y verificadas**, no solo planeadas).

Una sola app web React con dos caras:
- 🛍️ **Catálogo público** (`/`) — lo ven los clientes; se actualiza solo con los productos activos.
- 🔐 **Panel de administración** (ruta secreta, ver §7) — gestión completa del negocio.

Repo: `https://github.com/MarxMad/PuntodVenta`

---

## 2. Stack y arquitectura

| Capa | Tecnología |
|---|---|
| UI | React 18 + Vite 5 + TypeScript (estilos inline, sin framework CSS) |
| Backend | **Supabase** (Postgres + Auth + Storage) — no hay servidor propio |
| Códigos | `qrcode` (genera QR) · `html5-qrcode` (escanea con cámara) |
| Ruteo | `react-router-dom` v6 |

**Concepto clave — modo dual** (`src/lib/supabase.ts`):
- Si existen `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY` en `.env` → **modo NUBE** (Supabase).
- Si no → **modo LOCAL** de prueba (datos en `localStorage`, login con contraseña `caprichitos`).
- `isCloud` decide cuál usar. Toda la app consume la misma interfaz `db` sin saber cuál está activa.

> Prisma se descartó a propósito: la app es frontend-only, Supabase ya es el backend, y Prisma
> no maneja RLS ni Storage. Las tablas se crean con `npm run db:setup` (ver §10).

---

## 3. Estructura de archivos

```
src/
  config.ts            # ADMIN_BASE (ruta secreta del panel) + STORE (contacto/ubicación)
  theme.ts             # Paleta Caprichitos (rosa), sombras, gradientes, fuentes
  index.css            # Estilos globales + animaciones (capFade, capPop, spinner)
  App.tsx              # Router (rutas públicas + admin anidadas bajo ADMIN_BASE)
  main.tsx             # Entry; envuelve en BrowserRouter + ToastProvider
  lib/
    types.ts           # Product, Sale, Order, Machine, Collection, MachineType…
    supabase.ts        # Cliente Supabase + flag isCloud
    db.ts              # ⭐ Capa de datos: interfaz DB + impl. localDB y cloudDB
    auth.ts            # signIn/signOut/isAuthenticated (cloud: Supabase Auth; local: flag)
    storage.ts         # uploadProductImage: redimensiona + sube a Storage (o dataURL local)
    sku.ts             # generateSku → "CAP-<PREFIJO>-XXXX"
    categories.ts      # 11 categorías con prefijo de SKU y emoji
    machines.ts        # MACHINE_TYPES (individual/doble/triple/peluche)
    format.ts          # formatMoney (MXN), formatDate, isToday…
    print.ts           # printLabel: ventana de impresión con QR + nombre + precio + SKU
  components/
    QRCode.tsx         # Renderiza QR a <img> desde un texto (el SKU)
    ImagePicker.tsx    # Subir foto (galería) o tomar foto (getUserMedia + canvas)
    Toast.tsx          # ToastProvider + useToast()
  pages/
    Catalog.tsx        # Catálogo público + footer de contacto/ubicación (lee STORE)
    admin/
      AdminLayout.tsx  # Sidebar + header + guard de auth + Outlet
      Login.tsx
      Dashboard.tsx    # Métricas: ventas hoy, valor inventario, stock bajo
      Products.tsx     # Gestión de catálogo (+ modal de edición, exporta SearchBar/Spinner)
      Inventory.tsx    # Ajuste de stock +/- y alertas
      POS.tsx          # Punto de venta con escáner QR (html5-qrcode)
      Orders.tsx       # Pedidos a proveedor
      Machines.tsx     # Maquinitas: alta por ubicación + recolecciones + historial
      AddProduct.tsx   # Alta de producto: foto + SKU + QR
supabase/schema.sql    # ⭐ Todo el esquema: tablas, RLS, funciones, bucket de fotos
scripts/
  setup-db.mjs         # Corre schema.sql contra Supabase (npm run db:setup)
  create-admin.mjs     # Crea usuario admin en auth.users
```

---

## 4. Modelo de datos (tablas en Supabase)

Definido en `supabase/schema.sql`. Tipos espejo en `src/lib/types.ts`.

- **products**: id, sku (único), name, description, category, price, cost, stock, image_url, active, created_at
- **sales**: id, items (jsonb), total, payment_method, created_at
- **orders**: id, supplier, items (jsonb), status (pendiente/en_camino/recibido), created_at, received_at
- **machines**: id, name, location, type (individual/doble/triple/peluche), active, created_at
- **collections**: id, machine_id (FK→machines, on delete cascade), amount, collected_at (date), notes, created_at

**Funciones SQL** (usadas como RPC en modo nube):
- `adjust_stock(p_id, p_delta)` — suma/resta stock con piso en 0.
- `receive_order(p_id)` — marca pedido recibido y suma su stock por SKU.

**RLS**: el público solo hace `SELECT` de productos con `active = true`; todo lo demás
(escrituras de productos, ventas, pedidos, máquinas, recolecciones) requiere usuario `authenticated`.

**Storage**: bucket público `productos` para las fotos (lectura pública, escritura solo admin).

> El schema es **idempotente** (`create table if not exists`, `drop policy if exists`).
> Se puede re-correr sin miedo cada vez que se añaden tablas.

---

## 5. La capa de datos (`src/lib/db.ts`)

Es el corazón. Una interfaz `DB` con dos implementaciones intercambiables:
- `localDB` → `localStorage` (claves `cap.products`, `cap.sales`, `cap.orders`, `cap.machines`, `cap.collections`). Hace **seed** de productos demo la primera vez.
- `cloudDB` → Supabase. Mapea snake_case (DB) ↔ camelCase (app) con helpers `toProduct`, etc.

`export const db = isCloud ? cloudDB : localDB`. **Al añadir una entidad nueva**, hay que:
1. Añadir tipo en `types.ts`.
2. Añadir métodos a la interfaz `DB`.
3. Implementar en `localDB` **y** en `cloudDB`.
4. Añadir tabla + RLS en `schema.sql` y correr `npm run db:setup`.

---

## 6. Pantallas / funcionalidades

- **Alta de producto**: SKU y QR automáticos al guardar; foto vía `ImagePicker` (galería o cámara), se sube con `uploadProductImage` (redimensiona a ≤1100px JPEG).
- **POS**: `html5-qrcode` lee el QR (que contiene el SKU) → busca el producto → carrito → total → `db.createSale` (descuenta stock). Solo calcula total; **no procesa pagos** (decisión del usuario).
- **Máquinas**: alta de **varias máquinas a una misma ubicación** de un jalón; registrar **recolección** (monto + fecha); historial y totales por máquina/ubicación/mes.
- **Catálogo público**: footer con datos de `STORE` (solo muestra los campos rellenos).

---

## 7. Configuración (`src/config.ts`)

- `ADMIN_BASE` = ruta **secreta** del panel (actualmente `/cap-panel-2741`). No está enlazada
  en ninguna parte (el catálogo no tiene botón "Administrar"). Login en `${ADMIN_BASE}/login`.
  ⚠️ Como el repo puede ser público, esta ruta es visible en el código → no es seguridad real,
  solo "ocultamiento". La seguridad real es el login + RLS.
- `STORE` = datos de contacto/ubicación del footer del catálogo. Solo el email está lleno;
  faltan whatsapp/phone/address/city/hours/instagram/facebook/mapsUrl (vacíos no se muestran).

---

## 8. Autenticación (`src/lib/auth.ts`)
- Nube: `supabase.auth.signInWithPassword` / `getSession`.
- Local: contraseña fija `caprichitos` + flag en `localStorage` (solo para probar).

---

## 9. Estilo / convenciones
- **Estilos inline** con tokens de `theme.ts` (no hay Tailwind ni CSS modules). Mantener ese patrón.
- Paleta: rosa `#EC6F9C`/`#C04F7E`, fondo `#FFF8FB`, gradientes en `theme.ts`.
- Fuentes: Quicksand (títulos) + Nunito (texto), cargadas en `index.html`.
- Todo en **español** de cara al usuario (labels, toasts, mensajes).
- Animaciones: clases `cap-fade`, `cap-pop`, `cap-spinner`.

---

## 10. Scripts y setup de Supabase

```bash
npm run dev        # desarrollo (localhost:5173)
npm run build      # tsc -b && vite build
npm run db:setup   # crea/actualiza tablas+RLS+storage en Supabase
node scripts/create-admin.mjs "correo" "password"   # crea usuario admin
```

Ambos scripts leen `SUPABASE_DB_URL` del `.env` (conexión directa a Postgres).

---

## 11. ⚠️ TRAMPAS YA RESUELTAS (leer antes de tocar Supabase/red)

1. **Conexión a Supabase = usar el "Session pooler", NO la directa.**
   La conexión directa `db.<ref>.supabase.co` es **solo IPv6** y es **inalcanzable** desde
   muchos entornos/herramientas (da `ENOTFOUND`/`EHOSTUNREACH`). Hay que usar el **Session
   pooler** (IPv4): `postgresql://postgres.<ref>:<password>@aws-1-<region>.pooler.supabase.com:5432/postgres`.
   Esa es la cadena que va en `SUPABASE_DB_URL`.

2. **`pg` + DNS:** el resolvedor del sistema (getaddrinfo) a veces no resuelve hosts de
   Supabase. Por eso `scripts/*.mjs` tienen `resolveHost()` que cae a `dns.resolve6`/`resolve4`.
   No quitar ese fallback.

3. **Operaciones de red en sandbox:** los `npm run db:setup`, `create-admin`, `git push` y
   los scripts contra Supabase necesitan red → correrlos con el sandbox deshabilitado
   (`dangerouslyDisableSandbox`). DNS de google funciona pero los hosts de Supabase requieren la red real.

4. **Crear usuario admin por SQL (GoTrue):** al insertar en `auth.users` directo, las columnas
   de token (`confirmation_token`, `recovery_token`, `email_change`, `email_change_token_new`,
   `email_change_token_current`, `phone_change`, `phone_change_token`, `reauthentication_token`)
   deben ir como `''` y **no NULL**, o el login falla con `"Database error querying schema"`.
   Además hay que crear la fila en `auth.identities` con `provider='email'`, `provider_id` y
   `identity_data` con `sub`/`email`. `scripts/create-admin.mjs` ya lo hace bien.

5. **Artefactos de compilación:** `tsc -b` emite `vite.config.js`, `vite.config.d.ts` y
   `*.tsbuildinfo`. Están en `.gitignore`. `git check-ignore` no los reporta si ya estaban
   trackeados (hay que `git rm --cached` primero).

---

## 12. Cómo verificar visualmente (lo que se hizo en este proyecto)

No hay tests automatizados; la verificación fue por **screenshots con Chrome headless**:
- Páginas públicas/login: `Google Chrome --headless=new --screenshot=... <url>`.
- **Páginas admin en modo nube**: requieren sesión real de Supabase (no se puede falsear con
  localStorage). Se usó un script CDP que: abre `--remote-debugging-port`, navega al login,
  rellena los inputs con el *native value setter* + `dispatchEvent(new Event('input',{bubbles:true}))`
  (porque son inputs controlados por React), hace click en submit, y luego navega y captura.
- Para ver datos sin ensuciar la base: sembrar filas con `location='__TEST__'` vía pooler y
  borrarlas después.

Luego leer el PNG resultante con la herramienta Read para inspeccionarlo.

---

## 13. Estado actual y pendientes

✅ Hecho y verificado:
- Modo nube operativo (tablas creadas, login admin funcionando).
- Catálogo, alta con foto+QR, inventario, POS, pedidos, máquinas con recolecciones.
- Subido a GitHub (sin secretos).

⏳ Pendientes / próximos pasos:
- Rellenar datos de contacto reales en `STORE` (`src/config.ts`).
- Subir productos reales.
- **Publicar en Vercel** (importar repo + variables `VITE_*`; ruteo SPA ya configurado en
  `vercel.json` y `public/_redirects`).
- Decidir visibilidad del repo (privado recomendado para un negocio; si queda público,
  considerar cambiar `ADMIN_BASE`).
- Posibles mejoras: pagos reales en POS, subir foto a Storage también en máquinas, reportes/export.

---

## 14. Cómo retomar (guía rápida para tu yo futuro)
1. Lee este archivo y `src/lib/db.ts` (la capa de datos) primero.
2. `npm install && npm run dev`. Sin `.env` arranca en modo local de prueba (login `caprichitos`).
3. Para tocar la base: edita `supabase/schema.sql` y corre `npm run db:setup` (idempotente).
4. Respeta el patrón: tipos → interfaz `DB` → localDB + cloudDB → schema.
5. Habla en español y simple con el usuario; entrega cosas **verificadas**.
6. Las llaves reales nunca al repo: solo en `.env`. Para acciones contra Supabase/red usa el modo sin sandbox.
