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
