/* ===== 0.9.3.62 — телефон: «читабельний бланк» у «Перед друком» (0.9.3.63: «Заповнити порожні», «12 з 45» і «Лише порожні» — і на комп’ютері) =====
   Аркуш А4 ширший за телефон: при 200 % треба гортати вбік, «по ширині» — дрібно. Тепер на телефоні:
   • «Читабельно» (за замовчуванням): той самий бланк 003/о / 066/о — ті самі пункти й нумерація, — але
     в ширину екрана, звичайним розміром тексту, без гортання вбік; «Як на папері» — точний аркуш для звірки;
   • видно, куди тиснути: заповнене — підкреслено, порожнє — плашка «+ внести»;
   • «✎ Заповнити порожні (N)» — відкриває перше порожнє місце; у панелі — «14 з 45» і «Лише порожні»:
     «Далі ›» стрибає тільки по незаповнених місцях.
   Друк (і «Як на папері») — завжди справжній аркуш А4: читабельний вигляд — лише на екрані телефона. */
const PHR = { read:true, gaps:false };
try{ PHR.read = localStorage.getItem('po.phread') !== '0'; }catch(e){}
/* порожнє місце: у рядку нічого не вибрано й не вписано (рядок «задовільний, середньої ___» з вибраним варіантом — заповнений) */
const phrRowEmpty = row => {
  if (row.matches('.blines')) return !row.textContent.trim();
  if (row.querySelector('.bf:not(.empty), .bu, .bnum.on')) return false;
  return !!row.querySelector('.bf.empty, .bgap, .bc, .bbox') && ![...row.querySelectorAll('.bc, .bbox')].some(c=>c.textContent.trim());
};
function phrApply(){
  const sh = document.querySelector('#paper .sheet'); if (!sh) return;
  const on = isPhone() && !!PAPER && sh.classList.contains('blankmode') && PHR.read;
  sh.classList.toggle('phread', on);
  const blank = sh.classList.contains('blankmode');
  const n = blank ? peRows(window).filter(phrRowEmpty).length : 0;
  const bar = document.querySelector('#paper .phzbar'), host = bar || document.querySelector('#paper .blankbar');
  if (host){
    let go = host.querySelector('.phr-go');
    if (!go){ go = h('button', {type:'button', class:'btn primary phr-go', title:'Відкрити перше незаповнене місце; «Далі» — лише по порожніх', onclick:()=>phrFillGaps()}); host.append(go); }
    go.hidden = !blank || !n; go.textContent = '✎ Заповнити порожні · ' + n;
  }
  if (!bar) return;   // комп’ютер: справжній аркуш А4, без «Читабельно»
  let seg = bar.querySelector('.phr-seg');
  if (!seg){
    seg = h('span', {class:'seg phr-seg', role:'group', 'aria-label':'Вигляд бланка'},
      h('button', {type:'button', 'data-r':'1', onclick:()=>phrSet(true)}, 'Читабельно'),
      h('button', {type:'button', 'data-r':'0', onclick:()=>phrSet(false)}, 'Як на папері'));
    bar.insertBefore(seg, bar.querySelector('.phz-zoom'));
  }
  seg.hidden = !blank;
  seg.querySelectorAll('button').forEach(b=>b.setAttribute('aria-pressed', (b.dataset.r === '1') === PHR.read ? 'true' : 'false'));
  const z = bar.querySelector('.phz-zoom'), fit = bar.querySelector('.phz-fit');
  if (z) z.hidden = !blank || PHR.read; if (fit) fit.hidden = !blank || PHR.read;
  const go = bar.querySelector('.phr-go'); if (go && go !== bar.lastElementChild) bar.append(go);
}
function phrSet(v){
  PHR.read = v; try{ localStorage.setItem('po.phread', v ? '1' : '0'); }catch(e){}
  try{ peClose(); }catch(e){}
  const p = document.getElementById('paper'); if (p){ p.scrollLeft = 0; }
  phrApply(); try{ phZoom(false); }catch(e){}
  toast(v ? 'Читабельно: бланк у ширину екрана. Друкується все одно справжній аркуш А4' : 'Як на папері: точний аркуш А4', 2600);
}
function phrFillGaps(){
  PHR.gaps = true;
  const r = peRows(window).find(phrRowEmpty);
  if (!r){ toast('Порожніх місць на бланку немає'); return; }
  try{ r.scrollIntoView({block:'center'}); }catch(e){}
  peOpen(window, r);
}
/* у панелі правки: «14 з 45» і «Лише порожні» */
function phrHead(){
  if (!PE.box || PE.w !== window) return;
  const head = PE.box.querySelector('.pe-head'); if (!head) return;
  const rows = peRows(window), gaps = rows.filter(phrRowEmpty).length;
  let nav = head.querySelector('.phr-nav');
  if (!nav){
    nav = h('span', {class:'phr-nav'}, h('span', {class:'phr-n'}),
      h('button', {type:'button', class:'pe-btn phr-gt', onclick:()=>{ PHR.gaps = !PHR.gaps; phrHead(); toast(PHR.gaps ? '«Далі» — лише по порожніх місцях' : '«Далі» — по всіх рядках', 1800); }}));
    head.append(nav);
  }
  nav.querySelector('.phr-n').textContent = (PE.idx + 1) + ' з ' + rows.length;
  const gt = nav.querySelector('.phr-gt');
  gt.textContent = PHR.gaps ? 'Лише порожні · ' + gaps : 'Лише порожні';
  gt.setAttribute('aria-pressed', PHR.gaps ? 'true' : 'false');
  gt.hidden = !gaps && !PHR.gaps;
}
{ const x0 = peOpen; peOpen = function(){ const r = x0.apply(this, arguments); try{ phrHead(); }catch(e){} return r; }; }
{ const x0 = peStep; peStep = function(dir){
  if (!PHR.gaps || PE.w !== window) return x0.apply(this, arguments);
  const rows = peRows(window); let i = PE.idx + dir;
  while (rows[i] && !phrRowEmpty(rows[i])) i += dir;
  if (!rows[i]){ toast(dir > 0 ? 'Далі порожніх місць немає' : 'Раніше порожніх місць немає', 2000); if (!rows.some(phrRowEmpty)){ PHR.gaps = false; peClose(true); } return; }
  try{ rows[i].scrollIntoView({block:'nearest'}); }catch(e){} peOpen(window, rows[i]);
}; }
{ const x0 = peClose; peClose = function(focus){ const r = x0.apply(this, arguments); if (focus === true) PHR.gaps = false; return r; }; }
{ const x0 = renderPaper; renderPaper = function(){ const r = x0.apply(this, arguments); try{ phrApply(); }catch(e){} try{ if (PE.box) phrHead(); }catch(e){} return r; }; }
if (window.matchMedia) matchMedia('(max-width:899px)').addEventListener('change', ()=>{ try{ phrApply(); }catch(e){} });
try{ if (PAPER) renderPaper(); }catch(e){}
