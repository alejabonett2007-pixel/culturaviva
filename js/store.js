/* CulturaViva · almacenamiento y reglas de negocio.
   Hoy los datos viven en localStorage; cada función de este archivo corresponde a un endpoint
   futuro de la API (ver README). */
(function () {
  const CV = window.CV;
  const KEY = 'culturaviva.v1';

  CV.load = () => {
    try {
      const s = JSON.parse(localStorage.getItem(KEY));
      if (s && s.v === 1) return s;
    } catch (e) { /* sin almacenamiento */ }
    return null;
  };
  CV.save = () => {
    try { localStorage.setItem(KEY, JSON.stringify(CV.db)); } catch (e) { console.warn('No se pudo guardar', e); }
  };
  CV.reset = () => {
    try { localStorage.removeItem(KEY); } catch (e) { /* nada */ }
    CV.db = CV.seed();
    CV.save();
  };
  CV.db = CV.load() || CV.seed();

  // Las cuentas de ejemplo siempre se leen de data.js: si cambias nombre, correo, clave o rol allí,
  // el cambio se aplica al recargar sin perder los eventos ni lo que hayas creado en el navegador.
  (() => {
    const ejemplo = CV.seed().usuarios;
    ejemplo.forEach((su) => {
      const u = CV.db.usuarios.find((x) => x.id === su.id);
      if (u) Object.assign(u, { nombre: su.nombre, correo: su.correo, clave: su.clave, rol: su.rol });
      else CV.db.usuarios.push(su);
    });
    CV.save();
  })();

  /* ---------- accesos ---------- */
  CV.user = () => CV.db.usuarios.find((u) => u.id === CV.db.sesion) || null;
  CV.cat = (id) => CV.db.categorias.find((c) => c.id === id);
  CV.lugar = (id) => CV.db.lugares.find((l) => l.id === id);
  CV.evento = (id) => CV.db.eventos.find((e) => e.id === id);
  CV.usuario = (id) => CV.db.usuarios.find((u) => u.id === id);

  /* ---------- estado temporal de un evento ---------- */
  CV.endOf = (e) => {
    if (e.funciones && e.funciones.length) {
      const last = e.funciones.slice().sort().pop();
      return new Date(new Date(last).getTime() + 2 * 3600e3);
    }
    return e.fin ? new Date(e.fin) : new Date(new Date(e.inicio).getTime() + 2 * 3600e3);
  };
  CV.isPast = (e) => CV.endOf(e) < new Date();
  CV.vigente = (e) => e.estado !== 'cancelado' && !CV.isPast(e);
  CV.largo = (e) => ['arte', 'museos'].includes(e.categoria) && e.fin;
  CV.estadoTemporal = (e) => {
    const now = new Date();
    if (e.estado === 'cancelado') return { t: 'Cancelado', k: 'bad' };
    if (CV.isPast(e)) return { t: 'Finalizado', k: 'muted' };
    const started = new Date(e.inicio) <= now;
    if (e.categoria === 'festivales') return started ? { t: 'En curso', k: 'ok' } : { t: 'Próximo', k: 'info' };
    if (e.categoria === 'arte') return started ? { t: 'Vigente', k: 'ok' } : { t: 'Próxima a inaugurarse', k: 'info' };
    return started ? { t: 'En curso', k: 'ok' } : { t: 'Próximo', k: 'info' };
  };

  /* ---------- cupos (HU-12) ---------- */
  CV.limitado = (e) => Number(e.capacidad) > 0;
  CV.cupos = (e) => (CV.limitado(e) ? Math.max(0, Math.min(e.capacidad, e.capacidad - e.inscritos)) : null);
  CV.cuposTexto = (e) => {
    if (!CV.limitado(e)) return e.precio > 0 ? 'Sin límite de cupos' : 'Entrada libre';
    const c = CV.cupos(e);
    return c === 0 ? 'Cupos agotados' : `${c} ${c === 1 ? 'cupo disponible' : 'cupos disponibles'}`;
  };

  /* ---------- días en los que ocurre un evento ---------- */
  CV.dias = (e) => {
    if (e.funciones && e.funciones.length) return [...new Set(e.funciones.map(CV.keyOf))];
    const a = CV.keyOf(e.inicio);
    if (e.categoria === 'festivales' && e.fin) {
      const out = [];
      const d = new Date(a + 'T00:00');
      const end = new Date(CV.keyOf(e.fin) + 'T00:00');
      while (d <= end && out.length < 31) { out.push(CV.key(d)); d.setDate(d.getDate() + 1); }
      return out;
    }
    return [a];
  };
  CV.span = (e) => {
    const ds = CV.dias(e).slice().sort();
    const a = ds[0];
    let b = ds[ds.length - 1];
    if (CV.largo(e)) b = CV.keyOf(e.fin);
    return [a, b];
  };
  CV.ocurreEn = (e, k) => {
    if (CV.dias(e).includes(k)) return true;
    if (CV.largo(e)) { const [a, b] = CV.span(e); return k >= a && k <= b; }
    return false;
  };
  CV.ocurreEntre = (e, a, b) => {
    if (CV.dias(e).some((k) => k >= a && k <= b)) return true;
    if (CV.largo(e)) { const [x, y] = CV.span(e); return x <= b && y >= a; }
    return false;
  };

  /* ---------- consulta de eventos: búsqueda + filtros (HU-01 a HU-04) ---------- */
  CV.buscar = (f = {}) => {
    const q = CV.norm(f.q);
    let list = CV.db.eventos.filter((e) => (f.todos ? true : CV.vigente(e)));
    if (f.ciudad && f.ciudad !== 'todas') list = list.filter((e) => e.ciudad === f.ciudad);
    if (f.cats && f.cats.length) list = list.filter((e) => f.cats.includes(e.categoria));
    if (f.desde || f.hasta) {
      const a = f.desde || f.hasta;
      const b = f.hasta || f.desde;
      list = list.filter((e) => CV.ocurreEntre(e, a, b));
    }
    if (q) {
      list = list.filter((e) => {
        const l = CV.lugar(e.lugarId);
        const hay = CV.norm([e.titulo, e.descripcion, e.invitado, l && l.nombre].join(' '));
        return q.split(/\s+/).every((w) => hay.includes(w));
      });
    }
    const dir = f.orden === 'desc' ? -1 : 1;
    return list.sort((a, b) => (a.inicio < b.inicio ? -1 : a.inicio > b.inicio ? 1 : 0) * dir);
  };

  /* ---------- favoritos, recordatorios, reservas ---------- */
  const bag = (name) => { const u = CV.user(); if (!u) return null; CV.db[name][u.id] = CV.db[name][u.id] || []; return CV.db[name][u.id]; };
  CV.isFav = (id) => { const u = CV.user(); return !!u && (CV.db.favs[u.id] || []).includes(id); };
  CV.isRec = (id) => { const u = CV.user(); return !!u && (CV.db.recs[u.id] || []).includes(id); };
  CV.isRes = (id) => { const u = CV.user(); return !!u && (CV.db.inscr[u.id] || []).includes(id); };
  const flip = (arr, id) => { const i = arr.indexOf(id); if (i >= 0) arr.splice(i, 1); else arr.push(id); return i < 0; };
  CV.toggleFav = (id) => { const b = bag('favs'); if (!b) return null; const on = flip(b, id); CV.save(); return on; };
  CV.toggleRec = (id) => { const b = bag('recs'); if (!b) return null; const on = flip(b, id); CV.save(); if (on) CV.runReminders(); return on; };
  CV.misFavoritos = () => { const u = CV.user(); return u ? (CV.db.favs[u.id] || []).map(CV.evento).filter(Boolean) : []; };

  CV.toggleReserva = (id) => {
    const u = CV.user(); const e = CV.evento(id);
    if (!u || !e) return { error: 'login' };
    const b = bag('inscr');
    if (b.includes(id)) {
      b.splice(b.indexOf(id), 1);
      e.inscritos = Math.max(0, e.inscritos - 1);
      CV.save();
      return { on: false };
    }
    if (!CV.vigente(e)) return { error: 'Este evento ya no admite reservas.' };
    if (CV.limitado(e) && CV.cupos(e) === 0) return { error: 'Los cupos de este evento están agotados.' };
    b.push(id);
    if (CV.limitado(e)) e.inscritos = Math.min(e.capacidad, e.inscritos + 1);
    CV.save();
    return { on: true };
  };

  /* ---------- notificaciones (HU-10, HU-11) ---------- */
  CV.notify = (uid, n) => {
    CV.db.notifs.unshift({ id: CV.uid('n'), uid, fecha: new Date().toISOString(), leida: false, ...n });
  };
  CV.misNotifs = () => { const u = CV.user(); return u ? CV.db.notifs.filter((n) => n.uid === u.id) : []; };
  CV.sinLeer = () => CV.misNotifs().filter((n) => !n.leida).length;
  CV.interesados = (id) =>
    CV.db.usuarios
      .map((u) => u.id)
      .filter((uid) => (CV.db.favs[uid] || []).includes(id) || (CV.db.recs[uid] || []).includes(id));

  CV.runReminders = () => {
    const now = Date.now();
    let changed = false;
    CV.db.usuarios.forEach((u) => {
      if (u.prefs && u.prefs.plataforma === false) return;
      (CV.db.recs[u.id] || []).forEach((id) => {
        const e = CV.evento(id);
        if (!e || !CV.vigente(e)) return; // sin recordatorios de eventos cancelados o ya realizados
        const t = new Date(e.inicio).getTime() - now;
        [['1h', 3600e3], ['24h', 24 * 3600e3]].forEach(([tag, ms]) => {
          const k = `${u.id}:${id}:${tag}:${e.inicio}`;
          if (t > 0 && t <= ms && !CV.db.sent[k]) {
            CV.db.sent[k] = true;
            const l = CV.lugar(e.lugarId);
            CV.notify(u.id, {
              tipo: 'recordatorio',
              titulo: tag === '1h' ? 'Tu evento empieza en 1 hora' : 'Tu evento es en 24 horas',
              texto: `${e.titulo} · ${CV.fmtDate(e.inicio)}, ${CV.fmtTime(e.inicio)} · ${l ? l.nombre : ''}`,
              eventoId: id,
            });
            changed = true;
          }
        });
      });
    });
    if (changed) { CV.save(); document.dispatchEvent(new CustomEvent('cv:notifs')); }
  };

  /* ---------- crear / editar eventos (HU-25 a HU-28) ---------- */
  CV.validarEvento = (d, prev) => {
    const err = {};
    if (!d.titulo.trim()) err.titulo = 'Escribe el título del evento.';
    if (!d.descripcion.trim()) err.descripcion = 'Agrega una descripción.';
    if (!d.categoria) err.categoria = 'Elige una categoría.';
    if (!d.fecha) err.fecha = 'Elige la fecha.';
    if (!d.hora) err.hora = 'Elige la hora.';
    if (!d.lugarId) err.lugarId = 'Elige el lugar.';
    if (Number.isNaN(d.capacidad) || d.capacidad < 0) err.capacidad = 'Escribe un número de cupos válido (0 si no hay límite).';
    if (!(prev && prev.imagen) && !d.imagen && !d.sinImagenOk) { /* la imagen es opcional: se usa una ilustración */ }
    if (d.fecha && d.hora) {
      const inicio = `${d.fecha}T${d.hora}`;
      const cambio = !prev || prev.inicio !== inicio;
      if (cambio && new Date(inicio) < new Date()) err.fecha = 'La fecha y hora no pueden estar en el pasado.';
      if (d.fechaFin && d.horaFin && `${d.fechaFin}T${d.horaFin}` < inicio) err.fechaFin = 'El cierre debe ser posterior al inicio.';
    }
    if (prev && d.capacidad > 0 && d.capacidad < prev.inscritos) {
      err.capacidad = `Ya hay ${prev.inscritos} reservas; el cupo no puede ser menor.`;
    }
    return err;
  };

  CV.guardarEvento = (d, prev, actor) => {
    const err = CV.validarEvento(d, prev);
    if (Object.keys(err).length) return { err };
    const lugar = CV.lugar(d.lugarId);
    const inicio = `${d.fecha}T${d.hora}`;
    const fin = d.fechaFin ? `${d.fechaFin}T${d.horaFin || '23:59'}` : d.horaFin ? `${d.fecha}T${d.horaFin}` : '';
    const campos = {
      titulo: d.titulo.trim(), descripcion: d.descripcion.trim(), categoria: d.categoria, inicio, fin,
      lugarId: d.lugarId, ciudad: lugar.ciudad, capacidad: d.capacidad, precio: d.precio || 0,
      invitado: d.invitado.trim(), tema: d.tema.trim(), duracion: d.duracion.trim(), publico: d.publico.trim(),
      imagen: d.imagen || '',
    };
    if (d.funciones) campos.funciones = d.funciones;
    let e;
    if (prev) {
      const cambioHora = prev.inicio !== inicio;
      const cambioLugar = prev.lugarId !== d.lugarId;
      const antes = { inicio: prev.inicio, lugar: CV.lugar(prev.lugarId) };
      Object.assign(prev, campos);
      if (!d.funciones) { /* se conservan las funciones existentes */ }
      if (cambioHora && prev.funciones && prev.funciones.length) prev.funciones[0] = inicio;
      e = prev;
      const avisar = CV.interesados(e.id).filter((uid) => uid !== (actor && actor.id));
      if (cambioHora) {
        avisar.forEach((uid) => CV.notify(uid, {
          tipo: 'horario', titulo: 'Cambio de horario', eventoId: e.id,
          texto: `${e.titulo}: antes ${CV.fmtDate(antes.inicio)}, ${CV.fmtTime(antes.inicio)}; ahora ${CV.fmtDate(inicio)}, ${CV.fmtTime(inicio)}.`,
        }));
      }
      if (cambioLugar) {
        avisar.forEach((uid) => CV.notify(uid, {
          tipo: 'ubicacion', titulo: 'Cambio de lugar', eventoId: e.id,
          texto: `${e.titulo}: antes en ${antes.lugar ? antes.lugar.nombre : 'otro lugar'}; ahora en ${lugar.nombre}.`,
        }));
      }
    } else {
      e = { id: CV.uid('e'), inscritos: 0, destacado: false, estado: 'activo', funciones: [], programacion: [],
        organizadorId: actor.id, ...campos };
      CV.db.eventos.push(e);
    }
    CV.save();
    return { ok: true, evento: e };
  };

  CV.cancelarEvento = (id, actor) => {
    const e = CV.evento(id); if (!e) return;
    e.estado = 'cancelado';
    CV.interesados(id).filter((uid) => uid !== (actor && actor.id)).forEach((uid) =>
      CV.notify(uid, { tipo: 'cancelado', titulo: 'Evento cancelado', eventoId: id, texto: `Se canceló "${e.titulo}" (${CV.fmtDate(e.inicio)}).` }));
    CV.save();
  };
  CV.reactivarEvento = (id) => { const e = CV.evento(id); if (e) { e.estado = 'activo'; CV.save(); } };
  CV.eliminarEvento = (id) => {
    CV.db.eventos = CV.db.eventos.filter((e) => e.id !== id);
    ['favs', 'recs', 'inscr'].forEach((k) => Object.keys(CV.db[k]).forEach((u) => (CV.db[k][u] = CV.db[k][u].filter((x) => x !== id))));
    CV.db.notifs = CV.db.notifs.filter((n) => n.eventoId !== id);
    CV.save();
  };

  /* ---------- sesión ---------- */
  CV.login = (correo, clave) => {
    const u = CV.db.usuarios.find((x) => CV.norm(x.correo) === CV.norm(correo) && x.clave === clave);
    if (!u) return null;
    CV.db.sesion = u.id; CV.save(); return u;
  };
  CV.logout = () => { CV.db.sesion = null; CV.save(); };
  CV.registrar = ({ nombre, correo, clave, rol }) => {
    if (CV.db.usuarios.some((x) => CV.norm(x.correo) === CV.norm(correo))) return { error: 'Ya existe una cuenta con ese correo.' };
    const u = { id: CV.uid('u'), nombre, correo, clave, rol: rol === 'organizador' ? 'organizador' : 'usuario', prefs: { plataforma: true, correo: true } };
    CV.db.usuarios.push(u); CV.db.sesion = u.id; CV.save();
    return { user: u };
  };
})();
