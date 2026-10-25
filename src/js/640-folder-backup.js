/* ===== 0.9.3.55 — щоденні резервні копії в папці даних =====
   Папка «Пацієнти» — дзеркало: файл перезаписується при кожній зміні й видаляється разом із пацієнтом,
   тож історії там немає. Тут — окремі датовані копії всіх пацієнтів у «Резервні копії»:
   • «Копія_РРРР-ММ-ДД.json» — одна на день, оновлюється не частіше ніж раз на 30 хв; зберігаються останні 30 днів;
   • якщо пацієнтів стало менше, ніж уже записано сьогодні, денна копія НЕ перезаписується —
     пишеться окремий файл із часом («Копія_РРРР-ММ-ДД_ГГ-ХХ.json»), щоб випадкове стирання не знищило копію;
   • «Копія_… перед оновленням X → Y.json» — перед кожним оновленням версії (останні 5).
   З PIN-шифруванням файли шифруються тим самим PIN (обгортка fsWriteFile у 605-pin.js).
   Відновлення — наявне «Перевірити файл копії…» у «Резервні копії й відновлення». */
const FBK = { sub:'Резервні копії', days:30, upd:5, every:30 * 60 * 1000, busy:false, err:'', pending:null };
function fbkState(){ try{ return JSON.parse(localStorage.getItem('po.fbk') || '{}') || {}; }catch(e){ return {}; } }
/* ORIG_SET — без повторного запуску синхронізації папки (190-data-folder.js) */
function fbkSave(s){ try{ ORIG_SET.call(localStorage, 'po.fbk', JSON.stringify(s)); }catch(e){} }
function fbkDay(d){ d = d || new Date(); return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); }
const FBK_RE = /^Копія_(\d{4}-\d{2}-\d{2})(.*)\.json$/;
async function fbkFiles(bd){ const L = []; for await (const [n, hh] of bd.entries()) if (hh.kind === 'file' && FBK_RE.test(n)) L.push(n); return L.sort(); }
async function fbkPrune(bd){
  const L = await fbkFiles(bd), upd = L.filter(n=>/перед оновленням/.test(n)), daily = L.filter(n=>!/перед оновленням/.test(n));
  const days = [...new Set(daily.map(n=>n.match(FBK_RE)[1]))].sort().reverse(), keep = new Set(days.slice(0, FBK.days));
  const del = [...daily.filter(n=>!keep.has(n.match(FBK_RE)[1])), ...upd.slice(0, Math.max(0, upd.length - FBK.upd))];
  for (const n of del){ try{ await bd.removeEntry(n); }catch(e){} }
  return L.length - del.length;
}
/* why: 'auto' | 'manual' | 'upd:<підпис>' */
async function fbkWrite(why){
  if (!FS.dir || !FS.ok || FBK.busy) return null;
  if (typeof pinBlocked === 'function' && pinBlocked()) return null;
  const st = loadStore(), n = Object.keys(st).length; if (!n) return null;   /* порожнє сховище ніколи не записуємо як копію */
  const now = Date.now(), day = fbkDay(), S = fbkState(), upd = String(why).startsWith('upd:');
  if (why === 'auto' && S.day === day && now - (S.at || 0) < FBK.every) return null;
  FBK.busy = true;
  try{
    const bd = await FS.dir.getDirectoryHandle(FBK.sub, {create:true});
    let name = 'Копія_' + day + '.json';
    if (upd) name = 'Копія_' + day + ' перед оновленням ' + String(why).slice(4).replace(/[\\/:*?"<>|]+/g, ' ') + '.json';
    else if (S.day === day && (S.max || 0) > n){ const d = new Date(); name = 'Копія_' + day + '_' + pad(d.getHours()) + '-' + pad(d.getMinutes()) + '.json'; }
    await fsWriteFile(bd, name, JSON.stringify({type:'po-patients', app:VERSION, at:now, reason:upd ? 'перед оновленням ' + String(why).slice(4) : why === 'manual' ? 'вручну' : 'щоденна', items:st}));
    const files = await fbkPrune(bd);
    fbkSave({day, at:now, max:Math.max(S.day === day ? (S.max || 0) : 0, n), last:name, n, files});
    FBK.err = ''; try{ logAct('Резервна копія в папці', name); }catch(e){}
    return name;
  }catch(e){ FBK.err = 'Не вдалося записати копію в папку: ' + (e && e.message || e); if (e && e.name === 'NotAllowedError') FS.ok = false; return null; }
  finally{ FBK.busy = false; try{ fbkRender(); }catch(e){} }
}
/* після кожної синхронізації папки — денна копія (не частіше ніж раз на 30 хв) */
{ const x0 = fsSync; fsSync = async function(){ const r = await x0.apply(this, arguments);
  try{ if (FBK.pending && await fbkWrite(FBK.pending)) FBK.pending = null; await fbkWrite('auto'); }catch(e){} return r; }; }
/* перед оновленням версії — і в браузері (604), і в папці */
{ const x0 = bakPut; bakPut = async function(reason){ const r = await x0.apply(this, arguments);
  const m = /^перед оновленням (.+)$/.exec(String(reason || ''));
  /* папка може ще не мати дозволу на старті — тоді копія перед оновленням запишеться при першій синхронізації */
  if (m){ try{ if (!await fbkWrite('upd:' + m[1])) FBK.pending = 'upd:' + m[1]; }catch(e){} } return r; }; }

/* «Резервні копії й відновлення» — стан копій у папці */
function fbkRender(){
  const box = document.getElementById('fbkBox'); if (!box) return;
  box.replaceChildren();
  if (!FS.dir){ box.append(h('p', {class:'chips-hint'}, 'Підключіть папку даних — тоді копія всіх пацієнтів за кожен день зберігатиметься в ній автоматично (останні ' + FBK.days + ' днів), окремо від браузера.')); return; }
  const S = fbkState();
  box.append(h('p', {class:'chips-hint'}, S.at
    ? `Остання копія: ${new Date(S.at).toLocaleString('uk-UA')} — «${S.last}» (пацієнтів: ${S.n}). У папці «${FBK.sub}»: ${S.files || 1} файл(ів), зберігаються останні ${FBK.days} днів і ${FBK.upd} копій перед оновленням.`
    : `Копій у папці ще немає — перша з’явиться після найближчого збереження пацієнта.`),
    h('p', {class:'chips-hint'}, 'Відновити: «Перевірити файл копії…» вище → виберіть файл у папці «' + FS.dir.name + '» → «' + FBK.sub + '».'));
  if (FBK.err) box.append(h('p', {class:'warnbox'}, FBK.err));
  if (!FS.ok){ box.append(h('p', {class:'warnbox'}, 'Браузер ще не підтвердив доступ до папки — копії не пишуться. Натисніть «Дозволити» в рядку папки даних.')); return; }
  box.append(h('div', {class:'acts2'}, h('button', {type:'button', class:'btn', onclick:async ()=>{ const r = await fbkWrite('manual'); toast(r ? 'Копію записано: ' + r : (FBK.err || 'Немає пацієнтів або програма заблокована PIN'), 3500); }}, 'Копія в папку зараз')));
}
{ const x0 = drawBak; drawBak = async function(){ const r = await x0.apply(this, arguments);
  if (bakBox && !bakBox.querySelector('#fbkBox')){ bakBox.append(h('h4', {}, 'Копії в папці даних (щодня, окремо від браузера)'), h('div', {id:'fbkBox'})); }
  fbkRender(); return r; }; }
{ const x0 = fsRender; fsRender = function(){ const r = x0.apply(this, arguments); try{ fbkRender(); }catch(e){} return r; }; }
try{ drawBak(); }catch(e){}
