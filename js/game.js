'use strict';
(() => {
  // ================== Configuración ==================
  const W = 540, H = 960;
  const HORIZON = 330, PLAYER_Y = 830, CX = W / 2, ROAD_HALF = 210, ZK = 0.048;
  const SCROLL = 9, SPAWN_Z = 58, BULLET_SPEED = 48, BULLET_RANGE = 44;
  const MAX_SHOWN = 70;
  const WEAPONS = [null,
    { int: 0.30, dps: 2.0, name: 'Burbujitas' },
    { int: 0.26, dps: 2.8, name: 'Doble rayo' },
    { int: 0.22, dps: 3.8, name: 'Súper rayo' },
    { int: 0.19, dps: 5.0, name: 'Mega rayo' },
    { int: 0.16, dps: 6.5, name: 'Ultra rayo' }];

  const LEVELS = [
    { name: 'Pradera Florida', sky: ['#6ec3ff', '#dff3ff'], hills: ['#9bdc7a', '#7cc95c'], scenery: 'hills', grass: '#6cc24a', grass2: '#62b642', road: '#6b6f7a', curb: ['#ffffff', '#ff5a5a'], decor: ['flower', 'tree', 'bush', 'flower'], enemies: ['babosa'], boss: 'babosa' },
    { name: 'Bosque Susurro', sky: ['#59a9e6', '#d3efd5'], hills: ['#3c8a4a', '#2f7a3d'], scenery: 'forest', grass: '#3f9d4a', grass2: '#378f41', road: '#6a6458', curb: ['#ffffff', '#ffb02e'], decor: ['pine', 'tree', 'mushroom', 'pine'], enemies: ['babosa', 'murci'], boss: 'murci' },
    { name: 'Playa Coral', sky: ['#40bdf5', '#fff5cc'], hills: ['#5fd0e8', '#38b6d8'], scenery: 'sea', grass: '#f4dc9b', grass2: '#ecd28a', road: '#7a7f8c', curb: ['#ffffff', '#2fa8ff'], decor: ['palm', 'starfish', 'umbrella', 'palm'], enemies: ['cangre', 'babosa'], boss: 'cangre', sea: true },
    { name: 'Desierto Solar', sky: ['#ffae4d', '#ffeab8'], hills: ['#e9b56a', '#d99f4f'], scenery: 'dunes', grass: '#e8b86a', grass2: '#deab5a', road: '#6e6a66', curb: ['#ffffff', '#ff5a5a'], decor: ['cactus', 'rock', 'cactus'], enemies: ['roca', 'cangre'], boss: 'roca' },
    { name: 'Montaña Nevada', sky: ['#86c3f5', '#f2f9ff'], hills: ['#c8dcef', '#a9c4de'], scenery: 'mountains', grass: '#f2f8ff', grass2: '#e1edf8', road: '#7b8594', curb: ['#ffffff', '#3d8fd6'], decor: ['snowpine', 'snowman', 'snowpine'], enemies: ['copito', 'roca'], boss: 'copito' },
    { name: 'Volcán Ardiente', sky: ['#4a1e2a', '#ff8a50'], hills: ['#5a2c26', '#3e1d19'], scenery: 'volcano', grass: '#4a3a35', grass2: '#413230', road: '#2f2a2a', curb: ['#ffcc33', '#ff3d00'], decor: ['lavarock', 'deadtree', 'lavarock'], enemies: ['lava', 'roca'], boss: 'lava' },
    { name: 'Bosque Encantado', sky: ['#140f3c', '#4b3b8f'], hills: ['#241a5a', '#1b1446'], scenery: 'forest', grass: '#2c4a3a', grass2: '#274233', road: '#3e3a4c', curb: ['#ffffff', '#b56bff'], decor: ['mushroom', 'deadtree', 'lantern', 'mushroom'], enemies: ['fantasma', 'murci'], boss: 'fantasma', night: true },
    { name: 'Castillo Sombrío', sky: ['#2a1848', '#e07ab8'], hills: ['#4a3168', '#3a2554'], scenery: 'castle', grass: '#5b4a7a', grass2: '#53436f', road: '#3b3448', curb: ['#ffd54f', '#7c3aed'], decor: ['crystal', 'tower', 'crystal'], enemies: ['sombra', 'fantasma', 'lava'], boss: 'sombra' },
  ];

  // ================== Utilidades ==================
  const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
  const sc = z => 1 / (1 + Math.max(z, -6) * ZK);
  const sy = z => HORIZON + (PLAYER_Y - HORIZON) * sc(z);
  const sx = (x, z) => CX + x * ROAD_HALF * sc(z);
  function mulberry32(a) {
    return function () {
      a |= 0; a = (a + 0x6D2B79F5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  // ================== Guardado ==================
  const SAVE_KEY = 'bichitos-ruta-v1';
  const save = { unlocked: 1, stars: {}, partner: 'llamita', muted: false, music: true };
  try { Object.assign(save, JSON.parse(localStorage.getItem(SAVE_KEY) || '{}')); } catch (e) { /* sin guardado */ }
  function persist() { try { localStorage.setItem(SAVE_KEY, JSON.stringify(save)); } catch (e) { /* ignorar */ } }

  // ================== Sonido ==================
  const Sfx = (() => {
    let ac = null;
    function ensure() {
      if (!ac) { try { ac = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { ac = null; } }
      if (ac && ac.state === 'suspended') ac.resume();
      if (ac && mSong && !mTimer) startScheduler();
    }
    function tone(freq, dur, type = 'sine', vol = 0.15, slide = 0, delay = 0) {
      if (save.muted || !ac) return;
      const t = ac.currentTime + delay;
      const o = ac.createOscillator(), g = ac.createGain();
      o.type = type; o.frequency.setValueAtTime(freq, t);
      if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(30, freq + slide), t + dur);
      g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.001, t + dur);
      o.connect(g).connect(ac.destination); o.start(t); o.stop(t + dur + 0.03);
    }
    const seq = (notes, step, dur, type, vol) => notes.forEach((f, i) => tone(f, dur, type, vol, 0, i * step));
    // ---------- Música procedural (sin archivos) ----------
    let mGain = null, mTimer = null, mSong = null, mStep = 0, mNext = 0, noiseBuf = null;
    const midi = n => 440 * Math.pow(2, (n - 69) / 12);
    function makeSong(seed, kind) {
      const r = mulberry32(seed * 31 + (kind === 'boss' ? 7 : kind === 'menu' ? 3 : 1));
      const minor = kind === 'boss';
      const scale = minor ? [0, 2, 3, 5, 7, 8, 10] : [0, 2, 4, 7, 9];
      const progs = [[0, 9, 5, 7], [0, 5, 7, 5], [9, 5, 0, 7], [0, 7, 9, 5]];
      const prog = minor ? [0, 8, 3, 10] : kind === 'menu' ? [0, 5, 9, 7] : progs[seed % progs.length];
      const root = 57 + (seed % 5);
      const tempo = minor ? 150 : kind === 'menu' ? 104 : 116 + (seed % 4) * 6;
      const mel = [];
      for (let s = 0; s < 64; s++) {
        const strong = s % 4 === 0, even = s % 2 === 0;
        let n = null;
        if ((strong && r() < 0.85) || (even && !strong && r() < 0.4) || (!even && r() < 0.1)) {
          n = root + 12 + scale[Math.floor(r() * scale.length)] + (r() < 0.15 ? 12 : 0);
        }
        mel.push(n);
      }
      for (let s = 32; s < 48; s++) mel[s] = mel[s - 32];
      return { tempo, root, prog, mel, minor, kind };
    }
    function mNote(freq, t, dur, type, vol) {
      const o = ac.createOscillator(), g = ac.createGain();
      o.type = type; o.frequency.setValueAtTime(freq, t);
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(vol, t + 0.012);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      o.connect(g).connect(mGain); o.start(t); o.stop(t + dur + 0.05);
    }
    function drum(t, kind) {
      if (kind === 'kick') {
        const o = ac.createOscillator(), g = ac.createGain();
        o.frequency.setValueAtTime(150, t); o.frequency.exponentialRampToValueAtTime(40, t + 0.12);
        g.gain.setValueAtTime(0.55, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.15);
        o.connect(g).connect(mGain); o.start(t); o.stop(t + 0.17);
        return;
      }
      if (!noiseBuf) {
        noiseBuf = ac.createBuffer(1, Math.floor(ac.sampleRate * 0.3), ac.sampleRate);
        const d = noiseBuf.getChannelData(0);
        for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
      }
      const src = ac.createBufferSource(); src.buffer = noiseBuf;
      const f = ac.createBiquadFilter(); f.type = kind === 'hat' ? 'highpass' : 'bandpass'; f.frequency.value = kind === 'hat' ? 7000 : 1800;
      const g = ac.createGain(), dur = kind === 'hat' ? 0.04 : 0.12;
      g.gain.setValueAtTime(kind === 'hat' ? 0.1 : 0.25, t); g.gain.exponentialRampToValueAtTime(0.001, t + dur);
      src.connect(f).connect(g).connect(mGain); src.start(t); src.stop(t + dur + 0.02);
    }
    function playStep(st, t) {
      const S = mSong, s16 = st % 16, bar = Math.floor(st / 16) % 4;
      const chord = S.root + S.prog[bar], sd = 60 / S.tempo / 4;
      if (s16 % 4 === 0 || (S.minor && s16 % 2 === 0)) mNote(midi(chord - 12 + (s16 === 8 ? 7 : 0)), t, sd * 1.8, 'triangle', 0.3);
      if (!S.minor && s16 % 2 === 1) {
        const arp = [0, 4, 7, 12];
        mNote(midi(chord + arp[(s16 >> 1) % 4]), t, sd * 1.5, 'sine', 0.07);
      }
      const n = S.mel[st % 64];
      if (n) mNote(midi(n), t, sd * 1.7, 'square', 0.06);
      if (s16 === 0 || s16 === 8 || (S.minor && (s16 === 10 || s16 === 6))) drum(t, 'kick');
      if (s16 === 4 || s16 === 12) drum(t, 'snare');
      if (s16 % 2 === 0 && S.kind !== 'menu') drum(t, 'hat');
    }
    function musicTick() {
      if (!ac || !mSong || ac.state !== 'running') return;
      const sd = 60 / mSong.tempo / 4;
      if (mNext < ac.currentTime - 0.1) mNext = ac.currentTime + 0.02;
      while (mNext < ac.currentTime + 0.15) { playStep(mStep, mNext); mNext += sd; mStep++; }
    }
    function startScheduler() {
      if (!ac || !mSong) return;
      if (!mGain) {
        mGain = ac.createGain();
        const f = ac.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 3200;
        mGain.connect(f).connect(ac.destination);
      }
      mGain.gain.value = save.music && !save.muted ? 0.2 : 0;
      mStep = 0; mNext = ac.currentTime + 0.05;
      if (!mTimer) mTimer = setInterval(musicTick, 30);
    }
    function music(seed, kind) {
      const id = kind + ':' + seed;
      if (mSong && mSong.id === id) return;
      mSong = makeSong(seed, kind); mSong.id = id;
      startScheduler();
    }
    function refreshMusic() { if (mGain) mGain.gain.value = save.music && !save.muted ? 0.2 : 0; }
    document.addEventListener('visibilitychange', () => {
      if (!ac) return;
      if (document.hidden) ac.suspend(); else ac.resume();
    });
    let lastPop = 0, lastShoot = 0, lastHit = 0;
    return {
      ensure, music, refreshMusic,
      shoot() { const n = performance.now(); if (n - lastShoot > 110) { lastShoot = n; tone(900, 0.05, 'square', 0.025, -400); } },
      hit() { const n = performance.now(); if (n - lastHit > 70) { lastHit = n; tone(260, 0.05, 'triangle', 0.05, -80); } },
      pop() { const n = performance.now(); if (n - lastPop > 60) { lastPop = n; tone(520, 0.09, 'sine', 0.1, 500); } },
      good() { seq([523, 784], 0.09, 0.14, 'sine', 0.16); },
      bad() { tone(300, 0.3, 'sawtooth', 0.09, -160); },
      tick() { tone(1200, 0.04, 'sine', 0.05); },
      upgrade() { seq([523, 659, 784, 1046], 0.08, 0.12, 'triangle', 0.14); },
      ouch() { tone(170, 0.14, 'square', 0.07, -70); },
      boss() { seq([196, 185, 175, 165], 0.18, 0.25, 'sawtooth', 0.08); },
      win() { seq([523, 659, 784, 659, 784, 1046], 0.13, 0.2, 'triangle', 0.15); },
      lose() { seq([392, 330, 262, 196], 0.18, 0.28, 'sine', 0.15); },
    };
  })();

  // ================== Canvas / escalado ==================
  const wrap = document.getElementById('wrap');
  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');
  let DPR = 1;
  function resize() {
    const s = Math.min(window.innerWidth / W, window.innerHeight / H);
    wrap.style.width = W * s + 'px';
    wrap.style.height = H * s + 'px';
    wrap.style.fontSize = 20 * s + 'px';
    DPR = Math.min(window.devicePixelRatio || 1, 2.5) * s;
    canvas.width = Math.round(W * DPR);
    canvas.height = Math.round(H * DPR);
    Sprites.dpr = DPR;
  }
  window.addEventListener('resize', resize);
  resize();

  // ================== Construcción de niveles ==================
  function buildLevel(L) {
    const lv = LEVELS[L - 1];
    const rnd = mulberry32(L * 7919 + 101);
    const ri = (a, b) => a + Math.floor(rnd() * (b - a + 1));
    const pick = a => a[Math.floor(rnd() * a.length)];
    const items = [];
    let p = 34;
    const nSeg = 18 + L * 3;
    const mid = Math.floor(nSeg / 2);
    let weaponBarrels = 0, lastType = '', prevType = '';
    const grow = i => Math.floor(i * (0.4 + L * 0.05));
    const good = i => (rnd() < 0.1 + L * 0.02 ? { op: 'x', val: L >= 6 && rnd() < 0.15 ? 3 : 2 } : { op: '+', val: ri(3 + L, 6 + L * 2) + grow(i) });
    const bad = i => (L >= 3 && rnd() < 0.2 ? { op: '÷', val: L >= 6 && rnd() < 0.4 ? 3 : 2 } : { op: '-', val: ri(4 + L, 6 + L * 3) + grow(i) });
    const hpAt = i => (1.6 + L * 0.6) * (1 + i * (0.1 + L * 0.01));
    // Grupo de enemigos; devuelve la profundidad que ocupa
    function horde(at, i, k, cx, spread = 0.16) {
      const et = pick(lv.enemies), hp = hpAt(i);
      const cols = Math.min(5, 1 + Math.ceil(k / 3));
      let rows = 0;
      for (let j = 0; j < k; j++) {
        const row = Math.floor(j / cols), col = j % cols;
        rows = row + 1;
        const x = cx + (col - (cols - 1) / 2) * spread + (rnd() - 0.5) * 0.05;
        const type = rnd() < 0.2 ? pick(lv.enemies) : et;
        items.push({ kind: 'enemy', pos: at + row * 1.2 + rnd() * 0.4, x: clamp(x, -0.92, 0.92), type, hp, size: 1, power: 1, dyn: 1 });
      }
      return rows * 1.2;
    }
    for (let i = 0; i < nSeg; i++) {
      let type;
      if (i === 0) type = 'gates';
      else if (i === 1) type = 'barrel';
      else if (i === 2) type = 'gates';
      else if (i === 3) type = 'horde';
      else if (i === mid) type = 'mini';
      else {
        do {
          const r = rnd();
          type = r < 0.26 ? 'gates' : r < 0.66 ? 'horde' : r < 0.8 ? 'barrel' : 'guarded';
        } while (type === lastType && (type !== 'horde' || prevType === 'horde'));
      }
      prevType = lastType; lastType = type;
      if (type === 'gates' || type === 'guarded') {
        if (type === 'guarded') {
          p += horde(p, i, 3 + Math.floor(L / 2) + Math.floor(i / 4), rnd() < 0.5 ? -0.5 : 0.5, 0.13) + 5;
        }
        let a, b;
        const r = rnd();
        if (i === 0) { a = { op: '+', val: ri(4, 6) + L * 2 }; b = { op: 'x', val: 2 }; }
        else if (i < 3 || r < 0.6) { a = good(i); b = bad(i); }
        else if (r < 0.82) { a = good(i); b = good(i); }
        else { a = bad(i); b = bad(i); }
        if (rnd() < 0.5) [a, b] = [b, a];
        items.push({ kind: 'gate', pos: p, x0: -1, x1: 0, op: a.op, val: a.val });
        items.push({ kind: 'gate', pos: p, x0: 0, x1: 1, op: b.op, val: b.val });
        p += 16 + rnd() * 5;
      } else if (type === 'barrel') {
        const hp = Math.round((8 + L * 5) * (1 + i * 0.12));
        const wantWeapon = weaponBarrels < 6 || rnd() < 0.5;
        if (i > 2 && rnd() < 0.5) {
          const side = rnd() < 0.5 ? -1 : 1;
          items.push({ kind: 'barrel', pos: p, x: side * 0.5, hp, reward: wantWeapon ? 'weapon' : 'squad', amount: ri(4, 6 + L) + grow(i) });
          items.push({ kind: 'barrel', pos: p, x: -side * 0.5, hp: Math.round(hp * 0.8), reward: 'squad', amount: ri(4, 6 + L) + grow(i) });
        } else {
          items.push({ kind: 'barrel', pos: p, x: rnd() * 1.2 - 0.6, hp, reward: wantWeapon ? 'weapon' : 'squad', amount: ri(5, 8 + L) + grow(i) });
        }
        if (wantWeapon) weaponBarrels++;
        p += 15 + rnd() * 4;
      } else if (type === 'mini') {
        // Minijefe con escolta
        const hp = hpAt(i);
        p += horde(p, i, 6 + L, 0, 0.18) + 3;
        items.push({ kind: 'enemy', pos: p, x: 0, type: pick(lv.enemies), hp: hp * (18 + L * 2), size: 3, power: 4 + Math.floor(L / 2), dyn: 10 + L });
        p += 22;
      } else {
        const k = i === 3 ? 3 + L : Math.min(34, 5 + L + Math.floor(i * (0.6 + L * 0.06)));
        let depth;
        if (rnd() < 0.3) {
          // Dos grupos, uno por carril
          const k2 = Math.ceil(k / 2);
          depth = Math.max(horde(p, i, k2, -0.5, 0.14), horde(p, i, k - k2, 0.5, 0.14));
        } else {
          depth = horde(p, i, k, rnd() * 1.0 - 0.5);
        }
        if (rnd() < 0.3 + L * 0.06) {
          items.push({ kind: 'enemy', pos: p + depth + 1.5, x: clamp(rnd() * 1.2 - 0.6, -0.8, 0.8), type: pick(lv.enemies), hp: hpAt(i) * 6, size: 1.9, power: 4, dyn: 5 });
          depth += 2;
        }
        p += depth + 15 + rnd() * 5;
      }
    }
    items.sort((a, b) => a.pos - b.pos);
    return { items, end: p + 22, bossHp: Math.round(300 * Math.pow(1.6, L - 1)), lv };
  }

  // ================== Estado ==================
  const allyKeys = Object.keys(Sprites.ALLIES);
  let G = null;            // partida en curso
  let mode = 'menu';       // menu | play | paused
  const scene = { lv: LEVELS[0], decor: [], off: 0, decorAcc: 0, t: 0 };
  const fx = [];           // partículas en pantalla
  const input = { left: false, right: false, dragging: false, lastX: 0 };

  function spawnDecorRow(z) {
    const lv = scene.lv;
    for (const side of [-1, 1]) {
      if (Math.random() < 0.8) {
        scene.decor.push({
          z: z + Math.random() * 2, x: side * (1.35 + Math.random() * 1.5),
          type: lv.decor[Math.floor(Math.random() * lv.decor.length)],
          s: 0.8 + Math.random() * 0.5, hue: Math.floor(Math.random() * 6),
        });
      }
    }
  }
  function resetScene(lv) {
    scene.lv = lv; scene.decor = []; scene.decorAcc = 0;
    for (let z = -6; z < SPAWN_Z + 10; z += 3.5) spawnDecorRow(z);
  }
  function updateScene(dt, speed) {
    scene.t += dt;
    const dz = speed * dt;
    scene.off += dz;
    for (const d of scene.decor) d.z -= dz;
    scene.decor = scene.decor.filter(d => d.z > -7);
    scene.decorAcc += dz;
    while (scene.decorAcc >= 3.5) { scene.decorAcc -= 3.5; spawnDecorRow(SPAWN_Z + 8); }
  }

  function startLevel(L) {
    const data = buildLevel(L);
    resetScene(data.lv);
    fx.length = 0;
    G = {
      L, lv: data.lv, items: data.items, idx: 0, end: data.end, bossHp: data.bossHp,
      d: 0, count: 5, maxCount: 5, px: 0, weapon: 1, shootT: 0.2,
      gates: [], barrels: [], enemies: [], bullets: [], boss: null, texts: [], members: [],
      time: 0, state: 'play', scroll: SCROLL, shake: 0, bossDrain: 0, bossTouched: false, banner: 2.6, cheer: 0,
    };
    syncMembers();
    mode = 'play';
    Sfx.music(L, 'level');
    showOverlay(null);
    btnPause.classList.remove('hidden');
  }

  function formation(i) {
    if (i === 0) return [0, 0];
    const r = Math.sqrt(i) * 0.052, a = i * 2.39996;
    return [Math.cos(a) * r, Math.sin(a) * r * 3.6];
  }
  function syncMembers() {
    const m = Math.min(G.count, MAX_SHOWN);
    while (G.members.length < m) {
      const i = G.members.length;
      const [tx, tz] = formation(i);
      const type = i === 0 || Math.random() < 0.4 ? save.partner : allyKeys[Math.floor(Math.random() * allyKeys.length)];
      G.members.push({ ox: 0, oz: 0, tx, tz, pop: 0, ph: Math.random() * 6, type });
    }
    if (G.members.length > m) G.members.length = m;
    G.maxCount = Math.max(G.maxCount, G.count);
  }
  const squadRad = () => Math.sqrt(Math.min(G.count, MAX_SHOWN)) * 0.052 + 0.07;
  const clampPx = () => { G.px = clamp(G.px, -0.92, 0.92); };

  function addText(x, z, text, color, size = 1) { G.texts.push({ x, z, text, color, size, t: 0 }); }
  function burst(x, y, color, n = 10, spd = 160, r = 5) {
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2, v = spd * (0.4 + Math.random() * 0.8);
      fx.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - spd * 0.3, life: 0.5 + Math.random() * 0.4, max: 0.9, color, r: r * (0.6 + Math.random() * 0.8) });
    }
  }

  function spawnItem(it, z) {
    if (it.kind === 'gate') G.gates.push({ z, x0: it.x0, x1: it.x1, op: it.op, val: it.val, prog: 0, flash: 0, done: false, used: false });
    else if (it.kind === 'barrel') G.barrels.push({ z, x: it.x, hp: it.hp, maxHp: it.hp, reward: it.reward, amount: it.amount, flash: 0 });
    else {
      const hp = it.hp + Math.min(squadDps(), 200 * WEAPONS[G.weapon].dps) * (0.065 + G.L * 0.007) * (it.dyn || 1);
      G.enemies.push({ z, x: it.x, type: it.type, hp, maxHp: hp, size: it.size, power: it.power, flash: 0, wob: Math.random() * 6, speed: 2.5 + Math.random() });
    }
  }
  const squadDps = () => G.count * WEAPONS[G.weapon].dps;
  const hurtMult = () => Math.max(1, Math.round(G.count / 45));

  const gateStep = g => (3 + G.L * 1.5) * (g.op === 'x' || g.op === '÷' ? 12 : 1);
  function bumpGate(g) {
    if (g.op === '+') g.val = Math.min(g.val + 1, 99);
    else if (g.op === '-') { g.val -= 1; if (g.val <= 0) { g.op = '+'; g.val = 0; Sfx.tick(); } }
    else if (g.op === 'x') g.val = Math.min(g.val + 1, 5);
    else if (g.op === '÷') { g.val -= 1; if (g.val <= 1) { g.op = 'x'; g.val = 1; Sfx.tick(); } }
  }
  function applyGate(g) {
    const before = G.count;
    let n = before;
    if (g.op === '+') n += g.val;
    else if (g.op === '-') n -= g.val;
    else if (g.op === 'x') n *= g.val;
    else if (g.op === '÷') n = Math.ceil(n / g.val);
    n = clamp(n, 0, 500);
    G.count = n;
    const diff = n - before;
    addText(G.px, 1, (diff >= 0 ? '+' : '') + diff, diff >= 0 ? '#7CFF6B' : '#FF5A5A', 1.5);
    const y = sy(0) - 60, x = sx(G.px, 0);
    burst(x, y, diff >= 0 ? '#7fd3ff' : '#ff7a7a', 18, 220, 6);
    if (diff >= 0) { Sfx.good(); G.cheer = 0.6; } else { Sfx.bad(); G.shake = 0.25; }
    g.used = true;
    syncMembers();
  }

  function lose() {
    if (G.state !== 'play') return;
    G.state = 'lose'; G.endT = 0;
    Sfx.lose();
    setTimeout(() => showResult(false), 1400);
  }
  function win() {
    if (G.state !== 'play') return;
    G.state = 'win'; G.endT = 0;
    const ratio = G.count / Math.max(1, G.maxCount);
    G.stars = !G.bossTouched && ratio >= 0.6 ? 3 : ratio >= 0.3 ? 2 : 1;
    save.stars[G.L] = Math.max(save.stars[G.L] || 0, G.stars);
    if (G.L < LEVELS.length) save.unlocked = Math.max(save.unlocked, G.L + 1);
    persist();
    Sfx.win();
    const b = G.boss;
    for (let k = 0; k < 4; k++) burst(sx(b.x, b.z) + (Math.random() - 0.5) * 120, sy(b.z) - 80 - Math.random() * 80, ['#ffd54f', '#ff7ad9', '#7fd3ff', '#8dff5a'][k], 25, 300, 8);
    setTimeout(() => showResult(true), 1700);
  }

  function damage(kind, t, dmg) {
    if (kind === 'gate') {
      t.prog += dmg; t.flash = 0.08;
      const step = gateStep(t);
      let guard = 0;
      while (t.prog >= step && guard++ < 50) { t.prog -= step; bumpGate(t); }
    } else if (kind === 'barrel') {
      t.hp -= dmg; t.flash = 0.08; Sfx.hit();
      if (t.hp <= 0) {
        t.dead = true;
        const x = sx(t.x, t.z), y = sy(t.z) - 35 * sc(t.z);
        burst(x, y, '#c98a4b', 14, 200, 6); burst(x, y, '#ffd54f', 10, 160, 4);
        if (t.reward === 'weapon' && G.weapon < 5) {
          G.weapon++;
          addText(t.x, t.z, '¡' + WEAPONS[G.weapon].name + '!', '#ffe14d', 1.2);
          Sfx.upgrade();
        } else {
          const n = t.reward === 'weapon' ? 6 : t.amount;
          G.count = Math.min(500, G.count + n);
          addText(t.x, t.z, '+' + n + ' amigos', '#7CFF6B', 1.2);
          Sfx.good(); syncMembers();
        }
      }
    } else if (kind === 'enemy') {
      t.hp -= dmg; t.flash = 0.08;
      if (t.hp <= 0) {
        t.dead = true; Sfx.pop();
        burst(sx(t.x, t.z), sy(t.z) - 20 * sc(t.z) * t.size, Sprites.ENEMIES[t.type].body, 8 + t.size * 4, 140, 5 * sc(t.z) + 2);
      }
    } else if (kind === 'boss') {
      t.hp -= dmg; t.flash = 0.06; Sfx.hit();
      if (t.hp <= 0) { t.hp = 0; win(); }
    }
  }

  // ================== Lógica ==================
  function update(dt) {
    if (!G) return;
    G.time += dt;
    if (G.banner > 0) G.banner -= dt;
    if (G.shake > 0) G.shake -= dt;
    if (G.cheer > 0) G.cheer -= dt;
    for (const t of G.texts) t.t += dt;
    G.texts = G.texts.filter(t => t.t < 1.3);
    for (const m of G.members) {
      m.ox += (m.tx - m.ox) * Math.min(1, dt * 8);
      m.oz += (m.tz - m.oz) * Math.min(1, dt * 8);
      m.pop = Math.min(1, m.pop + dt * 4);
    }
    if (G.state !== 'play') {
      G.endT += dt;
      G.scroll *= Math.max(0, 1 - dt * 3);
      updateScene(dt, G.scroll);
      return;
    }

    const kdir = (input.right ? 1 : 0) - (input.left ? 1 : 0);
    if (kdir) { G.px += kdir * 1.9 * dt; clampPx(); }

    const targetScroll = G.boss ? 0 : SCROLL;
    G.scroll += (targetScroll - G.scroll) * Math.min(1, dt * 1.5);
    const dz = G.scroll * dt;
    G.d += dz;
    updateScene(dt, G.scroll);

    while (G.idx < G.items.length && G.items[G.idx].pos - G.d <= SPAWN_Z) {
      const it = G.items[G.idx++];
      spawnItem(it, it.pos - G.d);
    }
    if (!G.boss && G.d >= G.end) {
      const bhp = Math.round(G.bossHp + squadDps() * (14 + G.L * 0.6));
      G.boss = { z: 50, x: 0, type: G.lv.boss, hp: bhp, maxHp: bhp, size: 5, flash: 0, speed: 2.3, wob: 0 };
      Sfx.boss();
      Sfx.music(G.L, 'boss');
    }

    // Movimiento de objetos
    for (const g of G.gates) { g.z -= dz; if (g.flash > 0) g.flash -= dt; }
    for (const b of G.barrels) { b.z -= dz; if (b.flash > 0) b.flash -= dt; }
    for (const e of G.enemies) {
      e.z -= dz + (e.z < 24 ? e.speed : 0) * dt; e.wob += dt * 9;
      if (e.flash > 0) e.flash -= dt;
      if (e.z < 16 && e.z > 0) e.x += clamp(G.px - e.x, -1, 1) * 0.35 * dt;
    }
    const B = G.boss;
    if (B) {
      B.wob += dt * 4; if (B.flash > 0) B.flash -= dt;
      B.x += (G.px - B.x) * 0.6 * dt;
      if (B.z > 1.6) B.z -= B.speed * dt;
      else {
        if (!G.bossTouched) { G.bossTouched = true; Sfx.ouch(); }
        G.bossDrain += (4 + G.L) * hurtMult() * dt;
        while (G.bossDrain >= 1 && G.count > 0) {
          G.bossDrain -= 1; G.count--; G.shake = 0.15;
          burst(sx(G.px, 0), sy(0) - 30, '#ff7a7a', 4, 150, 4);
        }
        syncMembers();
      }
    }

    // Disparo
    const wp = WEAPONS[G.weapon];
    G.shootT -= dt;
    if (G.shootT <= 0 && G.count > 0) {
      G.shootT = Math.max(0, G.shootT + wp.int);
      const nm = G.members.length;
      const nb = Math.min(G.count, 6 + G.weapon * 2, nm);
      const dmg = (G.count * wp.dps * wp.int) / nb;
      for (let k = 0; k < nb; k++) {
        const m = G.members[nb === nm ? k : Math.floor(Math.random() * nm)];
        G.bullets.push({ x: G.px + m.ox, z: m.oz + 0.4, dmg, life: BULLET_RANGE, color: Sprites.ALLIES[m.type].bullet });
      }
      Sfx.shoot();
    }

    // Balas
    for (const b of G.bullets) {
      const z0 = b.z;
      b.z += BULLET_SPEED * dt; b.life -= BULLET_SPEED * dt;
      let hit = null, hk = '', hz = 1e9;
      const lo = z0 - 0.4, hi = b.z + 0.4;
      for (const g of G.gates) {
        if (g.used || g.done) continue;
        if (g.z >= lo && g.z <= hi && b.x >= g.x0 && b.x < g.x1 && g.z < hz) { hit = g; hk = 'gate'; hz = g.z; }
      }
      for (const t of G.barrels) {
        if (t.dead) continue;
        if (t.z >= lo && t.z <= hi && Math.abs(b.x - t.x) < 0.17 && t.z < hz) { hit = t; hk = 'barrel'; hz = t.z; }
      }
      for (const e of G.enemies) {
        if (e.dead) continue;
        if (e.z >= lo - 0.3 && e.z <= hi && Math.abs(b.x - e.x) < 0.06 + 0.075 * e.size && e.z < hz) { hit = e; hk = 'enemy'; hz = e.z; }
      }
      if (B && B.hp > 0 && B.z >= lo - 1 && B.z <= hi && Math.abs(b.x - B.x) < 0.55 && B.z < hz) { hit = B; hk = 'boss'; hz = B.z; }
      if (hit) { b.dead = true; damage(hk, hit, b.dmg); if (G.state !== 'play') break; }
      else if (b.life <= 0) b.dead = true;
    }
    G.bullets = G.bullets.filter(b => !b.dead);
    if (G.state !== 'play') return;

    // Cruzar puertas
    for (const g of G.gates) {
      if (!g.done && g.z <= 0) {
        g.done = true;
        if (G.px >= g.x0 && G.px < g.x1) applyGate(g);
      }
    }
    // Chocar con barriles
    const sr = squadRad();
    for (const t of G.barrels) {
      if (t.dead || t.bumped) continue;
      if (t.z <= 0.6 && t.z > -1 && Math.abs(t.x - G.px) < sr + 0.12) {
        t.bumped = true; t.dead = true;
        const lost = Math.min(G.count, 2 * hurtMult());
        G.count -= lost; G.shake = 0.2; Sfx.ouch();
        addText(G.px, 0.5, '-' + lost, '#FF5A5A', 1.2);
        burst(sx(t.x, t.z), sy(t.z) - 30, '#c98a4b', 12, 200, 6);
        syncMembers();
      }
    }
    // Enemigos que alcanzan al grupo
    for (const e of G.enemies) {
      if (e.dead) continue;
      if (e.z <= 0.7 && e.z > -1.5 && Math.abs(e.x - G.px) < sr + 0.05 * e.size) {
        e.dead = true;
        const lost = Math.min(G.count, e.power * hurtMult());
        G.count -= lost; G.shake = 0.2; Sfx.ouch();
        addText(G.px, 0.5, '-' + lost, '#FF5A5A', 1.1);
        burst(sx(e.x, e.z), sy(e.z) - 20, Sprites.ENEMIES[e.type].body, 10, 180, 5);
        syncMembers();
      }
      if (e.z < -3) e.dead = true;
    }
    G.gates = G.gates.filter(g => g.z > -4);
    G.barrels = G.barrels.filter(t => !t.dead && t.z > -4);
    G.enemies = G.enemies.filter(e => !e.dead);
    if (G.count <= 0) lose();
  }

  function updateFx(dt) {
    for (const p of fx) { p.life -= dt; p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 500 * dt; }
    for (let i = fx.length - 1; i >= 0; i--) if (fx[i].life <= 0) fx.splice(i, 1);
  }

  // ================== Dibujo: escenario ==================
  function quad(xa, xb, za, zb, color) {
    ctx.beginPath();
    ctx.moveTo(sx(xa, za), sy(za)); ctx.lineTo(sx(xb, za), sy(za));
    ctx.lineTo(sx(xb, zb), sy(zb)); ctx.lineTo(sx(xa, zb), sy(zb));
    ctx.closePath(); ctx.fillStyle = color; ctx.fill();
  }
  function circle(x, y, r, color) { ctx.beginPath(); ctx.arc(x, y, Math.max(0.1, r), 0, Math.PI * 2); ctx.fillStyle = color; ctx.fill(); }

  function drawSky(lv) {
    const g = ctx.createLinearGradient(0, 0, 0, HORIZON);
    g.addColorStop(0, lv.sky[0]); g.addColorStop(1, lv.sky[1]);
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, HORIZON + 2);
    const t = scene.t;
    if (lv.night) {
      for (let i = 0; i < 40; i++) {
        const x = (i * 97.3) % W, y = (i * 53.7) % (HORIZON - 40);
        ctx.globalAlpha = 0.5 + 0.5 * Math.sin(t * 2 + i);
        circle(x, y, 1.5 + (i % 3) * 0.6, '#fff');
      }
      ctx.globalAlpha = 1;
      circle(430, 80, 34, '#fff6d0'); circle(445, 70, 30, lv.sky[0]);
    } else if (lv.scenery !== 'volcano' && lv.scenery !== 'castle') {
      circle(440, 85, 38, 'rgba(255,240,150,.9)');
      for (let i = 0; i < 3; i++) {
        const x = ((i * 190 + t * 8) % (W + 200)) - 100, y = 60 + i * 55;
        ctx.fillStyle = 'rgba(255,255,255,.85)';
        ctx.beginPath(); ctx.ellipse(x, y, 50, 16, 0, 0, Math.PI * 2); ctx.ellipse(x + 30, y - 10, 30, 16, 0, 0, Math.PI * 2); ctx.ellipse(x - 28, y - 6, 24, 12, 0, 0, Math.PI * 2); ctx.fill();
      }
    }
    // Paisaje lejano
    const [c1, c2] = lv.hills;
    const hb = HORIZON + 1;
    ctx.fillStyle = c1;
    switch (lv.scenery) {
      case 'mountains':
      case 'volcano': {
        ctx.beginPath(); ctx.moveTo(0, hb);
        const peaks = lv.scenery === 'volcano' ? [[0, 250], [90, 210], [170, 260], [270, 130], [370, 255], [450, 220], [540, 250]] : [[0, 240], [80, 170], [160, 230], [250, 140], [330, 220], [420, 160], [540, 230]];
        for (const [x, y] of peaks) ctx.lineTo(x, y);
        ctx.lineTo(W, hb); ctx.closePath(); ctx.fill();
        if (lv.scenery === 'mountains') {
          ctx.fillStyle = '#fff';
          for (const [x, y] of [[80, 170], [250, 140], [420, 160]]) { ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x - 22, y + 26); ctx.lineTo(x + 22, y + 26); ctx.closePath(); ctx.fill(); }
        } else {
          ctx.fillStyle = '#ff6a1f'; ctx.beginPath(); ctx.moveTo(255, 140); ctx.lineTo(285, 140); ctx.lineTo(300, 180); ctx.lineTo(240, 180); ctx.closePath(); ctx.fill();
          for (let i = 0; i < 5; i++) { ctx.globalAlpha = 0.35; circle(270 + Math.sin(t + i) * 12, 120 - ((t * 20 + i * 18) % 90), 10 + i * 2, '#7a5a5a'); }
          ctx.globalAlpha = 1;
        }
        break;
      }
      case 'castle': {
        ctx.fillRect(150, 200, 240, hb - 200);
        for (const [x, w, h] of [[130, 50, 170], [360, 50, 170], [240, 60, 220]]) {
          ctx.fillStyle = c1; ctx.fillRect(x, hb - h, w, h);
          ctx.fillStyle = '#7c3aed'; ctx.beginPath(); ctx.moveTo(x - 6, hb - h); ctx.lineTo(x + w / 2, hb - h - 50); ctx.lineTo(x + w + 6, hb - h); ctx.closePath(); ctx.fill();
          ctx.fillStyle = '#ffd54f'; ctx.fillRect(x + w / 2 - 6, hb - h + 30, 12, 18);
        }
        break;
      }
      case 'sea': {
        ctx.fillStyle = c1; ctx.fillRect(0, hb - 26, W, 27);
        ctx.fillStyle = 'rgba(255,255,255,.6)';
        for (let i = 0; i < 8; i++) ctx.fillRect(((i * 80 + t * 15) % (W + 60)) - 30, hb - 18 + (i % 3) * 5, 24, 2);
        break;
      }
      default: {
        ctx.beginPath(); ctx.moveTo(0, hb);
        for (let x = 0; x <= W; x += 20) ctx.lineTo(x, hb - 40 - Math.sin(x * 0.012) * 25 - Math.sin(x * 0.031 + 1) * 12);
        ctx.lineTo(W, hb); ctx.closePath(); ctx.fill();
        if (lv.scenery === 'forest') {
          ctx.fillStyle = c2;
          for (let x = -10; x < W + 20; x += 26) { const h = 40 + ((x * 7) % 30); ctx.beginPath(); ctx.moveTo(x - 14, hb); ctx.lineTo(x, hb - h); ctx.lineTo(x + 14, hb); ctx.closePath(); ctx.fill(); }
        }
      }
    }
    ctx.fillStyle = c2;
    ctx.beginPath(); ctx.moveTo(0, hb);
    for (let x = 0; x <= W; x += 20) ctx.lineTo(x, hb - 14 - Math.sin(x * 0.02 + 2) * 8);
    ctx.lineTo(W, hb); ctx.closePath(); ctx.fill();
  }

  function drawGround(lv) {
    ctx.fillStyle = lv.grass; ctx.fillRect(0, HORIZON, W, H - HORIZON);
    const off = scene.off, base = Math.floor(off / 4), frac = off % 4;
    ctx.fillStyle = lv.grass2;
    for (let i = -2; i < 40; i++) {
      if ((((i + base) % 2) + 2) % 2) continue;
      const za = i * 4 - frac, zb = za + 4;
      const ya = sy(za), yb = sy(zb);
      ctx.fillRect(0, yb, W, ya - yb + 0.5);
    }
    if (lv.sea) {
      ctx.fillStyle = '#38b6d8';
      ctx.beginPath(); ctx.moveTo(0, H); ctx.lineTo(sx(-2.2, -6), sy(-6)); ctx.lineTo(sx(-2.2, 400), sy(400)); ctx.lineTo(0, sy(400)); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,.8)'; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(sx(-2.2, -6), sy(-6)); ctx.lineTo(sx(-2.2, 400), sy(400)); ctx.stroke();
    }
    // Carretera
    const zn = -6, zf = 400;
    ctx.fillStyle = lv.road;
    ctx.beginPath();
    ctx.moveTo(sx(-1.1, zn), sy(zn)); ctx.lineTo(sx(1.1, zn), sy(zn));
    ctx.lineTo(sx(1.1, zf), sy(zf)); ctx.lineTo(sx(-1.1, zf), sy(zf));
    ctx.closePath(); ctx.fill();
    const f2 = off % 4;
    for (let i = -2; i < 30; i++) {
      const za = i * 2 - f2, zb = za + 2;
      if (za > 120) break;
      const col = lv.curb[((i % 2) + 2) % 2];
      quad(-1.12, -1.0, za, zb, col);
      quad(1.0, 1.12, za, zb, col);
    }
    const f6 = off % 6;
    for (let i = -1; i < 20; i++) {
      const za = i * 6 - f6;
      quad(-0.025, 0.025, za, za + 3, 'rgba(255,255,255,.85)');
    }
  }

  function drawDecor(d) {
    const s = sc(d.z) * d.s, x = sx(d.x, d.z), y = sy(d.z);
    if (x < -160 || x > W + 160) return;
    const night = scene.lv.night;
    switch (d.type) {
      case 'tree':
        ctx.fillStyle = '#7a4a24'; ctx.fillRect(x - 7 * s, y - 45 * s, 14 * s, 45 * s);
        circle(x, y - 70 * s, 36 * s, '#3f9e3a'); circle(x - 26 * s, y - 52 * s, 24 * s, '#4cb045'); circle(x + 26 * s, y - 54 * s, 24 * s, '#4cb045');
        circle(x - 10 * s, y - 82 * s, 12 * s, 'rgba(255,255,255,.18)');
        break;
      case 'pine':
      case 'snowpine': {
        ctx.fillStyle = '#6a4020'; ctx.fillRect(x - 6 * s, y - 25 * s, 12 * s, 25 * s);
        const col = d.type === 'pine' ? (night ? '#1c3a2c' : '#2a7a3a') : '#2f6b4a';
        for (let k = 0; k < 3; k++) {
          const yy = y - 20 * s - k * 30 * s, w = (42 - k * 10) * s;
          ctx.fillStyle = col; ctx.beginPath(); ctx.moveTo(x - w, yy); ctx.lineTo(x, yy - 48 * s); ctx.lineTo(x + w, yy); ctx.closePath(); ctx.fill();
          if (d.type === 'snowpine') { ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.moveTo(x - w * 0.45, yy - 26 * s); ctx.lineTo(x, yy - 48 * s); ctx.lineTo(x + w * 0.45, yy - 26 * s); ctx.closePath(); ctx.fill(); }
        }
        break;
      }
      case 'bush':
        circle(x - 14 * s, y - 12 * s, 16 * s, '#4fae3f'); circle(x + 14 * s, y - 12 * s, 16 * s, '#4fae3f'); circle(x, y - 22 * s, 18 * s, '#5cc04a');
        break;
      case 'flower': {
        const cols = ['#ff6fa8', '#ffd84d', '#ffffff', '#b98cff', '#ff8a3d', '#6fd3ff'];
        ctx.strokeStyle = '#3a8a2a'; ctx.lineWidth = 3 * s; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x, y - 26 * s); ctx.stroke();
        for (let k = 0; k < 5; k++) { const a = k * 1.2566; circle(x + Math.cos(a) * 8 * s, y - 30 * s + Math.sin(a) * 8 * s, 6 * s, cols[d.hue]); }
        circle(x, y - 30 * s, 5 * s, '#ffb300');
        break;
      }
      case 'mushroom': {
        ctx.fillStyle = '#f5ead0'; ctx.fillRect(x - 7 * s, y - 26 * s, 14 * s, 26 * s);
        const cap = night ? ['#b56bff', '#ff6fd8', '#6fd3ff'][d.hue % 3] : '#e53935';
        if (night) { ctx.globalAlpha = 0.25; circle(x, y - 30 * s, 40 * s, cap); ctx.globalAlpha = 1; }
        ctx.fillStyle = cap; ctx.beginPath(); ctx.ellipse(x, y - 26 * s, 26 * s, 20 * s, 0, Math.PI, 0); ctx.fill();
        circle(x - 10 * s, y - 36 * s, 4 * s, '#fff'); circle(x + 8 * s, y - 32 * s, 5 * s, '#fff'); circle(x + 1 * s, y - 42 * s, 3 * s, '#fff');
        break;
      }
      case 'palm': {
        ctx.strokeStyle = '#9a6a3a'; ctx.lineWidth = 10 * s; ctx.lineCap = 'round';
        ctx.beginPath(); ctx.moveTo(x, y); ctx.quadraticCurveTo(x + 18 * s, y - 60 * s, x + 6 * s, y - 120 * s); ctx.stroke();
        ctx.strokeStyle = '#2fa84a'; ctx.lineWidth = 9 * s;
        for (const a of [-2.6, -2.0, -1.2, -0.5, 0.1]) {
          ctx.beginPath(); ctx.moveTo(x + 6 * s, y - 120 * s);
          ctx.quadraticCurveTo(x + 6 * s + Math.cos(a) * 40 * s, y - 135 * s + Math.sin(a) * 25 * s, x + 6 * s + Math.cos(a) * 60 * s, y - 110 * s + Math.sin(a) * 20 * s);
          ctx.stroke();
        }
        circle(x + 2 * s, y - 112 * s, 6 * s, '#6b4a2a'); circle(x + 12 * s, y - 114 * s, 6 * s, '#6b4a2a');
        ctx.lineCap = 'butt';
        break;
      }
      case 'starfish':
        Sprites.star(ctx, x, y - 8 * s, 16 * s, 7 * s, 5, '#ff8a5a', '#c0502a', 2 * s);
        break;
      case 'umbrella': {
        ctx.fillStyle = '#ddd'; ctx.fillRect(x - 2 * s, y - 80 * s, 4 * s, 80 * s);
        const cols = ['#ff5a5a', '#fff', '#2fa8ff', '#fff', '#ffd84d', '#fff'];
        for (let k = 0; k < 6; k++) {
          ctx.fillStyle = cols[(k + d.hue) % 6];
          ctx.beginPath(); ctx.moveTo(x, y - 80 * s); ctx.arc(x, y - 80 * s, 46 * s, Math.PI + k * Math.PI / 6, Math.PI + (k + 1) * Math.PI / 6); ctx.closePath(); ctx.fill();
        }
        break;
      }
      case 'cactus': {
        ctx.fillStyle = '#3c9a4a';
        const rr = (a, b, c, e) => { ctx.beginPath(); ctx.roundRect ? ctx.roundRect(a, b, c, e, 8 * s) : ctx.rect(a, b, c, e); ctx.fill(); };
        rr(x - 10 * s, y - 80 * s, 20 * s, 80 * s);
        rr(x - 30 * s, y - 55 * s, 12 * s, 28 * s); rr(x - 30 * s, y - 34 * s, 24 * s, 10 * s);
        rr(x + 18 * s, y - 65 * s, 12 * s, 30 * s); rr(x + 6 * s, y - 42 * s, 24 * s, 10 * s);
        break;
      }
      case 'rock':
      case 'lavarock':
        ctx.fillStyle = d.type === 'rock' ? '#9a8f84' : '#2f2422';
        ctx.beginPath(); ctx.moveTo(x - 28 * s, y); ctx.lineTo(x - 22 * s, y - 22 * s); ctx.lineTo(x - 4 * s, y - 34 * s); ctx.lineTo(x + 20 * s, y - 24 * s); ctx.lineTo(x + 30 * s, y); ctx.closePath(); ctx.fill();
        if (d.type === 'lavarock') {
          ctx.strokeStyle = '#ff7a1f'; ctx.lineWidth = 3 * s; ctx.beginPath(); ctx.moveTo(x - 14 * s, y - 6 * s); ctx.lineTo(x - 4 * s, y - 20 * s); ctx.lineTo(x + 10 * s, y - 12 * s); ctx.stroke();
          ctx.globalAlpha = 0.25; circle(x, y - 14 * s, 30 * s, '#ff6a1f'); ctx.globalAlpha = 1;
        }
        break;
      case 'snowman':
        circle(x, y - 18 * s, 20 * s, '#fff'); circle(x, y - 48 * s, 14 * s, '#fff');
        circle(x - 5 * s, y - 52 * s, 2 * s, '#222'); circle(x + 5 * s, y - 52 * s, 2 * s, '#222');
        ctx.fillStyle = '#ff8a1f'; ctx.beginPath(); ctx.moveTo(x, y - 48 * s); ctx.lineTo(x + 12 * s, y - 46 * s); ctx.lineTo(x, y - 44 * s); ctx.fill();
        ctx.fillStyle = '#e53935'; ctx.fillRect(x - 12 * s, y - 37 * s, 24 * s, 5 * s);
        break;
      case 'deadtree':
        ctx.strokeStyle = night ? '#1e1830' : '#2a1a14'; ctx.lineCap = 'round';
        ctx.lineWidth = 9 * s; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x, y - 80 * s); ctx.stroke();
        ctx.lineWidth = 5 * s;
        ctx.beginPath(); ctx.moveTo(x, y - 50 * s); ctx.lineTo(x - 28 * s, y - 80 * s); ctx.moveTo(x, y - 65 * s); ctx.lineTo(x + 26 * s, y - 95 * s); ctx.moveTo(x - 18 * s, y - 70 * s); ctx.lineTo(x - 30 * s, y - 68 * s); ctx.stroke();
        ctx.lineCap = 'butt';
        break;
      case 'lantern': {
        ctx.fillStyle = '#222'; ctx.fillRect(x - 3 * s, y - 70 * s, 6 * s, 70 * s);
        const gr = ctx.createRadialGradient(x, y - 76 * s, 0, x, y - 76 * s, 40 * s);
        gr.addColorStop(0, 'rgba(255,220,120,.9)'); gr.addColorStop(1, 'rgba(255,220,120,0)');
        ctx.fillStyle = gr; ctx.fillRect(x - 40 * s, y - 116 * s, 80 * s, 80 * s);
        circle(x, y - 76 * s, 8 * s, '#ffe08a');
        break;
      }
      case 'tower':
        ctx.fillStyle = '#6a5a88'; ctx.fillRect(x - 18 * s, y - 100 * s, 36 * s, 100 * s);
        for (let k = 0; k < 3; k++) ctx.fillRect(x - 18 * s + k * 14 * s, y - 110 * s, 8 * s, 10 * s);
        ctx.fillStyle = '#ffd54f'; ctx.fillRect(x - 5 * s, y - 70 * s, 10 * s, 14 * s);
        break;
      case 'crystal': {
        const cols = ['#c084fc', '#f472b6', '#67e8f9'];
        for (const [dx, h, w] of [[-12, 50, 10], [4, 70, 13], [18, 40, 9]]) {
          ctx.fillStyle = cols[(d.hue + dx + 30) % 3];
          ctx.beginPath(); ctx.moveTo(x + dx * s - w * s, y); ctx.lineTo(x + dx * s - w * 0.7 * s, y - h * s * 0.8); ctx.lineTo(x + dx * s, y - h * s); ctx.lineTo(x + dx * s + w * 0.7 * s, y - h * s * 0.8); ctx.lineTo(x + dx * s + w * s, y); ctx.closePath(); ctx.fill();
        }
        break;
      }
    }
  }

  // ================== Dibujo: entidades ==================
  function shadow(x, y, rx) {
    ctx.fillStyle = 'rgba(0,0,0,.22)';
    ctx.beginPath(); ctx.ellipse(x, y, rx, rx * 0.32, 0, 0, Math.PI * 2); ctx.fill();
  }
  function outlinedText(text, x, y, size, fill, stroke = '#1b1340') {
    ctx.font = `900 ${size}px "Trebuchet MS", "Arial Rounded MT Bold", system-ui, sans-serif`;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.lineJoin = 'round'; ctx.lineWidth = Math.max(2, size * 0.16); ctx.strokeStyle = stroke;
    ctx.strokeText(text, x, y); ctx.fillStyle = fill; ctx.fillText(text, x, y);
  }
  function roundRect(x, y, w, h, r) {
    ctx.beginPath();
    if (ctx.roundRect) ctx.roundRect(x, y, w, h, r); else ctx.rect(x, y, w, h);
  }

  function drawGate(g) {
    if (g.used) return;
    const z = g.z, s = sc(z);
    const xa = sx(g.x0 + 0.05, z), xb = sx(g.x1 - 0.05, z), yb = sy(z), h = 125 * s;
    const goodGate = g.op === '+' || g.op === 'x';
    let alpha = 1;
    if (g.done) alpha = clamp(1 + g.z / 2, 0, 1);
    ctx.globalAlpha = alpha;
    const fill = goodGate ? 'rgba(40,150,255,0.5)' : 'rgba(255,55,70,0.5)';
    const edge = goodGate ? '#8fd8ff' : '#ff9aa4';
    roundRect(xa, yb - h, xb - xa, h, 10 * s);
    ctx.fillStyle = g.flash > 0 ? (goodGate ? 'rgba(140,210,255,0.75)' : 'rgba(255,150,160,0.75)') : fill;
    ctx.fill();
    ctx.lineWidth = 5 * s; ctx.strokeStyle = edge; ctx.stroke();
    // brillo
    const gr = ctx.createLinearGradient(0, yb - h, 0, yb);
    gr.addColorStop(0, 'rgba(255,255,255,.35)'); gr.addColorStop(0.5, 'rgba(255,255,255,0)');
    ctx.fillStyle = gr; ctx.fill();
    // postes
    ctx.fillStyle = goodGate ? '#1d5fa8' : '#a8202e';
    ctx.fillRect(xa - 4 * s, yb - h - 6 * s, 8 * s, h + 6 * s);
    ctx.fillRect(xb - 4 * s, yb - h - 6 * s, 8 * s, h + 6 * s);
    const sym = g.op === 'x' ? '×' : g.op;
    outlinedText(sym + g.val, (xa + xb) / 2, yb - h * 0.52, 60 * s * (g.flash > 0 ? 1.08 : 1), '#fff');
    // progreso de mejora
    const p = clamp(g.prog / gateStep(g), 0, 1);
    if (p > 0.01) {
      const bw = (xb - xa) * 0.6, bx = (xa + xb) / 2 - bw / 2, by = yb - h * 0.16;
      ctx.fillStyle = 'rgba(0,0,0,.35)'; ctx.fillRect(bx, by, bw, 7 * s);
      ctx.fillStyle = '#fff'; ctx.fillRect(bx, by, bw * p, 7 * s);
    }
    ctx.globalAlpha = 1;
  }

  function drawBarrel(t) {
    const z = t.z, s = sc(z), x = sx(t.x, z), y = sy(z);
    const w = 66 * s, h = 78 * s;
    const k = t.flash > 0 ? 1.06 : 1;
    shadow(x, y, w * 0.6);
    ctx.save(); ctx.translate(x, y); ctx.scale(k, k);
    ctx.fillStyle = t.reward === 'weapon' ? '#b5652b' : '#3f9a5a';
    roundRect(-w / 2, -h, w, h, 12 * s); ctx.fill();
    ctx.lineWidth = 3 * s; ctx.strokeStyle = 'rgba(0,0,0,.35)'; ctx.stroke();
    ctx.fillStyle = 'rgba(0,0,0,.25)';
    ctx.fillRect(-w / 2, -h * 0.8, w, 6 * s); ctx.fillRect(-w / 2, -h * 0.25, w, 6 * s);
    ctx.fillStyle = 'rgba(255,255,255,.18)'; ctx.fillRect(-w / 2 + 6 * s, -h + 6 * s, 8 * s, h - 12 * s);
    outlinedText(String(Math.ceil(t.hp)), 0, -h * 0.52, 34 * s, '#fff');
    // icono de recompensa
    if (t.reward === 'weapon' && G.weapon < 5) {
      Sprites.star(ctx, 0, -h - 26 * s, 22 * s, 10 * s, 5, '#ffe14d', '#b38600', 3 * s);
      outlinedText('ARMA', 0, -h - 58 * s, 18 * s, '#ffe14d');
    } else {
      Sprites.draw(ctx, 'ally', save.partner, -10 * s, -h - 6 * s, 16 * s);
      outlinedText('+' + (t.reward === 'weapon' ? 6 : t.amount), 18 * s, -h - 24 * s, 22 * s, '#7CFF6B');
    }
    ctx.restore();
  }

  function drawEnemy(e) {
    const z = e.z, s = sc(z), x = sx(e.x, z), y = sy(z);
    const R = 21 * s * e.size * (e.flash > 0 ? 1.1 : 1);
    const hop = Math.abs(Math.sin(e.wob)) * 6 * s;
    shadow(x, y, R * 0.9);
    Sprites.draw(ctx, 'enemy', e.type, x, y - hop, R);
    if (e.size > 1) {
      outlinedText(String(Math.ceil(e.hp)), x, y - R * 2.6 - hop, 20 * s * e.size * 0.8, '#ffd0d0');
    }
  }

  function drawBoss(b) {
    const z = b.z, s = sc(z), x = sx(b.x, z), y = sy(z);
    const R = 22 * s * b.size * (b.flash > 0 ? 1.03 : 1);
    const hop = Math.abs(Math.sin(b.wob)) * 8 * s;
    if (G.state === 'win') {
      ctx.globalAlpha = clamp(1 - G.endT * 1.2, 0, 1);
    }
    shadow(x, y, R);
    Sprites.draw(ctx, 'enemy', b.type, x, y - hop, R);
    // corona
    const cy = y - hop - R * 2.1, cw = R * 0.7;
    ctx.fillStyle = '#ffd54f'; ctx.strokeStyle = '#a07000'; ctx.lineWidth = 3 * s;
    ctx.beginPath(); ctx.moveTo(x - cw, cy); ctx.lineTo(x - cw, cy - R * 0.45); ctx.lineTo(x - cw * 0.5, cy - R * 0.2); ctx.lineTo(x, cy - R * 0.55); ctx.lineTo(x + cw * 0.5, cy - R * 0.2); ctx.lineTo(x + cw, cy - R * 0.45); ctx.lineTo(x + cw, cy); ctx.closePath(); ctx.fill(); ctx.stroke();
    circle(x, cy - R * 0.12, R * 0.08, '#ff3d7a');
    ctx.globalAlpha = 1;
  }

  function drawMember(m) {
    const z = m.oz, s = sc(z), x = sx(G.px + m.ox, z), y = sy(z);
    const pop = m.pop < 1 ? 0.4 + 0.6 * m.pop + Math.sin(m.pop * Math.PI) * 0.3 : 1;
    const R = 20 * s * pop;
    let hop = G.state === 'play' ? Math.abs(Math.sin(G.time * 11 + m.ph)) * 5 * s : 0;
    if (G.cheer > 0) hop += Math.sin((1 - G.cheer / 0.6) * Math.PI) * (14 + (m.ph % 1) * 14) * s;
    if (G.state === 'win') hop = Math.abs(Math.sin(G.time * 7 + m.ph)) * 26 * s;
    shadow(x, y, R * 0.85);
    if (G.state === 'lose') ctx.globalAlpha = clamp(1 - G.endT, 0, 1);
    Sprites.draw(ctx, 'ally', m.type, x, y - hop, R);
    ctx.globalAlpha = 1;
  }

  function drawBullet(b) {
    const s = sc(b.z), x = sx(b.x, b.z), y = sy(b.z) - 22 * s;
    ctx.globalAlpha = clamp(b.life / 6, 0, 1);
    circle(x, y, 7 * s, b.color + '55');
    circle(x, y, 4 * s, b.color);
    circle(x, y, 2 * s, '#fff');
    ctx.globalAlpha = 1;
  }

  function drawWorld() {
    const list = [];
    for (const d of scene.decor) list.push([d.z, 0, d]);
    if (G) {
      for (const g of G.gates) list.push([g.z + 0.01, 1, g]);
      for (const t of G.barrels) list.push([t.z, 2, t]);
      for (const e of G.enemies) list.push([e.z, 3, e]);
      if (G.boss) list.push([G.boss.z, 4, G.boss]);
      for (const m of G.members) list.push([m.oz, 5, m]);
      for (const b of G.bullets) list.push([b.z - 0.05, 6, b]);
    }
    list.sort((a, b) => b[0] - a[0]);
    for (const [, k, o] of list) {
      switch (k) {
        case 0: drawDecor(o); break;
        case 1: drawGate(o); break;
        case 2: drawBarrel(o); break;
        case 3: drawEnemy(o); break;
        case 4: drawBoss(o); break;
        case 5: drawMember(o); break;
        case 6: drawBullet(o); break;
      }
    }
  }

  function drawHUD() {
    // Contador sobre el grupo
    if (G.count > 0 && G.state !== 'lose') {
      const m = Math.min(G.count, MAX_SHOWN);
      const x = sx(G.px, 0), y = sy(0) - 62 - Math.sqrt(m) * 7;
      const txt = String(G.count);
      ctx.font = '900 26px "Trebuchet MS", system-ui, sans-serif';
      const w = ctx.measureText(txt).width + 26;
      roundRect(x - w / 2, y - 17, w, 34, 17);
      ctx.fillStyle = 'rgba(30,20,70,.75)'; ctx.fill();
      ctx.lineWidth = 3; ctx.strokeStyle = '#8fd8ff'; ctx.stroke();
      outlinedText(txt, x, y + 1, 26, '#fff');
    }
    // Textos flotantes
    for (const t of G.texts) {
      const s = sc(t.z);
      ctx.globalAlpha = clamp(1.3 - t.t, 0, 1);
      outlinedText(t.text, sx(t.x, t.z), sy(t.z) - 90 * s - t.t * 70, 34 * t.size * Math.max(0.6, s), t.color);
      ctx.globalAlpha = 1;
    }
    // Barra superior
    ctx.fillStyle = 'rgba(20,12,50,.55)';
    roundRect(12, 12, W - 24, 58, 18); ctx.fill();
    outlinedText('Nivel ' + G.L, 70, 32, 20, '#ffe14d');
    ctx.font = '700 13px system-ui, sans-serif'; ctx.fillStyle = '#fff'; ctx.textAlign = 'center';
    ctx.fillText(G.lv.name, 70, 54);
    // progreso
    const px0 = 140, pw = 250, py = 34;
    const prog = G.boss ? 1 : clamp(G.d / G.end, 0, 1);
    roundRect(px0, py - 6, pw, 12, 6); ctx.fillStyle = 'rgba(255,255,255,.25)'; ctx.fill();
    roundRect(px0, py - 6, Math.max(12, pw * prog), 12, 6); ctx.fillStyle = '#7CFF6B'; ctx.fill();
    Sprites.draw(ctx, 'enemy', G.lv.boss, px0 + pw + 4, py + 16, 11);
    Sprites.draw(ctx, 'ally', save.partner, px0 + pw * prog, py + 14, 9);
    // arma
    ctx.font = '700 13px system-ui, sans-serif'; ctx.fillStyle = '#fff'; ctx.textAlign = 'left';
    ctx.fillText('Arma:', px0, 60);
    for (let i = 1; i <= 5; i++) Sprites.star(ctx, px0 + 50 + i * 18, 56, 7, 3.2, 5, i <= G.weapon ? '#ffe14d' : 'rgba(255,255,255,.25)');
    // Jefe
    if (G.boss) {
      const b = G.boss, bw = W - 80, bx = 40, by = 86;
      roundRect(bx - 4, by - 4, bw + 8, 30, 12); ctx.fillStyle = 'rgba(20,12,50,.7)'; ctx.fill();
      roundRect(bx, by, bw, 22, 10); ctx.fillStyle = '#3a1020'; ctx.fill();
      roundRect(bx, by, Math.max(0, bw * (b.hp / b.maxHp)), 22, 10); ctx.fillStyle = '#ff3d5a'; ctx.fill();
      outlinedText('JEFE  ' + Math.ceil(b.hp), W / 2, by + 11, 16, '#fff');
    }
    // Rótulo de inicio
    if (G.banner > 0) {
      const a = clamp(G.banner, 0, 1);
      ctx.globalAlpha = a;
      outlinedText('Nivel ' + G.L, W / 2, 330, 64, '#ffe14d');
      outlinedText(G.lv.name, W / 2, 392, 32, '#fff');
      if (G.L === 1) outlinedText('← Arrastra para moverte →', W / 2, 470, 24, '#bff6ff');
      outlinedText('¡Dispara a las puertas para mejorarlas!', W / 2, 510, 20, '#fff');
      ctx.globalAlpha = 1;
    }
    if (G.boss && G.boss.z > 30 && G.state === 'play') {
      ctx.globalAlpha = 0.5 + 0.5 * Math.sin(G.time * 8);
      outlinedText('¡JEFE!', W / 2, 160, 56, '#ff4d6a');
      ctx.globalAlpha = 1;
    }
  }

  function drawFx() {
    for (const p of fx) {
      ctx.globalAlpha = clamp(p.life / 0.5, 0, 1);
      circle(p.x, p.y, p.r, p.color);
    }
    ctx.globalAlpha = 1;
  }

  function render() {
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    let shx = 0, shy = 0;
    if (G && G.shake > 0) { shx = (Math.random() - 0.5) * 12 * G.shake * 4; shy = (Math.random() - 0.5) * 12 * G.shake * 4; }
    ctx.translate(shx, shy);
    drawSky(scene.lv);
    drawGround(scene.lv);
    drawWorld();
    drawFx();
    if (G && mode !== 'menu') drawHUD();
  }

  // ================== Bucle ==================
  let last = performance.now();
  function frame(now) {
    let dt = (now - last) / 1000; last = now;
    if (dt > 0.05) dt = 0.05;
    if (mode === 'play') { update(dt); updateFx(dt); }
    else if (mode === 'menu') { updateScene(dt, SCROLL * 0.6); updateFx(dt); }
    render();
    requestAnimationFrame(frame);
  }

  // ================== Entrada ==================
  canvas.addEventListener('pointerdown', e => {
    Sfx.ensure();
    input.dragging = true; input.lastX = e.clientX;
    try { canvas.setPointerCapture(e.pointerId); } catch (err) { /* ignorar */ }
  });
  canvas.addEventListener('pointermove', e => {
    if (!input.dragging || !G || mode !== 'play') return;
    const rect = canvas.getBoundingClientRect();
    const dx = (e.clientX - input.lastX) * (W / rect.width);
    input.lastX = e.clientX;
    G.px += (dx / ROAD_HALF) * 1.3;
    clampPx();
  });
  const endDrag = () => { input.dragging = false; };
  canvas.addEventListener('pointerup', endDrag);
  canvas.addEventListener('pointercancel', endDrag);
  window.addEventListener('keydown', e => {
    if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') input.left = true;
    if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') input.right = true;
    if ((e.key === 'Escape' || e.key === 'p' || e.key === 'P') && G) togglePause();
  });
  window.addEventListener('keyup', e => {
    if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') input.left = false;
    if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') input.right = false;
  });
  window.addEventListener('blur', () => { input.left = input.right = false; if (mode === 'play' && G && G.state === 'play') togglePause(); });

  // ================== Interfaz (DOM) ==================
  const $ = id => document.getElementById(id);
  const overlays = ['menu', 'levels', 'result', 'pause'].map($);
  const btnPause = $('btnPause'), btnMute = $('btnMute'), btnMusic = $('btnMusic');
  function showOverlay(id) {
    for (const o of overlays) o.classList.toggle('hidden', o.id !== id);
  }
  function togglePause() {
    if (!G || G.state !== 'play') return;
    if (mode === 'play') { mode = 'paused'; showOverlay('pause'); }
    else if (mode === 'paused') { mode = 'play'; showOverlay(null); last = performance.now(); }
  }
  function goMenu() {
    G = null; mode = 'menu'; btnPause.classList.add('hidden');
    resetScene(LEVELS[Math.max(0, save.unlocked - 1)]);
    buildPartners(); showOverlay('menu');
    Sfx.music(0, 'menu');
  }
  function buildPartners() {
    const box = $('partners'); box.innerHTML = '';
    for (const k of allyKeys) {
      const a = Sprites.ALLIES[k];
      const b = document.createElement('button');
      b.className = 'partner' + (save.partner === k ? ' sel' : '');
      b.style.setProperty('--c', a.body);
      b.appendChild(Sprites.portrait('ally', k, 120));
      const n = document.createElement('div'); n.className = 'pname'; n.textContent = a.name; b.appendChild(n);
      const el = document.createElement('div'); el.className = 'pelem'; el.textContent = a.elem; b.appendChild(el);
      b.onclick = () => { Sfx.ensure(); Sfx.tick(); save.partner = k; persist(); buildPartners(); };
      box.appendChild(b);
    }
  }
  function buildLevels() {
    const grid = $('levelGrid'); grid.innerHTML = '';
    LEVELS.forEach((lv, i) => {
      const L = i + 1, locked = L > save.unlocked;
      const b = document.createElement('button');
      b.className = 'lvl' + (locked ? ' locked' : '');
      b.style.background = `linear-gradient(180deg, ${lv.sky[0]} 0%, ${lv.sky[1]} 55%, ${lv.grass} 56%, ${lv.grass2} 100%)`;
      const st = save.stars[L] || 0;
      b.innerHTML = `<div class="lnum">${locked ? '🔒' : L}</div><div class="lname">${lv.name}</div><div class="lstars">${'★'.repeat(st)}<span>${'★'.repeat(3 - st)}</span></div>`;
      if (!locked) {
        const img = Sprites.portrait('enemy', lv.boss, 70); img.className = 'lboss'; b.appendChild(img);
        b.onclick = () => { Sfx.ensure(); startLevel(L); };
      }
      grid.appendChild(b);
    });
  }
  function showResult(won) {
    if (!G) return;
    mode = 'result';
    Sfx.music(0, 'menu');
    btnPause.classList.add('hidden');
    $('resTitle').textContent = won ? '¡Nivel superado!' : '¡Oh, no!';
    $('resStars').innerHTML = won ? '★'.repeat(G.stars) + `<span>${'★'.repeat(3 - G.stars)}</span>` : '';
    $('resText').textContent = won
      ? (G.L === LEVELS.length ? `¡Has derrotado al último jefe con ${G.count} bichitos! ¡Eres una campeona!` : `Terminaste con ${G.count} bichitos.`)
      : (G.boss ? 'El jefe era muy fuerte. ¡Consigue más amigos y mejores armas!' : 'Te quedaste sin bichitos. ¡Elige mejor las puertas!');
    const hasNext = won && G.L < LEVELS.length;
    $('btnNext').classList.toggle('hidden', !hasNext);
    $('btnRetry').textContent = won ? 'Repetir' : 'Reintentar';
    showOverlay('result');
  }
  $('btnPlay').onclick = () => { Sfx.ensure(); buildLevels(); showOverlay('levels'); };
  $('btnBack').onclick = () => { goMenu(); };
  $('btnNext').onclick = () => { if (G) startLevel(G.L + 1); };
  $('btnRetry').onclick = () => { if (G) startLevel(G.L); };
  $('btnLevels').onclick = () => { const L = G ? G.L : 1; G = null; mode = 'menu'; resetScene(LEVELS[L - 1]); buildLevels(); showOverlay('levels'); };
  $('btnResume').onclick = () => togglePause();
  $('btnQuit').onclick = () => goMenu();
  btnPause.onclick = () => togglePause();
  function refreshMute() { btnMute.textContent = save.muted ? '🔇' : '🔊'; }
  btnMute.onclick = () => { save.muted = !save.muted; persist(); refreshMute(); Sfx.ensure(); Sfx.refreshMusic(); };
  refreshMute();
  function refreshMusicBtn() { btnMusic.classList.toggle('off', !save.music); }
  btnMusic.onclick = () => { save.music = !save.music; persist(); refreshMusicBtn(); Sfx.ensure(); Sfx.refreshMusic(); };
  refreshMusicBtn();

  // Gancho para pruebas automáticas
  window.__bichitos = {
    LEVELS, buildLevel, startLevel,
    get G() { return G; },
    step(dt) { update(dt); updateFx(dt); },
    setPx(x) { if (G) { G.px = x; clampPx(); } },
  };

  goMenu();
  requestAnimationFrame(frame);
})();
