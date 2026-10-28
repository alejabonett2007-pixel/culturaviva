/* CulturaViva · conexión con la base de datos (Supabase).
   Los datos se cargan al abrir la página y quedan en CV.db (para que las vistas sigan siendo inmediatas).
   Cada vez que la app llama a CV.save(), se compara contra lo último sincronizado y se envían a la
   base solo los cambios. Si no hay conexión o falta la configuración, la app funciona en modo
   demostración con localStorage, como antes. */
(function () {
  const CV = window.CV;
  const cfg = window.CV_CONFIG || {};
  const api = (CV.api = { online: false, error: null });
  const lib = window.supabase;
  if (!lib || !cfg.url || !cfg.key) { api.ready = Promise.resolve(); return; }

  const sb = (api.sb = lib.createClient(cfg.url, cfg.key, { auth: { persistSession: true, autoRefreshToken: true } }));
  const LS_SENT = 'culturaviva.sent';
  const lsGet = (k) => { try { return localStorage.getItem(k); } catch (e) { return null; } };
  const lsSet = (k, v) => { try { localStorage.setItem(k, v); } catch (e) { /* sin almacenamiento */ } };
  const must = (r) => { if (r.error) throw r.error; return r.data; };
  const t16 = (s) => (s ? String(s).slice(0, 16) : '');

  /* ---------- filas de la base <-> objetos de la app ---------- */
  const fromEvento = (r) => ({
    id: r.id, titulo: r.titulo, descripcion: r.descripcion || '', categoria: r.categoria_id, lugarId: r.lugar_id,
    ciudad: r.ciudad, inicio: t16(r.inicio), fin: t16(r.fin), capacidad: r.capacidad || 0, inscritos: r.inscritos || 0,
    precio: r.precio || 0, organizadorId: r.organizador_id, destacado: !!r.destacado, estado: r.estado || 'activo',
    imagen: r.imagen || '', invitado: r.invitado || '', tema: r.tema || '', duracion: r.duracion || '', publico: r.publico || '',
    funciones: (r.funciones || []).map(t16), programacion: r.programacion || [],
  });
  const toEvento = (e, nuevo) => {
    const r = {
      titulo: e.titulo, descripcion: e.descripcion || '', categoria_id: e.categoria || null, lugar_id: e.lugarId || null,
      ciudad: e.ciudad, inicio: e.inicio, fin: e.fin || null, capacidad: Number(e.capacidad) || 0, precio: Number(e.precio) || 0,
      destacado: !!e.destacado, estado: e.estado || 'activo', imagen: e.imagen || null, invitado: e.invitado || null,
      tema: e.tema || null, duracion: e.duracion || null, publico: e.publico || null,
      funciones: e.funciones || [], programacion: e.programacion || [],
    };
    if (nuevo) { r.id = e.id; r.organizador_id = e.organizadorId || null; }
    return r; // 'inscritos' lo calcula la base al reservar
  };
  const LUGAR = ['nombre', 'tipo', 'ciudad', 'barrio', 'zona', 'direccion', 'telefono', 'horario', 'descripcion', 'lat', 'lng', 'web', 'email'];
  const fromLugar = (r) => { const o = { id: r.id }; LUGAR.forEach((k) => (o[k] = r[k] == null ? '' : r[k])); return o; };
  const toLugar = (l) => {
    const r = { id: l.id };
    LUGAR.forEach((k) => (r[k] = l[k] === '' || l[k] === undefined ? null : l[k]));
    r.lat = l.lat === '' || l.lat == null ? null : Number(l.lat); r.lng = l.lng === '' || l.lng == null ? null : Number(l.lng);
    return r;
  };
  const CATEG = ['nombre', 'icono', 'color', 'descripcion'];
  const toCateg = (c) => { const r = { id: c.id }; CATEG.forEach((k) => (r[k] = c[k] || null)); return r; };
  const fromNotif = (r) => ({
    id: String(r.id), uid: r.usuario_id, tipo: r.tipo, titulo: r.titulo, texto: r.mensaje || '',
    eventoId: r.evento_id, fecha: r.creado, leida: !!r.leida,
  });

  /* ---------- estado sincronizado (para calcular diferencias) ---------- */
  let snap = null;
  const j = JSON.stringify;
  const toMap = (arr) => new Map(arr.map((x) => [String(x.id), j(x)]));
  const personal = (me) => ({
    favs: new Set(((me && CV.db.favs[me]) || []).slice()), recs: new Set(((me && CV.db.recs[me]) || []).slice()),
    inscr: new Set(((me && CV.db.inscr[me]) || []).slice()),
    notifs: new Map(CV.db.notifs.filter((n) => n.uid === me && /^\d+$/.test(n.id)).map((n) => [n.id, n.leida])),
    prefs: me ? j((CV.usuario(me) || {}).prefs || {}) : '',
  });
  const tomarSnap = () => {
    const me = CV.db.sesion;
    snap = { categorias: toMap(CV.db.categorias.map(toCateg)), lugares: toMap(CV.db.lugares.map(toLugar)),
      eventos: toMap(CV.db.eventos.map((e) => ({ id: e.id, ...toEvento(e, false) }))), me, ...personal(me) };
  };

  /* ---------- carga de datos ---------- */
  const cargarPersonal = async (user) => {
    CV.db.favs = {}; CV.db.recs = {}; CV.db.inscr = {}; CV.db.notifs = [];
    if (!user) { CV.db.sesion = null; return; }
    const me = user.id;
    const [per, fav, rec, res, nots] = await Promise.all([
      sb.from('perfiles').select('id,nombre,rol,ciudad,prefs').eq('id', me).maybeSingle(),
      sb.from('favoritos').select('evento_id').eq('usuario_id', me),
      sb.from('recordatorios').select('evento_id').eq('usuario_id', me),
      sb.from('reservas').select('evento_id').eq('usuario_id', me),
      sb.from('notificaciones').select('*').eq('usuario_id', me).order('creado', { ascending: false }),
    ]);
    const p = must(per);
    if (!p) throw new Error('No se encontró tu perfil.');
    const yo = { id: me, nombre: p.nombre, correo: user.email, rol: p.rol, clave: '', prefs: { plataforma: true, correo: true, ...(p.prefs || {}) } };
    const i = CV.db.usuarios.findIndex((u) => u.id === me);
    if (i >= 0) CV.db.usuarios[i] = yo; else CV.db.usuarios.push(yo);
    CV.db.favs[me] = must(fav).map((x) => x.evento_id);
    CV.db.recs[me] = must(rec).map((x) => x.evento_id);
    CV.db.inscr[me] = must(res).map((x) => x.evento_id);
    CV.db.notifs = must(nots).map(fromNotif);
    CV.db.sesion = me;
  };

  const hidratar = async () => {
    const [cat, lug, eve, per] = await Promise.all([
      sb.from('categorias').select('*').order('nombre'), sb.from('lugares').select('*').order('nombre'),
      sb.from('eventos').select('*').order('inicio'), sb.from('perfiles').select('id,nombre,rol'),
    ]);
    const sent = (() => { try { return JSON.parse(lsGet(LS_SENT)) || {}; } catch (e) { return {}; } })();
    CV.db = {
      v: 1, categorias: must(cat), lugares: must(lug).map(fromLugar), eventos: must(eve).map(fromEvento),
      usuarios: must(per).map((p) => ({ id: p.id, nombre: p.nombre, rol: p.rol, correo: '', clave: '', prefs: {} })),
      favs: {}, recs: {}, inscr: {}, notifs: [], sent, sesion: null, zona: (CV.db && CV.db.zona) || 'todas',
    };
    CV.normalizar();
    const { data } = await sb.auth.getSession();
    await cargarPersonal(data.session ? data.session.user : null);
    tomarSnap();
  };

  /* ---------- envío de cambios ---------- */
  let cola = Promise.resolve();
  const traducir = (e) => {
    const m = (e && e.message) || String(e);
    if (/cupos/i.test(m)) return m;
    if (/foreign key|violates/i.test(m)) return 'No se puede completar: hay datos que dependen de este elemento.';
    if (/row-level security|permission/i.test(m)) return 'No tienes permiso para hacer este cambio.';
    return 'No se pudo guardar en la base de datos.';
  };
  const fallo = (e) => {
    console.error('Supabase:', e);
    if (CV.toast) CV.toast(traducir(e), 'warn');
    return api.refrescar();
  };

  const sincronizar = async () => {
    if (!snap) return;
    const me = CV.db.sesion;
    if (me !== snap.me) { tomarSnap(); return; } // cambió la sesión: no hay nada que comparar

    // catálogo: categorías, lugares, eventos (primero se crea el padre, al final se borra)
    const ahoraCat = toMap(CV.db.categorias.map(toCateg));
    const ahoraLug = toMap(CV.db.lugares.map(toLugar));
    const evRows = CV.db.eventos.map((e) => ({ id: e.id, ...toEvento(e, false) }));
    const ahoraEve = toMap(evRows);

    const upserts = (tabla, ahora, antes, filas) => {
      const out = [];
      filas.forEach((f) => { const id = String(f.id); if (!antes.has(id)) out.push(['nuevo', f]); else if (antes.get(id) !== ahora.get(id)) out.push(['cambio', f]); });
      return out;
    };
    const borrados = (ahora, antes) => [...antes.keys()].filter((id) => !ahora.has(id));

    for (const [, f] of upserts('categorias', ahoraCat, snap.categorias, CV.db.categorias.map(toCateg))) {
      must(await sb.from('categorias').upsert(f));
    }
    for (const [, f] of upserts('lugares', ahoraLug, snap.lugares, CV.db.lugares.map(toLugar))) {
      must(await sb.from('lugares').upsert(f));
    }
    for (const [tipo, f] of upserts('eventos', ahoraEve, snap.eventos, evRows)) {
      const e = CV.evento(f.id);
      if (tipo === 'nuevo') must(await sb.from('eventos').insert(toEvento(e, true)));
      else { const { id, ...resto } = f; must(await sb.from('eventos').update(resto).eq('id', id)); }
    }
    for (const id of borrados(ahoraEve, snap.eventos)) must(await sb.from('eventos').delete().eq('id', id));
    for (const id of borrados(ahoraLug, snap.lugares)) must(await sb.from('lugares').delete().eq('id', id));
    for (const id of borrados(ahoraCat, snap.categorias)) must(await sb.from('categorias').delete().eq('id', id));

    // datos personales
    if (me) {
      const now = personal(me);
      let cuposCambian = false;
      const difSet = async (tabla, antes, ahora) => {
        for (const id of ahora) if (!antes.has(id)) must(await sb.from(tabla).insert({ usuario_id: me, evento_id: id }));
        for (const id of antes) if (!ahora.has(id)) must(await sb.from(tabla).delete().match({ usuario_id: me, evento_id: id }));
        return [...ahora].some((x) => !antes.has(x)) || [...antes].some((x) => !ahora.has(x));
      };
      await difSet('favoritos', snap.favs, now.favs);
      await difSet('recordatorios', snap.recs, now.recs);
      cuposCambian = await difSet('reservas', snap.inscr, now.inscr);
      for (const [id, leida] of now.notifs) if (snap.notifs.get(id) !== leida) must(await sb.from('notificaciones').update({ leida }).eq('id', id));
      for (const n of CV.db.notifs.filter((x) => x.uid === me && !/^\d+$/.test(x.id))) {
        const row = must(await sb.from('notificaciones').insert({
          usuario_id: me, evento_id: n.eventoId || null, tipo: n.tipo, titulo: n.titulo, mensaje: n.texto || '', leida: !!n.leida,
        }).select().single());
        n.id = String(row.id);
      }
      if (now.prefs !== snap.prefs) must(await sb.from('perfiles').update({ prefs: (CV.usuario(me) || {}).prefs }).eq('id', me));
      if (cuposCambian) {
        const filas = must(await sb.from('eventos').select('id,inscritos'));
        filas.forEach((f) => { const e = CV.evento(f.id); if (e) e.inscritos = f.inscritos; });
        document.dispatchEvent(new CustomEvent('cv:cupos'));
      }
    }
    tomarSnap();
  };

  let pendiente = false;
  CV.save = () => {
    lsSet(LS_SENT, j(CV.db.sent || {}));
    if (!api.online || pendiente) return;
    pendiente = true;
    setTimeout(() => {
      pendiente = false;
      cola = cola.then(sincronizar).catch(fallo);
    }, 30);
  };
  CV.reset = () => { if (CV.toast) CV.toast('Los datos reales no se restablecen desde aquí.'); };
  CV.load = () => null;

  document.addEventListener('cv:cupos', () => { if (CV.render) CV.render(true); });

  api.refrescar = async () => {
    try { await hidratar(); } catch (e) { console.error(e); }
    if (CV.renderHeader) CV.renderHeader();
    if (CV.render) CV.render(true);
  };

  /* ---------- sesión ---------- */
  const mensajeAuth = (e) => {
    const m = (e && e.message) || '';
    if (/invalid login/i.test(m)) return 'El correo o la contraseña no coinciden. Revísalos e inténtalo de nuevo.';
    if (/not confirmed/i.test(m)) return 'Debes confirmar tu correo antes de entrar. Revisa tu bandeja de entrada.';
    if (/already registered|already been registered/i.test(m)) return 'Ya existe una cuenta con ese correo.';
    if (/password/i.test(m)) return 'La contraseña debe tener al menos 6 caracteres.';
    if (/rate limit|too many/i.test(m)) return 'Demasiados intentos. Espera unos minutos e inténtalo otra vez.';
    return 'No se pudo completar. Revisa tu conexión e inténtalo de nuevo.';
  };
  api.login = async (correo, clave) => {
    const r = await sb.auth.signInWithPassword({ email: String(correo).trim(), password: clave });
    if (r.error) return { error: mensajeAuth(r.error) };
    try { await cargarPersonal(r.data.user); tomarSnap(); } catch (e) { return { error: 'No se pudo cargar tu cuenta.' }; }
    return { user: CV.user() };
  };
  api.registrar = async ({ nombre, correo, clave, rol }) => {
    const r = await sb.auth.signUp({ email: correo, password: clave, options: { data: { nombre, rol: rol === 'organizador' ? 'organizador' : 'usuario' } } });
    if (r.error) return { error: mensajeAuth(r.error) };
    if (!r.data.session) {
      if (r.data.user && r.data.user.identities && r.data.user.identities.length === 0) return { error: 'Ya existe una cuenta con ese correo.' };
      return { pendiente: true };
    }
    try { await cargarPersonal(r.data.user); tomarSnap(); } catch (e) { return { error: 'La cuenta se creó, pero no se pudo cargar. Inicia sesión.' }; }
    return { user: CV.user() };
  };
  api.logout = async () => { await sb.auth.signOut(); await cargarPersonal(null); tomarSnap(); };

  /* ---------- arranque ---------- */
  api.ready = hidratar().then(() => { api.online = true; }).catch((e) => {
    api.error = e; console.error('Sin conexión con la base de datos; se usa el modo demostración.', e);
  });
})();
