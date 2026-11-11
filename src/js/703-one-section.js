/* ===== 0.9.3.116 · розділи по одному на екрані (зауваження лікаря 10.11.2026) =====
   Огляд однією сторінкою займав ~20 екранів. Тепер за замовчуванням видно лише обраний розділ
   (619-onepage.js, OPG.on = false), унизу «‹ попередній» і «Далі ›». Перемикач — «Вигляд» → «Розділи»
   (і, як і раніше, «Налаштування» → «Розділи форми»). Alt+↓ / Alt+↑ — наступний / попередній розділ. */
function oneSecSet(on){
  OPG.on = !!on; try{ localStorage.setItem('po.onepage', on ? '1' : '0'); }catch(e){}
  const sel = document.getElementById('set_onepage'); if (sel) sel.value = on ? '1' : '0';
  try{ opApply(); }catch(e){ poErr(e, 'розділи: перемикання'); }
  try{ renderViewCtl(); }catch(e){}
}
{ const x0 = viewCtl; viewCtl = function(){
  const box = x0.apply(this, arguments);
  try{ box.append(h('div', {class:'vrow'}, h('span', {class:'vl'}, 'Розділи'), h('div', {class:'vseg', role:'group', 'aria-label':'Як показувати розділи форми'},
    ...[[false, 'По одному', 'Лише обраний розділ, унизу «Далі ›» (Alt+↓)'], [true, 'Однією сторінкою', 'Усі розділи підряд, прокручуванням']].map(([on, l, t])=>
      h('button', {type:'button', 'aria-pressed':OPG.on === on ? 'true' : 'false', title:t, onclick:()=>oneSecSet(on)}, l))))); }catch(e){ poErr(e, 'розділи: меню «Вигляд»'); }
  return box; }; }
try{ const sel = document.getElementById('set_onepage'); if (sel) sel.addEventListener('change', ()=>{ try{ renderViewCtl(); }catch(e){} }); }catch(e){}
try{ if (typeof FS_SET_KEYS !== 'undefined' && !FS_SET_KEYS.includes('po.onepage')) FS_SET_KEYS.push('po.onepage'); }catch(e){}
document.addEventListener('keydown', e=>{
  if (!e.altKey || e.ctrlKey || e.metaKey || e.shiftKey || (e.key !== 'ArrowDown' && e.key !== 'ArrowUp')) return;
  if (e.target && e.target.tagName === 'SELECT') return;
  const seq = tabOrder().filter(i=>!TOOL_TABS.includes(TABS[i].id)), k = seq.indexOf(active);
  const n = seq[k + (e.key === 'ArrowDown' ? 1 : -1)]; if (k < 0 || n === undefined) return;
  e.preventDefault(); show(n);
});
try{ renderViewCtl(); }catch(e){}
