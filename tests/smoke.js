// End-to-end smoke test: plays one full trip through all three zones in a real browser.
// Run with: node tests/smoke.js [screenshot-dir]
const { chromium } = require('playwright');
const path = require('path');
const shots = process.argv[2];
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1024, height: 700 } });
  const errors = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
  await page.goto('file://' + path.resolve(__dirname, '../index.html'));
  await page.evaluate(() => { const g = Problems.generate; Problems.generate = (...a) => (window.__last = g(...a)); });
  const shot = async (n) => { if (shots) await page.screenshot({ path: path.join(shots, n + '.png') }); };
  const click = (text) => page.locator('#modal .btn', { hasText: text }).first().click();
  const modalOpen = () => page.evaluate(() => !document.getElementById('modal').classList.contains('hidden'));
  const waitClosed = () => page.waitForFunction(() => document.getElementById('modal').classList.contains('hidden') || !document.querySelector('#modal .ask [data-locked]'), null, { timeout: 5000 });

  async function solve(wrongFirst) {
    await page.waitForSelector('#modal .ask');
    const p = await page.evaluate(() => window.__last);
    if (wrongFirst && p.kind === 'number') { await page.keyboard.type(String(p.answer + 1)); await page.keyboard.press('Enter'); await page.waitForTimeout(100); }
    if (p.kind === 'number') { await page.keyboard.type(String(p.answer)); await page.keyboard.press('Enter'); }
    else if (p.kind === 'time') {
      const hs = (p.answer.h % 12), ms = p.answer.m / p.step;
      for (let i = 0; i < hs; i++) await page.locator('.digital .col').nth(0).locator('.arrow').first().click();
      for (let i = 0; i < ms; i++) await page.locator('.digital .col').nth(1).locator('.arrow').first().click();
      await click('Check');
    } else {
      let rem = p.target; const tray = [...p.tray].sort((a, b) => b - a);
      // find a combination within maxPieces (small search)
      const find = (r, n) => { if (r === 0) return []; if (n === 0) return null; for (const w of tray) if (w <= r) { const s = find(r - w, n - 1); if (s) return [w, ...s]; } return null; };
      for (const w of find(rem, p.maxPieces)) await page.locator('.tray .weight', { hasText: new RegExp('^' + w + '$') }).click();
      await click('Check');
    }
    await page.waitForFunction(() => !document.querySelector('#modal .ask'), null, { timeout: 5000 });
    return p;
  }
  const interact = (type, i = 0) => page.evaluate(([type, i]) => { const e = G.World.ents().filter((x) => x.type === type)[i]; G.World.interact(e); }, [type, i]);

  await page.waitForTimeout(600); await shot('title'); await page.click('#btn-play', { force: true });
  await page.fill('#modal input', 'Robin'); await click('OK');
  for (let i = 0; i < 4; i++) { await shot('story' + i); await page.locator('#modal .btn.big').click(); }
  await shot('home');
  await page.locator('.start').click();
  await page.waitForTimeout(400); await shot('zone0');

  for (let zone = 0; zone < 3; zone++) {
    // helper question (one wrong try first)
    await interact('helper'); await solve(true); await page.waitForTimeout(100);
    // star friends then beds
    const n = await page.evaluate(() => G.Game.beds().length);
    for (let b = 0; b < n; b++) {
      await interact('star', 0); await solve();
      await interact('bed', b);
      await page.waitForSelector('#modal .plant'); if (zone === 0 && b === 0) await shot('plant');
      const magic = await page.evaluate((b) => G.Game.beds()[b].magic, b);
      for (let k = 0; k < magic; k++) await page.locator('.plantrow .btn', { hasText: '+1' }).click();
      await click('Grow');
      await page.waitForTimeout(100);
    }
    // station: earn 4 pieces
    await interact('station');
    for (let k = 0; k < 4; k++) {
      await page.waitForSelector('#modal .ask'); if (k === 0) await shot('station' + zone);
      await solve();
      await page.waitForSelector('#modal .choice');
      await click(k < 3 ? 'Another' : 'Go outside');
    }
    if (zone === 0) {
      // shop: buy the cheapest hat with exact change
      await interact('shop'); await page.waitForSelector('#modal .shop'); await shot('shop');
      await page.locator('.shopitem .btn.go').first().click();
      await page.waitForSelector('#modal .pay');
      const price = await page.evaluate(() => +document.querySelector('.pay .prompt').textContent.match(/(\d+)¢/)[1]);
      let rem = price;
      for (const d of [5, 1]) while (rem >= d) { await page.locator('.pay .tray .coin', { hasText: new RegExp('^' + d + '¢') }).click(); rem -= d; }
      await shot('pay'); await click('Pay');
      await page.waitForSelector('#modal .shop'); await page.locator('#modal .round').click();
    }
    await shot('zone' + zone + 'done');
    await interact('gate');
    if (zone === 2) await solve();
    await page.waitForTimeout(300);
  }
  await page.waitForSelector('#modal .story'); await shot('summit');
  await page.locator('#modal .btn.big').click(); await page.locator('#modal .btn.big').click();
  await page.waitForSelector('#screen-home:not(.hidden)'); await shot('home2');
  const s = await page.evaluate(() => G.state);
  console.log(JSON.stringify({ climbs: s.climbs, gems: s.totalGems, coins: s.coins, stickers: s.stickers, hats: s.hats, levels: Object.fromEntries(Object.entries(s.skills).map(([k, v]) => [k, v.level])) }));
  // grown-ups area opens
  await page.locator('.homefoot .btn', { hasText: 'Grown-ups' }).click();
  const q = await page.locator('#modal p').first().textContent(); const [a, b] = q.match(/\d+/g).map(Number);
  await page.fill('#modal input', String(a * b)); await click('Enter');
  await page.waitForSelector('.ptable'); await shot('parent');
  await click('Done');
  // second trip has Sneezles; tap-to-walk works
  await page.locator('.start').click(); await page.waitForTimeout(300);
  const sn = await page.evaluate(() => G.World.sneezles().length);
  await page.mouse.click(800, 500); await page.waitForTimeout(1500);
  const hx = await page.evaluate(() => G.World.hero().x);
  await shot('trip2');
  if (s.climbs !== 1 || s.totalGems !== 6 || s.stickers.length !== 1 || s.hats.length !== 1) throw new Error('unexpected state');
  if (sn < 1) throw new Error('no sneezles on second trip');
  if (hx < 200) throw new Error('hero did not walk: ' + hx);
  if (errors.length) throw new Error('page errors: ' + errors.join('\n'));
  console.log('smoke test passed');
  await browser.close();
})().catch((e) => { console.error(e); process.exit(1); });
