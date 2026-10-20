/* ===== PIN-код і шифрування даних пацієнтів (0.9.3.17) =====
   Записи пацієнтів, кошик, копії в браузері й файли в папці даних шифруються AES-GCM 256 (WebCrypto).
   Ключ даних випадковий; він зберігається лише загорнутим ключем, виведеним із PIN (PBKDF2-SHA-256, 310 000 ітерацій).
   Без PIN дані не прочитати навіть із копії профілю браузера. Забутий PIN не відновлюється — лише з незашифрованої копії. */
const PIN_ITER = 310000;
const PINC = {key:null, cfg:(()=>{ try{ return JSON.parse(localStorage.getItem('po.pin') || 'null'); }catch(e){ return null; } })(), tries:0, until:0};
const pb64 = u => { let s = ''; const a = new Uint8Array(u); for (let i = 0; i < a.length; i++) s += String.fromCharCode(a[i]); return btoa(s); };
const pub64 = s => Uint8Array.from(atob(s), c=>c.charCodeAt(0));
const pte = {encode:s=>new TextEncoder().encode(s)}, ptd = {decode:b=>new TextDecoder().decode(b)};   // ліниво: у старих оточеннях TextEncoder може не бути
const pinOn = () => !!PINC.cfg;
function pinBlocked(){ return !!PINC.cfg && !PINC.key; }
const pinCan = () => !!(window.crypto && crypto.subtle && window.indexedDB);
async function pinKEK(pin, salt, iter){
  const base = await crypto.subtle.importKey('raw', pte.encode(pin), 'PBKDF2', false, ['deriveKey']);
  return crypto.subtle.deriveKey({name:'PBKDF2', salt, iterations:iter, hash:'SHA-256'}, base, {name:'AES-GCM', length:256}, false, ['encrypt', 'decrypt']);
}
/* загорнути випадковий ключ даних PIN-кодом */
async function pinWrap(pin, raw){
  const salt = crypto.getRandomValues(new Uint8Array(16)), iv = crypto.getRandomValues(new Uint8Array(12));
  const kek = await pinKEK(pin, salt, PIN_ITER), w = await crypto.subtle.encrypt({name:'AES-GCM', iv}, kek, raw);
  return {v:1, salt:pb64(salt), iter:PIN_ITER, iv:pb64(iv), w:pb64(w)};
}
async function pinUnwrap(pin, cfg){
  const kek = await pinKEK(pin, pub64(cfg.salt), cfg.iter || PIN_ITER);
  const raw = await crypto.subtle.decrypt({name:'AES-GCM', iv:pub64(cfg.iv)}, kek, pub64(cfg.w));   // неправильний PIN — виняток
  return crypto.subtle.importKey('raw', raw, {name:'AES-GCM'}, false, ['encrypt', 'decrypt']);
}
async function encObj(o, key){ const iv = crypto.getRandomValues(new Uint8Array(12)); const ct = await crypto.subtle.encrypt({name:'AES-GCM', iv}, key || PINC.key, pte.encode(JSON.stringify(o))); return {enc:1, iv:pb64(iv), ct:pb64(ct)}; }
async function decObj(e, key){ if (!e || !e.enc) return e; const pt = await crypto.subtle.decrypt({name:'AES-GCM', iv:pub64(e.iv)}, key || PINC.key, pub64(e.ct)); return JSON.parse(ptd.decode(pt)); }
/* запис у базу — зашифровано; пише лише найсвіжіший стан запису */
const PIN_Q = {};
idbPutVal = function(os, id, v){
  if (!PINC.key){ os.put(v, id); return; }
  const n = (PIN_Q[id] || 0) + 1; PIN_Q[id] = n;
  encObj(v).then(e=>{ if (PIN_Q[id] !== n || !IDB.db) return; try{ IDB.db.transaction('patients', 'readwrite').objectStore('patients').put(e, id); }catch(x){} });
};
/* відкриття: якщо дані зашифровано — спершу PIN */
function pinUnlockAll(all, trash){
  const enc = Object.values(all).some(v=>v && v.enc) || Object.values(trash).some(v=>v && v.enc);
  if (!PINC.cfg && !enc) return Promise.resolve({A:all, T:trash});
  return new Promise(res=>{
    pinScreen('open', async key=>{
      const A = {}, T = {};
      for (const k in all){ try{ A[k] = await decObj(all[k], key); }catch(e){} }
      for (const k in trash){ try{ T[k] = await decObj(trash[k], key); }catch(e){} }
      res({A, T});
    });
  });
}
/* екран PIN: при відкритті й після простою */
function pinScreen(mode, onKey){
  document.querySelectorAll('.pinscr').forEach(x=>x.remove());
  const inp = h('input', {type:'password', inputmode:'numeric', autocomplete:'off', 'aria-label':'PIN-код', placeholder:'PIN'}), msg = h('p', {class:'chips-hint pinmsg'}, ' ');
  const go = async () => {
    if (Date.now() < PINC.until){ msg.textContent = `Зачекайте ${Math.ceil((PINC.until - Date.now()) / 1000)} с`; return; }
    if (!inp.value){ inp.focus(); return; }
    msg.textContent = 'Перевіряю…';
    try{ const key = await pinUnwrap(inp.value, PINC.cfg); PINC.key = key; PINC.tries = 0; scr.remove(); document.body.classList.remove('pinlocked'); try{ logAct('PIN введено', mode === 'open' ? 'відкриття' : 'після простою'); }catch(e){} onKey(key); }
    catch(e){ PINC.tries++; inp.value = ''; inp.focus(); if (PINC.tries >= 5){ PINC.until = Date.now() + 30000; PINC.tries = 0; msg.textContent = 'Неправильний PIN 5 разів — зачекайте 30 секунд'; } else msg.textContent = 'Неправильний PIN'; }
  };
  inp.addEventListener('keydown', e=>{ if (e.key === 'Enter') go(); });
  const scr = h('div', {class:'pinscr lockscr', role:'dialog', 'aria-modal':'true', 'aria-label':'Введіть PIN'},
    h('div', {class:'lockbox'}, h('div', {class:'lockic', 'aria-hidden':'true'}, '🔒'), h('b', {}, mode === 'open' ? 'Дані пацієнтів зашифровано' : 'Екран заблоковано'),
      h('p', {class:'chips-hint'}, 'Введіть PIN-код, щоб продовжити.'), inp, h('button', {type:'button', class:'btn primary', onclick:go}, 'Відкрити'), msg,
      h('button', {type:'button', class:'more', onclick:()=>pinForgot()}, 'Забули PIN?')));
  document.body.append(scr); document.body.classList.add('pinlocked'); setTimeout(()=>inp.focus(), 30);
}
function pinForgot(){
  const c = h('input', {placeholder:'впишіть СТЕРТИ', 'aria-label':'Підтвердження'});
  const dlg = h('div', {class:'navsheet packsheet', role:'dialog', 'aria-modal':'true', 'aria-label':'Забули PIN', style:'z-index:120'},
    h('div', {class:'nvbox'}, h('div', {class:'nshead'}, h('b', {}, 'Забули PIN?'), h('button', {type:'button', class:'btn', onclick:()=>dlg.remove()}, 'Закрити ✕')),
      h('p', {}, 'PIN не зберігається ніде, тому відновити його неможливо — так дані захищені навіть від того, хто скопіює браузер.'),
      h('p', {}, 'Що можна зробити: стерти зашифровані дані на цьому пристрої й відновити пацієнтів з незашифрованого файлу копії (якщо ви його зберігали) або почати з чистого аркуша.'),
      h('label', {class:'wl'}, 'Щоб стерти всі дані пацієнтів на цьому пристрої, впишіть слово СТЕРТИ', c),
      h('div', {class:'acts2', style:'margin-top:10px'}, h('button', {type:'button', class:'btn danger', onclick:async ()=>{
        if (c.value.trim().toUpperCase() !== 'СТЕРТИ'){ toast('Впишіть слово СТЕРТИ'); c.focus(); return; }
        await new Promise(r=>{ try{ const q = indexedDB.deleteDatabase('po-db'); q.onsuccess = q.onerror = q.onblocked = ()=>r(); }catch(e){ r(); } });
        await new Promise(r=>{ try{ const q = indexedDB.deleteDatabase('po-bak'); q.onsuccess = q.onerror = q.onblocked = ()=>r(); }catch(e){ r(); } });
        ['po.pin', PKEY, 'po.trash', 'po.last'].forEach(k=>{ try{ localStorage.removeItem(k); }catch(e){} });
        location.reload(); }}, 'Стерти дані пацієнтів'))));
  document.body.append(dlg);
}
/* переписати всю базу (кошик теж): зашифрувати новим ключем або розшифрувати (key = null) */
async function pinRewriteAll(key){
  if (!IDB.ok || !IDB.db) return false;
  const st = loadStore(), out = {};
  for (const id in st) out[id] = key ? await encObj(st[id], key) : st[id];
  const tr = {}; for (const id in TRASH) tr['trash:' + id] = key ? await encObj(TRASH[id], key) : TRASH[id];
  await new Promise((res, rej)=>{ const tx = IDB.db.transaction('patients', 'readwrite'), os = tx.objectStore('patients');
    for (const k in out) os.put(out[k], k); for (const k in tr) os.put(tr[k], k); tx.oncomplete = res; tx.onerror = () => rej(tx.error); });
  try{ localStorage.removeItem(PKEY); localStorage.removeItem('po.trash'); }catch(e){}
  /* копії в браузері — теж */
  try{ const db = await bakOpen(); if (db){ const all = await bakTx(db, 'readonly', os=>os.getAll()), keys = await bakTx(db, 'readonly', os=>os.getAllKeys());
    const conv = []; for (let i = 0; i < (all || []).length; i++){ const r = all[i]; let data = r.data; if (r.encData){ try{ data = JSON.stringify(await decObj(r.encData, PINC.key)); }catch(e){ continue; } }
      const nr = Object.assign({}, r); delete nr.data; delete nr.encData; if (key) nr.encData = await encObj(JSON.parse(data), key); else nr.data = data; conv.push([keys[i], nr]); }
    await bakTx(db, 'readwrite', os=>{ conv.forEach(([k, v])=>os.put(v, k)); }); } }catch(e){}
  if (typeof fsSchedule === 'function') fsSchedule(true);
  return true;
}
/* копії в браузері: шифрування */
{ const bp = bakPut; bakPut = async function(reason){
    if (!PINC.key) return bp.apply(this, arguments);
    const st = loadStore(), n = Object.keys(st).length; if (!n) return null; const db = await bakOpen(); if (!db) return null;
    const at = Date.now(), rec = {at, ver:VERSION, reason, n, encData:await encObj({type:'po-patients', app:VERSION, at, items:st})};
    await bakTx(db, 'readwrite', os=>os.put(rec, 'b' + at));
    const L = await bakList(); if (L.length > BAKN) await bakTx(db, 'readwrite', os=>{ L.slice(BAKN).forEach(b=>os.delete('b' + b.at)); });
    return rec; };
  const bg = bakGet; bakGet = async function(at){ const r = await bg.apply(this, arguments); if (r && r.encData && PINC.key){ try{ return Object.assign({}, r, {data:JSON.stringify(await decObj(r.encData))}); }catch(e){} } return r; }; }
/* папка даних: файли зашифровано й без ПІБ у назві */
{ const fw = fsWriteFile; fsWriteFile = async function(dir, name, data){
    if (PINC.key && typeof data === 'string' && /"type":\s*"po-patients"/.test(data.slice(0, 60))){
      const o = JSON.parse(data), id = Object.keys(o.items || {})[0] || 'x';
      return fw.call(this, dir, name.replace(/^.*_(p\d+\.json)$/, 'Пацієнт_$1'), JSON.stringify({type:'po-enc-file', app:VERSION, lock:PINC.cfg, data:await encObj(o)}));
    }
    return fw.apply(this, arguments); }; }
/* файл копії: при увімкненому PIN — зашифрований тим самим PIN (відкривається на будь-якому пристрої з PIN) */
{ const dj = downloadJSON; downloadJSON = async function(obj, name){
    if (PINC.key && obj && obj.type === 'po-patients' && !obj.plain) return dj.call(this, {type:'po-enc-file', app:VERSION, at:Date.now(), lock:PINC.cfg, data:await encObj(obj)}, name.replace(/\.json$/, '_zashyfrovano.json'));
    if (obj && obj.plain) delete obj.plain;
    return dj.apply(this, arguments); }; }
/* відкрити зашифрований файл: попросити PIN, яким його зашифровано */
function encFileOpen(o){ return new Promise(res=>{
  const inp = h('input', {type:'password', inputmode:'numeric', placeholder:'PIN файлу', 'aria-label':'PIN файлу'}), msg = h('p', {class:'chips-hint'}, ' ');
  const go = async () => { try{ const key = await pinUnwrap(inp.value, o.lock); const d = await decObj(o.data, key); dlg.remove(); res(d); }catch(e){ msg.textContent = 'Неправильний PIN'; inp.value = ''; inp.focus(); } };
  inp.addEventListener('keydown', e=>{ if (e.key === 'Enter') go(); });
  const dlg = h('div', {class:'navsheet packsheet', role:'dialog', 'aria-modal':'true', 'aria-label':'Зашифрований файл'},
    h('div', {class:'nvbox'}, h('div', {class:'nshead'}, h('b', {}, 'Файл зашифровано'), h('button', {type:'button', class:'btn', onclick:()=>{ dlg.remove(); res(null); }}, 'Скасувати ✕')),
      h('p', {}, 'Введіть PIN, яким було зашифровано цей файл.'), inp, h('div', {class:'acts2', style:'margin-top:8px'}, h('button', {type:'button', class:'btn primary', onclick:go}, 'Відкрити')), msg));
  document.body.append(dlg); setTimeout(()=>inp.focus(), 30); }); }
{ const asFile = o => new File([JSON.stringify(o)], 'copy.json', {type:'application/json'});
  const wrapImport = name => { const f0 = eval(name); return function(file, ...rest){ const self = this; const rd = new FileReader();
    rd.onload = async () => { let o = null; try{ o = JSON.parse(rd.result); }catch(e){}
      if (o && o.type === 'po-enc-file' && o.lock){ const d = await encFileOpen(o); if (d) f0.call(self, asFile(d), ...rest); return; }
      f0.call(self, file, ...rest); };
    rd.readAsText(file); }; };
  importFile = wrapImport('importFile'); checkBackupFile = wrapImport('checkBackupFile');
  { const fl = fsLoad; fsLoad = async function(){ const r = await fl.apply(this, arguments);
      if (PINC.key && FS.dir){ try{ const pd = await FS.dir.getDirectoryHandle('Пацієнти', {create:true}), st = loadStore(); let n = 0;
        for await (const [nm, fh] of pd.entries()){ if (!/\.json$/.test(nm) || fh.kind !== 'file') continue; try{ const o = JSON.parse(await (await fh.getFile()).text()); if (!o || o.type !== 'po-enc-file') continue;
          const d = await decObj(o.data); for (const id in d.items){ const it = d.items[id]; if (it && it.snap && (!st[id] || (it.updated || 0) > (st[id].updated || 0))){ st[id] = it; n++; } } }catch(e){} }
        if (n){ saveStore(st); r.n = (r.n || 0) + n; } }catch(e){} }
      return r; }; } }
/* блокування після простою — з PIN */
{ const ln = lockNow; lockNow = function(){ if (!PINC.cfg) return ln.apply(this, arguments); if (document.querySelector('.pinscr')) return; pinScreen('idle', ()=>{ LOCK.last = Date.now(); }); }; }
/* Налаштування */
let pinBox = null;
function drawPin(){
  if (!pinBox) return; pinBox.innerHTML = '';
  if (!pinCan()){ pinBox.append(h('p', {class:'chips-hint'}, 'У цьому браузері шифрування недоступне (потрібні WebCrypto й IndexedDB; відкрийте програму через https або як встановлений застосунок).')); return; }
  if (!PINC.cfg){
    pinBox.append(h('p', {}, 'Зараз дані пацієнтів зберігаються в браузері без шифрування. Увімкніть PIN-код — і без нього дані не прочитати навіть із копії профілю браузера.'),
      h('div', {class:'acts2'}, h('button', {type:'button', class:'btn primary', onclick:()=>pinSetDialog('on')}, 'Увімкнути PIN і шифрування')));
  } else {
    pinBox.append(h('p', {}, '🔒 Дані пацієнтів зашифровано (AES-256). PIN потрібен при відкритті програми й після простою.'),
      h('div', {class:'acts2'}, h('button', {type:'button', class:'btn', onclick:()=>pinSetDialog('change')}, 'Змінити PIN'), h('button', {type:'button', class:'btn', onclick:()=>lockNow()}, 'Заблокувати зараз'),
        h('button', {type:'button', class:'more', onclick:()=>pinSetDialog('off')}, 'Вимкнути шифрування')));
  }
}
function pinSetDialog(mode){
  const p0 = h('input', {type:'password', inputmode:'numeric', autocomplete:'off'}), p1 = h('input', {type:'password', inputmode:'numeric', autocomplete:'new-password'}), p2 = h('input', {type:'password', inputmode:'numeric', autocomplete:'new-password'});
  const ack = h('input', {type:'checkbox'}), msg = h('p', {class:'chips-hint'}, ' ');
  const T = {on:'Увімкнути PIN і шифрування', change:'Змінити PIN', off:'Вимкнути шифрування'}[mode];
  const run = async () => {
    try{
      if (mode !== 'on'){ await pinUnwrap(p0.value, PINC.cfg); }
      if (mode !== 'off'){ if (p1.value.length < 4){ msg.textContent = 'PIN — щонайменше 4 символи (краще 6 цифр)'; return; } if (p1.value !== p2.value){ msg.textContent = 'PIN не збігається'; return; } }
      if (mode === 'on' && !ack.checked){ msg.textContent = 'Підтвердьте, що розумієте: забутий PIN не відновлюється'; return; }
      msg.textContent = 'Зачекайте…';
      if (mode === 'on'){ const raw = crypto.getRandomValues(new Uint8Array(32)), cfg = await pinWrap(p1.value, raw);
        const key = await crypto.subtle.importKey('raw', raw, {name:'AES-GCM'}, false, ['encrypt', 'decrypt']);
        if (!await pinRewriteAll(key)){ msg.textContent = 'Сховище браузера ще не готове — спробуйте за кілька секунд'; return; }
        PINC.key = key; PINC.cfg = cfg; localStorage.setItem('po.pin', JSON.stringify(cfg)); toast('Шифрування увімкнено. Збережіть копію у файл — вона теж буде зашифрована цим PIN', 5000); logAct('PIN і шифрування увімкнено'); }
      if (mode === 'change'){ const raw = await (async ()=>{ const kek = await pinKEK(p0.value, pub64(PINC.cfg.salt), PINC.cfg.iter); return crypto.subtle.decrypt({name:'AES-GCM', iv:pub64(PINC.cfg.iv)}, kek, pub64(PINC.cfg.w)); })();
        const cfg = await pinWrap(p1.value, raw); PINC.cfg = cfg; localStorage.setItem('po.pin', JSON.stringify(cfg)); toast('PIN змінено'); logAct('PIN змінено'); }
      if (mode === 'off'){ if (!await pinRewriteAll(null)){ msg.textContent = 'Сховище не готове'; return; } PINC.cfg = null; PINC.key = null; localStorage.removeItem('po.pin'); toast('Шифрування вимкнено — дані знову зберігаються відкрито', 4000); logAct('PIN і шифрування вимкнено'); }
      dlg.remove(); drawPin();
    }catch(e){ msg.textContent = mode !== 'on' ? 'Неправильний поточний PIN' : 'Помилка: ' + (e && e.message || e); }
  };
  const row = (l, i) => h('label', {class:'wl'}, l, i);
  const dlg = h('div', {class:'navsheet packsheet', role:'dialog', 'aria-modal':'true', 'aria-label':T},
    h('div', {class:'nvbox'}, h('div', {class:'nshead'}, h('b', {}, T), h('button', {type:'button', class:'btn', onclick:()=>dlg.remove()}, 'Закрити ✕')),
      mode === 'on' ? h('div', {class:'aiwarn'}, 'Важливо: PIN ніде не зберігається. Якщо його забути, дані на цьому пристрої не відновити — лише з копії у файлі. Перед увімкненням ', h('button', {type:'button', class:'more', onclick:()=>downloadJSON(Object.assign({type:'po-patients', items:loadStore()}, {plain:true}), 'kopiya_pered_PIN.json')}, 'збережіть незашифровану копію'), ' і тримайте її в надійному місці.') : '',
      h('div', {class:'wgrid'}, mode !== 'on' ? row('Поточний PIN', p0) : '', mode !== 'off' ? row('Новий PIN', p1) : '', mode !== 'off' ? row('Ще раз', p2) : ''),
      mode === 'on' ? h('label', {class:'blk', style:'margin-top:8px'}, ack, ' Я розумію: забутий PIN не відновлюється') : '',
      h('div', {class:'acts2', style:'margin-top:10px'}, h('button', {type:'button', class:'btn primary', onclick:run}, T)), msg));
  document.body.append(dlg); setTimeout(()=>(mode === 'on' ? p1 : p0).focus(), 30);
}
if (SETTINGS_EL){ pinBox = h('div', {class:'pinbox'}); SETTINGS_EL.append(h('h3', {class:'sub'}, 'PIN-код і шифрування'), pinBox); drawPin(); }
{ const si = searchItems; searchItems = function(){ const L = si(); L.push({k:'Дія', t:'PIN-код і шифрування даних', go:()=>{ show(TABS.findIndex(t=>t.id === 'set')); setTimeout(()=>pinBox && pinBox.scrollIntoView({block:'center'}), 80); }}); return L; }; }
