// Доступність у реальному Chromium через axe-core (задача 18). Без порогів: друкує порушення за правилами.
//   node tests/a11y.cjs [--json=out.json]   Потрібні playwright і axe-core:  npm i --no-save playwright axe-core
// Екрани: вкладки з TABS (перші 8) × стиль (ios/classic) × тема (day/night). Дані — вигаданий пацієнт.
const fs = require('fs'), path = require('path');
let pw; try { pw = require('playwright'); } catch (e) { try { pw = require('playwright-core'); } catch (e2) { console.log('Немає playwright — пропущено.'); process.exit(0); } }
let axeSrc; try { axeSrc = fs.readFileSync(require.resolve('axe-core/axe.min.js'), 'utf8'); } catch (e) { console.log('Немає axe-core — пропущено (npm i --no-save axe-core).'); process.exit(0); }
const JSON_OUT = (process.argv.find(x => x.startsWith('--json=')) || '').slice(7);
const FILE = 'file://' + path.join(__dirname, '..', 'pervynnyi-ohliad.html');
(async () => {
  const launch = { args: ['--no-sandbox'] }; if (process.env.PW_EXECUTABLE) launch.executablePath = process.env.PW_EXECUTABLE;
  const browser = await pw.chromium.launch(launch);
  const ctx = await browser.newContext({ viewport: { width: 1366, height: 768 } });
  await ctx.addInitScript(() => { try { localStorage.setItem('po.autogate', '0'); localStorage.setItem('po.welcome', '1'); localStorage.setItem('po.profask', '1'); } catch (e) {} });
  const page = await ctx.newPage();
  await page.goto(FILE, { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => typeof update === 'function' && !!document.getElementById('out'));
  await page.waitForTimeout(800);
  await page.evaluate(() => {
    const set = (id, v) => { const e = document.getElementById(id); e.value = v; e.dispatchEvent(new Event(e.tagName === 'SELECT' ? 'change' : 'input', { bubbles: true })); };
    TABS.find(t => t.id === 'meta').tab.click();
    set('meta_pib', 'Тестовий пацієнт A11Y — НЕ РЕАЛЬНА ОСОБА'); set('meta_dob', '1980-01-01'); set('meta_card', 'A11Y-0');
    [...document.querySelectorAll('.dcard')].find(b => b.textContent.includes('Негоспітальна пневмонія')).click();
  });
  await page.waitForTimeout(500);
  await page.addScriptTag({ content: axeSrc });
  const nTabs = await page.evaluate(() => Math.min(8, TABS.length));
  const rows = [], byRule = {};
  for (const style of ['ios', 'classic']) for (const theme of ['day', 'night']) {
    await page.evaluate(([s, t]) => { uiStyleSet(s); themeSet(t); }, [style, theme]); await page.waitForTimeout(400);
    for (let i = 0; i < nTabs; i++) {
      const name = await page.evaluate(i => { show(i); const t = TABS[i]; return (t.id || '') + ':' + ((t.tab && t.tab.textContent) || '').trim().slice(0, 20); }, i);
      await page.waitForTimeout(250);
      const res = await page.evaluate(() => axe.run(document, { resultTypes: ['violations'] }));
      for (const v of res.violations) {
        const key = v.id; const r = byRule[key] || (byRule[key] = { impact: v.impact, help: v.help, screens: 0, nodes: 0, sample: v.nodes[0] && v.nodes[0].target.join(' ') });
        r.screens++; r.nodes += v.nodes.length;
      }
      rows.push({ style, theme, tab: name, violations: res.violations.map(v => ({ id: v.id, impact: v.impact, nodes: v.nodes.length })) });
    }
  }
  console.log(`Екранів: ${rows.length}; з порушеннями: ${rows.filter(r => r.violations.length).length}\n`);
  const order = { critical: 0, serious: 1, moderate: 2, minor: 3 };
  Object.entries(byRule).sort((a, b) => order[a[1].impact] - order[b[1].impact] || b[1].nodes - a[1].nodes).forEach(([id, r]) =>
    console.log(`${(r.impact || '').padEnd(9)} ${id.padEnd(28)} екранів ${String(r.screens).padStart(2)}, вузлів ${String(r.nodes).padStart(3)} — ${r.help}\n           напр.: ${r.sample}`));
  if (JSON_OUT) fs.writeFileSync(JSON_OUT, JSON.stringify({ rows, byRule }, null, 1));
  await browser.close();
})().catch(e => { console.error(e); process.exit(1); });
