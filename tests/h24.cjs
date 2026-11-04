// Розбір синтетичної медкарти H24 і імпорт у програму. node tests/h24.cjs
const {JSDOM} = require('jsdom');
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const root = path.join(__dirname, '..');
const R = [];
const ok = (n, c, info) => { R.push((c ? '✅' : '❌') + ' ' + n + (info && !c ? ' — ' + info : '')); };
const read = f => fs.readFileSync(path.join(root, f), 'utf8');
const script = read('tools/h24/h24-to-pervynnyi.user.js');
const sandbox = {};
vm.createContext(sandbox);
vm.runInContext(read('src/js/674-h24-import.js'), sandbox, {filename: '674-h24-import.js'});

function inject(dom) {
  const el = dom.window.document.createElement('script');
  el.textContent = script;
  dom.window.document.body.appendChild(el);
  return dom;
}
function parser() {
  const dom = inject(new JSDOM('<!doctype html><html><body></body></html>', {url: 'https://example.com/', runScripts: 'dangerously'}));
  return dom.window.h24ParseDocument;
}
const parse = parser();
function domOf(html, url) {
  return new JSDOM(html, {url: url || 'https://mis.h24.ua/new/profile/doctor/patients/4242/medical-card/patient-summary'});
}
const PATIENT = 'https://mis.h24.ua/new/profile/doctor/patients/4242/medical-card/patient-summary';
const fixtureHtml = read('tools/h24/fixtures/synthetic-patient.html');
const data = parse(domOf(fixtureHtml, PATIENT).window.document);

ok('Синтетична картка: ПІБ Тестовий Пацієнт, не сусід зі списку', data.patient.fullName === 'Тестовий Пацієнт Іванович', data.patient.fullName);
ok('Дата народження словами → ISO', data.patient.birthDate === '1973-04-21', data.patient.birthDate);
ok('Стать Ч. → чоловік', data.patient.sex === 'm', data.patient.sex);
ok('Два епізоди: активний J18.1 і завершений J44.9', data.episodes.length === 2 && data.episodes[0].code === 'J18.1' && data.episodes[0].name === 'Часткова пневмонія' && data.episodes[0].status === 'Активний' && data.episodes[0].start === '2026-11-01' && data.episodes[0].end === '' && data.episodes[1].code === 'J44.9' && data.episodes[1].end === '2025-01-20', JSON.stringify(data.episodes));
ok('Діагнози з ролями, uuid ЕСОЗ не став назвою', data.diagnoses.length === 2 && data.diagnoses[0].role === 'Основний' && data.diagnoses[0].code === 'J18.1' && data.diagnoses[1].code === 'I10' && !JSON.stringify(data).includes('aaaaaaaa'), JSON.stringify(data.diagnoses));
ok('Алергія і ліки з пар ключ–значення', data.allergies.join('|') === 'Пеніцилін — висип' && data.medications.join('|') === 'Сальбутамол 100 мкг інгаляційно', JSON.stringify([data.allergies, data.medications]));
ok('Конверт JSON: source h24, version 1', data.source === 'h24' && data.version === 1 && typeof data.capturedAt === 'string' && data.capturedAt.length > 8);

const labels = parse(domOf(`<main>
  <div class="h24-popover__key-value"><span>ПІБ</span><span>Тестовий Пацієнт Іванович</span></div>
  <div class="h24-popover__key-value"><span>Дата народження</span><span>21.04.1973</span></div>
  <div class="h24-popover__key-value"><span>Стать</span><span>чоловіча</span></div>
  <h2>Епізоди</h2>
  <table><tr><td>J18.9 Негоспітальна пневмонія</td><td>Активний</td><td>01.11.2026</td></tr></table>
</main>`).window.document);
ok('Без data-test: підписи, стать словами, рядок без шапки', labels.patient.fullName === 'Тестовий Пацієнт Іванович' && labels.patient.birthDate === '1973-04-21' && labels.patient.sex === 'm' && labels.episodes[0].code === 'J18.9' && labels.episodes[0].status === 'Активний' && labels.episodes[0].start === '2026-11-01', JSON.stringify(labels));

const meds = parse(domOf(`<h2>Лікарські засоби</h2><table><tr><td>Препарат</td><td>Доза</td></tr><tr><td>Сальбутамол</td><td>100 мкг</td></tr></table>
<h2>Алергії</h2><ul><li>Пеніцилін</li><li>не виявлено пилку</li></ul>`).window.document);
ok('Таблиця препаратів і список алергій після заголовків', meds.medications.some(s => /Сальбутамол/.test(s) && /100 мкг/.test(s)) && meds.allergies.includes('Пеніцилін') && meds.episodes.length === 0, JSON.stringify(meds));

const empty = parse(domOf('<h1>Медкарта</h1><button>Зберегти</button>').window.document);
ok('Порожня сторінка не падає і нічого не вигадує', empty.patient.fullName === '' && empty.episodes.length === 0 && empty.diagnoses.length === 0 && empty.allergies.length === 0 && empty.medications.length === 0, JSON.stringify(empty));

const V = sandbox.h24ImportValidate, P = sandbox.h24ImportPlan;
const good = V(data);
ok('Імпортер приймає JSON розбору', good.ok === true, good.error);
const plan = P(good.data);
ok('У документ іде основний діагноз J18.1, не завершений епізод', plan.dxCode === 'J18.1' && plan.dxName === 'Часткова пневмонія' && plan.sup === 'Гіпертонічна хвороба (I10)' && plan.source === 'diagnosis', JSON.stringify(plan));
ok('Алергія і ліки є в плані заповнення', plan.allergyMode === 'has' && /Пеніцилін/.test(plan.allergyText) && /Сальбутамол/.test(plan.medsLine));

const onlyEp = V({source:'h24', version:1, patient:{fullName:'Тестовий Пацієнт Іванович', birthDate:'21.04.1973', sex:''}, episodes:[{code:'J44.9', name:'ХОЗЛ', start:'02.01.2025', end:'20.01.2025', status:'Завершений'}, {code:'J18.9', name:'Негоспітальна пневмонія', start:'2026-11-01', status:'Активний'}], diagnoses:[], allergies:['Алергії не виявлено'], medications:[]});
ok('Дата цифрами і стать з по батькові', onlyEp.ok && onlyEp.data.patient.birthDate === '1973-04-21' && onlyEp.data.patient.sex === 'm', onlyEp.error || JSON.stringify(onlyEp.data && onlyEp.data.patient));
const epPlan = P(onlyEp.data);
ok('Без діагнозів береться активний епізод, заперечення алергії — «не обтяжений»', epPlan.dxCode === 'J18.9' && epPlan.source === 'episode' && epPlan.allergyMode === 'none' && epPlan.sup === '', JSON.stringify(epPlan));

ok('Відхиляє чужий JSON', V({source:'other', version:1, patient:{fullName:'Тестовий Пацієнт'}}).ok === false);
ok('Відхиляє іншу версію', V({source:'h24', version:2, patient:{fullName:'Тестовий Пацієнт'}}).ok === false);
ok('Відхиляє ПІБ з розміткою', V({source:'h24', version:1, patient:{fullName:'<b>Тестовий</b>'}}).ok === false);
ok('Відхиляє неможливу дату', V({source:'h24', version:1, patient:{fullName:'Тестовий Пацієнт', birthDate:'32.13.1999'}}).ok === false);
ok('Відхиляє текст без JSON', V('просто ПІБ').ok === false);
ok('Епізоди не списком — помилка', V({source:'h24', version:1, patient:{fullName:'Тестовий Пацієнт'}, episodes:'J18'}).ok === false);

function boot(html, url, copy) {
  const dom = new JSDOM(html, {url, runScripts: 'dangerously', pretendToBeVisual: true});
  const bag = {copied: '', clicks: [], nets: 0};
  const proto = dom.window.HTMLElement.prototype;
  const origClick = proto.click;
  proto.click = function () { bag.clicks.push((this.id || '') + '|' + (this.textContent || '').replace(/\s+/g, ' ').trim()); if (origClick) return origClick.apply(this, arguments); };
  if (copy !== false) dom.window.GM_setClipboard = t => { bag.copied = t; };
  dom.window.fetch = () => { bag.nets++; return Promise.reject(new Error('net')); };
  const xo = dom.window.XMLHttpRequest && dom.window.XMLHttpRequest.prototype.open;
  if (xo) dom.window.XMLHttpRequest.prototype.open = function () { bag.nets++; return xo.apply(this, arguments); };
  if (dom.window.navigator.sendBeacon) dom.window.navigator.sendBeacon = () => { bag.nets++; return false; };
  inject(dom);
  return {dom, bag, w: dom.window};
}
const page = boot(fixtureHtml, PATIENT);
const btn = page.w.document.getElementById('h24po-btn');
ok('На сторінці пацієнта є кнопка', !!btn && btn.textContent === '→ в Первинний огляд' && btn.type === 'button');
btn.click();
let copied;
try { copied = JSON.parse(page.bag.copied); } catch (e) { copied = null; }
ok('Клік копіює той самий JSON, без мережі і без чужих кліків', copied && copied.patient.fullName === 'Тестовий Пацієнт Іванович' && page.bag.nets === 0 && page.bag.clicks.every(s => s.startsWith('h24po-btn|')), page.bag.clicks.join('; ') + ' nets=' + page.bag.nets);
const preview = page.w.document.getElementById('h24po-preview');
const previewText = preview ? preview.textContent : '';
ok('Передперегляд — лічильники, не повний дамп', !!preview && /Епізоди: 2/.test(previewText) && /Діагнози: 2/.test(previewText) && /Алергії: 1/.test(previewText) && /Ліки: 1/.test(previewText) && /ПІБ: є/.test(previewText) && !/Тестовий/.test(previewText) && !/Пеніцилін/.test(previewText) && !/J18/.test(previewText), previewText);
ok('Поля МІС і кнопки дій лишилися', page.w.document.getElementById('keep').value === 'не чіпати' && ['Зберегти', 'Підписати', 'Надіслати', 'Отримати доступ до медичних даних'].every(t => page.w.document.body.textContent.includes(t)));

const list = boot('<body><span data-test="patientFullName">Тестовий Пацієнт Іванович</span></body>', 'https://mis.h24.ua/new/profile/doctor/patients/list');
const listBtn = list.w.document.getElementById('h24po-btn');
ok('Список пацієнтів без кнопки, навіть якщо ПІБ уже в DOM', !listBtn || listBtn.hidden);

const css = read('tools/h24/h24-comfort.user.css');
const cssJs = read('tools/h24/h24-comfort.user.js');
const inner = (css.match(/@-moz-document[^{]*\{([\s\S]*)\}\s*$/) || [])[1].trim();
const innerJs = (cssJs.match(/var css = `([\s\S]*)`;\s*var el/) || [])[1].trim();
ok('Стиль Stylus і скрипт містять той самий CSS', !!inner && inner === innerJs, 'len ' + inner.length + '/' + innerJs.length);
ok('Стиль для домену mis.h24.ua, шрифт 15px, основні вкладки, зебра, липка шапка', /@-moz-document domain\("mis\.h24\.ua"\)/.test(css) && /font-size:\s*15px/.test(css) && /line-height:\s*1\.45/.test(css) && ['patient-summary', 'histories', 'diagnosis', 'documents', 'med-reports'].every(s => css.includes('/medical-card/' + s)) && /position:\s*sticky/.test(css) && /nth-child\(even\)/.test(css) && /min-height:\s*36px/.test(css));
ok('Стиль нічого не ховає', !/display\s*:\s*none/i.test(css) && !/visibility\s*:\s*hidden/i.test(css) && !/display\s*:\s*none/i.test(innerJs));
ok('Скрипти не містять запитів і програмних кліків', [script, cssJs].every(s => !/\bfetch\s*\(/.test(s) && !/XMLHttpRequest/.test(s) && !/sendBeacon/.test(s) && !/\.click\s*\(/.test(s) && !/\.submit\s*\(/.test(s) && !/GM_xmlhttpRequest/.test(s)));

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }
(async () => {
  const late = boot('<body><button type="button" class="appBtn">Зберегти</button><input id="keep" value="не чіпати"></body>', PATIENT);
  late.w.document.getElementById('h24po-btn').click();
  late.w.document.body.insertAdjacentHTML('beforeend', '<div class="patient-container"><div class="info-patient"><span data-test="patientFullName">Тестовий Пацієнт Іванович</span><span data-test="birthDate">21 квітня 1973</span><span data-test="gender">Ч.</span></div></div>');
  let lateJson = null;
  for (let i = 0; i < 20 && !lateJson; i++) { await sleep(50); try { lateJson = JSON.parse(late.bag.copied); } catch (e) {} }
  ok('Клік до завантаження SPA дочікується даних (до 5 с) і не чіпає «Зберегти»', lateJson && lateJson.patient.fullName === 'Тестовий Пацієнт Іванович' && late.w.document.getElementById('keep').value === 'не чіпати' && late.bag.clicks.every(s => s.startsWith('h24po-btn|')), late.bag.clicks.join('; '));

  const noCopy = boot(fixtureHtml, PATIENT, false);
  noCopy.w.navigator.clipboard = {writeText: () => Promise.reject(new Error('no'))};
  noCopy.w.document.getElementById('h24po-btn').click();
  await sleep(30);
  const ta = noCopy.w.document.querySelector('#h24po-preview textarea');
  ok('Якщо буфер недоступний — JSON лише в нашому полі, сторінка та сама', !!ta && /Тестовий Пацієнт/.test(ta.value) && noCopy.w.document.getElementById('keep').value === 'не чіпати' && noCopy.bag.nets === 0);

  const appPath = path.join(root, 'build', 'app.html');
  if (!fs.existsSync(appPath)) ok('Зібрана програма для імпорту', false, 'немає build/app.html — спершу node build.mjs');
  else {
    const errs = [];
    const d = new JSDOM(fs.readFileSync(appPath, 'utf8'), {url: 'https://x.test/', runScripts: 'dangerously', pretendToBeVisual: true, beforeParse(w) {
      try { w.localStorage.setItem('po.welcome', '1'); w.localStorage.setItem('po.autogate', '0'); } catch (e) {}
      w.scrollTo = () => {}; w.scrollBy = () => {}; w.print = () => {};
      w.Element.prototype.scrollIntoView = () => {};
      w.addEventListener('error', e => errs.push(String(e.message || e)));
    }});
    const w = d.window, doc = w.document;
    await sleep(700);
    const skip = [...doc.querySelectorAll('button')].find(b => /Пропустити/.test(b.textContent || ''));
    if (skip) skip.click();
    ok('У програмі є «Імпорт з H24»', !!doc.querySelector('[data-h24-import]'));
    w.navigator.clipboard = {readText: () => Promise.reject(new Error('denied')), writeText: () => Promise.resolve()};
    doc.querySelector('[data-h24-import]').click();
    await sleep(40);
    const paste = doc.getElementById('h24ImportPaste');
    ok('Без доступу до буфера — поле для вставки', !!paste && !!doc.getElementById('h24ImportDlg'));
    paste.value = 'не json';
    [...doc.querySelectorAll('#h24ImportDlg button')].find(b => b.textContent === 'Перевірити').click();
    ok('Поганий текст не створює пацієнта', /не JSON|не дані/.test(doc.getElementById('h24ImportDlg').textContent) && doc.getElementById('meta_pib').value === '');
    paste.value = JSON.stringify(data);
    [...doc.querySelectorAll('#h24ImportDlg button')].find(b => b.textContent === 'Перевірити').click();
    const shown = doc.getElementById('h24ImportDlg').textContent;
    ok('Підтвердження показує, що буде заповнено', /Тестовий Пацієнт Іванович/.test(shown) && /J18\.1/.test(shown) && /Часткова пневмонія/.test(shown) && /Пеніцилін/.test(shown) && /Буде створено нового пацієнта/.test(shown), shown.slice(0, 400));
    [...doc.querySelectorAll('#h24ImportDlg button')].find(b => b.textContent === 'Скасувати').click();
    ok('Скасування нічого не записує', !doc.getElementById('h24ImportDlg') && doc.getElementById('meta_pib').value === '');
    doc.querySelector('[data-h24-import]').click();
    await sleep(20);
    doc.getElementById('h24ImportPaste').value = JSON.stringify(data);
    [...doc.querySelectorAll('#h24ImportDlg button')].find(b => b.textContent === 'Перевірити').click();
    [...doc.querySelectorAll('#h24ImportDlg button')].find(b => b.textContent === 'Заповнити').click();
    await sleep(50);
    const alg = doc.getElementById('vitae_alerg');
    ok('Картку заповнено: ПІБ, дата, стать, діагноз, МКХ, алергія, ліки',
      doc.getElementById('meta_pib').value === 'Тестовий Пацієнт Іванович'
      && doc.getElementById('meta_dob').value === '1973-04-21'
      && w.eval('sex') === 'm'
      && doc.getElementById('dx_osn').value === 'Часткова пневмонія'
      && doc.getElementById('dx_mkh').value === 'J18.1'
      && doc.getElementById('dx_supd').value === 'Гіпертонічна хвороба (I10)'
      && alg.options[alg.selectedIndex].textContent === 'Алергологічний анамнез обтяжений'
      && /Пеніцилін/.test(doc.getElementById('vitae_alergx').value)
      && /Сальбутамол/.test(doc.getElementById('vitae_vx').value),
      [doc.getElementById('meta_pib').value, doc.getElementById('meta_dob').value, w.eval('sex'), doc.getElementById('dx_osn').value, doc.getElementById('dx_mkh').value, alg.options[alg.selectedIndex].textContent].join(' | '));
    ok('Пацієнта збережено', w.eval('Object.values(loadStore()).filter(p=>p.name==="Тестовий Пацієнт Іванович").length') === 1);
    const other = JSON.parse(JSON.stringify(data));
    other.diagnoses = [{code:'I10', name:'Гіпертонічна хвороба', role:'Основний'}];
    other.allergies = [];
    other.medications = [];
    w.navigator.clipboard = {readText: () => Promise.resolve(JSON.stringify(other)), writeText: () => Promise.resolve()};
    doc.querySelector('[data-h24-import]').click();
    await sleep(30);
    const again = doc.getElementById('h24ImportDlg').textContent;
    ok('Повторний імпорт того самого пацієнта не обіцяє замінити діагноз', /вже є/.test(again) && /не замінюємо/.test(again), again.slice(0, 500));
    [...doc.querySelectorAll('#h24ImportDlg button')].find(b => b.textContent === 'Заповнити').click();
    await sleep(30);
    ok('Наявний діагноз лишився, дубля картки немає', doc.getElementById('dx_osn').value === 'Часткова пневмонія' && doc.getElementById('dx_mkh').value === 'J18.1' && w.eval('Object.keys(loadStore()).length') === 1, doc.getElementById('dx_osn').value);
    ok('Імпорт не лишив помилок JavaScript', errs.length === 0, errs.slice(0, 3).join(' | '));
  }
  const bad = R.filter(l => l[0] === '❌').length;
  console.log(R.join('\n'));
  console.log(`\nH24: ${R.length - bad} з ${R.length}`);
  process.exit(bad ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
