/* Problem generators for every skill. Pure functions, usable in the browser and in Node tests. */
(function (root) {
  'use strict';
  const int = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
  const pick = (a) => a[Math.floor(Math.random() * a.length)];
  const THINGS = ['berries', 'seeds', 'acorns', 'petals', 'pebbles', 'daisies'];
  const NAMES = ['Pip', 'Momo', 'Fern', 'Tully', 'Juno', 'Bram'];

  const addP = (a, b) => ({ text: `${a} + ${b} = ?`, say: `What is ${a} plus ${b}?`, answer: a + b, visual: { op: '+', a, b } });
  const subP = (a, b) => ({ text: `${a} − ${b} = ?`, say: `What is ${a} take away ${b}?`, answer: a - b, visual: { op: '-', a, b } });
  const mulP = (a, b) => ({ text: `${a} × ${b} = ?`, say: `What is ${a} times ${b}? That means ${a} groups of ${b}.`, answer: a * b, visual: { op: 'x', a, b } });
  function wordAdd(a, b) {
    const n = pick(NAMES), t = pick(THINGS);
    const text = `${n} has ${a} ${t} and finds ${b} more. How many ${t} now?`;
    return { text, say: text, answer: a + b, visual: { op: '+', a, b }, word: true };
  }
  function wordSub(a, b) {
    const n = pick(NAMES), t = pick(THINGS);
    const text = `${n} has ${a} ${t} and gives away ${b}. How many are left?`;
    return { text, say: text, answer: a - b, visual: { op: '-', a, b }, word: true };
  }

  function arithOnce(level) {
    let a, b, c, r;
    switch (level) {
      case 1:
        if (int(0, 1)) { a = int(1, 8); b = int(1, 10 - a); return addP(a, b); }
        a = int(2, 10); b = int(1, a - 1); return subP(a, b);
      case 2:
        if (int(0, 1)) { a = int(3, 12); b = int(2, 20 - a); return addP(a, b); }
        a = int(7, 20); b = int(1, a - 1); return subP(a, b);
      case 3:
        r = int(0, 3);
        if (r === 0) {
          a = int(1, 12); c = int(a + 1, 20);
          return { text: `${a} + ? = ${c}`, say: `${a} plus what number makes ${c}?`, answer: c - a, visual: { op: '?', a, b: c - a } };
        }
        if (r === 1) {
          a = int(1, 8); b = int(1, 8); c = int(1, 20 - a - b);
          return { text: `${a} + ${b} + ${c} = ?`, say: `What is ${a} plus ${b} plus ${c}?`, answer: a + b + c };
        }
        if (r === 2) { a = int(3, 12); b = int(2, 20 - a); return wordAdd(a, b); }
        a = int(7, 20); b = int(1, a - 1); return wordSub(a, b);
      case 4:
        r = int(0, 4);
        if (r === 0) { a = int(11, 89); b = int(2, 9); return addP(a, b); }
        if (r === 1) { a = int(21, 99); b = int(2, 9); return subP(a, b); }
        if (r === 2) { a = int(1, 8); b = int(1, 9 - a); return addP(a * 10, b * 10); }
        if (r === 3) { a = int(2, 9); b = int(1, a - 1); return subP(a * 10, b * 10); }
        a = int(10, 30); b = int(5, 20); return int(0, 1) ? wordAdd(a, b) : wordSub(a + b, b);
      case 5:
        r = int(0, 3);
        if (r === 0) { a = int(11, 80); b = int(11, 99 - a); return addP(a, b); }
        if (r === 1) { a = int(30, 99); b = int(11, a - 5); return subP(a, b); }
        return mulP(int(1, 10), pick([2, 5, 10]));
      default:
        r = int(0, 4);
        if (r <= 1) return mulP(int(2, 10), int(2, 10));
        if (r === 2) { a = int(15, 80); b = int(11, 99 - a); return addP(a, b); }
        if (r === 3) { a = int(40, 99); b = int(12, a - 5); return subP(a, b); }
        a = int(2, 6); b = int(2, 9);
        const text = `There are ${a} pots with ${b} seeds in each pot. How many seeds in all?`;
        return { text, say: text, answer: a * b, visual: { op: 'x', a, b }, word: true };
    }
  }
  function arith(level, opts) {
    const max = (opts && opts.max) || 999, min = (opts && opts.min) || 0;
    for (let i = 0; i < 200; i++) {
      const p = arithOnce(level);
      if (p.answer <= max && p.answer >= min) return Object.assign(p, { skill: 'arith', kind: 'number' });
    }
    const a = int(1, 5), b = int(1, 5);
    return Object.assign(addP(a, b), { skill: 'arith', kind: 'number' });
  }

  function money(level) {
    const denoms = level <= 1 ? [1, 5] : level === 2 ? [1, 5, 10] : [1, 5, 10, 25];
    const n = level <= 1 ? int(2, 4) : level <= 3 ? int(3, 5) : int(4, 7);
    const coins = [];
    for (let i = 0; i < n; i++) coins.push(pick(denoms));
    coins.sort((x, y) => y - x);
    const text = 'How many cents is this?';
    return { skill: 'money', kind: 'number', coins, text, say: 'Count the coins. How many cents is this?', answer: coins.reduce((s, c) => s + c, 0) };
  }

  function shiftTime(h, m, d) {
    let t = ((h % 12) * 60 + m + d) % 720;
    if (t < 0) t += 720;
    const hh = Math.floor(t / 60);
    return { h: hh === 0 ? 12 : hh, m: t % 60 };
  }
  function time(level) {
    const h = int(1, 12);
    let m = 0, step = 30, numbered = true, shift = 0;
    if (level === 2) m = pick([0, 30]);
    else if (level === 3) { m = pick([0, 15, 30, 45]); step = 15; }
    else if (level === 4) { m = int(0, 11) * 5; step = 5; numbered = false; }
    else if (level === 5) { m = pick([0, 15, 30, 45]); step = 15; numbered = false; shift = pick([60, -60, 30, -30]); }
    else if (level >= 6) { m = int(0, 11) * 5; step = 5; numbered = false; shift = pick([15, -15, 30, -30, 45, -45, 60, -60]); }
    const p = { skill: 'time', kind: 'time', h, m, step, numbered, shift, answer: shiftTime(h, m, shift) };
    if (shift) {
      const amt = Math.abs(shift) === 60 ? '1 hour' : `${Math.abs(shift)} minutes`;
      p.text = `What time will it be ${amt} ${shift > 0 ? 'later' : 'earlier'}?`;
      p.say = `The round clock shows the time now. Set the number clock to show the time ${amt} ${shift > 0 ? 'later' : 'earlier'}.`;
    } else {
      p.text = 'Make the clocks match!';
      p.say = 'Make the number clock show the same time as the round clock.';
    }
    return p;
  }

  function balance(level) {
    const p = { skill: 'balance', kind: 'balance', mode: 'build', rightFixed: [], maxPieces: 8 };
    if (level <= 1) { p.tray = [1, 2]; p.left = [int(3, 8)]; }
    else if (level === 2) { p.tray = [1, 2, 5]; p.left = [int(6, 15)]; p.maxPieces = 6; }
    else if (level === 3) {
      const t = int(10, 20); p.tray = [1, 2, 5, 10]; p.left = [t]; p.rightFixed = [int(2, t - 2)]; p.maxPieces = 5;
    } else if (level === 4 || (level >= 6 && int(0, 1))) {
      p.tray = level === 4 ? [1, 2, 5, 10, 20] : [5, 10, 20, 50];
      p.maxPieces = 3;
      const n = int(2, 3); let t = 0;
      for (let i = 0; i < n; i++) t += pick(p.tray);
      while (t > 100) t -= p.tray[p.tray.length - 1];
      const a = int(1, t - 1);
      p.left = [a, t - a];
    } else {
      p.mode = 'mystery'; p.kind = 'number';
      const k = level === 5 ? int(2, 9) : int(5, 30), bag = level === 5 ? int(2, 12) : int(5, 40);
      p.known = k; p.total = k + bag; p.answer = bag;
      p.text = 'How heavy is the mystery bag?';
      p.say = `The scale is balanced. The mystery bag and the ${k} weigh the same as ${k + bag}. How heavy is the mystery bag?`;
      return p;
    }
    p.target = p.left.reduce((s, c) => s + c, 0) - p.rightFixed.reduce((s, c) => s + c, 0);
    p.text = p.maxPieces <= 3 ? `Balance the scale with ${p.maxPieces} weights or fewer!` : 'Make the scale balance!';
    p.say = p.maxPieces <= 3 ? `Make both sides weigh the same. Use only ${p.maxPieces} weights or fewer.` : 'Tap the weights to make both sides weigh the same.';
    return p;
  }

  function place(level) {
    let h = 0, t = 0, o = 0;
    if (level <= 1) o = int(3, 10);
    else if (level === 2) { t = int(1, 2); o = int(0, 9); }
    else if (level === 3) { t = int(2, 9); o = int(0, 9); }
    else if (level === 4) { t = int(1, 8); o = int(10, 15); }
    else if (level === 5) { h = int(1, 3); t = int(0, 9); o = int(0, 9); }
    else { h = int(1, 9); t = pick([0, int(0, 9)]); o = pick([0, int(0, 9)]); }
    return { skill: 'place', kind: 'number', h, t, o, answer: h * 100 + t * 10 + o, text: 'How many fireflies?', say: 'Count the fireflies. How many are there?' };
  }

  function pattern(level) {
    let step, start, len = 5, seq = [], idx;
    if (level >= 6) {
      if (int(0, 1)) {
        const a = int(1, 5); let b = int(1, 5); if (b === a) b = a + 1;
        start = int(1, 10); len = 6; let v = start;
        for (let i = 0; i < len; i++) { seq.push(v); v += i % 2 ? b : a; }
        idx = int(4, 5);
        return finish(seq, idx, `The jumps take turns: plus ${a}, then plus ${b}.`);
      }
      let v = int(1, 3);
      for (let i = 0; i < len; i++) { seq.push(v); v *= 2; }
      return finish(seq, int(3, 4), 'Each number is double the one before.');
    }
    if (level <= 1) { step = 1; start = int(1, 15); }
    else if (level === 2) { step = pick([2, 10]); start = step === 2 ? int(1, 5) * 2 : int(0, 5) * 10; }
    else if (level === 3) { step = pick([5, -1]); start = step === 5 ? int(0, 6) * 5 : int(8, 20); }
    else if (level === 4) { step = pick([3, 4, -2, -10]); start = step === -10 ? int(5, 9) * 10 : step === -2 ? int(6, 15) * 2 : int(1, 10); }
    else { step = pick([6, 7, 8, 9, 11]); start = int(1, 20); }
    for (let i = 0; i < len; i++) seq.push(start + step * i);
    return finish(seq, int(2, len - 1), step > 0 ? `Each number goes up by ${step}.` : `Each number goes down by ${-step}.`);
  }
  function finish(seq, idx, hint) {
    const answer = seq[idx];
    const shown = seq.map((v, i) => (i === idx ? null : v));
    return { skill: 'pattern', kind: 'number', seq: shown, answer, hint, text: 'What number is missing?', say: 'Look at the pattern. ' + shown.map((v) => (v === null ? 'blank' : v)).join(', ') + '. What number is missing?' };
  }

  const gens = { arith, money, time, balance, place, pattern };
  function generate(skill, level, opts) {
    return gens[skill](Math.max(1, Math.min(6, level | 0)), opts);
  }
  const api = { generate, shiftTime, SKILLS: Object.keys(gens) };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  root.Problems = api;
})(typeof window !== 'undefined' ? window : globalThis);
