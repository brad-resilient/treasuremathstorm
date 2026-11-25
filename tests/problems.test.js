// Run with: node tests/problems.test.js
const P = require('../js/problems.js');
const assert = require('assert');
let n = 0;
for (const skill of P.SKILLS) for (let level = 1; level <= 6; level++) for (let i = 0; i < 400; i++) {
  const p = P.generate(skill, level); n++;
  const tag = `${skill} L${level} ${JSON.stringify(p)}`;
  assert.strictEqual(p.skill, skill, tag);
  assert.ok(p.text && p.say, tag);
  if (p.kind === 'number') assert.ok(Number.isInteger(p.answer) && p.answer >= 0 && p.answer <= 999, tag);
  if (skill === 'arith' && level <= 2) assert.ok(p.answer <= 20, tag);
  if (skill === 'money') assert.strictEqual(p.coins.reduce((s, c) => s + c, 0), p.answer, tag);
  if (skill === 'time') { assert.ok(p.answer.h >= 1 && p.answer.h <= 12 && p.answer.m >= 0 && p.answer.m < 60 && p.answer.m % p.step === 0, tag); }
  if (skill === 'balance' && p.mode === 'build') {
    assert.ok(p.target >= 1, tag);
    // must be reachable with maxPieces tray weights
    const reach = new Set([0]);
    for (let k = 0; k < p.maxPieces; k++) for (const v of [...reach]) for (const w of p.tray) reach.add(v + w);
    assert.ok(reach.has(p.target), 'unsolvable ' + tag);
  }
  if (skill === 'balance' && p.mode === 'mystery') assert.strictEqual(p.known + p.answer, p.total, tag);
  if (skill === 'place') assert.strictEqual(p.h * 100 + p.t * 10 + p.o, p.answer, tag);
  if (skill === 'pattern') assert.strictEqual(p.seq.filter((v) => v === null).length, 1, tag);
}
for (let i = 0; i < 500; i++) { const p = P.generate('arith', 1 + (i % 6), { max: 20, min: 2 }); assert.ok(p.answer >= 2 && p.answer <= 20); }
assert.deepStrictEqual(P.shiftTime(12, 30, 60), { h: 1, m: 30 });
assert.deepStrictEqual(P.shiftTime(1, 0, -30), { h: 12, m: 30 });
console.log('ok', n, 'problems checked');
