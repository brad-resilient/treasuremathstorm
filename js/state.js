/* Saved game state, settings and per-skill adaptive difficulty. */
(function () {
  'use strict';
  const G = (window.G = window.G || {});
  const KEY = 'glowgarden-save-v1';
  G.SKILLS = {
    arith: { name: 'Adding & subtracting', start: 2, levels: ['Within 10', 'Within 20', 'Missing numbers & story problems to 20', 'Two-digit with one-digit, tens', 'Two-digit within 100, ×2 ×5 ×10', 'Times tables to 10×10'] },
    time: { name: 'Telling time', start: 1, levels: ["O'clock", 'Half hours', 'Quarter hours', 'Five minutes', '1 hour / 30 min earlier & later', '15–45 min earlier & later'] },
    balance: { name: 'Balance scale', start: 1, levels: ['Build to 8 with 1s and 2s', 'Build to 15', 'Find the missing part to 20', 'Three weights or fewer', 'Mystery bag (small)', 'Mystery bag & big weights'] },
    place: { name: 'Ones, tens, hundreds', start: 1, levels: ['Count to 10', 'Tens and ones to 29', 'Tens and ones to 99', 'More than 9 ones', 'Hundreds to 399', 'Hundreds to 999'] },
    money: { name: 'Coins & paying', start: 1, levels: ['1¢ and 5¢', 'Add 10¢', 'Add 25¢', 'More coins, no running total', 'More coins', 'More coins'] },
    pattern: { name: 'Number patterns', start: 1, levels: ['Count by 1', 'By 2s and 10s', 'By 5s, backwards by 1', 'By 3s, 4s, backwards', 'Bigger jumps', 'Two-step & doubling'] },
  };
  function fresh() {
    const skills = {};
    for (const k in G.SKILLS) skills[k] = { level: G.SKILLS[k].start, streak: 0, misses: 0, attempts: 0, correct: 0, enabled: true };
    return {
      name: '', coat: '#e5484d', hat: '', hats: [], coins: 10, climbs: 0, totalGems: 0, stickers: [], finale: false, seenIntro: false,
      skills, settings: { voice: true, music: true, hazards: true }, run: null,
    };
  }
  G.load = function () {
    let s = fresh();
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) {
        const o = JSON.parse(raw), f = fresh();
        s = Object.assign(f, o);
        s.settings = Object.assign(fresh().settings, o.settings);
        for (const k in f.skills) s.skills[k] = Object.assign(fresh().skills[k], (o.skills || {})[k]);
      }
    } catch (e) { /* storage unavailable: play without saving */ }
    G.state = s;
  };
  G.save = function () {
    try { localStorage.setItem(KEY, JSON.stringify(G.state)); } catch (e) { /* ignore */ }
  };
  G.resetAll = function () {
    try { localStorage.removeItem(KEY); } catch (e) { /* ignore */ }
    G.state = fresh();
  };
  /* A skill moves up after 3 first-try answers in a row and down after 2 missed problems. */
  G.record = function (skill, r) {
    const k = G.state.skills[skill];
    if (!k || r.skipped) return;
    k.attempts++;
    if (r.solved && r.firstTry) {
      k.correct++; k.streak++; k.misses = 0;
      if (k.streak >= 3) { k.streak = 0; if (k.level < 6) k.level++; }
    } else if (r.solved) {
      k.streak = 0;
    } else {
      k.streak = 0; k.misses++;
      if (k.misses >= 2) { k.misses = 0; if (k.level > 1) k.level--; }
    }
    G.save();
  };
})();
