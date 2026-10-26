/* CulturaViva · componentes de interfaz reutilizables */
(function () {
  const CV = window.CV;
  const { esc, icon } = CV;

  /* ---------- imágenes: foto real si existe, ilustración por categoría si no ---------- */
  // Ilustración: en formato ancho (cabecera) se muestra completa sobre un fondo difuminado de sí misma.
  CV.escenaImg = (src, cls) => /\bbig\b/.test(cls)
    ? `<div class="art ${cls}"><img class="bg" src="${src}" alt=""><img class="fg" src="${src}" alt=""></div>`
    : `<div class="art ${cls}"><img src="${src}" alt="" loading="lazy"></div>`;

  CV.art = (e, cls = '') => {
    if (e.imagen) return `<div class="art ${cls}"><img src="${esc(e.imagen)}" alt="" loading="lazy"></div>`;
    const escena = CV.escena(e.categoria, e.id, e);
    if (escena) return CV.escenaImg(escena, cls);
    const c = CV.cat(e.categoria) || { color: '#2f6bff', icono: 'grid' };
    const h = CV.hash(e.id);
    const x = 15 + (h % 70), y = 10 + ((h >> 3) % 40);
    return `<div class="art ${cls}" style="--c:${c.color};--x:${x}%;--y:${y}%" role="img" aria-label="${esc(c.nombre)}">
      <span class="art-ic">${icon(c.icono, 64)}</span></div>`;
  };
  CV.placeArt = (l, cls = '') => {
    const escena = CV.escenaLugar(l);
    if (escena) return CV.escenaImg(escena, cls);
    const tipoIc = { Museo: 'landmark', Teatro: 'smile', 'Centro cultural': 'users', 'Galería': 'image', Biblioteca: 'book', 'Parque y plaza': 'sun' }[l.tipo] || 'pin';
    const h = CV.hash(l.id);
    return `<div class="art ${cls}" style="--c:#2f6bff;--x:${20 + (h % 60)}%;--y:${10 + ((h >> 2) % 40)}%" role="img" aria-label="${esc(l.tipo)}"><span class="art-ic">${icon(tipoIc, 64)}</span></div>`;
  };

  CV.tag = (e) => {
    const c = CV.cat(e.categoria);
    return c ? `<span class="tag" style="--c:${c.color}">${esc(c.nombre)}</span>` : '';
  };

  CV.etiquetaInvitado = (e) =>
    ({ musica: 'Artista', teatro: 'Compañía', danza: 'Compañía', literatura: 'Invitado', cine: 'Programa', festivales: 'Invitados', talleres: 'Tema' }[e.categoria] || 'Con');

  CV.extraLinea = (e) => {
    const out = [];
    if (e.categoria === 'talleres') {
      if (e.tema) out.push(`Tema: ${e.tema}`);
      if (e.duracion) out.push(`Duración: ${e.duracion}`);
      if (e.publico) out.push(`Para: ${e.publico}`);
    } else if (e.invitado) out.push(`${CV.etiquetaInvitado(e)}: ${e.invitado}`);
    if (e.funciones && e.funciones.length > 1) out.push(`${e.funciones.length} funciones`);
    return out;
  };

  /* ---------- tarjetas ---------- */
  CV.favBtn = (id) => {
    const on = CV.isFav(id);
    return `<button class="fav ${on ? 'on' : ''}" data-act="fav" data-id="${id}" aria-pressed="${on}" aria-label="${on ? 'Quitar de favoritos' : 'Guardar en favoritos'}">${icon('heart', 16)}</button>`;
  };

  CV.fechaCorta = (e) => {
    if (CV.largo(e) || e.categoria === 'festivales') {
      return `${CV.fmtShort(e.inicio)} al ${CV.fmtDate(e.fin || e.inicio)}`;
    }
    return `${CV.fmtDate(e.inicio)} · ${CV.fmtTime(e.inicio)}`;
  };

  CV.eventCard = (e, o = {}) => {
    const l = CV.lugar(e.lugarId);
    const st = CV.estadoTemporal(e);
    const extra = o.extra ? CV.extraLinea(e) : [];
    const badge = ['arte', 'festivales', 'museos'].includes(e.categoria) || e.estado === 'cancelado'
      ? `<span class="state ${st.k}">${st.t}</span>` : '';
    return `<article class="ecard">
      <a class="ecard-img" href="#/evento/${e.id}" tabindex="-1" aria-hidden="true">${CV.art(e)}${CV.tag(e)}${badge}</a>
      <div class="ecard-b">
        <h3><a href="#/evento/${e.id}">${esc(e.titulo)}</a></h3>
        <p class="meta">${icon('calendar', 13)}<span>${CV.fechaCorta(e)}</span></p>
        <p class="meta">${icon('pin', 13)}<span>${esc(l ? l.nombre : '')}, ${esc(e.ciudad)}</span></p>
        ${extra.map((x) => `<p class="meta sub">${esc(x)}</p>`).join('')}
        ${o.extra ? `<p class="meta cupos ${CV.limitado(e) && CV.cupos(e) === 0 ? 'bad' : ''}">${icon('ticket', 13)}<span>${CV.cuposTexto(e)}${e.precio > 0 ? ' · ' + CV.money(e.precio) : ''}</span></p>` : ''}
        <div class="ecard-f"><a class="btn-soft" href="#/evento/${e.id}">Ver detalles</a>${CV.favBtn(e.id)}</div>
      </div></article>`;
  };

  CV.eventRow = (e) => {
    const l = CV.lugar(e.lugarId);
    const hora = e.fin && !CV.largo(e) && CV.keyOf(e.fin) === CV.keyOf(e.inicio)
      ? `${CV.fmtTime(e.inicio)} – ${CV.fmtTime(e.fin)}` : CV.fmtTime(e.inicio);
    return `<a class="erow" href="#/evento/${e.id}">
      <span class="erow-d"><small>${CV.dow(e.inicio)}</small><b>${new Date(e.inicio).getDate()}</b><small>${CV.mon(e.inicio)}</small></span>
      ${CV.art(e, 'thumb')}
      <span class="erow-t"><b>${esc(e.titulo)}</b>
        <span class="meta">${icon('clock', 12)}<span>${hora}</span></span>
        <span class="meta">${icon('pin', 12)}<span>${esc(l ? l.nombre : '')}</span></span></span>
      ${CV.tag(e)}${icon('right', 16)}</a>`;
  };

  CV.vacio = (titulo, texto, extra = '') =>
    `<div class="empty">${icon('search', 32)}<h3>${esc(titulo)}</h3><p>${esc(texto)}</p>${extra}</div>`;

  /* ---------- calendario (HU-06) ---------- */
  CV.cal = CV.cal || { mes: new Date(new Date().getFullYear(), new Date().getMonth(), 1), sel: null, cats: [] };
  CV.calendarioHTML = (opts = {}) => {
    const { mes } = CV.cal;
    const eventos = CV.buscar({ ciudad: CV.db.ciudad, cats: CV.cal.cats });
    const first = new Date(mes.getFullYear(), mes.getMonth(), 1);
    const start = new Date(first); start.setDate(1 - ((first.getDay() + 6) % 7));
    const hoy = CV.todayKey();
    let cells = '';
    for (let i = 0; i < 42; i++) {
      const d = new Date(start); d.setDate(start.getDate() + i);
      const k = CV.key(d);
      if (i >= 35 && d.getMonth() !== mes.getMonth()) break;
      const n = eventos.filter((e) => CV.ocurreEn(e, k)).length;
      const cls = [d.getMonth() !== mes.getMonth() ? 'out' : '', k === hoy ? 'today' : '', k === CV.cal.sel ? 'sel' : '', n ? 'has' : ''].join(' ');
      cells += `<button type="button" class="cd ${cls}" data-act="calDay" data-k="${k}" aria-label="${CV.fmtLong(k + 'T00:00')}${n ? `, ${n} ${n === 1 ? 'evento' : 'eventos'}` : ''}" aria-pressed="${k === CV.cal.sel}">${d.getDate()}</button>`;
    }
    const titulo = mes.toLocaleDateString('es-CO', { month: 'long', year: 'numeric' }).replace(' de ', ' ');
    return `<div class="cal ${opts.big ? 'big' : ''}">
      <div class="cal-h"><button class="ib" data-act="calPrev" aria-label="Mes anterior">${icon('left', 16)}</button>
        <strong>${titulo.charAt(0).toUpperCase() + titulo.slice(1)}</strong>
        <button class="ib" data-act="calNext" aria-label="Mes siguiente">${icon('right', 16)}</button></div>
      <div class="cal-g"><span>L</span><span>M</span><span>M</span><span>J</span><span>V</span><span>S</span><span>D</span>${cells}</div></div>`;
  };

  /* ---------- mapa (HU-13, HU-14) ---------- */
  CV.maps = [];
  CV.destroyMaps = () => { CV.maps.forEach((m) => { try { m.remove(); } catch (e) { /* ya no existe */ } }); CV.maps = []; };
  CV.centroCiudad = () => CV.ciudades[CV.db.ciudad] || CV.ciudades['Bogotá'];

  CV.pinIcon = (color) =>
    window.L.divIcon({ className: 'pin', html: `<span style="background:${color}"></span>`, iconSize: [26, 26], iconAnchor: [13, 26], popupAnchor: [0, -24] });

  CV.dibujarMapa = (el, items, o = {}) => {
    if (!el) return null;
    if (!window.L) {
      el.classList.add('nomap');
      el.innerHTML = `<div class="map-fallback">${icon('map', 28)}<p><b>No se pudo cargar el mapa.</b> Revisa tu conexión a internet.</p>
        <ul>${items.slice(0, 6).map((i) => `<li><a href="${i.href}">${esc(i.titulo)}</a> · ${esc(i.sub)}</li>`).join('')}</ul></div>`;
      return null;
    }
    const map = window.L.map(el, { scrollWheelZoom: !!o.scroll, zoomControl: true });
    window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19, attribution: '© OpenStreetMap' }).addTo(map);
    const pts = [];
    items.forEach((i) => {
      const jitter = (CV.hash(i.id) % 9 - 4) * 0.00012;
      const ll = [i.lat + jitter, i.lng - jitter];
      pts.push(ll);
      window.L.marker(ll, { icon: CV.pinIcon(i.color), title: i.titulo })
        .addTo(map)
        .bindPopup(`<b>${esc(i.titulo)}</b><br>${esc(i.sub)}<br><a href="${i.href}">Ver detalle</a>`);
    });
    if (o.center) map.setView(o.center, o.zoom || 14);
    else if (pts.length > 1) map.fitBounds(pts, { padding: [30, 30], maxZoom: 15 });
    else if (pts.length === 1) map.setView(pts[0], 15);
    else map.setView(CV.centroCiudad(), 12);
    CV.maps.push(map);
    setTimeout(() => map.invalidateSize(), 120);
    return map;
  };

  CV.itemsMapaEventos = (evs) =>
    evs.map((e) => { const l = CV.lugar(e.lugarId); const c = CV.cat(e.categoria);
      return l ? { id: e.id, lat: l.lat, lng: l.lng, color: c ? c.color : '#2f6bff', titulo: e.titulo,
        sub: `${CV.fmtShort(e.inicio)}, ${CV.fmtTime(e.inicio)}`, href: `#/evento/${e.id}` } : null; }).filter(Boolean);

  CV.ubicar = (map, onDone) => {
    if (!navigator.geolocation) { CV.toast('Tu navegador no permite obtener la ubicación. Mostramos la ciudad elegida.', 'warn'); return; }
    navigator.geolocation.getCurrentPosition(
      (p) => {
        if (map) {
          map.setView([p.coords.latitude, p.coords.longitude], 14);
          window.L.circleMarker([p.coords.latitude, p.coords.longitude], { radius: 8, color: '#fff', weight: 3, fillColor: '#2f6bff', fillOpacity: 1 }).addTo(map).bindPopup('Estás aquí');
        }
        if (onDone) onDone(p);
      },
      () => CV.toast(`No pudimos obtener tu ubicación. Mostramos los eventos de ${CV.db.ciudad}.`, 'warn'),
      { timeout: 8000 }
    );
  };

  /* ---------- modal y avisos ---------- */
  CV.modal = (html, o = {}) => {
    const m = document.getElementById('modal');
    m.innerHTML = `<div class="overlay" data-act="overlay"><div class="dlg ${o.wide ? 'wide' : ''}" role="dialog" aria-modal="true" aria-label="${esc(o.label || 'Ventana')}">
      <button class="dlg-x" data-act="closeModal" aria-label="Cerrar">${icon('x', 18)}</button>${html}</div></div>`;
    document.body.classList.add('noscroll');
    const f = m.querySelector('input,select,textarea,button.btn');
    if (f) setTimeout(() => f.focus(), 30);
  };
  CV.closeModal = () => { document.getElementById('modal').innerHTML = ''; document.body.classList.remove('noscroll'); };

  CV.toast = (msg, kind = 'ok') => {
    const box = document.getElementById('toasts');
    const t = document.createElement('div');
    t.className = `toast ${kind}`;
    t.setAttribute('role', 'status');
    t.innerHTML = `${icon(kind === 'ok' ? 'check' : 'alert', 16)}<span>${esc(msg)}</span>`;
    box.appendChild(t);
    setTimeout(() => t.classList.add('out'), 3600);
    setTimeout(() => t.remove(), 4000);
  };

  CV.loginModal = (msg = '', tab = 'login') => {
    CV.modal(`<div class="dlg-b">
      <div class="brand dark">${CV.logo()}<span><b>CulturaViva</b></span></div>
      ${msg ? `<p class="note">${esc(msg)}</p>` : ''}
      <div class="tabs" role="tablist"><button class="${tab === 'login' ? 'on' : ''}" data-act="authTab" data-t="login" role="tab">Iniciar sesión</button><button class="${tab === 'reg' ? 'on' : ''}" data-act="authTab" data-t="reg" role="tab">Crear cuenta</button></div>
      ${tab === 'login' ? `<form data-submit="login" class="form" novalidate>
        <label>Correo<input name="correo" type="email" autocomplete="email" required placeholder="tucorreo@ejemplo.com"></label>
        <label>Contraseña<input name="clave" type="password" autocomplete="current-password" required></label>
        <p class="err" id="auth-err" role="alert"></p>
        <button class="btn" type="submit">Iniciar sesión</button>
        <div class="demo"><small>Cuentas de prueba (clave 1234)</small>
          <div><button type="button" class="chip" data-act="demo" data-c="usuario@culturaviva.co">Usuario</button>
          <button type="button" class="chip" data-act="demo" data-c="organizador@culturaviva.co">Organizador</button>
          <button type="button" class="chip" data-act="demo" data-c="admin@culturaviva.co">Administrador</button></div></div>
      </form>` : `<form data-submit="register" class="form" novalidate>
        <label>Nombre<input name="nombre" autocomplete="name" required></label>
        <label>Correo<input name="correo" type="email" autocomplete="email" required></label>
        <label>Contraseña<input name="clave" type="password" minlength="4" autocomplete="new-password" required></label>
        <label>Quiero<select name="rol"><option value="usuario">Descubrir eventos</option><option value="organizador">Publicar eventos</option></select></label>
        <p class="err" id="auth-err" role="alert"></p>
        <button class="btn" type="submit">Crear cuenta</button></form>`}</div>`, { label: 'Acceso' });
  };

  /* ---------- logo, cabecera y pie ---------- */
  CV.logo = () => '<img class="logo" src="img/logo.png" alt="" width="54" height="40">';

  CV.renderHeader = () => {
    const u = CV.user();
    const seg = (CV.route && CV.route.parts[0]) || '';
    const nav = (href, key, label, ic) =>
      `<a href="${href}" class="${seg === key || (key === '' && seg === '') ? 'on' : ''}" ${seg === key ? 'aria-current="page"' : ''}>${icon(ic, 16)}<span>${label}</span></a>`;
    const ciudades = Object.keys(CV.ciudades).map((c) => `<option ${c === CV.db.ciudad ? 'selected' : ''}>${c}</option>`).join('');
    const nots = CV.misNotifs();
    const sin = CV.sinLeer();
    let right;
    if (u) {
      const rolTxt = { usuario: 'Usuario', organizador: 'Organizador', administrador: 'Administrador' }[u.rol];
      right = `
      <div class="dd"><button class="ib bell" data-act="menu" data-m="m-not" aria-label="Notificaciones${sin ? `, ${sin} sin leer` : ''}" aria-haspopup="true">${icon('bell', 18)}${sin ? `<i>${sin}</i>` : ''}</button>
        <div class="menu notif-menu" id="m-not" hidden><div class="menu-h"><b>Notificaciones</b><a href="#/notificaciones">Ver todas</a></div>
          ${nots.slice(0, 5).map((n) => `<a class="mi ${n.leida ? '' : 'new'}" href="#/evento/${n.eventoId}" data-act="readN" data-id="${n.id}"><b>${esc(n.titulo)}</b><span>${esc(n.texto)}</span><small>${CV.fmtAgo(n.fecha)}</small></a>`).join('') || '<p class="menu-e">Aún no tienes notificaciones.</p>'}</div></div>
      <div class="dd"><button class="user" data-act="menu" data-m="m-user" aria-haspopup="true"><span class="av">${esc(u.nombre.trim().charAt(0).toUpperCase())}</span><span class="un">${esc(u.nombre.split(' ').slice(0, 2).join(' '))}</span>${icon('down', 14)}</button>
        <div class="menu" id="m-user" hidden><p class="menu-r">${rolTxt}</p>
          <a class="mi" href="#/favoritos">${icon('heart', 15)}Mis favoritos</a>
          <a class="mi" href="#/notificaciones">${icon('bell', 15)}Notificaciones</a>
          ${u.rol === 'organizador' ? `<a class="mi" href="#/organizador">${icon('dash', 15)}Panel del organizador</a>` : ''}
          ${u.rol === 'administrador' ? `<a class="mi" href="#/admin">${icon('dash', 15)}Administración</a>` : ''}
          <button class="mi" data-act="logout">${icon('logout', 15)}Cerrar sesión</button></div></div>`;
    } else {
      right = `<button class="btn sm" data-act="login">Iniciar sesión</button>`;
    }
    document.getElementById('hdr').innerHTML = `<div class="wrap hdr-in">
      <a class="brand" href="#/" aria-label="CulturaViva, inicio">${CV.logo()}<span><b>CulturaViva</b><small>Arte · Cultura · Comunidad</small></span></a>
      <nav class="nav" aria-label="Principal">${nav('#/', '', 'Inicio', 'home')}${nav('#/eventos', 'eventos', 'Eventos', 'calendar')}${nav('#/lugares', 'lugares', 'Lugares', 'pin')}${nav('#/nosotros', 'nosotros', 'Nosotros', 'info')}</nav>
      <div class="hdr-r">
        <label class="city">${icon('pin', 15)}<span class="sr">Ciudad</span><select data-change="city" aria-label="Ciudad">${ciudades}</select></label>
        <a class="ib" href="#/eventos" data-act="focusSearch" aria-label="Buscar eventos">${icon('search', 18)}</a>
        ${right}</div></div>`;
  };

  CV.renderFooter = () => {
    document.getElementById('ftr').innerHTML = `<div class="wrap ftr-in">
      <a class="brand" href="#/">${CV.logo()}<span><b>CulturaViva</b><small>Arte · Cultura · Comunidad</small></span></a>
      <nav aria-label="Pie de página"><a href="#/">Inicio</a><a href="#/eventos">Eventos</a><a href="#/lugares">Lugares</a><a href="#/nosotros">Nosotros</a><a href="#/nosotros">Contacto</a></nav>
      <div class="soc"><a href="#/nosotros" aria-label="Instagram">${icon('ig', 18)}</a><a href="#/nosotros" aria-label="Facebook">${icon('fb', 18)}</a><a href="#/nosotros" aria-label="X">${icon('xx', 18)}</a><a href="#/nosotros" aria-label="YouTube">${icon('yt', 18)}</a></div>
      <small>© ${new Date().getFullYear()} CulturaViva. Todos los derechos reservados.</small></div>`;
  };
})();
