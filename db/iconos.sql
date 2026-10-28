-- Íconos nuevos de las categorías (opcional: la app ya los muestra aunque no lo ejecutes).
update categorias set icono = case id
  when 'teatro' then 'masks'
  when 'arte' then 'palette'
  when 'cine' then 'clapper'
  when 'museos' then 'museum'
  when 'danza' then 'dancer'
  when 'festivales' then 'fireworks'
  else icono end;
