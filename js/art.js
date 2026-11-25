/* Hand-drawn (in code) characters, hats, items and story scenes. Everything is vector art on canvas. */
(function () {
  'use strict';
  const G = (window.G = window.G || {});
  const TAU = Math.PI * 2, OUT = '#3a2d4f';
  function ell(c, x, y, rx, ry, fill, stroke, lw) {
    c.beginPath(); c.ellipse(x, y, Math.abs(rx), Math.abs(ry), 0, 0, TAU);
    if (fill) { c.fillStyle = fill; c.fill(); }
    if (stroke) { c.strokeStyle = stroke; c.lineWidth = lw || 2.5; c.stroke(); }
  }
  function poly(c, pts, fill, stroke, lw) {
    c.beginPath(); pts.forEach((p, i) => (i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1]))); c.closePath();
    if (fill) { c.fillStyle = fill; c.fill(); }
    if (stroke) { c.strokeStyle = stroke; c.lineWidth = lw || 2.5; c.lineJoin = 'round'; c.stroke(); }
  }
  function line(c, pts, stroke, lw) { c.beginPath(); pts.forEach((p, i) => (i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1]))); c.strokeStyle = stroke; c.lineWidth = lw || 2.5; c.lineCap = 'round'; c.lineJoin = 'round'; c.stroke(); }
  function rr(c, x, y, w, h, r, fill, stroke, lw) {
    c.beginPath(); c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r); c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath();
    if (fill) { c.fillStyle = fill; c.fill(); }
    if (stroke) { c.strokeStyle = stroke; c.lineWidth = lw || 2.5; c.stroke(); }
  }
  function shade(hex, amt) {
    const n = parseInt(hex.slice(1), 16);
    const f = (v) => Math.max(0, Math.min(255, Math.round(amt < 0 ? v * (1 + amt) : v + (255 - v) * amt)));
    return `rgb(${f(n >> 16)},${f((n >> 8) & 255)},${f(n & 255)})`;
  }
  function eyes(c, x, y, gap, r, t, seed, white) {
    const blink = ((t + (seed || 0) * 1.7) % 3.7) < 0.13;
    for (const s of [-1, 1]) {
      if (blink) line(c, [[x + s * gap - r, y], [x + s * gap + r, y]], white ? '#fff' : OUT, 2);
      else if (white) { ell(c, x + s * gap, y, r * 1.2, r * 1.4, '#fff'); ell(c, x + s * gap + r * 0.3, y, r * 0.6, r * 0.75, OUT); }
      else { ell(c, x + s * gap, y, r, r * 1.3, OUT); ell(c, x + s * gap + r * 0.3, y - r * 0.45, r * 0.38, r * 0.38, '#fff'); }
    }
  }
  function blush(c, x, y, gap, r) { c.globalAlpha *= 0.5; ell(c, x - gap, y, r, r * 0.65, '#ff7a93'); ell(c, x + gap, y, r, r * 0.65, '#ff7a93'); c.globalAlpha /= 0.5; }
  function smile(c, x, y, w, col) { c.beginPath(); c.arc(x, y, w, 0.12 * Math.PI, 0.88 * Math.PI); c.strokeStyle = col || OUT; c.lineWidth = 2; c.lineCap = 'round'; c.stroke(); }
  function face(c, x, y, s, t, seed) { eyes(c, x, y, 7 * s, 2.8 * s, t, seed); blush(c, x, y + 5.5 * s, 12 * s, 3.6 * s); smile(c, x, y + 2.5 * s, 3.6 * s); }

  /* Each critter is drawn standing on (0,0), facing right, roughly 60px tall. */
  const CR = {
    ladybug(c, t, s) {
      line(c, [[-12, -6], [-16, 0]], OUT, 3); line(c, [[2, -6], [2, 0]], OUT, 3); line(c, [[14, -6], [18, 0]], OUT, 3);
      ell(c, 20, -22, 13, 14, '#3a2d4f');
      line(c, [[22, -34], [26, -44]], OUT, 2); line(c, [[28, -32], [36, -40]], OUT, 2); ell(c, 26, -45, 2.5, 2.5, OUT); ell(c, 37, -41, 2.5, 2.5, OUT);
      ell(c, -2, -24, 27, 22, '#ee3d4a', OUT);
      c.save(); c.beginPath(); c.ellipse(-2, -24, 27, 22, 0, 0, TAU); c.clip();
      ell(c, -8, -34, 22, 10, 'rgba(255,255,255,.22)');
      [[-14, -30, 5], [-16, -13, 4.5], [2, -34, 4.5], [4, -12, 5], [-2, -23, 4]].forEach((p) => ell(c, p[0], p[1], p[2], p[2], '#3a2d4f'));
      c.restore();
      eyes(c, 23, -23, 4.5, 2.6, t, s, true); smile(c, 24, -19, 3, '#fff');
    },
    bee(c, t, s) {
      const y = -34 + Math.sin(t * 5 + s) * 4, f = Math.sin(t * 40);
      c.save(); c.translate(0, y);
      c.globalAlpha = 0.75; ell(c, -6, -16 - f * 2, 9, 16 + f * 3, '#dff3ff', '#9ecbe8', 1.5); ell(c, 6, -15 + f * 2, 8, 14 - f * 3, '#dff3ff', '#9ecbe8', 1.5); c.globalAlpha = 1;
      poly(c, [[-22, 0], [-30, -2], [-22, 4]], OUT);
      ell(c, 0, 0, 22, 17, '#ffd43b', OUT);
      c.save(); c.beginPath(); c.ellipse(0, 0, 22, 17, 0, 0, TAU); c.clip(); c.fillStyle = '#3a2d4f'; c.fillRect(-14, -20, 7, 40); c.fillRect(-2, -20, 7, 40); c.restore();
      line(c, [[12, -14], [14, -24]], OUT, 2); line(c, [[17, -12], [22, -21]], OUT, 2);
      eyes(c, 13, -2, 4.5, 2.4, t, s); blush(c, 13, 3, 8, 2.6); smile(c, 13, 1, 2.6);
      c.restore();
    },
    butterfly(c, t, s) {
      const y = -36 + Math.sin(t * 3 + s) * 6, f = 0.35 + 0.65 * Math.abs(Math.sin(t * 9 + s));
      c.save(); c.translate(0, y);
      for (const d of [-1, 1]) { c.save(); c.scale(d * f, 1); ell(c, 15, -8, 15, 17, '#b197fc', OUT); ell(c, 12, 12, 10, 11, '#f783ac', OUT); ell(c, 16, -9, 6, 7, '#fff3bf'); c.restore(); }
      ell(c, 0, 0, 5, 16, '#5c4b7a', OUT, 2); line(c, [[-1, -15], [-6, -26]], OUT, 2); line(c, [[1, -15], [6, -26]], OUT, 2);
      eyes(c, 0, -8, 2.6, 1.5, t, s, true);
      c.restore();
    },
    caterpillar(c, t, s) {
      for (let i = 4; i >= 1; i--) ell(c, -i * 13 + 8, -12 - Math.sin(t * 5 + i + s) * 4, 11, 11, i % 2 ? '#8ce99a' : '#69db7c', OUT);
      ell(c, 12, -18 - Math.sin(t * 5 + s) * 3, 15, 15, '#b2f2bb', OUT);
      line(c, [[8, -31], [5, -40]], OUT, 2); line(c, [[16, -31], [20, -40]], OUT, 2);
      face(c, 14, -20 - Math.sin(t * 5 + s) * 3, 0.75, t, s);
    },
    snail(c, t, s) {
      const st = Math.sin(t * 2 + s) * 2;
      rr(c, -28, -12, 62, 13, 6, '#f3d9b1', OUT);
      line(c, [[26, -10], [28, -30 + st]], '#f3d9b1', 6); line(c, [[20, -10], [18, -30 - st]], '#f3d9b1', 6);
      ell(c, 28, -33 + st, 5, 5, '#fff', OUT, 2); ell(c, 18, -33 - st, 5, 5, '#fff', OUT, 2); ell(c, 29, -33 + st, 2, 2, OUT); ell(c, 19, -33 - st, 2, 2, OUT);
      ell(c, -6, -30, 24, 24, '#f08c3c', OUT);
      c.beginPath(); for (let a = 0; a < 15; a += 0.2) { const r = 20 - a * 1.3; c.lineTo(-6 + Math.cos(a) * r, -30 + Math.sin(a) * r); } c.strokeStyle = '#a8501a'; c.lineWidth = 2.5; c.stroke();
      ell(c, -13, -39, 7, 4, 'rgba(255,255,255,.35)');
      smile(c, 27, -9, 3);
    },
    hedgehog(c, t, s) {
      const sp = []; for (let i = 0; i <= 14; i++) { const a = Math.PI * (1.02 - i / 14 * 0.92), r = i % 2 ? 36 : 26; sp.push([-4 + Math.cos(a) * r * 1.05, -20 - Math.sin(a) * r * 0.95]); }
      sp.push([22, -6], [-30, -4]); poly(c, sp, '#8d5a3b', OUT);
      ell(c, 4, -17, 24, 17, '#f5d6a8', OUT);
      ell(c, -8, 0, 6, 3.5, '#8d5a3b'); ell(c, 12, 0, 6, 3.5, '#8d5a3b');
      ell(c, 29, -15, 4, 3.5, OUT); ell(c, 2, -33, 5, 5, '#f5d6a8', OUT, 2);
      face(c, 14, -20, 0.8, t, s);
    },
    frog(c, t, s) {
      const sq = 1 + Math.sin(t * 2.5 + s) * 0.03;
      c.save(); c.scale(1 / sq, sq);
      ell(c, -20, -4, 12, 6, '#51cf66', OUT); ell(c, 20, -4, 12, 6, '#51cf66', OUT);
      ell(c, 0, -22, 27, 22, '#69db7c', OUT); ell(c, 0, -14, 17, 12, '#d8f5a2');
      for (const d of [-1, 1]) { ell(c, d * 13, -42, 10, 10, '#69db7c', OUT); ell(c, d * 13, -42, 6.5, 6.5, '#fff'); }
      eyes(c, 0, -42, 13, 3, t, s);
      blush(c, 0, -24, 17, 4); c.beginPath(); c.arc(0, -30, 13, 0.15 * Math.PI, 0.85 * Math.PI); c.strokeStyle = OUT; c.lineWidth = 2.2; c.stroke();
      c.restore();
    },
    owl(c, t, s) {
      poly(c, [[-18, -48], [-22, -62], [-8, -54]], '#8a5a3c', OUT); poly(c, [[18, -48], [22, -62], [8, -54]], '#8a5a3c', OUT);
      ell(c, 0, -28, 25, 28, '#a9744f', OUT); ell(c, 0, -20, 16, 18, '#f3d9b1');
      for (let i = 0; i < 3; i++) for (let j = -1; j <= 1; j++) line(c, [[j * 8 - 3 + (i % 2) * 4, -24 + i * 8], [j * 8 + (i % 2) * 4, -21 + i * 8], [j * 8 + 3 + (i % 2) * 4, -24 + i * 8]], '#c9a37a', 1.6);
      ell(c, -24, -24, 7, 15, '#8a5a3c', OUT); ell(c, 24, -24, 7, 15, '#8a5a3c', OUT);
      for (const d of [-1, 1]) { ell(c, d * 10, -40, 10, 10, '#fff', OUT, 2); }
      eyes(c, 0, -40, 10, 4, t, s);
      poly(c, [[-4, -34], [4, -34], [0, -27]], '#ffa94d', OUT, 1.5);
      ell(c, -8, 0, 6, 3, '#ffa94d', OUT, 1.5); ell(c, 8, 0, 6, 3, '#ffa94d', OUT, 1.5);
    },
    squirrel(c, t, s) {
      const w = Math.sin(t * 3 + s) * 3;
      c.beginPath(); c.moveTo(-12, -6); c.bezierCurveTo(-46, -4, -50 + w, -56, -22 + w, -62); c.bezierCurveTo(-4 + w, -64, -6, -40, -18, -38); c.bezierCurveTo(-26, -30, -14, -20, -8, -18); c.closePath(); c.fillStyle = '#d9773a'; c.fill(); c.strokeStyle = OUT; c.lineWidth = 2.5; c.stroke();
      ell(c, 2, -18, 17, 19, '#e8904f', OUT); ell(c, 5, -13, 10, 12, '#fbe3c2');
      poly(c, [[2, -52], [0, -64], [10, -56]], '#e8904f', OUT); poly(c, [[16, -54], [20, -65], [24, -52]], '#e8904f', OUT);
      ell(c, 12, -42, 15, 14, '#e8904f', OUT); ell(c, 26, -38, 2.5, 2.2, OUT);
      face(c, 15, -43, 0.75, t, s);
      ell(c, -4, 0, 8, 4, '#d9773a', OUT, 2); ell(c, 12, 0, 8, 4, '#d9773a', OUT, 2);
    },
    bunny(c, t, s) {
      const e = Math.sin(t * 2 + s) * 0.08;
      for (const d of [-1, 1]) { c.save(); c.translate(6 + d * 7, -52); c.rotate(d * 0.18 + e * d); ell(c, 0, -17, 6.5, 19, '#fff', OUT); ell(c, 0, -16, 3, 13, '#ffc9d6'); c.restore(); }
      ell(c, -18, -12, 7, 7, '#fff', OUT); ell(c, 0, -18, 19, 19, '#fff', OUT);
      ell(c, 8, -42, 16, 15, '#fff', OUT); ell(c, 14, -38, 2.4, 2, '#ff8fa3');
      face(c, 11, -44, 0.78, t, s);
      ell(c, -6, 0, 9, 4, '#fff', OUT, 2); ell(c, 10, 0, 9, 4, '#fff', OUT, 2);
    },
    duck(c, t, s) {
      const b = Math.sin(t * 3 + s) * 1.5;
      ell(c, -6, 0, 7, 3, '#ff922b', OUT, 1.5); ell(c, 8, 0, 7, 3, '#ff922b', OUT, 1.5);
      poly(c, [[-26, -26], [-36, -34], [-22, -16]], '#ffe066', OUT);
      ell(c, -2, -18, 25, 18, '#ffe066', OUT); ell(c, -6, -17, 13, 9, '#ffd43b', '#e0a800', 1.5);
      ell(c, 14, -42 + b, 15, 15, '#ffe066', OUT);
      ell(c, 30, -39 + b, 9, 5, '#ff922b', OUT, 2);
      eyes(c, 17, -45 + b, 5, 2.6, t, s); blush(c, 16, -39 + b, 9, 3);
    },
    mouse(c, t, s) {
      c.beginPath(); c.moveTo(-18, -8); c.bezierCurveTo(-40, -6, -36, -30, -48, -26 + Math.sin(t * 3 + s) * 4); c.strokeStyle = '#f4a7b9'; c.lineWidth = 3.5; c.lineCap = 'round'; c.stroke();
      ell(c, 0, -15, 21, 16, '#c9c6d6', OUT); ell(c, 3, -10, 12, 9, '#f1eff7');
      for (const d of [-1, 1]) { ell(c, 12 + d * 12, -44, 10, 10, '#c9c6d6', OUT); ell(c, 12 + d * 12, -44, 6, 6, '#ffc9d6'); }
      ell(c, 12, -30, 15, 13, '#c9c6d6', OUT); ell(c, 27, -27, 2.6, 2.4, '#ff8fa3', OUT, 1);
      face(c, 15, -32, 0.7, t, s);
    },
    bird(c, t, s) {
      const h = Math.abs(Math.sin(t * 4 + s)) * 4;
      c.save(); c.translate(0, -h);
      line(c, [[-4, -4], [-4, 2 + h]], '#ff922b', 2.5); line(c, [[6, -4], [6, 2 + h]], '#ff922b', 2.5);
      poly(c, [[-18, -22], [-36, -30], [-34, -18], [-20, -12]], '#4dabf7', OUT);
      ell(c, 0, -24, 23, 22, '#74c0fc', OUT); ell(c, 4, -16, 14, 12, '#e7f5ff');
      ell(c, -8, -22, 10, 13, '#4dabf7', OUT, 2);
      poly(c, [[21, -30], [33, -26], [21, -21]], '#ffa94d', OUT, 2);
      line(c, [[-2, -46], [-6, -54]], '#4dabf7', 3); line(c, [[2, -46], [4, -55]], '#4dabf7', 3);
      eyes(c, 10, -31, 6, 2.8, t, s); blush(c, 10, -25, 10, 3);
      c.restore();
    },
    turtle(c, t, s) {
      const n = Math.sin(t * 2 + s) * 2;
      ell(c, -16, -3, 7, 5, '#8ce99a', OUT); ell(c, 14, -3, 7, 5, '#8ce99a', OUT);
      ell(c, 28 + n, -20, 12, 11, '#b2f2bb', OUT);
      c.beginPath(); c.moveTo(-28, -8); c.bezierCurveTo(-28, -48, 24, -48, 24, -8); c.closePath(); c.fillStyle = '#40a85a'; c.fill(); c.strokeStyle = OUT; c.lineWidth = 2.5; c.stroke();
      [[-12, -22], [4, -30], [10, -16], [-4, -13]].forEach((p) => ell(c, p[0], p[1], 6, 5, '#2f8a47'));
      rr(c, -30, -11, 56, 6, 3, '#ffe8a3', OUT, 2);
      eyes(c, 31 + n, -22, 4, 2.2, t, s); smile(c, 31 + n, -18, 3);
    },
  };

  const HATS = { '🌼': 'flower', '🧢': 'cap', '🎀': 'bow', '🎩': 'tophat', '⛑️': 'helmet', '🎓': 'grad', '👑': 'crown' };
  function hat(c, key) {
    const k = HATS[key] || key;
    if (k === 'flower') { for (let i = 0; i < 8; i++) { const a = i / 8 * TAU; ell(c, Math.cos(a) * 8, -8 + Math.sin(a) * 8, 5.5, 5.5, '#fff', OUT, 1.5); } ell(c, 0, -8, 6, 6, '#ffd43b', OUT, 1.5); }
    else if (k === 'cap') { c.beginPath(); c.arc(0, 0, 17, Math.PI, 0); c.closePath(); c.fillStyle = '#339af0'; c.fill(); c.strokeStyle = OUT; c.lineWidth = 2.5; c.stroke(); rr(c, 4, -4, 24, 6, 3, '#1c7ed6', OUT, 2); ell(c, 0, -17, 3, 3, '#fff', OUT, 1.5); }
    else if (k === 'bow') { poly(c, [[0, -8], [-18, -18], [-18, 2]], '#f783ac', OUT); poly(c, [[0, -8], [18, -18], [18, 2]], '#f783ac', OUT); ell(c, 0, -8, 5, 5, '#e64980', OUT, 2); }
    else if (k === 'tophat') { rr(c, -12, -30, 24, 28, 3, '#343a40', OUT); c.fillStyle = '#e03131'; c.fillRect(-12, -10, 24, 6); rr(c, -22, -3, 44, 6, 3, '#343a40', OUT); }
    else if (k === 'helmet') { c.beginPath(); c.arc(0, 0, 18, Math.PI, 0); c.closePath(); c.fillStyle = '#ffd43b'; c.fill(); c.strokeStyle = OUT; c.lineWidth = 2.5; c.stroke(); rr(c, -22, -3, 46, 6, 3, '#fab005', OUT, 2); rr(c, -3, -20, 6, 16, 2, '#fab005'); }
    else if (k === 'grad') { rr(c, -13, -10, 26, 10, 3, '#343a40', OUT); poly(c, [[0, -22], [26, -13], [0, -5], [-26, -13]], '#495057', OUT); line(c, [[0, -13], [20, -11], [20, 2]], '#ffd43b', 2.5); ell(c, 20, 4, 3, 4, '#ffd43b'); }
    else if (k === 'crown') { poly(c, [[-17, 0], [-19, -20], [-9, -10], [0, -24], [9, -10], [19, -20], [17, 0]], '#ffd43b', OUT); ell(c, 0, -6, 3, 3, '#e03131'); ell(c, -10, -5, 2.4, 2.4, '#4dabf7'); ell(c, 10, -5, 2.4, 2.4, '#4dabf7'); }
  }

  /* The child: a small helper in a hooded raincoat and boots. o = { coat, hat, phase, t, moving } */
  function hero(c, o) {
    const t = o.t || 0, sw = o.moving ? Math.sin(o.phase) : 0, bob = o.moving ? Math.abs(Math.cos(o.phase)) * 3 : Math.sin(t * 2.2) * 1.2;
    const coat = o.coat || '#e5484d', dark = shade(coat, -0.25), light = shade(coat, 0.25);
    rr(c, -13, -44 - bob, 12, 20, 5, '#a8713f', OUT);                       // backpack
    for (const d of [-1, 1]) {                                              // legs + boots
      const lx = d * 7 + d * sw * 7 * (d > 0 ? 1 : -1) * d, ly = -Math.max(0, d * sw) * 5;
      line(c, [[d * 6, -18 - bob], [lx, -6 + ly]], '#4c6ef5', 7);
      rr(c, lx - 6, -9 + ly, 15, 9, 4, '#ffd43b', OUT, 2);
    }
    c.save(); c.translate(0, -bob);
    c.beginPath(); c.moveTo(-13, -50); c.lineTo(13, -50); c.lineTo(18, -16); c.quadraticCurveTo(0, -11, -18, -16); c.closePath(); c.fillStyle = coat; c.fill(); c.strokeStyle = OUT; c.lineWidth = 2.5; c.lineJoin = 'round'; c.stroke();
    line(c, [[3, -48], [3, -16]], dark, 2); ell(c, 8, -38, 1.8, 1.8, dark); ell(c, 8, -28, 1.8, 1.8, dark);
    rr(c, -13, -30, 9, 8, 2, light);
    c.save(); c.translate(-2, -44); c.rotate(-sw * 0.7); rr(c, -5, 0, 10, 20, 5, coat, OUT, 2); ell(c, 0, 20, 4.5, 4.5, '#ffd9b8', OUT, 1.5); c.restore();
    ell(c, -2, -66, 21, 21, coat, OUT);                                       // hood
    ell(c, 3, -65, 16, 16, '#ffd9b8', OUT, 2);
    c.beginPath(); c.arc(3, -65, 16, Math.PI * 1.05, Math.PI * 1.7); c.strokeStyle = '#7a4b2a'; c.lineWidth = 5; c.stroke();  // fringe
    face(c, 7, -64, 0.85, t, 0.4);
    if (o.hat) { c.save(); c.translate(0, -86); hat(c, o.hat); c.restore(); }
    c.restore();
  }

  /* Small item icons centred on (0,0), about 24px. */
  function icon(c, k, t) {
    t = t || 0;
    if (k === 'coin') { ell(c, 0, 0, 11, 11, '#ffd43b', '#b8860b', 2); ell(c, 0, 0, 7.5, 7.5, null, '#e0a800', 1.5); c.fillStyle = '#8a6100'; c.font = '700 11px sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('¢', 0, 1); ell(c, -4, -5, 3, 1.6, 'rgba(255,255,255,.7)'); }
    else if (k === 'gem') { poly(c, [[-11, -4], [-6, -11], [6, -11], [11, -4], [0, 12]], '#3bc9db', '#0b7285', 2); poly(c, [[-11, -4], [-6, -11], [0, -4]], '#99e9f2'); poly(c, [[0, -4], [6, -11], [11, -4]], '#66d9e8'); poly(c, [[-11, -4], [0, -4], [0, 12]], '#22b8cf'); line(c, [[-11, -4], [11, -4]], '#0b7285', 1); const s = 0.6 + 0.4 * Math.sin(t * 5); c.globalAlpha *= s; star(c, 7, -9, 4, '#fff'); c.globalAlpha /= s; }
    else if (k === 'plank') { c.save(); c.rotate(-0.25); rr(c, -13, -5, 26, 10, 2, '#c98b4b', '#6b4423', 2); line(c, [[-8, -1], [6, -2]], '#a8713f', 1.2); line(c, [[-4, 2], [9, 2]], '#a8713f', 1.2); ell(c, -10, 0, 1.2, 1.2, '#6b4423'); ell(c, 10, 0, 1.2, 1.2, '#6b4423'); c.restore(); }
    else if (k === 'balloon') { line(c, [[0, 8], [-2, 14]], '#868e96', 1.2); ell(c, 0, -2, 9, 11, '#ff6b6b', '#c92a2a', 2); poly(c, [[-2, 9], [2, 9], [0, 6]], '#c92a2a'); ell(c, -3, -6, 2.5, 4, 'rgba(255,255,255,.6)'); }
    else if (k === 'key') { ell(c, -6, 0, 6, 6, null, '#e0a800', 3.5); line(c, [[0, 0], [12, 0]], '#e0a800', 3.5); line(c, [[8, 0], [8, 5]], '#e0a800', 3); line(c, [[12, 0], [12, 4]], '#e0a800', 3); }
  }
  function star(c, x, y, r, fill) { c.beginPath(); for (let i = 0; i < 8; i++) { const a = i / 8 * TAU, rr2 = i % 2 ? r * 0.35 : r; c.lineTo(x + Math.cos(a) * rr2, y + Math.sin(a) * rr2); } c.closePath(); c.fillStyle = fill; c.fill(); }
  function star5(c, x, y, r, fill, stroke) { c.beginPath(); for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i / 10 * TAU, q = i % 2 ? r * 0.45 : r; c.lineTo(x + Math.cos(a) * q, y + Math.sin(a) * q); } c.closePath(); c.fillStyle = fill; c.fill(); if (stroke) { c.strokeStyle = stroke; c.lineWidth = 2; c.lineJoin = 'round'; c.stroke(); } }

  function flower(c, x, y, r, col, t, seed) {
    const sway = Math.sin(t * 1.6 + (seed || 0)) * 0.08;
    c.save(); c.translate(x, y); c.rotate(sway);
    line(c, [[0, 0], [0, -r * 3.2]], '#2f9e44', Math.max(2, r * 0.35));
    ell(c, r * 0.9, -r * 1.4, r * 0.9, r * 0.4, '#51cf66');
    for (let i = 0; i < 7; i++) { const a = i / 7 * TAU + t * 0.1; ell(c, Math.cos(a) * r, -r * 3.2 + Math.sin(a) * r, r * 0.62, r * 0.62, col); }
    ell(c, 0, -r * 3.2, r * 0.6, r * 0.6, '#ffd43b');
    c.restore();
  }
  function sunflower(c, x, y, s, t, glow) {
    c.save(); c.translate(x, y); c.scale(s, s);
    if (glow) { const g = c.createRadialGradient(0, -90, 10, 0, -90, 120); g.addColorStop(0, `rgba(255,224,102,${0.8 * glow})`); g.addColorStop(1, 'rgba(255,224,102,0)'); c.fillStyle = g; c.fillRect(-130, -220, 260, 260); }
    line(c, [[0, 0], [Math.sin(t) * 3, -70]], '#2f9e44', 9);
    c.save(); c.translate(-4, -30); c.rotate(-0.5); ell(c, -16, 0, 18, 8, '#51cf66', '#2b8a3e', 2); c.restore();
    c.save(); c.translate(4, -44); c.rotate(0.5); ell(c, 16, 0, 18, 8, '#51cf66', '#2b8a3e', 2); c.restore();
    c.translate(Math.sin(t) * 3, -92); c.rotate(Math.sin(t * 0.8) * 0.05);
    for (let i = 0; i < 16; i++) { c.save(); c.rotate(i / 16 * TAU); ell(c, 0, -34, 9, 17, glow ? '#ffd43b' : '#c9c0a0', glow ? '#e8a400' : '#8f8870', 2); c.restore(); }
    ell(c, 0, 0, 25, 25, '#8a5a3c', OUT); ell(c, 0, 0, 18, 18, '#a9744f');
    if (glow) face(c, 0, -3, 1.3, t, 2); else { line(c, [[-12, -4], [-5, -4]], OUT, 2.5); line(c, [[5, -4], [12, -4]], OUT, 2.5); c.beginPath(); c.arc(0, 12, 6, 1.15 * Math.PI, 1.85 * Math.PI); c.strokeStyle = OUT; c.lineWidth = 2; c.stroke(); }
    c.restore();
  }
  /* Grumblepuff and the Sneezles share a look. mood: grumpy | sneeze | sad | happy */
  function cloud(c, x, y, s, mood, t) {
    c.save(); c.translate(x, y + Math.sin(t * 1.5) * 3 * s); c.scale(s, s);
    const dark = mood === 'happy' ? '#fff' : '#c5cad6';
    c.beginPath(); [[-24, 4, 20], [0, -10, 26], [26, 2, 20], [4, 12, 22], [-10, 12, 18]].forEach((p) => { c.moveTo(p[0] + p[2], p[1]); c.arc(p[0], p[1], p[2], 0, TAU); });
    c.strokeStyle = OUT; c.lineWidth = 5; c.stroke(); c.fillStyle = dark; c.fill();
    ell(c, -4, -16, 18, 9, 'rgba(255,255,255,.6)');
    if (mood === 'sneeze') { line(c, [[-14, -4], [-6, 0], [-14, 3]], OUT, 2.5); line(c, [[16, -4], [8, 0], [16, 3]], OUT, 2.5); ell(c, 1, 12, 7, 8, OUT); for (let i = 0; i < 3; i++) line(c, [[40 + i * 4, -6 + i * 9], [70 + i * 6 + Math.sin(t * 8 + i) * 4, -8 + i * 11]], '#fff', 4); }
    else {
      eyes(c, 1, -1, 11, 3.4, t, 5);
      if (mood === 'grumpy') { line(c, [[-17, -11], [-6, -7]], OUT, 3); line(c, [[19, -11], [8, -7]], OUT, 3); c.beginPath(); c.arc(1, 15, 6, 1.15 * Math.PI, 1.85 * Math.PI); c.strokeStyle = OUT; c.lineWidth = 2.5; c.stroke(); }
      else if (mood === 'sad') { line(c, [[-17, -8], [-7, -11]], OUT, 2.5); line(c, [[19, -8], [9, -11]], OUT, 2.5); c.beginPath(); c.arc(1, 15, 5, 1.15 * Math.PI, 1.85 * Math.PI); c.strokeStyle = OUT; c.lineWidth = 2.5; c.stroke(); ell(c, -13, 8 + ((t * 20) % 14), 2.5, 4, '#74c0fc'); }
      else { blush(c, 1, 6, 17, 4.5); smile(c, 1, 3, 6); }
    }
    c.restore();
  }

  /* Story pictures, 300x190. */
  function scene(c, k, t, o) {
    const g = c.createLinearGradient(0, 0, 0, 190);
    const dull = k === 'sneeze' || k === 'broken' || k === 'sorry';
    g.addColorStop(0, dull ? '#b9c3d6' : '#8fd3ff'); g.addColorStop(1, dull ? '#dfe4ec' : '#e3f6ff'); c.fillStyle = g; rr(c, 0, 0, 300, 190, 22, g);
    c.save(); c.beginPath(); c.rect(0, 0, 300, 190); c.clip();
    ell(c, 70, 215, 190, 70, dull ? '#a9b8a0' : '#8fd98a'); ell(c, 250, 220, 170, 70, dull ? '#98a890' : '#69c46b');
    const fl = (x, y, col, i) => flower(c, x, y, 5, dull ? '#d5d5d5' : col, t, i);
    if (k === 'garden') { sunflower(c, 150, 178, 1, t, 1); fl(50, 176, '#ff8fab', 1); fl(85, 182, '#b197fc', 2); fl(225, 180, '#ff8fab', 3); fl(260, 174, '#fff', 4); }
    else if (k === 'sneeze') { cloud(c, 110, 80, 1.5, 'sneeze', t); fl(250, 178, '#fff', 1); }
    else if (k === 'broken') { sunflower(c, 70, 180, 0.8, t, 0); c.save(); c.translate(180, 110); c.rotate(Math.sin(t * 2) * 0.2); ell(c, 0, 0, 34, 34, '#fffdf5', OUT, 4); line(c, [[0, 0], [Math.cos(t * 6) * 14, Math.sin(t * 6) * 14]], '#c2255c', 5); line(c, [[0, 0], [Math.cos(t * 9) * 24, Math.sin(t * 9) * 24]], '#1971c2', 3); c.restore(); c.save(); c.translate(250, 150); c.scale(1.6, 1.6); icon(c, 'gem', t); c.restore(); }
    else if (k === 'hero') { c.save(); c.translate(125, 180); c.scale(1.5, 1.5); hero(c, { coat: o && o.coat, hat: o && o.hat, t, phase: 0 }); c.restore(); c.save(); c.translate(215, 100 + Math.sin(t * 3) * 5); c.scale(2.6, 2.6); icon(c, 'gem', t); c.restore(); }
    else if (k === 'sunflower') { sunflower(c, 150, 180, 1.05, t, 1); for (let i = 0; i < 6; i++) star(c, 40 + i * 44, 40 + Math.sin(t * 3 + i) * 14, 6, '#fff3bf'); }
    else if (k === 'prize') { for (let i = 0; i < 12; i++) { c.save(); c.translate(150, 100); c.rotate(i / 12 * TAU + t * 0.4); poly(c, [[0, 0], [-14, -130], [14, -130]], 'rgba(255,255,255,.35)'); c.restore(); } ell(c, 150, 100, 58, 58, '#fff', '#ffd43b', 6); c.font = '72px "Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText((o && o.prize) || '🌟', 150, 104 + Math.sin(t * 4) * 3); }
    else if (k === 'sorry') { cloud(c, 150, 85, 1.5, 'sad', t); }
    else if (k === 'rainbow') { ['#ff6b6b', '#ffa94d', '#ffd43b', '#69db7c', '#4dabf7', '#b197fc'].forEach((col, i) => { c.beginPath(); c.arc(150, 190, 150 - i * 11, Math.PI, 0); c.strokeStyle = col; c.lineWidth = 11; c.stroke(); }); cloud(c, 150, 95, 1.3, 'happy', t); fl(40, 180, '#ff8fab', 1); fl(262, 180, '#b197fc', 2); c.save(); c.translate(150, 150); fl(0, 0, '#ff8fab', 3); c.restore(); }
    c.restore();
  }

  /* Live canvases for use in the page (portraits, icons, scenes). They animate while attached. */
  const live = new Set();
  function el(kind, size, o) {
    const cv = document.createElement('canvas'), dpr = Math.min(window.devicePixelRatio || 1, 2);
    const isScene = kind.startsWith('scene:'), w = isScene ? 300 : size, hgt = isScene ? 190 : size;
    cv.width = w * dpr; cv.height = hgt * dpr; cv.style.width = (isScene ? size : w) + 'px'; cv.style.height = (isScene ? size * 190 / 300 : hgt) + 'px'; cv.className = 'art';
    const c = cv.getContext('2d'), seed = Math.random() * 10;
    cv._draw = (t) => {
      c.setTransform(dpr, 0, 0, dpr, 0, 0); c.clearRect(0, 0, w, hgt);
      if (isScene) return scene(c, kind.slice(6), t, o);
      c.save(); c.translate(size / 2, size / 2);
      if (kind.startsWith('icon:')) { c.scale(size / 28, size / 28); icon(c, kind.slice(5), t); }
      else if (kind.startsWith('hat:')) { c.scale(size / 60, size / 60); c.translate(0, 12); hat(c, kind.slice(4)); }
      else if (kind === 'hero') { c.translate(0, size * 0.44); c.scale(size / 118, size / 118); hero(c, Object.assign({ t, phase: 0 }, typeof o === 'function' ? o() : o)); }
      else if (kind === 'cloud') cloud(c, 0, 0, size / 110, (o && o.mood) || 'grumpy', t);
      else if (CR[kind]) { c.translate(0, size * 0.4); c.scale(size / 84, size / 84); CR[kind](c, t, seed); }
      c.restore();
    };
    cv._draw(seed); live.add(cv); cv._seen = false;
    return cv;
  }
  function tick(ts) {
    for (const cv of live) { if (cv.isConnected) { cv._seen = true; cv._draw(ts / 1000); } else if (cv._seen) live.delete(cv); }
    requestAnimationFrame(tick);
  }
  if (typeof requestAnimationFrame !== 'undefined') requestAnimationFrame(tick);

  G.Art = { critter: (c, k, t, s) => (CR[k] || CR.ladybug)(c, t, s || 0), kinds: Object.keys(CR), hero, hat, icon, star, star5, flower, sunflower, cloud, scene, el, ell, poly, line, rr, shade, OUT, HATS };
})();
