/* CulturaViva · enrutador y manejo de eventos */
(function () {
  const CV = window.CV;
  const { esc } = CV;

  /* ---------- enrutador por hash ---------- */
  CV.parse = () => {
    const h = location.hash.slice(1) || '/';
    const [p, qs] = h.split('?');
    return { path: p, parts: p.split('/').filter(Boolean), q: Object.fromEntries(new URLSearchParams(qs || '')) };
  };
  CV.go = (p) => { location.hash = '#' + p; };

  const TITULOS = {
    '': 'Descubre la cultura a tu alrededor', eventos: 'Eventos', evento: 'Evento', calendario: 'Calendario', lugares: 'Lugares', lugar: 'Lugar',
    mapa: 'Mapa de eventos', categorias: 'Categorías', favoritos: 'Mis favoritos', notificaciones: 'Notificaciones', nosotros: 'Nosotros',
    organizador: 'Panel del organizador', admin: 'Administración',
  };

  CV.render = (keep) => {
    CV.route = CV.parse();
    if (!keep) CV.resetF();
    CV.destroyMaps();
    CV.after = [];
    const key = CV.route.parts[0] || '';
    const view = CV.views[key] || (() => `<div class="wrap page">${CV.vacio('No encontramos esta página', 'Revisa la dirección o vuelve al inicio.', '<a class="btn" href="#/">Ir al inicio</a>')}</div>`);
    let html;
    try { html = view(CV.route.parts, CV.route.q); } catch (err) { console.error(err); html = `<div class="wrap page">${CV.vacio('Algo salió mal', 'No pudimos mostrar esta página. Vuelve al inicio e inténtalo de nuevo.', '<a class="btn" href="#/">Ir al inicio</a>')}</div>`; }
    const app = document.getElementById('app');
    const sy = window.scrollY;
    app.innerHTML = html;
    CV.renderHeader();
    CV.after.forEach((fn) => { try { fn(); } catch (err) { console.error(err); } });
    if (keep) window.scrollTo(0, sy);
    else {
      window.scrollTo(0, 0);
      let t = TITULOS[key] || 'CulturaViva';
      if (key === 'evento' && CV.evento(CV.route.parts[1])) t = CV.evento(CV.route.parts[1]).titulo;
      if (key === 'lugar' && CV.lugar(CV.route.parts[1])) t = CV.lugar(CV.route.parts[1]).nombre;
      document.title = key === '' ? 'CulturaViva · Descubre la cultura a tu alrededor' : `${t} · CulturaViva`;
      if (CV.focusQ) { CV.focusQ = false; const q = document.getElementById('f-q') || document.getElementById('hq'); if (q) q.focus(); }
    }
  };
  window.addEventListener('hashchange', () => { CV.closeModal(); CV.render(false); });

  /* ---------- menús ---------- */
  const closeMenus = () => document.querySelectorAll('.menu').forEach((m) => (m.hidden = true));
  CV.acts.menu = (t) => {
    const m = document.getElementById(t.dataset.m);
    const open = m.hidden;
    closeMenus();
    m.hidden = !open;
  };

  /* ---------- sesión ---------- */
  CV.acts.login = () => CV.loginModal();
  CV.acts.authTab = (t) => CV.loginModal('', t.dataset.t);
  const online = () => !!(CV.api && CV.api.online);
  CV.acts.demo = (t) => {
    const u = CV.login(t.dataset.c, '1234');
    if (u) { CV.closeModal(); CV.toast(`Sesión iniciada como ${u.nombre}`); CV.render(true); }
  };
  CV.acts.logout = async () => {
    if (online()) await CV.api.logout(); else CV.logout();
    closeMenus(); CV.toast('Cerraste sesión');
    if (['organizador', 'admin', 'favoritos', 'notificaciones'].includes(CV.route.parts[0])) CV.go('/'); else CV.render(true);
  };
  const ocupado = (form, on) => { const b = form.querySelector('button[type="submit"]'); if (b) { b.disabled = on; b.dataset.t = b.dataset.t || b.textContent; b.textContent = on ? 'Un momento…' : b.dataset.t; } };
  CV.submits.login = async (form) => {
    const fd = new FormData(form); const err = document.getElementById('auth-err');
    ocupado(form, true);
    const r = online() ? await CV.api.login(fd.get('correo'), fd.get('clave')) : { user: CV.login(fd.get('correo'), fd.get('clave')) };
    ocupado(form, false);
    const u = r.user;
    if (!u) { err.textContent = r.error || 'El correo o la contraseña no coinciden. Revísalos e inténtalo de nuevo.'; return; }
    CV.closeModal(); CV.toast(`Hola, ${u.nombre.split(' ')[0]}`); CV.render(true);
  };
  CV.submits.register = async (form) => {
    const fd = new FormData(form); const err = document.getElementById('auth-err');
    const nombre = String(fd.get('nombre') || '').trim(), correo = String(fd.get('correo') || '').trim(), clave = String(fd.get('clave') || '');
    if (!nombre) { err.textContent = 'Escribe tu nombre.'; return; }
    if (!/^\S+@\S+\.\S+$/.test(correo)) { err.textContent = 'Escribe un correo válido.'; return; }
    if (clave.length < (online() ? 6 : 4)) { err.textContent = `La contraseña debe tener al menos ${online() ? 6 : 4} caracteres.`; return; }
    ocupado(form, true);
    const r = online() ? await CV.api.registrar({ nombre, correo, clave, rol: fd.get('rol') }) : CV.registrar({ nombre, correo, clave, rol: fd.get('rol') });
    ocupado(form, false);
    if (r.error) { err.textContent = r.error; return; }
    if (r.pendiente) { CV.closeModal(); CV.toast('Cuenta creada. Revisa tu correo para confirmarla y luego inicia sesión.'); return; }
    CV.closeModal(); CV.toast('Cuenta creada. ¡Bienvenido!'); CV.render(true);
  };
  const pedirLogin = (msg) => { CV.loginModal(msg); };

  /* ---------- favoritos, recordatorios, reservas ---------- */
  CV.acts.fav = (t, e) => {
    e.preventDefault();
    if (!CV.user()) return pedirLogin('Inicia sesión para guardar eventos en tus favoritos.');
    const id = t.dataset.id; const on = CV.toggleFav(id);
    CV.toast(on ? 'Guardado en favoritos' : 'Quitado de favoritos');
    if (['evento', 'favoritos'].includes(CV.route.parts[0])) CV.render(true);
    else document.querySelectorAll(`[data-act="fav"][data-id="${id}"]`).forEach((b) => { b.classList.toggle('on', on); b.setAttribute('aria-pressed', on); b.setAttribute('aria-label', on ? 'Quitar de favoritos' : 'Guardar en favoritos'); });
  };
  CV.acts.rec = (t) => {
    if (!CV.user()) return pedirLogin('Inicia sesión para activar recordatorios.');
    const on = CV.toggleRec(t.dataset.id);
    CV.toast(on ? 'Te avisaremos 24 horas y 1 hora antes' : 'Recordatorio desactivado');
    CV.render(true);
  };
  CV.acts.reserve = (t) => {
    if (!CV.user()) return pedirLogin('Inicia sesión para reservar un cupo.');
    const r = CV.toggleReserva(t.dataset.id);
    if (r.error) return CV.toast(r.error, 'warn');
    CV.toast(r.on ? 'Cupo reservado' : 'Reserva cancelada');
    CV.render(true);
  };

  /* ---------- notificaciones ---------- */
  CV.acts.readN = (t) => { const n = CV.db.notifs.find((x) => x.id === t.dataset.id); if (n) { n.leida = true; CV.save(); } closeMenus(); };
  CV.acts.readAll = () => { CV.misNotifs().forEach((n) => (n.leida = true)); CV.save(); CV.render(true); };
  CV.changes.pref = (el) => { const u = CV.user(); u.prefs[el.dataset.p] = el.checked; CV.save(); CV.toast('Preferencias guardadas'); };
  document.addEventListener('cv:notifs', () => CV.renderHeader());

  /* ---------- calendario ---------- */
  const repintaCal = () => {
    const h = document.getElementById('cal-home'); if (h) h.innerHTML = CV.calendarioHTML();
    const b = document.getElementById('cal-big'); if (b) b.innerHTML = CV.calendarioHTML({ big: true });
    CV.pintarDia();
  };
  CV.acts.calPrev = () => { const m = CV.cal.mes; CV.cal.mes = new Date(m.getFullYear(), m.getMonth() - 1, 1); repintaCal(); };
  CV.acts.calNext = () => { const m = CV.cal.mes; CV.cal.mes = new Date(m.getFullYear(), m.getMonth() + 1, 1); repintaCal(); };
  CV.acts.calDay = (t) => {
    if (!document.getElementById('cal-day')) return CV.go('/calendario?d=' + t.dataset.k);
    CV.cal.sel = t.dataset.k; repintaCal();
  };
  CV.acts.calCat = (t) => {
    const a = CV.cal.cats; const i = a.indexOf(t.dataset.id); if (i >= 0) a.splice(i, 1); else a.push(t.dataset.id);
    document.querySelectorAll('#cal-chips .chip').forEach((c) => { const on = a.includes(c.dataset.id); c.classList.toggle('on', on); c.setAttribute('aria-pressed', on); });
    repintaCal();
  };

  /* ---------- listado de eventos ---------- */
  CV.acts.cat = (t) => {
    const a = CV.f.cats; const i = a.indexOf(t.dataset.id); if (i >= 0) a.splice(i, 1); else a.push(t.dataset.id);
    CV.f.page = 1; CV.pintarChips(); CV.pintarResultados();
    const h = document.querySelector('.page-h h1');
    if (h) h.textContent = a.length === 1 ? CV.cat(a[0]).nombre : 'Eventos culturales';
  };
  CV.acts.clear = () => { CV.resetF(); CV.render(true); CV.toast('Filtros limpiados'); };
  CV.acts.more = () => { CV.f.page++; CV.pintarResultados(); };
  CV.inputs.q = (el) => { clearTimeout(CV.qT); CV.qT = setTimeout(() => { CV.f.q = el.value; CV.f.page = 1; CV.pintarResultados(); }, 140); };
  CV.changes.orden = (el) => { CV.f.orden = el.value; CV.f.page = 1; CV.pintarResultados(); };

  const fechaValida = (el) => {
    if (el.value && el.value < CV.todayKey()) {
      CV.toast('Esa fecha ya pasó. Elige hoy o un día futuro; no hay eventos disponibles en fechas pasadas.', 'warn');
      el.value = ''; return false;
    }
    return true;
  };
  CV.changes.desde = (el) => {
    if (!fechaValida(el)) { CV.f.desde = ''; } else CV.f.desde = el.value;
    const h = document.getElementById('f-hasta');
    if (h) { h.min = CV.f.desde || CV.todayKey(); if (CV.f.hasta && CV.f.hasta < CV.f.desde) { CV.f.hasta = ''; h.value = ''; } }
    CV.f.page = 1; CV.pintarResultados();
  };
  CV.changes.hasta = (el) => { CV.f.hasta = fechaValida(el) ? el.value : ''; CV.f.page = 1; CV.pintarResultados(); };

  CV.changes.city = (el) => { CV.db.ciudad = el.value; CV.save(); CV.render(true); };
  CV.acts.setCity = (t) => { CV.db.ciudad = t.dataset.c; CV.save(); CV.render(true); };
  CV.acts.focusSearch = (t, e) => {
    if ((CV.route.parts[0] || '') === 'eventos') { e.preventDefault(); const q = document.getElementById('f-q'); if (q) q.focus(); } else CV.focusQ = true;
  };
  CV.submits.noop = () => {};
  CV.submits.heroSearch = (form) => {
    const fd = new FormData(form); const q = String(fd.get('q') || '').trim();
    CV.go('/eventos' + (q ? '?q=' + encodeURIComponent(q) : ''));
  };

  /* ---------- lugares y mapa ---------- */
  CV.changes.ltipo = (el) => { CV.lf.tipo = el.value; CV.pintarLugares(); };
  CV.changes.lciudad = (el) => { CV.lf.ciudad = el.value; CV.pintarLugares(); };
  CV.acts.vista = (t) => {
    CV.lf.vista = t.dataset.v;
    document.querySelectorAll('.seg button').forEach((b) => b.classList.toggle('on', b === t));
    CV.pintarLugares();
  };
  CV.acts.mapCat = (t) => {
    const a = CV.mf.cats; const i = a.indexOf(t.dataset.id); if (i >= 0) a.splice(i, 1); else a.push(t.dataset.id);
    document.querySelectorAll('#mchips .chip').forEach((c) => { const on = a.includes(c.dataset.id); c.classList.toggle('on', on); c.setAttribute('aria-pressed', on); });
    CV.pintarMapa();
  };
  CV.changes.mdesde = (el) => { CV.mf.desde = fechaValida(el) ? el.value : ''; CV.pintarMapa(); };
  CV.changes.mhasta = (el) => { CV.mf.hasta = fechaValida(el) ? el.value : ''; CV.pintarMapa(); };
  CV.acts.locate2 = () => CV.ubicar(CV.mapaActual);

  /* ---------- otros ---------- */
  CV.acts.closeModal = () => CV.closeModal();
  CV.acts.overlay = (t, e) => { if (e.target === t) CV.closeModal(); };
  CV.acts.resetDemo = () => { CV.reset(); CV.toast('Datos de ejemplo restablecidos'); CV.go('/'); CV.render(false); };

  /* ---------- delegación de eventos ---------- */
  document.addEventListener('click', (e) => {
    if (!e.target.closest('.dd')) closeMenus();
    const t = e.target.closest('[data-act]');
    if (!t) return;
    const fn = CV.acts[t.dataset.act];
    if (fn) fn(t, e);
  });
  document.addEventListener('change', (e) => {
    const t = e.target.closest('[data-change]');
    if (t && CV.changes[t.dataset.change]) CV.changes[t.dataset.change](t, e);
  });
  document.addEventListener('input', (e) => {
    const t = e.target.closest('[data-input]');
    if (t && CV.inputs[t.dataset.input]) CV.inputs[t.dataset.input](t, e);
  });
  document.addEventListener('submit', (e) => {
    const f = e.target.closest('[data-submit]');
    if (!f) return;
    e.preventDefault();
    const fn = CV.submits[f.dataset.submit];
    if (fn) fn(f, e);
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') { closeMenus(); if (document.querySelector('#modal .overlay')) CV.closeModal(); }
  });

  /* ---------- arranque ---------- */
  const arrancar = () => {
    CV.renderFooter();
    CV.render(false);
    CV.runReminders();
    setInterval(CV.runReminders, 60000);
  };
  const cargando = document.getElementById('app');
  if (cargando) cargando.innerHTML = '<p class="loading" style="padding:60px 20px;text-align:center">Cargando CulturaViva…</p>';
  (CV.api && CV.api.ready ? CV.api.ready : Promise.resolve()).then(() => {
    arrancar();
    if (CV.api && CV.api.error) CV.toast('No hay conexión con la base de datos. Estás en modo demostración.', 'warn');
  });
})();
