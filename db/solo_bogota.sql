-- Deja la base solo con eventos y lugares de Bogotá (ejecutar una vez).
begin;
delete from eventos where ciudad <> 'Bogotá';
delete from lugares where ciudad <> 'Bogotá';
commit;
