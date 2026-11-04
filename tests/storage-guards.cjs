// Регресії В1–В10: папка, PIN, імпорт, два вікна, кошик, службовий сценарій, чужий HTML, обрив запису.
const {JSDOM} = require('jsdom'); const fs = require('fs'); const path = require('path');
const html = fs.readFileSync(path.join(__dirname, '..', 'build', 'app.html'), 'utf8');
const sw = fs.readFileSync(path.join(__dirname, '..', 'sw.js'), 'utf8');
const later = f => setTimeout(f, 0);
const prob = []; const ok = (c, m) => { if (!c) prob.push(m); };
const wait = ms => new Promise(r => setTimeout(r, ms));
const until = async (f, ms = 4000) => { const t = Date.now(); while (Date.now() - t < ms){ try{ if (await f()) return true; }catch(e){} await wait(20); } return false; };

function makeIDB(DBS){
  const req = () => ({result: undefined, error: null, onsuccess: null, onerror: null, onupgradeneeded: null});
  const fire = (r, ev, e) => { if (typeof r[ev] === 'function') r[ev](e || {target: r}); };
  function db(name){
    const stores = DBS.get(name);
    return {
      objectStoreNames: {contains: n => stores.has(n)}, close(){},
      createObjectStore(n){ if (!stores.has(n)) stores.set(n, new Map()); return {}; },
      transaction(){
        let pending = 0, done = false; const tx = {oncomplete: null, onerror: null, onabort: null, error: null};
        const start = () => { pending++; }, end = () => { if (--pending === 0) later(() => { if (pending === 0 && !done){ done = true; if (tx.oncomplete) tx.oncomplete({target: tx}); } }); };
        const op = fn => { const r = req(); start(); later(() => { try{ r.result = fn(); fire(r, 'onsuccess'); }catch(e){ r.error = e; fire(r, 'onerror'); } end(); }); return r; };
        tx.objectStore = n => { const m = stores.get(n); if (!m) throw new Error('no store ' + n); return {
          put: (v, k) => op(() => { m.set(String(k), structuredClone(v)); return k; }),
          get: k => op(() => m.has(String(k)) ? structuredClone(m.get(String(k))) : undefined),
          delete: k => op(() => { m.delete(String(k)); }),
          openCursor(){ const r = req(), keys = [...m.keys()].sort(); let i = 0; start();
            const step = () => later(() => { if (i < keys.length){ const k = keys[i++]; r.result = {key: k, value: structuredClone(m.get(k)), continue: step}; fire(r, 'onsuccess', {target: r}); }
              else { r.result = null; fire(r, 'onsuccess', {target: r}); end(); } });
            step(); return r; }
        }; };
        start(); later(end); return tx;
      }
    };
  }
  return { open(name){ const r = req(); later(() => { const fresh = !DBS.has(name); if (fresh) DBS.set(name, new Map()); r.result = db(name); if (fresh) fire(r, 'onupgradeneeded'); fire(r, 'onsuccess'); }); return r; },
    deleteDatabase(name){ const r = req(); later(() => { DBS.delete(name); fire(r, 'onsuccess'); }); return r; } };
}
function boot(DBS, ls){
  const errs = [];
  const d = new JSDOM(html, {url: 'https://x.test/', runScripts: 'dangerously', pretendToBeVisual: true, beforeParse(w){
    try{ w.localStorage.setItem('po.welcome', '1'); w.localStorage.setItem('po.profask', '1'); w.localStorage.setItem('po.autogate', '0'); w.localStorage.setItem('po.prof', JSON.stringify({p:'ter', w:'hosp'})); }catch(e){}
    if (ls) ls.forEach(([k, v]) => w.localStorage.setItem(k, v));
    w.indexedDB = makeIDB(DBS); w.TextEncoder = TextEncoder; w.TextDecoder = TextDecoder;
    if (!w.crypto || !w.crypto.subtle) Object.defineProperty(w, 'crypto', {value: require('node:crypto').webcrypto, configurable: true});
    w.Element.prototype.scrollIntoView = () => {}; w.scrollBy = () => {}; w.scrollTo = () => {}; w.document.execCommand = () => true;
    w.addEventListener('error', e => errs.push(e.message));
  }});
  d.window.__errs = errs;
  return d.window;
}
function makeDir(){
  const nest = new Map();
  function dir(label){
    if (nest.has(label)) return nest.get(label);
    const files = new Map(); const log = [];
    const d = {
      name: label.split('/').pop(), files, log, hold: null, held: false, failClose: false,
      async getDirectoryHandle(n){ return dir(label + '/' + n); },
      async getFileHandle(n, o){
        if (!files.has(n)){ if (!(o && o.create)){ const err = new Error('немає'); err.name = 'NotFoundError'; throw err; } files.set(n, ''); }
        const handle = { name: n,
          async getFile(){ return {text: async () => files.get(handle.name)}; },
          async createWritable(){ log.push(handle.name); let buf = '';
            return { async write(data){ buf = typeof data === 'string' ? data : String(data); },
              async close(){ if (d.hold && handle.name.endsWith('.writing') && !d.held){ d.held = true; await d.hold; } if (d.failClose && handle.name.endsWith('.writing')) throw new Error('обрив'); files.set(handle.name, buf); },
              async abort(){} }; },
          async move(nn){ const body = files.get(handle.name); files.delete(handle.name); handle.name = nn; files.set(nn, body); }
        };
        return handle;
      },
      async removeEntry(n){ files.delete(n); },
      async *entries(){ for (const n of [...files.keys()]) yield [n, {kind:'file'}]; }
    };
    nest.set(label, d); return d;
  }
  return dir('root');
}
function patients(DBS){
  const db = DBS.get('po-db'); const st = db && db.get('patients'); return st ? [...st.entries()] : [];
}

(async () => {
  // В7 — текст службового сценарію: помилка сервера не замінює збережену сторінку; чужі шрифти не тягнемо
  ok(/if \(res\.ok\)/.test(sw) && /caches\.match\(r\)\.then\(m => m \|\| res\)/.test(sw), 'В7: невдала відповідь мережі має віддавати кеш');
  ok(!/fonts\.googleapis/.test(sw) && !/fonts\.gstatic/.test(sw), 'В7: службовий сценарій більше не ходить за чужими шрифтами');
  ok(/\.catch\(\(\) => caches\.match\(r\)/.test(sw), 'В7: обрив мережі лишає запасну копію');

  const DBS = new Map();
  let w = boot(DBS, [['po.trash', JSON.stringify({pghost:{name:'Привид', deleted:Date.now(), snap:{f:{}}}})]]);
  const dbOk = await until(() => { try{ return w.eval('IDB.ok'); }catch(e){ return false; } });
  ok(dbOk, 'база не відкрилась' + (w.__errs && w.__errs.length ? ': ' + w.__errs.slice(0, 3).join(' | ') : ''));
  ok(await until(() => w.localStorage.getItem('po.trash.mode') === 'idb'), 'В6: після бази кошик не лишається в localStorage');
  ok(!w.eval('TRASH.pghost'), 'В6: привид зі старого сховища не повернувся в кошик');

  // В8
  w.eval(`restore({v:1,f:{},c:{},sex:'',doc:'ohl',mode:'hosp',cache:{ohl:{html:'<img src=x onerror="window.__xss=1"><div data-sec="skarhy">Живий текст</div><script>window.__xss=2</script>',dirty:true}},diaries:[{html:'<img src=x onerror="window.__xss=3"><b>щоденник</b>'}]})`);
  const out = w.document.getElementById('out').innerHTML;
  ok(out.includes('Живий текст') && !/onerror|script/i.test(out) && !w.__xss, 'В8: чужий HTML у картці не виконується, звичайний текст лишається: ' + out.slice(0, 180));
  ok(w.eval("DIARIES[0] && !/onerror/i.test(DIARIES[0].html) && DIARIES[0].html.includes('щоденник')"), 'В8: щоденник у файлі теж очищено');

  // В4 — старіший файл не затирає новішу картку
  w.eval("document.getElementById('meta_pib').value='Новіший запис'; document.getElementById('meta_pib').dispatchEvent(new Event('input')); savePatient(true);");
  await wait(80);
  const id = w.eval('PID');
  ok(!!id, 'В4: пацієнта не створено');
  const older = {type:'po-patients', items:{[id]:{name:'Старіший запис', updated:1, card:'', dob:'', snap:{v:1, f:{meta_pib:'Старіший запис'}}}}};
  w.importFile(new w.File([JSON.stringify(older)], 'old.json', {type:'application/json'}));
  ok(await until(() => w.document.querySelector('.packsheet button.btn.primary')), 'В4: немає вікна прийняття файлу');
  w.document.querySelector('.packsheet button.btn.primary').click();
  await wait(50);
  ok(w.loadStore()[id] && w.loadStore()[id].name === 'Новіший запис', 'В4: старіший файл затер новішу картку: ' + (w.loadStore()[id] && w.loadStore()[id].name));

  // В5 — друге вікно
  const id5 = id;
  const stamp = w.loadStore()[id5].updated;
  const DBS5 = DBS;
  try{ w.eval('clearTimeout(saveTimer)'); }catch(e){}
  const w2 = boot(DBS5);
  const IDB2 = () => w2.eval('IDB');
  ok(await until(() => { const I = IDB2(); return I && I.ok && w2.loadStore()[id5]; }), 'В5: друге вікно не побачило пацієнта');
  ok(await until(() => { const I = IDB2(); return I && I.seen && I.seen[id5] != null; }), 'В5: друге вікно не запам’ятало версію');
  w2.eval('openPatient(' + JSON.stringify(id5) + ')');
  w2.eval("(function(){ document.getElementById('meta_pib').value='З іншого вікна'; document.getElementById('meta_pib').dispatchEvent(new Event('input')); savePatient(true); })()");
  ok(await until(() => { const row = patients(DBS).find(([k]) => k === id5); return row && JSON.stringify(row[1]).includes('З іншого вікна'); }), 'В5: друге вікно не записало свою версію');
  w.eval("document.getElementById('meta_pib').value='Застаріле вікно'; document.getElementById('meta_pib').dispatchEvent(new Event('input')); savePatient(true);");
  await wait(200);
  const row5 = patients(DBS).find(([k]) => k === id5);
  ok(row5 && JSON.stringify(row5[1]).includes('З іншого вікна') && !JSON.stringify(row5[1]).includes('Застаріле вікно'), 'В5: старе вікно перезаписало новіший запис');
  ok(stamp <= (w2.loadStore()[id5] && w2.loadStore()[id5].updated), 'В5: позначка часу другого вікна');

  // В2 — PIN, видалення під час шифрування
  const key = await w.crypto.subtle.generateKey({name:'AES-GCM', length:256}, false, ['encrypt', 'decrypt']);
  const pin = w.eval('PINC'); const IDB = w.eval('IDB'); const FS = w.eval('FS');
  pin.key = key; pin.cfg = {v:1, salt:'aa', iter:1, iv:'bb', w:'cc'};
  w.eval("newPatient(); document.getElementById('meta_pib').value='Має зникнути'; document.getElementById('meta_pib').dispatchEvent(new Event('input')); savePatient(true);");
  const id2 = w.eval('PID');
  w.delPatient(id2);
  await wait(400);
  const back = patients(DBS).find(([k]) => k === id2);
  ok(!back, 'В2: видалений пацієнт повернувся після відкладеного шифрування');

  // В9 — обрив запису не стирає попередній файл
  const d9 = makeDir();
  d9.files.set('a.json', 'СТАРЕ');
  d9.failClose = true;
  let threw = false; try{ await w.fsWriteFile(d9, 'a.json', 'НОВЕ'); }catch(e){ threw = true; }
  ok(threw && d9.files.get('a.json') === 'СТАРЕ', 'В9: обрив запису стер попередній файл: ' + d9.files.get('a.json'));
  d9.failClose = false;
  await w.fsWriteFile(d9, 'a.json', 'НОВЕ');
  ok(d9.files.get('a.json') === 'НОВЕ' && !d9.files.has('a.json.writing'), 'В9: після успіху файл замінений цілком, чернетки немає');
  ok(d9.log[0] && d9.log[0].endsWith('.writing'), 'В9: перший запис іде в чернетку, не в сам файл: ' + d9.log.join(','));

  // В1, В3, В10 — папка
  const root = makeDir();
  const pd = await root.getDirectoryHandle('Пацієнти');
  pd.files.set('Тест_p99.json', '{"name":"ВІДКРИТИЙ ТЕКСТ"}');
  FS.dir = root; FS.ok = true; FS.busy = false; FS.written = {}; FS.again = false;
  IDB.cache.p99 = {name:'Тест', updated:50, card:'', dob:'', snap:{v:1, f:{meta_pib:'Тест'}}};
  IDB.w.p99 = 50;
  const day = new Date(); const today = day.getFullYear() + '-' + String(day.getMonth()+1).padStart(2,'0') + '-' + String(day.getDate()).padStart(2,'0');
  w.localStorage.setItem('po.fbk', JSON.stringify({day:today, at:Date.now(), max:5}));
  w.localStorage.setItem('po.backup', '1');
  await w.fsSync(true);
  const names = [...pd.files.keys()];
  const enc = names.filter(n => n.endsWith('_p99.json'));
  ok(enc.length === 1 && enc[0] === 'Пацієнт_p99.json', 'В1: у папці має лишитись лише зашифрований файл, а є: ' + names.join(', '));
  ok(String(pd.files.get('Пацієнт_p99.json')).includes('po-enc-file') && !String(pd.files.get('Пацієнт_p99.json')).includes('ВІДКРИТИЙ ТЕКСТ'), 'В1: файл пацієнта не зашифровано');
  ok(w.localStorage.getItem('po.backup') === '1', 'В10: дзеркало папки погасило нагадування без справжньої копії');
  const manual = await w.fbkWrite('manual');
  ok(!!manual && w.localStorage.getItem('po.backup') !== '1', 'В10: денна копія не позначила свіжу резервну копію: ' + manual);

  // В3 — запис, що прийшов під час зайнятої синхронізації, не губиться
  let release; root.hold = new Promise(r => { release = r; });
  const kids = await root.getDirectoryHandle('Пацієнти');
  kids.hold = root.hold; kids.held = false;
  IDB.cache.p99.name = 'Альфа'; IDB.cache.p99.updated = 60; FS.written = {};
  const syncing = w.fsSync(true);
  ok(await until(() => FS.busy), 'В3: синхронізація не почалась');
  IDB.cache.p99.name = 'Бета'; IDB.cache.p99.updated = 70;
  const queued = w.fsSync(true);
  release();
  await syncing; await queued; await wait(30);
  const body = kids.files.get('Пацієнт_p99.json') || '';
  let plain = body; try{ const o = JSON.parse(body); if (o && o.data && pin.key) plain = JSON.stringify(await w.decObj(o.data)); }catch(e){}
  ok(plain.includes('Бета'), 'В3: останній запис під час синхронізації загубився: ' + plain.slice(0, 160));

  w.close(); w2.close();
  if (prob.length){ prob.forEach(p => console.log('❌ ' + p)); console.log(prob.length + ' проблем'); process.exit(1); }
  console.log('OK: захист збереження В1–В10');
})().catch(e => { console.log('❌ ' + (e && e.stack || e)); process.exit(1); });
