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
const app = read('head.html') + '<style>\n' + read('styles.css') + '</style>\n' + read('body.html') + '<script>\n' + js + '</script>\n' + read('tail.html');
try { new vm.Script(js, {filename: 'app.js'}); } catch (e) { console.error('Помилка синтаксису в src/js:', e.message); process.exit(1); }
const ver = (js.match(/const VERSION = '([^']+)'/) || [])[1];
if (!ver) { console.error('Не знайдено VERSION'); process.exit(1); }
if (process.argv.includes('--check')) { console.log('OK, версія', ver); process.exit(0); }
const k = app.indexOf('</style>\n') + '</style>\n'.length;
const offline = '<!doctype html>\n<html lang="uk">\n<head>\n' + app.slice(0, k) + '</head>\n<body>\n' + app.slice(k).replace(/\n+$/, '') + '\n\n</body>\n</html>\n';
const pwa = '<link rel="manifest" href="manifest.webmanifest">\n<meta name="theme-color" content="#1D5B8A">\n<link rel="apple-touch-icon" href="apple-touch-icon.png">\n<meta name="apple-mobile-web-app-capable" content="yes">\n<meta name="apple-mobile-web-app-title" content="Первинний огляд">\n';
const swreg = "<script>if ('serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost')) addEventListener('load', ()=>navigator.serviceWorker.register('sw.js').catch(()=>{}));</script>\n";
const index = offline.replace('</style>\n</head>', '</style>\n' + pwa + '</head>').replace('\n</body>\n</html>', '\n' + swreg + '</body>\n</html>');
fs.mkdirSync(path.join(ROOT, 'build'), {recursive: true});
fs.writeFileSync(path.join(ROOT, 'build', 'app.html'), app);          // для тестів і порівняння
fs.writeFileSync(path.join(ROOT, 'pervynnyi-ohliad.html'), offline);  // офлайн-файл (також доступний на сайті)
fs.writeFileSync(path.join(ROOT, 'index.html'), index);               // сайт
const sw = path.join(ROOT, 'sw.js');
fs.writeFileSync(sw, fs.readFileSync(sw, 'utf8').replace(/const CACHE = '[^']*'/, `const CACHE = 'pervynnyi-ohliad-v${ver}'`));
console.log(`Зібрано v${ver}: ${man.js.length} блоків, ${(Buffer.byteLength(offline) / 1024).toFixed(0)} КБ`);
