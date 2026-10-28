-- CulturaViva · esquema de base de datos (Supabase / PostgreSQL)
-- Pégalo completo en Supabase > SQL Editor > New query > Run.

-- ========== TABLAS ==========
create table if not exists perfiles (
  id uuid primary key references auth.users(id) on delete cascade,
  nombre text not null default '',
  correo text,
  rol text not null default 'usuario' check (rol in ('usuario','organizador','admin')),
  ciudad text,
  prefs jsonb not null default '{"r24":true,"r1":true,"cambios":true}',
  creado timestamptz not null default now()
);

create table if not exists categorias (
  id text primary key,
  nombre text not null,
  icono text,
  color text,
  descripcion text
);

create table if not exists lugares (
  id text primary key,
  nombre text not null,
  tipo text,
  ciudad text not null,
  direccion text,
  telefono text,
  horario text,
  descripcion text,
  lat double precision,
  lng double precision,
  imagen text
);

create table if not exists eventos (
  id text primary key default gen_random_uuid()::text,
  titulo text not null,
  descripcion text,
  categoria_id text references categorias(id) on update cascade,
  lugar_id text references lugares(id) on update cascade on delete set null,
  ciudad text not null,
  inicio timestamp not null,
  fin timestamp,
  capacidad int not null default 0 check (capacidad >= 0),
  inscritos int not null default 0 check (inscritos >= 0),
  precio int not null default 0,
  organizador_id uuid references perfiles(id) on delete set null,
  destacado boolean not null default false,
  estado text not null default 'activo' check (estado in ('activo','cancelado')),
  imagen text,
  invitado text,
  tema text,
  duracion text,
  publico text,
  funciones jsonb not null default '[]',
  programacion jsonb not null default '[]',
  creado timestamptz not null default now(),
  check (fin is null or fin >= inicio),
  check (inscritos <= capacidad or capacidad = 0)
);
create index if not exists eventos_inicio_idx on eventos(inicio);
create index if not exists eventos_ciudad_idx on eventos(ciudad);
create index if not exists eventos_categoria_idx on eventos(categoria_id);

create table if not exists favoritos (
  usuario_id uuid references perfiles(id) on delete cascade,
  evento_id text references eventos(id) on delete cascade,
  creado timestamptz not null default now(),
  primary key (usuario_id, evento_id)
);

create table if not exists recordatorios (
  usuario_id uuid references perfiles(id) on delete cascade,
  evento_id text references eventos(id) on delete cascade,
  creado timestamptz not null default now(),
  primary key (usuario_id, evento_id)
);

create table if not exists reservas (
  usuario_id uuid references perfiles(id) on delete cascade,
  evento_id text references eventos(id) on delete cascade,
  creado timestamptz not null default now(),
  primary key (usuario_id, evento_id)
);

create table if not exists notificaciones (
  id bigint generated always as identity primary key,
  usuario_id uuid not null references perfiles(id) on delete cascade,
  evento_id text references eventos(id) on delete cascade,
  tipo text not null,
  titulo text not null,
  mensaje text,
  leida boolean not null default false,
  creado timestamptz not null default now()
);
create index if not exists notif_usuario_idx on notificaciones(usuario_id, creado desc);

-- ========== FUNCIONES Y TRIGGERS ==========
create or replace function es_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from perfiles where id = auth.uid() and rol = 'admin');
$$;

create or replace function es_organizador() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from perfiles where id = auth.uid() and rol in ('organizador','admin'));
$$;

-- Crea el perfil al registrarse (siempre como 'usuario')
create or replace function nuevo_perfil() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into perfiles (id, nombre, correo)
  values (new.id, coalesce(new.raw_user_meta_data->>'nombre', split_part(new.email,'@',1)), new.email);
  return new;
end $$;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function nuevo_perfil();

-- Control de cupos al reservar / cancelar reserva
create or replace function ajustar_cupos() returns trigger
language plpgsql security definer set search_path = public as $$
declare e eventos%rowtype;
begin
  if tg_op = 'INSERT' then
    select * into e from eventos where id = new.evento_id for update;
    if e.estado = 'cancelado' then raise exception 'El evento está cancelado'; end if;
    if e.capacidad > 0 and e.inscritos >= e.capacidad then raise exception 'No hay cupos disponibles'; end if;
    update eventos set inscritos = inscritos + 1 where id = new.evento_id;
    return new;
  else
    update eventos set inscritos = greatest(inscritos - 1, 0) where id = old.evento_id;
    return old;
  end if;
end $$;
drop trigger if exists reservas_cupos on reservas;
create trigger reservas_cupos before insert or delete on reservas
  for each row execute function ajustar_cupos();

-- Avisa a quienes tienen el evento en favoritos/recordatorios si cambia fecha, lugar o se cancela
create or replace function avisar_cambios() returns trigger
language plpgsql security definer set search_path = public as $$
declare msg text; tipo text;
begin
  if new.estado = 'cancelado' and old.estado <> 'cancelado' then
    tipo := 'cancelado'; msg := 'El evento "' || new.titulo || '" fue cancelado.';
  elsif new.inicio <> old.inicio or new.lugar_id is distinct from old.lugar_id then
    tipo := 'cambio'; msg := 'El evento "' || new.titulo || '" cambió de fecha u lugar. Revisa los nuevos detalles.';
  else
    return new;
  end if;
  insert into notificaciones (usuario_id, evento_id, tipo, titulo, mensaje)
  select distinct u, new.id, tipo, 'Cambios en un evento', msg from (
    select usuario_id as u from favoritos where evento_id = new.id
    union select usuario_id from recordatorios where evento_id = new.id
    union select usuario_id from reservas where evento_id = new.id
  ) t;
  return new;
end $$;
drop trigger if exists eventos_cambios on eventos;
create trigger eventos_cambios after update on eventos
  for each row execute function avisar_cambios();

-- ========== SEGURIDAD (RLS) ==========
alter table perfiles enable row level security;
alter table categorias enable row level security;
alter table lugares enable row level security;
alter table eventos enable row level security;
alter table favoritos enable row level security;
alter table recordatorios enable row level security;
alter table reservas enable row level security;
alter table notificaciones enable row level security;

-- Lectura pública del catálogo
create policy "ver categorias" on categorias for select using (true);
create policy "ver lugares" on lugares for select using (true);
create policy "ver eventos" on eventos for select using (true);
create policy "ver perfiles" on perfiles for select using (true);

-- Solo admin gestiona categorías y lugares
create policy "admin categorias" on categorias for all using (es_admin()) with check (es_admin());
create policy "admin lugares" on lugares for all using (es_admin()) with check (es_admin());

-- Eventos: organizador crea/edita los suyos; admin todos
create policy "crear evento" on eventos for insert
  with check (es_organizador() and (organizador_id = auth.uid() or es_admin()));
create policy "editar evento" on eventos for update
  using (organizador_id = auth.uid() or es_admin())
  with check (organizador_id = auth.uid() or es_admin());
create policy "borrar evento" on eventos for delete
  using (organizador_id = auth.uid() or es_admin());

-- Perfiles: cada quien edita el suyo sin poder cambiar su rol; admin cambia roles
create policy "editar mi perfil" on perfiles for update
  using (id = auth.uid())
  with check (id = auth.uid() and rol = (select rol from perfiles where id = auth.uid()));
create policy "admin perfiles" on perfiles for update using (es_admin()) with check (es_admin());

-- Datos personales: solo del propio usuario
create policy "mis favoritos" on favoritos for all using (usuario_id = auth.uid()) with check (usuario_id = auth.uid());
create policy "mis recordatorios" on recordatorios for all using (usuario_id = auth.uid()) with check (usuario_id = auth.uid());
create policy "mis reservas" on reservas for all using (usuario_id = auth.uid()) with check (usuario_id = auth.uid());
create policy "mis notificaciones ver" on notificaciones for select using (usuario_id = auth.uid());
create policy "mis notificaciones editar" on notificaciones for update using (usuario_id = auth.uid());
create policy "mis notificaciones borrar" on notificaciones for delete using (usuario_id = auth.uid());
-- CulturaViva · migración 1 (ejecutar UNA vez, después de schema.sql)
-- Ajusta la base para que coincida con la app: roles, campos de lugares, privacidad y notificaciones.

-- 1) Campos que usa la app en los lugares
alter table lugares add column if not exists barrio text;
alter table lugares add column if not exists web text;
alter table lugares add column if not exists email text;

-- 2) Roles: usuario / organizador / administrador
alter table perfiles drop constraint if exists perfiles_rol_check;
update perfiles set rol = 'administrador' where rol = 'admin';
alter table perfiles add constraint perfiles_rol_check check (rol in ('usuario','organizador','administrador'));
alter table perfiles alter column prefs set default '{"plataforma":true,"correo":true}';

create or replace function es_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from perfiles where id = auth.uid() and rol = 'administrador');
$$;
create or replace function es_organizador() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from perfiles where id = auth.uid() and rol in ('organizador','administrador'));
$$;

-- 3) Al registrarse: 'usuario' u 'organizador' (nunca administrador desde el formulario)
create or replace function nuevo_perfil() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into perfiles (id, nombre, correo, rol)
  values (
    new.id,
    coalesce(nullif(new.raw_user_meta_data->>'nombre',''), split_part(new.email,'@',1)),
    new.email,
    case when new.raw_user_meta_data->>'rol' = 'organizador' then 'organizador' else 'usuario' end
  );
  return new;
end $$;

-- 4) Privacidad: los correos de los demás no se pueden leer desde la web
revoke all on perfiles from anon, authenticated;
grant select (id, nombre, rol, ciudad, prefs, creado) on perfiles to anon, authenticated;
grant update (nombre, ciudad, prefs, rol) on perfiles to authenticated;

-- 5) Notificaciones: la app puede crear los recordatorios del propio usuario
drop policy if exists "crear mis notificaciones" on notificaciones;
create policy "crear mis notificaciones" on notificaciones for insert with check (usuario_id = auth.uid());

-- 6) Avisos de cambio de horario / lugar / cancelación (tipos que muestra la app)
create or replace function avisar_cambios() returns trigger
language plpgsql security definer set search_path = public as $$
declare destinatarios uuid[];
begin
  select array_agg(distinct u) into destinatarios from (
    select usuario_id as u from favoritos where evento_id = new.id
    union select usuario_id from recordatorios where evento_id = new.id
    union select usuario_id from reservas where evento_id = new.id
  ) t where u is distinct from auth.uid();
  if destinatarios is null then return new; end if;

  if new.estado = 'cancelado' and old.estado <> 'cancelado' then
    insert into notificaciones (usuario_id, evento_id, tipo, titulo, mensaje)
    select x, new.id, 'cancelado', 'Evento cancelado', 'Se canceló "' || new.titulo || '".' from unnest(destinatarios) x;
  end if;
  if new.inicio <> old.inicio then
    insert into notificaciones (usuario_id, evento_id, tipo, titulo, mensaje)
    select x, new.id, 'horario', 'Cambio de horario',
      new.titulo || ': antes ' || to_char(old.inicio,'DD/MM/YYYY HH24:MI') || '; ahora ' || to_char(new.inicio,'DD/MM/YYYY HH24:MI') || '.'
    from unnest(destinatarios) x;
  end if;
  if new.lugar_id is distinct from old.lugar_id then
    insert into notificaciones (usuario_id, evento_id, tipo, titulo, mensaje)
    select x, new.id, 'ubicacion', 'Cambio de lugar', new.titulo || ' tiene un nuevo lugar. Revisa los detalles.' from unnest(destinatarios) x;
  end if;
  return new;
end $$;
-- CulturaViva · migración 2: ubicación (localidad) dentro de Bogotá. Ejecutar una vez.
alter table lugares add column if not exists zona text;
update lugares set zona = case barrio
  when 'La Candelaria' then 'La Candelaria'
  when 'La Merced' then 'Santa Fe'
  when 'Santa Fe' then 'Santa Fe'
  when 'Teusaquillo' then 'Teusaquillo'
  when 'Ferias' then 'Teusaquillo'
  when 'Salitre' then 'Teusaquillo'
  when 'Chicó' then 'Chapinero'
  else zona end
where zona is null;
