/* ===== 0.9.3.52 — зворот титульного аркуша 003/о: пп. 22, 23, 31, 32 =====
   Дані — з наявних полів: діагноз (dx), операції (066/о, «Процедури й операції»), лікар і завідувач («Налаштування»).
   Нових полів не додає. Друкується разом із титульним аркушем (галочка «зворот титульного»). */
if (BLP.back === undefined) BLP.back = true;
/* процедури: «Процедури й операції» (066/о) + «Медичні інтервенції (НК 026)» з огляду; без повторів за кодом */
const ACHI_RE = /^(\d{4,5}-\d{2}(?:-\d{2})?)\s*[–—-]?\s*(.*)$/;
function bProcRows(){
  const ops = (typeof ops66 === 'function' ? ops66() : []).map(o=>{
    let code = o.code, name = o.name; const m = !code && ACHI_RE.exec(name || ''); if (m){ code = m[1]; name = m[2]; }
    return {dt:o.dt, name, code, an:o.an, comp:o.comp}; });
  const seen = new Set(ops.map(o=>o.code).filter(Boolean));
  String((F('dx.posl') && F('dx.posl').el.value) || '').split(/[;\n]+/).map(x=>x.trim()).filter(Boolean).forEach(x=>{
    const m = ACHI_RE.exec(x), code = m ? m[1] : '', name = m ? m[2] : x;
    if (code && seen.has(code)) return; if (code) seen.add(code); ops.push({dt:'', name, code, an:'', comp:''}); });
  return ops;
}
/* пошук процедури за АКМІ (НК 026): додає рядок у «Процедури й операції» (дата; код; назва; …) */
function achiAdd(e){
  const f = F('s066.ops'); if (!f || !f.el) return;
  const d = new Date(), dt = String(d.getDate()).padStart(2, '0') + '.' + String(d.getMonth() + 1).padStart(2, '0') + '.' + d.getFullYear();
  f.el.value = [f.el.value.trim(), [dt, e[0], e[1], '', '', '', ''].join('; ')].filter(Boolean).join('\n');
  f.el.dispatchEvent(new Event('input', {bubbles:true})); update(); toast('Додано: ' + e[0] + ' — ' + e[1], 2500);
}
function achiPicker(){
  return codePicker({ph:'Знайти процедуру за АКМІ (НК 026:2021): назва або код', list:()=>DICT.nk026 || [],
    none:'Довідник НК 026:2021 не завантажено або нічого не знайдено. Завантажте офіційний файл: «Налаштування» → «Довідники кодів».', pick:achiAdd});
}
{ const f = F('s066.ops'), w = f && f.el && f.el.closest('.f'); if (w && !w.dataset.achi){ w.dataset.achi = '1'; w.classList.add('wide'); w.append(achiPicker()); } }
function bTitleBack(){
  const osn = BV('dx.osn'), code = BV('dx.mkh'), usk = BV('dx.uskl'), sup = BV('dx.supd');
  const dxRows = [['основний', osn, code], ...usk.split(/;\s*/).filter(Boolean).map(t=>['ускладнення', t, '']), ...sup.split(/;\s*/).filter(Boolean).map(t=>['супутній', t, ''])];
  while (dxRows.length < 5) dxRows.push(['', '', '']);
  const opRows = [...bProcRows().map(o=>[o.dt, o.name, o.code, o.an, o.comp]), ...Array(4).fill(['', '', '', '', ''])].slice(0, Math.max(4, bProcRows().length));
  return bPage('btitle btback',
    h('div', {class:'bt'}, '22. Діагноз заключний клінічний'),
    h('table', {class:'bdx'}, h('thead', {}, h('tr', {}, h('th', {}, 'Діагноз'), h('th', {}, 'Назва діагнозу'), h('th', {}, 'Код за МКХ-10'))),
      h('tbody', {}, ...dxRows.map(([k, t, c], i)=>h('tr', {}, h('td', {class:'c'}, k || '\u00a0'), h('td', {}, i === 0 ? bFill(t, true, true) : t || '\u00a0'), h('td', {}, bCells(String(c).split(/[,;\s]+/)[0], 6, i === 0)))))),
    h('div', {class:'bt'}, '23. Хірургічні операції та процедури'),
    h('table', {class:'bdx bops'}, h('colgroup', {}, ...['17%','33%','16%','16%','18%'].map(w=>h('col', {style:'width:' + w}))),
      h('thead', {}, h('tr', {}, h('th', {}, 'Дата'), h('th', {}, 'Назва процедури / операції'), h('th', {}, 'Код АКМІ (НК 026)'), h('th', {}, 'Знебо\u00adлення'), h('th', {}, 'Усклад\u00adнення'))),
      h('tbody', {}, ...opRows.map(r=>h('tr', {}, ...r.map(v=>h('td', {}, v || '\u00a0')))))),
    ...[['31. Лікуючий лікар ', bFill(mv('doc'), true)], ['32. Завідувач відділення ', bFill(mv('zav'))]].map(([l, f])=>{
      const r = bRow(l, f, h('span', {class:'bnw bsig'}, ' підпис ', bFill(''))); r.classList.add('bsigrow'); return r; }));
}
{ const x0 = blankPages; blankPages = function(){
  const pages = x0.apply(this, arguments);
  if (DOC === 'ohl' && BLP.title && BLP.back) pages.splice(1, 0, bTitleBack());
  return pages;
}; }
{ const x0 = blankBar; blankBar = function(){
  const bar = x0.apply(this, arguments);
  if (BLANK && DOC === 'ohl' && BLP.title){
    const lb = [...bar.querySelectorAll('label.blk')].find(l=>/титульний лист/.test(l.textContent));
    const c = h('input', {type:'checkbox'}); c.checked = !!BLP.back;
    c.addEventListener('change', ()=>{ BLP.back = c.checked; try{ localStorage.setItem('po.blankp', JSON.stringify(BLP)); }catch(e){} renderPaper(); });
    const el = h('label', {class:'blk'}, c, ' зворот титульного (пп. 22, 23, 31, 32)');
    if (lb) lb.after(el); else bar.append(el);
  }
  return bar;
}; }
/* клік по рядку звороту: віконце (636) і режим «у форму» (599) */
PE_ROWS.push([/^22\. Діагноз заключний/, ['dx.osn','dx.mkh','dx.uskl','dx.supd']], [/^23\. Хірургічні операції/, ['#achi','s066.ops','dx.posl']],
  [/^31\. Лікуючий лікар/, ['meta_doc']], [/^32\. Завідувач відділення/, ['meta_zav']]);
BMAP.unshift([/^22\. Діагноз заключний/, 'dx.osn'], [/^23\. Хірургічні операції/, 's066.ops'], [/^31\. Лікуючий лікар/, 'meta_doc'], [/^32\. Завідувач відділення/, 'meta_zav']);
try{ if (PAPER) renderPaper(); }catch(e){}
