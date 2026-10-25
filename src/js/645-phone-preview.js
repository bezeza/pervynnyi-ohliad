/* ===== 0.9.3.57 — «Перед друком» на телефоні =====
   Раніше аркуш А4 (794 px) стискався до ширини екрана — текст бланка ~6 px, і все це — у віконці ~470 px.
   Тепер на екрані до 899 px:
   • аркуш одразу читабельний (за замовчуванням 200 % від «по ширині»), гортається пальцем у всі боки;
     масштаб — двома пальцями або кнопками «− / + / По ширині»; запам’ятовується;
   • перегляд — на всю висоту екрана; «Перед копіюванням» у цьому режимі сховано (є на вкладці «Перевірка»);
   • перемикачі аркуша згорнуто під «Вигляд ▾», список «Ще не заповнено» за замовчуванням згорнуто;
   • віконця правки на бланку відкриваються знизу екрана (як звично на телефоні).
   Друк і комп’ютер — без змін. */
const PHP = { k:2, open:false, pinch:null };
try{ PHP.k = Math.min(3.5, Math.max(1, +localStorage.getItem('po.phonez') || 2)); }catch(e){}
const phoneMQ = window.matchMedia ? window.matchMedia('(max-width:899px)') : {matches:false, addEventListener(){}};
const phIs = () => !!phoneMQ.matches;
/* на телефоні «Ще не заповнено» згорнуто, якщо лікар сам не вибирав */
try{ if (phIs() && localStorage.getItem('po.gaps') === null) GAPS = false; }catch(e){}
function phFit(){ const p = document.getElementById('paper'); return p ? Math.max(0.2, (p.clientWidth - 20) / 794) : 1; }
function phZoom(save){
  const p = document.getElementById('paper'), sh = p && p.querySelector('.sheet'); if (!sh) return;
  const on = phIs() && PAPER && sh.classList.contains('blankmode');
  sh.classList.toggle('phz', on);
  if (on) sh.style.setProperty('--bz', (phFit() * PHP.k).toFixed(3));
  const v = p.querySelector('.phz-v'); if (v) v.textContent = Math.round(PHP.k * 100) + ' %';
  if (save){ try{ localStorage.setItem('po.phonez', String(PHP.k)); }catch(e){} }
}
function phSetK(k, keepCenter){
  const p = document.getElementById('paper'); const old = PHP.k; PHP.k = Math.min(3.5, Math.max(1, Math.round(k * 20) / 20));
  if (!p || old === PHP.k){ phZoom(true); return; }
  const cx = p.scrollLeft + p.clientWidth / 2, cy = p.scrollTop + p.clientHeight / 2, r = PHP.k / old;
  phZoom(true);
  if (keepCenter !== false){ p.scrollLeft = cx * r - p.clientWidth / 2; p.scrollTop = cy * r - p.clientHeight / 2; }
}
function phBar(){
  const p = document.getElementById('paper'); if (!p) return;
  let bar = p.querySelector('.phzbar');
  if (!phIs() || !PAPER){ if (bar) bar.remove(); p.classList.remove('phcol'); return; }
  const blank = !!p.querySelector('.sheet.blankmode');
  if (!bar){
    bar = h('div', {class:'phzbar'},
      h('button', {type:'button', class:'btn phz-more', 'aria-expanded':'false', onclick:()=>{ PHP.open = !PHP.open; phBar(); }}, 'Вигляд ▾'),
      h('span', {class:'phz-zoom seg', role:'group', 'aria-label':'Масштаб аркуша'},
        h('button', {type:'button', 'aria-label':'Зменшити', onclick:()=>phSetK(PHP.k - 0.5)}, '−'),
        h('span', {class:'phz-v'}, ''),
        h('button', {type:'button', 'aria-label':'Збільшити', onclick:()=>phSetK(PHP.k + 0.5)}, '+')),
      h('button', {type:'button', class:'btn phz-fit', title:'Увесь аркуш по ширині екрана', onclick:()=>{ phSetK(1, false); p.scrollLeft = 0; }}, '⇔'));
    p.prepend(bar);
  } else if (bar !== p.firstElementChild) p.prepend(bar);
  bar.querySelector('.phz-zoom').hidden = !blank; bar.querySelector('.phz-fit').hidden = !blank;
  const more = bar.querySelector('.phz-more'); more.textContent = PHP.open ? 'Вигляд ▴' : 'Вигляд ▾'; more.setAttribute('aria-expanded', PHP.open ? 'true' : 'false');
  p.classList.toggle('phcol', !PHP.open);
  phZoom(false);
}
{ const x0 = renderPaper; renderPaper = function(){ const r = x0.apply(this, arguments); try{ phBar(); }catch(e){} return r; }; }
/* масштаб двома пальцями (лише в режимі бланка) */
{ const p = document.getElementById('paper');
  if (p){
    const dist = e => { const [a, b] = e.touches; return Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY); };
    p.addEventListener('touchstart', e=>{ if (e.touches.length === 2 && phIs() && p.querySelector('.sheet.blankmode')) PHP.pinch = {d:dist(e), k:PHP.k}; }, {passive:true});
    p.addEventListener('touchmove', e=>{ if (!PHP.pinch || e.touches.length !== 2) return; e.preventDefault(); const k = PHP.pinch.k * dist(e) / PHP.pinch.d; PHP.k = Math.min(3.5, Math.max(1, k)); phZoom(false); }, {passive:false});
    p.addEventListener('touchend', ()=>{ if (PHP.pinch){ PHP.pinch = null; phSetK(PHP.k, false); } }, {passive:true});
  } }
if (phoneMQ.addEventListener) phoneMQ.addEventListener('change', ()=>{ try{ if (PAPER) renderPaper(); }catch(e){} });
try{ if (PAPER) renderPaper(); }catch(e){}
/* віконце правки знизу не має закривати рядок, який правимо: підсуваємо аркуш */
function phKeepRowVisible(){
  if (!phIs() || !PE.box || PE.w !== window) return;
  const row = peRows(window)[PE.idx], p = document.getElementById('paper'); if (!row || !p) return;
  const rr = row.getBoundingClientRect(), top = PE.box.getBoundingClientRect().top, pr = p.getBoundingClientRect();
  if (rr.bottom > top - 8) p.scrollTop += rr.bottom - top + 24;
  else if (rr.top < pr.top + 50) p.scrollTop -= pr.top + 50 - rr.top;
}
{ const x0 = peOpen; peOpen = function(){ const r = x0.apply(this, arguments); try{ requestAnimationFrame(phKeepRowVisible); }catch(e){} return r; }; }
