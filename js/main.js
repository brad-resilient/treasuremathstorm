/* Game flow: title, home, climbing through the three zones, the summit and the grown-ups area. */
(function () {
  'use strict';
  const G = window.G, UI = G.UI, h = UI.h, P = window.Problems;
  const ZONES = [
    { name: 'Sunny Meadow', skill: 'time', keeper: { kind: 'snail', name: 'Tock' }, station: 'Clock Shed', piece: 'plank', pieceName: 'plank', gateName: 'Broken Bridge', shopkeeper: 'squirrel', intro: 'Welcome to Sunny Meadow! The bridge is broken. Earn 4 planks from Tock the snail in the Clock Shed.' },
    { name: 'Apple Orchard', skill: 'balance', keeper: { kind: 'hedgehog', name: 'Pom' }, station: 'Weighing Barn', piece: 'balloon', pieceName: 'balloon', gateName: 'Balloon Basket', shopkeeper: 'bunny', intro: 'This is Apple Orchard! The basket needs 4 balloons to fly. Help Pom the hedgehog in the Weighing Barn.' },
    { name: 'Firefly Pond', skill: 'place', keeper: { kind: 'frog', name: 'Lumi' }, station: 'Firefly Grotto', piece: 'key', pieceName: 'key piece', gateName: 'Sun Gate', shopkeeper: 'duck', intro: 'You made it to Firefly Pond! Lumi the frog has 4 key pieces for the Sun Gate. Help count the fireflies in the grotto.' },
  ];
  const COLORS = [{ name: 'red', c: '#e03131' }, { name: 'blue', c: '#1c7ed6' }, { name: 'yellow', c: '#e8a400' }, { name: 'purple', c: '#7b4ad9' }];
  const HATS = [['🌼', 10, 'Daisy'], ['🧢', 15, 'Cap'], ['🎀', 15, 'Bow'], ['🎩', 20, 'Top hat'], ['⛑️', 25, 'Hard hat'], ['🎓', 30, 'Grad cap'], ['👑', 50, 'Crown']];
  const Art = G.Art, glow = () => Math.min(1, G.state.totalGems / FINALE);
  const chip = (el, icon, text) => { el.replaceChildren(Art.el(icon, 24), ' ' + text); };
  const COATS = ['#e5484d', '#1c7ed6', '#2f9e44', '#f08c00', '#9c36b5', '#e64980'];
  const STICKERS = ['🪁', '🧸', '🚂', '🎺', '🦄', '🚀', '🎠', '🪀', '🥁', '🦖', '🛼', '🎨', '🧩', '🎡', '🛶', '🐉', '🏰', '🌈', '🎸', '⚽'];
  const RANKS = [[0, 'Seedling Helper'], [6, 'Sprout Helper'], [14, 'Bud Helper'], [24, 'Blossom Helper'], [36, 'Garden Guardian'], [60, 'Champion Gardener']];
  const FINALE = 36, PAY = 5;
  const S = () => G.state;
  const $ = (id) => document.getElementById(id);
  const rank = () => RANKS.filter((r) => S().totalGems >= r[0]).pop()[1];
  const bedsFor = (climbs) => 2 + Math.min(2, Math.floor(climbs / 2));
  let beds = [];

  function show(name) {
    $('screen-title').classList.toggle('hidden', name !== 'title');
    $('screen-home').classList.toggle('hidden', name !== 'home');
    $('screen-world').classList.toggle('hidden', name === 'home');
    $('hud').classList.toggle('hidden', name !== 'world');
    if (name === 'home') G.World.stop();
    if (name === 'title') G.World.start({ zone: 0, demo: true, glow: 1 }, {});
    const f = $('fade'); f.classList.remove('go'); void f.offsetWidth; f.classList.add('go');
  }
  function addCoins(n) { S().coins = Math.max(0, S().coins + n); if (n > 0) { G.Audio.sfx.coin(); UI.toast(`+${n}¢`); } G.save(); hud(); }

  /* ---------- home ---------- */
  function home() {
    const s = S(), el = $('screen-home');
    show('home'); el.innerHTML = '';
    const pct = Math.min(100, Math.round(s.totalGems / FINALE * 100));
    const stat = (icon, text) => h('span', null, Art.el(icon, 24), ' ' + text);
    el.append(h('div', { class: 'homewrap' },
      h('div', { class: 'hometop panel' },
        Art.el('hero', 150, () => ({ coat: G.state.coat, hat: G.state.hat })),
        h('div', { class: 'grow1' }, h('h1', null, `${s.name || 'Helper'}'s Greenhouse`), h('p', { class: 'rank' }, `★ ${rank()}`),
          h('div', { class: 'stats' }, stat('icon:coin', `${s.coins}¢`), stat('icon:gem', `${s.totalGems}`), h('span', null, `${s.climbs} trip${s.climbs === 1 ? '' : 's'}`)),
          h('div', { class: 'glowbar' }, h('div', { class: 'glowfill', style: `width:${pct}%` }), h('span', null, s.finale ? 'Glowgarden is glowing again!' : `Garden glow: ${pct}%`))),
        UI.btn(s.run ? 'Keep going ▶' : 'Start a trip ▶', () => { G.Audio.unlock(); startClimb(); }, 'big go start')),
      h('div', { class: 'panel' }, h('h3', null, 'My prize shelf'),
        h('div', { class: 'shelf' }, s.stickers.length ? s.stickers.map((e) => h('button', { class: 'sticker', onclick: (ev) => { ev.currentTarget.classList.remove('wiggle'); void ev.currentTarget.offsetWidth; ev.currentTarget.classList.add('wiggle'); G.Audio.sfx.pop(); } }, e)) : h('p', { class: 'small' }, 'Finish a trip to the Great Sunflower to win a prize!'))),
      h('div', { class: 'panel' }, h('h3', null, 'My look'),
        h('div', { class: 'looks' },
          COATS.map((c) => h('button', { class: 'swatch' + (s.coat === c ? ' sel' : ''), style: `background:${c}`, 'aria-label': 'coat colour', onclick: () => { s.coat = c; G.save(); home(); } })),
          h('button', { class: 'hatbtn' + (!s.hat ? ' sel' : ''), 'aria-label': 'no hat', onclick: () => { s.hat = ''; G.save(); home(); } }, '✕'),
          s.hats.map((e) => h('button', { class: 'hatbtn' + (s.hat === e ? ' sel' : ''), onclick: () => { s.hat = e; G.save(); home(); } }, Art.el('hat:' + e, 40))))),
      h('div', { class: 'homefoot' },
        UI.btn(s.settings.music ? 'Music: on' : 'Music: off', () => { s.settings.music = !s.settings.music; G.Audio.music(s.settings.music); G.save(); home(); }, 'alt'),
        UI.btn(s.settings.voice ? 'Voice: on' : 'Voice: off', () => { s.settings.voice = !s.settings.voice; G.save(); home(); }, 'alt'),
        UI.btn('Grown-ups', parentGate, 'alt'))));
  }

  /* ---------- climbing ---------- */
  function startClimb() {
    if (!S().run) S().run = { zone: 0, pieces: 0, gems: 0, zoneDone: 0 };
    G.save(); enterZone(true);
  }
  function enterZone(announce) {
    const run = S().run, z = ZONES[run.zone], n = bedsFor(S().climbs);
    beds = [];
    for (let i = 0; i < n; i++) beds.push({ color: COLORS[i], done: i < run.zoneDone, magic: null });
    show('world');
    G.World.start({ zone: run.zone, zoneInfo: z, beds, pieces: () => S().run ? S().run.pieces : 4, climb: S().climbs, hazards: S().settings.hazards, glow: glow() }, { interact, sneezed, popped: () => UI.toast('Pop!') });
    hud();
    if (announce) { UI.toast(z.name); G.Audio.speak(z.intro); }
  }
  function hud() {
    if (!S().run) return;
    const run = S().run, z = ZONES[run.zone];
    $('hud-zone').textContent = z.name;
    chip($('hud-coins'), 'icon:coin', `${S().coins}¢`);
    chip($('hud-pieces'), 'icon:' + z.piece, `${run.pieces}/4`);
    chip($('hud-gems'), 'icon:gem', `${beds.filter((b) => b.done).length}/${beds.length}`);
    const m = beds.find((b) => !b.done && b.magic != null);
    $('hud-magic').textContent = m ? `★ ${m.magic} → ${m.color.name}` : '';
    $('hud-magic').style.background = m ? m.color.c : 'transparent';
  }
  function helperProblem() {
    const sk = S().skills, pool = [];
    const add = (k, w) => { if (sk[k].enabled) for (let i = 0; i < w; i++) pool.push(k); };
    add('arith', 5); add('money', 2); add('pattern', 1); add('place', 1);
    const k = pool.length ? pool[Math.floor(Math.random() * pool.length)] : 'arith';
    return P.generate(k, sk[k].level);
  }
  let busy = false;
  async function interact(en) {
    if (busy) return;
    busy = true;
    try { await handle(en); } finally { busy = false; hud(); G.save(); }
  }
  async function handle(en) {
    const run = S().run, z = ZONES[run.zone];
    if (en.type === 'helper') {
      const p = helperProblem(), r = await UI.ask(p, { kind: en.kind, name: 'A garden friend needs help!' });
      G.record(p.skill, r);
      if (r.solved) { G.World.burst('coin', en.x, G.World.GROUND - 70, 5); addCoins(PAY); G.World.hideEntity(en, 5); }
    } else if (en.type === 'star') {
      const lvl = S().skills.arith.level;
      const p = P.generate('arith', lvl, { min: 2, max: lvl <= 3 ? 20 : 60 });
      const r = await UI.ask(p, { kind: en.kind, name: `${en.bed.color.name} star friend` });
      G.record('arith', r);
      if (r.solved) {
        en.bed.magic = p.answer; G.World.burst('spark', en.x, G.World.GROUND - 60, 14); G.World.removeEntity(en);
        const msg = `The magic number is ${p.answer}! Plant ${p.answer} seeds in the ${en.bed.color.name} flower bed.`;
        UI.toast(msg); G.Audio.speak(msg);
      }
    } else if (en.type === 'bed') {
      const b = en.bed;
      if (b.done) { UI.toast('This flower bed is already blooming!'); return; }
      if (b.magic == null) { const msg = `Find the friend with the ${b.color.name} star first!`; UI.toast(msg); G.Audio.speak(msg); return; }
      if (await UI.plant(b)) {
        b.done = true; run.zoneDone++; run.gems++;
        G.World.burst('confetti', b.x, G.World.GROUND - 80, 40); G.World.burst('spark', b.x, G.World.GROUND - 90, 16); G.Audio.sfx.fanfare(); UI.toast('You found a glow gem!'); G.Audio.speak('The flowers bloomed! You found a glow gem!');
      }
    } else if (en.type === 'station') await station(z);
    else if (en.type === 'shop') await shop(z);
    else if (en.type === 'gate') await gate(z);
  }
  async function station(z) {
    const run = S().run, skill = S().skills[z.skill].enabled ? z.skill : 'arith';
    for (;;) {
      const p = P.generate(skill, S().skills[skill].level);
      const r = await UI.ask(p, { kind: z.keeper.kind, name: `${z.keeper.name} in the ${z.station}` });
      if (r.skipped) return;
      G.record(skill, r);
      let msg = 'Good try! Want to do another one?';
      if (r.solved) {
        if (run.pieces < 4) { run.pieces++; msg = run.pieces >= 4 ? `You have all 4! Now you can go to the ${z.gateName}.` : `You earned a ${z.pieceName}! You have ${run.pieces} of 4.`; }
        else { addCoins(PAY); msg = `Thank you! Here are ${PAY} cents.`; }
      }
      G.save(); hud();
      if (!(await UI.choice(msg, [['Another one!', true], ['Go outside', false]], z.keeper.kind))) return;
    }
  }
  function shop(z) {
    return new Promise((resolve) => {
      const s = S(), run = s.run;
      const piecePrice = 10 + 4 * Math.min(6, s.climbs) + 3 * run.zone;
      const render = () => {
        const card = UI.open('shop');
        const item = (icon, name, price, onBuy) => h('div', { class: 'shopitem' }, Art.el(icon, 48), h('span', { class: 'grow1' }, name), UI.btn(s.coins >= price ? `${price}¢` : `Need ${price}¢`, async () => {
          if (s.coins < price) return;
          const ok = s.skills.money.enabled ? await UI.pay(name, price, z.shopkeeper) : true;
          if (ok) { s.coins -= price; onBuy(); G.Audio.sfx.coin(); G.save(); hud(); }
          render();
        }, s.coins >= price ? 'go' : 'off'));
        card.append(h('div', { class: 'cardhead' }, Art.el(z.shopkeeper, 64), h('span', { class: 'whoname' }, `Shop: you have ${s.coins}¢`), UI.btn('✖', () => { UI.close(); resolve(); }, 'round')));
        const list = h('div', { class: 'shoplist' });
        if (run.pieces < 4) list.append(item('icon:' + z.piece, `${z.pieceName} (${run.pieces}/4)`, piecePrice, () => { run.pieces++; }));
        HATS.filter(([e]) => !s.hats.includes(e)).forEach(([e, price, nm]) => list.append(item('hat:' + e, nm, price, () => { s.hats.push(e); s.hat = e; })));
        if (!list.children.length) list.append(h('p', null, 'You bought everything!'));
        card.append(list);
      };
      render();
      G.Audio.speak('Welcome to the shop! Pay with the right coins.');
    });
  }
  async function gate(z) {
    const run = S().run;
    if (run.pieces < 4) { const msg = `You need 4 ${z.pieceName}s. You have ${run.pieces}. Visit ${z.keeper.name} in the ${z.station}!`; UI.toast(msg); G.Audio.speak(msg); return; }
    if (beds.some((b) => !b.done) && !(await UI.choice('There are still glow gems hiding here. Go on anyway?', [['Keep looking', false], ['Go on', true]], 'icon:gem'))) return;
    if (run.zone === 2 && S().skills.pattern.enabled) {
      const p = P.generate('pattern', S().skills.pattern.level);
      const r = await UI.ask(p, { kind: 'owl', name: 'Professor Hoot guards the Sun Gate' });
      if (r.skipped) return;
      G.record('pattern', r);
      if (!r.solved) { await UI.choice('Hoo! Not this time. Come back and try a new one.', [['OK', true]], 'owl'); return; }
    }
    if (run.zone < 2) { run.zone++; run.pieces = 0; run.zoneDone = 0; G.save(); G.Audio.sfx.fanfare(); enterZone(true); }
    else await summit();
  }
  function sneezed() {
    G.Audio.sfx.sneeze();
    const lost = Math.min(2, S().coins);
    S().coins -= lost; G.save(); hud();
    UI.toast(lost ? `Achoo! A Sneezle blew away ${lost}¢. Tap Sneezles to pop them!` : 'Achoo! Tap Sneezles to pop them!');
  }
  async function summit() {
    const s = S(), run = s.run, got = run.gems;
    s.totalGems += got; s.climbs++; s.run = null;
    const left = STICKERS.filter((e) => !s.stickers.includes(e));
    const prize = left.length ? left[Math.floor(Math.random() * left.length)] : '🌟';
    s.stickers.push(prize); G.save();
    G.World.stop(); G.Audio.sfx.fanfare();
    await UI.story([
      { art: 'scene:sunflower', text: `You reached the Great Sunflower! You brought ${got} glow gem${got === 1 ? '' : 's'}. The garden glows a little brighter!` },
      { art: 'scene:prize', o: { prize }, text: `You won a prize for your shelf! You are a ${rank()}.` },
    ]);
    if (!s.finale && s.totalGems >= FINALE) {
      s.finale = true; G.save(); G.Audio.sfx.fanfare();
      await UI.story([
        { art: 'scene:sunflower', text: 'The Great Sunflower is shining at full glow! All the colours rush back into Glowgarden.' },
        { art: 'scene:sorry', text: 'Grumblepuff the cloud floats down. "I am sorry," he sniffs. "I only sneezed because I had no flowers of my own."' },
        { art: 'scene:rainbow', text: 'You give Grumblepuff a flower. He smiles so wide that a rainbow pops out! Glowgarden is saved. You can keep helping and collect every prize!' },
      ]);
    }
    home();
  }
  function hint() {
    const run = S().run, z = ZONES[run.zone];
    const m = beds.find((b) => !b.done && b.magic != null);
    let msg;
    if (m) msg = `Plant ${m.magic} seeds in the ${m.color.name} flower bed.`;
    else if (beds.some((b) => !b.done)) msg = 'Find a friend with a star. They know a magic number!';
    else if (run.pieces < 4) msg = `Visit ${z.keeper.name} in the ${z.station} to earn ${z.pieceName}s.`;
    else msg = `Walk to the ${z.gateName}, all the way to the right!`;
    UI.toast(msg); G.Audio.speak(msg);
  }

  /* ---------- grown-ups ---------- */
  function parentGate() {
    const a = 6 + Math.floor(Math.random() * 4), b = 6 + Math.floor(Math.random() * 4);
    const card = UI.open('parent');
    const inp = h('input', { type: 'number', inputmode: 'numeric', class: 'textin', 'aria-label': 'answer' });
    card.append(h('h2', null, 'Grown-ups only'), h('p', null, `What is ${a} × ${b}?`), inp,
      h('div', { class: 'cardfoot' }, UI.btn('Cancel', UI.close, 'alt'), UI.btn('Enter', () => { if (+inp.value === a * b) parentPanel(); else UI.close(); }, 'go')));
  }
  function parentPanel() {
    const s = S(), card = UI.open('parent wide');
    const rows = Object.keys(G.SKILLS).map((k) => {
      const info = G.SKILLS[k], sk = s.skills[k];
      const sel = h('select', { onchange: (e) => { sk.level = +e.target.value; sk.streak = 0; sk.misses = 0; G.save(); } }, info.levels.map((name, i) => { const o = h('option', { value: i + 1 }, `${i + 1}: ${name}`); if (sk.level === i + 1) o.selected = true; return o; }));
      const chk = h('input', { type: 'checkbox', onchange: (e) => { sk.enabled = e.target.checked; G.save(); } }); chk.checked = sk.enabled;
      return h('tr', null, h('td', null, h('label', null, chk, ' ' + info.name)), h('td', null, sel), h('td', null, sk.attempts ? `${sk.correct}/${sk.attempts} first try (${Math.round(sk.correct / sk.attempts * 100)}%)` : 'not tried yet'));
    });
    const toggle = (label, key) => { const c = h('input', { type: 'checkbox', onchange: (e) => { s.settings[key] = e.target.checked; G.save(); if (key === 'music') G.Audio.music(s.settings.music); } }); c.checked = s.settings[key]; return h('label', { class: 'ptoggle' }, c, ' ' + label); };
    const name = h('input', { type: 'text', class: 'textin', maxlength: 14, value: s.name, onchange: (e) => { s.name = e.target.value.trim(); G.save(); } });
    card.append(h('h2', null, 'Grown-ups area'),
      h('p', { class: 'small' }, 'Each skill moves up a level after 3 first-try answers in a row and down after 2 missed problems. You can set levels by hand or switch a skill off.'),
      h('table', { class: 'ptable' }, h('tr', null, h('th', null, 'Skill'), h('th', null, 'Level'), h('th', null, 'Progress')), rows),
      h('div', { class: 'prow' }, toggle('Sneezles (coin-stealing clouds, from the 2nd trip)', 'hazards'), toggle('Read aloud', 'voice'), toggle('Music', 'music')),
      h('div', { class: 'prow' }, h('label', null, "Child's name: ", name), h('span', null, `Trips: ${s.climbs} • Gems: ${s.totalGems} • Coins: ${s.coins}¢`)),
      h('div', { class: 'cardfoot' },
        UI.btn('Erase all progress', () => { if (window.confirm('Erase all progress and start over?')) { G.resetAll(); G.save(); UI.close(); title(); } }, 'alt'),
        UI.btn('Done', () => { UI.close(); home(); }, 'go')));
  }

  /* ---------- first run ---------- */
  function newPlayer() {
    return new Promise((resolve) => {
      const card = UI.open('parent');
      const inp = h('input', { type: 'text', class: 'textin', maxlength: 14, placeholder: 'Your name' });
      card.append(Art.el('hero', 130, () => ({ coat: G.state.coat })), h('h2', null, 'What is your name?'), inp,
        h('div', { class: 'cardfoot' }, UI.btn('OK', () => { S().name = inp.value.trim() || 'Helper'; G.save(); UI.close(); resolve(); }, 'big go')));
      G.Audio.speak('What is your name?');
    });
  }
  async function play() {
    G.Audio.unlock(); G.Audio.music(S().settings.music);
    if (!S().name) await newPlayer();
    if (!S().seenIntro) {
      await UI.story([
        { art: 'scene:garden', text: 'This is Glowgarden, where everything glows with colour.' },
        { art: 'scene:sneeze', text: 'One day a grumpy little cloud named Grumblepuff let out a giant sneeze. AH-CHOO!' },
        { art: 'scene:broken', text: 'The sneeze blew the colours away. It mixed up the clocks, tipped the scales, and scattered the glow gems.' },
        { art: 'scene:hero', o: { coat: S().coat, hat: S().hat }, text: `${S().name}, you are the Garden Helper! Fix what broke, find the glow gems, and carry them up to the Great Sunflower.` },
      ]);
      S().seenIntro = true; G.save();
    }
    home();
  }
  function title() { show('title'); }

  window.addEventListener('DOMContentLoaded', () => {
    G.load(); G.World.init();
    $('btn-play').addEventListener('click', play);
    $('hud-home').addEventListener('click', () => { G.save(); home(); });
    $('hud-hint').addEventListener('click', hint); $('hud-hint').append(Art.el('bee', 44));
    title();
  });
  G.Game = { home, startClimb, enterZone, summit, beds: () => beds, ZONES, play };
})();
