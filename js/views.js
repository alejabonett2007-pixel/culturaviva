/* CulturaViva · vistas públicas y de usuario */
(function () {
  const CV = window.CV;
  const { esc, icon } = CV;
  CV.views = {};
  CV.after = []; // funciones que se ejecutan después de pintar la vista

  const defaultF = () => ({ q: '', cats: [], desde: '', hasta: '', orden: 'asc', page: 1 });
  CV.f = defaultF();
  CV.resetF = () => (CV.f = defaultF());
  const PAGE = 9;

  const ciudadOpts = (sel) => CV.zonaOpts(sel);

  const chips = (selected, ciudad) =>
    CV.db.categorias.map((c) => {
      const n = CV.buscar({ zona: ciudad, cats: [c.id] }).length;
      const on = selected.includes(c.id);
      return `<button type="button" class="chip cat ${on ? 'on' : ''}" style="--c:${c.color}" data-act="cat" data-id="${c.id}" aria-pressed="${on}">${icon(c.icono, 14)}${esc(c.nombre)}<em>${n}</em></button>`;
    }).join('');

  const otrasCiudades = () =>
    ['todas', ...Object.keys(CV.zonas)].filter((c) => c !== CV.db.zona && (c === 'todas' || CV.buscar({ zona: c }).length))
      .map((c) => `<button class="chip" data-act="setCity" data-c="${c}">${icon('pin', 13)}${c === 'todas' ? 'Bogotá' : c}${c === 'todas' ? '' : ` <em>${CV.buscar({ zona: c }).length}</em>`}</button>`).join('');

  /* ======================= INICIO ======================= */
  CV.crowd = () => {
    let s = ''; const w = 1200;
    for (let i = 0; i < 90; i++) {
      const x = (i * 13.5 + (CV.hash('h' + i) % 11)) % w;
      const r = 9 + (CV.hash('r' + i) % 8);
      const y = 150 - (CV.hash('y' + i) % 46);
      s += `<circle cx="${x}" cy="${y}" r="${r}"/><rect x="${x - r * 1.3}" y="${y + r * 0.8}" width="${r * 2.6}" height="90" rx="${r}"/>`;
    }
    return `<svg class="crowd" viewBox="0 0 ${w} 200" preserveAspectRatio="none" aria-hidden="true" fill="#050b1a">${s}</svg>`;
  };

  CV.views[''] = () => {
    const ciudad = CV.db.zona;
    const u = CV.user();
    const futuros = CV.buscar({ zona: ciudad });
    let dest = futuros.filter((e) => e.destacado);
    const sinDest = dest.length === 0;
    dest = (sinDest ? futuros : dest).slice(0, 4);
    const prox = futuros.filter((e) => new Date(e.inicio) >= new Date()).slice(0, 4);
    const nots = CV.misNotifs().slice(0, 3);
    const first = prox[0];
    const fl = first && CV.lugar(first.lugarId);

    CV.after.push(() => {
      const el = document.getElementById('map-home');
      const m = CV.dibujarMapa(el, CV.itemsMapaEventos(futuros.slice(0, 12)), {});
      document.querySelector('[data-act="locate"]')?.addEventListener('click', () => CV.ubicar(m));
    });

    return `
    <section class="hero">
      <div class="hero-bg" aria-hidden="true"><span class="beam b1"></span><span class="beam b2"></span><span class="beam b3"></span>${CV.crowd()}</div>
      <div class="wrap hero-in">
        <h1>Descubre la cultura<br><span>a tu alrededor</span></h1>
        <p>Conciertos, exposiciones, teatro, cine, talleres y mucho más.<br>Vive la cultura en tu ciudad.</p>
        <form class="hsearch" data-submit="heroSearch" role="search">
          <label class="sr" for="hq">Buscar eventos, artistas o lugares</label>
          <span class="hs-in">${icon('search', 18)}<input id="hq" name="q" type="search" placeholder="Buscar eventos, artistas, lugares..." autocomplete="off"></span>
          <label class="hs-city">${icon('pin', 15)}<span class="sr">Ubicación en Bogotá</span><select name="zona" data-change="city">${ciudadOpts(ciudad)}</select></label>
          <button class="btn" type="submit">Buscar</button>
        </form>
        <p class="hero-sig" aria-hidden="true">La cultura<br>nos une</p>
      </div>
    </section>

    <div class="wrap home">
      <div class="home-main">
        <section class="card cats" aria-label="Categorías">
          ${CV.db.categorias.map((c) => `<a class="cat-i" href="#/eventos?cat=${c.id}"><span style="--c:${c.color}">${icon(c.icono, 22)}</span>${esc(c.nombre)}</a>`).join('')}
          <a class="cat-i" href="#/categorias"><span class="all">${icon('grid', 22)}</span>Todos</a>
        </section>

        <section aria-labelledby="h-dest">
          <div class="sec-h"><h2 id="h-dest">${icon('star', 18)}${sinDest ? 'Próximos eventos' : 'Eventos destacados'}</h2><a class="more" href="#/eventos">Ver todos ${icon('arrow', 14)}</a></div>
          ${dest.length ? `<div class="grid4">${dest.map((e) => CV.eventCard(e)).join('')}</div>` : CV.vacio(`Aún no hay eventos en ${CV.zonaNombre()}`, 'Prueba con otra ubicación.', `<div class="chips">${otrasCiudades()}</div>`)}
        </section>

        <div class="two">
          <section class="card" aria-labelledby="h-prox">
            <div class="sec-h in"><h2 id="h-prox">${icon('calendar', 18)}Próximos eventos</h2><a class="more" href="#/eventos">Ver más ${icon('arrow', 14)}</a></div>
            <div class="rows">${prox.map(CV.eventRow).join('') || '<p class="menu-e">No hay eventos próximos.</p>'}</div>
          </section>
          <section class="card" aria-labelledby="h-map">
            <div class="sec-h in"><h2 id="h-map">${icon('pin', 18)}Eventos cerca de ti</h2><a class="more" href="#/mapa">Abrir mapa ${icon('arrow', 14)}</a></div>
            <div class="mapbox"><div id="map-home" class="map" aria-label="Mapa de eventos"></div>
              <button class="locate" data-act="locate" aria-label="Usar mi ubicación">${icon('nav', 16)}</button>
              ${first ? `<div class="mapcard">${CV.art(first, 'thumb')}<span><b>${esc(first.titulo)}</b><small>${icon('clock', 11)} ${esc(CV.fechaCorta(first))}</small><small>${icon('pin', 11)} ${esc(fl ? fl.nombre : '')}</small></span><a class="btn sm" href="#/mapa?evento=${first.id}">Ver en mapa</a></div>` : ''}</div>
          </section>
        </div>
      </div>

      <aside class="home-side" aria-label="Calendario y avisos">
        <section class="card">
          <div class="sec-h in"><h2>${icon('calendar', 18)}Calendario de eventos</h2></div>
          <div id="cal-home">${CV.calendarioHTML()}</div>
          <a class="more pad" href="#/calendario">Ver todos los eventos ${icon('arrow', 14)}</a>
        </section>
        <section class="card">
          <div class="sec-h in"><h2>${icon('bell', 18)}Notificaciones</h2>${u && CV.sinLeer() ? `<span class="count">${CV.sinLeer()}</span>` : ''}</div>
          ${u ? (nots.length ? `<div class="nlist">${nots.map((n) => `<a class="nitem" href="#/evento/${n.eventoId}" data-act="readN" data-id="${n.id}"><span class="ni ${n.tipo}">${icon({ recordatorio: 'bell', horario: 'clock', cupos: 'ticket', ubicacion: 'pin', cancelado: 'alert' }[n.tipo] || 'bell', 15)}</span><span><b>${esc(n.titulo)}</b><small>${esc(n.texto)}</small><small class="ago">${CV.fmtAgo(n.fecha)}</small></span>${icon('right', 14)}</a>`).join('')}</div><a class="more pad" href="#/notificaciones">Ver todas las notificaciones ${icon('arrow', 14)}</a>` : '<p class="menu-e pad">Aún no tienes notificaciones.</p>')
            : `<p class="menu-e pad">Inicia sesión para recibir recordatorios y avisos de cambios.</p><div class="pad"><button class="btn sm" data-act="login">Iniciar sesión</button></div>`}
        </section>
        <section class="promo">
          <div><h3>${icon('bell', 15)} Activa tus notificaciones</h3><p>No te pierdas ningún evento. Recibe recordatorios, cambios y novedades.</p><a class="btn sm" href="#/notificaciones">Configurar alarmas</a></div>
          <div class="phone" aria-hidden="true">${icon('bell', 26)}</div>
        </section>
      </aside>
    </div>`;
  };

  /* ======================= EVENTOS (listado + filtros) ======================= */
  CV.pintarChips = () => {
    const el = document.getElementById('chips');
    if (el) el.innerHTML = chips(CV.f.cats, CV.db.zona);
  };

  CV.pintarResultados = (append) => {
    const box = document.getElementById('resultados');
    if (!box) return;
    const f = CV.f;
    const list = CV.buscar({ q: f.q, cats: f.cats, desde: f.desde, hasta: f.hasta, zona: CV.db.zona, orden: f.orden });
    const shown = list.slice(0, f.page * PAGE);
    const catsSel = f.cats.map((id) => (CV.cat(id) || {}).nombre).filter(Boolean);
    const hayFiltros = f.q || f.cats.length || f.desde || f.hasta;
    let html;
    if (!list.length) {
      const ciudadVacia = CV.buscar({ zona: CV.db.zona }).length === 0;
      html = CV.vacio(
        ciudadVacia ? `Todavía no hay eventos en ${CV.zonaNombre()}` : 'No se encontraron eventos',
        ciudadVacia ? 'Prueba con alguna de estas ubicaciones:' : 'Cambia las palabras de la búsqueda, quita algún filtro o prueba con otra fecha.',
        `${!ciudadVacia && hayFiltros ? '<button class="btn sm" data-act="clear">Limpiar filtros</button>' : ''}<div class="chips">${otrasCiudades()}</div>`
      );
    } else {
      html = `<p class="count-l" aria-live="polite"><b>${list.length}</b> ${list.length === 1 ? 'evento' : 'eventos'} en ${esc(CV.zonaNombre())}${catsSel.length ? ' · ' + esc(catsSel.join(', ')) : ''}</p>
        <div class="grid3">${shown.map((e) => CV.eventCard(e, { extra: true })).join('')}</div>
        ${shown.length < list.length ? `<div class="center"><button class="btn ghost" data-act="more">Cargar más eventos (${list.length - shown.length})</button></div>` : ''}`;
    }
    box.innerHTML = html;
  };

  CV.views.eventos = (parts, q) => {
    if (q.q) CV.f.q = q.q;
    if (q.cat) CV.f.cats = q.cat.split(',').filter((id) => CV.cat(id));
    if (q.d) CV.f.desde = CV.f.hasta = q.d;
    const hoy = CV.todayKey();
    CV.after.push(() => CV.pintarResultados());
    const solo = CV.f.cats.length === 1 ? CV.cat(CV.f.cats[0]) : null;
    return `<div class="wrap page">
      <div class="page-h"><div><h1>${solo ? esc(solo.nombre) : 'Eventos culturales'}</h1><p class="lead">Busca por nombre, artista o lugar y filtra por categoría y fecha.</p></div></div>
      <form class="card filters" data-submit="noop" role="search">
        <label class="f-q">${icon('search', 18)}<span class="sr">Buscar</span><input id="f-q" type="search" value="${esc(CV.f.q)}" placeholder="Buscar eventos, artistas, lugares..." data-input="q" autocomplete="off"></label>
        <label class="f">Ubicación<select data-change="city">${ciudadOpts(CV.db.zona)}</select></label>
        <label class="f">Desde<input type="date" id="f-desde" min="${hoy}" value="${CV.f.desde}" data-change="desde"></label>
        <label class="f">Hasta<input type="date" id="f-hasta" min="${CV.f.desde || hoy}" value="${CV.f.hasta}" data-change="hasta"></label>
        <label class="f">Ordenar<select data-change="orden"><option value="asc" ${CV.f.orden === 'asc' ? 'selected' : ''}>Fecha: más cercana primero</option><option value="desc" ${CV.f.orden === 'desc' ? 'selected' : ''}>Fecha: más lejana primero</option></select></label>
        <button type="button" class="btn ghost sm" data-act="clear">Limpiar filtros</button>
        <div class="chips full" id="chips" role="group" aria-label="Categorías">${chips(CV.f.cats, CV.db.zona)}</div>
      </form>
      <div id="resultados"></div></div>`;
  };

  /* ======================= DETALLE DE EVENTO ======================= */
  CV.views.evento = (parts) => {
    const e = CV.evento(parts[1]);
    if (!e) return `<div class="wrap page">${CV.vacio('No encontramos este evento', 'Pudo haber sido eliminado.', '<a class="btn sm" href="#/eventos">Ver eventos</a>')}</div>`;
    const l = CV.lugar(e.lugarId);
    const st = CV.estadoTemporal(e);
    const org = CV.usuario(e.organizadorId);
    const cupos = CV.cupos(e);
    const u = CV.user();
    const pct = CV.limitado(e) ? Math.round((e.inscritos / e.capacidad) * 100) : 0;
    const inactivo = !CV.vigente(e);
    const fav = CV.isFav(e.id), rec = CV.isRec(e.id), res = CV.isRes(e.id);
    CV.after.push(() => {
      if (l) CV.dibujarMapa(document.getElementById('map-e'), CV.itemsMapaEventos([e]), { center: [l.lat, l.lng], zoom: 15 });
    });
    const rango = (CV.largo(e) || e.categoria === 'festivales') && e.fin
      ? `${CV.fmtDate(e.inicio, { day: 'numeric', month: 'long' })} al ${CV.fmtDate(e.fin, { day: 'numeric', month: 'long', year: 'numeric' })}` : CV.fmtLong(e.inicio);
    const horaTxt = e.fin && CV.keyOf(e.fin) === CV.keyOf(e.inicio) ? `${CV.fmtTime(e.inicio)} – ${CV.fmtTime(e.fin)}` : CV.fmtTime(e.inicio);
    const info = (ic, t, v) => `<li>${icon(ic, 18)}<span><small>${t}</small><b>${v}</b></span></li>`;

    return `<div class="dhero">${CV.art(e, 'big')}<div class="dhero-s"></div>
      <div class="wrap dhero-in"><a class="back" href="javascript:history.back()">${icon('left', 16)} Volver</a>
        <div class="dtags">${CV.tag(e)}<span class="state ${st.k}">${st.t}</span></div><h1>${esc(e.titulo)}</h1>
        <p class="dsub">${icon('calendar', 16)} ${rango} · ${icon('pin', 16)} ${esc(l ? l.nombre : '')}, ${esc(e.ciudad)}</p></div></div>
    <div class="wrap dgrid">
      <div class="dmain">
        ${e.estado === 'cancelado' ? `<div class="banner bad" role="status">${icon('alert', 18)}<span><b>Este evento fue cancelado.</b> Ya no es posible reservar ni recibir recordatorios.</span></div>` : ''}
        ${e.estado !== 'cancelado' && CV.isPast(e) ? `<div class="banner muted" role="status">${icon('info', 18)}<span><b>Este evento ya se realizó.</b> Mira otros eventos de la agenda.</span></div>` : ''}
        <section class="card pad-l"><h2>Acerca del evento</h2><p class="desc">${esc(e.descripcion)}</p>
          ${e.invitado ? `<p class="kv"><b>${CV.etiquetaInvitado(e)}:</b> ${esc(e.invitado)}</p>` : ''}
          ${e.categoria === 'talleres' ? `<p class="kv">${e.tema ? `<b>Tema:</b> ${esc(e.tema)}` : ''} ${e.duracion ? `· <b>Duración:</b> ${esc(e.duracion)}` : ''} ${e.publico ? `· <b>Dirigido a:</b> ${esc(e.publico)}` : ''}</p>` : ''}
        </section>
        ${e.funciones && e.funciones.length > 1 ? `<section class="card pad-l"><h2>${e.categoria === 'cine' ? 'Funciones' : 'Fechas y funciones'}</h2><ul class="funs">${e.funciones.slice().sort().map((f) => `<li class="${new Date(f) < new Date() ? 'past' : ''}">${icon('calendar', 15)}<span>${CV.fmtLong(f)}</span><b>${CV.fmtTime(f)}</b></li>`).join('')}</ul></section>` : ''}
        ${e.programacion && e.programacion.length ? `<section class="card pad-l"><h2>Programación</h2><ol class="prog">${e.programacion.map((p) => `<li><b>${CV.fmtDate(p.dia, { weekday: 'long', day: 'numeric', month: 'long' })}</b><span>${esc(p.actividad)}</span></li>`).join('')}</ol></section>` : ''}
        <section class="card pad-l"><h2>Dónde es</h2>
          ${l ? `<p class="kv"><b><a href="#/lugar/${l.id}">${esc(l.nombre)}</a></b><br>${l.direccion ? `${esc(l.direccion)}, ${esc(l.barrio)}, ${esc(l.ciudad)}` : 'La dirección de este lugar aún no está registrada.'}</p>
          <div id="map-e" class="map sm" aria-label="Ubicación del evento"></div>
          <div class="btns"><a class="btn ghost sm" href="#/mapa?evento=${e.id}">${icon('map', 15)}Ver en el mapa</a><a class="btn ghost sm" target="_blank" rel="noopener" href="https://www.google.com/maps/dir/?api=1&destination=${l.lat},${l.lng}">${icon('nav', 15)}Cómo llegar</a></div>` : '<p>Lugar no disponible.</p>'}
        </section>
      </div>
      <aside class="dside"><div class="card pad-l sticky">
        <ul class="info">
          ${info('calendar', 'Fecha', rango)}
          ${info('clock', 'Hora', horaTxt)}
          ${info('pin', 'Lugar', `${esc(l ? l.nombre : '')}${l && l.direccion ? '<br><small class="plain">' + esc(l.direccion) + ', ' + esc(l.barrio) + '</small>' : ''}`)}
          ${info('users', 'Organizador', esc(org ? org.nombre : 'CulturaViva'))}
          ${info('ticket', 'Entrada', e.precio > 0 ? CV.money(e.precio) : 'Gratuita')}
        </ul>
        <div class="cupos ${CV.limitado(e) && cupos === 0 ? 'bad' : ''}"><div class="cupos-t"><b>${CV.cuposTexto(e)}</b>${CV.limitado(e) ? `<small>${e.inscritos} de ${e.capacidad} reservados</small>` : ''}</div>
          ${CV.limitado(e) ? `<div class="bar" role="progressbar" aria-valuenow="${pct}" aria-valuemin="0" aria-valuemax="100" aria-label="Cupos ocupados"><i style="width:${pct}%"></i></div>` : ''}</div>
        <div class="stack">
          ${CV.limitado(e) ? `<button class="btn" data-act="reserve" data-id="${e.id}" ${(inactivo && !res) || (cupos === 0 && !res) ? 'disabled' : ''}>${res ? 'Cancelar mi reserva' : cupos === 0 ? 'Cupos agotados' : 'Reservar cupo'}</button>` : ''}
          <button class="btn ${CV.limitado(e) ? 'ghost' : ''} ${fav ? 'on' : ''}" data-act="fav" data-id="${e.id}" aria-pressed="${fav}">${icon('heart', 16)}${fav ? 'Guardado en favoritos' : 'Guardar en favoritos'}</button>
          <button class="btn ghost ${rec ? 'on' : ''}" data-act="rec" data-id="${e.id}" aria-pressed="${rec}" ${inactivo ? 'disabled' : ''}>${icon('bell', 16)}${rec ? 'Recordatorio activado' : 'Activar recordatorio'}</button>
        </div>
        ${!u ? '<p class="hint">Inicia sesión para guardar favoritos, reservar y recibir recordatorios.</p>' : ''}
      </div></aside></div>`;
  };

  /* ======================= CALENDARIO ======================= */
  CV.pintarDia = () => {
    const box = document.getElementById('cal-day');
    if (!box) return;
    const k = CV.cal.sel;
    if (!k) { box.innerHTML = CV.vacio('Elige un día', 'Toca una fecha del calendario para ver sus eventos.'); return; }
    const list = CV.buscar({ zona: CV.db.zona, cats: CV.cal.cats, desde: k, hasta: k });
    box.innerHTML = `<h2 class="cal-d">${CV.fmtLong(k + 'T00:00')}</h2>` + (list.length
      ? `<ul class="dayl">${list.map((e) => { const l = CV.lugar(e.lugarId); const h = (e.funciones || []).find((f) => CV.keyOf(f) === k) || e.inicio;
        return `<li><a href="#/evento/${e.id}"><b class="hr">${CV.fmtTime(h)}</b><span><b>${esc(e.titulo)}</b><small>${esc(l ? l.nombre : '')}</small></span>${CV.tag(e)}${icon('right', 15)}</a></li>`; }).join('')}</ul>`
      : CV.vacio('No hay eventos este día', `No encontramos eventos en ${CV.zonaNombre()} para esta fecha. Prueba con otro día o quita categorías.`));
  };

  CV.views.calendario = (parts, q) => {
    if (q.d) { CV.cal.sel = q.d; CV.cal.mes = new Date(q.d + 'T00:00'); CV.cal.mes.setDate(1); }
    else if (!CV.cal.sel) CV.cal.sel = CV.todayKey();
    CV.after.push(() => CV.pintarDia());
    return `<div class="wrap page">
      <div class="page-h"><div><h1>Calendario de eventos</h1><p class="lead">Los días con un punto tienen eventos en ${esc(CV.zonaNombre())}.</p></div></div>
      <div class="chips" role="group" aria-label="Categorías" id="cal-chips">${CV.db.categorias.map((c) => `<button type="button" class="chip cat ${CV.cal.cats.includes(c.id) ? 'on' : ''}" style="--c:${c.color}" data-act="calCat" data-id="${c.id}" aria-pressed="${CV.cal.cats.includes(c.id)}">${icon(c.icono, 14)}${esc(c.nombre)}</button>`).join('')}</div>
      <div class="calpage"><section class="card pad-l" id="cal-big">${CV.calendarioHTML({ big: true })}</section><section class="card pad-l" id="cal-day"></section></div></div>`;
  };

  /* ======================= LUGARES ======================= */
  CV.lf = { tipo: 'todos', zona: null, vista: 'lista' };
  CV.pintarLugares = () => {
    const box = document.getElementById('lugares-res');
    if (!box) return;
    CV.destroyMaps();
    const ciudad = CV.lf.zona || CV.db.zona;
    const list = CV.db.lugares.filter((l) => (ciudad === 'todas' || l.zona === ciudad) && (CV.lf.tipo === 'todos' || l.tipo === CV.lf.tipo));
    if (!list.length) { box.innerHTML = CV.vacio('No hay lugares con esos filtros', 'Prueba con otro tipo de lugar u otra ubicación.'); return; }
    if (CV.lf.vista === 'mapa') {
      box.innerHTML = '<div id="map-l" class="map tall" aria-label="Mapa de lugares culturales"></div>';
      CV.dibujarMapa(document.getElementById('map-l'), list.map((l) => ({ id: l.id, lat: l.lat, lng: l.lng, color: '#2f6bff', titulo: l.nombre, sub: `${l.tipo} · ${l.zona || l.ciudad}`, href: `#/lugar/${l.id}` })), { scroll: true });
      return;
    }
    box.innerHTML = `<p class="count-l"><b>${list.length}</b> ${list.length === 1 ? 'lugar' : 'lugares'}</p><div class="grid3">${list.map((l) => `<article class="ecard"><a class="ecard-img" href="#/lugar/${l.id}" tabindex="-1" aria-hidden="true">${CV.placeArt(l)}<span class="tag" style="--c:#2f6bff">${esc(l.tipo)}</span></a>
      <div class="ecard-b"><h3><a href="#/lugar/${l.id}">${esc(l.nombre)}</a></h3><p class="meta">${icon('pin', 13)}<span>${esc(l.ciudad)}${l.barrio ? ' · ' + esc(l.barrio) : ''}</span></p>
      <p class="meta sub">${(() => { const n = CV.buscar({ zona: 'todas' }).filter((e) => e.lugarId === l.id).length; return n === 0 ? 'Sin eventos próximos' : n === 1 ? '1 evento próximo' : n + ' eventos próximos'; })()}</p>
      <div class="ecard-f"><a class="btn-soft" href="#/lugar/${l.id}">Ver lugar</a></div></div></article>`).join('')}</div>`;
  };

  CV.views.lugares = () => {
    CV.lf = { tipo: 'todos', zona: CV.db.zona, vista: 'lista' };
    CV.after.push(() => CV.pintarLugares());
    return `<div class="wrap page">
      <div class="page-h"><div><h1>Lugares culturales</h1><p class="lead">Museos, teatros, centros culturales y más espacios para visitar.</p></div>
        <div class="seg" role="group" aria-label="Vista"><button class="on" data-act="vista" data-v="lista">${icon('list', 15)}Lista</button><button data-act="vista" data-v="mapa">${icon('map', 15)}Mapa</button></div></div>
      <div class="card filters">
        <label class="f">Tipo de lugar<select data-change="ltipo"><option value="todos">Todos los tipos</option>${CV.tiposLugar.map((t) => `<option>${t}</option>`).join('')}</select></label>
        <label class="f">Ubicación<select data-change="lciudad">${ciudadOpts(CV.db.zona)}</select></label></div>
      <div id="lugares-res"></div></div>`;
  };

  CV.views.lugar = (parts) => {
    const l = CV.lugar(parts[1]);
    if (!l) return `<div class="wrap page">${CV.vacio('No encontramos este lugar', '', '<a class="btn sm" href="#/lugares">Ver lugares</a>')}</div>`;
    const evs = CV.buscar({ zona: 'todas' }).filter((e) => e.lugarId === l.id);
    CV.after.push(() => CV.dibujarMapa(document.getElementById('map-p'), [{ id: l.id, lat: l.lat, lng: l.lng, color: '#2f6bff', titulo: l.nombre, sub: l.tipo, href: `#/lugar/${l.id}` }], { center: [l.lat, l.lng], zoom: 15 }));
    const dir = l.direccion ? `${esc(l.direccion)}, ${esc(l.barrio)}, ${esc(l.ciudad)}` : '';
    return `<div class="dhero small">${CV.placeArt(l, 'big')}<div class="dhero-s"></div><div class="wrap dhero-in"><a class="back" href="#/lugares">${icon('left', 16)} Lugares</a>
      <div class="dtags"><span class="tag" style="--c:#2f6bff">${esc(l.tipo)}</span></div><h1>${esc(l.nombre)}</h1><p class="dsub">${icon('pin', 16)} ${esc(l.ciudad)}${l.barrio ? ' · ' + esc(l.barrio) : ''}</p></div></div>
    <div class="wrap dgrid"><div class="dmain">
      <section class="card pad-l"><h2>Sobre este lugar</h2><p class="desc">${esc(l.descripcion)}</p></section>
      <section class="card pad-l"><h2>Próximos eventos</h2>${evs.length ? `<div class="rows">${evs.map(CV.eventRow).join('')}</div>` : '<p class="menu-e">No hay eventos programados en este lugar por ahora.</p>'}</section>
    </div><aside class="dside"><div class="card pad-l"><ul class="info">
      <li>${icon('pin', 18)}<span><small>Dirección</small><b>${dir || '<span class="warn">Este lugar aún no tiene dirección registrada.</span>'}</b></span></li>
      ${l.horario ? `<li>${icon('clock', 18)}<span><small>Horario de atención</small><b>${esc(l.horario)}</b></span></li>` : ''}
      ${l.telefono ? `<li>${icon('phone', 18)}<span><small>Teléfono</small><b>${esc(l.telefono)}</b></span></li>` : ''}
      ${l.web ? `<li>${icon('globe', 18)}<span><small>Sitio web</small><b><a href="${esc(l.web)}" target="_blank" rel="noopener">${esc(l.web.replace(/^https?:\/\//, ''))}</a></b></span></li>` : ''}
      ${l.email ? `<li>${icon('mail', 18)}<span><small>Correo</small><b>${esc(l.email)}</b></span></li>` : ''}</ul>
      <div id="map-p" class="map sm" aria-label="Mapa del lugar"></div>
      <div class="stack"><a class="btn" target="_blank" rel="noopener" href="https://www.google.com/maps/dir/?api=1&destination=${l.lat},${l.lng}">${icon('nav', 16)}Cómo llegar</a></div></div></aside></div>`;
  };

  /* ======================= MAPA ======================= */
  CV.mf = { cats: [], desde: '', hasta: '' };
  CV.pintarMapa = (focusId) => {
    CV.destroyMaps();
    const list = CV.buscar({ zona: CV.db.zona, cats: CV.mf.cats, desde: CV.mf.desde, hasta: CV.mf.hasta });
    const side = document.getElementById('map-list');
    if (side) side.innerHTML = list.length ? list.map((e) => CV.eventRow(e)).join('') : CV.vacio('Sin eventos en el mapa', 'Cambia la ubicación, las categorías o la fecha.');
    const fe = focusId && CV.evento(focusId); const fl = fe && CV.lugar(fe.lugarId);
    const m = CV.dibujarMapa(document.getElementById('map-main'), CV.itemsMapaEventos(list), fl ? { center: [fl.lat, fl.lng], zoom: 16, scroll: true } : { scroll: true });
    CV.mapaActual = m;
  };
  CV.views.mapa = (parts, q) => {
    CV.mf = { cats: q.cat ? q.cat.split(',') : [], desde: '', hasta: '' };
    CV.after.push(() => {
      CV.pintarMapa(q.evento);
      if (!q.evento && navigator.permissions) navigator.permissions.query({ name: 'geolocation' }).then((p) => { if (p.state === 'granted') CV.ubicar(CV.mapaActual); }).catch(() => {});
    });
    return `<div class="wrap page"><div class="page-h"><div><h1>Eventos en el mapa</h1><p class="lead">Mostramos ${esc(CV.zonaNombre())}. Si lo permites, centramos el mapa en tu ubicación.</p></div><button class="btn ghost" data-act="locate2">${icon('nav', 16)}Usar mi ubicación</button></div>
      <div class="card filters"><label class="f">Ubicación<select data-change="city">${ciudadOpts(CV.db.zona)}</select></label>
        <label class="f">Desde<input type="date" min="${CV.todayKey()}" data-change="mdesde"></label><label class="f">Hasta<input type="date" min="${CV.todayKey()}" data-change="mhasta"></label>
        <div class="chips full" id="mchips" role="group" aria-label="Categorías">${CV.db.categorias.map((c) => `<button type="button" class="chip cat ${CV.mf.cats.includes(c.id) ? 'on' : ''}" style="--c:${c.color}" data-act="mapCat" data-id="${c.id}" aria-pressed="${CV.mf.cats.includes(c.id)}">${icon(c.icono, 14)}${esc(c.nombre)}</button>`).join('')}</div></div>
      <div class="mapgrid"><div id="map-main" class="map tall" aria-label="Mapa de eventos"></div><div class="card rows scroll" id="map-list"></div></div></div>`;
  };

  /* ======================= CATEGORÍAS (HU-17) ======================= */
  CV.views.categorias = () => `<div class="wrap page"><div class="page-h"><div><h1>Categorías culturales</h1><p class="lead">Eventos vigentes en ${esc(CV.zonaNombre())}.</p></div></div>
    <div class="grid3 catgrid">${CV.db.categorias.map((c) => { const n = CV.buscar({ zona: CV.db.zona, cats: [c.id] }).length;
      return `<a class="card catcard" href="#/eventos?cat=${c.id}" style="--c:${c.color}"><span class="cc-i">${icon(c.icono, 26)}</span><span><b>${esc(c.nombre)}</b><small>${n === 0 ? 'Sin eventos por ahora' : n + (n === 1 ? ' evento' : ' eventos')}</small></span>${icon('right', 18)}</a>`; }).join('')}</div></div>`;

  /* ======================= FAVORITOS ======================= */
  CV.views.favoritos = () => {
    const u = CV.user();
    if (!u) return `<div class="wrap page">${CV.vacio('Inicia sesión para ver tus favoritos', 'Guarda los eventos que te interesan y vuelve a ellos cuando quieras.', '<button class="btn" data-act="login">Iniciar sesión</button>')}</div>`;
    const list = CV.misFavoritos().sort((a, b) => (a.inicio < b.inicio ? -1 : 1));
    return `<div class="wrap page"><div class="page-h"><div><h1>Mis favoritos</h1><p class="lead">Los eventos que guardaste.</p></div></div>
      ${list.length ? `<div class="grid3">${list.map((e) => CV.eventCard(e, { extra: true })).join('')}</div>` : CV.vacio('Aún no tienes favoritos', 'Toca el corazón de un evento para guardarlo aquí.', '<a class="btn" href="#/eventos">Explorar eventos</a>')}</div>`;
  };

  /* ======================= NOTIFICACIONES ======================= */
  CV.views.notificaciones = () => {
    const u = CV.user();
    if (!u) return `<div class="wrap page">${CV.vacio('Inicia sesión para ver tus notificaciones', 'Recibe recordatorios y avisos si un evento cambia de horario o de lugar.', '<button class="btn" data-act="login">Iniciar sesión</button>')}</div>`;
    const list = CV.misNotifs();
    const ic = { recordatorio: 'bell', horario: 'clock', cupos: 'ticket', ubicacion: 'pin', cancelado: 'alert' };
    return `<div class="wrap page narrow"><div class="page-h"><div><h1>Notificaciones</h1><p class="lead">Recordatorios y cambios de los eventos que sigues.</p></div>${list.some((n) => !n.leida) ? '<button class="btn ghost sm" data-act="readAll">Marcar todas como leídas</button>' : ''}</div>
      <section class="card pad-l"><h2>Cómo quieres recibirlas</h2>
        <label class="sw"><input type="checkbox" data-change="pref" data-p="plataforma" ${u.prefs.plataforma !== false ? 'checked' : ''}><span>En la plataforma</span><small>Recordatorios 24 horas y 1 hora antes de los eventos con alarma.</small></label>
        <label class="sw"><input type="checkbox" data-change="pref" data-p="correo" ${u.prefs.correo !== false ? 'checked' : ''}><span>Por correo</span><small>Se envía a ${esc(u.correo)} cuando conectemos el servicio de correo.</small></label>
        <p class="hint">Activa la campana en un evento para recibir sus recordatorios. Los cambios de horario, de lugar y las cancelaciones llegan a quienes lo guardaron en favoritos o activaron la alarma.</p></section>
      <section class="card">${list.length ? list.map((n) => `<a class="nrow ${n.leida ? '' : 'new'}" href="#/evento/${n.eventoId}" data-act="readN" data-id="${n.id}"><span class="ni ${n.tipo}">${icon(ic[n.tipo] || 'bell', 16)}</span><span><b>${esc(n.titulo)}</b><small>${esc(n.texto)}</small></span><small class="ago">${CV.fmtAgo(n.fecha)}</small></a>`).join('') : CV.vacio('Sin notificaciones', 'Cuando algo cambie en tus eventos, lo verás aquí.')}</section></div>`;
  };

  /* ======================= NOSOTROS ======================= */
  CV.views.nosotros = () => `<div class="wrap page narrow"><div class="page-h"><div><h1>Nosotros</h1><p class="lead">CulturaViva reúne la agenda cultural de la ciudad en un solo lugar.</p></div></div>
    <section class="card pad-l"><h2>Qué hacemos</h2><p class="desc">Ayudamos a que el público encuentre conciertos, exposiciones, obras de teatro, cine, talleres y festivales cerca de donde vive, y a que organizadores y espacios culturales den a conocer su programación.</p>
      <p class="desc">Puedes buscar sin crear una cuenta. Con una cuenta guardas favoritos, activas recordatorios y recibes avisos si un evento cambia.</p></section>
    <section class="card pad-l"><h2>Contacto</h2><ul class="info"><li>${icon('mail', 18)}<span><small>Correo</small><b>culturaviva@gmail.com</b></span></li><li>${icon('phone', 18)}<span><small>Teléfono</small><b>+57 300 3815035</b></span></li></ul></section>
    ${CV.api && CV.api.online ? '' : `<section class="card pad-l"><h2>Versión de demostración</h2><p class="desc">Esta versión guarda los datos en tu navegador y usa información de ejemplo. Puedes volver al estado inicial cuando quieras.</p><button class="btn ghost sm" data-act="resetDemo">Restablecer datos de ejemplo</button></section>`}</div>`;
})();
