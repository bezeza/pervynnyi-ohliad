// Замір швидкодії в реальному Chromium (задача 18, етап 1). Без порогів: лише вимірює й друкує.
//   node tests/perf.cjs [--runs=15] [--cpu=4] [--json=out.json]
// Потрібен пакет playwright (або playwright-core) — у devDependencies його НЕМАЄ навмисно, у CI цей тест не входить.
//   npm i --no-save playwright && npx playwright install chromium
// Свій Chrome/Chromium: PW_EXECUTABLE=/usr/bin/google-chrome node tests/perf.cjs
// Дані — лише вигаданий пацієнт. Збирання: спершу node build.mjs.
const fs = require('fs'), path = require('path');
let pw; try { pw = require('playwright'); } catch (e) { try { pw = require('playwright-core'); } catch (e2) { console.log('Немає playwright/playwright-core — замір пропущено (див. шапку файлу).'); process.exit(0); } }
const arg = (k, d) => { const a = process.argv.find(x => x.startsWith('--' + k + '=')); return a ? a.split('=')[1] : d; };
const RUNS = +arg('runs', 15), CPU = +arg('cpu', 4), JSON_OUT = arg('json', '');
const FILE = path.join(__dirname, '..', 'pervynnyi-ohliad.html');
if (!fs.existsSync(FILE)) { console.error('Немає pervynnyi-ohliad.html — виконайте node build.mjs'); process.exit(1); }

const median = a => { const s = [...a].sort((x, y) => x - y), m = s.length >> 1; return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2; };
const p95 = a => { const s = [...a].sort((x, y) => x - y); return s[Math.min(s.length - 1, Math.ceil(s.length * 0.95) - 1)]; };
const fmt = x => x.toFixed(1).padStart(8);

async function open(browser, cpu) {
  const ctx = await browser.newContext({ viewport: { width: 1366, height: 768 } });
  await ctx.addInitScript(() => { try { localStorage.setItem('po.autogate', '0'); localStorage.setItem('po.welcome', '1'); localStorage.setItem('po.profask', '1'); } catch (e) {} });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  const cdp = await ctx.newCDPSession(page);
  if (cpu > 1) await cdp.send('Emulation.setCPUThrottlingRate', { rate: cpu });
  return { ctx, page, errors };
}

// Час запуску: навігація → усі скрипти виконано й update() доступна.
async function startup(browser, cpu) {
  const { ctx, page, errors } = await open(browser, cpu);
  const t0 = Date.now();
  await page.goto('file://' + FILE, { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => typeof update === 'function' && !!document.getElementById('out'));
  const ms = Date.now() - t0;
  await ctx.close();
  return { ms, errors };
}

// Вимірює fn у сторінці RUNS разів (performance.now усередині сторінки — без накладних Playwright).
const timeIn = (page, expr, runs) => page.evaluate(([e, n]) => {
  const out = []; const f = new Function('return (' + e + ')')();
  for (let i = 0; i < n; i++) { const t = performance.now(); f(); out.push(performance.now() - t); }
  return out;
}, [expr, runs]);

async function fillPatient(page) {
  await page.evaluate(() => {
    const set = (id, v) => { const e = document.getElementById(id); e.value = v; e.dispatchEvent(new Event(e.tagName === 'SELECT' ? 'change' : 'input', { bubbles: true })); };
    (TABS.find(t => t.id === 'meta').tab).click();
    set('meta_pib', 'Тестовий пацієнт PERF — НЕ РЕАЛЬНА ОСОБА'); set('meta_dob', '1980-01-01'); set('meta_card', 'PERF-TEST-001');
    const c = [...document.querySelectorAll('.dcard')].find(b => b.textContent.includes('Негоспітальна пневмонія'));
    if (!c) throw Error('Немає шаблону «Негоспітальна пневмонія»'); c.click();
  });
  await page.waitForTimeout(500);
}

async function scenario(browser, cpu, filled) {
  const { ctx, page, errors } = await open(browser, cpu);
  await page.goto('file://' + FILE, { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => typeof update === 'function' && !!document.getElementById('out'));
  await page.waitForTimeout(800);
  if (filled) await fillPatient(page);
  const res = {};
  res['update()'] = await timeIn(page, 'update', RUNS);
  res['renderPaper()'] = await timeIn(page, 'renderPaper', RUNS);
  res['show(1)+show(0)'] = await timeIn(page, '()=>{show(Math.min(1,TABS.length-1));show(0);}', RUNS);
  // Розклад update() за callbacks (UPD.st з 596-update-hooks.js), якщо доступно.
  const breakdown = await page.evaluate(n => {
    try { if (typeof UPD === 'undefined' || typeof updStats !== 'function') return null;
      for (const k of Object.keys(UPD.st)) delete UPD.st[k];
      for (let i = 0; i < n; i++) update();
      return updStats().slice(0, 8).map(r => [r['дія'], r['сер., мс'], r['макс., мс']]);
    } catch (e) { return 'помилка: ' + e.message; } }, RUNS);
  const textLen = await page.evaluate(() => document.getElementById('out').textContent.length);
  await ctx.close();
  return { res, breakdown, textLen, errors };
}

(async () => {
  const launch = { args: ['--no-sandbox'] };
  if (process.env.PW_EXECUTABLE) launch.executablePath = process.env.PW_EXECUTABLE;
  const browser = await pw.chromium.launch(launch);
  const report = { version: browser.version(), runs: RUNS, cpuThrottle: CPU, file: path.basename(FILE), bytes: fs.statSync(FILE).size, startup: {}, scenarios: {} };
  console.log(`Chromium ${report.version}; файл ${(report.bytes / 1048576).toFixed(2)} MiB; прогонів ${RUNS}; CPU ×${CPU} і ×1\n`);
  for (const cpu of [1, CPU]) {
    const s = []; for (let i = 0; i < Math.min(RUNS, 7); i++) s.push((await startup(browser, cpu)).ms);
    report.startup['cpu' + cpu] = { median: median(s), p95: p95(s), samples: s };
    console.log(`Запуск, CPU ×${cpu}: median ${fmt(median(s))} мс, p95 ${fmt(p95(s))} мс (n=${s.length})`);
  }
  for (const cpu of [1, CPU]) for (const filled of [false, true]) {
    const key = `cpu${cpu}/${filled ? 'заповнений' : 'порожній'}`;
    const r = await scenario(browser, cpu, filled);
    report.scenarios[key] = { textLen: r.textLen, errors: r.errors, ops: {}, breakdown: r.breakdown };
    console.log(`\n── ${key} (текст документа ${r.textLen} симв.) ──`);
    for (const [op, arr] of Object.entries(r.res)) {
      report.scenarios[key].ops[op] = { median: median(arr), p95: p95(arr), samples: arr };
      console.log(`${op.padEnd(18)} median ${fmt(median(arr))} мс  p95 ${fmt(p95(arr))} мс`);
    }
    if (Array.isArray(r.breakdown)) { console.log('Найдорожчі onUpdate-callbacks (сер., макс. мс):'); for (const b of r.breakdown) console.log('  ' + String(b[0]).padEnd(28) + fmt(+b[1]) + fmt(+b[2])); }
    if (r.errors.length) console.log('⚠ Помилки JS: ' + r.errors.slice(0, 3).join(' | '));
  }
  await browser.close();
  if (JSON_OUT) { fs.writeFileSync(JSON_OUT, JSON.stringify(report, null, 1)); console.log('\nJSON: ' + JSON_OUT); }
})().catch(e => { console.error(e); process.exit(1); });
