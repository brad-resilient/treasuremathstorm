/* Sound effects, a small original tune and spoken prompts. All synthesized; no audio files. */
(function () {
  'use strict';
  const G = (window.G = window.G || {});
  let ac = null, musicTimer = null, nextT = 0, pos = 0;
  function ctx() {
    if (!ac) {
      const C = window.AudioContext || window.webkitAudioContext;
      if (!C) return null;
      try { ac = new C(); } catch (e) { return null; }
    }
    if (ac.state === 'suspended') ac.resume().catch(() => {});
    return ac;
  }
  function tone(freq, dur, when, type, vol) {
    const a = ctx(); if (!a) return;
    const t = (when || 0) + a.currentTime, o = a.createOscillator(), g = a.createGain();
    o.type = type || 'triangle'; o.frequency.value = freq;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol || 0.15, t + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(a.destination); o.start(t); o.stop(t + dur + 0.05);
  }
  const midi = (n) => 440 * Math.pow(2, (n - 69) / 12);
  const SCALE = [72, 74, 76, 79, 81, 84, 86, 88];
  const sfx = {
    tap() { tone(660, 0.06, 0, 'sine', 0.06); },
    correct(streak) { const n = 2 + Math.min(5, Math.max(1, streak || 1)); for (let i = 0; i < n; i++) tone(midi(SCALE[i]), 0.18, i * 0.09, 'triangle', 0.16); },
    wrong() { tone(220, 0.18, 0, 'sine', 0.14); tone(175, 0.28, 0.16, 'sine', 0.14); },
    coin() { tone(1320, 0.08, 0, 'square', 0.05); tone(1760, 0.16, 0.07, 'square', 0.05); },
    pop() { tone(500, 0.05, 0, 'sine', 0.15); tone(900, 0.08, 0.04, 'sine', 0.1); },
    sneeze() { tone(300, 0.1, 0, 'sawtooth', 0.06); tone(180, 0.3, 0.1, 'sawtooth', 0.06); },
    fanfare() { [72, 76, 79, 84, 79, 84, 88].forEach((n, i) => tone(midi(n), 0.3, i * 0.14, 'triangle', 0.16)); },
  };
  // melody: [midi note or 0 for rest, beats]
  const TUNE = [[72, 1], [76, 1], [79, 1], [76, 1], [74, 1], [76, 1], [72, 2], [69, 1], [72, 1], [74, 1], [76, 1], [79, 2], [76, 2],
    [81, 1], [79, 1], [76, 1], [79, 1], [74, 1], [76, 1], [72, 2], [74, 1], [72, 1], [69, 1], [67, 1], [72, 2], [0, 2]];
  const BASS = [48, 48, 45, 43, 53, 48, 43, 48];
  function schedule() {
    const a = ctx(); if (!a) return;
    const beat = 0.36;
    while (nextT < a.currentTime + 0.4) {
      const [n, b] = TUNE[pos % TUNE.length];
      const when = Math.max(0, nextT - a.currentTime);
      if (n) tone(midi(n), b * beat * 0.9, when, 'triangle', 0.05);
      if (pos % 2 === 0) tone(midi(BASS[(pos / 2) % BASS.length | 0]), beat * 1.6, when, 'sine', 0.05);
      nextT += b * beat; pos++;
    }
  }
  function music(on) {
    clearInterval(musicTimer); musicTimer = null;
    if (!on) return;
    const a = ctx(); if (!a) return;
    nextT = a.currentTime + 0.1;
    musicTimer = setInterval(schedule, 120);
  }
  function speak(text) {
    if (!G.state || !G.state.settings.voice || !('speechSynthesis' in window) || !text) return;
    try {
      speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(String(text).replace(/−/g, ' minus ').replace(/×/g, ' times ').replace(/¢/g, ' cents').replace(/\?/g, '?'));
      u.rate = 0.9; u.pitch = 1.1; u.lang = 'en-US';
      speechSynthesis.speak(u);
    } catch (e) { /* no voice available */ }
  }
  function hush() { try { if ('speechSynthesis' in window) speechSynthesis.cancel(); } catch (e) { /* ignore */ } }
  G.Audio = { sfx, music, speak, hush, unlock: ctx };
})();
