/* ===== QR-код на документах для пацієнта і секундомір документа (0.9.3) ===== */

/* ---------- QR: пацієнт сканує телефоном і забирає текст собі (без інтернету: текст — у самому коді) ---------- */
let QRON = lsGet('po.qr', '1') !== '0';
const QR_DOCS = {pam:'пам’ятки', epi:'рекомендацій', kons:'рекомендацій'};
const QR_MAX = 700;
function qrText(){
  const t = itext($('#out')).replace(/[ \t]+/g, ' ').replace(/\n{2,}/g, '\n').trim(); if (!t) return '';
  if (t.length <= QR_MAX) return t;
  // довгий документ — беремо головне для пацієнта: рекомендації / лікування / ліки
  const re = /(Рекомендації|Рекомендовано|Рекомендації пацієнту|Призначення|Лікування|Ліки|Як приймати ліки)[^\n]*:/g; let m, at = -1;
  while ((m = re.exec(t))) at = m.index;
  const part = at >= 0 ? t.slice(at) : t;
  return part.length <= QR_MAX ? part : part.slice(0, QR_MAX - 40).replace(/\s+\S*$/, '') + '… (повністю — у паперовому документі)';
}
function qrSvg(text){
  try{
    qrcode.stringToBytes = qrcode.stringToBytesFuncs['UTF-8'];
    const q = qrcode(0, 'L'); q.addData(text, 'Byte'); q.make();
    const n = q.getModuleCount(), mm = Math.max(26, Math.min(55, Math.round(n * 0.4)));
    const box = h('div', {class:'prqr-c', style:`width:${mm}mm;height:${mm}mm`}); box.innerHTML = q.createSvgTag({cellSize:2, margin:0, scalable:true});
    return box;
  }catch(e){ return null; }
}
{ const fs0 = fillSheet;
  fillSheet = function(P){
    const r = fs0.apply(this, arguments);
    if (QRON && QR_DOCS[DOC] && !(typeof blankOn === 'function' && blankOn())){ const t = qrText(), q = t && qrSvg(t);
      if (q) P.append(h('div', {class:'prqr'}, q, h('div', {class:'prqr-t'}, h('b', {}, 'Текст ' + QR_DOCS[DOC] + ' — у ваш телефон'), h('span', {}, 'Наведіть камеру телефону на код і збережіть або скопіюйте текст. Інтернет не потрібен.')))); }
    return r;
  }; }

/* ---------- Секундомір: скільки активного часу пішло на документ ---------- */
/* Рахується лише час, коли лікар щось робить у програмі (паузи довші за 2 хв не враховуються). Зберігається лише в цьому браузері. */
const TM = {act:0, last:0};
const TM_GAP = 120e3;
['input','click','keydown','change'].forEach(ev=>document.addEventListener(ev, e=>{
  if (!e.isTrusted) return; const now = Date.now();
  if (TM.last && now - TM.last <= TM_GAP) TM.act += now - TM.last; TM.last = now;
}, true));
function tmLoad(){ try{ return JSON.parse(lsGet('po.times', '[]')) || []; }catch(e){ return []; } }
function tmRecord(how){
  const sec = Math.round(TM.act / 1000); if (sec < 20 || !itext($('#out')).trim()) return;
  const L = tmLoad(); L.push({t:Date.now(), doc:DOC, sec, how, p:PROF ? PROF.p : ''}); while (L.length > 1000) L.shift();
  lsSet('po.times', JSON.stringify(L)); TM.act = 0; renderTimes();
}
function tmReset(){ TM.act = 0; TM.last = 0; }
['#copy', '#copy2', '#printBtn', '#docxBtn', '#odtBtn'].forEach(s=>{ const b = $(s); if (b) b.addEventListener('click', ()=>tmRecord(s === '#printBtn' ? 'друк' : s.includes('copy') ? 'копіювання' : 'файл')); });
{ const c0 = copy; copy = function(){ const r = c0.apply(this, arguments); tmRecord('копіювання'); return r; }; }
{ const p0 = doPrint; doPrint = function(){ const r = p0.apply(this, arguments); tmRecord('друк'); return r; }; }
['newPatient', 'openPatient'].forEach(nm=>{ const f = window[nm]; if (typeof f === 'function') window[nm] = function(...a){ const r = f.apply(this, a); tmReset(); return r; }; });
{ const sd0 = switchDoc; switchDoc = function(){ const r = sd0.apply(this, arguments); tmReset(); return r; }; }
const DOCNAME = {ohl:'первинний огляд', shch:'щоденник', rx:'призначення', epi:'виписний епікриз', kons:'консультація', pam:'пам’ятка', zav:'огляд завідувача', konc:'консиліум', etap:'етапний епікриз', per:'переказний епікриз', napr:'направлення', gosp:'направлення на госпіталізацію', dov:'довідка', zgoda:'згода'};
const fmtMin = s => s < 60 ? s + ' с' : Math.floor(s / 60) + ' хв' + (s % 60 >= 30 ? ' 30 с' : '');
function tmStats(days){
  const from = Date.now() - days * 864e5, L = tmLoad().filter(x=>x.t >= from), by = {};
  L.forEach(x=>{ (by[x.doc] = by[x.doc] || []).push(x.sec); });
  const med = a => { const s = a.slice().sort((x,y)=>x - y), m = s.length >> 1; return s.length % 2 ? s[m] : Math.round((s[m - 1] + s[m]) / 2); };
  return Object.keys(by).map(k=>({doc:k, n:by[k].length, med:med(by[k])})).sort((a,b)=>b.n - a.n);
}
function renderTimes(){
  const box = $('#tmBox'); if (!box) return; box.innerHTML = '';
  const S = tmStats(7); if (!S.length){ box.hidden = true; return; } box.hidden = false;
  box.append(h('span', {class:'chips-hint'}, '⏱ За тиждень (медіана): '), ...S.slice(0, 3).map((x,i)=>h('span', {class:'tmi'}, (i ? ' · ' : '') + DOCNAME[x.doc] + ' — ' + fmtMin(x.med) + ` (${x.n})`)),
    h('button', {type:'button', class:'more', onclick:timesDialog}, 'Докладніше'));
}
function timesDialog(){
  const close = () => dlg.remove();
  const tbl = days => { const S = tmStats(days); if (!S.length) return h('p', {class:'chips-hint'}, 'Ще немає даних.');
    return h('table', {class:'tmt'}, h('tr', {}, h('th', {}, 'Документ'), h('th', {}, 'Скільки'), h('th', {}, 'Медіана часу')), ...S.map(x=>h('tr', {}, h('td', {}, DOCNAME[x.doc] || x.doc), h('td', {}, String(x.n)), h('td', {}, fmtMin(x.med))))); };
  const dlg = h('div', {class:'navsheet packsheet', role:'dialog', 'aria-modal':'true', 'aria-label':'Час на документи'}, h('div', {class:'nvbox'},
    h('div', {class:'nshead'}, h('b', {}, '⏱ Час на документи'), h('button', {type:'button', class:'btn', onclick:close}, 'Закрити ✕')),
    h('p', {class:'chips-hint'}, 'Рахується лише активний час роботи в програмі — від відкриття пацієнта чи документа до «Копіювати», друку або збереження у файл. Паузи довші за 2 хв не враховуються. Дані лише в цьому браузері; для пілоту їх можна зберегти у файл.'),
    h('h3', {class:'sub'}, 'Останні 7 днів'), tbl(7), h('h3', {class:'sub'}, 'Останні 30 днів'), tbl(30),
    h('div', {class:'acts2', style:'margin-top:12px'},
      h('button', {type:'button', class:'btn', onclick:()=>{ const L = tmLoad(); downloadJSON({type:'po-times', note:'Активний час на документи (секунди), без даних пацієнтів', items:L}, 'chas-na-dokumenty.json'); }}, 'Зберегти у файл (для пілоту)'),
      h('button', {type:'button', class:'more', onclick:e=>{ const b = e.currentTarget; if (!b.dataset.arm){ b.dataset.arm = '1'; b.textContent = 'Точно очистити?'; return; } lsSet('po.times', '[]'); renderTimes(); close(); toast('Статистику часу очищено'); }}, 'Очистити'))));
  dlg.addEventListener('click', e=>{ if (e.target === dlg) close(); }); document.body.append(dlg);
}
{ const pl = $('#plist'); if (pl){ const b = h('div', {class:'tmbox', id:'tmBox', hidden:''}); const today = $('#today'); (today ? today.parentElement : pl.parentElement).after(b); renderTimes(); } }

/* налаштування */
if (SETTINGS_EL){
  const sec = [...SETTINGS_EL.querySelectorAll('details.setsec')].find(d=>d.querySelector('summary').textContent === 'Оформлення документів');
  const cb = h('input', {type:'checkbox', id:'set_qr'}); cb.checked = QRON; cb.addEventListener('change', ()=>{ QRON = cb.checked; lsSet('po.qr', QRON ? '1' : '0'); toast(QRON ? 'QR-код друкуватиметься на пам’ятці, виписці й консультації' : 'QR-код вимкнено'); });
  const row = h('label', {class:'chk', for:'set_qr', style:'display:flex;gap:8px;align-items:flex-start;margin-top:8px'}, cb, 'QR-код на пам’ятці, виписному епікризі й консультації — пацієнт забирає текст собі в телефон (без інтернету)');
  (sec || SETTINGS_EL).append(row);
}
{ const si3 = searchItems; searchItems = function(){ const L = si3(); L.push({k:'Дія', t:'Час на документи (секундомір)', s:'', go:timesDialog}, {k:'Дія', t:'Повторити скасовану дію', s:'Ctrl+Y', go:redoLast}); return L; }; }
