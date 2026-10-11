/* ================= ПАПКА ДАНИХ НА КОМП’ЮТЕРІ =================
   Chrome / Edge на комп’ютері (File System Access API). У вибраній папці створюється «Первинний огляд — дані»:
   Пацієнти/*.json — кожен пацієнт окремим файлом; Шаблони.json — свої шаблони, формулювання, заготовки; Налаштування.json — лікар, заклад, профіль.
   Браузер лишається основним сховищем, папка — постійна копія, що оновлюється сама. */
const FS_DIR = 'Первинний огляд — дані', FS_SET_KEYS = ['po.doc','po.spec','po.hospdef','po.theme','po.mode','po.quick','po.zlogo','po.zlogomode','po.paper','po.f110'];
const FS = {dir:null, ok:false, busy:false, timer:null, written:{}, err:''};
const fsSupported = () => { let top = true; try{ top = window.top === window.self; }catch(e){ top = false; } return top && typeof window.showDirectoryPicker === 'function'; };
function fsIdb(mode, fn){
  return new Promise((res, rej)=>{ const r = indexedDB.open('po-fs', 1); r.onupgradeneeded = ()=>r.result.createObjectStore('h');
    r.onsuccess = ()=>{ const tx = r.result.transaction('h', mode), st = tx.objectStore('h'), q = fn(st); tx.oncomplete = ()=>res(q && q.result); tx.onerror = ()=>rej(tx.error); }; r.onerror = ()=>rej(r.error); });
}
const fsName = (id, p) => String((p && p.name) || 'Без імені').replace(/[\\/:*?"<>|]+/g, ' ').replace(/\s+/g, '_').slice(0, 60) + '_' + id + '.json';
async function fsWriteFile(dir, name, data){ const fh = await dir.getFileHandle(name, {create:true}); const w = await fh.createWritable(); await w.write(data); await w.close(); }
async function fsReadJSON(dir, name){ try{ const fh = await dir.getFileHandle(name); return JSON.parse(await (await fh.getFile()).text()); }catch(e){ return null; } }
function fsLocal(keys){ const o = {}; keys.forEach(k=>{ try{ const v = localStorage.getItem(k); if (v !== null) o[k] = v; }catch(e){} }); return o; }
async function fsSync(all){
  if (!FS.dir || !FS.ok || FS.busy) return; FS.busy = true;
  try{
    const pd = await FS.dir.getDirectoryHandle('Пацієнти', {create:true});
    const st = loadStore(), files = {};
    for await (const [n] of pd.entries()){ const m = n.match(/_(p\d+)\.json$/); if (m) files[m[1]] = n; }
    for (const id in st){
      const nm = fsName(id, st[id]);
      if (!all && FS.written[id] === st[id].updated && files[id] === nm) continue;
      await fsWriteFile(pd, nm, JSON.stringify({type:'po-patients', items:{[id]: st[id]}}, null, 1));
      if (files[id] && files[id] !== nm){ try{ await pd.removeEntry(files[id]); }catch(e){} }
      FS.written[id] = st[id].updated;
    }
    await fsWriteFile(FS.dir, 'Шаблони.json', JSON.stringify({type:'po-templates', saved:new Date().toISOString(), data:fsLocal(['po.custom'])}, null, 1));
    await fsWriteFile(FS.dir, 'Налаштування.json', JSON.stringify({type:'po-settings', saved:new Date().toISOString(), data:fsLocal(FS_SET_KEYS)}, null, 1));
    FS.err = ''; FS.last = Date.now();
    try{ ORIG_SET.call(localStorage, 'po.backup', String(Date.now())); }catch(e){}
  }catch(e){ FS.err = 'Не вдалося записати в папку: ' + (e && e.message || e); if (e && e.name === 'NotAllowedError') FS.ok = false; }
  FS.busy = false; fsRender();
}
function fsSchedule(all){ if (!FS.dir || !FS.ok) return; clearTimeout(FS.timer); FS.timer = setTimeout(()=>fsSync(all), 1500); }
const ORIG_SET = Storage.prototype.setItem;
Storage.prototype.setItem = function(k, v){ ORIG_SET.call(this, k, v); if (this === window.localStorage && /^po\./.test(k) && k !== 'po.last' && k !== 'po.backup') fsSchedule(false); };
async function fsDelete(id){
  if (!FS.dir || !FS.ok) return;
  try{ const pd = await FS.dir.getDirectoryHandle('Пацієнти', {create:true}); for await (const [n] of pd.entries()) if (n.endsWith('_' + id + '.json')) await pd.removeEntry(n); delete FS.written[id]; }catch(e){}
}
/* завантаження з папки: пацієнти — новіший запис перемагає; шаблони й налаштування — з папки (replace) або лише відсутні (fill) */
async function fsLoad(how){
  const pd = await FS.dir.getDirectoryHandle('Пацієнти', {create:true});
  const st = loadStore(); let n = 0;
  for await (const [nm, fh] of pd.entries()){
    if (!/\.json$/.test(nm) || fh.kind !== 'file') continue;
    try{ const o = JSON.parse(await (await fh.getFile()).text()); if (!o || o.type !== 'po-patients') continue;
      for (const id in o.items){ const it = o.items[id]; if (it && it.snap && it.snap.f && (!st[id] || (it.updated || 0) > (st[id].updated || 0))){ st[id] = it; n++; } } }catch(e){}
  }
  if (n) saveStore(st);
  let changed = false;
  for (const f of ['Шаблони.json', 'Налаштування.json']){
    const o = await fsReadJSON(FS.dir, f); if (!o || !o.data) continue;
    for (const k in o.data){ let cur = null; try{ cur = localStorage.getItem(k); }catch(e){}
      if (how === 'replace' ? cur !== o.data[k] : cur === null){ try{ ORIG_SET.call(localStorage, k, o.data[k]); changed = true; }catch(e){} } }
  }
  return {n, changed};
}
async function fsPick(){
  if (!fsSupported()){ toast('Папка даних працює в Chrome або Edge на комп’ютері, у файлі програми (не в цьому вікні попереднього перегляду)', 6000); return; }
  let parent; try{ parent = await window.showDirectoryPicker({id:'po-data', mode:'readwrite', startIn:'documents'}); }catch(e){ return; }
  try{
    FS.dir = parent.name === FS_DIR ? parent : await parent.getDirectoryHandle(FS_DIR, {create:true}); FS.ok = true;
    await fsIdb('readwrite', st=>st.put(FS.dir, 'dir'));
    const r = await fsLoad('fill'); await fsSync(true);
    toast('Папку підключено: «' + FS_DIR + '»' + (r.n ? `. Додано пацієнтів з папки: ${r.n}` : ''), 4000);
    if (r.changed) setTimeout(()=>location.reload(), 1200); else { renderPatients(); fsRender(); }
  }catch(e){ FS.err = 'Не вдалося створити папку: ' + (e && e.message || e); fsRender(); }
}
async function fsReconnect(){
  if (!FS.dir) return fsPick();
  try{ if (await FS.dir.requestPermission({mode:'readwrite'}) === 'granted'){ FS.ok = true; const r = await fsLoad('fill'); await fsSync(true); renderPatients(); toast('Папку даних підключено' + (r.n ? `, оновлено пацієнтів: ${r.n}` : '')); if (r.changed) setTimeout(()=>location.reload(), 1200); } }catch(e){}
  fsRender();
}
async function fsLoadAll(btn){
  if (!FS.dir || !FS.ok) return;
  if (!btn.dataset.arm){ btn.dataset.arm = '1'; const t = btn.textContent; btn.textContent = 'Замінити шаблони й налаштування з папки?'; setTimeout(()=>{ delete btn.dataset.arm; btn.textContent = t; }, 4000); return; }
  delete btn.dataset.arm;
  const r = await fsLoad('replace'); toast(`З папки: пацієнтів оновлено ${r.n}` + (r.changed ? '; шаблони й налаштування застосовано' : ''), 3000);
  if (r.changed) setTimeout(()=>location.reload(), 1200); else renderPatients();
}
async function fsForget(){ FS.dir = null; FS.ok = false; try{ await fsIdb('readwrite', st=>st.delete('dir')); }catch(e){} fsRender(); toast('Папку від’єднано. Файли в ній залишились.'); }
async function fsInit(){
  if (!fsSupported()) { fsRender(); return; }
  try{ FS.dir = await fsIdb('readonly', st=>st.get('dir')) || null; }catch(e){ FS.dir = null; }
  if (FS.dir){ try{ FS.ok = await FS.dir.queryPermission({mode:'readwrite'}) === 'granted'; }catch(e){ FS.ok = false; } if (FS.ok){ await fsLoad('fill').then(r=>{ if (r.n) renderPatients(); }).catch(()=>{}); fsSchedule(true); } }
  fsRender();
}
function fsRender(){
  document.querySelectorAll('.fsbox').forEach(box=>{
    box.innerHTML = '';
    const compact = box.dataset.compact === '1';
    if (!fsSupported()){ if (!compact) box.append(h('p', {class:'chips-hint'}, 'Папка даних доступна в Chrome або Edge на комп’ютері, коли програма відкрита як файл чи з сайту. На телефоні й у цьому вікні — лише «Резервна копія».')); return; }
    if (!FS.dir){ if (compact) return;
      box.append(h('p', {class:'chips-hint'}, `Оберіть, де створити папку «${FS_DIR}» (наприклад, «Документи»). Туди автоматично зберігатимуться пацієнти (кожен окремим файлом), ваші шаблони й налаштування. Якщо така папка вже є — оберіть її, і дані підтягнуться.`),
        h('div', {class:'acts2'}, h('button', {type:'button', class:'btn primary', onclick:fsPick}, 'Створити / обрати папку даних'))); return; }
    if (!FS.ok){
      box.append(h('div', {class:'warnbox'}, h('span', {}, `Папка «${FS.dir.name}»: браузер просить підтвердити доступ після перезапуску.`), h('button', {type:'button', class:'btn primary', onclick:fsReconnect}, 'Підключити папку'))); return; }
    if (compact){ box.append(h('p', {class:'chips-hint'}, `Папка даних: «${FS.dir.name}» — зберігається автоматично` + (FS.last ? ', ' + new Date(FS.last).toLocaleTimeString('uk-UA', {hour:'2-digit', minute:'2-digit'}) : ''))); return; }
    box.append(h('p', {class:'chips-hint'}, `Підключено: «${FS.dir.name}». Пацієнти (папка «Пацієнти»), «Шаблони.json» і «Налаштування.json» оновлюються автоматично` + (FS.last ? ` · останнє збереження ${new Date(FS.last).toLocaleTimeString('uk-UA', {hour:'2-digit', minute:'2-digit'})}` : '') + '.'),
      FS.err ? h('p', {class:'warn', style:'display:block'}, FS.err) : '',
      h('div', {class:'acts2'}, h('button', {type:'button', class:'btn', onclick:()=>fsSync(true).then(()=>toast('Усе записано в папку'))}, 'Записати зараз'),
        h('button', {type:'button', class:'btn', onclick:e=>fsLoadAll(e.currentTarget)}, 'Завантажити з папки'),
        h('button', {type:'button', class:'btn', onclick:fsPick}, 'Інша папка'), h('button', {type:'button', class:'btn', onclick:fsForget}, 'Від’єднати')));
  });
}

