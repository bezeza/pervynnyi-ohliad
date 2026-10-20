// Збирання програми з блоків у src/ → один HTML.
//   node build.mjs          — зібрати: pervynnyi-ohliad.html (офлайн-файл), index.html (сайт, PWA), sw.js (версія кешу)
//   node build.mjs --check  — лише перевірити, що src/ збирається без помилок синтаксису
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
const ROOT = path.dirname(new URL(import.meta.url).pathname), S = p => path.join(ROOT, 'src', p);
const read = p => fs.readFileSync(S(p), 'utf8');
const man = JSON.parse(read('manifest.json'));
const js = man.js.map(f => read('js/' + f)).join('');
// джерело в тому ж вигляді, що й раніше (без doctype): голова, стилі, розмітка, скрипт, хвіст
// шрифти вбудовуються у файл (жодних звернень до сторонніх серверів): src/fonts/fonts.json + *.woff2
const fontCss = JSON.parse(read('fonts/fonts.json')).map(f=>`@font-face{font-family:"${f.family}";font-style:normal;font-weight:${f.weight};font-display:swap;src:url(data:font/woff2;base64,${fs.readFileSync(S('fonts/' + f.file)).toString('base64')}) format("woff2");unicode-range:${f.range}}`).join('\n') + '\n';
let app = read('head.html') + '<style>\n' + fontCss + read('styles.css') + '</style>\n' + read('body.html') + '<script>\n' + js + '</script>\n' + read('tail.html');
try { new vm.Script(js, {filename: 'app.js'}); } catch (e) { console.error('Помилка синтаксису в src/js:', e.message); process.exit(1); }
const ver = (js.match(/const VERSION = '([^']+)'/) || [])[1];
if (!ver) { console.error('Не знайдено VERSION'); process.exit(1); }
// версія — лише в VERSION (src/js/120-version-changelog.js); решта береться звідти
const stage = (js.match(/STAGE = '([^']*)'/) || [])[1] || '', vdate = (js.match(/VDATE = '([^']+)'/) || [])[1] || '';
const first = (js.match(/const CHANGELOG = \[\s*\['([^']+)'/) || [])[1];
if (first !== ver){ console.error(`Історія змін починається з ${first}, а VERSION = ${ver} — додайте запис у CHANGELOG`); process.exit(1); }
if (process.argv.includes('--check')) { console.log('OK, версія', ver); process.exit(0); }
const badge = `v${ver}${stage ? ' ' + stage : ''}`;
app = app.replace(/(id="vBadge"[^>]*>)[^<]*/, `$1${badge}`).replace(/(id="vBadge")/, `$1 title="Версія ${ver} від ${vdate}"`);
const k = app.indexOf('</style>\n') + '</style>\n'.length;
const offline = '<!doctype html>\n<html lang="uk">\n<head>\n' + app.slice(0, k) + '</head>\n<body>\n' + app.slice(k).replace(/\n+$/, '') + '\n\n</body>\n</html>\n';
const pwa = '<link rel="manifest" href="manifest.webmanifest">\n<meta name="theme-color" content="#1D5B8A">\n<link rel="apple-touch-icon" href="apple-touch-icon.png">\n<meta name="apple-mobile-web-app-capable" content="yes">\n<meta name="apple-mobile-web-app-title" content="Первинний огляд">\n';
const swreg = "<script>if ('serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost')) addEventListener('load', ()=>navigator.serviceWorker.register('sw.js').catch(()=>{}));</script>\n";
const index = offline.replace('</style>\n</head>', '</style>\n' + pwa + '</head>').replace('\n</body>\n</html>', '\n' + swreg + '</body>\n</html>');
fs.mkdirSync(path.join(ROOT, 'build'), {recursive: true});
fs.writeFileSync(path.join(ROOT, 'build', 'app.html'), app);          // для тестів і порівняння
{ const offP = path.join(ROOT, 'pervynnyi-ohliad.html');   // попередня версія лишається поруч — щоб можна було повернутися
  if (fs.existsSync(offP)){ const old = fs.readFileSync(offP, 'utf8'), ov = (old.match(/const VERSION = '([^']+)'/) || [])[1]; if (ov && ov !== ver) fs.writeFileSync(path.join(ROOT, 'pervynnyi-ohliad-prev.html'), old); } }
fs.writeFileSync(path.join(ROOT, 'pervynnyi-ohliad.html'), offline);  // офлайн-файл (також доступний на сайті)
fs.writeFileSync(path.join(ROOT, 'index.html'), index);               // сайт
const sw = path.join(ROOT, 'sw.js');
fs.writeFileSync(sw, fs.readFileSync(sw, 'utf8').replace(/const CACHE = '[^']*'/, `const CACHE = 'pervynnyi-ohliad-v${ver}'`));
{ const rp = path.join(ROOT, 'README.md'), rd = fs.readFileSync(rp, 'utf8'), nr = rd.replace(/\*\*Версія [^*·]+· [^*]+\*\*/, `**Версія ${ver} · ${stage || 'реліз'}**`); if (nr !== rd) fs.writeFileSync(rp, nr); }
console.log(`Зібрано v${ver}: ${man.js.length} блоків, ${(Buffer.byteLength(offline) / 1024).toFixed(0)} КБ`);
