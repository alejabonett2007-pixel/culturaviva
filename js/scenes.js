/* CulturaViva · ilustraciones de eventos.
   Cada categoría tiene su escena (SVG generado) y cada evento la varía con colores y composición propios.
   Si un evento tiene `imagen` (foto real o subida por el organizador), esa foto tiene prioridad. */
(function () {
  const CV = window.CV;
  const f = (n) => Math.round(n * 10) / 10;
  const rng = (seed) => { let a = seed >>> 0; return () => { a |= 0; a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; };
  const pick = (r, a) => a[Math.floor(r() * a.length)];
  const poly = (pts, fill, ex = '') => `<polygon points="${pts.map((p) => p.map(f).join(',')).join(' ')}" fill="${fill}" ${ex}/>`;
  const lg = (id, c1, o1, c2, o2, v = true) => `<linearGradient id="${id}" x1="0" y1="0" x2="${v ? 0 : 1}" y2="${v ? 1 : 0}"><stop offset="0" stop-color="${c1}" stop-opacity="${o1}"/><stop offset="1" stop-color="${c2}" stop-opacity="${o2}"/></linearGradient>`;
  const rg = (id, c, o) => `<radialGradient id="${id}" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="${c}" stop-opacity="${o}"/><stop offset="1" stop-color="${c}" stop-opacity="0"/></radialGradient>`;
  const stars = (r, n, maxY, op = 0.6) => Array.from({ length: n }, () => `<circle cx="${f(r() * 320)}" cy="${f(r() * maxY)}" r="${f(0.6 + r() * 1.3)}" fill="#fff" opacity="${f(0.2 + r() * op)}"/>`).join('');

  const PAL = {
    musica: [{ a: '#241270', b: '#0a0720', c: '#8b5cf6', d: '#ff4fa3' }, { a: '#0e2f73', b: '#060c24', c: '#38bdf8', d: '#a78bfa' }, { a: '#5a0f22', b: '#140609', c: '#ff5a3c', d: '#ffb84d' }],
    teatro: [{ a: '#3a0a14', b: '#12050a', c: '#d6283c', d: '#ffd9a0' }, { a: '#2a0f3a', b: '#0d0614', c: '#b91c4a', d: '#ffe3b3' }],
    arte: [{ a: '#ffd98a', b: '#d9822b', c: '#7c3aed', d: '#0ea5a4' }, { a: '#f9d9a8', b: '#c4673a', c: '#2563eb', d: '#ef4444' }],
    literatura: [{ a: '#23895a', b: '#0d3b2a', c: '#f5c36a', d: '#e8e0c8' }, { a: '#3d6b43', b: '#14281a', c: '#e9a23b', d: '#f2ead3' }],
    cine: [{ a: '#0e2a66', b: '#050a1e', c: '#60a5fa', d: '#fde68a' }, { a: '#1b1b5c', b: '#07071c', c: '#818cf8', d: '#fcd34d' }],
    museos: [{ a: '#5fd8df', b: '#0e7c86', c: '#fef3c7', d: '#f59e0b' }, { a: '#86dccf', b: '#1d6a74', c: '#fff7e0', d: '#fb923c' }],
    danza: [{ a: '#e0348f', b: '#4a0a46', c: '#ffd3ec', d: '#ffe066' }, { a: '#c026d3', b: '#3b0a52', c: '#fbcfe8', d: '#67e8f9' }],
    festivales: [{ a: '#3b1d9a', b: '#12082f', c: '#ff7ac8', d: '#ffd24d' }, { a: '#0f766e', b: '#06241f', c: '#fde047', d: '#fb7185' }],
    talleres: [{ a: '#74849a', b: '#2b3441', c: '#f59e0b', d: '#38bdf8' }, { a: '#94775f', b: '#33251c', c: '#fbbf24', d: '#34d399' }],
  };
  const COLORS = ['#ef4444', '#f59e0b', '#22c55e', '#0ea5e9', '#8b5cf6', '#ec4899', '#f8fafc', '#14b8a6'];

  const S = {};

  /* ---- Música: escenario, haces de luz, banda y público ---- */
  S.musica = (r, p) => {
    const dk = '#06031a';
    let d = lg('bm', p.c, 0.7, p.c, 0) + lg('bn', p.d, 0.65, p.d, 0) + rg('gl', p.d, 0.55);
    let s = `<ellipse cx="160" cy="132" rx="175" ry="70" fill="url(#gl)"/>`;
    const nb = 4 + Math.floor(r() * 2);
    for (let i = 0; i < nb; i++) { const x = 30 + i * (260 / (nb - 1)); const tx = x + (r() * 100 - 50); s += poly([[x - 3, -4], [x + 3, -4], [tx + 28, 150], [tx - 28, 150]], i % 2 ? 'url(#bn)' : 'url(#bm)'); }
    s += stars(r, 22, 90);
    [8, 284].forEach((x) => { s += `<rect x="${x}" y="94" width="28" height="58" rx="3" fill="#0b0824"/><circle cx="${x + 14}" cy="111" r="6" fill="none" stroke="${p.c}" stroke-opacity=".7" stroke-width="1.5"/><circle cx="${x + 14}" cy="134" r="9" fill="none" stroke="${p.c}" stroke-opacity=".7" stroke-width="1.5"/>`; });
    s += `<rect x="0" y="148" width="320" height="52" fill="${dk}"/><rect x="0" y="148" width="320" height="2.5" fill="${p.d}" opacity=".8"/>`;
    const n = 2 + Math.floor(r() * 2);
    for (let k = 0; k < n; k++) {
      const x = 160 + (k - (n - 1) / 2) * 62;
      s += `<circle cx="${x}" cy="100" r="7.5" fill="${dk}"/><path d="M${x - 11} 150 L${x - 8} 111 Q${x} 104 ${x + 8} 111 L${x + 11} 150Z" fill="${dk}"/>`;
      if (k % 2 === 0) s += `<path d="M${x - 17} 134 L${x + 17} 116" stroke="${dk}" stroke-width="3" stroke-linecap="round"/><ellipse cx="${x - 3}" cy="131" rx="10" ry="6.5" transform="rotate(-24 ${x - 3} 131)" fill="${dk}"/><circle cx="${x - 3}" cy="131" r="2" fill="${p.d}"/>`;
      else s += `<path d="M${x + 14} 150 L${x + 14} 104" stroke="${dk}" stroke-width="2.5"/><circle cx="${x + 14}" cy="102" r="3.5" fill="${dk}"/><path d="M${x + 8} 113 L${x + 17} 96" stroke="${dk}" stroke-width="4" stroke-linecap="round"/>`;
    }
    s += `<rect x="0" y="190" width="320" height="10" fill="#03020c"/>`;
    for (let x = -4; x < 330; x += 13) { const y = 183 + r() * 9; s += `<circle cx="${f(x + r() * 5)}" cy="${f(y)}" r="${f(8 + r() * 2)}" fill="#03020c"/>`; if (r() < 0.3) s += `<path d="M${f(x + 2)} ${f(y + 2)} L${f(x - 3 + r() * 10)} ${f(y - 22 - r() * 8)}" stroke="#03020c" stroke-width="3" stroke-linecap="round"/>`; }
    return { d, s };
  };

  /* ---- Teatro: telón, foco y actores ---- */
  S.teatro = (r, p) => {
    const dk = '#12060b';
    let d = `<linearGradient id="cu" x1="0" y1="0" x2="0.16" y2="0" spreadMethod="repeat"><stop offset="0" stop-color="${p.c}"/><stop offset=".5" stop-color="#7d0f20"/><stop offset="1" stop-color="${p.c}"/></linearGradient>` + lg('sp', '#fff', 0.55, '#fff', 0.04) + lg('fl', '#7a4a2a', 1, '#2b160c', 1) + rg('wg', p.d, 0.4);
    let s = `<ellipse cx="160" cy="95" rx="120" ry="90" fill="url(#wg)"/>`;
    s += poly([[154, -2], [166, -2], [236, 168], [84, 168]], 'url(#sp)');
    s += `<rect x="0" y="150" width="320" height="50" fill="url(#fl)"/>`;
    for (let i = 0; i < 9; i++) s += `<path d="M${i * 40 - 30} 200 L${80 + i * 20} 150" stroke="#000" stroke-opacity=".18" stroke-width="1"/>`;
    const actor = (x, sc, arm) => {
      const k = sc, hy = f(100 - (k - 1) * 20);
      return `<circle cx="${x}" cy="${hy}" r="${f(7.5 * k)}" fill="${dk}"/><path d="M${f(x - 13 * k)} 152 L${f(x - 7 * k)} ${f(hy + 11 * k)} Q${x} ${f(hy + 7 * k)} ${f(x + 7 * k)} ${f(hy + 11 * k)} L${f(x + 13 * k)} 152Z" fill="${dk}"/>
        <path d="M${f(x + 6 * k)} ${f(hy + 14 * k)} L${f(x + (arm ? 26 : 14) * k)} ${f(arm ? hy - 14 * k : hy + 34 * k)}" stroke="${dk}" stroke-width="${f(4 * k)}" stroke-linecap="round"/>
        <path d="M${f(x - 6 * k)} ${f(hy + 14 * k)} L${f(x - 15 * k)} ${f(hy + 36 * k)}" stroke="${dk}" stroke-width="${f(4 * k)}" stroke-linecap="round"/>`;
    };
    s += actor(138, 1.05, true) + actor(190, 0.95, false);
    s += `<path d="M0 0 L82 0 C64 55 74 120 48 200 L0 200Z" fill="url(#cu)"/><path d="M320 0 L238 0 C256 55 246 120 272 200 L320 200Z" fill="url(#cu)"/>`;
    let val = 'M0 0 H320 V16';
    for (let x = 320; x > 0; x -= 40) val += ` Q${x - 20} 36 ${x - 40} 16`;
    s += `<path d="${val}Z" fill="url(#cu)"/><path d="${val}" fill="none" stroke="${p.d}" stroke-opacity=".7" stroke-width="1.5"/>`;
    s += `<rect x="0" y="190" width="320" height="10" fill="#050204"/>`;
    for (let x = 6; x < 330; x += 17) s += `<circle cx="${f(x + r() * 4)}" cy="${f(190 + r() * 4)}" r="${f(8 + r() * 2)}" fill="#050204"/>`;
    return { d, s };
  };

  /* ---- Arte: sala de exposición con cuadros abstractos ---- */
  S.arte = (r, p) => {
    let d = lg('fl', '#3b2a1e', 1, '#1b120b', 1) + rg('lt', '#fff', 0.45);
    let s = '';
    const n = 3;
    const w = [72, 96, 64].sort(() => r() - 0.5);
    let x = 22;
    const gap = (320 - 44 - w.reduce((a, b) => a + b, 0)) / (n - 1);
    w.forEach((fw, i) => {
      const h = 58 + Math.floor(r() * 34), y = 32 + Math.floor(r() * 14);
      const bgc = pick(r, ['#fff4dc', '#16224a', '#f1d7c2', '#0f3d3e', '#fbe0e0']);
      s += poly([[x + fw / 2 - 6, 0], [x + fw / 2 + 6, 0], [x + fw + 10, y + h + 8], [x - 10, y + h + 8]], 'url(#lt)', 'opacity=".5"');
      s += `<rect x="${f(x - 4)}" y="${y - 4}" width="${f(fw + 8)}" height="${h + 8}" fill="#2a1a0c"/><rect x="${f(x - 2)}" y="${y - 2}" width="${f(fw + 4)}" height="${h + 4}" fill="#c9a24b"/><rect x="${f(x)}" y="${y}" width="${f(fw)}" height="${h}" fill="${bgc}"/>`;
      for (let k = 0; k < 4; k++) {
        const c = pick(r, [p.c, p.d, '#ef4444', '#facc15', '#111827', '#22c55e']); const cx = x + 8 + r() * (fw - 16), cy = y + 8 + r() * (h - 16);
        const t = Math.floor(r() * 3);
        s += t === 0 ? `<circle cx="${f(cx)}" cy="${f(cy)}" r="${f(6 + r() * 14)}" fill="${c}" opacity=".9"/>` : t === 1 ? `<rect x="${f(Math.min(cx, x + fw - 18))}" y="${f(Math.min(cy, y + h - 18))}" width="${f(10 + r() * 16)}" height="${f(10 + r() * 22)}" fill="${c}" opacity=".9" transform="rotate(${f(r() * 40 - 20)} ${f(cx)} ${f(cy)})"/>` : `<path d="M${f(x + 3)} ${f(cy)} Q${f(x + fw / 2)} ${f(cy - 24 + r() * 48)} ${f(x + fw - 3)} ${f(cy + r() * 14)}" stroke="${c}" stroke-width="${f(3 + r() * 4)}" fill="none" stroke-linecap="round"/>`;
      }
      x += fw + gap;
    });
    s += `<rect x="0" y="150" width="320" height="50" fill="url(#fl)"/><rect x="0" y="148" width="320" height="3" fill="#7a5a36"/>`;
    const vx = 70 + r() * 180;
    s += `<circle cx="${f(vx)}" cy="122" r="7" fill="#1b0f0a"/><path d="M${f(vx - 11)} 190 L${f(vx - 8)} 132 Q${f(vx)} 128 ${f(vx + 8)} 132 L${f(vx + 11)} 190Z" fill="#1b0f0a"/>`;
    return { d, s };
  };

  /* ---- Literatura: estantes, lámpara y libro abierto ---- */
  S.literatura = (r, p) => {
    let d = rg('lm', p.c, 0.7) + lg('pg', '#fffaf0', 1, '#ddd2b8', 1, false);
    let s = `<ellipse cx="${f(70 + r() * 180)}" cy="70" rx="150" ry="90" fill="url(#lm)"/>`;
    [[78, 46], [138, 46]].forEach(([yb]) => {
      let x = 8;
      while (x < 312) {
        const bw = 9 + Math.floor(r() * 9), bh = 30 + Math.floor(r() * 24), c = pick(r, COLORS.concat([p.c, p.d]));
        const lean = r() < 0.07 ? -9 : 0;
        s += `<rect x="${x}" y="${yb - bh + (yb === 78 ? 0 : 0)}" width="${bw}" height="${bh}" fill="${c}" ${lean ? `transform="rotate(${lean} ${x} ${yb})"` : ''} rx="1"/><rect x="${x + 1.5}" y="${yb - bh + 5}" width="${bw - 3}" height="2" fill="#000" opacity=".25"/>`;
        x += bw + 1;
      }
      s += `<rect x="0" y="${yb}" width="320" height="6" fill="#3a2410"/>`;
    });
    s += `<path d="M160 190 L160 130" stroke="#0004" stroke-width="0"/>`;
    s += `<path d="M160 188 C140 168 96 164 60 170 L60 192 C96 188 140 192 160 202Z" fill="url(#pg)"/><path d="M160 188 C180 168 224 164 260 170 L260 192 C224 188 180 192 160 202Z" fill="url(#pg)"/><path d="M160 188 L160 202" stroke="#a99a78" stroke-width="1.5"/>`;
    for (let i = 0; i < 5; i++) s += `<path d="M${72 + i * 0} ${176 + i * 3.2} C100 ${172 + i * 3.2} 130 ${176 + i * 3.2} 150 ${181 + i * 3.2}" stroke="#a89c80" stroke-width="1.2" fill="none"/><path d="M170 ${181 + i * 3.2} C190 ${176 + i * 3.2} 220 ${172 + i * 3.2} 248 ${176 + i * 3.2}" stroke="#a89c80" stroke-width="1.2" fill="none"/>`;
    for (let i = 0; i < 7; i++) s += `<rect x="${f(40 + r() * 240)}" y="${f(100 + r() * 60)}" width="9" height="12" rx="1" fill="#fffaf0" opacity="${f(0.25 + r() * 0.4)}" transform="rotate(${f(r() * 60 - 30)} ${f(40 + r() * 240)} 120)"/>`;
    return { d, s };
  };

  /* ---- Cine: pantalla, haz del proyector y butacas ---- */
  S.cine = (r, p) => {
    let d = lg('sc', '#e9f2ff', 1, p.c, 1) + lg('bx', '#fff', 0.38, '#fff', 0.03) + rg('sg', p.c, 0.6);
    let s = stars(r, 36, 70, 0.7) + `<circle cx="${f(30 + r() * 260)}" cy="${f(14 + r() * 14)}" r="7" fill="#fff7d6" opacity=".9"/>`;
    s += `<ellipse cx="160" cy="70" rx="150" ry="70" fill="url(#sg)"/>`;
    s += poly([[150, 200], [170, 200], [250, 104], [70, 104]], 'url(#bx)');
    s += `<rect x="68" y="26" width="184" height="80" rx="3" fill="#0a0f24"/><rect x="72" y="30" width="176" height="72" fill="url(#sc)"/>`;
    s += `<circle cx="${f(190 + r() * 30)}" cy="52" r="12" fill="${p.d}"/><path d="M72 102 L112 66 L140 90 L176 60 L248 102Z" fill="#14305e" opacity=".85"/><path d="M72 102 L100 84 L128 102Z" fill="#0c1f40" opacity=".9"/>`;
    s += `<rect x="0" y="150" width="320" height="50" fill="#050816"/>`;
    for (let row = 0; row < 3; row++) {
      const y = 150 + row * 20, c = row === 0 ? '#0b1030' : row === 1 ? '#0a0d28' : '#070a1e';
      for (let x = 6 + (row % 2) * 12; x < 320; x += 26) { s += `<rect x="${x}" y="${y}" width="22" height="26" rx="6" fill="${c}"/><rect x="${x}" y="${y}" width="22" height="3" rx="1.5" fill="${p.c}" opacity=".35"/>`; if (r() < 0.3 && row < 2) s += `<circle cx="${x + 11}" cy="${y - 2}" r="6" fill="#02030c"/>`; }
    }
    return { d, s };
  };

  /* ---- Museos: fachada con columnas ---- */
  S.museos = (r, p) => {
    let d = lg('st', '#f4ead4', 1, '#cdbd96', 1, false) + rg('sn', p.c, 0.8) + lg('gr', '#2b5b60', 1, '#143437', 1);
    let s = `<circle cx="${f(60 + r() * 200)}" cy="42" r="46" fill="url(#sn)"/>` + stars(r, 6, 40, 0.5);
    s += `<polygon points="52,72 160,30 268,72" fill="url(#st)"/><polygon points="72,70 160,38 248,70" fill="${p.a}" opacity=".35"/><rect x="48" y="72" width="224" height="10" fill="#e5d8b8"/>`;
    for (let i = 0; i < 6; i++) { const x = 62 + i * 37; s += `<rect x="${x}" y="82" width="15" height="68" fill="url(#st)"/><rect x="${x - 2}" y="82" width="19" height="4" fill="#efe3c3"/><rect x="${x - 2}" y="146" width="19" height="4" fill="#efe3c3"/>`; if (i % 2 === 0 && i < 5) s += `<rect x="${x + 19}" y="94" width="14" height="38" fill="${i % 4 === 0 ? p.d : '#ef4444'}" opacity=".92"/><rect x="${x + 19}" y="94" width="14" height="4" fill="#fff" opacity=".35"/>`; }
    s += `<rect x="38" y="150" width="244" height="8" fill="#ddd0ac"/><rect x="28" y="158" width="264" height="8" fill="#cfc19b"/><rect x="18" y="166" width="284" height="8" fill="#c2b48e"/><rect x="0" y="174" width="320" height="26" fill="url(#gr)"/>`;
    for (let i = 0; i < 4; i++) { const x = 60 + r() * 200; s += `<circle cx="${f(x)}" cy="145" r="3.2" fill="#1f2a35"/><path d="M${f(x - 4)} 160 L${f(x - 3)} 149 Q${f(x)} 147 ${f(x + 3)} 149 L${f(x + 4)} 160Z" fill="#1f2a35"/>`; }
    return { d, s };
  };

  /* ---- Danza: bailarines en movimiento ---- */
  S.danza = (r, p) => {
    let d = lg('fl', '#fff', 0.22, '#fff', 0) + rg('sg', p.c, 0.65) + `<linearGradient id="sw" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="${p.d}" stop-opacity="0"/><stop offset=".5" stop-color="${p.d}" stop-opacity=".9"/><stop offset="1" stop-color="${p.c}" stop-opacity="0"/></linearGradient>`;
    let s = `<ellipse cx="160" cy="108" rx="150" ry="95" fill="url(#sg)"/>` + poly([[150, -2], [170, -2], [250, 170], [70, 170]], '#fff', 'opacity=".12"');
    s += `<path d="M-10 ${f(70 + r() * 30)} C70 ${f(10 + r() * 30)} 150 ${f(130 + r() * 20)} 330 ${f(60 + r() * 30)}" stroke="url(#sw)" stroke-width="5" fill="none" stroke-linecap="round"/><path d="M-10 ${f(110 + r() * 20)} C90 ${f(60 + r() * 20)} 190 ${f(160 + r() * 10)} 330 ${f(100 + r() * 20)}" stroke="url(#sw)" stroke-width="3" fill="none" stroke-linecap="round" opacity=".7"/>`;
    s += `<rect x="0" y="158" width="320" height="42" fill="#12031a" opacity=".6"/><rect x="0" y="158" width="320" height="42" fill="url(#fl)"/>`;
    const dancer = (x, y, k, flip) => {
      const m = flip ? -1 : 1, P = (dx, dy) => `${f(x + dx * k * m)},${f(y + dy * k)}`;
      const st = `stroke="#fff" stroke-width="${f(5 * k)}" stroke-linecap="round" stroke-linejoin="round" fill="none"`;
      return `<ellipse cx="${x}" cy="${f(y + 52 * k)}" rx="${f(26 * k)}" ry="${f(4 * k)}" fill="#000" opacity=".25"/>
        <polyline points="${P(2, -38)} ${P(-22, -48)} ${P(-36, -66)}" ${st}/><polyline points="${P(2, -38)} ${P(26, -34)} ${P(44, -46)}" ${st}/>
        <polyline points="${P(0, 0)} ${P(-3, 24)} ${P(-5, 50)}" ${st}/><polyline points="${P(0, 0)} ${P(28, 8)} ${P(52, -8)}" ${st}/>
        <path d="M${P(2, -40)} L${P(0, 0)}" stroke="#fff" stroke-width="${f(8 * k)}" stroke-linecap="round"/><circle cx="${f(x + 4 * k * m)}" cy="${f(y - 52 * k)}" r="${f(6.5 * k)}" fill="#fff"/>
        <path d="M${P(-15, 6)} Q${P(0, -9)} ${P(16, 6)} Q${P(0, 14)} ${P(-15, 6)}Z" fill="${p.d}"/>`;
    };
    s += dancer(112, 124, 1.15, false) + dancer(214, 128, 0.95, true);
    s += stars(r, 14, 90, 0.5);
    return { d, s };
  };

  /* ---- Festivales: banderines, fuegos artificiales y público ---- */
  S.festivales = (r, p) => {
    let d = rg('gl', p.c, 0.5);
    let s = stars(r, 30, 100, 0.6) + `<ellipse cx="160" cy="190" rx="200" ry="70" fill="url(#gl)"/>`;
    for (let i = 0; i < 3; i++) {
      const cx = 50 + i * 110 + r() * 40, cy = 60 + r() * 30, col = pick(r, [p.c, p.d, '#fff']), n = 14;
      for (let k = 0; k < n; k++) { const a = (k / n) * Math.PI * 2, r1 = 8, r2 = 24 + r() * 12; s += `<line x1="${f(cx + Math.cos(a) * r1)}" y1="${f(cy + Math.sin(a) * r1)}" x2="${f(cx + Math.cos(a) * r2)}" y2="${f(cy + Math.sin(a) * r2)}" stroke="${col}" stroke-width="2.2" stroke-linecap="round" opacity=".9"/><circle cx="${f(cx + Math.cos(a) * (r2 + 5))}" cy="${f(cy + Math.sin(a) * (r2 + 5))}" r="1.8" fill="${col}"/>`; }
      s += `<circle cx="${f(cx)}" cy="${f(cy)}" r="5" fill="#fff" opacity=".9"/>`;
    }
    s += `<path d="M-5 18 Q160 62 325 18" fill="none" stroke="#e8e0ff" stroke-width="1.4" opacity=".8"/>`;
    for (let i = 1; i < 18; i++) { const t = i / 18, x = -5 + 330 * t, y = 18 + 44 * 2 * t * (1 - t) * 1; s += poly([[x - 7, y], [x + 7, y], [x, y + 17]], pick(r, [p.c, p.d, '#fff', '#38bdf8', '#f97316'])); }
    [[40, 1], [286, 1]].forEach(([x]) => { s += `<line x1="${x}" y1="34" x2="${x}" y2="64" stroke="#e8e0ff" stroke-width="1"/><circle cx="${x}" cy="74" r="12" fill="${p.d}"/><circle cx="${x}" cy="74" r="12" fill="#fff" opacity=".25"/>`; });
    s += `<rect x="0" y="176" width="320" height="24" fill="#07031a"/>`;
    for (let x = -4; x < 330; x += 12) { const y = 170 + r() * 12; s += `<circle cx="${f(x + r() * 5)}" cy="${f(y)}" r="${f(7 + r() * 2)}" fill="#07031a"/><rect x="${f(x - 4)}" y="${f(y)}" width="14" height="40" rx="6" fill="#07031a"/>`; if (r() < 0.45) s += `<path d="M${f(x + 1)} ${f(y + 6)} L${f(x - 7 + r() * 14)} ${f(y - 24 - r() * 8)}" stroke="#07031a" stroke-width="3" stroke-linecap="round"/>`; }
    return { d, s };
  };

  /* ---- Talleres: mesa de trabajo (cerámica, fotografía o escritura) ---- */
  S.talleres = (r, p, e) => {
    const t = CV.norm(`${e.tema} ${e.titulo}`);
    let d = rg('lm', p.c, 0.75) + lg('tb', '#8a5a34', 1, '#4a2c16', 1);
    let s = `<ellipse cx="160" cy="48" rx="140" ry="80" fill="url(#lm)"/><path d="M160 0 L160 26" stroke="#111" stroke-width="2"/><path d="M144 44 Q160 20 176 44Z" fill="#1b2330"/><ellipse cx="160" cy="45" rx="16" ry="3" fill="#fff7c2"/>`;
    s += `<rect x="14" y="52" width="70" height="5" fill="#2b1b0e"/><rect x="236" y="70" width="70" height="5" fill="#2b1b0e"/>`;
    for (let i = 0; i < 4; i++) s += `<rect x="${18 + i * 16}" y="${34 + (i % 2) * 4}" width="11" height="${18 - (i % 2) * 4}" fill="${pick(r, COLORS)}" rx="1"/>`;
    for (let i = 0; i < 3; i++) s += `<rect x="${242 + i * 20}" y="${f(48 + (i % 2) * 6)}" width="14" height="${22 - (i % 2) * 6}" fill="${pick(r, COLORS)}" rx="2"/>`;
    s += `<rect x="0" y="136" width="320" height="64" fill="url(#tb)"/><rect x="0" y="136" width="320" height="4" fill="#b98355"/>`;
    if (/foto|camara/.test(t)) {
      s += `<rect x="108" y="82" width="104" height="62" rx="9" fill="#10141c"/><rect x="132" y="72" width="38" height="14" rx="4" fill="#10141c"/><circle cx="160" cy="113" r="25" fill="#1d2735"/><circle cx="160" cy="113" r="18" fill="#0a0f18"/><circle cx="160" cy="113" r="11" fill="${p.d}" opacity=".85"/><circle cx="154" cy="107" r="4" fill="#fff" opacity=".8"/><rect x="190" y="88" width="14" height="8" rx="2" fill="${p.c}"/>`;
      for (let i = 0; i < 3; i++) s += `<rect x="${24 + i * 30}" y="${f(86 + (i % 2) * 8)}" width="24" height="30" fill="#fdfdfd" transform="rotate(${[-6, 4, -3][i]} ${36 + i * 30} 100)"/><rect x="${27 + i * 30}" y="${f(89 + (i % 2) * 8)}" width="18" height="19" fill="${[p.d, p.c, '#6ee7b7'][i]}" opacity=".85" transform="rotate(${[-6, 4, -3][i]} ${36 + i * 30} 100)"/>`;
    } else if (/escritur|poesia|letra/.test(t)) {
      s += `<path d="M96 150 L112 104 L226 98 L216 150Z" fill="#fffaf0"/><path d="M112 104 L226 98" stroke="#d8cdb2" stroke-width="2"/>`;
      for (let i = 0; i < 5; i++) s += `<path d="M${116 - i * 2} ${114 + i * 7} L${216 - i * 2} ${109 + i * 7}" stroke="#a89c80" stroke-width="1.3"/>`;
      s += `<path d="M236 148 L268 104" stroke="#1d2a44" stroke-width="5" stroke-linecap="round"/><path d="M268 104 L272 98" stroke="${p.c}" stroke-width="5" stroke-linecap="round"/><rect x="40" y="108" width="26" height="34" rx="4" fill="${p.d}" opacity=".9"/><rect x="46" y="100" width="14" height="10" fill="#e2e8f0"/>`;
    } else {
      [[78, 1.1, '#d98e55'], [160, 1.5, '#c26a3a'], [238, 0.95, '#e0a86e']].forEach(([x, k, c]) => { s += `<path d="M${f(x - 14 * k)} 136 C${f(x - 26 * k)} ${f(112 - 6 * k)} ${f(x - 8 * k)} ${f(106 - 12 * k)} ${f(x - 8 * k)} ${f(92 - 22 * k)} L${f(x + 8 * k)} ${f(92 - 22 * k)} C${f(x + 8 * k)} ${f(106 - 12 * k)} ${f(x + 26 * k)} ${f(112 - 6 * k)} ${f(x + 14 * k)} 136Z" fill="${c}"/><path d="M${f(x - 18 * k)} ${f(120 - 6 * k)} Q${x} ${f(126 - 4 * k)} ${f(x + 18 * k)} ${f(120 - 6 * k)}" stroke="#fff" stroke-opacity=".5" stroke-width="2" fill="none"/>`; });
    }
    s += `<ellipse cx="${f(262 + r() * 20)}" cy="156" rx="26" ry="9" fill="#e9d3a8"/>` + [0, 1, 2, 3].map((i) => `<circle cx="${252 + i * 10}" cy="${154 + (i % 2) * 3}" r="3.4" fill="${pick(r, COLORS)}"/>`).join('');
    return { d, s };
  };

  /* ---------- armado y caché ---------- */
  const cache = {};
  CV.escena = (cat, seedKey, extra = {}) => {
    const fn = S[cat];
    if (!fn) return null;
    const key = `${cat}|${seedKey}|${extra.titulo || ''}`;
    if (cache[key]) return cache[key];
    const r = rng(CV.hash(seedKey + cat));
    const pals = PAL[cat];
    const t = CV.norm(`${extra.titulo || ''} ${extra.tema || ''}`);
    let p = pals[CV.hash(seedKey) % pals.length];
    if (cat === 'musica') { if (/rock/.test(t)) p = pals[2]; else if (/jazz|sinfon|piano|acust/.test(t)) p = pals[1]; }
    if (cat === 'festivales' && /pacifico|caribe/.test(t)) p = pals[1];
    const { d, s } = fn(r, p, extra);
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 200" preserveAspectRatio="xMidYMid slice"><defs>${lg('bg', p.a, 1, p.b, 1)}${d}</defs><rect width="320" height="200" fill="url(#bg)"/>${s}</svg>`;
    return (cache[key] = 'data:image/svg+xml;utf8,' + encodeURIComponent(svg));
  };

  // Tipo de lugar → escena parecida
  CV.escenaLugar = (l) => CV.escena({ Museo: 'museos', Teatro: 'teatro', 'Centro cultural': 'talleres', 'Galería': 'arte', Biblioteca: 'literatura', 'Parque y plaza': 'festivales' }[l.tipo] || 'museos', l.id, { titulo: l.nombre });
})();
