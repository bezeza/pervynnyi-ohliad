/* ===== 0.9.3.52 — «Вносити на бланку»: клік по рядку бланка відкриває віконце з пунктами цього рядка =====
   Працює однаково в основному вікні й у виносному вікні (⧉, режим «Аркуш»).
   Віконце не має власних даних: кнопки й поля прив’язані до справжніх полів форми, тож збереження,
   відновлення пацієнта, «Скасувати» й текст документа працюють як завжди.
   Режим — «Налаштування» → «Клік по рядку бланка» або кнопка «✎ Вносити на бланку» над аркушем.
   Поточний запис щоденника в основному вікні має власне віконце (627) — його не чіпаємо. */
const PE = { box:null, w:null, idx:-1, undo:null, frame:0 };
let PE_MODE = 'here';
try{ PE_MODE = localStorage.getItem('po.paperedit') === 'form' ? 'form' : 'here'; }catch(e){}

/* рядок бланка → поля, які він друкує (порядок — як на бланку) */
const PE_ROWS = [
  /* титульний лист 003/о */
  [/^МЕДИЧНА КАРТА СТАЦІОНАРНОГО ХВОРОГО/, ['meta_card']],
  [/^Хворий/, ['meta_pib','meta_dt']],
  [/^1\. Дата госпіталізації/, ['meta_dt']],
  [/^3\. Прізвище/, ['meta_pib']],
  [/^4\. Дата народження/, ['meta_dob']],
  [/^6\.2\. Громадянство/, ['s066.grom']],
  [/^6\. Документ/, ['s066.docid']],
  [/^7\.1\. Поштовий/, ['meta_addr_zip']],
  [/^7\. Постійне місце/, ['meta_addr_np_t','meta_addr_np','meta_addr_hr','meta_addr_ra','meta_addr_ob','meta_addr_st','meta_addr_zip']],
  [/^8\. Місце роботи/, ['meta_work']],
  [/^9\. Ким направлений/, ['morbi.hosp','morbi.hospz','morbi.hospd','morbi.hospe']],
  [/^10\. Діагноз при госпіталізації/, ['dx.osn','dx.mkh']],
  [/^11\. Відділення/, ['meta_vcode','meta_vidd']],
  [/^13\. Госпіталізація/, ['hosp.vyd','s066.vil']],
  [/^15\. Група крові/, ['s066.krov','s066.rh','s066.rw']],
  [/^18\. Алергічні/, ['vitae.alerg','vitae.alergx']],
  [/^19\.1\./, ['s066.p30']],
  [/^19\. Госпіталізація/, ['s066.vp']],
  [/^20\. Дата виписки/, ['e_per.per','e_per.tvyp']],
  /* первинний огляд (п. 33–40) */
  [/^33\. Скарги/, ['skarhy']],
  [/^34\. Anamnesis morbi/, ['morbi']],
  [/^35\. Anamnesis vitae|^Перенесені захворювання/, ['vitae']],
  [/^Алергічні реакції/, ['vitae.alerg','vitae.alergx']],
  [/^36\. Об’єктивні дані|^Загальний стан/, ['zah.stan','zah.pol']],
  [/^Свідомість/, ['zah.svid']],
  [/^Харчування/, ['zah.harch','zah.stat']],
  [/^Зріст/, ['zah.hw']],
  [/^Шкіра/, ['shk.kol','shk.vol','shk.tur','shk.vys']],
  [/^Видимі слизові/, ['shk.kol','shk.zev']],
  [/^Варикозне/, ['shk.vena']],
  [/^Набряки/, ['shk.nab']],
  [/^Периф\. л\/в/, ['shk.lv']],
  [/^Щитоподібна/, ['shk.shch']],
  [/^Молочні залози/, ['zah.moloch']],
  [/^Кістково-суглобова/, ['zah.opora']],
  [/^Система органів дихання/, ['dyh.gk','dyh.chd']],
  [/^Перкуторно над легенями/, ['dyh.perk']],
  [/^Аускультативно:/, ['dyh.ausk']],
  [/^Хрипи/, ['dyh.hr']],
  [/^Температура тіла:/, ['zah.temp','dyh.chd']],
  [/^Серцево-судинна система/, ['ssc.chss','ssc.ps','ssc.psch']],
  [/^А\/Т/, ['ssc.ad','ssc.adl']],
  [/^Межі серця/, ['ssc.mezh']],
  [/^Тони серця/, ['ssc.tony','ssc.rytm','ssc.shum']],
  [/^Система травлення/, ['trav.yaz']],
  [/^Живіт:/, ['trav.zhyv','trav.zd','trav.perist','trav.pech','trav.sel','trav.hryzha']],
  [/^С-м подразнення очеревини/, ['trav.och','trav.symp']],
  [/^С-м Пастернацького/, ['sech.past']],
  [/^Сечовипускання/, ['sech.sv','sech.diur','sech.secha']],
  [/^Випорожнення/, ['trav.vyp','trav.rect']],
  [/^Неврологічний статус/, ['nevr']],
  [/^DIAGNOS|^Діагноз|^На підставі/, ['dx.osn','dx.mkh']],
  [/^37\. Огляд на коросту/, ['shk.kor']],
  [/^38\. Огляд на педикульоз/, ['shk.ped']],
  [/^39\. З режимом дня/, ['shk.rezh']],
  [/^40\. П\.І\.Б\. лікаря/, ['meta_doc','meta_docreg']],
  /* епікриз (п. 45–57) */
  [/^45\. ЕПІКРИЗ/, ['e_per.per']],
  [/^Медична карта стаціонарного хворого №/, ['meta_card']],
  [/^Дані обстеження/, ['e_obs']],
  [/^54\. Діагноз|^Додаткові діагнози/, ['dx.osn','dx.mkh']],
  [/^Категорія резистентності/, ['s066.tbres']],
  [/^55\. Медичне лікування/, ['e_lik.lik']],
  [/^56\. Лікувальні рекомендації/, ['e_rek']],
  [/^57\.1\./, ['meta_doc','meta_docreg']],
  [/^57\.2\./, ['meta_zav']],
  [/^57\. Результат/, ['e_lik.rez']]
];
const PE_ROW_SEL = '.b003 [data-diary-key], .b003 .brow, .b003 .bt, .b003 .bt2, .b003 .blines, .b003 .bdx';
const PE_SKIP = 'button, a, input, select, textarea, label, .blankbar, .gapbar, .gaplist, .pe-box';

/* ---- які поля стоять за рядком ---- */
function peRowKeys(row){
  if (!row) return null;
  if (row.closest('.bdi:not(.bcur)')) return null;
  if (row.dataset.diaryKey) return (typeof DIARY_INLINE_GROUPS !== 'undefined' && DIARY_INLINE_GROUPS[row.dataset.diaryKey]) || null;
  if (row.closest('.bdi')) return null;
  const txt = row.textContent.replace(/\s+/g, ' ').trim();
  const hit = PE_ROWS.find(([re])=>re.test(txt)); if (hit) return hit[1];
  const a = row.matches('[data-fld],[data-dsel],[data-s66fld]') ? row : row.querySelector('[data-fld],[data-dsel],[data-s66fld]');
  if (a) return a.dataset.s66fld ? ['s066.' + a.dataset.s66fld] : String(a.dataset.fld || a.dataset.dsel).split(/\s+/).filter(Boolean);
  return null;
}
function peSection(id){ return SECTIONS.find(s=>s.id === id); }
function peFieldOk(f){ return f && f.wrapEl && !['hdr','auto'].includes(f.type) && !(f.when && !f.when()); }
/* ключ → що показати: поле форми (f) або окремий елемент за id (src) */
function peItems(keys){
  const out = [], seen = new Set();
  (keys || []).forEach(k=>{
    if (/\./.test(k)){ const f = F(k); if (peFieldOk(f) && !seen.has(f)){ seen.add(f); out.push({f}); } return; }
    const s = peSection(k);
    if (s){ s.fields.filter(f=>peFieldOk(f) && !f.noOut && !f.headOnly && (!f.docs || !s.docs || f.docs.some(d=>s.docs.includes(d)))).forEach(f=>{ if (!seen.has(f)){ seen.add(f); out.push({f}); } }); return; }
    const src = document.getElementById(k);
    if (src && !seen.has(src)){ seen.add(src); const lb = document.querySelector(`label[for="${k}"]`); out.push({src, label:lb ? lb.textContent.trim() : k}); }
  });
  return out;
}
function peRoot(w){ return w === window ? document.getElementById('paper') : w.document.getElementById('pwBox'); }
function peRows(w){ const r = peRoot(w); return r ? [...r.querySelectorAll(PE_ROW_SEL)].filter(row=>{ const k = peRowKeys(row); return k && peItems(k).length; }) : []; }
function peTitle(row){
  const t = row.textContent.replace(/\s+/g, ' ').trim();
  const parts = t.split(/\s+(?=\d{1,2}(?:\.\d)?\.\s)/);
  const cut = x => x.split(/:|\s\.\s|\s{2}/)[0].replace(/\s+(час|год|хв)\b.*$/, '').trim().slice(0, 48);
  return cut(parts[0]) + (parts.length > 1 ? ' · ' + parts.slice(1).map(x=>(x.match(/^\d{1,2}(?:\.\d)?\./) || [''])[0]).join(' ') : '');
}

/* ---- побудова віконця (у документі будь-якого вікна) ---- */
function peEl(d, tag, attrs, ...kids){
  const e = d.createElement(tag);
  for (const k in attrs || {}){ const v = attrs[k]; if (v === null || v === undefined || v === false) continue;
    if (k === 'class') e.className = v; else if (k.startsWith('on')) e.addEventListener(k.slice(2), v); else e.setAttribute(k, v === true ? '' : v); }
  kids.flat().forEach(c=>{ if (c !== null && c !== undefined && c !== false) e.append(c && c.nodeType ? c : d.createTextNode(String(c))); });
  return e;
}
function peUndoMark(){
  if (!PE.undo){ undoPush('правка на бланку'); PE.undo = UNDO.at(-1); }
  if (typeof POP_INSERT !== 'undefined') POP_INSERT.undo = PE.undo;   /* поля з 628 не додають другий крок скасування */
}
function peAfter(){ PE_FAST = Date.now(); try{ if (PAPER) renderPaper(); }catch(e){} try{ popSoon(); }catch(e){} peSync(); }
function peSel(f, host){
  const d = host.ownerDocument, wrap = peEl(d, 'div', {class:'pe-field'}, peEl(d, 'div', {class:'pe-l'}, f.label));
  const list = peEl(d, 'div', {class:'pe-opts', role:'group', 'aria-label':f.label});
  [...f.el.options].forEach(o=>{
    const b = peEl(d, 'button', {type:'button', class:'pe-opt' + (o.value === '' ? ' pe-none' : ''), 'data-pe-sel':f.id, 'data-pe-sec':f.sec || '', 'data-value':o.value,
      onclick:()=>{ peUndoMark(); const own = typeof DIARY_INLINE_OWN !== 'undefined' && DIARY_INLINE_OWN.get(f); if (own) own.value = ''; f.el.value = o.value; f.el.dispatchEvent(new Event('change', {bubbles:true})); peAfter(); }},
      o.value === '' ? 'Не вказано' : o.textContent);
    b._pf = f; list.append(b);
  });
  wrap.append(list);
  const own = typeof DIARY_INLINE_OWN !== 'undefined' && DIARY_INLINE_OWN.get(f);
  if (own){ const area = peEl(d, 'div', {class:'pe-own'}); area.hidden = !own.value.trim(); popInsertControl(own, area, 'Своїми словами');
    wrap.append(peEl(d, 'button', {type:'button', class:'pe-more', onclick:()=>{ area.hidden = !area.hidden; if (!area.hidden){ const i = area.querySelector('textarea,input'); if (i) i.focus(); } pePlace(); }}, 'Своє…'), area); }
  host.append(wrap);
}
function peField(item, host){
  const d = host.ownerDocument;
  if (item.src){ const wrap = peEl(d, 'div', {class:'pe-field'}); popInsertControl(item.src, wrap, item.label); host.append(wrap); return; }
  const f = item.f;
  if (f.type === 'sel' && f.el && f.el.tagName === 'SELECT'){ peSel(f, host); return; }
  const wrap = peEl(d, 'div', {class:'pe-field'}, ['text','line'].includes(f.type) ? null : peEl(d, 'div', {class:'pe-l'}, f.label));
  popInsertField(f, wrap); host.append(wrap);
}
/* «своїми словами» розділу (поле «Додатково») — під кнопкою, щоб не захаращувати */
function peExtra(items, host){
  const secs = [...new Set(items.map(i=>i.f && SECTIONS.find(s=>s.fields.includes(i.f))).filter(Boolean))];
  secs.forEach(s=>{ const dod = s.fields.find(f=>f.id === 'dod'); if (!dod || !dod.el || items.some(i=>i.f === dod)) return;
    const d = host.ownerDocument, area = peEl(d, 'div', {class:'pe-own'}); area.hidden = !dod.el.value.trim();
    popInsertControl(dod.el, area, 'Додатково своїми словами (' + (s.short || s.title) + ')');
    host.append(peEl(d, 'button', {type:'button', class:'pe-more', onclick:()=>{ area.hidden = !area.hidden; if (!area.hidden){ const i = area.querySelector('textarea,input'); if (i) i.focus(); } pePlace(); }}, 'Своїми словами…'), area); });
}
function peClose(focus){
  const w = PE.w, idx = PE.idx;
  if (PE.box) PE.box.remove();
  if (w && !w.closed) try{ w.document.querySelectorAll('.pe-active').forEach(e=>e.classList.remove('pe-active')); }catch(e){}
  PE.box = null; PE.undo = null; PE.idx = -1;
  if (focus && w && !w.closed){ const r = peRows(w)[idx]; if (r) r.focus({preventScroll:true}); }
  PE.w = null;
}
function peOpen(w, row){
  const rows = peRows(w), idx = rows.indexOf(row); if (idx < 0) return false;
  const keys0 = peRowKeys(row) || [], items = peItems(keys0); if (!items.length) return false;
  try{ qeClose(); }catch(e){} try{ popInsertClose(); }catch(e){} try{ diaryInlineClose(); }catch(e){}
  peClose(); PE.w = w; PE.idx = idx;
  const d = w.document, body = peEl(d, 'div', {class:'pe-body'});
  items.forEach(it=>peField(it, body)); peExtra(items, body);
  const undo = peEl(d, 'button', {type:'button', class:'pe-btn pe-undo', disabled:true, onclick:()=>{
    if (!PE.undo || UNDO.at(-1) !== PE.undo) return; const keep = PE.idx, ww = PE.w; peClose(); undoLast(); peAfter(); const r = peRows(ww)[keep]; if (r) peOpen(ww, r); }}, '↶ Скасувати');
  const box = peEl(d, 'section', {class:'pe-box', role:'dialog', 'aria-label':'Внести на бланку: ' + peTitle(row)},
    peEl(d, 'div', {class:'pe-head'}, peEl(d, 'b', {}, peTitle(row)),
      peEl(d, 'button', {type:'button', class:'pe-btn', title:'Відкрити ці поля у формі', onclick:()=>{ const k = keys0[0]; peClose(); if (k){ try{ window.focus(); }catch(e){} bGo(k); } }}, 'У формі ›'),
      peEl(d, 'button', {type:'button', class:'pe-btn', 'aria-label':'Закрити', title:'Закрити (Esc)', onclick:()=>peClose(true)}, '✕')),
    body,
    peEl(d, 'div', {class:'pe-acts'},
      peEl(d, 'button', {type:'button', class:'pe-btn', onclick:()=>peStep(-1)}, '‹ Попередній'), undo,
      peEl(d, 'button', {type:'button', class:'pe-btn pe-next', onclick:()=>peStep(1)}, 'Далі ›')));
  box.addEventListener('pointerdown', e=>{ if (e.target.closest('.pe-body')) peUndoMark(); }, true);
  box.addEventListener('keydown', e=>{
    if (e.key === 'Escape'){ e.preventDefault(); e.stopPropagation(); peClose(true); return; }
    if (e.key === 'Enter' && e.target.tagName === 'INPUT' && !['search','date','datetime-local'].includes(e.target.type)){ e.preventDefault(); peStep(1); return; }
    if (e.target.closest('.pe-body') && e.key.length === 1) peUndoMark();
  });
  d.body.append(box); PE.box = box;
  peSync();
  const first = box.querySelector('.pe-body input:not([type=search]), .pe-body textarea, .pe-body .pe-opt[aria-pressed="true"], .pe-body .pe-opt, .pe-body button');
  if (first && !first.closest('[hidden]')) first.focus({preventScroll:true});
  return true;
}
function peStep(dir){
  const w = PE.w; if (!w || w.closed){ peClose(); return; }
  const rows = peRows(w), next = rows[PE.idx + dir];
  if (next){ try{ next.scrollIntoView({block:'nearest'}); }catch(e){} peOpen(w, next); } else peClose(true);
}
function pePlace(){
  const w = PE.w, box = PE.box; if (!box || !w || w.closed) return;
  const row = peRows(w)[PE.idx]; if (!row){ peClose(); return; }
  w.document.querySelectorAll('.pe-active').forEach(e=>{ if (e !== row) e.classList.remove('pe-active'); }); row.classList.add('pe-active');
  const r = row.getBoundingClientRect(), vw = w.innerWidth, vh = w.innerHeight;
  const width = Math.min(520, vw - 16); box.style.width = width + 'px';
  box.style.left = Math.max(8, Math.min(vw - width - 8, r.left)) + 'px';
  const hgt = box.getBoundingClientRect().height;
  box.style.top = (r.bottom + 6 + hgt <= vh - 8 ? r.bottom + 6 : r.top - hgt - 6 >= 8 ? r.top - hgt - 6 : Math.max(8, vh - hgt - 8)) + 'px';
}
function peSync(){
  const box = PE.box; if (!box) return;
  if (PE.w && PE.w.closed){ peClose(); return; }
  box.querySelectorAll('[data-pe-sel]').forEach(b=>{ const f = b._pf, own = typeof DIARY_INLINE_OWN !== 'undefined' && DIARY_INLINE_OWN.get(f);
    b.setAttribute('aria-pressed', f && !(own && own.value.trim()) && f.el.value === b.dataset.value && b.dataset.value !== '' ? 'true' : 'false'); });
  box.querySelectorAll('[data-pop-source]').forEach(i=>{ const s = document.getElementById(i.dataset.popSource); if (s && box.ownerDocument.activeElement !== i) i.value = s.value; });
  box.querySelectorAll('[data-pop-chip]').forEach(b=>{ const s = document.getElementById(b.dataset.popChip); if (s) b.setAttribute('aria-pressed', s.getAttribute('aria-pressed')); });
  const u = box.querySelector('.pe-undo'); if (u) u.disabled = !PE.undo || UNDO.at(-1) !== PE.undo;
  pePlace();
}
function peSoon(){ if (!PE.box || PE.frame) return; const w = PE.w && !PE.w.closed ? PE.w : window;
  PE.frame = w.requestAnimationFrame(()=>{ PE.frame = 0; peSync(); }); }

/* ---- кліки ---- */
function peClick(w, e){
  if (PE_MODE !== 'here' || DOC === 'anes') return;
  const t = e.target; if (!t || !t.closest) return;
  if (t.closest(PE_SKIP)) return;
  const row = t.closest(PE_ROW_SEL); if (!row) return;
  if (w === window && (!PAPER || !row.closest('#paper') || row.closest('.bdi'))) return;   /* щоденник в основному вікні — свій редактор */
  if (w !== window && (POP.mode !== 'paper' || !row.closest('#pwBox'))) return;
  const keys = peRowKeys(row); if (!keys || !peItems(keys).length) return;
  e.preventDefault(); e.stopImmediatePropagation();
  if (PE.box && PE.w === w && peRows(w)[PE.idx] === row) return;
  peOpen(w, row);
}
function peKey(w, e){
  if (PE_MODE !== 'here' || (e.key !== 'Enter' && e.key !== ' ')) return;
  const row = e.target && e.target.closest && e.target.closest(PE_ROW_SEL); if (!row || e.target !== row) return;
  if (w === window && row.closest('.bdi')) return;
  const keys = peRowKeys(row); if (!keys || !peItems(keys).length) return;
  e.preventDefault(); e.stopImmediatePropagation(); peOpen(w, row);
}
function peOutside(w, e){
  if (!PE.box || PE.w !== w) return;
  if (PE.box.contains(e.target)) return;
  const row = e.target.closest && e.target.closest(PE_ROW_SEL);
  if (row && peRowKeys(row)) return;   /* інший рядок — відкриє своє віконце */
  peClose();
}
/* window-capture спрацьовує раніше за обробники на document, тож у цьому режимі віконце має пріоритет */
window.addEventListener('click', e=>peClick(window, e), true);
window.addEventListener('keydown', e=>peKey(window, e), true);
window.addEventListener('pointerdown', e=>peOutside(window, e), true);
window.addEventListener('resize', ()=>{ if (PE.w === window) pePlace(); });
window.addEventListener('scroll', ()=>{ if (PE.w === window) peSoon(); }, true);
{ const x0 = popInit; popInit = function(w){
  const r = x0.apply(this, arguments);
  w.addEventListener('click', e=>peClick(w, e), true);
  ['click','change'].forEach(t=>w.document.addEventListener(t, ()=>{ PE_FAST = Date.now(); }, true));
  w.addEventListener('keydown', e=>{ if (e.key === 'Escape' && PE.box && PE.w === w){ e.preventDefault(); e.stopImmediatePropagation(); peClose(true); return; } peKey(w, e); }, true);
  w.addEventListener('pointerdown', e=>peOutside(w, e), true);
  w.addEventListener('resize', ()=>{ if (PE.w === w) pePlace(); });
  w.addEventListener('scroll', ()=>{ if (PE.w === w) peSoon(); }, true);
  w.addEventListener('beforeunload', ()=>{ if (PE.w === w) peClose(); });
  return r;
}; }
/* рядки, що відкривають віконце, — доступні з клавіатури */
function peMarkRows(w){
  if (PE_MODE !== 'here' || DOC === 'anes') return;
  peRows(w).forEach(row=>{ if (w === window && row.closest('.bdi')) return; row.classList.add('pe-row'); row.tabIndex = 0; row.setAttribute('role', 'button'); row.setAttribute('aria-haspopup', 'dialog'); row.title = 'Натисніть — пункти цього рядка відкриються тут'; });
}
{ const x0 = renderPaper; renderPaper = function(){ const r = x0.apply(this, arguments); try{ peMarkRows(window); peSoon(); }catch(e){} return r; }; }
{ const x0 = popRender; popRender = function(){ const r = x0.apply(this, arguments); try{ if (POP.w && !POP.w.closed){ peMarkRows(POP.w);
    const hh = POP.w.document.getElementById('pwH'); if (hh && POP.mode === 'paper' && PE_MODE === 'here' && DOC !== 'anes') hh.textContent = 'клік по рядку — пункти рядка відкриються тут'; } peSoon(); }catch(e){} return r; }; }
{ const x0 = update; update = function(){ const r = x0.apply(this, arguments); try{ peSoon(); }catch(e){} return r; }; }
{ const x0 = switchDoc; switchDoc = function(){ peClose(); return x0.apply(this, arguments); }; }
{ const x0 = restore; restore = function(){ peClose(); return x0.apply(this, arguments); }; }

/* ---- п. 20: час виписки ---- */
{ const x0 = bTitle; bTitle = function(){
  const page = x0.apply(this, arguments);
  const row = [...page.querySelectorAll('.brow')].find(r=>/^20\. Дата виписки/.test(r.textContent.trim()));
  const m = String((F('e_per.tvyp') && F('e_per.tvyp').el.value) || '').match(/(\d{1,2})\s*[:.\-год ]+\s*(\d{2})/);
  if (row && m){ const c = row.querySelectorAll('.bcells'); const put = (el, v)=>{ if (el) [...el.querySelectorAll('.bc')].forEach((x, i)=>x.textContent = v[i] || ' '); };
    put(c[3], m[1].padStart(2, '0')); put(c[4], m[2]); }
  return page;
}; }

/* ---- режим «перехід до поля у формі»: рядки, що раніше нікуди не вели ---- */
BMAP.unshift([/^МЕДИЧНА КАРТА СТАЦІОНАРНОГО ХВОРОГО/, 'meta_card'], [/^11\. Відділення/, 'meta_vcode'], [/^40\. П\.І\.Б\. лікаря|^57\.1\./, 'meta_doc'], [/^57\.2\./, 'meta_zav']);

/* ---- перемикач: над аркушем і в «Налаштуваннях» ---- */
function peSetMode(v){
  PE_MODE = v === 'form' ? 'form' : 'here'; try{ localStorage.setItem('po.paperedit', PE_MODE); }catch(e){}
  peClose(); const s = document.getElementById('set_paperedit'); if (s) s.value = PE_MODE;
  try{ renderPaper(); }catch(e){} try{ popRender(); }catch(e){}
}
{ const x0 = blankBar; blankBar = function(){
  const bar = x0.apply(this, arguments);
  if (BLANK && ['ohl','epi','f066'].includes(DOC)) bar.append(h('button', {type:'button', class:'pe-toggle', 'aria-pressed':PE_MODE === 'here' ? 'true' : 'false',
    title:'Увімкнено: клік по рядку бланка відкриває його пункти тут. Вимкнено: перехід до поля у формі.', onclick:()=>peSetMode(PE_MODE === 'here' ? 'form' : 'here')}, '✎ Вносити на бланку'));
  return bar;
}; }
if (SETTINGS_EL){
  const s = h('select', {id:'set_paperedit'}, h('option', {value:'here'}, 'Відкриває віконце з пунктами рядка прямо на бланку'), h('option', {value:'form'}, 'Переходить до поля у формі ліворуч'));
  s.value = PE_MODE; s.addEventListener('change', ()=>peSetMode(s.value));
  SETTINGS_EL.append(h('h3', {class:'sub'}, 'Бланк'), h('div', {class:'grid'}, h('div', {class:'f'}, h('label', {for:'set_paperedit'}, 'Клік по рядку бланка (і у виносному вікні)'), s)));
  try{ setRegroup(); }catch(e){}
}
try{ if (PAPER) renderPaper(); }catch(e){}

/* ---- виносне вікно: після кліку/вибору аркуш оновлюється одразу, а не через 200 мс ----
   (відкладення лишається лише для набору тексту, щоб не перемальовувати аркуш на кожну літеру) */
let PE_FAST = 0;
['click','change'].forEach(t=>document.addEventListener(t, ()=>{ PE_FAST = Date.now(); }, true));
{ const x0 = popSoon; popSoon = function(){
  if (POP.w && !POP.w.closed && POP.mode === 'paper' && Date.now() - PE_FAST < 400){
    clearTimeout(POP.t); try{ popRender(); }catch(e){} return;
  }
  return x0.apply(this, arguments);
}; }
