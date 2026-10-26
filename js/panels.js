/* CulturaViva · paneles del organizador (HU-25 a HU-28) y del administrador (HU-29 a HU-31) */
(function () {
  const CV = window.CV;
  const { esc, icon } = CV;

  const necesita = (roles, titulo) => {
    const u = CV.user();
    if (u && roles.includes(u.rol)) return null;
    return `<div class="wrap page">${CV.vacio(
      u ? 'No tienes permiso para ver esta sección' : titulo,
      u ? 'Esta sección es solo para otro tipo de cuenta.' : 'Inicia sesión con una cuenta autorizada.',
      u ? '<a class="btn" href="#/">Volver al inicio</a>' : '<button class="btn" data-act="login">Iniciar sesión</button>')}</div>`;
  };

  const estadoPill = (e) => { const s = CV.estadoTemporal(e); return `<span class="state ${s.k}">${s.t}</span>`; };

  const cuposCell = (e) => {
    if (!CV.limitado(e)) return `<span class="muted">${e.precio > 0 ? 'Sin límite' : 'Entrada libre'}</span>`;
    const pct = Math.round((e.inscritos / e.capacidad) * 100);
    return `<div class="cupcell"><div class="bar ${CV.cupos(e) === 0 ? 'full' : ''}"><i style="width:${pct}%"></i></div><small><b>${e.inscritos}</b> de ${e.capacidad} · ${CV.cupos(e) === 0 ? 'agotados' : 'quedan ' + CV.cupos(e)}</small></div>`;
  };

  /* ======================= ORGANIZADOR ======================= */
  CV.views.organizador = (parts) => {
    const bad = necesita(['organizador'], 'Inicia sesión como organizador');
    if (bad) return bad;
    if (parts[1] === 'nuevo') return CV.eventForm(null, '#/organizador');
    if (parts[1] === 'editar') return CV.eventForm(CV.evento(parts[2]), '#/organizador');
    const u = CV.user();
    const mios = CV.db.eventos.filter((e) => e.organizadorId === u.id).sort((a, b) => (a.inicio < b.inicio ? 1 : -1));
    const prox = mios.filter(CV.vigente);
    const reservas = mios.reduce((s, e) => s + (CV.limitado(e) ? e.inscritos : 0), 0);
    return `<div class="wrap page"><div class="page-h"><div><h1>Mis eventos</h1><p class="lead">Publica y mantén al día la programación de ${esc(u.nombre)}.</p></div><a class="btn" href="#/organizador/nuevo">${icon('plus', 16)}Publicar evento</a></div>
      <div class="stats"><div class="card stat"><b>${mios.length}</b><span>Eventos publicados</span></div><div class="card stat"><b>${prox.length}</b><span>Próximos</span></div><div class="card stat"><b>${reservas}</b><span>Cupos reservados</span></div></div>
      ${mios.length ? tablaEventos(mios, false) : CV.vacio('Aún no has publicado eventos', 'Publica tu primer evento para que aparezca en la agenda.', '<a class="btn" href="#/organizador/nuevo">Publicar evento</a>')}</div>`;
  };

  const tablaEventos = (list, admin) => `<div class="card tbl-w"><table class="tbl"><thead><tr><th>Evento</th>${admin ? '<th>Organizador</th>' : ''}<th>Fecha</th><th>${admin ? 'Ciudad' : 'Lugar'}</th><th>Cupos</th><th>Estado</th>${admin ? '<th>Destacado</th>' : ''}<th><span class="sr">Acciones</span></th></tr></thead><tbody>
    ${list.map((e) => { const l = CV.lugar(e.lugarId); const org = CV.usuario(e.organizadorId); const base = admin ? '#/admin' : '#/organizador';
      return `<tr><td><a class="tl" href="#/evento/${e.id}"><b>${esc(e.titulo)}</b></a>${CV.tag(e)}</td>${admin ? `<td>${esc(org ? org.nombre : '—')}</td>` : ''}
      <td>${CV.fmtDate(e.inicio)}<br><small>${CV.fmtTime(e.inicio)}</small></td><td>${admin ? esc(e.ciudad) : esc(l ? l.nombre : '')}</td><td>${cuposCell(e)}</td><td>${estadoPill(e)}</td>
      ${admin ? `<td><label class="sw tiny"><input type="checkbox" data-change="destacar" data-id="${e.id}" ${e.destacado ? 'checked' : ''} aria-label="Destacar ${esc(e.titulo)}"></label></td>` : ''}
      <td class="acts"><a class="ib" href="${base}/editar/${e.id}" aria-label="Editar ${esc(e.titulo)}" title="Editar">${icon('edit', 16)}</a>
        ${e.estado === 'cancelado' ? `<button class="ib" data-act="reactivar" data-id="${e.id}" title="Reactivar" aria-label="Reactivar">${icon('check', 16)}</button>` : `<button class="ib" data-act="cancelar" data-id="${e.id}" title="Cancelar evento" aria-label="Cancelar evento">${icon('x', 16)}</button>`}
        ${admin ? `<button class="ib danger" data-act="eliminar" data-id="${e.id}" title="Eliminar" aria-label="Eliminar">${icon('trash', 16)}</button>` : ''}</td></tr>`; }).join('')}
    </tbody></table></div>`;

  /* ---------- formulario de evento ---------- */
  CV.eventForm = (prev, back) => {
    const u = CV.user();
    if (prev && u.rol === 'organizador' && prev.organizadorId !== u.id) return `<div class="wrap page">${CV.vacio('No puedes editar este evento', 'Solo quien lo publicó puede modificarlo.', `<a class="btn" href="${back}">Volver</a>`)}</div>`;
    if (!prev && CV.eventForm.editId) CV.eventForm.editId = null;
    const e = prev || { titulo: '', descripcion: '', categoria: '', inicio: '', fin: '', lugarId: '', capacidad: 0, precio: 0, invitado: '', tema: '', duracion: '', publico: '', imagen: '' };
    const fecha = e.inicio ? e.inicio.slice(0, 10) : '', hora = e.inicio ? e.inicio.slice(11, 16) : '';
    const fechaFin = e.fin ? e.fin.slice(0, 10) : '', horaFin = e.fin ? e.fin.slice(11, 16) : '';
    const hoy = CV.todayKey();
    const f = (name, label, input, o = {}) => `<label class="ff ${o.cls || ''}"><span>${label}${o.req ? ' <i class="req" title="Obligatorio">*</i>' : ''}</span>${input}${o.hint ? `<small>${o.hint}</small>` : ''}<span class="err" data-err="${name}" role="alert"></span></label>`;
    const lugares = Object.keys(CV.ciudades).map((c) => `<optgroup label="${c}">${CV.db.lugares.filter((l) => l.ciudad === c).map((l) => `<option value="${l.id}" ${l.id === e.lugarId ? 'selected' : ''}>${esc(l.nombre)}</option>`).join('')}</optgroup>`).join('');
    const l0 = CV.lugar(e.lugarId);
    CV.after.push(() => { CV.eventForm.prev = prev; syncTaller(); });
    return `<div class="wrap page narrow"><a class="back dark" href="${back}">${icon('left', 16)} Volver</a>
      <div class="page-h"><div><h1>${prev ? 'Editar evento' : 'Publicar evento'}</h1><p class="lead">Los campos con <i class="req">*</i> son obligatorios.</p></div></div>
      <form class="card pad-l form eform" data-submit="eventForm" data-back="${back}" novalidate>
        ${f('titulo', 'Título', `<input name="titulo" value="${esc(e.titulo)}" maxlength="120">`, { req: 1, cls: 'w2' })}
        ${f('categoria', 'Categoría', `<select name="categoria" data-change="formCat"><option value="">Elige una categoría</option>${CV.db.categorias.map((c) => `<option value="${c.id}" ${c.id === e.categoria ? 'selected' : ''}>${esc(c.nombre)}</option>`).join('')}</select>`, { req: 1 })}
        ${f('lugarId', 'Lugar', `<select name="lugarId" data-change="formLugar"><option value="">Elige un lugar</option>${lugares}</select>`, { req: 1 })}
        ${f('ciudad', 'Ciudad', `<input id="f-ciudad" value="${esc(l0 ? l0.ciudad : '')}" readonly placeholder="Se completa con el lugar">`)}
        ${f('invitado', 'Artista, compañía o invitado', `<input name="invitado" value="${esc(e.invitado)}">`)}
        ${f('fecha', 'Fecha', `<input type="date" name="fecha" value="${fecha}" min="${prev && fecha < hoy ? fecha : hoy}">`, { req: 1 })}
        ${f('hora', 'Hora de inicio', `<input type="time" name="hora" value="${hora}">`, { req: 1 })}
        ${f('fechaFin', 'Fecha de cierre', `<input type="date" name="fechaFin" value="${fechaFin}" min="${hoy}">`, { hint: 'Solo si dura varios días, como una exposición o un festival.' })}
        ${f('horaFin', 'Hora de cierre', `<input type="time" name="horaFin" value="${horaFin}">`)}
        ${f('capacidad', 'Cupos', `<input type="number" name="capacidad" min="0" step="1" value="${e.capacidad || 0}">`, { hint: 'Escribe 0 si no hay límite de cupos.' })}
        ${f('precio', 'Precio de entrada (COP)', `<input type="number" name="precio" min="0" step="1000" value="${e.precio || 0}">`, { hint: 'Escribe 0 si la entrada es gratuita.' })}
        <div class="w2 taller" id="taller-f"><div class="three">${f('tema', 'Tema del taller', `<input name="tema" value="${esc(e.tema)}">`)}${f('duracion', 'Duración', `<input name="duracion" value="${esc(e.duracion)}" placeholder="3 horas">`)}${f('publico', 'Dirigido a', `<input name="publico" value="${esc(e.publico)}" placeholder="Jóvenes y adultos">`)}</div></div>
        ${f('descripcion', 'Descripción', `<textarea name="descripcion" rows="5">${esc(e.descripcion)}</textarea>`, { req: 1, cls: 'w2' })}
        <div class="ff w2"><span>Imagen</span><div class="imgup"><div id="img-prev">${e.imagen ? `<img src="${esc(e.imagen)}" alt="Vista previa">` : '<em>Sin imagen: se usará una ilustración de la categoría.</em>'}</div>
          <input type="file" accept="image/*" data-change="formImg" aria-label="Subir imagen"><input type="hidden" name="imagen" value="${e.imagen ? '' : ''}" id="f-imagen">
          <button type="button" class="btn ghost sm" data-act="quitarImg">Quitar imagen</button></div></div>
        <div class="form-f w2"><a class="btn ghost" href="${back}">Cancelar</a><button class="btn" type="submit">${prev ? 'Guardar cambios' : 'Publicar evento'}</button></div>
      </form></div>`;
  };

  const syncTaller = () => {
    const sel = document.querySelector('[name="categoria"]'); const box = document.getElementById('taller-f');
    if (sel && box) box.hidden = sel.value !== 'talleres';
  };
  CV.changes.formCat = syncTaller;
  CV.changes.formLugar = (el) => { const l = CV.lugar(el.value); document.getElementById('f-ciudad').value = l ? l.ciudad : ''; };
  CV.changes.formImg = (el) => {
    const file = el.files && el.files[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { CV.toast('Elige un archivo de imagen (JPG o PNG).', 'warn'); el.value = ''; return; }
    const r = new FileReader();
    r.onload = () => {
      const img = new Image();
      img.onload = () => {
        const max = 900; const k = Math.min(1, max / Math.max(img.width, img.height));
        const c = document.createElement('canvas'); c.width = Math.round(img.width * k); c.height = Math.round(img.height * k);
        c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
        const url = c.toDataURL('image/jpeg', 0.8);
        document.getElementById('f-imagen').value = url;
        document.getElementById('f-imagen').dataset.set = '1';
        document.getElementById('img-prev').innerHTML = `<img src="${url}" alt="Vista previa">`;
      };
      img.src = r.result;
    };
    r.readAsDataURL(file);
  };
  CV.acts.quitarImg = () => {
    const h = document.getElementById('f-imagen'); h.value = ''; h.dataset.set = '1';
    document.getElementById('img-prev').innerHTML = '<em>Sin imagen: se usará una ilustración de la categoría.</em>';
  };

  CV.submits.eventForm = (form) => {
    const fd = new FormData(form); const prev = CV.eventForm.prev; const u = CV.user();
    const h = document.getElementById('f-imagen');
    const d = {
      titulo: fd.get('titulo') || '', descripcion: fd.get('descripcion') || '', categoria: fd.get('categoria') || '',
      lugarId: fd.get('lugarId') || '', invitado: fd.get('invitado') || '', fecha: fd.get('fecha') || '', hora: fd.get('hora') || '',
      fechaFin: fd.get('fechaFin') || '', horaFin: fd.get('horaFin') || '',
      capacidad: fd.get('capacidad') === '' ? NaN : Number(fd.get('capacidad')), precio: Number(fd.get('precio')) || 0,
      tema: fd.get('tema') || '', duracion: fd.get('duracion') || '', publico: fd.get('publico') || '',
      imagen: h.dataset.set ? h.value : prev ? prev.imagen : '',
    };
    form.querySelectorAll('[data-err]').forEach((x) => (x.textContent = ''));
    const r = CV.guardarEvento(d, prev, u);
    if (r.err) {
      Object.entries(r.err).forEach(([k, v]) => { const el = form.querySelector(`[data-err="${k}"]`); if (el) el.textContent = v; });
      const first = form.querySelector('.err:not(:empty)');
      if (first) first.closest('label').querySelector('input,select,textarea')?.focus();
      CV.toast('Revisa los campos marcados.', 'warn');
      return;
    }
    CV.toast(prev ? 'Cambios guardados' : 'Evento publicado');
    CV.go(form.dataset.back.slice(1));
  };

  /* ======================= ADMINISTRADOR ======================= */
  CV.af = { q: '', estado: 'todos' };
  CV.pintarAdminEventos = () => {
    const box = document.getElementById('adm-res'); if (!box) return;
    const q = CV.norm(CV.af.q);
    let list = CV.db.eventos.filter((e) => (!q || CV.norm(e.titulo).includes(q)));
    if (CV.af.estado === 'vigentes') list = list.filter(CV.vigente);
    if (CV.af.estado === 'cancelados') list = list.filter((e) => e.estado === 'cancelado');
    if (CV.af.estado === 'pasados') list = list.filter((e) => e.estado !== 'cancelado' && CV.isPast(e));
    list.sort((a, b) => (a.inicio < b.inicio ? 1 : -1));
    box.innerHTML = list.length ? tablaEventos(list, true) : CV.vacio('Sin resultados', 'No hay eventos con esos filtros.');
  };

  CV.views.admin = (parts, q) => {
    const bad = necesita(['administrador'], 'Inicia sesión como administrador');
    if (bad) return bad;
    if (parts[1] === 'nuevo') return CV.eventForm(null, '#/admin');
    if (parts[1] === 'editar') return CV.eventForm(CV.evento(parts[2]), '#/admin');
    const t = q.t || 'eventos';
    const tabs = `<div class="tabs lg" role="tablist"><a class="${t === 'eventos' ? 'on' : ''}" href="#/admin?t=eventos" role="tab">Eventos</a><a class="${t === 'categorias' ? 'on' : ''}" href="#/admin?t=categorias" role="tab">Categorías</a><a class="${t === 'lugares' ? 'on' : ''}" href="#/admin?t=lugares" role="tab">Lugares</a></div>`;
    let body = '';
    if (t === 'eventos') {
      CV.af = { q: '', estado: 'todos' };
      CV.after.push(() => CV.pintarAdminEventos());
      body = `<div class="card filters"><label class="f-q">${icon('search', 18)}<span class="sr">Buscar</span><input type="search" placeholder="Buscar por título" data-input="aq"></label>
        <label class="f">Estado<select data-change="aestado"><option value="todos">Todos</option><option value="vigentes">Vigentes</option><option value="pasados">Finalizados</option><option value="cancelados">Cancelados</option></select></label>
        <a class="btn sm" href="#/admin/nuevo">${icon('plus', 15)}Nuevo evento</a></div><div id="adm-res"></div>`;
    } else if (t === 'categorias') {
      body = `<div class="page-h in"><p class="lead">Las categorías clasifican los eventos y aparecen como filtros en toda la plataforma.</p><button class="btn sm" data-act="catForm">${icon('plus', 15)}Nueva categoría</button></div>
        <div class="card tbl-w"><table class="tbl"><thead><tr><th>Categoría</th><th>Eventos</th><th><span class="sr">Acciones</span></th></tr></thead><tbody>
        ${CV.db.categorias.map((c) => `<tr><td><span class="cswatch" style="--c:${c.color}">${icon(c.icono, 16)}</span><b>${esc(c.nombre)}</b></td><td>${CV.db.eventos.filter((e) => e.categoria === c.id).length}</td>
          <td class="acts"><button class="ib" data-act="catForm" data-id="${c.id}" aria-label="Editar ${esc(c.nombre)}">${icon('edit', 16)}</button><button class="ib danger" data-act="catDel" data-id="${c.id}" aria-label="Eliminar ${esc(c.nombre)}">${icon('trash', 16)}</button></td></tr>`).join('')}</tbody></table></div>`;
    } else {
      body = `<div class="page-h in"><p class="lead">El directorio de espacios culturales que se muestra en Lugares y en el mapa.</p><button class="btn sm" data-act="lugForm">${icon('plus', 15)}Nuevo lugar</button></div>
        <div class="card tbl-w"><table class="tbl"><thead><tr><th>Lugar</th><th>Tipo</th><th>Ciudad</th><th>Dirección</th><th>Eventos</th><th><span class="sr">Acciones</span></th></tr></thead><tbody>
        ${CV.db.lugares.map((l) => `<tr><td><a class="tl" href="#/lugar/${l.id}"><b>${esc(l.nombre)}</b></a></td><td>${esc(l.tipo)}</td><td>${esc(l.ciudad)}</td><td>${l.direccion ? esc(l.direccion) : '<span class="warn">Sin dirección</span>'}</td><td>${CV.db.eventos.filter((e) => e.lugarId === l.id).length}</td>
          <td class="acts"><button class="ib" data-act="lugForm" data-id="${l.id}" aria-label="Editar ${esc(l.nombre)}">${icon('edit', 16)}</button><button class="ib danger" data-act="lugDel" data-id="${l.id}" aria-label="Eliminar ${esc(l.nombre)}">${icon('trash', 16)}</button></td></tr>`).join('')}</tbody></table></div>`;
    }
    return `<div class="wrap page"><div class="page-h"><div><h1>Administración</h1><p class="lead">Mantén ordenada la información cultural de la plataforma.</p></div></div>${tabs}${body}</div>`;
  };

  CV.inputs.aq = (el) => { CV.af.q = el.value; CV.pintarAdminEventos(); };
  CV.changes.aestado = (el) => { CV.af.estado = el.value; CV.pintarAdminEventos(); };
  CV.changes.destacar = (el) => { const e = CV.evento(el.dataset.id); e.destacado = el.checked; CV.save(); CV.toast(el.checked ? 'Evento destacado' : 'Evento quitado de destacados'); };

  /* ---------- acciones sobre eventos ---------- */
  CV.confirmar = (msg, act, id, label = 'Confirmar') => CV.modal(`<div class="dlg-b"><h2>${esc(msg)}</h2><div class="form-f"><button class="btn ghost" data-act="closeModal">Volver</button><button class="btn danger" data-act="${act}" data-id="${id}">${label}</button></div></div>`, { label: 'Confirmar' });
  const refrescar = () => { CV.closeModal(); CV.render(true); };

  CV.acts.cancelar = (t) => { const e = CV.evento(t.dataset.id); CV.confirmar(`¿Cancelar "${e.titulo}"? Avisaremos a quienes lo guardaron o activaron su recordatorio.`, 'cancelarOk', e.id, 'Cancelar evento'); };
  CV.acts.cancelarOk = (t) => { CV.cancelarEvento(t.dataset.id, CV.user()); CV.toast('Evento cancelado'); refrescar(); };
  CV.acts.reactivar = (t) => { CV.reactivarEvento(t.dataset.id); CV.toast('Evento reactivado'); CV.render(true); };
  CV.acts.eliminar = (t) => { const e = CV.evento(t.dataset.id); CV.confirmar(`¿Eliminar "${e.titulo}" de forma definitiva?`, 'eliminarOk', e.id, 'Eliminar'); };
  CV.acts.eliminarOk = (t) => { CV.eliminarEvento(t.dataset.id); CV.toast('Evento eliminado'); refrescar(); };

  /* ---------- categorías ---------- */
  CV.acts.catForm = (t) => {
    const c = t.dataset.id ? CV.cat(t.dataset.id) : { nombre: '', color: '#2f6bff', icono: 'grid' };
    CV.modal(`<form class="dlg-b form" data-submit="catSave" data-id="${t.dataset.id || ''}" novalidate><h2>${t.dataset.id ? 'Editar categoría' : 'Nueva categoría'}</h2>
      <label class="ff"><span>Nombre <i class="req">*</i></span><input name="nombre" value="${esc(c.nombre)}" maxlength="30"><span class="err" data-err="nombre" role="alert"></span></label>
      <div class="two-f"><label class="ff"><span>Color</span><input type="color" name="color" value="${c.color}"></label>
      <label class="ff"><span>Ícono</span><select name="icono">${['music', 'smile', 'image', 'book', 'film', 'landmark', 'activity', 'sun', 'tool', 'star', 'heart', 'users', 'ticket', 'grid'].map((i) => `<option value="${i}" ${i === c.icono ? 'selected' : ''}>${i}</option>`).join('')}</select></label></div>
      <div class="form-f"><button type="button" class="btn ghost" data-act="closeModal">Cancelar</button><button class="btn" type="submit">Guardar categoría</button></div></form>`, { label: 'Categoría' });
  };
  CV.submits.catSave = (form) => {
    const fd = new FormData(form); const id = form.dataset.id; const nombre = String(fd.get('nombre') || '').trim();
    const err = form.querySelector('[data-err="nombre"]');
    if (!nombre) { err.textContent = 'Escribe el nombre de la categoría.'; return; }
    if (CV.db.categorias.some((c) => CV.norm(c.nombre) === CV.norm(nombre) && c.id !== id)) { err.textContent = 'Ya existe una categoría con ese nombre.'; return; }
    if (id) Object.assign(CV.cat(id), { nombre, color: fd.get('color'), icono: fd.get('icono') });
    else CV.db.categorias.push({ id: CV.norm(nombre).replace(/[^a-z0-9]+/g, '-') || CV.uid('c'), nombre, color: fd.get('color'), icono: fd.get('icono') });
    CV.save(); CV.toast(id ? 'Categoría actualizada' : 'Categoría creada'); refrescar();
  };
  CV.acts.catDel = (t) => {
    const c = CV.cat(t.dataset.id); const n = CV.db.eventos.filter((e) => e.categoria === c.id).length;
    if (n) { CV.toast(`"${c.nombre}" tiene ${n} ${n === 1 ? 'evento' : 'eventos'}. Muévelos a otra categoría antes de eliminarla.`, 'warn'); return; }
    CV.confirmar(`¿Eliminar la categoría "${c.nombre}"?`, 'catDelOk', c.id, 'Eliminar');
  };
  CV.acts.catDelOk = (t) => { CV.db.categorias = CV.db.categorias.filter((c) => c.id !== t.dataset.id); CV.save(); CV.toast('Categoría eliminada'); refrescar(); };

  /* ---------- lugares ---------- */
  CV.acts.lugForm = (t) => {
    const l = t.dataset.id ? CV.lugar(t.dataset.id) : { nombre: '', tipo: 'Centro cultural', ciudad: CV.db.ciudad, barrio: '', direccion: '', lat: CV.centroCiudad()[0], lng: CV.centroCiudad()[1], descripcion: '', horario: '', telefono: '', web: '', email: '' };
    const inp = (n, label, o = {}) => `<label class="ff ${o.cls || ''}"><span>${label}${o.req ? ' <i class="req">*</i>' : ''}</span><input name="${n}" value="${esc(l[n])}" ${o.type ? `type="${o.type}"` : ''} ${o.step ? `step="${o.step}"` : ''}><span class="err" data-err="${n}" role="alert"></span></label>`;
    CV.modal(`<form class="dlg-b form eform" data-submit="lugSave" data-id="${t.dataset.id || ''}" novalidate><h2 class="w2">${t.dataset.id ? 'Editar lugar' : 'Nuevo lugar'}</h2>
      ${inp('nombre', 'Nombre', { req: 1, cls: 'w2' })}
      <label class="ff"><span>Tipo</span><select name="tipo">${CV.tiposLugar.map((x) => `<option ${x === l.tipo ? 'selected' : ''}>${x}</option>`).join('')}</select></label>
      <label class="ff"><span>Ciudad</span><select name="ciudad">${Object.keys(CV.ciudades).map((x) => `<option ${x === l.ciudad ? 'selected' : ''}>${x}</option>`).join('')}</select></label>
      ${inp('direccion', 'Dirección')}${inp('barrio', 'Barrio')}
      ${inp('lat', 'Latitud', { type: 'number', step: 'any', req: 1 })}${inp('lng', 'Longitud', { type: 'number', step: 'any', req: 1 })}
      <label class="ff w2"><span>Descripción</span><textarea name="descripcion" rows="3">${esc(l.descripcion)}</textarea></label>
      ${inp('horario', 'Horario de atención', { cls: 'w2' })}${inp('telefono', 'Teléfono')}${inp('email', 'Correo')}${inp('web', 'Sitio web', { cls: 'w2' })}
      <div class="form-f w2"><button type="button" class="btn ghost" data-act="closeModal">Cancelar</button><button class="btn" type="submit">Guardar lugar</button></div></form>`, { wide: true, label: 'Lugar' });
  };
  CV.submits.lugSave = (form) => {
    const fd = new FormData(form); const id = form.dataset.id; const v = (k) => String(fd.get(k) || '').trim();
    const err = (k, m) => { form.querySelector(`[data-err="${k}"]`).textContent = m; };
    form.querySelectorAll('[data-err]').forEach((x) => (x.textContent = ''));
    let bad = false;
    if (!v('nombre')) { err('nombre', 'Escribe el nombre del lugar.'); bad = true; }
    const lat = parseFloat(v('lat')), lng = parseFloat(v('lng'));
    if (Number.isNaN(lat) || lat < -90 || lat > 90) { err('lat', 'Escribe una latitud válida.'); bad = true; }
    if (Number.isNaN(lng) || lng < -180 || lng > 180) { err('lng', 'Escribe una longitud válida.'); bad = true; }
    if (bad) return;
    const data = { nombre: v('nombre'), tipo: v('tipo'), ciudad: v('ciudad'), barrio: v('barrio'), direccion: v('direccion'), lat, lng, descripcion: v('descripcion'), horario: v('horario'), telefono: v('telefono'), web: v('web'), email: v('email') };
    if (id) { Object.assign(CV.lugar(id), data); CV.db.eventos.filter((e) => e.lugarId === id).forEach((e) => (e.ciudad = data.ciudad)); }
    else CV.db.lugares.push({ id: CV.uid('l'), ...data });
    CV.save(); CV.toast(id ? 'Lugar actualizado' : 'Lugar creado'); refrescar();
  };
  CV.acts.lugDel = (t) => {
    const l = CV.lugar(t.dataset.id); const n = CV.db.eventos.filter((e) => e.lugarId === l.id).length;
    if (n) { CV.toast(`"${l.nombre}" tiene ${n} ${n === 1 ? 'evento' : 'eventos'} asociados. Cámbialos de lugar antes de eliminarlo.`, 'warn'); return; }
    CV.confirmar(`¿Eliminar el lugar "${l.nombre}"?`, 'lugDelOk', l.id, 'Eliminar');
  };
  CV.acts.lugDelOk = (t) => { CV.db.lugares = CV.db.lugares.filter((l) => l.id !== t.dataset.id); CV.save(); CV.toast('Lugar eliminado'); refrescar(); };
})();
