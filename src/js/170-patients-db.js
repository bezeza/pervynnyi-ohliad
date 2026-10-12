/* ================= БАЗА ПАЦІЄНТІВ (у цьому браузері) ================= */
const PKEY = 'po.patients';
let PID = null, DIARIES = [], RESTORING = false, saveTimer = null;
/* Сховище пацієнтів: IndexedDB (без ліміту ~5 МБ, десятки тисяч пацієнтів); якщо браузер його не дає — localStorage, як раніше.
   Робота синхронна через кеш у пам’яті; запис у базу — у фоні, лише змінених пацієнтів (за полем updated). */
const IDB = {db:null, ok:false, cache:null, w:{}};
let TRASH = {};   // кошик: видалені пацієнти (30 днів), у базі з ключем 'trash:<id>'
function loadStore(){
  if (IDB.ok && IDB.cache) return Object.assign({}, IDB.cache);
  try{ return JSON.parse(localStorage.getItem(PKEY) || '{}') || {}; }catch(e){ return {}; }
}
function saveStore(st){
  if (!IDB.ok){ try{ localStorage.setItem(PKEY, JSON.stringify(st)); return true; }catch(e){ return false; } }
  IDB.cache = Object.assign({}, st);
  try{
    const tx = IDB.db.transaction('patients', 'readwrite'), os = tx.objectStore('patients');
    for (const id in st){ const u = st[id] && st[id].updated; if (IDB.w[id] !== u || u === undefined){ os.put(st[id], id); IDB.w[id] = u; } }
    for (const id in IDB.w){ if (!(id in st)){ os.delete(id); delete IDB.w[id]; } }
    tx.onerror = () => toast('Не вдалося зберегти пацієнта в сховище браузера: ' + (tx.error && tx.error.message || ''), 6000);
  }catch(e){ toast('Помилка сховища: ' + (e && e.message || e), 6000); return false; }
  if (typeof fsSchedule === 'function') fsSchedule(false);   // папка даних на комп’ютері
  return true;
}
function idbInit(){
  if (!window.indexedDB) return Promise.resolve(false);
  return new Promise(res=>{
    let r; try{ r = indexedDB.open('po-db', 1); }catch(e){ res(false); return; }
    r.onupgradeneeded = () => { r.result.createObjectStore('patients'); };
    r.onerror = () => res(false);
    r.onsuccess = () => {
      const db = r.result, all = {}, tx = db.transaction('patients', 'readonly'), cur = tx.objectStore('patients').openCursor();
      cur.onsuccess = e => { const c = e.target.result; if (c){ if (String(c.key).startsWith('trash:')) TRASH[String(c.key).slice(6)] = c.value; else all[c.key] = c.value; c.continue(); } };
      tx.oncomplete = () => {
        IDB.db = db; IDB.cache = all; Object.keys(all).forEach(id=>{ IDB.w[id] = all[id].updated; }); IDB.ok = true;
        // перенесення зі старого сховища (і все, що встигли зберегти до готовності бази) — новіша версія перемагає
        let old = {}; try{ old = JSON.parse(localStorage.getItem(PKEY) || '{}') || {}; }catch(e){}
        const ids = Object.keys(old);
        if (ids.length){ const st = loadStore(); ids.forEach(id=>{ if (!st[id] || (old[id].updated || 0) > (st[id].updated || 0)) st[id] = old[id]; }); saveStore(st);
          const tx2 = db.transaction('patients', 'readonly'), cnt = tx2.objectStore('patients').count();
          tx2.oncomplete = () => { if (cnt.result >= Object.keys(IDB.cache).length){ try{ localStorage.removeItem(PKEY); }catch(e){} } }; }
        res(true);
      };
      tx.onerror = () => res(false);
    };
  });
}

function snap(){
  const f = {}, c = {};
  document.querySelectorAll('#panels input[id], #panels select[id], #panels textarea[id]').forEach(e=>{
    if (e.type === 'search' || e.type === 'file') return;
    f[e.id] = e.type === 'checkbox' ? e.checked : e.value;
  });
  document.querySelectorAll('#panels .chip[id]').forEach(b=>{
    const on = b.getAttribute('aria-pressed') === 'true';
    if (on || b.dataset.off) c[b.id] = {p:on ? 1 : 0, o:+(b.dataset.ord || 0), a:b.dataset.auto ? 1 : 0, off:b.dataset.off ? 1 : 0};
  });
  const cache = Object.assign({}, CACHE, {[DOC]: {html: $('#out').innerHTML, dirty}});
  return {v:1, f, c, sex, curKey, doc:DOC, mode:MODE, cache, diaries:DIARIES, rx:RX, res:RES,
    auto:{vyd:!!F('hosp.vyd').autoSet, vyda:!!F('hosp.vyda').autoSet}};
}

function restore(S){
  RESTORING = true;
  clearAll(true);
  for (const id in S.f){
    const e = document.getElementById(id); if (!e) continue;
    if (id.startsWith('meta_') && DOC_KEYS.includes(id.slice(5))) continue;   // дані лікаря не чіпаємо
    if (e.type === 'checkbox') e.checked = !!S.f[id]; else e.value = S.f[id];
  }
  for (const id in S.c){
    const b = document.getElementById(id); if (!b) continue; const x = S.c[id];
    b.setAttribute('aria-pressed', x.p ? 'true' : 'false');
    if (x.o){ b.dataset.ord = x.o; ORD = Math.max(ORD, x.o); }
    if (x.a) b.dataset.auto = '1'; if (x.off) b.dataset.off = '1';
  }
  sex = S.sex || ''; curKey = S.curKey || null; MODE = S.mode || MODE; DOC = S.doc || 'ohl';
  CACHE = S.cache || {}; DIARIES = S.diaries || []; RX = S.rx || []; RES = S.res || []; RESN = RES.reduce((a,b)=>Math.max(a, b.id || 0), 0); RXN = RX.reduce((a,b)=>Math.max(a, b.id || 0), 0);
  F('hosp.vyd').autoSet = S.auto && S.auto.vyd; F('hosp.vyda').autoSet = S.auto && S.auto.vyda;
  document.querySelectorAll('#sexSeg button').forEach(x=>x.setAttribute('aria-pressed', x.dataset.sex === sex ? 'true' : 'false'));
  SECTIONS.forEach(sc=>sc.fields.forEach(f=>{ if (f.type === 'sel') mark(f.el, f); if (f.type === 'multi'){ refreshChips(f); refreshDet(f); } }));
  if (HV.cards) HV.cards.forEach((c,k)=>c.setAttribute('aria-pressed', PRESETS[k].key === curKey ? 'true' : 'false'));
  const recV = S.f.meta_rec;
  refreshLabels(); calcAge(); applyMode();
  const r = document.getElementById('meta_rec'); if (r && recV && [...r.options].some(o=>o.value === recV)) r.value = recV;
  const C = CACHE[DOC];
  if (C && C.dirty){ $('#out').innerHTML = C.html; dirty = true; } else update();
  RESTORING = false;
  renderDiaries(); renderRes(); renderPatients(); renderRx(); renderHvTips();
}

function patientName(){ return mv('pib'); }
function savePatient(silent){
  const name = patientName();
  if (!name && !PID){ if (!silent) toast('Вкажіть ПІБ пацієнта на вкладці «Запис»'); return false; }
  const st = loadStore(); if (!PID) PID = 'p' + Date.now();
  st[PID] = {name: name || 'Без імені', card: mv('card'), dob: mv('dob'), updated: Date.now(), snap: snap()};
  const ok = saveStore(st);
  if (!silent) toast(ok ? 'Пацієнта збережено' : 'Не вдалося зберегти: браузер заборонив сховище або воно переповнене', ok ? 1600 : 5000);
  renderPatients(); markSaved(ok);
  return ok;
}
function markSaved(ok){ const e = $('#saveState'); if (e) e.textContent = ok ? 'Збережено ' + new Date().toLocaleTimeString('uk-UA', {hour:'2-digit', minute:'2-digit'}) : 'Не збережено'; }
function autosave(){
  if (RESTORING) return;
  clearTimeout(saveTimer);
  saveTimer = setTimeout(()=>{ if (patientName() || PID) savePatient(true); }, 1200);
}
function openPatient(id){
  if (PID && (patientName() || PID)) savePatient(true);
  const st = loadStore(); if (!st[id]) return;
  PID = id; restore(st[id].snap); markSaved(true);
  toast('Відкрито: ' + st[id].name);
}
function newPatient(){
  if (PID || patientName()) savePatient(true);
  PID = null; DIARIES = []; clearAll(); renderDiaries(); renderPatients();
  const e = $('#saveState'); if (e) e.textContent = '';
  show(TABS.indexOf(META)); toast('Новий пацієнт');
}
function delPatient(id, btn){
  if (!btn.dataset.arm){ btn.dataset.arm = '1'; btn.textContent = 'Точно видалити?'; setTimeout(()=>{ delete btn.dataset.arm; btn.textContent = 'Видалити'; }, 3000); return; }
  const st = loadStore(); delete st[id]; saveStore(st); fsDelete(id);
  if (PID === id) PID = null;
  renderPatients(); toast('Пацієнта видалено з цього браузера');
}

async function downloadJSON(obj, name){
  const data = JSON.stringify(obj, null, 1);
  let framed = false; try{ framed = window.top !== window.self; }catch(e){ framed = true; }
  if (framed){
    // онлайн-версія: збереження через дозвіл Claude (з підтвердженням)
    let dl = null; try{ dl = window.claude && window.claude.use ? await window.claude.use('downloads') : null; }catch(e){}
    if (!dl){ toast('Тут збереження файлу недоступне. Скористайтеся збереженим файлом pervynnyi-ohliad.html.', 6000); return; }
    try{ await dl.save({filename: name, data}); toast('Файл збережено'); return true; }
    catch(e){
      const c = e && e.code;
      if (c === 'declined') toast('Збереження скасовано');
      else if (c === 'rate_limited') toast('Вікно збереження вже відкрите — завершіть його');
      else toast('Не вдалося зберегти файл тут. Скористайтеся збереженим файлом pervynnyi-ohliad.html.', 6000);
    }
    return;
  }
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([data], {type:'application/json'}));
  a.download = name; document.body.append(a); a.click(); a.remove();
  setTimeout(()=>URL.revokeObjectURL(a.href), 2000);
  return true;
}
function exportCurrent(){
  if (!savePatient(true)){ toast('Вкажіть ПІБ пацієнта'); return; }
  const st = loadStore(), p = st[PID];
  downloadJSON({type:'po-patients', items:{[PID]: p}}, (p.name || 'patient').replace(/[^\p{L}\d]+/gu, '_') + '.json');
}
function exportAll(){
  const st = loadStore(); if (!Object.keys(st).length){ toast('Збережених пацієнтів немає'); return; }
  const d = new Date(); downloadJSON({type:'po-patients', items:st}, `patsienty_${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}.json`)
    .then(ok=>{ if (ok){ try{ localStorage.setItem('po.backup', String(Date.now())); }catch(e){} renderToday(); } });
}
