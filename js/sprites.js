'use strict';
// Dibujo procedural de los bichitos (aliados y enemigos) con caché en canvas.
const Sprites = (() => {
  const ALLIES = {
    llamita: { name: 'Llamita', elem: 'Fuego', body: '#ff8a3d', belly: '#ffe0b0', line: '#a8410f', bullet: '#ff6a1f' },
    burbu:   { name: 'Burbu',   elem: 'Agua',  body: '#4aa8ff', belly: '#d4ecff', line: '#1d5fa8', bullet: '#3fd0ff' },
    hojin:   { name: 'Hojín',   elem: 'Planta', body: '#62c95a', belly: '#dcf7c8', line: '#2c7a27', bullet: '#8dff5a' },
    chispi:  { name: 'Chispi',  elem: 'Rayo',  body: '#ffd93b', belly: '#fff6c4', line: '#a07b00', bullet: '#fff35a' },
    nievi:   { name: 'Nievi',   elem: 'Hielo', body: '#a6e8ff', belly: '#ffffff', line: '#3d8fb0', bullet: '#c8f8ff' },
    lunita:  { name: 'Lunita',  elem: 'Hada',  body: '#ff9ad5', belly: '#ffe4f3', line: '#b0457f', bullet: '#ff7ad9' },
  };
  const ENEMIES = {
    babosa:   { body: '#8bd14b', line: '#3f7a1d' },
    murci:    { body: '#8b5cf6', line: '#3b1a86' },
    cangre:   { body: '#f05050', line: '#8a1414' },
    roca:     { body: '#a3a9b3', line: '#454b55' },
    copito:   { body: '#e8f6ff', line: '#3f8fc0' },
    lava:     { body: '#5a3a30', line: '#2a1510' },
    fantasma: { body: '#d4c8ff', line: '#5b3bb0' },
    sombra:   { body: '#3d3556', line: '#120c22' },
  };
  const cache = new Map();
  const TAU = Math.PI * 2;

  function ell(g, x, y, rx, ry, fill, stroke, lw, rot = 0) {
    g.beginPath(); g.ellipse(x, y, Math.abs(rx), Math.abs(ry), rot, 0, TAU);
    if (fill) { g.fillStyle = fill; g.fill(); }
    if (stroke) { g.lineWidth = lw || 2; g.strokeStyle = stroke; g.stroke(); }
  }
  function poly(g, pts, fill, stroke, lw) {
    g.beginPath(); g.moveTo(pts[0][0], pts[0][1]);
    for (let i = 1; i < pts.length; i++) g.lineTo(pts[i][0], pts[i][1]);
    g.closePath();
    if (fill) { g.fillStyle = fill; g.fill(); }
    if (stroke) { g.lineWidth = lw || 2; g.strokeStyle = stroke; g.stroke(); }
  }
  function star(g, x, y, r1, r2, n, fill, stroke, lw) {
    const pts = [];
    for (let i = 0; i < n * 2; i++) {
      const a = -Math.PI / 2 + i * Math.PI / n, r = i % 2 ? r2 : r1;
      pts.push([x + Math.cos(a) * r, y + Math.sin(a) * r]);
    }
    poly(g, pts, fill, stroke, lw);
  }
  function flame(g, x, y, h, rot = 0) {
    g.save(); g.translate(x, y); g.rotate(rot);
    const gr = g.createLinearGradient(0, 0, 0, -h);
    gr.addColorStop(0, '#ff3d00'); gr.addColorStop(0.55, '#ff9100'); gr.addColorStop(1, '#ffe57f');
    g.beginPath();
    g.moveTo(-h * 0.38, 0);
    g.quadraticCurveTo(-h * 0.5, -h * 0.55, 0, -h);
    g.quadraticCurveTo(h * 0.05, -h * 0.62, h * 0.24, -h * 0.78);
    g.quadraticCurveTo(h * 0.55, -h * 0.4, h * 0.38, 0);
    g.quadraticCurveTo(0, h * 0.28, -h * 0.38, 0);
    g.fillStyle = gr; g.fill();
    g.restore();
  }

  // ---------- caras ----------
  function cuteEyes(g, r, dy = -0.12) {
    for (const s of [-1, 1]) {
      ell(g, s * r * 0.36, r * dy, r * 0.16, r * 0.22, '#1b1b2f');
      ell(g, s * r * 0.36 - r * 0.05, r * dy - r * 0.08, r * 0.07, r * 0.08, '#fff');
      ell(g, s * r * 0.36 + r * 0.05, r * dy + r * 0.08, r * 0.03, r * 0.03, '#fff');
    }
  }
  function cuteMouth(g, r) {
    g.beginPath(); g.arc(0, r * 0.14, r * 0.13, 0.15 * Math.PI, 0.85 * Math.PI);
    g.lineWidth = r * 0.06; g.strokeStyle = '#1b1b2f'; g.lineCap = 'round'; g.stroke();
  }
  function cheeks(g, r, color = 'rgba(255,100,150,.55)') {
    ell(g, -r * 0.63, r * 0.14, r * 0.14, r * 0.09, color);
    ell(g, r * 0.63, r * 0.14, r * 0.14, r * 0.09, color);
  }
  function angryEyes(g, r, pupil = '#1b1b2f', dy = -0.1, white = '#fff') {
    for (const s of [-1, 1]) {
      ell(g, s * r * 0.34, r * dy, r * 0.19, r * 0.16, white, '#1b1b2f', r * 0.05);
      ell(g, s * r * 0.29, r * dy + r * 0.03, r * 0.08, r * 0.09, pupil);
      g.beginPath();
      g.moveTo(s * r * 0.6, r * (dy - 0.24)); g.lineTo(s * r * 0.1, r * (dy - 0.08));
      g.lineWidth = r * 0.11; g.strokeStyle = '#1b1b2f'; g.lineCap = 'round'; g.stroke();
    }
  }
  function angryMouth(g, r, dy = 0.3) {
    g.beginPath();
    g.moveTo(-r * 0.3, r * dy);
    g.quadraticCurveTo(0, r * (dy - 0.12), r * 0.3, r * dy);
    g.quadraticCurveTo(0, r * (dy + 0.1), -r * 0.3, r * dy);
    g.fillStyle = '#3b0d0d'; g.fill();
    g.fillStyle = '#fff';
    for (const s of [-1, 1]) {
      g.beginPath();
      g.moveTo(s * r * 0.22, r * (dy - 0.06)); g.lineTo(s * r * 0.11, r * (dy - 0.08)); g.lineTo(s * r * 0.17, r * (dy + 0.06));
      g.closePath(); g.fill();
    }
  }
  function body(g, r, fill, line) { ell(g, 0, 0, r, r * 0.93, fill, line, r * 0.08); }
  function feet(g, r, fill, line) { for (const s of [-1, 1]) ell(g, s * r * 0.45, r * 0.86, r * 0.26, r * 0.15, fill, line, r * 0.06); }
  function belly(g, r, fill) { ell(g, 0, r * 0.34, r * 0.55, r * 0.44, fill); }
  function shine(g, r) { ell(g, -r * 0.45, -r * 0.5, r * 0.18, r * 0.1, 'rgba(255,255,255,.55)', null, 0, -0.6); }

  // ---------- aliados ----------
  function drawAlly(g, key, r) {
    const c = ALLIES[key];
    const L = r * 0.08;
    switch (key) {
      case 'llamita':
        flame(g, r * 0.85, r * 0.45, r * 0.75, 0.9);
        flame(g, 0, -r * 0.7, r * 0.95);
        break;
      case 'burbu':
        g.beginPath();
        g.moveTo(-r * 0.35, -r * 0.75);
        g.quadraticCurveTo(-r * 0.1, -r * 1.45, r * 0.25, -r * 1.3);
        g.quadraticCurveTo(r * 0.1, -r * 1.0, r * 0.38, -r * 0.75);
        g.closePath(); g.fillStyle = '#2b7fd6'; g.fill(); g.lineWidth = L; g.strokeStyle = c.line; g.stroke();
        for (const s of [-1, 1]) ell(g, s * r * 0.95, -r * 0.05, r * 0.22, r * 0.38, '#2b7fd6', c.line, L * 0.8, s * 0.5);
        break;
      case 'chispi':
        poly(g, [[r * 0.6, r * 0.4], [r * 1.25, r * 0.1], [r * 1.05, -r * 0.1], [r * 1.5, -r * 0.45], [r * 1.0, -r * 0.25], [r * 1.2, -r * 0.02], [r * 0.7, r * 0.15]], '#ffb300', c.line, L * 0.8);
        break;
      case 'lunita':
        for (const s of [-1, 1]) {
          ell(g, s * r * 1.05, -r * 0.35, r * 0.55, r * 0.3, 'rgba(255,255,255,.95)', '#e0a0c8', L * 0.7, s * -0.6);
          ell(g, s * r * 0.95, r * 0.05, r * 0.38, r * 0.2, 'rgba(255,255,255,.95)', '#e0a0c8', L * 0.7, s * -0.2);
        }
        break;
      case 'nievi':
        for (const s of [-1, 1]) poly(g, [[s * r * 0.55, -r * 0.6], [s * r * 0.95, -r * 1.15], [s * r * 0.85, -r * 0.45]], '#ffffff', c.line, L * 0.8);
        break;
    }
    feet(g, r, c.body, c.line);
    body(g, r, c.body, c.line);
    belly(g, r, c.belly);
    shine(g, r);
    cuteEyes(g, r);
    cuteMouth(g, r);
    cheeks(g, r, key === 'chispi' ? 'rgba(255,90,40,.7)' : undefined);
    switch (key) {
      case 'hojin': {
        g.beginPath(); g.moveTo(0, -r * 0.88); g.quadraticCurveTo(r * 0.05, -r * 1.1, 0, -r * 1.25);
        g.lineWidth = L; g.strokeStyle = '#2c7a27'; g.stroke();
        ell(g, -r * 0.28, -r * 1.3, r * 0.32, r * 0.14, '#3fbf3a', '#2c7a27', L * 0.7, 0.5);
        ell(g, r * 0.28, -r * 1.3, r * 0.32, r * 0.14, '#3fbf3a', '#2c7a27', L * 0.7, -0.5);
        for (const [x, y] of [[-0.7, -0.35], [0.72, -0.3], [0.6, 0.55]]) ell(g, r * x, r * y, r * 0.09, r * 0.07, '#47a842');
        break;
      }
      case 'chispi':
        poly(g, [[-r * 0.05, -r * 0.85], [r * 0.2, -r * 1.25], [0, -r * 1.2], [r * 0.15, -r * 1.6], [-r * 0.22, -r * 1.1], [-r * 0.02, -r * 1.12], [-r * 0.2, -r * 0.85]], '#ffb300', c.line, L * 0.8);
        break;
      case 'nievi':
        for (const [x, rot] of [[-0.3, -0.35], [0, 0], [0.3, 0.35]]) {
          g.save(); g.translate(r * x, -r * 0.85); g.rotate(rot);
          poly(g, [[0, -r * 0.45], [r * 0.12, -r * 0.15], [0, r * 0.05], [-r * 0.12, -r * 0.15]], '#e8fbff', c.line, L * 0.6);
          g.restore();
        }
        star(g, 0, r * 0.4, r * 0.14, r * 0.06, 6, '#9fdcf5');
        break;
      case 'lunita':
        g.beginPath(); g.moveTo(0, -r * 0.88); g.quadraticCurveTo(r * 0.25, -r * 1.15, r * 0.1, -r * 1.35);
        g.lineWidth = L * 0.8; g.strokeStyle = c.line; g.stroke();
        star(g, r * 0.1, -r * 1.42, r * 0.24, r * 0.11, 5, '#ffe14d', '#c99a00', L * 0.6);
        break;
      case 'burbu':
        ell(g, r * 1.15, -r * 0.8, r * 0.12, r * 0.12, 'rgba(200,240,255,.6)', '#fff', L * 0.5);
        ell(g, r * 1.35, -r * 1.1, r * 0.07, r * 0.07, 'rgba(200,240,255,.6)', '#fff', L * 0.4);
        break;
      case 'llamita':
        ell(g, 0, r * 0.38, r * 0.12, r * 0.1, '#ffb070');
        break;
    }
  }

  // ---------- enemigos ----------
  function drawEnemy(g, key, r) {
    const c = ENEMIES[key];
    const L = r * 0.08;
    switch (key) {
      case 'babosa': {
        g.beginPath();
        g.moveTo(-r * 1.08, r * 0.95);
        g.bezierCurveTo(-r * 1.15, -r * 0.2, -r * 0.6, -r * 1.0, 0, -r * 1.0);
        g.bezierCurveTo(r * 0.6, -r * 1.0, r * 1.15, -r * 0.2, r * 1.08, r * 0.95);
        g.quadraticCurveTo(0, r * 1.1, -r * 1.08, r * 0.95);
        g.fillStyle = c.body; g.fill(); g.lineWidth = L; g.strokeStyle = c.line; g.stroke();
        for (const [x, y, s] of [[-0.55, -0.55, 0.1], [0.5, 0.45, 0.13], [-0.6, 0.5, 0.08]]) ell(g, r * x, r * y, r * s, r * s, '#b4ec74');
        shine(g, r);
        angryEyes(g, r, '#c0144a', -0.15);
        angryMouth(g, r, 0.35);
        break;
      }
      case 'murci': {
        for (const s of [-1, 1]) {
          poly(g, [[s * r * 0.6, -r * 0.35], [s * r * 1.95, -r * 0.75], [s * r * 1.7, -r * 0.15], [s * r * 1.45, r * 0.05], [s * r * 1.2, -r * 0.05], [s * r * 0.95, r * 0.25], [s * r * 0.65, r * 0.2]], '#5b2bc9', c.line, L);
          poly(g, [[s * r * 0.25, -r * 0.8], [s * r * 0.65, -r * 1.35], [s * r * 0.7, -r * 0.55]], c.body, c.line, L);
        }
        feet(g, r, c.body, c.line);
        body(g, r, c.body, c.line);
        belly(g, r, '#b79cff');
        shine(g, r);
        angryEyes(g, r, '#ff2a2a', -0.12, '#fff38a');
        g.fillStyle = '#fff';
        for (const s of [-1, 1]) poly(g, [[s * r * 0.08, r * 0.2], [s * r * 0.25, r * 0.2], [s * r * 0.16, r * 0.42]], '#fff', '#1b1b2f', L * 0.4);
        break;
      }
      case 'cangre': {
        for (const s of [-1, 1]) {
          g.beginPath(); g.moveTo(s * r * 0.8, -r * 0.1); g.lineTo(s * r * 1.25, -r * 0.55);
          g.lineWidth = r * 0.16; g.strokeStyle = c.line; g.stroke();
          ell(g, s * r * 1.3, -r * 0.85, r * 0.38, r * 0.32, c.body, c.line, L);
          poly(g, [[s * r * 1.3, -r * 0.85], [s * r * 1.15, -r * 1.25], [s * r * 1.55, -r * 1.15]], '#ffb3a8');
          for (let k = 0; k < 3; k++) {
            g.beginPath(); g.moveTo(s * r * 0.7, r * (0.3 + k * 0.18)); g.lineTo(s * r * 1.15, r * (0.5 + k * 0.22));
            g.lineWidth = r * 0.1; g.strokeStyle = c.line; g.stroke();
          }
          g.beginPath(); g.moveTo(s * r * 0.3, -r * 0.6); g.lineTo(s * r * 0.38, -r * 1.05);
          g.lineWidth = r * 0.09; g.strokeStyle = c.line; g.stroke();
        }
        ell(g, 0, 0, r * 1.0, r * 0.78, c.body, c.line, L);
        shine(g, r);
        for (const s of [-1, 1]) {
          ell(g, s * r * 0.38, -r * 1.12, r * 0.17, r * 0.17, '#fff', '#1b1b2f', L * 0.6);
          ell(g, s * r * 0.34, -r * 1.1, r * 0.07, r * 0.08, '#1b1b2f');
          g.beginPath(); g.moveTo(s * r * 0.6, -r * 1.42); g.lineTo(s * r * 0.2, -r * 1.25);
          g.lineWidth = r * 0.09; g.strokeStyle = '#1b1b2f'; g.stroke();
        }
        angryMouth(g, r, 0.15);
        break;
      }
      case 'roca':
      case 'lava': {
        const pts = [], n = 11;
        for (let i = 0; i < n; i++) {
          const a = i / n * TAU - Math.PI / 2, rr = r * (0.95 + 0.12 * Math.sin(i * 2.7) + (i % 2 ? 0.06 : 0));
          pts.push([Math.cos(a) * rr * 1.05, Math.sin(a) * rr * 0.95 + r * 0.05]);
        }
        if (key === 'lava') flame(g, 0, -r * 0.75, r * 0.8);
        poly(g, pts, c.body, c.line, L);
        if (key === 'lava') {
          g.lineWidth = r * 0.09; g.strokeStyle = '#ff8a1f'; g.lineCap = 'round';
          for (const seg of [[[-0.8, -0.2], [-0.5, 0.0], [-0.65, 0.35]], [[0.75, -0.4], [0.5, -0.1], [0.7, 0.3]], [[-0.2, 0.7], [0.1, 0.55], [0.3, 0.8]]]) {
            g.beginPath(); g.moveTo(r * seg[0][0], r * seg[0][1]);
            for (let k = 1; k < seg.length; k++) g.lineTo(r * seg[k][0], r * seg[k][1]);
            g.stroke();
          }
          angryEyes(g, r, '#ff3d00', -0.15, '#ffd54f');
        } else {
          g.lineWidth = r * 0.05; g.strokeStyle = c.line;
          g.beginPath(); g.moveTo(-r * 0.75, -r * 0.45); g.lineTo(-r * 0.5, -r * 0.3); g.lineTo(-r * 0.55, -r * 0.1); g.stroke();
          g.beginPath(); g.moveTo(r * 0.7, r * 0.45); g.lineTo(r * 0.45, r * 0.55); g.stroke();
          ell(g, r * 0.55, -r * 0.6, r * 0.12, r * 0.08, '#c3c8cf');
          angryEyes(g, r, '#1b1b2f', -0.15);
        }
        angryMouth(g, r, 0.35);
        break;
      }
      case 'copito': {
        for (const [x, h] of [[-0.55, 0.45], [-0.2, 0.6], [0.2, 0.55], [0.55, 0.4]]) {
          poly(g, [[r * (x - 0.15), -r * 0.7], [r * x, -r * (0.75 + h)], [r * (x + 0.15), -r * 0.7]], '#bfeaff', c.line, L * 0.7);
        }
        feet(g, r, '#d0ecff', c.line);
        body(g, r, c.body, c.line);
        shine(g, r);
        angryEyes(g, r, '#1e64c8', -0.12);
        angryMouth(g, r, 0.32);
        ell(g, -r * 0.6, r * 0.2, r * 0.13, r * 0.08, 'rgba(120,190,255,.5)');
        ell(g, r * 0.6, r * 0.2, r * 0.13, r * 0.08, 'rgba(120,190,255,.5)');
        break;
      }
      case 'fantasma': {
        g.globalAlpha = 0.92;
        g.beginPath();
        g.moveTo(-r, r * 0.95);
        g.lineTo(-r, -r * 0.1);
        g.arc(0, -r * 0.1, r, Math.PI, 0);
        g.lineTo(r, r * 0.95);
        const waves = 4;
        for (let i = 0; i < waves; i++) {
          const x0 = r - (i * 2 * r) / waves, x1 = r - ((i + 1) * 2 * r) / waves;
          g.quadraticCurveTo((x0 + x1) / 2, r * (i % 2 ? 0.75 : 1.2), x1, r * 0.95);
        }
        g.closePath(); g.fillStyle = c.body; g.fill(); g.lineWidth = L; g.strokeStyle = c.line; g.stroke();
        g.globalAlpha = 1;
        shine(g, r);
        for (const s of [-1, 1]) {
          ell(g, s * r * 0.36, -r * 0.2, r * 0.17, r * 0.24, '#1b1b2f');
          ell(g, s * r * 0.36, -r * 0.24, r * 0.06, r * 0.07, '#ff4fd8');
          g.beginPath(); g.moveTo(s * r * 0.62, -r * 0.55); g.lineTo(s * r * 0.15, -r * 0.42);
          g.lineWidth = r * 0.1; g.strokeStyle = '#1b1b2f'; g.lineCap = 'round'; g.stroke();
        }
        ell(g, 0, r * 0.3, r * 0.22, r * 0.18, '#3b0d0d');
        ell(g, r * 0.05, r * 0.42, r * 0.11, r * 0.09, '#ff7aa8');
        break;
      }
      case 'sombra': {
        for (const s of [-1, 1]) {
          g.beginPath(); g.moveTo(s * r * 0.35, -r * 0.8);
          g.quadraticCurveTo(s * r * 0.9, -r * 1.1, s * r * 0.75, -r * 1.55);
          g.quadraticCurveTo(s * r * 0.55, -r * 1.05, s * r * 0.15, -r * 0.88);
          g.closePath(); g.fillStyle = '#d9d2ea'; g.fill(); g.lineWidth = L * 0.7; g.strokeStyle = c.line; g.stroke();
        }
        feet(g, r, c.body, c.line);
        body(g, r, c.body, c.line);
        belly(g, r, '#5a4f7a');
        shine(g, r);
        for (const s of [-1, 1]) {
          const gr = g.createRadialGradient(s * r * 0.34, -r * 0.1, 0, s * r * 0.34, -r * 0.1, r * 0.35);
          gr.addColorStop(0, 'rgba(255,40,80,.8)'); gr.addColorStop(1, 'rgba(255,40,80,0)');
          g.fillStyle = gr; g.fillRect(s * r * 0.34 - r * 0.35, -r * 0.45, r * 0.7, r * 0.7);
        }
        angryEyes(g, r, '#ff1744', -0.1, '#ffe0e6');
        angryMouth(g, r, 0.35);
        break;
      }
    }
  }

  function get(kind, key, base) {
    const id = kind + ':' + key + ':' + base;
    let c = cache.get(id);
    if (c) return c;
    const r = base;
    c = document.createElement('canvas');
    c.width = Math.ceil(r * 4.2); c.height = Math.ceil(r * 4.2);
    const g = c.getContext('2d');
    g.translate(c.width / 2, r * 2.4);
    g.lineJoin = 'round'; g.lineCap = 'round';
    if (kind === 'ally') drawAlly(g, key, r); else drawEnemy(g, key, r);
    c.anchorY = r * 2.4 + r * 1.0;
    c.base = r;
    cache.set(id, c);
    return c;
  }

  const api = {
    ALLIES, ENEMIES, dpr: 1,
    // x,y = posición de los pies; R = radio del cuerpo en píxeles lógicos
    draw(ctx, kind, key, x, y, R) {
      const phys = R * api.dpr;
      const base = phys > 90 ? 180 : phys > 45 ? 90 : phys > 22 ? 45 : 22;
      const c = get(kind, key, base);
      const s = R / c.base;
      ctx.drawImage(c, x - (c.width * s) / 2, y - c.anchorY * s, c.width * s, c.height * s);
    },
    portrait(kind, key, size) {
      const c = document.createElement('canvas');
      c.width = size; c.height = size;
      const g = c.getContext('2d');
      const R = size * 0.27;
      const old = api.dpr; api.dpr = 1;
      api.draw(g, kind, key, size / 2, size * 0.78, R);
      api.dpr = old;
      return c;
    },
    star,
  };
  return api;
})();
