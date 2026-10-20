/* ===== Перевірене відновлення (0.9.3.16): копія перед кожним оновленням версії, внутрішні копії (останні 5),
   «Перевірити копію» (що в файлі — без змін у даних), самоперевірка «зберегти → відновити → порівняти»,
   відновлення з попереднім переглядом, попередня версія програми. ===== */
const BAKN = 5;
function bakOpen(){ return new Promise(res=>{ if (!window.indexedDB) return res(null); let r; try{ r = indexedDB.open('po-bak', 1); }catch(e){ return res(null); }
  r.onupgradeneeded = () => { try{ r.result.createObjectStore('bak'); }catch(e){} }; r.onsuccess = () => res(r.result); r.onerror = () => res(null); }); }
const bakTx = (db, mode, fn) => new Promise(res=>{ try{ const tx = db.transaction('bak', mode), os = tx.objectStore('bak'); const out = fn(os); tx.oncomplete = () => res(out && out.result !== undefined ? out.result : true); tx.onerror = () => res(null); }catch(e){ res(null); } });
async function bakList(){ const db = await bakOpen(); if (!db) return []; const all = await bakTx(db, 'readonly', os=>os.getAll()); return (all || []).map(({at, ver, reason, n})=>({at, ver, reason, n})).sort((a, b)=>b.at - a.at); }
async function bakGet(at){ const db = await bakOpen(); if (!db) return null; return bakTx(db, 'readonly', os=>os.get('b' + at)); }
async function bakPut(reason){
  const st = loadStore(), n = Object.keys(st).length; if (!n) return null;
  const db = await bakOpen(); if (!db) return null;
  const at = Date.now(), rec = {at, ver:VERSION, reason, n, data:JSON.stringify({type:'po-patients', app:VERSION, at, items:st})};
  await bakTx(db, 'readwrite', os=>os.put(rec, 'b' + at));
  const L = await bakList(); if (L.length > BAKN){ await bakTx(db, 'readwrite', os=>{ L.slice(BAKN).forEach(b=>os.delete('b' + b.at)); }); }
  try{ logAct('Резервна копія в браузері', reason); }catch(e){}
  return rec;
}
/* перевірка вмісту копії — нічого не змінює */
function bakReport(o){
  const R = {ok:false, err:[], n:0, diaries:0, res:0, rx:0, app:'', at:0, newest:0, names:[]};
  if (!o || typeof o !== 'object'){ R.err.push('файл не прочитано як JSON'); return R; }
  if (o.type !== 'po-patients' && o.type !== 'po-transfer'){ R.err.push('це не файл пацієнтів цієї програми'); return R; }
  if (!o.items || typeof o.items !== 'object'){ R.err.push('у файлі немає пацієнтів'); return R; }
  R.app = o.app || ''; R.at = o.at || 0;
  for (const id in o.items){ const p = o.items[id];
    if (!p || !p.snap || !p.snap.f){ R.err.push(`запис ${id}: немає даних огляду`); continue; }
    R.n++; R.diaries += (p.snap.diaries || []).length; R.res += (p.snap.res || []).length; R.rx += (p.snap.rx || []).length; R.newest = Math.max(R.newest, p.updated || 0); }
  R.ok = R.n > 0 && !R.err.length; return R;
}
/* самоперевірка: усіх пацієнтів зберегти у JSON, прочитати назад і порівняти до символу */
function bakSelfTest(){
  const st = loadStore(), ids = Object.keys(st);
  const back = JSON.parse(JSON.stringify({type:'po-patients', app:VERSION, at:Date.now(), items:st}));
  const bad = ids.filter(id=>JSON.stringify(back.items[id]) !== JSON.stringify(st[id]));
  const rep = bakReport(back);
  return {n:ids.length, bad, rep};
}
function bakReportBox(R, title){
  const d = R.at ? new Date(R.at).toLocaleString('uk-UA') : '';
  return h('div', {class:'bakrep ' + (R.ok ? 'ok' : 'bad')}, h('b', {}, (R.ok ? '✓ ' : '⚠ ') + title),
    h('div', {}, `Пацієнтів: ${R.n} · записів щоденника: ${R.diaries} · аналізів: ${R.res} · призначень: ${R.rx}`),
    d || R.app ? h('div', {class:'chips-hint'}, [d ? 'копію зроблено ' + d : '', R.app ? 'версією ' + R.app : '', R.newest ? 'найсвіжіша зміна ' + new Date(R.newest).toLocaleDateString('uk-UA') : ''].filter(Boolean).join(' · ')) : '',
    R.err.length ? h('ul', {}, ...R.err.slice(0, 8).map(e=>h('li', {}, e))) : '');
}
/* відновлення з попереднім переглядом */
function restoreFromObj(o, src){
  const R = bakReport(o); const st = loadStore();
  const ids = R.ok ? Object.keys(o.items).filter(id=>o.items[id] && o.items[id].snap) : [];
  const add = ids.filter(id=>!st[id]), newer = ids.filter(id=>st[id] && (o.items[id].updated || 0) > (st[id].updated || 0)), older = ids.filter(id=>st[id] && (o.items[id].updated || 0) <= (st[id].updated || 0));
  const dlg = h('div', {class:'navsheet packsheet', role:'dialog', 'aria-modal':'true', 'aria-label':'Відновлення'},
    h('div', {class:'nvbox'}, h('div', {class:'nshead'}, h('b', {}, 'Відновити з копії'), h('button', {type:'button', class:'btn', onclick:()=>dlg.remove()}, 'Закрити ✕')),
      bakReportBox(R, src),
      R.ok ? h('p', {}, `Нових пацієнтів: ${add.length}. У копії новіші версії: ${newer.length}. У вас новіші (не чіпаю): ${older.length}.`) : '',
      R.ok ? h('div', {class:'acts2'},
        h('button', {type:'button', class:'btn primary', onclick:async ()=>{ await bakPut('перед відновленням з копії'); const s2 = loadStore(); [...add, ...newer].forEach(id=>{ s2[id] = o.items[id]; }); saveStore(s2); renderPatients(); dlg.remove(); toast(`Відновлено: ${add.length + newer.length}. Поточні дані перед цим збережено копією`, 4500); try{ logAct('Відновлення з копії', `${add.length + newer.length} пацієнтів`); }catch(e){} }}, 'Додати нових і оновити старіші'),
        h('button', {type:'button', class:'btn danger', onclick:async e=>{ const b = e.currentTarget; if (!b.dataset.arm){ b.dataset.arm = '1'; b.textContent = 'Точно? Поточні дані буде замінено копією'; setTimeout(()=>{ delete b.dataset.arm; b.textContent = 'Замінити все копією'; }, 4000); return; }
          await bakPut('перед повною заміною копією'); const s2 = {}; ids.forEach(id=>{ s2[id] = o.items[id]; }); saveStore(s2); PID = null; newPatient(); renderPatients(); dlg.remove(); toast('Дані замінено копією. Попередні — у внутрішніх копіях (Налаштування)', 5000); try{ logAct('Повна заміна даних копією', ids.length + ' пацієнтів'); }catch(e){} }}, 'Замінити все копією')) : '',
      h('p', {class:'chips-hint'}, 'Перед будь-яким відновленням програма сама робить копію поточних даних — її видно в «Налаштування → Резервні копії».')));
  document.body.append(dlg);
}
function checkBackupFile(file, thenRestore){
  const rd = new FileReader();
  rd.onload = () => { let o = null; try{ o = JSON.parse(rd.result); }catch(e){}
    if (thenRestore){ restoreFromObj(o, 'Файл: ' + file.name); return; }
    const R = bakReport(o);
    const dlg = h('div', {class:'navsheet packsheet', role:'dialog', 'aria-modal':'true', 'aria-label':'Перевірка копії'},
      h('div', {class:'nvbox'}, h('div', {class:'nshead'}, h('b', {}, 'Перевірка копії'), h('button', {type:'button', class:'btn', onclick:()=>dlg.remove()}, 'Закрити ✕')),
        bakReportBox(R, 'Файл: ' + file.name), h('p', {class:'chips-hint'}, 'Перевірка нічого не змінює у ваших даних.'),
        R.ok ? h('div', {class:'acts2'}, h('button', {type:'button', class:'btn', onclick:()=>{ dlg.remove(); restoreFromObj(o, 'Файл: ' + file.name); }}, 'Відновити з цієї копії…')) : ''));
    document.body.append(dlg); try{ logAct('Перевірка файлу копії', R.ok ? `${R.n} пацієнтів` : 'помилки'); }catch(e){} };
  rd.readAsText(file);
}
/* у файл копії — версія програми й час */
{ const dj = downloadJSON; downloadJSON = function(obj){ if (obj && obj.type === 'po-patients'){ if (!obj.app) obj.app = VERSION; if (!obj.at) obj.at = Date.now(); } return dj.apply(this, arguments); }; }
/* копія перед кожним оновленням версії (коли база вже відкрилась) */
(function waitDb(k){ if (!IDB.ok && k < 40) return setTimeout(()=>waitDb(k + 1), 150);
  const last = lsGet('po.lastver', '');
  if (last !== VERSION){ (last ? bakPut('перед оновленням ' + last + ' → ' + VERSION) : Promise.resolve()).then(()=>{ lsSet('po.lastver', VERSION); try{ drawBak(); }catch(e){} }); }
})(0);
/* Налаштування: «Резервні копії й відновлення» */
let bakBox = null;
async function drawBak(){
  if (!bakBox) return; bakBox.innerHTML = '';
  const L = await bakList(), file = h('input', {type:'file', accept:'.json,application/json', hidden:'', onchange:e=>{ if (e.target.files[0]) checkBackupFile(e.target.files[0], false); e.target.value = ''; }});
  bakBox.append(h('div', {class:'acts2'},
    h('button', {type:'button', class:'btn primary', onclick:()=>exportAll()}, 'Зберегти копію у файл'),
    h('button', {type:'button', class:'btn', onclick:()=>file.click()}, 'Перевірити файл копії…'), file,
    h('button', {type:'button', class:'btn', onclick:async ()=>{ const r = await bakPut('вручну'); toast(r ? 'Копію в браузері зроблено' : 'Немає пацієнтів або браузер не дав сховище'); drawBak(); }}, 'Копія в браузері зараз'),
    h('button', {type:'button', class:'btn', onclick:()=>{ const t = bakSelfTest(); const box = h('div', {}, bakReportBox(t.rep, t.bad.length ? `Самоперевірка: ${t.bad.length} записів відрізняються!` : `Самоперевірка: ${t.n} пацієнтів зберігаються й відновлюються без втрат`));
      bakBox.querySelector('.bakself').replaceChildren(box); try{ logAct('Самоперевірка відновлення', t.bad.length ? 'розбіжності' : 'без втрат'); }catch(e){} }}, 'Самоперевірка відновлення')));
  bakBox.append(h('div', {class:'bakself'}));
  bakBox.append(h('h4', {}, 'Копії в браузері (останні ' + BAKN + ', сама робиться перед кожним оновленням версії)'));
  if (!L.length) bakBox.append(h('p', {class:'chips-hint'}, 'Копій ще немає.'));
  L.forEach(b=>bakBox.append(h('div', {class:'prow'}, h('div', {class:'pn'}, h('b', {}, new Date(b.at).toLocaleString('uk-UA')), h('span', {}, `${b.reason} · пацієнтів: ${b.n} · версія ${b.ver}`)),
    h('span', {class:'acts2'},
      h('button', {type:'button', class:'more', onclick:async ()=>{ const r = await bakGet(b.at); let o = null; try{ o = JSON.parse(r.data); }catch(e){} restoreFromObj(o, 'Копія від ' + new Date(b.at).toLocaleString('uk-UA')); }}, 'Відновити…'),
      h('button', {type:'button', class:'more', onclick:async ()=>{ const r = await bakGet(b.at); let o = null; try{ o = JSON.parse(r.data); }catch(e){} if (o){ const d = new Date(b.at); downloadJSON(o, `kopiya_${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}.json`); } }}, 'У файл')))));
  if (location.protocol !== 'file:') bakBox.append(h('p', {class:'chips-hint'}, 'Нова версія працює неправильно? ', h('a', {href:'pervynnyi-ohliad-prev.html', target:'_blank', rel:'noopener'}, 'Відкрити попередню версію програми'), ' — дані ті самі, бо зберігаються в браузері.'));
}
if (SETTINGS_EL){ bakBox = h('div', {class:'bakbox'}); SETTINGS_EL.append(h('h3', {class:'sub'}, 'Резервні копії й відновлення'), bakBox); drawBak(); }
