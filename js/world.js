/* The side-scrolling garden: layered scenery, buildings, characters, particles and input. */
(function () {
  'use strict';
  const G = (window.G = window.G || {});
  const A = () => G.Art;
  const VW = 960, VH = 540, GROUND = 430, WW = 2700, TAU = Math.PI * 2;
  const W = { paused: false, running: false, VW, VH, WW };
  const HELPERS = ['ladybug', 'butterfly', 'caterpillar', 'squirrel', 'bunny', 'turtle', 'bird', 'mouse', 'duck'];
  const PAL = [
    { sky: ['#4fb3ff', '#a5e1ff', '#eafaff'], mtn: ['#b5d9f0', '#8fc3e6'], mid: ['#8fdb8f', '#62c274'], near: ['#74d06b', '#4fb65b'], ground: ['#63c95a', '#2f8f47'], path: ['#f7e3b5', '#e2c48a'], canopy: ['#3fae55', '#6fd070', '#2c8a45'], light: 'rgba(255,244,190,.30)', sun: '#fff3a8' },
    { sky: ['#ff8f5e', '#ffc078', '#fff1cc'], mtn: ['#e9a9a0', '#d98f96'], mid: ['#d8c060', '#b8a64a'], near: ['#a9c653', '#84ab43'], ground: ['#98c94f', '#557f38'], path: ['#f5d9a3', '#dcb97a'], canopy: ['#5f9f3f', '#93c74f', '#467a30'], light: 'rgba(255,190,110,.32)', sun: '#fff0b0' },
    { sky: ['#1d2266', '#4b3f95', '#d77fa8'], mtn: ['#4c4c96', '#3c3c80'], mid: ['#356a8c', '#2a5676'], near: ['#2c7f78', '#226660'], ground: ['#3aa277', '#17503f'], path: ['#b7cfa5', '#8fae86'], canopy: ['#1f7a6a', '#35a58a', '#155a50'], light: 'rgba(150,170,255,.16)', sun: '#fffbe0' },
  ];
  let cv, c, last = 0, cam = 0, t = 0, ents = [], sneezles = [], hero, cb = {}, zone = 0, cfg = {}, keys = {}, decor = [], parts = [], motes = [], clouds = [], dustT = 0;
  const rand = (a, b) => a + Math.random() * (b - a);

  function init() {
    cv = document.getElementById('game'); c = cv.getContext('2d');
    resize(); window.addEventListener('resize', resize);
    cv.addEventListener('pointerdown', onDown);
    window.addEventListener('keydown', (e) => {
      keys[e.key] = true;
      if (W.running && !W.paused && !cfg.demo && (e.key === ' ' || e.key === 'Enter' || e.key === 'ArrowUp')) { e.preventDefault(); useNearest(); }
    });
    window.addEventListener('keyup', (e) => { keys[e.key] = false; });
    requestAnimationFrame(loop);
  }
  function resize() { const dpr = Math.min(window.devicePixelRatio || 1, 2); cv.width = VW * dpr; cv.height = VH * dpr; c.setTransform(dpr, 0, 0, dpr, 0, 0); }

  /* opts: { zone, zoneInfo, beds, pieces(), climb, hazards, glow, demo } */
  function start(opts, callbacks) {
    cfg = opts; cb = callbacks || {}; zone = opts.zone; ents = []; sneezles = []; parts = []; keys = {};
    hero = { x: 140, target: null, pending: null, face: 1, phase: 0, immune: 0, spin: 0, moving: false };
    cam = 0;
    if (!opts.demo) {
      ents.push({ type: 'shop', x: 400, w: 170, top: 250 });
      ents.push({ type: 'station', x: 1060, w: 200, top: 210 });
      const slots = [730, 1440, 1860, 2200];
      opts.beds.forEach((b, i) => {
        b.x = slots[i];
        ents.push({ type: 'bed', x: b.x, w: 140, top: 340, bed: b });
        if (!b.done) { const x = freeX(260, 2250); ents.push({ type: 'star', x, home: x, dir: 1, w: 80, top: 330, bed: b, kind: HELPERS[(i * 2 + zone + 3) % HELPERS.length], seed: rand(0, 9) }); }
      });
      for (let i = 0; i < 4; i++) { const x = freeX(260 + i * 520, 460 + i * 520); ents.push({ type: 'helper', x, home: x, dir: i % 2 ? 1 : -1, w: 80, top: 330, kind: HELPERS[Math.floor(rand(0, HELPERS.length))], away: 0, seed: rand(0, 9) }); }
      ents.push({ type: 'gate', x: 2520, w: 220, top: 180 });
      if (opts.hazards && opts.climb >= 1) { const n = Math.min(4, 1 + Math.floor(opts.climb / 2)); for (let i = 0; i < n; i++) sneezles.push(newSneezle(700 + i * 500)); }
    }
    decor = [];
    let seed = zone * 97 + 13;
    const sr = () => { seed = (seed * 9301 + 49297) % 233280; return seed / 233280; };
    const blocked = (x) => !opts.demo && ents.some((e) => (e.type === 'shop' || e.type === 'station' || e.type === 'gate') && Math.abs(e.x - x) < e.w / 2 + 50);
    for (let i = 0; i < 12; i++) { const x = 80 + i * 230 + sr() * 120; if (!blocked(x)) decor.push({ kind: 'tree', x, s: 0.85 + sr() * 0.5, v: sr() }); }
    for (let i = 0; i < 14; i++) decor.push({ kind: 'bush', x: sr() * WW, s: 0.7 + sr() * 0.6, v: sr() });
    for (let i = 0; i < 70; i++) { const d = sr(); decor.push({ kind: 'flower', x: sr() * WW, d, col: ['#ff8fab', '#ffd43b', '#ffffff', '#b197fc', '#ff922b'][Math.floor(sr() * 5)], v: sr(), i }); }
    for (let i = 0; i < 90; i++) decor.push({ kind: 'tuft', x: sr() * WW, d: sr(), v: sr() });
    for (let i = 0; i < 40; i++) decor.push({ kind: 'pebble', x: sr() * WW, d: sr(), v: sr() });
    decor.sort((a, b) => (a.d || 0) - (b.d || 0));
    motes = []; for (let i = 0; i < 26; i++) motes.push({ x: rand(0, VW), y: rand(40, 420), ph: rand(0, 9), sp: rand(0.5, 1.4) });
    clouds = []; for (let i = 0; i < 6; i++) clouds.push({ x: rand(0, VW * 1.4), y: rand(30, 170), s: rand(0.6, 1.3), sp: rand(4, 10) });
    W.running = true; W.paused = false;
  }
  function freeX(a, b) { let x = rand(a, b); for (let i = 0; i < 30 && ents.some((e) => Math.abs(e.x - x) < e.w / 2 + 60); i++) x = rand(a, b); return x; }
  function newSneezle(x) { return { x, y: rand(320, 380), vx: (Math.random() < 0.5 ? -1 : 1) * (45 + 12 * Math.min(6, cfg.climb || 0)), ph: rand(0, 6), away: 0 }; }
  function stop() { W.running = false; }

  function onDown(e) {
    if (!W.running || W.paused || cfg.demo) return;
    G.Audio.unlock();
    const r = cv.getBoundingClientRect();
    const wx = (e.clientX - r.left) / r.width * VW + cam, wy = (e.clientY - r.top) / r.height * VH;
    for (const s of sneezles) if (!s.away && Math.abs(wx - s.x) < 50 && Math.abs(wy - (s.y + Math.sin(s.ph) * 14)) < 50) { s.away = 8; burst('puff', s.x, s.y, 10); G.Audio.sfx.pop(); if (cb.popped) cb.popped(); return; }
    let hit = null, best = 1e9;
    for (const en of ents) { if (en.away) continue; const d = Math.abs(wx - en.x); if (d < en.w / 2 + 12 && wy > en.top - 30 && d < best) { best = d; hit = en; } }
    hero.pending = hit; hero.target = hit ? hit.x : Math.max(40, Math.min(WW - 40, wx));
    if (!hit) parts.push({ k: 'ring', x: hero.target, y: GROUND + 6, life: 0.5, max: 0.5 });
  }
  function useNearest() {
    let hit = null, best = 90;
    for (const en of ents) { if (en.away) continue; const d = Math.abs(hero.x - en.x); if (d < best) { best = d; hit = en; } }
    if (hit) { hero.target = null; hero.pending = null; cb.interact(hit); }
  }
  function hideEntity(en, secs) { en.away = secs; }
  function removeEntity(en) { ents = ents.filter((x) => x !== en); }
  function burst(k, x, y, n) {
    for (let i = 0; i < n; i++) {
      const a = rand(0, TAU), sp = rand(60, 220);
      parts.push({ k, x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - (k === 'puff' ? 0 : 140), life: rand(0.6, 1.2), max: 1.2, r: rand(3, 8), rot: rand(0, 6), col: ['#ffd43b', '#ff6b6b', '#4dabf7', '#69db7c', '#f783ac', '#fff'][Math.floor(rand(0, 6))] });
    }
  }

  function update(dt) {
    t += dt;
    for (const cl of clouds) { cl.x -= cl.sp * dt; if (cl.x < -200) cl.x = VW + 200; }
    for (const p of parts) { p.life -= dt; if (p.k !== 'ring') { p.x += p.vx * dt; p.y += p.vy * dt; if (p.k !== 'puff' && p.k !== 'dust') p.vy += 420 * dt; else { p.vx *= 0.94; p.vy *= 0.94; } p.rot += dt * 6; } }
    parts = parts.filter((p) => p.life > 0);
    if (cfg.demo) { cam = (WW - VW) * (0.5 - 0.5 * Math.cos(t * 0.05)); return; }
    let move = 0;
    if (keys.ArrowLeft || keys.a) move = -1; else if (keys.ArrowRight || keys.d) move = 1;
    if (move) { hero.target = null; hero.pending = null; }
    if (hero.pending && !hero.pending.away) hero.target = hero.pending.x;
    if (hero.target != null) {
      const d = hero.target - hero.x;
      if (Math.abs(d) < 10) { const p = hero.pending; hero.target = null; hero.pending = null; if (p) cb.interact(p); } else move = Math.sign(d);
    }
    hero.moving = !!move;
    if (move) {
      hero.x = Math.max(40, Math.min(WW - 40, hero.x + move * 250 * dt)); hero.face = move; hero.phase += dt * 11;
      dustT -= dt; if (dustT <= 0) { dustT = 0.16; parts.push({ k: 'dust', x: hero.x - move * 12, y: GROUND - 2, vx: -move * 30, vy: -20, life: 0.5, max: 0.5, r: rand(4, 7), rot: 0 }); }
    }
    if (hero.immune > 0) hero.immune -= dt;
    if (hero.spin > 0) hero.spin -= dt;
    for (const en of ents) {
      if (en.away) { en.away -= dt; if (en.away <= 0) { en.away = 0; en.x = en.home = freeX(260, 2300); en.kind = HELPERS[Math.floor(rand(0, HELPERS.length))]; burst('puff', en.x, GROUND - 30, 6); } continue; }
      if ((en.type === 'helper' || en.type === 'star') && hero.pending !== en) { en.x += en.dir * 14 * dt; if (Math.abs(en.x - en.home) > 70) en.dir = -Math.sign(en.x - en.home); }
    }
    for (const s of sneezles) {
      if (s.away) { s.away -= dt; if (s.away <= 0) { s.away = 0; s.x = hero.x + (Math.random() < 0.5 ? -700 : 700); } continue; }
      s.x += s.vx * dt; s.ph += dt * 2;
      if (s.x < 60 || s.x > WW - 60) s.vx *= -1;
      if (hero.immune <= 0 && Math.abs(s.x - hero.x) < 38) { hero.immune = 3; hero.spin = 0.6; s.vx *= -1; burst('puff', hero.x, GROUND - 50, 8); cb.sneezed(); }
    }
    cam += (Math.max(0, Math.min(WW - VW, hero.x - VW * 0.4)) - cam) * Math.min(1, dt * 5);
  }

  /* ---------- drawing helpers ---------- */
  const grad = (y0, y1, a, b) => { const g = c.createLinearGradient(0, y0, 0, y1); g.addColorStop(0, a); g.addColorStop(1, b); return g; };
  const ridge = (x, par, amp, base, freq) => base - Math.sin((x + cam * par) * freq) * amp - Math.sin((x + cam * par) * freq * 2.3 + 1) * amp * 0.45;
  function hills(cols, par, amp, base, freq) {
    c.beginPath(); c.moveTo(0, VH);
    for (let x = 0; x <= VW + 16; x += 16) c.lineTo(x, ridge(x, par, amp, base, freq));
    c.lineTo(VW, VH); c.fillStyle = grad(base - amp * 1.5, GROUND, cols[0], cols[1]); c.fill();
  }
  function shadow(x, w) { c.fillStyle = 'rgba(20,40,30,.22)'; c.beginPath(); c.ellipse(x, GROUND + 2, w, w * 0.2, 0, 0, TAU); c.fill(); }
  function sign(text, x, y, big) {
    c.font = `700 ${big ? 20 : 16}px Fredoka,ui-rounded,"Trebuchet MS",sans-serif`; c.textAlign = 'center'; c.textBaseline = 'middle';
    const w = c.measureText(text).width + 26, hgt = big ? 34 : 28;
    A().rr(c, x - w / 2, y - hgt / 2, w, hgt, 8, '#8a5a3c', A().OUT, 2.5); A().rr(c, x - w / 2 + 4, y - hgt / 2 + 4, w - 8, hgt - 8, 5, '#f7e3b5');
    c.fillStyle = '#5a3a22'; c.fillText(text, x, y + 1);
  }
  function tree(d) {
    const P = PAL[zone], s = d.s, x = d.x, y = GROUND - 4;
    shadow(x, 46 * s);
    A().poly(c, [[x - 9 * s, y], [x - 6 * s, y - 80 * s], [x + 6 * s, y - 80 * s], [x + 10 * s, y]], '#8a5a3c', A().OUT, 2.5);
    A().line(c, [[x + 2 * s, y - 10 * s], [x + 3 * s, y - 60 * s]], '#6b4423', 2);
    const sway = Math.sin(t * 0.9 + d.v * 9) * 2.5;
    const blobs = [[-30, -96, 30], [28, -98, 30], [0, -124, 36], [-14, -86, 26], [16, -84, 26]];
    c.beginPath(); blobs.forEach((b) => { c.moveTo(x + b[0] * s + sway + b[2] * s, y + b[1] * s); c.arc(x + b[0] * s + sway, y + b[1] * s, b[2] * s, 0, TAU); });
    c.strokeStyle = A().OUT; c.lineWidth = 5; c.stroke(); c.fillStyle = P.canopy[0]; c.fill();
    c.fillStyle = P.canopy[1]; [[-34, -104, 17], [-6, -136, 20], [22, -108, 15]].forEach((b) => { c.beginPath(); c.arc(x + b[0] * s + sway, y + b[1] * s, b[2] * s, 0, TAU); c.fill(); });
    c.fillStyle = P.canopy[2]; [[10, -82, 14], [-18, -78, 12]].forEach((b) => { c.beginPath(); c.arc(x + b[0] * s + sway, y + b[1] * s, b[2] * s, 0, TAU); c.fill(); });
    if (zone === 1) [[-28, -90], [4, -112], [26, -92], [-8, -80], [18, -122]].forEach((b) => { A().ell(c, x + b[0] * s + sway, y + b[1] * s, 6.5, 6.5, '#e03131', '#8f1d1d', 1.5); A().ell(c, x + b[0] * s + sway - 2, y + b[1] * s - 2, 2, 1.5, 'rgba(255,255,255,.6)'); });
  }
  function bush(d) {
    const P = PAL[zone], x = d.x, y = GROUND - 6, s = d.s;
    c.beginPath(); [[-22, 0, 20], [0, -10, 24], [24, 0, 19]].forEach((b) => { c.moveTo(x + (b[0] + b[2]) * s, y + b[1] * s); c.arc(x + b[0] * s, y + b[1] * s, b[2] * s, Math.PI, 0); });
    c.strokeStyle = A().OUT; c.lineWidth = 4; c.stroke(); c.fillStyle = P.canopy[0]; c.fill(); c.fillRect(x - 42 * s, y - 2, 86 * s, 8);
    c.fillStyle = P.canopy[1]; c.beginPath(); c.arc(x - 4 * s, y - 16 * s, 11 * s, 0, TAU); c.fill();
    if (d.v > 0.5) for (let i = 0; i < 4; i++) A().ell(c, x - 24 * s + i * 16 * s, y - 8 * s - (i % 2) * 8 * s, 3.5, 3.5, zone === 2 ? '#fff3a0' : '#f783ac');
  }
  function bubble(x, y, fill) {
    c.beginPath(); c.moveTo(x - 6, y + 18); c.lineTo(x - 12, y + 30); c.lineTo(x + 6, y + 18); c.closePath(); c.fillStyle = fill; c.fill(); c.strokeStyle = A().OUT; c.lineWidth = 2.5; c.stroke();
    A().ell(c, x, y, 22, 20, fill, A().OUT, 2.5);
    c.fillStyle = fill; c.fillRect(x - 6, y + 14, 11, 6);
  }

  function drawShop(x) {
    const zi = cfg.zoneInfo, y = GROUND;
    shadow(x, 95);
    A().rr(c, x - 72, y - 150, 10, 150, 3, '#a8713f', A().OUT, 2.5); A().rr(c, x + 62, y - 150, 10, 150, 3, '#a8713f', A().OUT, 2.5);
    A().rr(c, x - 66, y - 120, 132, 70, 4, '#fff4d6', A().OUT, 2.5);
    c.save(); c.translate(x, y - 58); c.scale(1.05, 1.05); A().critter(c, zi.shopkeeper, t, 3); c.restore();
    A().rr(c, x - 80, y - 62, 160, 62, 6, '#c98b4b', A().OUT, 2.5);
    for (let i = 1; i < 4; i++) A().line(c, [[x - 80 + i * 40, y - 60], [x - 80 + i * 40, y - 2]], '#a8713f', 2);
    A().rr(c, x - 86, y - 70, 172, 12, 5, '#e0a96a', A().OUT, 2.5);
    c.save(); c.translate(x - 50, y - 84); c.scale(1.2, 1.2); A().icon(c, 'balloon', t); c.restore();
    c.save(); c.translate(x + 52, y - 74); A().hat(c, 'tophat'); c.restore();
    for (let i = 0; i < 6; i++) { c.beginPath(); c.moveTo(x - 90 + i * 30, y - 186); c.lineTo(x - 60 + i * 30, y - 186); c.lineTo(x - 60 + i * 30, y - 150); c.arc(x - 75 + i * 30, y - 150, 15, 0, Math.PI); c.closePath(); c.fillStyle = i % 2 ? '#fff' : '#ff6b6b'; c.fill(); c.strokeStyle = A().OUT; c.lineWidth = 2.5; c.stroke(); }
    A().rr(c, x - 94, y - 194, 188, 12, 5, '#e03131', A().OUT, 2.5);
    sign('Shop', x, y - 216, true);
  }
  function drawStation(x) {
    const zi = cfg.zoneInfo, y = GROUND, o = A().OUT;
    shadow(x, 120);
    if (zone === 0) {
      A().rr(c, x - 82, y - 140, 164, 140, 6, '#f7c873', o, 3);
      for (let i = 1; i < 6; i++) A().line(c, [[x - 82 + i * 27, y - 138], [x - 82 + i * 27, y - 2]], '#e0a84f', 2);
      A().poly(c, [[x - 104, y - 132], [x, y - 214], [x + 104, y - 132]], '#e8590c', o, 3);
      for (let i = 0; i < 3; i++) A().line(c, [[x - 80 + i * 26, y - 150 - i * 20], [x + 80 - i * 26, y - 150 - i * 20]], '#c94a08', 2);
      A().ell(c, x, y - 108, 30, 30, '#fffdf5', o, 3);
      for (let i = 0; i < 12; i++) { const a = i / 12 * TAU; A().line(c, [[x + Math.cos(a) * 24, y - 108 + Math.sin(a) * 24], [x + Math.cos(a) * 27, y - 108 + Math.sin(a) * 27]], o, 2); }
      A().line(c, [[x, y - 108], [x + Math.cos(t * 2.2) * 14, y - 108 + Math.sin(t * 2.2) * 14]], '#c2255c', 4); A().line(c, [[x, y - 108], [x + Math.cos(-t * 3.7) * 22, y - 108 + Math.sin(-t * 3.7) * 22]], '#1971c2', 3);
    } else if (zone === 1) {
      A().poly(c, [[x - 90, y], [x - 90, y - 120], [x - 62, y - 170], [x, y - 200], [x + 62, y - 170], [x + 90, y - 120], [x + 90, y]], '#e03131', o, 3);
      A().line(c, [[x - 90, y - 120], [x - 62, y - 170], [x, y - 200], [x + 62, y - 170], [x + 90, y - 120]], '#fff', 5);
      A().ell(c, x, y - 150, 22, 22, '#fff4d6', o, 2.5);
      A().line(c, [[x - 14, y - 152], [x + 14, y - 152]], '#6b4423', 3); A().line(c, [[x, y - 164], [x, y - 138]], '#6b4423', 3); A().line(c, [[x - 14, y - 152], [x - 14, y - 144]], '#6b4423', 2); A().line(c, [[x + 14, y - 152], [x + 14, y - 144]], '#6b4423', 2);
    } else {
      c.beginPath(); c.moveTo(x - 110, y); c.bezierCurveTo(x - 120, y - 120, x - 50, y - 190, x + 10, y - 180); c.bezierCurveTo(x + 90, y - 176, x + 124, y - 90, x + 108, y); c.closePath(); c.fillStyle = grad(y - 190, y, '#8f9bd0', '#565f96'); c.fill(); c.strokeStyle = o; c.lineWidth = 3; c.stroke();
      [[-70, -110, 22], [50, -140, 26], [72, -60, 20], [-84, -40, 18], [-10, -160, 16]].forEach((b) => A().ell(c, x + b[0], y + b[1], b[2], b[2] * 0.7, 'rgba(255,255,255,.14)'));
      for (let i = 0; i < 3; i++) { const mx = x - 96 + i * 96, my = y - 4; A().rr(c, mx - 4, my - 16, 8, 16, 3, '#fff4d6', o, 2); c.beginPath(); c.arc(mx, my - 16, 14, Math.PI, 0); c.closePath(); c.fillStyle = '#f783ac'; c.fill(); c.strokeStyle = o; c.lineWidth = 2; c.stroke(); }
    }
    const dx = x, dw = zone === 1 ? 40 : 30;
    c.beginPath(); c.moveTo(dx - dw, y); c.lineTo(dx - dw, y - 50); c.arc(dx, y - 50, dw, Math.PI, 0); c.lineTo(dx + dw, y); c.closePath();
    c.fillStyle = zone === 2 ? '#141a3a' : '#5a3a22'; c.fill(); c.strokeStyle = o; c.lineWidth = 3; c.stroke();
    if (zone === 2) { c.globalCompositeOperation = 'lighter'; for (let i = 0; i < 7; i++) { const fx = dx + Math.sin(t * 1.3 + i * 2) * 18, fy = y - 40 + Math.cos(t * 1.7 + i) * 26; const g = c.createRadialGradient(fx, fy, 0, fx, fy, 9); g.addColorStop(0, 'rgba(255,240,140,.9)'); g.addColorStop(1, 'rgba(255,240,140,0)'); c.fillStyle = g; c.fillRect(fx - 9, fy - 9, 18, 18); } c.globalCompositeOperation = 'source-over'; }
    else if (zone === 1) { A().line(c, [[dx - dw, y - 50], [dx + dw, y]], '#fff', 4); A().line(c, [[dx + dw, y - 50], [dx - dw, y]], '#fff', 4); }
    else A().ell(c, dx + 16, y - 36, 3, 3, '#ffd43b');
    c.save(); c.translate(x + (zone === 1 ? 118 : 112), y); c.scale(-1.15, 1.15); A().critter(c, zi.keeper.kind, t, 1); c.restore();
    sign(zi.station, x, y - (zone === 1 ? 224 : zone === 0 ? 236 : 208), true);
  }
  function drawBed(en) {
    const b = en.bed, x = en.x, y = GROUND, o = A().OUT;
    shadow(x, 74);
    A().line(c, [[x + 56, y - 4], [x + 56, y - 74]], '#8a5a3c', 4);
    A().poly(c, [[x + 56, y - 74], [x + 86, y - 64], [x + 56, y - 52]], b.color.c, o, 2.5);
    A().ell(c, x, y - 30, 58, 10, '#6b4423', o, 2.5);
    A().rr(c, x - 60, y - 30, 120, 32, 6, '#c98b4b', o, 2.5);
    A().line(c, [[x - 20, y - 28], [x - 20, y]], '#a8713f', 2); A().line(c, [[x + 20, y - 28], [x + 20, y]], '#a8713f', 2);
    A().rr(c, x - 62, y - 20, 124, 9, 3, b.color.c, o, 2);
    if (b.done) {
      A().flower(c, x - 30, y - 30, 8, '#ff8fab', t, 1); A().flower(c, x, y - 30, 10, '#ffd43b', t, 2); A().flower(c, x + 30, y - 30, 8, '#b197fc', t, 3);
      c.save(); c.translate(x, y - 96 + Math.sin(t * 3) * 5); c.scale(1.6, 1.6); A().icon(c, 'gem', t); c.restore();
      if (Math.random() < 0.06) parts.push({ k: 'spark', x: x + rand(-30, 30), y: y - 90 + rand(-20, 20), vx: 0, vy: -30, life: 0.6, max: 0.6, r: 4, rot: 0, col: '#fff' });
    } else if (b.magic != null) {
      A().line(c, [[x, y - 30], [x, y - 56]], '#8a5a3c', 4);
      const bob = Math.sin(t * 4) * 2;
      A().rr(c, x - 30, y - 96 + bob, 60, 42, 8, '#fffdf5', o, 2.5);
      c.fillStyle = b.color.c; c.font = '700 30px Fredoka,ui-rounded,sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(b.magic, x, y - 74 + bob);
    } else {
      for (const dx of [-28, 0, 28]) { A().line(c, [[x + dx, y - 30], [x + dx, y - 40]], '#2f9e44', 2.5); A().ell(c, x + dx - 5, y - 42, 5, 3, '#51cf66'); A().ell(c, x + dx + 5, y - 42, 5, 3, '#51cf66'); }
    }
  }
  function drawGate(x) {
    const zi = cfg.zoneInfo, n = cfg.pieces(), open = n >= 4, y = GROUND, o = A().OUT;
    if (zone === 0) {
      c.beginPath(); c.moveTo(x - 62, y - 8); c.bezierCurveTo(x - 40, y + 30, x - 80, y + 70, x - 96, VH); c.lineTo(x + 110, VH); c.bezierCurveTo(x + 90, y + 60, x + 40, y + 30, x + 62, y - 8); c.closePath();
      c.fillStyle = grad(y - 8, VH, '#74c0fc', '#339af0'); c.fill(); c.strokeStyle = '#1c7ed6'; c.lineWidth = 3; c.stroke();
      for (let i = 0; i < 5; i++) { const ry = y + 14 + i * 20, rx = x + Math.sin(t * 2 + i * 1.7) * 14; A().line(c, [[rx - 16, ry], [rx + 12, ry]], 'rgba(255,255,255,.65)', 3); }
      A().rr(c, x - 82, y - 22, 14, 26, 4, '#8a5a3c', o, 2.5); A().rr(c, x + 68, y - 22, 14, 26, 4, '#8a5a3c', o, 2.5);
      for (let i = 0; i < 4; i++) {
        const px = x - 62 + i * 31;
        if (i < n) { A().rr(c, px, y - 10, 30, 14, 3, '#c98b4b', o, 2.5); A().line(c, [[px + 5, y - 3], [px + 24, y - 4]], '#a8713f', 1.5); }
        else { c.setLineDash([5, 5]); A().rr(c, px + 2, y - 9, 26, 12, 3, null, 'rgba(255,255,255,.9)', 2); c.setLineDash([]); }
      }
    } else if (zone === 1) {
      shadow(x, 60);
      const cols = ['#ff6b6b', '#ffd43b', '#4dabf7', '#69db7c'];
      for (let i = 0; i < 4; i++) {
        const bx = x - 54 + i * 36, by = y - 190 - (i % 2) * 26 + Math.sin(t * 1.8 + i) * 5;
        if (i < n) { A().line(c, [[bx, by + 30], [x - 24 + i * 16, y - 56]], '#868e96', 1.5); A().ell(c, bx, by, 22, 27, cols[i], o, 2.5); A().poly(c, [[bx - 4, by + 26], [bx + 4, by + 26], [bx, by + 32]], cols[i], o, 1.5); A().ell(c, bx - 7, by - 9, 5, 9, 'rgba(255,255,255,.55)'); }
        else { c.setLineDash([6, 6]); A().ell(c, bx, by, 20, 25, null, 'rgba(255,255,255,.85)', 2.5); c.setLineDash([]); }
      }
      A().rr(c, x - 42, y - 58, 84, 58, 10, '#d9a45b', o, 3);
      for (let i = 1; i < 6; i++) A().line(c, [[x - 42 + i * 14, y - 56], [x - 42 + i * 14, y - 2]], '#b98238', 1.5);
      for (let i = 1; i < 4; i++) A().line(c, [[x - 40, y - 58 + i * 14], [x + 40, y - 58 + i * 14]], '#b98238', 1.5);
      A().rr(c, x - 48, y - 66, 96, 12, 6, '#a8713f', o, 2.5);
    } else {
      shadow(x, 100);
      if (open) { const g = c.createRadialGradient(x, y - 70, 5, x, y - 70, 150); g.addColorStop(0, 'rgba(255,236,150,.95)'); g.addColorStop(1, 'rgba(255,236,150,0)'); c.fillStyle = g; c.fillRect(x - 160, y - 230, 320, 240); }
      c.beginPath(); c.moveTo(x - 52, y); c.lineTo(x - 52, y - 90); c.arc(x, y - 90, 52, Math.PI, 0); c.lineTo(x + 52, y); c.closePath();
      c.fillStyle = open ? '#fff3bf' : '#8a5a3c'; c.fill(); c.strokeStyle = o; c.lineWidth = 3; c.stroke();
      if (!open) { A().line(c, [[x, y - 142], [x, y]], o, 2.5); for (const d of [-26, 26]) A().line(c, [[x + d, y - 130], [x + d, y]], '#6b4423', 2); A().ell(c, x - 8, y - 60, 4, 4, '#ffd43b', o, 1.5); A().ell(c, x + 8, y - 60, 4, 4, '#ffd43b', o, 1.5); }
      for (const d of [-1, 1]) { A().rr(c, x + d * 70 - 20, y - 150, 40, 150, 6, '#aab2d5', o, 3); for (let i = 1; i < 5; i++) A().line(c, [[x + d * 70 - 18, y - 150 + i * 30], [x + d * 70 + 18, y - 150 + i * 30]], '#7c86b5', 2); }
      c.beginPath(); c.arc(x, y - 150, 92, Math.PI, 0); c.arc(x, y - 150, 54, 0, Math.PI, true); c.closePath(); c.fillStyle = '#bcc3e3'; c.fill(); c.strokeStyle = o; c.lineWidth = 3; c.stroke();
      for (let i = 0; i < 4; i++) { const a = Math.PI * (1.2 + i * 0.2), kx = x + Math.cos(a) * 73, ky = y - 150 + Math.sin(a) * 73; A().ell(c, kx, ky, 12, 12, i < n ? '#ffd43b' : '#8c95bd', o, 2.5); if (i < n) { c.save(); c.translate(kx, ky); c.scale(0.6, 0.6); A().icon(c, 'key', t); c.restore(); } }
      c.save(); c.translate(x, y - 240); A().critter(c, 'owl', t, 7); c.restore();
    }
    sign(`${zi.gateName} ${Math.min(n, 4)}/4`, x, y - (zone === 0 ? 70 : zone === 1 ? 262 : 320), true);
    if (open) { const ax = x + (zone === 0 ? 0 : 0) + Math.sin(t * 5) * 6, ay = y - (zone === 0 ? 110 : 96); A().ell(c, ax, ay, 22, 22, '#40c057', o, 3); A().poly(c, [[ax - 10, ay - 5], [ax + 2, ay - 5], [ax + 2, ay - 11], [ax + 13, ay], [ax + 2, ay + 11], [ax + 2, ay + 5], [ax - 10, ay + 5]], '#fff'); }
  }

  function draw() {
    const P = PAL[zone], glow = cfg.glow == null ? 1 : cfg.glow;
    c.fillStyle = (() => { const g = c.createLinearGradient(0, 0, 0, GROUND); g.addColorStop(0, P.sky[0]); g.addColorStop(0.6, P.sky[1]); g.addColorStop(1, P.sky[2]); return g; })(); c.fillRect(0, 0, VW, VH);
    const sx = 760 - cam * 0.03, sy = zone === 1 ? 190 : 96;
    if (zone === 2) { c.fillStyle = '#fff'; for (let i = 0; i < 50; i++) { c.globalAlpha = 0.4 + 0.5 * Math.sin(t * 2 + i * 1.3); c.fillRect((i * 197) % VW, (i * 89) % 240, 2, 2); } c.globalAlpha = 1; }
    const sg = c.createRadialGradient(sx, sy, 10, sx, sy, 230); sg.addColorStop(0, zone === 2 ? 'rgba(255,250,220,.5)' : 'rgba(255,246,190,.85)'); sg.addColorStop(1, 'rgba(255,246,190,0)'); c.fillStyle = sg; c.fillRect(sx - 230, sy - 230, 460, 460);
    if (zone !== 2) { c.save(); c.translate(sx, sy); c.rotate(t * 0.05); c.fillStyle = 'rgba(255,255,255,.10)'; for (let i = 0; i < 10; i++) { c.rotate(TAU / 10); c.beginPath(); c.moveTo(0, 0); c.lineTo(-26, -330); c.lineTo(26, -330); c.fill(); } c.restore(); }
    A().ell(c, sx, sy, zone === 2 ? 34 : 44, zone === 2 ? 34 : 44, P.sun);
    if (zone === 2) A().ell(c, sx + 12, sy - 8, 30, 30, P.sky[0]);
    for (const cl of clouds) { c.fillStyle = zone === 2 ? 'rgba(200,190,240,.35)' : zone === 1 ? 'rgba(255,236,214,.85)' : 'rgba(255,255,255,.9)'; c.beginPath(); [[-36, 6, 24], [0, -8, 32], [34, 6, 24], [0, 12, 30]].forEach((b) => { c.moveTo(cl.x + (b[0] + b[2]) * cl.s, cl.y + b[1] * cl.s); c.arc(cl.x + b[0] * cl.s, cl.y + b[1] * cl.s, b[2] * cl.s, 0, TAU); }); c.fill(); }
    // mountains
    c.beginPath(); c.moveTo(0, VH); for (let x = 0; x <= VW + 20; x += 20) { const wx = x + cam * 0.1; c.lineTo(x, 300 - Math.abs(Math.sin(wx * 0.004)) * 110 - Math.abs(Math.sin(wx * 0.011 + 2)) * 40); } c.lineTo(VW, VH); c.fillStyle = grad(170, GROUND, P.mtn[0], P.mtn[1]); c.fill();
    hills(P.mid, 0.25, 34, 330, 0.006);
    for (let i = -1; i < 12; i++) { const wx = i * 110 - ((cam * 0.25) % 110), k = Math.floor((cam * 0.25) / 110) + i, ry = ridge(wx, 0.25, 34, 330, 0.006); if ((k * 7 + 3) % 3) { c.fillStyle = P.mid[1]; c.fillRect(wx - 2, ry - 14, 4, 16); c.beginPath(); c.arc(wx, ry - 22, 13 + ((k * 5) % 3) * 3, 0, TAU); c.fill(); } }
    if (zone === 2) {
      c.fillStyle = grad(352, GROUND, '#5a6fd0', '#2a3f90'); c.fillRect(0, 352, VW, GROUND - 352);
      c.fillStyle = 'rgba(255,250,220,.5)'; for (let i = 0; i < 6; i++) c.fillRect(sx - 30 + Math.sin(t * 2 + i) * 6 - i * 2, 360 + i * 11, 60 + i * 4, 3);
      for (let i = 0; i < 9; i++) { const lx = i * 180 - ((cam * 0.6) % 180) - 40, ly = 372 + (i % 3) * 16; A().ell(c, lx, ly, 20, 6, '#3aa277', '#17503f', 2); if (i % 2) A().ell(c, lx + 4, ly - 4, 5, 4, '#f783ac'); }
    } else hills(P.near, 0.55, 20, 392, 0.01);
    // ground
    c.fillStyle = grad(GROUND - 14, VH, P.ground[0], P.ground[1]); c.fillRect(0, GROUND - 14, VW, VH - GROUND + 14);
    c.fillStyle = grad(GROUND - 8, GROUND + 26, P.path[0], P.path[1]);
    c.beginPath(); c.moveTo(0, GROUND - 6); for (let x = 0; x <= VW + 20; x += 20) c.lineTo(x, GROUND - 6 + Math.sin((x + cam) * 0.02) * 2); for (let x = VW + 20; x >= 0; x -= 20) c.lineTo(x, GROUND + 24 + Math.sin((x + cam) * 0.017 + 2) * 3); c.fill();
    c.save(); c.translate(-cam, 0);
    const vis = (x, m) => x > cam - m && x < cam + VW + m;
    for (const d of decor) if (d.kind === 'pebble' && vis(d.x, 20)) A().ell(c, d.x, GROUND + d.d * 22, 3 + d.v * 3, 2 + d.v * 1.5, 'rgba(120,90,50,.35)');
    for (const d of decor) if (d.kind === 'tree' && vis(d.x, 160)) tree(d);
    for (const d of decor) if (d.kind === 'bush' && vis(d.x, 80)) bush(d);
    for (const d of decor) if (d.kind === 'tuft' && vis(d.x, 20) && d.d < 0.12) { const s = Math.sin(t * 2 + d.v * 9) * 2; A().line(c, [[d.x - 5, GROUND - 6], [d.x - 7 + s, GROUND - 16]], P.ground[1], 2); A().line(c, [[d.x, GROUND - 6], [d.x + s, GROUND - 19]], P.ground[1], 2); A().line(c, [[d.x + 5, GROUND - 6], [d.x + 8 + s, GROUND - 15]], P.ground[1], 2); }

    const order = { station: 0, shop: 0, gate: 0, bed: 1, helper: 2, star: 2 };
    for (const en of ents.slice().sort((a, b) => order[a.type] - order[b.type])) {
      if (en.away || !vis(en.x, 240)) continue;
      const x = en.x;
      if (en.type === 'shop') drawShop(x);
      else if (en.type === 'station') drawStation(x);
      else if (en.type === 'bed') drawBed(en);
      else if (en.type === 'gate') drawGate(x);
      else {
        shadow(x, 26);
        c.save(); c.translate(x, GROUND); c.scale(en.dir < 0 ? -1.05 : 1.05, 1.05); A().critter(c, en.kind, t, en.seed); c.restore();
        const by = GROUND - 98 + Math.sin(t * 4 + en.seed) * 4;
        if (en.type === 'star') { bubble(x, by, en.bed.color.c); A().star5(c, x, by, 13, '#fff'); }
        else { bubble(x, by, '#fff'); c.fillStyle = A().OUT; c.font = '700 26px Fredoka,ui-rounded,sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('?', x, by + 1); }
      }
    }
    for (const s of sneezles) { if (s.away) continue; A().cloud(c, s.x, s.y + Math.sin(s.ph) * 14, 0.8, 'grumpy', t + s.ph); }
    if (!cfg.demo) {
      shadow(hero.x, 24);
      c.save(); c.translate(hero.x, GROUND);
      if (hero.spin > 0) { c.translate(0, -40); c.rotate(hero.spin * 10); c.translate(0, 40); }
      if (hero.immune > 0 && Math.floor(t * 10) % 2) c.globalAlpha = 0.5;
      c.scale(hero.face * 1.15, 1.15); A().hero(c, { coat: G.state.coat, hat: G.state.hat, phase: hero.phase, t, moving: hero.moving });
      c.restore();
    }
    for (const p of parts) {
      const a = Math.max(0, p.life / p.max); c.globalAlpha = a;
      if (p.k === 'ring') { c.strokeStyle = '#fff'; c.lineWidth = 3; c.beginPath(); c.ellipse(p.x, p.y, (1 - a) * 34 + 6, ((1 - a) * 34 + 6) * 0.3, 0, 0, TAU); c.stroke(); }
      else if (p.k === 'dust' || p.k === 'puff') A().ell(c, p.x, p.y, p.r * (2 - a), p.r * (2 - a), p.k === 'dust' ? 'rgba(230,210,170,.8)' : '#fff');
      else if (p.k === 'coin') { c.save(); c.translate(p.x, p.y); A().icon(c, 'coin', t); c.restore(); }
      else if (p.k === 'spark') A().star(c, p.x, p.y, p.r * 1.6, p.col);
      else { c.save(); c.translate(p.x, p.y); c.rotate(p.rot); c.fillStyle = p.col; c.fillRect(-p.r, -p.r / 2, p.r * 2, p.r); c.restore(); }
    }
    c.globalAlpha = 1;
    // lower meadow flowers and grass, bigger toward the front
    const shown = 0.35 + 0.65 * glow;
    for (const d of decor) {
      if (!vis(d.x, 40) || d.d < 0.12) continue;
      const y = GROUND + 30 + d.d * 76, s = 0.6 + d.d * 0.9;
      if (d.kind === 'flower' && (d.i % 20) / 20 < shown) A().flower(c, d.x, y, 5 * s, d.col, t, d.v * 9);
      else if (d.kind === 'tuft') { const w = Math.sin(t * 2 + d.v * 9) * 3 * s; A().line(c, [[d.x - 6 * s, y], [d.x - 9 * s + w, y - 14 * s]], P.ground[1], 2.5); A().line(c, [[d.x, y], [d.x + w, y - 18 * s]], P.ground[1], 2.5); A().line(c, [[d.x + 6 * s, y], [d.x + 10 * s + w, y - 13 * s]], P.ground[1], 2.5); }
    }
    c.restore();
    // foreground silhouettes
    c.fillStyle = zone === 2 ? '#0f3a30' : zone === 1 ? '#3f6a2c' : '#237a3c';
    for (let i = -1; i < 9; i++) { const fx = i * 170 - ((cam * 1.35) % 170), k = Math.floor((cam * 1.35) / 170) + i; c.beginPath(); for (let j = -3; j <= 3; j++) { const bx = fx + j * 9, h2 = 34 + ((k * 13 + j * 7) % 5) * 7, sw = Math.sin(t * 1.6 + k + j) * 4; c.moveTo(bx - 6, VH + 4); c.quadraticCurveTo(bx + sw * 0.5, VH - h2 * 0.6, bx + sw, VH - h2); c.quadraticCurveTo(bx + sw * 0.5 + 4, VH - h2 * 0.5, bx + 6, VH + 4); } c.fill(); }
    // drifting motes
    for (const m of motes) {
      const mx = (m.x + t * 14 * m.sp + Math.sin(t + m.ph) * 20) % (VW + 40) - 20, my = m.y + Math.sin(t * 0.8 + m.ph) * 18 + (zone === 1 ? ((t * 22 * m.sp + m.ph * 60) % 400) - m.y * 0.5 : 0);
      if (zone === 2) { c.globalCompositeOperation = 'lighter'; const a = 0.4 + 0.6 * Math.sin(t * 2.4 + m.ph * 3); const g = c.createRadialGradient(mx, my, 0, mx, my, 12); g.addColorStop(0, `rgba(255,240,140,${0.9 * Math.max(0, a)})`); g.addColorStop(1, 'rgba(255,240,140,0)'); c.fillStyle = g; c.fillRect(mx - 12, my - 12, 24, 24); c.globalCompositeOperation = 'source-over'; }
      else if (zone === 1) { c.save(); c.translate(mx, my % 520); c.rotate(t * 2 + m.ph); A().ell(c, 0, 0, 6, 3, m.ph > 4 ? '#ff922b' : '#ffd43b'); c.restore(); }
      else { c.globalAlpha = 0.7; A().ell(c, mx, my, 2.2, 2.2, '#fff'); c.globalAlpha = 1; }
    }
    // light and vignette
    const lg = c.createRadialGradient(sx, sy, 20, sx, sy, 640); lg.addColorStop(0, P.light); lg.addColorStop(1, 'rgba(255,255,255,0)'); c.fillStyle = lg; c.fillRect(0, 0, VW, VH);
    const vg = c.createRadialGradient(VW / 2, VH / 2, 300, VW / 2, VH / 2, 640); vg.addColorStop(0, 'rgba(10,10,40,0)'); vg.addColorStop(1, 'rgba(10,10,40,.32)'); c.fillStyle = vg; c.fillRect(0, 0, VW, VH);
  }
  function loop(ts) {
    const dt = Math.min(0.05, (ts - last) / 1000 || 0); last = ts;
    if (W.running) { if (!W.paused || cfg.demo) update(dt); else t += dt * 0.5; draw(); }
    requestAnimationFrame(loop);
  }
  Object.assign(W, { init, start, stop, hideEntity, removeEntity, burst, GROUND, hero: () => hero, ents: () => ents, sneezles: () => sneezles, interact: (en) => cb.interact(en) });
  G.World = W;
})();
