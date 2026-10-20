// Збереження пацієнтів у IndexedDB і завантаження після перезапуску (jsdom не має IndexedDB — тут проста заміна в пам’яті,
// спільна для двох «запусків» сторінки). Перевіряє, що пацієнт не зникає після перезавантаження — з PIN і без.
const {JSDOM} = require('jsdom'); const fs = require('fs'); const path = require('path');
const html = fs.readFileSync(path.join(__dirname, '..', 'build', 'app.html'), 'utf8');
const DBS = new Map();   // ім'я бази → Map(сховище → Map(ключ → значення))
const later = f => setTimeout(f, 0);
function makeIDB(){
  const req = () => ({result: undefined, error: null, onsuccess: null, onerror: null, onupgradeneeded: null});
  const fire = (r, ev, e) => { if (typeof r[ev] === 'function') r[ev](e || {target: r}); };
  function db(name){
    const stores = DBS.get(name);
    return {
      objectStoreNames: {contains: n => stores.has(n)},
      createObjectStore(n){ if (!stores.has(n)) stores.set(n, new Map()); return {}; },
      close(){},
      transaction(names, mode){
        let pending = 0, done = false; const tx = {oncomplete: null, onerror: null, onabort: null, error: null};
        const start = () => { pending++; }, end = () => { if (--pending === 0) later(() => { if (pending === 0 && !done){ done = true; if (tx.oncomplete) tx.oncomplete({target: tx}); } }); };
        const op = fn => { const r = req(); start(); later(() => { try{ r.result = fn(); fire(r, 'onsuccess'); }catch(e){ r.error = e; fire(r, 'onerror'); } end(); }); return r; };
        tx.objectStore = n => { const m = stores.get(n); if (!m) throw new Error('no store ' + n); return {
          put: (v, k) => op(() => { m.set(String(k), structuredClone(v)); return k; }),
          add: (v, k) => op(() => { m.set(String(k), structuredClone(v)); return k; }),
          get: k => op(() => m.has(String(k)) ? structuredClone(m.get(String(k))) : undefined),
          delete: k => op(() => { m.delete(String(k)); }),
          clear: () => op(() => { m.clear(); }),
          count: () => op(() => m.size),
          getAll: () => op(() => [...m.values()].map(v => structuredClone(v))),
          getAllKeys: () => op(() => [...m.keys()]),
          openCursor(){ const r = req(), keys = [...m.keys()].sort(); let i = 0; start();
            const step = () => later(() => { if (i < keys.length){ const k = keys[i++]; r.result = {key: k, value: structuredClone(m.get(k)), continue: step}; fire(r, 'onsuccess', {target: r}); }
              else { r.result = null; fire(r, 'onsuccess', {target: r}); end(); } });
            step(); return r; }
        }; };
        // транзакція без жодного запиту теж завершується
        start(); later(end);
        return tx;
      }
    };
  }
  return {
    open(name){ const r = req(); later(() => { const fresh = !DBS.has(name); if (fresh) DBS.set(name, new Map()); r.result = db(name); if (fresh) fire(r, 'onupgradeneeded'); fire(r, 'onsuccess'); }); return r; },
    deleteDatabase(name){ const r = req(); later(() => { DBS.delete(name); fire(r, 'onsuccess'); }); return r; }
  };
}
const LS = new Map();   // localStorage теж переживає «перезапуск»
function boot(){
  const errs = [];
  const d = new JSDOM(html, {url: 'https://x.test/', runScripts: 'dangerously', pretendToBeVisual: true, beforeParse(w){
    for (const [k, v] of LS) w.localStorage.setItem(k, v);
    try{ w.localStorage.setItem('po.autogate', '0'); w.localStorage.setItem('po.welcome', '1'); }catch(e){}
    w.indexedDB = makeIDB(); w.TextEncoder = TextEncoder; w.TextDecoder = TextDecoder;
    if (!w.crypto || !w.crypto.subtle) Object.defineProperty(w, 'crypto', {value: require('node:crypto').webcrypto, configurable: true});
    w.Element.prototype.scrollIntoView = () => {}; w.scrollBy = () => {}; w.scrollTo = () => {}; w.document.execCommand = () => true;
    w.console.error = (...a) => errs.push('CE ' + a.join(' ')); w.addEventListener('error', e => errs.push('E ' + e.message));
  }});
  return {d, w: d.window, errs};
}
const keepLS = w => { LS.clear(); for (let i = 0; i < w.localStorage.length; i++){ const k = w.localStorage.key(i); LS.set(k, w.localStorage.getItem(k)); } };
const wait = ms => new Promise(r => setTimeout(r, ms));
const until = async (f, ms = 4000) => { const t = Date.now(); while (Date.now() - t < ms){ try{ if (f()) return true; }catch(e){} await wait(30); } return false; };
const prob = []; const ok = (c, m) => { if (!c) prob.push(m); };
(async () => {
  // 1. без PIN: створити пацієнта → «перезапуск» → пацієнт на місці
  let {d, w, errs} = boot();
  ok(await until(() => w.eval('IDB.ok')), 'база не відкрилась');
  w.eval("document.getElementById('meta_pib').value='Тест Перший'; document.getElementById('meta_pib').dispatchEvent(new Event('input')); savePatient(true);");
  await wait(200);
  ok(w.eval('Object.keys(loadStore()).length') === 1, 'пацієнт не збережений у першому запуску');
  ok([...(DBS.get('po-db') || new Map()).get('patients') || []].length === 1, 'пацієнта немає в базі');
  await until(() => w.localStorage.getItem('po.last'), 3000);
  keepLS(w); w.close();
  ({d, w, errs} = boot());
  ok(await until(() => w.eval('IDB.ok')), 'база не відкрилась після перезапуску');
  await wait(300);
  ok(w.eval('Object.keys(loadStore()).length') === 1, 'після перезапуску (без PIN) пацієнтів: ' + w.eval('Object.keys(loadStore()).length') + ' замість 1');
  await until(() => w.eval("document.getElementById('meta_pib').value"), 2000);
  ok(w.eval("document.getElementById('meta_pib').value") === 'Тест Перший', 'після перезапуску не відкрився останній пацієнт: «' + w.eval("document.getElementById('meta_pib').value") + '»');
  // 2. увімкнути PIN → дані шифруються → перезапуск → PIN → пацієнт на місці
  if (w.eval("typeof pinRewriteAll === 'function' && typeof pinWrap === 'function'")){
    const on = await w.eval(`(async()=>{ const raw = crypto.getRandomValues(new Uint8Array(32)), cfg = await pinWrap('4826', raw), key = await pinUnwrap('4826', cfg);
      if (!await pinRewriteAll(key)) return 'rewrite false'; PINC.key = key; PINC.cfg = cfg; localStorage.setItem('po.pin', JSON.stringify(cfg)); return true; })()`).catch(e => 'ERR ' + e.message);
    ok(on === true, 'PIN не ввімкнувся: ' + on);
    await wait(300);
    const raw = [...DBS.get('po-db').get('patients').values()][0];
    ok(raw && raw.enc === 1 && !JSON.stringify(raw).includes('Тест Перший'), 'з PIN запис у базі не зашифрований');
    keepLS(w); w.close();
    ({d, w, errs} = boot());
    ok(await until(() => w.document.querySelector('.pinscr input')), 'немає екрана PIN після перезапуску');
    ok(!w.eval('IDB.ok'), 'база відкрилась без PIN');
    const inp = w.document.querySelector('.pinscr input'); inp.value = '4826';
    const b = [...w.document.querySelectorAll('.pinscr button')].find(x => /Відкрити|Увійти|OK|ОК/i.test(x.textContent)) || w.document.querySelector('.pinscr button');
    if (b) b.click(); else inp.dispatchEvent(new w.KeyboardEvent('keydown', {key: 'Enter', bubbles: true}));
    ok(await until(() => w.eval('IDB.ok'), 6000), 'після PIN база не відкрилась');
    await wait(300);
    ok(w.eval('Object.keys(loadStore()).length') === 1, 'з PIN після перезапуску пацієнтів: ' + w.eval('Object.keys(loadStore()).length'));
    ok(w.eval("Object.values(loadStore())[0].name") === 'Тест Перший', 'з PIN ім’я не розшифрувалось');
  } else prob.push('немає функцій PIN (605-pin.js)');
  const e2 = errs.filter(x => !/Not implemented/.test(x)); if (e2.length) prob.push('помилки: ' + e2.slice(0, 3).join(' | '));
  w.close();
  if (prob.length){ prob.forEach(p => console.log('❌ ' + p)); console.log(prob.length + ' проблем'); process.exit(1); }
  console.log('OK: збереження й завантаження пацієнтів після перезапуску (без PIN і з PIN)'); process.exit(0);
})().catch(e => { console.log('❌ ' + e.stack); process.exit(1); });
