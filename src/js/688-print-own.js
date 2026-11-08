/* ===== 0.10, етап 5: власне оформлення друку вільних документів («Класичне / Власне») =====
   Стосується лише документів, що починаються рядком «дата, час. Назва.» (первинний огляд, щоденник, огляд завідувача тощо).
   Бланки МОЗ (003/о, 027/о, 028/о, листок призначень, епікриз за формою) і нумеровані форми не змінюються.
   «Класичне» — як було (за замовчуванням). «Власне» — назва документа кольором, розділи двома колонками
   (назва розділу ліворуч, текст праворуч), діагноз у рамці. Текст документа той самий — змінюється лише вигляд аркуша. */
let PRSTYLE = lsGet('po.prstyle', 'classic'); if (PRSTYLE !== 'own') PRSTYLE = 'classic';
try{ if (!FS_SET_KEYS.includes('po.prstyle')) FS_SET_KEYS.push('po.prstyle'); }catch(e){}
const PROWN_RE = /^(\d{2}\.\d{2}\.\d{4}(?:,\s*\d{1,2}:\d{2})?)\.\s*(.+?)\.?$/;
function prOwnHead(){
  const o = $('#out'), d = o && o.firstElementChild;
  if (!d || d.tagName !== 'DIV') return null;
  const m = d.textContent.trim().match(PROWN_RE); return m ? {date:m[1], title:m[2]} : null;
}
function prOwnOK(){ return !(typeof blankOn === 'function' && blankOn()) && !!prOwnHead(); }
function prOwnApply(P){
  const body = P.querySelector('.pr-body'), hd = prOwnHead(); if (!body || !hd) return;
  const first = [...body.children].find(e=>e.tagName === 'DIV' && PROWN_RE.test(e.textContent.trim()));
  if (first){ const t = h('div', {class:'po-title'}, h('span', {class:'po-t'}, hd.title), h('span', {class:'po-d'}, hd.date)); first.remove();
    const at = P.querySelector(':scope > .pr-card, :scope > .pr-pat'); if (at) at.before(t); else body.before(t); }
  [...body.children].forEach(d=>{
    if (d.tagName !== 'DIV' || d.classList.contains('po-title') || d.classList.contains('gaplist')) return;
    const b = d.firstElementChild, lead = d.firstChild;
    const labeled = b && b.tagName === 'B' && lead === b && /:\s*$/.test(b.textContent) && b.textContent.length < 80;
    const k = h('span', {class:'po-k'}, labeled ? b.textContent.replace(/:\s*$/, '') : ''), v = h('span', {class:'po-v'});
    if (labeled) b.remove();
    while (d.firstChild) v.append(d.firstChild);
    if (v.firstChild && v.firstChild.nodeType === 3) v.firstChild.nodeValue = v.firstChild.nodeValue.replace(/^\s+/, '');
    d.append(k, v); d.classList.add('po-r');
    if (!labeled) d.classList.add('po-cont');
    if (labeled && /^(Клінічний |Попередній |Заключний |Остаточний )?[Дд]іагноз/.test(k.textContent)) d.classList.add('po-dx');
  });
  /* діагноз разом з підпунктами (а) основний, б) ускладнення, в) супутні…) — в одній рамці */
  body.querySelectorAll(':scope > .po-dx').forEach(d=>{
    const box = h('div', {class:'po-dxbox'}); d.before(box); box.append(d);
    let n = box.nextElementSibling;
    while (n && n.classList.contains('po-r') && (n.classList.contains('po-cont') || /^([а-ґ]\)|Основн|Ускладн|Супутн|Код)/i.test(n.querySelector('.po-k').textContent))){ const nx = n.nextElementSibling; box.append(n); n = nx; }
  });
}
{ const fs0 = fillSheet; fillSheet = function(P){
    const r = fs0.apply(this, arguments);
    try{ P.classList.remove('pr-own'); if (PRSTYLE === 'own' && prOwnOK()){ P.classList.add('pr-own'); prOwnApply(P); } }catch(e){}
    return r; }; }
function prStyleSet(k){ PRSTYLE = k === 'own' ? 'own' : 'classic'; lsSet('po.prstyle', PRSTYLE); try{ renderPaper(); }catch(e){} }
function prStyleSeg(){
  const seg = h('div', {class:'prs-seg', role:'group', 'aria-label':'Оформлення друку'}, h('span', {class:'prs-l'}, 'Оформлення:'));
  [['classic', 'Класичне', 'Як у звичайному друкованому документі: шрифт Times, суцільний текст'], ['own', 'Власне', 'Сучасний вигляд: розділи двома колонками, діагноз у рамці. Текст той самий']].forEach(([k, t, tt])=>
    seg.append(h('button', {type:'button', class:'btn', 'data-k':k, title:tt, 'aria-pressed':PRSTYLE === k ? 'true' : 'false', onclick:()=>prStyleSet(k)}, t)));
  return seg;
}
{ const rp0 = renderPaper; renderPaper = function(){
    const r = rp0.apply(this, arguments);
    try{ const pp = $('#paper'); if (pp){ const old = pp.querySelector('.prs-seg'); if (old) old.remove();
      const sh = pp.querySelector('.sheet'); if (PAPER && sh && prOwnOK()) pp.insertBefore(prStyleSeg(), sh); } }catch(e){}
    return r; }; }
