// Нові функції частинами, паралельно (~у 3 рази швидше).
//   node tests/features-part.cjs      — усі 3 частини одночасно, спільний підсумок
//   node tests/features-part.cjs 2    — лише частина 2 (так запускає CI)
// Файл tests/features.cjs ділиться за мітками «── кінець підготовки», «── частина 2 ──», «── частина 3 ──».
// Кожна частина: спільна підготовка (знайомство, лікар) + свої блоки + підсумкова перевірка «Без помилок JavaScript».
// Новий тест дописуйте, як і раніше, у кінець features.cjs — він потрапить у частину 3.
const fs = require('fs'), path = require('path'), {spawn} = require('child_process');
const src = fs.readFileSync(path.join(__dirname, 'features.cjs'), 'utf8').split('\n');
const at = s => { const i = src.findIndex(l => l.includes(s)); if (i < 0) { console.error('Не знайдено мітку: ' + s); process.exit(2); } return i; };
const iPrep = at('── кінець підготовки'), i2 = at('── частина 2 ──'), i3 = at('── частина 3 ──'), iEnd = at("ok('Без помилок JavaScript'");
const RANGES = {1: [iPrep + 1, i2], 2: [i2, i3], 3: [i3, iEnd]};
function make(k){
  const [a, b] = RANGES[k], f = path.join(__dirname, `.features-part-${k}.cjs`);
  fs.writeFileSync(f, [...src.slice(0, iPrep + 1), ...src.slice(a, b), ...src.slice(iEnd)].join('\n'));
  return f;
}
const k = process.argv[2];
if (k){ if (!RANGES[k]){ console.error('Частина 1, 2 або 3'); process.exit(2); } require(make(k)); }
else {
  const t0 = Date.now();
  Promise.all([1, 2, 3].map(n => new Promise(res => {
    const p = spawn(process.execPath, [__filename, String(n)], {stdio: ['ignore', 'pipe', 'pipe']});
    let out = '', err = ''; p.stdout.on('data', d => out += d); p.stderr.on('data', d => err += d);
    p.on('close', code => res({n, code, out, err}));
  }))).then(rs => {
    let pass = 0, all = 0;
    rs.forEach(r => {
      const lines = r.out.split('\n').filter(l => /^[✅❌]/.test(l));
      pass += lines.filter(l => l[0] === '✅').length; all += lines.length;
      lines.filter(l => l[0] === '❌').forEach(l => console.log(`[частина ${r.n}] ${l}`));
      if (r.code && !lines.some(l => l[0] === '❌')) console.log(`[частина ${r.n}] ❌ завершилась з кодом ${r.code}\n${r.err.slice(-1500)}`);
    });
    console.log(`\nРазом: ${pass} з ${all} (3 частини паралельно, ${Math.round((Date.now() - t0) / 1000)} с)`);
    process.exit(rs.some(r => r.code) ? 1 : 0);
  });
}
