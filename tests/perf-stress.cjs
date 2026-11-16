// Стрес- і ресурсні заміри в реальному Chromium (задача 18): аркуш, окреме вікно ⧉, 500 вигаданих пацієнтів
// в реальному IndexedDB, 5 перемикань стилю (обробники/спостерігачі). Без порогів — лише друкує.
//   node tests/perf-stress.cjs [--cpu=4] [--n=500] [--json=out.json]   (потрібен playwright, див. tests/perf.cjs)
const fs = require('fs'), path = require('path');
let pw; try { pw = require('playwright'); } catch (e) { try { pw = require('playwright-core'); } catch (e2) { console.log('Немає playwright/playwright-core — замір пропущено.'); process.exit(0); } }
const arg = (k, d) => { const a = process.argv.find(x => x.startsWith('--' + k + '=')); return a ? a.split('=')[1] : d; };
const CPU = +arg('cpu', 4), N = +arg('n', 500), JSON_OUT = arg('json', '');
const FILE = 'file://' + path.join(__dirname, '..', 'pervynnyi-ohliad.html');
const median = a => { const s = [...a].sort((x, y) => x - y), m = s.length >> 1; return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2; };
const p95 = a => { const s = [...a].sort((x, y) => x - y); return s[Math.min(s.length - 1, Math.ceil(s.length * .95) - 1)]; };
const f1 = x => (+x).toFixed(1);
const report = {};
const log = (k, v, line) => { report[k] = v; console.log(line); };

async function mk(browser, cpu) {
  const ctx = await browser.newContext({ viewport: { width: 1366, height: 768 } });
  await ctx.addInitScript(() => {
    try { localStorage.setItem('po.autogate', '0'); localStorage.setItem('po.welcome', '1'); localStorage.setItem('po.profask', '1'); } catch (e) {}
    // лічильники живих обробників і спостерігачів (див. «Стиль ×5»)
    const L = window.__L = { add: 0, rem: 0, gadd: 0, grem: 0, mo: 0, moDisc: 0 };
    const isG = t => t === window || t === document || t === document.documentElement || t === document.body;
    const a = EventTarget.prototype.addEventListener, r = EventTarget.prototype.removeEventListener;
    EventTarget.prototype.addEventListener = function () { L.add++; if (isG(this)) L.gadd++; return a.apply(this, arguments); };
    EventTarget.prototype.removeEventListener = function () { L.rem++; if (isG(this)) L.grem++; return r.apply(this, arguments); };
    const MO = window.MutationObserver, d = MO.prototype.disconnect;
    window.MutationObserver = class extends MO { constructor(cb) { super(cb); L.mo++; } disconnect() { L.moDisc++; return d.call(this); } };
  });
  const page = await ctx.newPage(); const errors = []; page.on('pageerror', e => errors.push(e.message));
  if (cpu > 1) await (await ctx.newCDPSession(page)).send('Emulation.setCPUThrottlingRate', { rate: cpu });
  await page.goto(FILE, { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => typeof update === 'function' && !!document.getElementById('out'));
  await page.waitForTimeout(800);
  return { ctx, page, errors };
}
const fill = page => page.evaluate(() => {
  const set = (id, v) => { const e = document.getElementById(id); e.value = v; e.dispatchEvent(new Event(e.tagName === 'SELECT' ? 'change' : 'input', { bubbles: true })); };
  TABS.find(t => t.id === 'meta').tab.click();
  set('meta_pib', 'Тестовий пацієнт PERF — НЕ РЕАЛЬНА ОСОБА'); set('meta_dob', '1980-01-01'); set('meta_card', 'PERF-0');
  [...document.querySelectorAll('.dcard')].find(b => b.textContent.includes('Негоспітальна пневмонія')).click();
});
const times = (page, src, n) => page.evaluate(([s, n]) => { const f = new Function('return (' + s + ')')(), o = []; for (let i = 0; i < n; i++) { const t = performance.now(); f(); o.push(performance.now() - t); } return o; }, [src, n]);

(async () => {
  const launch = { args: ['--no-sandbox'] }; if (process.env.PW_EXECUTABLE) launch.executablePath = process.env.PW_EXECUTABLE;
  const browser = await pw.chromium.launch(launch);
  console.log(`Chromium ${browser.version()}; CPU ×${CPU}\n`);

  // 1. Аркуш (Paper) відкритий
  { const { ctx, page, errors } = await mk(browser, CPU); await fill(page); await page.waitForTimeout(500);
    await page.evaluate(() => { PAPER = true; renderPaper(); });
    const a = await times(page, 'renderPaper', 11), u = await times(page, 'update', 11);
    log('paper', { renderPaper: { median: median(a), p95: p95(a) }, updateWithPaper: { median: median(u), p95: p95(u) }, errors },
      `Аркуш відкритий: renderPaper median ${f1(median(a))} / p95 ${f1(p95(a))} мс; update() з аркушем median ${f1(median(u))} / p95 ${f1(p95(u))} мс`);
    // 2. Окреме вікно ⧉
    const o = [], r = [], c = [];
    for (let i = 0; i < 5; i++) {
      const t0 = Date.now(); const pop = page.waitForEvent('popup', { timeout: 15000 });
      await page.evaluate(() => popOpen()); const w = await pop;
      await w.waitForFunction(() => !!document.getElementById('pwBox')); o.push(Date.now() - t0);
      r.push(...await page.evaluate(() => { const o = []; for (let k = 0; k < 5; k++) { const t = performance.now(); popRender(); o.push(performance.now() - t); } return o; }));
      const t1 = Date.now(); await w.close(); await page.waitForTimeout(150); c.push(Date.now() - t1);
    }
    log('popout', { open: { median: median(o), p95: p95(o), samples: o }, render: { median: median(r), p95: p95(r) }, close: { median: median(c) } },
      `Окреме вікно ⧉: відкриття median ${f1(median(o))} мс (p95 ${f1(p95(o))}), popRender median ${f1(median(r))} / p95 ${f1(p95(r))} мс, закриття ~${f1(median(c))} мс`);
    await ctx.close(); }

  // 3. Стиль ×5: чи не накопичуються обробники/спостерігачі
  { const { ctx, page } = await mk(browser, 1); await fill(page); await page.waitForTimeout(500);
    const snap = () => page.evaluate(() => ({ ...window.__L, nodes: document.getElementsByTagName('*').length, heap: performance.memory ? performance.memory.usedJSHeapSize : 0 }));
    const rounds = []; rounds.push({ i: 0, ...await snap() }); const ms = [];
    for (let i = 1; i <= 5; i++) {
      ms.push((await page.evaluate(() => { const t = performance.now(); uiStyleSet('classic'); uiStyleSet('ios'); return performance.now() - t; })));
      await page.waitForTimeout(300); rounds.push({ i, ...await snap() });
    }
    const live = s => s.gadd - s.grem, liveMO = s => s.mo - s.moDisc;
    console.log('Стиль ios↔classic ×5 (ітерація: нетто-обробники на window/document/body, живі MutationObserver, вузлів DOM, кучa МБ, мс):');
    rounds.forEach((s, k) => console.log(`  #${s.i}: ${live(s)}  ${liveMO(s)}  ${s.nodes}  ${(s.heap / 1048576).toFixed(1)}  ${k ? f1(ms[k - 1]) : '-'}`));
    const dl = live(rounds[5]) - live(rounds[1]), dm = liveMO(rounds[5]) - liveMO(rounds[1]);
    log('styleSwitch', { rounds, ms, growthListenersIter1to5: dl, growthObserversIter1to5: dm }, `  приріст між #1 і #5: обробників ${dl}, спостерігачів ${dm} (0 = не накопичуються)`);
    await ctx.close(); }

  // 4. N пацієнтів у реальному IndexedDB
  { const { ctx, page, errors } = await mk(browser, CPU); await fill(page); await page.waitForTimeout(500);
    const wr = await page.evaluate(async n => {
      savePatient(true); const base = loadStore()[PID].snap; const st = loadStore();
      for (let i = 0; i < n; i++) { const id = 'perf' + i; st[id] = { name: 'Тест Пацієнт ' + i + ' (вигаданий)', card: 'PERF-' + i, dob: '1980-01-01', updated: Date.now() + i, snap: base }; }
      const t = performance.now(); saveStore(st); const sync = performance.now() - t;
      await new Promise(r => { const tx = IDB.db.transaction('patients', 'readonly'); tx.oncomplete = r; tx.objectStore('patients').count(); });
      return { sync, total: performance.now() - t };
    }, N);
    const rp = await times(page, 'renderPatients', 5), op = await page.evaluate(() => { const ids = Object.keys(loadStore()).filter(k => k.startsWith('perf')); const o = []; for (let i = 0; i < 5; i++) { const t = performance.now(); openPatient(ids[i * 7]); o.push(performance.now() - t); } return o; });
    const t0 = Date.now(); await page.reload({ waitUntil: 'domcontentloaded' });
    await page.waitForFunction(() => typeof IDB !== 'undefined' && IDB.ok && Object.keys(IDB.cache).length > 0, null, { timeout: 60000 });
    const reload = Date.now() - t0, cnt = await page.evaluate(() => Object.keys(loadStore()).length);
    log('patients', { n: N, writeSync: wr.sync, writeTotal: wr.total, renderPatients: { median: median(rp), p95: p95(rp) }, openPatient: { median: median(op), p95: p95(op) }, reloadToReady: reload, countAfterReload: cnt, errors },
      `${N} пацієнтів: запис (синхронно / до завершення транзакції) ${f1(wr.sync)} / ${f1(wr.total)} мс; renderPatients median ${f1(median(rp))} мс; openPatient median ${f1(median(op))} / p95 ${f1(p95(op))} мс; перезавантаження до готовності бази ${reload} мс; після перезавантаження пацієнтів: ${cnt}${errors.length ? '; ⚠ ' + errors[0] : ''}`);
    await ctx.close(); }

  await browser.close();
  if (JSON_OUT) fs.writeFileSync(JSON_OUT, JSON.stringify(report, null, 1));
})().catch(e => { console.error(e); process.exit(1); });
