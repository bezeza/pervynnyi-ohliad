/* 0.9.3.37 — короткий виклад наявної перевірки біля копіювання. */
const COPY_PEEK = h('div', {id:'copyPeek', class:'copy-peek', hidden:'', 'aria-label':'Перевірка перед копіюванням'});
const COPY_FOOT = document.querySelector('#outBox .ofoot'); if (COPY_FOOT) COPY_FOOT.before(COPY_PEEK);
function copyPeekRender(){
  const items = itext(document.getElementById('out')).trim() ? checkDoc() : []; COPY_PEEK.replaceChildren(); COPY_PEEK.hidden = !items.length;
  if (!items.length) return;
  COPY_PEEK.append(h('div', {class:'copy-peek-head'}, h('strong', {}, 'Перед копіюванням'),
    h('button', {type:'button', class:'more', onclick:()=>{ SHELL.setOV('chk'); goDone(); }}, 'Усі зауваження: ' + items.length)));
  items.slice(0,2).forEach(item=>COPY_PEEK.append(h('button', {type:'button', class:'copy-peek-item', onclick:()=>{
    if (item.tab) progressJump(item); else { SHELL.setOV('chk'); goDone(); }
  }}, item.m)));
  if (dirty) COPY_PEEK.append(h('small', {}, 'Перевірка враховує поля форми. Звірте також ручні правки.'));
}
{ const x0 = renderCheck; renderCheck = function(){ const r = x0.apply(this, arguments); copyPeekRender(); return r; }; }
document.getElementById('out').addEventListener('input', copyPeekRender);
copyPeekRender();
