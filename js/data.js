/* CulturaViva · datos de ejemplo. Las fechas se generan relativas al día en que se carga por primera vez. */
(function () {
  const CV = window.CV;

  CV.ciudades = {
    'Bogotá': [4.711, -74.0721],
  };

  // Localidades de Bogotá (centro aproximado de cada una, para centrar el mapa)
  CV.zonas = {
    'La Candelaria': [4.5981, -74.076],
    'Santa Fe': [4.6118, -74.069],
    'Teusaquillo': [4.64, -74.085],
    'Chapinero': [4.65, -74.062],
    'Usaquén': [4.697, -74.03],
    'Suba': [4.741, -74.083],
    'Engativá': [4.7, -74.11],
    'Fontibón': [4.674, -74.143],
    'Puente Aranda': [4.618, -74.11],
    'Kennedy': [4.628, -74.152],
  };
  const ZONA_DE_BARRIO = { 'La Candelaria': 'La Candelaria', 'La Merced': 'Santa Fe', 'Santa Fe': 'Santa Fe', Teusaquillo: 'Teusaquillo', Ferias: 'Teusaquillo', Salitre: 'Teusaquillo', 'Chicó': 'Chapinero' };
  CV.zonaDe = (barrio) => ZONA_DE_BARRIO[barrio] || '';

  CV.tiposLugar = ['Museo', 'Teatro', 'Centro cultural', 'Galería', 'Biblioteca', 'Parque y plaza'];

  CV.seed = function () {
    const D = (d, h = 0, m = 0) => {
      const x = CV.today();
      x.setDate(x.getDate() + d);
      x.setHours(h, m, 0, 0);
      return CV.localISO(x);
    };

    const categorias = [
      { id: 'musica', nombre: 'Música', color: '#8b5cf6', icono: 'music' },
      { id: 'teatro', nombre: 'Teatro', color: '#ef4444', icono: 'smile' },
      { id: 'arte', nombre: 'Arte', color: '#f5a623', icono: 'image' },
      { id: 'literatura', nombre: 'Literatura', color: '#16a34a', icono: 'book' },
      { id: 'cine', nombre: 'Cine', color: '#2563eb', icono: 'film' },
      { id: 'museos', nombre: 'Museos', color: '#0e9aa7', icono: 'landmark' },
      { id: 'danza', nombre: 'Danza', color: '#ec4899', icono: 'activity' },
      { id: 'festivales', nombre: 'Festivales', color: '#7c5cff', icono: 'sun' },
      { id: 'talleres', nombre: 'Talleres', color: '#64748b', icono: 'tool' },
    ];

    const L = (id, nombre, tipo, ciudad, barrio, direccion, lat, lng, descripcion, horario, telefono, web, email) => ({
      id, nombre, tipo, ciudad, barrio, zona: CV.zonaDe(barrio), direccion, lat, lng, descripcion, horario, telefono, web, email,
    });
    const lugares = [
      L('l1', 'Teatro Colón', 'Teatro', 'Bogotá', 'La Candelaria', 'Calle 10 # 5-32', 4.5964, -74.0748,
        'Sala histórica de ópera y artes escénicas en el centro de la ciudad, con una programación todo el año.',
        'Martes a domingo, 10:00 a. m. a 6:00 p. m.', '+57 601 555 0101', 'https://example.org/teatro-colon', 'info@teatrocolon.example'),
      L('l2', 'Museo Nacional', 'Museo', 'Bogotá', 'La Merced', 'Carrera 7 # 28-66', 4.6156, -74.0687,
        'Colecciones de arte, historia y arqueología repartidas en más de veinte salas.',
        'Martes a sábado, 9:00 a. m. a 5:00 p. m.; domingo, 10:00 a. m. a 4:00 p. m.', '+57 601 555 0102', 'https://example.org/museo-nacional', 'contacto@museonacional.example'),
      L('l3', 'Parque Simón Bolívar', 'Parque y plaza', 'Bogotá', 'Teusaquillo', 'Calle 63 con Carrera 60', 4.6586, -74.0937,
        'El parque urbano más grande de la ciudad, sede de festivales al aire libre.',
        'Todos los días, 5:00 a. m. a 7:00 p. m.', '', '', ''),
      L('l4', 'Centro Cultural Gabriel García Márquez', 'Centro cultural', 'Bogotá', 'La Candelaria', 'Calle 11 # 5-60', 4.5967, -74.074,
        'Espacio de encuentro con talleres, exposiciones, librería y cafetería.',
        'Lunes a sábado, 9:00 a. m. a 7:00 p. m.', '+57 601 555 0104', 'https://example.org/ccggm', 'hola@ccggm.example'),
      L('l5', 'Galería Santa Fe', 'Galería', 'Bogotá', 'Santa Fe', 'Carrera 5 # 26-12', 4.6118, -74.069,
        'Galería de arte contemporáneo dedicada a artistas emergentes.',
        'Martes a sábado, 11:00 a. m. a 6:00 p. m.', '+57 601 555 0105', '', 'galeria@santafe.example'),
      L('l6', 'Corferias', 'Centro cultural', 'Bogotá', 'Ferias', 'Carrera 37 # 24-67', 4.63, -74.093,
        'Recinto ferial que recibe las grandes ferias y encuentros de la ciudad.',
        'Según la programación de cada evento', '+57 601 555 0106', 'https://example.org/corferias', ''),
      L('l7', 'Plaza de Bolívar', 'Parque y plaza', 'Bogotá', 'La Candelaria', 'Carrera 7 con Calle 11', 4.5981, -74.076,
        'La plaza central de la ciudad, rodeada de edificios históricos.', 'Abierta todo el día', '', '', ''),
      L('l8', 'Casa cultural Teusaquillo', 'Centro cultural', 'Bogotá', 'Teusaquillo', 'Carrera 19 # 37-20', 4.635, -74.078,
        'Casa de barrio con música en vivo, talleres y exposiciones pequeñas.',
        'Miércoles a domingo, 3:00 p. m. a 10:00 p. m.', '+57 601 555 0108', '', 'casa@teusaquillo.example'),
      L('l9', 'Parque de la 93', 'Parque y plaza', 'Bogotá', 'Chicó', 'Calle 93A con Carrera 13', 4.6762, -74.0485,
        'Parque con zonas verdes y una pantalla para proyecciones al aire libre.', 'Todos los días, 6:00 a. m. a 9:00 p. m.', '', '', ''),
      L('l10', 'Biblioteca Virgilio Barco', 'Biblioteca', 'Bogotá', 'Salitre', 'Avenida Carrera 60 # 57-60', 4.6286, -74.0933,
        'Biblioteca pública con salas de lectura, auditorio y talleres.', 'Lunes a sábado, 8:00 a. m. a 8:00 p. m.', '+57 601 555 0110', '', ''),
    ];

    const usuarios = [
      { id: 'u1', nombre: 'Oscar Cabrera', correo: 'usuario@culturaviva.co', clave: '1234', rol: 'usuario', prefs: { plataforma: true, correo: true } },
      { id: 'u2', nombre: 'Fundación Escena Viva', correo: 'organizador@culturaviva.co', clave: '1234', rol: 'organizador', prefs: { plataforma: true, correo: true } },
      { id: 'u3', nombre: 'Administración CulturaViva', correo: 'admin@culturaviva.co', clave: '1234', rol: 'administrador', prefs: { plataforma: true, correo: true } },
      { id: 'u4', nombre: 'Colectivo Arte Vivo', correo: 'colectivo@culturaviva.co', clave: '1234', rol: 'organizador', prefs: { plataforma: true, correo: true } },
    ];

    let n = 0;
    const E = (o) => ({
      id: 'e' + ++n, descripcion: '', fin: '', capacidad: 0, inscritos: 0, precio: 0, organizadorId: 'u2',
      destacado: false, estado: 'activo', imagen: '', invitado: '', tema: '', duracion: '', publico: '',
      funciones: [], programacion: [], ...o,
    });
    const lug = (id) => lugares.find((l) => l.id === id);
    const eventos = [
      E({ titulo: 'Festival Rock al Parque', categoria: 'musica', inicio: D(12, 14), fin: D(12, 22), lugarId: 'l3', destacado: true,
        invitado: 'Bandas nacionales e invitados internacionales', organizadorId: 'u2',
        descripcion: 'Una jornada completa de rock al aire libre con escenarios simultáneos, bandas emergentes y artistas invitados. Lleva ropa cómoda y agua; la entrada es libre hasta completar el aforo del parque.' }),
      E({ titulo: 'La casa de Bernarda Alba', categoria: 'teatro', inicio: D(9, 18), lugarId: 'l1', capacidad: 400, inscritos: 352, precio: 35000, destacado: true,
        invitado: 'Compañía Escena Viva', funciones: [D(9, 18), D(10, 18), D(16, 18)],
        descripcion: 'Montaje de la obra de Federico García Lorca sobre cinco hermanas encerradas por el luto impuesto por su madre. Dirección de Marta Quintero, con música original en vivo.' }),
      E({ titulo: 'Exposición: El arte de lo cotidiano', categoria: 'arte', inicio: D(-10, 10), fin: D(40, 18), lugarId: 'l2', destacado: true, organizadorId: 'u4',
        descripcion: 'Un recorrido por objetos, retratos y escenas de la vida diaria que artistas colombianos convirtieron en obra. Incluye visitas guiadas los sábados a las 11:00 a. m.' }),
      E({ titulo: 'Cine bajo las estrellas', categoria: 'cine', inicio: D(11, 19), lugarId: 'l9', destacado: true, organizadorId: 'u4',
        invitado: 'Ciclo de cortometrajes colombianos', funciones: [D(11, 19), D(18, 19)],
        descripcion: 'Proyección al aire libre de cortometrajes colombianos premiados, seguida de una charla con sus directores. Trae una manta o un cojín.' }),
      E({ titulo: 'Taller de fotografía urbana', categoria: 'talleres', inicio: D(3, 9), fin: D(3, 12), lugarId: 'l4', capacidad: 25, inscritos: 15,
        tema: 'Fotografía', duracion: '3 horas', publico: 'Jóvenes y adultos', organizadorId: 'u4',
        descripcion: 'Aprende a mirar la ciudad con una cámara o con tu celular: encuadre, luz natural y narración visual. Se hace una salida corta por La Candelaria. Es gratuito y no necesitas experiencia.' }),
      E({ titulo: 'Concierto de jazz', categoria: 'musica', inicio: D(4, 18), fin: D(4, 20), lugarId: 'l7', invitado: 'Cuarteto Candelaria',
        descripcion: 'Una noche de jazz colombiano al aire libre con el Cuarteto Candelaria y músicos invitados.' }),
      E({ titulo: 'Feria del Libro de Bogotá', categoria: 'literatura', inicio: D(5, 10), fin: D(8, 20), lugarId: 'l6', precio: 15000, invitado: 'Más de 300 expositores', organizadorId: 'u4',
        descripcion: 'Cuatro días de libros, firmas de autores, charlas y actividades para niños. Hay un país invitado y una programación diaria con entrada incluida.' ,
        programacion: [
          { dia: D(5, 10), actividad: 'Inauguración y conversatorio con el país invitado' },
          { dia: D(6, 10), actividad: 'Día de la infancia: cuentería y talleres' },
          { dia: D(7, 10), actividad: 'Firmas de autores y lanzamientos' },
          { dia: D(8, 10), actividad: 'Clausura y feria de libros usados' },
        ] }),
      E({ titulo: 'Exposición de artistas emergentes', categoria: 'arte', inicio: D(7, 11), fin: D(30, 18), lugarId: 'l5', organizadorId: 'u4',
        descripcion: 'Veinte artistas menores de treinta años presentan pintura, escultura y video. Entrada libre.' }),
      E({ titulo: 'Concierto acústico', categoria: 'musica', inicio: D(0, 21), fin: D(0, 22), lugarId: 'l8', capacidad: 60, inscritos: 42, invitado: 'Laura Mejía',
        descripcion: 'Voz y guitarra en formato íntimo, con canciones propias y versiones. Reserva tu cupo, el aforo es limitado.' }),
      E({ titulo: 'Noche de poesía en voz alta', categoria: 'literatura', inicio: D(6, 19), fin: D(6, 21), lugarId: 'l10', capacidad: 80, inscritos: 80, invitado: 'Poetas del barrio', organizadorId: 'u4',
        descripcion: 'Micrófono abierto y lecturas de poetas invitados. Requiere inscripción previa.' }),
      E({ titulo: 'Cuerpos en tránsito', categoria: 'danza', inicio: D(13, 19, 30), lugarId: 'l1', capacidad: 350, inscritos: 120, precio: 40000, invitado: 'Compañía Danza Contigo',
        descripcion: 'Pieza de danza contemporánea sobre migración y memoria. Duración aproximada: 70 minutos.' }),
      E({ titulo: 'Festival del Centro', categoria: 'festivales', inicio: D(-1, 10), fin: D(3, 22), lugarId: 'l7', organizadorId: 'u4', destacado: false,
        descripcion: 'Cinco días de música, teatro callejero y exposiciones en plazas y calles del centro histórico.',
        programacion: [
          { dia: D(-1, 10), actividad: 'Apertura con desfile de comparsas' },
          { dia: D(0, 10), actividad: 'Teatro callejero y música en vivo' },
          { dia: D(1, 10), actividad: 'Muestras de danza folclórica' },
          { dia: D(2, 10), actividad: 'Cine en la calle' },
          { dia: D(3, 10), actividad: 'Concierto de cierre' },
        ] }),
      E({ titulo: 'Visita guiada nocturna al museo', categoria: 'museos', inicio: D(8, 18), fin: D(8, 20), lugarId: 'l2', capacidad: 40, inscritos: 22,
        descripcion: 'Recorrido guiado por las salas de historia con una mirada distinta: luces bajas y relatos de la colección.' }),
      E({ titulo: 'Taller de escritura creativa', categoria: 'talleres', inicio: D(14, 15), fin: D(14, 18), lugarId: 'l10', capacidad: 15, inscritos: 6,
        tema: 'Escritura', duracion: '3 horas', publico: 'Jóvenes', organizadorId: 'u4',
        descripcion: 'Ejercicios para escribir cuentos cortos y perder el miedo a la hoja en blanco. Gratuito.' }),
      E({ titulo: 'Recital de piano', categoria: 'musica', inicio: D(7, 19), lugarId: 'l1', capacidad: 300, inscritos: 40, precio: 30000, estado: 'cancelado', invitado: 'Andrés Rojas',
        descripcion: 'Obras de Chopin y Debussy. Esta función fue cancelada por el artista.' }),
      E({ titulo: 'Cuentería para niños', categoria: 'literatura', inicio: D(-5, 16), fin: D(-5, 17), lugarId: 'l10', invitado: 'Cuenteros de la biblioteca', organizadorId: 'u4',
        descripcion: 'Historias de la tradición oral colombiana para toda la familia.' }),
].map((e) => ({ ...e, ciudad: lug(e.lugarId).ciudad, zona: lug(e.lugarId).zona }));

    const u1 = 'u1';
    const e2 = eventos[1].id, e5 = eventos[4].id, e9 = eventos[8].id;
    const ago = (h) => { const d = new Date(Date.now() - h * 3600e3); return d.toISOString(); };
    const notifs = [
      { id: 'n1', uid: u1, tipo: 'recordatorio', titulo: 'Recordatorio de evento', texto: 'Concierto acústico · Hoy 9:00 p. m.', eventoId: e9, fecha: ago(1), leida: false },
      { id: 'n2', uid: u1, tipo: 'horario', titulo: 'Cambio de horario', texto: 'La obra "La casa de Bernarda Alba" se reprogramó a las 6:00 p. m.', eventoId: e2, fecha: ago(22), leida: false },
      { id: 'n3', uid: u1, tipo: 'cupos', titulo: 'Cupos disponibles', texto: 'Taller de fotografía urbana · Quedan 10 cupos', eventoId: e5, fecha: ago(25), leida: false },
    ];

    return {
      v: 1, creado: new Date().toISOString(),
      categorias, lugares, usuarios, eventos, notifs,
      favs: { [u1]: [eventos[0].id, e9] },
      recs: { [u1]: [e9] },
      inscr: { [u1]: [] },
      sent: {},
      sesion: null,
      zona: 'todas',
    };
  };
})();
