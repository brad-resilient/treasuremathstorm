/* The side-scrolling garden: drawing, walking, tapping and bumping into things. */
(function () {
  'use strict';
  const G = (window.G = window.G || {});
  const VW = 960, VH = 540, GROUND = 430, WW = 2700;
  const W = { paused: false, running: false, VW, VH, WW };
  const HELPERS = ['🐞', '🦋', '🐛', '🐿️', '🐇', '🐢', '🐦', '🐭'];
  const PALETTES = [
    { sky: ['#8fd3ff', '#e3f6ff'], far: '#9bd68c', mid: '#6cc070', ground: '#58a94f', dirt: '#8a5a3a' },
    { sky: ['#ffd9a0', '#fff3d6'], far: '#c7d77e', mid: '#8fbf5a', ground: '#6aa84f', dirt: '#8a5a3a' },
    { sky: ['#4a4e8f', '#a7a3d9'], far: '#4f8f8a', mid: '#3f7f6f', ground: '#3f8a5f', dirt: '#5a4a3a' },
  ];
  let cv, ctx, last = 0, cam = 0, t = 0, ents = [], sneezles = [], hero, cb = {}, zone = 0, cfg = {}, keys = {}, decor = [];
  const rand = (a, b) => a + Math.random() * (b - a);

  function init() {
    cv = document.getElementById('game'); ctx = cv.getContext('2d');
    resize(); window.addEventListener('resize', resize);
    cv.addEventListener('pointerdown', onDown);
    window.addEventListener('keydown', (e) => {
      keys[e.key] = true;
      if (W.running && !W.paused && (e.key === ' ' || e.key === 'Enter' || e.key === 'ArrowUp')) { e.preventDefault(); useNearest(); }
    });
    window.addEventListener('keyup', (e) => { keys[e.key] = false; });
    requestAnimationFrame(loop);
  }
  function resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    cv.width = VW * dpr; cv.height = VH * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  /* opts: { zone, zoneInfo, beds:[{color,done,magic}], pieces(), climb, hazards } */
  function start(opts, callbacks) {
    cfg = opts; cb = callbacks; zone = opts.zone; ents = []; sneezles = []; keys = {};
    hero = { x: 120, target: null, pending: null, face: 1, phase: 0, immune: 0, spin: 0 };
    cam = 0;
    ents.push({ type: 'shop', x: 380, w: 150, top: 270 });
    ents.push({ type: 'station', x: 1050, w: 170, top: 240 });
    const slots = [720, 1420, 1850, 2180];
    opts.beds.forEach((b, i) => {
      b.x = slots[i];
      ents.push({ type: 'bed', x: b.x, w: 130, top: 360, bed: b });
      if (!b.done) ents.push({ type: 'star', x: rand(250, 2250), home: rand(250, 2250), dir: 1, w: 70, top: 350, bed: b, emoji: HELPERS[(i * 3 + 1) % HELPERS.length] });
    });
    ents.filter((e) => e.type === 'star').forEach((e) => { e.home = e.x; });
    for (let i = 0; i < 4; i++) { const x = 250 + i * 520 + rand(0, 200); ents.push({ type: 'helper', x, home: x, dir: i % 2 ? 1 : -1, w: 70, top: 350, emoji: HELPERS[Math.floor(rand(0, HELPERS.length))], away: 0 }); }
    ents.push({ type: 'gate', x: 2520, w: 190, top: 220 });
    if (opts.hazards && opts.climb >= 1) {
      const n = Math.min(4, 1 + Math.floor(opts.climb / 2));
      for (let i = 0; i < n; i++) sneezles.push(newSneezle(600 + i * 500));
    }
    decor = [];
    let seed = zone * 97 + 13;
    const sr = () => { seed = (seed * 9301 + 49297) % 233280; return seed / 233280; };
    for (let i = 0; i < 60; i++) decor.push({ x: sr() * WW, kind: sr() < 0.5 ? 'flower' : 'tuft', c: ['#ff8fab', '#ffd43b', '#fff', '#b197fc'][Math.floor(sr() * 4)], s: 0.7 + sr() * 0.6 });
    for (let i = 0; i < 9; i++) decor.push({ x: 150 + i * 300 + sr() * 120, kind: 'tree', s: 0.8 + sr() * 0.5 });
    W.running = true; W.paused = false;
  }
  function newSneezle(x) { return { x, y: rand(330, 390), vx: (Math.random() < 0.5 ? -1 : 1) * (45 + 12 * Math.min(6, cfg.climb || 0)), ph: rand(0, 6), away: 0 }; }
  function stop() { W.running = false; }

  function onDown(e) {
    if (!W.running || W.paused) return;
    G.Audio.unlock();
    const r = cv.getBoundingClientRect();
    const wx = (e.clientX - r.left) / r.width * VW + cam, wy = (e.clientY - r.top) / r.height * VH;
    for (const s of sneezles) if (!s.away && Math.abs(wx - s.x) < 45 && Math.abs(wy - (s.y + Math.sin(s.ph) * 14)) < 45) { s.away = 8; G.Audio.sfx.pop(); if (cb.popped) cb.popped(); return; }
    let hit = null, best = 1e9;
    for (const en of ents) {
      if (en.away) continue;
      const d = Math.abs(wx - en.x);
      if (d < en.w / 2 + 12 && wy > en.top - 30 && d < best) { best = d; hit = en; }
    }
    hero.pending = hit; hero.target = hit ? hit.x : Math.max(40, Math.min(WW - 40, wx));
  }
  function useNearest() {
    let hit = null, best = 80;
    for (const en of ents) { if (en.away) continue; const d = Math.abs(hero.x - en.x); if (d < best) { best = d; hit = en; } }
    if (hit) { hero.target = null; hero.pending = null; cb.interact(hit); }
  }
  function hideEntity(en, secs) { en.away = secs; }
  function removeEntity(en) { ents = ents.filter((x) => x !== en); }

  function update(dt) {
    t += dt;
    let move = 0;
    if (keys.ArrowLeft || keys.a) move = -1; else if (keys.ArrowRight || keys.d) move = 1;
    if (move) { hero.target = null; hero.pending = null; }
    if (hero.pending && !hero.pending.away) hero.target = hero.pending.x;
    if (hero.target != null) {
      const d = hero.target - hero.x;
      if (Math.abs(d) < 10) {
        const p = hero.pending; hero.target = null; hero.pending = null;
        if (p) cb.interact(p);
      } else move = Math.sign(d);
    }
    if (move) { hero.x = Math.max(40, Math.min(WW - 40, hero.x + move * 250 * dt)); hero.face = move; hero.phase += dt * 10; } else hero.phase = 0;
    if (hero.immune > 0) hero.immune -= dt;
    if (hero.spin > 0) hero.spin -= dt;
    for (const en of ents) {
      if (en.away) { en.away -= dt; if (en.away <= 0) { en.away = 0; en.x = en.home = rand(250, 2300); en.emoji = HELPERS[Math.floor(rand(0, HELPERS.length))]; } continue; }
      if ((en.type === 'helper' || en.type === 'star') && hero.pending !== en) {
        en.x += en.dir * 14 * dt;
        if (Math.abs(en.x - en.home) > 70) en.dir = -Math.sign(en.x - en.home);
      }
    }
    for (const s of sneezles) {
      if (s.away) { s.away -= dt; if (s.away <= 0) { s.away = 0; s.x = hero.x + (Math.random() < 0.5 ? -700 : 700); } continue; }
      s.x += s.vx * dt; s.ph += dt * 2;
      if (s.x < 60 || s.x > WW - 60) s.vx *= -1;
      if (hero.immune <= 0 && Math.abs(s.x - hero.x) < 38) { hero.immune = 3; hero.spin = 0.6; s.vx *= -1; cb.sneezed(); }
    }
    cam += (Math.max(0, Math.min(WW - VW, hero.x - VW * 0.4)) - cam) * Math.min(1, dt * 5);
  }

  /* ---------- drawing ---------- */
  function emoji(ch, x, y, size) { ctx.font = `${size}px "Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic'; ctx.fillText(ch, x, y); }
  function label(text, x, y, size, bg) {
    ctx.font = `700 ${size || 18}px ui-rounded,"Trebuchet MS",system-ui,sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    const w = ctx.measureText(text).width + 18;
    ctx.fillStyle = bg || 'rgba(255,255,255,.92)'; rr(x - w / 2, y - 14, w, 28, 12); ctx.fill();
    ctx.fillStyle = '#2b2a4c'; ctx.fillText(text, x, y + 1);
  }
  function rr(x, y, w, h, r) { ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r); ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath(); }
  function hills(color, par, amp, base, freq) {
    ctx.fillStyle = color; ctx.beginPath(); ctx.moveTo(0, VH);
    for (let x = 0; x <= VW; x += 20) ctx.lineTo(x, base - Math.sin((x + cam * par) * freq) * amp - Math.sin((x + cam * par) * freq * 2.3) * amp * 0.4);
    ctx.lineTo(VW, VH); ctx.fill();
  }
  function draw() {
    const P = PALETTES[zone % 3], zi = cfg.zoneInfo;
    const g = ctx.createLinearGradient(0, 0, 0, GROUND); g.addColorStop(0, P.sky[0]); g.addColorStop(1, P.sky[1]);
    ctx.fillStyle = g; ctx.fillRect(0, 0, VW, VH);
    ctx.fillStyle = zone === 2 ? '#fff8d6' : '#ffe066'; ctx.beginPath(); ctx.arc(800 - cam * 0.05, 90, zone === 2 ? 34 : 46, 0, 7); ctx.fill();
    hills(P.far, 0.2, 40, 300, 0.006); hills(P.mid, 0.45, 28, 360, 0.009);
    ctx.fillStyle = P.ground; ctx.fillRect(0, GROUND, VW, VH - GROUND);
    ctx.fillStyle = 'rgba(0,0,0,.08)'; ctx.fillRect(0, GROUND, VW, 6);
    ctx.save(); ctx.translate(-cam, 0);
    for (const d of decor) {
      if (d.x < cam - 120 || d.x > cam + VW + 120) continue;
      if (d.kind === 'tree') {
        ctx.fillStyle = '#7a5230'; ctx.fillRect(d.x - 8 * d.s, GROUND - 90 * d.s, 16 * d.s, 90 * d.s);
        ctx.fillStyle = zone === 2 ? '#2f6f5f' : '#4c9f50'; ctx.beginPath(); ctx.arc(d.x, GROUND - 120 * d.s, 55 * d.s, 0, 7); ctx.fill();
        if (zone === 1) { ctx.fillStyle = '#e03131'; for (let i = 0; i < 5; i++) { ctx.beginPath(); ctx.arc(d.x + Math.cos(i * 1.9) * 30 * d.s, GROUND - 120 * d.s + Math.sin(i * 2.7) * 28 * d.s, 6, 0, 7); ctx.fill(); } }
      } else if (d.kind === 'flower') {
        ctx.strokeStyle = '#2f7d32'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(d.x, GROUND + 30); ctx.lineTo(d.x, GROUND + 14); ctx.stroke();
        ctx.fillStyle = d.c; ctx.beginPath(); ctx.arc(d.x, GROUND + 12, 5 * d.s, 0, 7); ctx.fill();
      } else {
        ctx.strokeStyle = 'rgba(0,60,0,.35)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(d.x - 5, GROUND + 60); ctx.lineTo(d.x, GROUND + 48); ctx.lineTo(d.x + 5, GROUND + 60); ctx.stroke();
      }
    }
    if (zone === 2) { ctx.fillStyle = '#fff3a0'; for (let i = 0; i < 24; i++) { const fx = (i * 137 + Math.sin(t + i) * 30) % WW, fy = 120 + ((i * 71) % 230) + Math.cos(t * 1.3 + i) * 12; ctx.globalAlpha = 0.5 + 0.5 * Math.sin(t * 3 + i); ctx.beginPath(); ctx.arc(fx, fy, 3, 0, 7); ctx.fill(); } ctx.globalAlpha = 1; }

    for (const en of ents) {
      if (en.away || en.x < cam - 200 || en.x > cam + VW + 200) continue;
      const x = en.x;
      if (en.type === 'shop') {
        ctx.fillStyle = '#c98b4b'; rr(x - 70, GROUND - 110, 140, 110, 8); ctx.fill();
        ctx.fillStyle = '#fff'; ctx.fillRect(x - 55, GROUND - 78, 110, 44);
        for (let i = 0; i < 6; i++) { ctx.fillStyle = i % 2 ? '#fff' : '#ff6b6b'; ctx.fillRect(x - 78 + i * 26, GROUND - 140, 26, 34); }
        emoji(zi.shopkeeper, x, GROUND - 42, 38); label('Shop', x, GROUND - 160);
      } else if (en.type === 'station') {
        ctx.fillStyle = ['#f4a259', '#d9534f', '#5f7fbf'][zone]; rr(x - 80, GROUND - 130, 160, 130, 10); ctx.fill();
        ctx.fillStyle = ['#bc6c25', '#8f2d2a', '#3b4f8f'][zone]; ctx.beginPath(); ctx.moveTo(x - 100, GROUND - 126); ctx.lineTo(x, GROUND - 200); ctx.lineTo(x + 100, GROUND - 126); ctx.fill();
        ctx.fillStyle = '#4a2f1b'; rr(x - 26, GROUND - 76, 52, 76, 22); ctx.fill();
        emoji(zi.icon, x, GROUND - 140, 34); emoji(zi.keeper.emoji, x + 58, GROUND - 6, 40); label(zi.station, x, GROUND - 216);
      } else if (en.type === 'bed') {
        const b = en.bed;
        ctx.fillStyle = b.color.c; rr(x - 62, GROUND - 26, 124, 44, 10); ctx.fill();
        ctx.fillStyle = P.dirt; rr(x - 54, GROUND - 20, 108, 32, 8); ctx.fill();
        if (b.done) { emoji('🌻', x - 26, GROUND - 16, 44); emoji('🌷', x + 26, GROUND - 16, 40); emoji('💎', x, GROUND - 62 + Math.sin(t * 3) * 4, 26); }
        else if (b.magic != null) { label(`Plant ${b.magic}`, x, GROUND - 52, 18, '#fff9db'); }
        else { emoji('🌱', x, GROUND - 14, 26); }
      } else if (en.type === 'helper' || en.type === 'star') {
        const bob = Math.sin(t * 4 + x) * 3;
        emoji(en.emoji, x, GROUND - 4 + bob, 44);
        if (en.type === 'star') { ctx.fillStyle = en.bed.color.c; ctx.beginPath(); ctx.arc(x + 4, GROUND - 78 + bob, 20, 0, 7); ctx.fill(); ctx.fillStyle = '#fff'; ctx.font = '700 24px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('★', x + 4, GROUND - 77 + bob); }
        else { ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(x + 4, GROUND - 74 + bob, 16, 0, 7); ctx.fill(); ctx.fillStyle = '#2b2a4c'; ctx.font = '700 22px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('?', x + 4, GROUND - 73 + bob); }
      } else if (en.type === 'gate') {
        const n = cfg.pieces(), open = n >= 4;
        ctx.fillStyle = '#6b4f3a'; ctx.fillRect(x - 80, GROUND - 190, 22, 190); ctx.fillRect(x + 58, GROUND - 190, 22, 190);
        ctx.fillStyle = open ? '#ffd43b' : '#8d6e55'; rr(x - 92, GROUND - 214, 184, 36, 12); ctx.fill();
        for (let i = 0; i < 4; i++) { ctx.fillStyle = 'rgba(255,255,255,.35)'; rr(x - 54 + i * 28, GROUND - 150, 24, 30, 6); ctx.fill(); if (i < n) emoji(zi.piece, x - 42 + i * 28, GROUND - 126, 22); }
        if (zone === 2) emoji('🦉', x, GROUND - 216, 40);
        emoji(open ? '➡️' : '🔒', x, GROUND - 40, 44);
        label(zi.gateName, x, GROUND - 246);
      }
    }
    for (const s of sneezles) {
      if (s.away) continue;
      const y = s.y + Math.sin(s.ph) * 14;
      ctx.fillStyle = 'rgba(255,255,255,.95)';
      [[-18, 4, 18], [0, -8, 22], [20, 4, 17], [2, 10, 18]].forEach(([dx, dy, r]) => { ctx.beginPath(); ctx.arc(s.x + dx, y + dy, r, 0, 7); ctx.fill(); });
      ctx.fillStyle = '#495057'; ctx.beginPath(); ctx.arc(s.x - 8, y, 3, 0, 7); ctx.arc(s.x + 10, y, 3, 0, 7); ctx.fill();
      ctx.strokeStyle = '#495057'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(s.x + 1, y + 12, 5, Math.PI, 0); ctx.stroke();
    }
    // hero
    ctx.save(); ctx.translate(hero.x, GROUND);
    if (hero.spin > 0) ctx.rotate(hero.spin * 10);
    if (hero.immune > 0 && Math.floor(t * 10) % 2) ctx.globalAlpha = 0.5;
    const sw = Math.sin(hero.phase) * 8;
    ctx.strokeStyle = '#3b3a55'; ctx.lineWidth = 7; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(-8, -18); ctx.lineTo(-8 + sw, 0); ctx.moveTo(8, -18); ctx.lineTo(8 - sw, 0); ctx.stroke();
    ctx.fillStyle = G.state.coat; rr(-20, -62, 40, 48, 14); ctx.fill();
    ctx.fillStyle = '#ffe0bd'; ctx.beginPath(); ctx.arc(0, -78, 19, 0, 7); ctx.fill();
    ctx.fillStyle = '#2b2a4c'; ctx.beginPath(); ctx.arc(hero.face * 7 - 5, -80, 2.6, 0, 7); ctx.arc(hero.face * 7 + 6, -80, 2.6, 0, 7); ctx.fill();
    ctx.strokeStyle = '#2b2a4c'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(hero.face * 7, -73, 5, 0.2, Math.PI - 0.2); ctx.stroke();
    if (G.state.hat) emoji(G.state.hat, 0, -92, 30);
    ctx.restore();
    ctx.restore();
  }
  function loop(ts) {
    const dt = Math.min(0.05, (ts - last) / 1000 || 0); last = ts;
    if (W.running) { if (!W.paused) update(dt); draw(); }
    requestAnimationFrame(loop);
  }
  Object.assign(W, { init, start, stop, hideEntity, removeEntity, hero: () => hero, ents: () => ents, sneezles: () => sneezles, interact: (en) => cb.interact(en) });
  G.World = W;
})();
