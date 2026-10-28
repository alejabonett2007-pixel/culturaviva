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
