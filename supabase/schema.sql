-- ╔══════════════════════════════════════════════════════════════════════╗
-- ║  Caprichitos · Esquema de base de datos para Supabase                  ║
-- ╠══════════════════════════════════════════════════════════════════════╣
-- ║  CÓMO USARLO:                                                          ║
-- ║   1. Entra a tu proyecto en https://supabase.com                       ║
-- ║   2. Menú lateral → "SQL Editor" → "New query"                         ║
-- ║   3. Pega TODO este archivo y presiona "Run".                          ║
-- ║   4. Listo: se crean las tablas, las reglas de seguridad y las         ║
-- ║      funciones que usa la app.                                         ║
-- ╚══════════════════════════════════════════════════════════════════════╝

-- ── Tabla de productos ──────────────────────────────────────────────────
create table if not exists public.products (
  id          uuid primary key default gen_random_uuid(),
  sku         text unique not null,
  name        text not null,
  description text default '',
  category    text not null,
  price       numeric(10,2) not null default 0,
  cost        numeric(10,2) not null default 0,
  stock       integer not null default 0,
  image_url   text,
  active      boolean not null default true,
  created_at  timestamptz not null default now()
);

-- ── Tabla de ventas ─────────────────────────────────────────────────────
create table if not exists public.sales (
  id             uuid primary key default gen_random_uuid(),
  items          jsonb not null,          -- [{ productId, sku, name, price, qty }]
  total          numeric(10,2) not null,
  payment_method text not null,
  created_at     timestamptz not null default now()
);

-- ── Tabla de pedidos (reposición / proveedor) ───────────────────────────
create table if not exists public.orders (
  id          uuid primary key default gen_random_uuid(),
  supplier    text not null,
  items       jsonb not null,             -- [{ sku, name, qty, cost }]
  status      text not null default 'pendiente',
  created_at  timestamptz not null default now(),
  received_at timestamptz
);

-- ── Máquinas (vending / peluche) y sus recolecciones ───────────────────
create table if not exists public.machines (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  location   text not null default '',
  type       text not null default 'individual', -- individual | doble | triple | peluche
  active     boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.collections (
  id           uuid primary key default gen_random_uuid(),
  machine_id   uuid not null references public.machines(id) on delete cascade,
  amount       numeric(10,2) not null default 0,
  collected_at date not null default current_date,
  notes        text default '',
  created_at   timestamptz not null default now()
);

-- ── Función: ajustar stock (suma o resta) ───────────────────────────────
create or replace function public.adjust_stock(p_id uuid, p_delta integer)
returns void language sql as $$
  update public.products
     set stock = greatest(0, stock + p_delta)
   where id = p_id;
$$;

-- ── Función: recibir pedido (marca recibido y suma stock por SKU) ───────
create or replace function public.receive_order(p_id uuid)
returns void language plpgsql as $$
declare item jsonb;
begin
  update public.orders
     set status = 'recibido', received_at = now()
   where id = p_id;

  for item in
    select * from jsonb_array_elements((select items from public.orders where id = p_id))
  loop
    update public.products
       set stock = stock + (item->>'qty')::int
     where sku = item->>'sku';
  end loop;
end;
$$;

-- ╔══════════════════════════════════════════════════════════════════════╗
-- ║  SEGURIDAD (Row Level Security)                                        ║
-- ║   • El público (clientes) SOLO puede LEER productos activos.           ║
-- ║   • Tú (admin con sesión iniciada) puedes hacer TODO.                  ║
-- ╚══════════════════════════════════════════════════════════════════════╝
alter table public.products    enable row level security;
alter table public.sales       enable row level security;
alter table public.orders      enable row level security;
alter table public.machines    enable row level security;
alter table public.collections enable row level security;

-- Clientes: leer solo productos activos
drop policy if exists "publico lee productos activos" on public.products;
create policy "publico lee productos activos"
  on public.products for select
  using (active = true);

-- Admin autenticado: control total de productos
drop policy if exists "admin gestiona productos" on public.products;
create policy "admin gestiona productos"
  on public.products for all
  to authenticated using (true) with check (true);

-- Ventas y pedidos: solo admin autenticado
drop policy if exists "admin gestiona ventas" on public.sales;
create policy "admin gestiona ventas"
  on public.sales for all
  to authenticated using (true) with check (true);

drop policy if exists "admin gestiona pedidos" on public.orders;
create policy "admin gestiona pedidos"
  on public.orders for all
  to authenticated using (true) with check (true);

-- Máquinas y recolecciones: solo admin autenticado
drop policy if exists "admin gestiona maquinas" on public.machines;
create policy "admin gestiona maquinas"
  on public.machines for all
  to authenticated using (true) with check (true);

drop policy if exists "admin gestiona recolecciones" on public.collections;
create policy "admin gestiona recolecciones"
  on public.collections for all
  to authenticated using (true) with check (true);

-- ╔══════════════════════════════════════════════════════════════════════╗
-- ║  ALMACENAMIENTO DE FOTOS (Storage)                                     ║
-- ║   Crea el bucket público "productos" y sus permisos para que la app    ║
-- ║   pueda subir fotos (galería o cámara) y los clientes verlas.          ║
-- ╚══════════════════════════════════════════════════════════════════════╝
insert into storage.buckets (id, name, public)
values ('productos', 'productos', true)
on conflict (id) do nothing;

-- Cualquiera puede VER las fotos
drop policy if exists "publico ve fotos de productos" on storage.objects;
create policy "publico ve fotos de productos"
  on storage.objects for select
  using (bucket_id = 'productos');

-- Solo el admin autenticado puede subir / cambiar / borrar fotos
drop policy if exists "admin sube fotos de productos" on storage.objects;
create policy "admin sube fotos de productos"
  on storage.objects for insert
  to authenticated with check (bucket_id = 'productos');

drop policy if exists "admin actualiza fotos de productos" on storage.objects;
create policy "admin actualiza fotos de productos"
  on storage.objects for update
  to authenticated using (bucket_id = 'productos');

drop policy if exists "admin borra fotos de productos" on storage.objects;
create policy "admin borra fotos de productos"
  on storage.objects for delete
  to authenticated using (bucket_id = 'productos');
