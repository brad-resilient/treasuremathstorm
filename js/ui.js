/* Pop-up cards: questions, planting, paying, choices and story panels. */
(function () {
  'use strict';
  const G = (window.G = window.G || {});
  function h(tag, props, ...kids) {
    const e = document.createElement(tag);
    if (props) for (const k in props) {
      if (k === 'class') e.className = props[k];
      else if (k.startsWith('on')) e.addEventListener(k.slice(2), props[k]);
      else if (k === 'html') e.innerHTML = props[k];
      else if (k === 'style') e.style.cssText = props[k];
      else e.setAttribute(k, props[k]);
    }
    for (const c of kids.flat(Infinity)) { if (c == null || c === false) continue; e.append(c.nodeType ? c : document.createTextNode(String(c))); }
    return e;
  }
  let keyHandler = null;
  function setKeys(fn) {
    if (keyHandler) document.removeEventListener('keydown', keyHandler);
    keyHandler = fn;
    if (fn) document.addEventListener('keydown', fn);
  }
  function open(cls) {
    const m = document.getElementById('modal');
    m.innerHTML = ''; setKeys(null);
    const card = h('div', { class: 'card ' + (cls || '') });
    m.append(card); m.classList.remove('hidden');
    if (G.World) G.World.paused = true;
    return card;
  }
  function close() {
    const m = document.getElementById('modal');
    m.classList.add('hidden'); m.innerHTML = ''; setKeys(null);
    if (G.World) G.World.paused = false;
    G.Audio.hush();
  }
  function toast(text) {
    const t = h('div', { class: 'toast' }, text);
    document.getElementById('toasts').append(t);
    setTimeout(() => t.remove(), 2600);
  }
  const btn = (label, fn, cls) => h('button', { class: 'btn ' + (cls || ''), onclick: fn }, label);

  /* ---------- visuals ---------- */
  function frames(n, opts) {
    opts = opts || {};
    const wrap = h('div', { class: 'frames' });
    for (let f = 0; f < Math.max(1, Math.ceil(n / 10)); f++) {
      const fr = h('div', { class: 'frame' });
      for (let i = f * 10; i < f * 10 + 10; i++) {
        let cls = 'cell';
        if (i < n) cls += ' on' + (opts.second != null && i >= opts.second ? ' two' : '') + (opts.crossedFrom != null && i >= opts.crossedFrom ? ' crossed' : '');
        fr.append(h('span', { class: cls }));
      }
      wrap.append(fr);
    }
    return wrap;
  }
  function arithHint(v) {
    if (!v) return null;
    if (v.op === '+' && v.a + v.b <= 30) return frames(v.a + v.b, { second: v.a });
    if (v.op === '-' && v.a <= 30) return frames(v.a, { crossedFrom: v.a - v.b });
    if (v.op === '?' && v.a + v.b <= 30) return h('div', null, frames(v.a + v.b, { second: v.a }), h('p', { class: 'small' }, 'Count the yellow dots!'));
    if (v.op === 'x' && v.a * v.b <= 60) {
      const g = h('div', { class: 'groups' });
      for (let i = 0; i < v.a; i++) { const row = h('div', { class: 'grow' }); for (let j = 0; j < v.b; j++) row.append(h('span', { class: 'cell on' })); g.append(row); }
      return g;
    }
    return null;
  }
  const coinEl = (v, attrs) => h('button', Object.assign({ class: 'coin c' + v, type: 'button' }, attrs || {}), v + '¢');
  function placeVisual(p) {
    const w = h('div', { class: 'placev' });
    for (let i = 0; i < p.h; i++) w.append(h('div', { class: 'crate' }, '100'));
    for (let i = 0; i < p.t; i++) { const j = h('div', { class: 'jar' }); for (let k = 0; k < 10; k++) j.append(h('span', { class: 'fly' })); w.append(j); }
    const ones = h('div', { class: 'ones' });
    for (let i = 0; i < p.o; i++) ones.append(h('span', { class: 'fly big' }));
    w.append(ones);
    return w;
  }
  function placeHint(p) {
    const parts = [];
    if (p.h) parts.push(`${p.h} crate${p.h > 1 ? 's' : ''} of 100 = ${p.h * 100}`);
    if (p.t) parts.push(`${p.t} jar${p.t > 1 ? 's' : ''} of 10 = ${p.t * 10}`);
    parts.push(`${p.o} single${p.o === 1 ? '' : 's'} = ${p.o}`);
    return h('p', { class: 'small' }, parts.join('   •   '));
  }
  const weightEl = (v, cls, attrs) => h('button', Object.assign({ class: 'weight ' + (cls || ''), type: 'button', style: `--s:${Math.min(1.5, 0.8 + v / 40)}` }, attrs || {}), String(v));
  function scaleEl() {
    const left = h('div', { class: 'pan left' }), right = h('div', { class: 'pan right' }), beam = h('div', { class: 'beam' });
    const el = h('div', { class: 'scale' }, h('div', { class: 'post' }), beam, left, right);
    return { el, left, right, tilt(diff) { const a = Math.max(-10, Math.min(10, diff * 2)); beam.style.transform = `rotate(${a}deg)`; left.style.transform = `translateY(${-a * 2.4}px)`; right.style.transform = `translateY(${a * 2.4}px)`; } };
  }
  function clockSvg(hh, mm, numbered) {
    let s = '<svg viewBox="-120 -120 240 240" class="clock"><circle r="100" fill="#fffdf5" stroke="#3b3a55" stroke-width="6"/>';
    for (let i = 0; i < 60; i++) { const a = i * 6 * Math.PI / 180, r1 = i % 5 ? 94 : 88; s += `<line x1="${Math.sin(a) * r1}" y1="${-Math.cos(a) * r1}" x2="${Math.sin(a) * 99}" y2="${-Math.cos(a) * 99}" stroke="#3b3a55" stroke-width="${i % 5 ? 1 : 3}"/>`; }
    for (let i = 1; i <= 12; i++) { const a = i * 30 * Math.PI / 180; s += `<text x="${Math.sin(a) * 72}" y="${-Math.cos(a) * 72 + 8}" text-anchor="middle" font-size="22" font-weight="700" fill="#c2255c">${i}</text>`; }
    if (numbered) for (let i = 0; i < 12; i++) { const a = i * 30 * Math.PI / 180; s += `<text x="${Math.sin(a) * 111}" y="${-Math.cos(a) * 111 + 4}" text-anchor="middle" font-size="11" font-weight="700" fill="#1971c2">${i * 5}</text>`; }
    const ha = ((hh % 12) + mm / 60) * 30, ma = mm * 6;
    s += `<line x1="0" y1="0" x2="0" y2="-48" stroke="#c2255c" stroke-width="9" stroke-linecap="round" transform="rotate(${ha})"/>`;
    s += `<line x1="0" y1="0" x2="0" y2="-80" stroke="#1971c2" stroke-width="5" stroke-linecap="round" transform="rotate(${ma})"/><circle r="6" fill="#3b3a55"/></svg>`;
    return s;
  }
  const pad2 = (n) => (n < 10 ? '0' : '') + n;

  /* ---------- number pad ---------- */
  function numpad(onEnter) {
    let val = '';
    const disp = h('div', { class: 'answer' }, '?');
    const set = (v) => { val = v; disp.textContent = val === '' ? '?' : val; };
    const press = (d) => { if (val.length < 3) set(val === '0' ? d : val + d); G.Audio.sfx.tap(); };
    const pad = h('div', { class: 'numpad' },
      ['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((d) => btn(d, () => press(d), 'key')),
      btn('⌫', () => set(val.slice(0, -1)), 'key alt'), btn('0', () => press('0'), 'key'), btn('✔', () => onEnter(), 'key go'));
    setKeys((e) => {
      if (/^\d$/.test(e.key)) press(e.key);
      else if (e.key === 'Backspace') set(val.slice(0, -1));
      else if (e.key === 'Enter') { e.preventDefault(); onEnter(); }
    });
    return { el: h('div', { class: 'numwrap' }, disp, pad), get: () => (val === '' ? null : +val), set };
  }

  /* ---------- ask a problem ---------- */
  function ask(p, who) {
    return new Promise((resolve) => {
      let tries = 0, done = false;
      const card = open('ask');
      const say = () => G.Audio.speak(p.say || p.text);
      const feedback = h('div', { class: 'feedback' });
      const hintBox = h('div', { class: 'hintbox' });
      const finish = (r) => { if (done) return; done = true; close(); resolve(r); };
      card.append(h('div', { class: 'cardhead' },
        h('span', { class: 'who' }, (who && who.emoji) || '🐞'), h('span', { class: 'whoname' }, (who && who.name) || ''),
        btn('🔊', say, 'round'), btn('✖', () => finish({ solved: false, firstTry: false, skipped: true }), 'round')));
      card.append(h('h2', { class: 'prompt' + (p.word ? ' wordy' : '') }, p.text));
      const body = h('div', { class: 'askbody' });
      card.append(body, hintBox, feedback);
      let getAnswer, isRight, showHint, showSolution, checkBtn;
      const check = () => {
        if (done || card.dataset.locked) return;
        if (card.dataset.over) return finish({ solved: false, firstTry: false });
        const v = getAnswer();
        if (v == null) { feedback.textContent = 'Pick an answer first!'; return; }
        if (isRight(v)) {
          card.dataset.locked = '1';
          G.streak = (G.streak || 0) + 1;
          G.Audio.sfx.correct(G.streak);
          feedback.textContent = ['Yes!', 'Great job!', 'You got it!', 'Wonderful!', 'Super!'][Math.floor(Math.random() * 5)];
          feedback.className = 'feedback good';
          setTimeout(() => finish({ solved: true, firstTry: tries === 0 }), 900);
          return;
        }
        tries++; G.streak = 0; G.Audio.sfx.wrong();
        if (tries < 2) {
          feedback.textContent = 'Not quite. Try again!'; feedback.className = 'feedback bad';
          showHint();
        } else {
          card.dataset.over = '1';
          feedback.className = 'feedback bad';
          showSolution();
          if (checkBtn) checkBtn.textContent = 'OK';
        }
      };
      if (p.kind === 'number') {
        const np = numpad(check);
        const vis = h('div', { class: 'visual' });
        if (p.skill === 'money') p.coins.forEach((c) => vis.append(coinEl(c, { disabled: '' })));
        else if (p.skill === 'place') vis.append(placeVisual(p));
        else if (p.skill === 'pattern') vis.append(h('div', { class: 'seq' }, p.seq.map((v) => h('span', { class: 'seqbox' + (v === null ? ' miss' : '') }, v === null ? '?' : v))));
        else if (p.skill === 'balance') {
          const sc = scaleEl();
          sc.left.append(h('span', { class: 'weight bag' }, '?'), weightEl(p.known, '', { disabled: '' }));
          sc.right.append(weightEl(p.total, '', { disabled: '' }));
          vis.append(sc.el);
        }
        body.append(vis, np.el);
        getAnswer = np.get;
        isRight = (v) => v === p.answer;
        showHint = () => {
          hintBox.innerHTML = '';
          if (p.skill === 'arith') { const e = arithHint(p.visual); if (e) hintBox.append(e); }
          else if (p.skill === 'place') hintBox.append(placeHint(p));
          else if (p.skill === 'pattern') hintBox.append(h('p', { class: 'small' }, p.hint));
          else if (p.skill === 'money') hintBox.append(h('p', { class: 'small' }, 'Start with the biggest coin and count on: ' + p.coins.join(' + ')));
          else if (p.skill === 'balance') hintBox.append(h('p', { class: 'small' }, `Both sides weigh ${p.total}. Take away the ${p.known}.`));
          np.set('');
        };
        showSolution = () => { showHint(); np.set(String(p.answer)); feedback.textContent = `The answer is ${p.answer}.`; G.Audio.speak(`The answer is ${p.answer}.`); };
      } else if (p.kind === 'time') {
        let hh = 12, mm = 0, numbered = p.numbered;
        const analog = h('div', { class: 'analog', html: clockSvg(p.h, p.m, numbered) });
        const dh = h('span', { class: 'dig' }, '12'), dm = h('span', { class: 'dig' }, '00');
        const upd = () => { dh.textContent = hh; dm.textContent = pad2(mm); };
        const stepH = (d) => { hh = ((hh - 1 + d + 12) % 12) + 1; upd(); G.Audio.sfx.tap(); };
        const stepM = (d) => { mm = (mm + d * p.step + 60) % 60; upd(); G.Audio.sfx.tap(); };
        const digital = h('div', { class: 'digital' },
          h('div', { class: 'col' }, btn('▲', () => stepH(1), 'arrow'), dh, btn('▼', () => stepH(-1), 'arrow')),
          h('span', { class: 'dig colon' }, ':'),
          h('div', { class: 'col' }, btn('▲', () => stepM(1), 'arrow'), dm, btn('▼', () => stepM(-1), 'arrow')));
        body.append(analog, digital);
        getAnswer = () => ({ h: hh, m: mm });
        isRight = (v) => v.h === p.answer.h && v.m === p.answer.m;
        showHint = () => {
          analog.innerHTML = clockSvg(p.h, p.m, true);
          hintBox.innerHTML = '';
          hintBox.append(h('p', { class: 'small' }, 'The short pink hand points to the hour. The long blue hand points to the minutes (the little blue numbers).'));
        };
        showSolution = () => { showHint(); hh = p.answer.h; mm = p.answer.m; upd(); feedback.textContent = `The answer is ${hh}:${pad2(mm)}.`; };
        setKeys((e) => { if (e.key === 'Enter') { e.preventDefault(); check(); } });
      } else {
        const sc = scaleEl();
        const leftSum = p.left.reduce((s, c) => s + c, 0), fixedSum = p.rightFixed.reduce((s, c) => s + c, 0);
        let placed = [];
        const note = h('p', { class: 'small' }, p.maxPieces <= 3 ? `Use ${p.maxPieces} weights or fewer.` : 'Tap a weight to add it. Tap it on the scale to take it off.');
        const render = () => {
          sc.right.innerHTML = '';
          p.rightFixed.forEach((v) => sc.right.append(weightEl(v, 'fixed', { disabled: '' })));
          placed.forEach((v, i) => sc.right.append(weightEl(v, 'placed', { onclick: () => { placed.splice(i, 1); render(); G.Audio.sfx.tap(); } })));
          sc.tilt(fixedSum + placed.reduce((s, c) => s + c, 0) - leftSum);
        };
        p.left.forEach((v) => sc.left.append(weightEl(v, 'fixed', { disabled: '' })));
        const tray = h('div', { class: 'tray' }, p.tray.map((v) => weightEl(v, 'trayw', { onclick: () => {
          if (placed.length >= p.maxPieces) { note.classList.add('shake'); setTimeout(() => note.classList.remove('shake'), 400); return; }
          placed.push(v); render(); G.Audio.sfx.tap();
        } })));
        body.append(h('div', { class: 'balwrap' }, sc.el, tray, note));
        render();
        getAnswer = () => placed.slice();
        isRight = (v) => fixedSum + v.reduce((s, c) => s + c, 0) === leftSum;
        showHint = () => {
          const d = fixedSum + placed.reduce((s, c) => s + c, 0) - leftSum;
          hintBox.innerHTML = '';
          hintBox.append(h('p', { class: 'small' }, d > 0 ? 'The right side is too heavy. Take some off!' : 'The right side is too light. Add more!'));
        };
        showSolution = () => { feedback.textContent = `The right side needs ${p.target} more to match.`; };
        setKeys((e) => { if (e.key === 'Enter') { e.preventDefault(); check(); } });
      }
      checkBtn = btn(p.kind === 'number' ? 'Check' : 'Check ✔', check, 'big go');
      card.append(h('div', { class: 'cardfoot' }, checkBtn));
      say();
    });
  }

  /* ---------- plant seeds to match the magic number ---------- */
  function plant(bed) {
    return new Promise((resolve) => {
      const card = open('plant');
      let n = 0;
      const text = `Plant ${bed.magic} seeds in the ${bed.color.name} flower bed!`;
      const count = h('div', { class: 'answer' }, '0'), area = h('div', { class: 'visual' }), feedback = h('div', { class: 'feedback' });
      const upd = () => { count.textContent = n; area.innerHTML = ''; area.append(frames(n)); };
      const add = (d) => { n = Math.max(0, Math.min(120, n + d)); upd(); G.Audio.sfx.tap(); };
      card.append(h('div', { class: 'cardhead' }, h('span', { class: 'who' }, '🌱'), h('span', { class: 'whoname' }, ''),
        btn('🔊', () => G.Audio.speak(text), 'round'), btn('✖', () => { close(); resolve(false); }, 'round')));
      card.append(h('h2', { class: 'prompt wordy', style: `color:${bed.color.c}` }, text), area,
        h('div', { class: 'plantrow' }, bed.magic > 20 ? btn('−10', () => add(-10), 'key alt') : null, btn('−1', () => add(-1), 'key alt'), count, btn('+1', () => add(1), 'key'), bed.magic > 20 ? btn('+10', () => add(10), 'key') : null),
        feedback, h('div', { class: 'cardfoot' }, btn('Grow! 🌻', () => {
          if (n === bed.magic) { G.Audio.sfx.correct(3); close(); resolve(true); }
          else { G.Audio.sfx.wrong(); feedback.className = 'feedback bad'; feedback.textContent = n < bed.magic ? `That is ${n}. You need more seeds to make ${bed.magic}.` : `That is ${n}. That is too many for ${bed.magic}.`; }
        }, 'big go')));
      upd(); G.Audio.speak(text);
    });
  }

  /* ---------- pay exact change ---------- */
  function pay(label, price) {
    return new Promise((resolve) => {
      const lvl = G.state.skills.money.level;
      const denoms = lvl <= 1 ? [1, 5] : lvl === 2 ? [1, 5, 10] : [1, 5, 10, 25];
      let coins = [], tries = 0, reveal = lvl <= 3;
      const card = open('pay');
      const text = `Pay ${price} cents for the ${label}.`;
      const counter = h('div', { class: 'counter' }), total = h('div', { class: 'answer' }), feedback = h('div', { class: 'feedback' });
      const sum = () => coins.reduce((s, c) => s + c, 0);
      const render = () => {
        counter.innerHTML = '';
        coins.forEach((c, i) => counter.append(coinEl(c, { onclick: () => { coins.splice(i, 1); render(); } })));
        if (!coins.length) counter.append(h('span', { class: 'small' }, 'Tap coins to put them on the counter.'));
        total.textContent = reveal ? sum() + '¢' : '?';
      };
      card.append(h('div', { class: 'cardhead' }, h('span', { class: 'who' }, '🛒'), h('span', { class: 'whoname' }, ''),
        btn('🔊', () => G.Audio.speak(text), 'round'), btn('✖', () => { close(); resolve(false); }, 'round')));
      card.append(h('h2', { class: 'prompt wordy' }, `${label}: ${price}¢`), counter, h('div', { class: 'plantrow' }, total),
        h('div', { class: 'tray' }, denoms.map((d) => coinEl(d, { onclick: () => { if (coins.length < 24) { coins.push(d); render(); G.Audio.sfx.tap(); } } }))),
        feedback, h('div', { class: 'cardfoot' }, btn('Pay', () => {
          const s = sum();
          if (s === price) { G.record('money', { solved: true, firstTry: tries === 0 }); G.Audio.sfx.coin(); close(); resolve(true); return; }
          tries++; reveal = true; render(); G.Audio.sfx.wrong();
          if (tries === 2) G.record('money', { solved: false, firstTry: false });
          feedback.className = 'feedback bad';
          feedback.textContent = s > price ? `That is ${s}¢. Too much! Take some coins back.` : `That is ${s}¢. Not enough yet.`;
        }, 'big go')));
      render(); G.Audio.speak(text);
    });
  }

  function choice(text, options, emoji) {
    return new Promise((resolve) => {
      const card = open('choice');
      card.append(h('div', { class: 'bigemoji' }, emoji || '🐝'), h('h2', { class: 'prompt wordy' }, text),
        h('div', { class: 'cardfoot' }, options.map(([label, value], i) => btn(label, () => { close(); resolve(value); }, 'big ' + (i === 0 ? 'go' : 'alt')))));
      G.Audio.speak(text);
    });
  }
  function story(panels) {
    return new Promise((resolve) => {
      let i = 0;
      const show = () => {
        const card = open('story');
        const p = panels[i];
        card.append(h('div', { class: 'bigemoji' }, p.emoji), h('p', { class: 'storytext' }, p.text),
          h('div', { class: 'cardfoot' }, btn(i < panels.length - 1 ? 'Next ▶' : "Let's go!", () => { i++; if (i < panels.length) show(); else { close(); resolve(); } }, 'big go')));
        G.Audio.speak(p.text);
      };
      show();
    });
  }
  G.UI = { h, btn, open, close, toast, ask, plant, pay, choice, story, coinEl, frames };
})();
