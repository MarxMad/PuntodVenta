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

-- ╔══════════════════════════════════════════════════════════════════════╗
-- ║  COLABORADORES Y PERMISOS                                              ║
-- ╚══════════════════════════════════════════════════════════════════════╝

create table if not exists public.staff (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid unique references auth.users(id) on delete set null,
  email       text unique not null,
  name        text not null,
  permissions text[] not null default '{}',
  active      boolean not null default true,
  created_at  timestamptz not null default now()
);

alter table public.staff enable row level security;

-- ¿Hay filas en staff? (para migración suave de admins existentes)
create or replace function public.staff_table_populated()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.staff limit 1);
$$;

-- Permisos del usuario actual
create or replace function public.current_permissions()
returns text[] language sql stable security definer set search_path = public as $$
  select case
    when auth.uid() is null then '{}'::text[]
    when not public.staff_table_populated() then array['*']::text[]
    when not exists (select 1 from public.staff s where s.user_id = auth.uid())
      then array['*']::text[]
    else coalesce(
      (select s.permissions from public.staff s where s.user_id = auth.uid() and s.active limit 1),
      '{}'::text[]
    )
  end;
$$;

create or replace function public.has_permission(p_perm text)
returns boolean language sql stable security definer set search_path = public as $$
  select '*' = any(public.current_permissions()) or p_perm = any(public.current_permissions());
$$;

create or replace function public.get_my_permissions()
returns text[] language sql stable security definer set search_path = public as $$
  select public.current_permissions();
$$;

-- ── RLS staff ───────────────────────────────────────────────────────────
drop policy if exists "staff lee equipo" on public.staff;
create policy "staff lee equipo"
  on public.staff for select to authenticated
  using (public.has_permission('staff') or user_id = auth.uid());

drop policy if exists "staff gestiona equipo" on public.staff;
create policy "staff gestiona equipo"
  on public.staff for insert to authenticated
  with check (public.has_permission('staff'));

drop policy if exists "staff actualiza equipo" on public.staff;
create policy "staff actualiza equipo"
  on public.staff for update to authenticated
  using (public.has_permission('staff'))
  with check (public.has_permission('staff'));

-- ── RLS productos (por permiso) ─────────────────────────────────────────
drop policy if exists "admin gestiona productos" on public.products;

drop policy if exists "staff lee productos" on public.products;
create policy "staff lee productos"
  on public.products for select to authenticated
  using (
    public.has_permission('pos') or public.has_permission('inventory')
    or public.has_permission('products') or public.has_permission('orders')
    or public.has_permission('reports')
  );

drop policy if exists "staff crea productos" on public.products;
create policy "staff crea productos"
  on public.products for insert to authenticated
  with check (public.has_permission('products'));

drop policy if exists "staff actualiza productos" on public.products;
create policy "staff actualiza productos"
  on public.products for update to authenticated
  using (public.has_permission('products') or public.has_permission('inventory'))
  with check (public.has_permission('products') or public.has_permission('inventory'));

drop policy if exists "staff borra productos" on public.products;
create policy "staff borra productos"
  on public.products for delete to authenticated
  using (public.has_permission('products'));

-- ── RLS ventas ──────────────────────────────────────────────────────────
drop policy if exists "admin gestiona ventas" on public.sales;

drop policy if exists "staff lee ventas" on public.sales;
create policy "staff lee ventas"
  on public.sales for select to authenticated
  using (public.has_permission('pos') or public.has_permission('reports'));

drop policy if exists "staff registra ventas" on public.sales;
create policy "staff registra ventas"
  on public.sales for insert to authenticated
  with check (public.has_permission('pos'));

-- ── RLS pedidos ─────────────────────────────────────────────────────────
drop policy if exists "admin gestiona pedidos" on public.orders;
drop policy if exists "staff pedidos" on public.orders;
create policy "staff pedidos"
  on public.orders for all to authenticated
  using (public.has_permission('orders'))
  with check (public.has_permission('orders'));

-- ── RLS máquinas ────────────────────────────────────────────────────────
drop policy if exists "admin gestiona maquinas" on public.machines;
drop policy if exists "staff maquinas" on public.machines;
create policy "staff maquinas"
  on public.machines for all to authenticated
  using (public.has_permission('machines'))
  with check (public.has_permission('machines'));

drop policy if exists "admin gestiona recolecciones" on public.collections;
drop policy if exists "staff recolecciones" on public.collections;
create policy "staff recolecciones"
  on public.collections for all to authenticated
  using (public.has_permission('machines'))
  with check (public.has_permission('machines'));

-- ── Funciones con control de permiso ────────────────────────────────────
create or replace function public.adjust_stock(p_id uuid, p_delta integer)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not (
    public.has_permission('inventory') or public.has_permission('pos')
    or public.has_permission('products')
  ) then
    raise exception 'Sin permiso para ajustar inventario';
  end if;
  update public.products set stock = greatest(0, stock + p_delta) where id = p_id;
end;
$$;

create or replace function public.receive_order(p_id uuid)
returns void language plpgsql security definer set search_path = public as $$
declare item jsonb;
begin
  if not public.has_permission('orders') then
    raise exception 'Sin permiso para recibir pedidos';
  end if;
  update public.orders set status = 'recibido', received_at = now() where id = p_id;
  for item in
    select * from jsonb_array_elements((select items from public.orders where id = p_id))
  loop
    update public.products set stock = stock + (item->>'qty')::int where sku = item->>'sku';
  end loop;
end;
$$;

-- ── Crear / actualizar colaboradores (solo quien tiene permiso staff) ───
create or replace function public.create_collaborator(
  p_email text, p_password text, p_name text, p_permissions text[]
) returns uuid language plpgsql security definer set search_path = public, auth as $$
declare
  v_user_id uuid;
  v_staff_id uuid;
  v_schema text;
begin
  if not public.has_permission('staff') then
    raise exception 'No tienes permiso para gestionar colaboradores';
  end if;
  if length(trim(p_password)) < 6 then
    raise exception 'La contraseña debe tener al menos 6 caracteres';
  end if;
  if exists (select 1 from public.staff where lower(email) = lower(trim(p_email))) then
    raise exception 'Ya existe un colaborador con ese correo';
  end if;

  select coalesce(
    (select n.nspname from pg_proc p join pg_namespace n on n.oid = p.pronamespace where p.proname = 'gen_salt' limit 1),
    'extensions'
  ) into v_schema;

  v_user_id := gen_random_uuid();

  execute format(
    'insert into auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, created_at, updated_at, raw_app_meta_data, raw_user_meta_data, confirmation_token, recovery_token, email_change, email_change_token_new, email_change_token_current, phone_change, phone_change_token, reauthentication_token) values (''00000000-0000-0000-0000-000000000000'', $1, ''authenticated'', ''authenticated'', $2, %I.crypt($3, %I.gen_salt(''bf'')), now(), now(), now(), ''{"provider":"email","providers":["email"]}'', ''{}'', '''', '''', '''', '''', '''', '''', '''', '''')',
    v_schema, v_schema
  ) using v_user_id, lower(trim(p_email)), p_password;

  insert into auth.identities (id, user_id, provider_id, provider, identity_data, last_sign_in_at, created_at, updated_at)
  values (gen_random_uuid(), v_user_id, v_user_id::text, 'email',
    jsonb_build_object('sub', v_user_id::text, 'email', lower(trim(p_email)), 'email_verified', true, 'phone_verified', false),
    now(), now(), now());

  insert into public.staff (user_id, email, name, permissions)
  values (v_user_id, lower(trim(p_email)), trim(p_name), p_permissions)
  returning id into v_staff_id;

  return v_staff_id;
end;
$$;

create or replace function public.update_collaborator(
  p_id uuid, p_name text, p_permissions text[], p_active boolean
) returns void language plpgsql security definer set search_path = public as $$
begin
  if not public.has_permission('staff') then
    raise exception 'No tienes permiso para gestionar colaboradores';
  end if;
  update public.staff
     set name = trim(p_name), permissions = p_permissions, active = p_active
   where id = p_id;
end;
$$;

create or replace function public.reset_collaborator_password(p_id uuid, p_password text)
returns void language plpgsql security definer set search_path = public, auth as $$
declare
  v_user_id uuid;
  v_schema text;
begin
  if not public.has_permission('staff') then
    raise exception 'No tienes permiso para gestionar colaboradores';
  end if;
  if length(trim(p_password)) < 6 then
    raise exception 'La contraseña debe tener al menos 6 caracteres';
  end if;
  select user_id into v_user_id from public.staff where id = p_id;
  if v_user_id is null then raise exception 'Colaborador no encontrado'; end if;

  select coalesce(
    (select n.nspname from pg_proc p join pg_namespace n on n.oid = p.pronamespace where p.proname = 'gen_salt' limit 1),
    'extensions'
  ) into v_schema;

  execute format(
    'update auth.users set encrypted_password = %I.crypt($1, %I.gen_salt(''bf'')), updated_at = now() where id = $2',
    v_schema, v_schema
  ) using p_password, v_user_id;
end;
$$;

-- Storage: solo quien puede gestionar productos sube fotos
drop policy if exists "admin sube fotos de productos" on storage.objects;
drop policy if exists "admin actualiza fotos de productos" on storage.objects;
drop policy if exists "admin borra fotos de productos" on storage.objects;

drop policy if exists "staff sube fotos" on storage.objects;
create policy "staff sube fotos"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'productos' and public.has_permission('products'));

drop policy if exists "staff actualiza fotos" on storage.objects;
create policy "staff actualiza fotos"
  on storage.objects for update to authenticated
  using (bucket_id = 'productos' and public.has_permission('products'));

drop policy if exists "staff borra fotos" on storage.objects;
create policy "staff borra fotos"
  on storage.objects for delete to authenticated
  using (bucket_id = 'productos' and public.has_permission('products'));

-- ╔══════════════════════════════════════════════════════════════════════╗
-- ║  POS AVANZADO: descuentos, ticket, corte de caja, devoluciones         ║
-- ╚══════════════════════════════════════════════════════════════════════╝

alter table public.sales add column if not exists subtotal numeric(10,2) not null default 0;
alter table public.sales add column if not exists discount numeric(10,2) not null default 0;
alter table public.sales add column if not exists sold_by_name text not null default '';
alter table public.sales add column if not exists sold_by_email text not null default '';
alter table public.sales add column if not exists status text not null default 'completed';
alter table public.sales add column if not exists voided_at timestamptz;
alter table public.sales add column if not exists cash_session_id uuid;

-- Migrar ventas antiguas sin subtotal
update public.sales set subtotal = total where subtotal = 0 and discount = 0;

create table if not exists public.cash_sessions (
  id               uuid primary key default gen_random_uuid(),
  opened_by_name   text not null,
  opened_by_email  text not null default '',
  opening_cash     numeric(10,2) not null default 0,
  opened_at        timestamptz not null default now(),
  closed_at        timestamptz,
  closing_cash     numeric(10,2),
  expected_cash    numeric(10,2),
  notes            text default '',
  status           text not null default 'open'
);

create unique index if not exists cash_sessions_one_open
  on public.cash_sessions ((status)) where status = 'open';

alter table public.sales
  drop constraint if exists sales_cash_session_id_fkey;
alter table public.sales
  add constraint sales_cash_session_id_fkey
  foreign key (cash_session_id) references public.cash_sessions(id) on delete set null;

alter table public.cash_sessions enable row level security;

drop policy if exists "staff caja" on public.cash_sessions;
create policy "staff caja"
  on public.cash_sessions for all to authenticated
  using (public.has_permission('pos'))
  with check (public.has_permission('pos'));

drop policy if exists "staff actualiza ventas" on public.sales;
create policy "staff actualiza ventas"
  on public.sales for update to authenticated
  using (public.has_permission('pos'))
  with check (public.has_permission('pos'));

create or replace function public.void_sale(p_id uuid)
returns void language plpgsql security definer set search_path = public as $$
declare
  v_sale public.sales%rowtype;
  item jsonb;
begin
  if not public.has_permission('pos') then
    raise exception 'Sin permiso para cancelar ventas';
  end if;

  select * into v_sale from public.sales where id = p_id for update;
  if not found then raise exception 'Venta no encontrada'; end if;
  if v_sale.status = 'voided' then raise exception 'Esta venta ya fue cancelada'; end if;

  update public.sales set status = 'voided', voided_at = now() where id = p_id;

  for item in select * from jsonb_array_elements(v_sale.items) loop
    perform public.adjust_stock((item->>'productId')::uuid, (item->>'qty')::int);
  end loop;
end;
$$;
