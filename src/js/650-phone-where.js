/* ===== 0.9.3.59 — телефон: «де працюю і хто я» видно завжди =====
   На телефоні верхня шапка (перемикач «Стаціонар / Амбулаторно» і кнопка профілю) схована — тож режим
   не було видно і не було як перемкнути. Тепер:
   • під рядком пацієнта — рядок «🫁 Пульмонолог · Стаціонар ▾»; натиснули — знизу панель:
     «Стаціонар | Амбулаторно» і «Змінити спеціальність…»;
   • те саме — першим блоком у «⋯ Документ і дії»;
   • якщо в профілі лише стаціонар або лише поліклініка — перемикача немає, лише напис і «змінити в профілі». */
const phwWork = () => { const P = profNow(); return P ? (PROF.w || P.work || 'both') : 'both'; };
const phwMode = () => MODE === 'amb' ? 'Амбулаторно' : 'Стаціонар';
function phwSetMode(m){
  if (m === MODE) return;
  const b = document.querySelector(`#modeSeg [data-mode="${m}"]`); if (b) b.click();
  phwRender();
}
/* блок «Де працюю / Лікар» — для панелі й для «⋯» */
function phwBlock(close){
  const P = profNow(), w = phwWork();
  const box = h('div', {class:'phw-block'});
  box.append(h('h3', {class:'as-h'}, 'Де працюю'));
  if (w === 'both') box.append(h('div', {class:'seg phw-seg', role:'group', 'aria-label':'Де працюю'},
    ...[['hosp', 'Стаціонар'], ['amb', 'Амбулаторно']].map(([k, l])=>h('button', {type:'button', 'aria-pressed':MODE === k ? 'true' : 'false', onclick:()=>{ close(); phwSetMode(k); }}, l))));
  else box.append(h('p', {class:'phw-fix'}, h('b', {}, phwMode()), ' — за профілем (', WORKS[w][0].toLowerCase(), '). Працюєте і там, і там — змініть у профілі.'));
  box.append(h('h3', {class:'as-h'}, 'Лікар'),
    h('div', {class:'as-list'}, h('button', {type:'button', class:'btn', onclick:()=>{ close(); profileDialog(false); }},
      P ? P.ic + ' ' + P.n + ' — змінити спеціальність…' : '👤 Обрати спеціальність…')));
  return box;
}
function phwSheet(){
  if (document.querySelector('.phw-sheet')) return;
  const sh = h('div', {class:'navsheet actsheet phw-sheet', role:'dialog', 'aria-modal':'true', 'aria-label':'Де працюю і лікар'});
  const close = () => { sh.remove(); document.body.style.overflow = ''; };
  sh.append(h('div', {class:'nshead'}, h('b', {}, 'Де працюю і лікар'), h('button', {type:'button', class:'btn', onclick:close}, 'Закрити ✕')), phwBlock(close));
  sh.addEventListener('click', e=>{ if (e.target === sh) close(); });
  sh.addEventListener('keydown', e=>{ if (e.key === 'Escape') close(); });
  document.body.append(sh); document.body.style.overflow = 'hidden';
  const f = sh.querySelector('[aria-pressed="true"], .as-list .btn'); if (f) f.focus();
}
const PHW_ROW = h('button', {type:'button', class:'phwhere', 'aria-haspopup':'dialog', onclick:phwSheet});
function phwRender(){
  const line = $('#ptline'); if (!line) return;
  if (!isPhone()){ PHW_ROW.remove(); return; }
  if (PHW_ROW.previousElementSibling !== line) line.after(PHW_ROW);
  const P = profNow();
  PHW_ROW.replaceChildren(
    h('span', {class:'phw-who'}, P ? P.ic + ' ' + P.n : '👤 Профіль не обрано'),
    h('span', {class:'phw-dot', 'aria-hidden':'true'}, '·'),
    h('span', {class:'phw-mode phw-' + MODE}, phwMode()),
    h('span', {class:'phw-dd', 'aria-hidden':'true'}, '▾'));
  PHW_ROW.setAttribute('aria-label', (P ? P.n : 'Профіль не обрано') + ', ' + phwMode() + '. Змінити');
}
{ const x0 = renderProfBtn; renderProfBtn = function(){ const r = x0.apply(this, arguments); try{ phwRender(); }catch(e){} return r; }; }
{ const x0 = applyMode; applyMode = function(){ const r = x0.apply(this, arguments); try{ phwRender(); }catch(e){} return r; }; }
document.querySelectorAll('#modeSeg button').forEach(b=>b.addEventListener('click', ()=>setTimeout(()=>{ try{ phwRender(); }catch(e){} }, 0)));
if (window.matchMedia) matchMedia('(max-width:899px)').addEventListener('change', ()=>{ try{ phwRender(); }catch(e){} });
/* «⋯ Документ і дії»: першим блоком */
{ const x0 = openActs; openActs = function(){ const r = x0.apply(this, arguments);
  const sh = document.querySelector('.actsheet:not(.phw-sheet)'), hd = sh && sh.querySelector('.nshead');
  if (hd) hd.after(phwBlock(()=>{ sh.remove(); document.body.style.overflow = ''; }));
  return r; }; }
phwRender();
