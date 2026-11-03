/* ===== 0.9.3.79 — стиль «Apple»: однакові елементи для схожих виборів =====
   Правило: короткі варіанти — «пігулками» в рядок (як було); довгі варіанти — списком рядків із кружечком
   (один вибір) або квадратиком (кілька), а не стовпчиком великих «пігулок»; випадні списки до 8 варіантів —
   теж списком рядків: вибір одним натисканням, без повтору вибраного тексту сірим під полем.
   Списки на 9+ варіантів лишаються випадними. «Класичний» стиль — як було.
   Прихований <select> лишається джерелом даних: збереження, перевірки, шаблони працюють як завжди. */
const UIL = {built:[], tagged:[]};
const uilAvg = f => { const L = (f.opts || []).map(o=>String(O(o).l).length); return L.length ? L.reduce((a, b)=>a + b, 0) / L.length : 0; };
function uilListFor(f){
  if (f.type !== 'sel' || f.headOnly || !f.el || f.seg || f.noChips || !f.opts || f.opts.length < 2 || f.opts.length > 8) return;
  const box = h('div', {class:'segbtns seglist uil', role:'radiogroup', 'aria-label':f.label || ''});
  const lab = i => { const o = f.el.options[i + (f.el.options[0] && f.el.options[0].value === '' ? 1 : 0)]; return o ? o.textContent : String(O(f.opts[i]).l); };
  const sync = () => [...box.children].forEach((b, i)=>{ const on = f.el.value === String(i); b.setAttribute('aria-pressed', on ? 'true' : 'false'); b.classList.toggle('abn', on && f.norm !== undefined && i !== f.norm); });
  f.opts.forEach((o, i)=>box.append(h('button', {type:'button', class:'chip sg', onclick:()=>{ f.el.value = f.el.value === String(i) ? '' : String(i); f.el.dispatchEvent(new Event('change', {bubbles:true})); sync(); }}, lab(i))));
  { const sf = f.el.nextElementSibling; if (sf && sf.classList.contains('selfull')) sf.remove(); }
  f.el.classList.add('seg-hidden'); f.el.after(box); f.seg = sync; f._uil = {box, sync}; f.el.addEventListener('change', sync); sync();
  UIL.built.push(f);
}
function uilUnbuild(f){
  const u = f._uil; if (!u) return;
  u.box.remove(); f.el.removeEventListener('change', u.sync); f.el.classList.remove('seg-hidden'); f.seg = undefined; f._uil = undefined;
  try{ mark(f.el, f); }catch(e){}
}
function uilApply(){
  const on = typeof UISTYLE !== 'undefined' && UISTYLE === 'ios';
  if (on){
    SECTIONS.forEach(s=>s.fields.forEach(f=>{
      if (f.type === 'sel' && f.seg && !f._uil){ const box = f.el && f.el.nextElementSibling; if (box && box.classList.contains('segbtns') && uilAvg(f) > 22 && !box.classList.contains('seglist')){ box.classList.add('seglist'); UIL.tagged.push(box); } }
      else if (f.type === 'sel' && !f.seg) uilListFor(f);
      else if (f.type === 'multi' && !f.search && f.chips && f.chips.length > 1 && uilAvg(f) > 24){ const c = f.chips[0].parentElement; if (c && !c.classList.contains('chiplist')){ c.classList.add('chiplist'); UIL.tagged.push(c); } }
    }));
  } else {
    UIL.built.splice(0).forEach(uilUnbuild);
    UIL.tagged.splice(0).forEach(b=>b.classList.remove('seglist', 'chiplist'));
  }
}
{ const x0 = uiStyleApply; uiStyleApply = function(){ const r = x0.apply(this, arguments); try{ uilApply(); }catch(e){} return r; }; }
/* поле, перебудоване іншим модулем (напр., «Результат лікування» з новим варіантом), — ще раз за правилом */
{ const x0 = update; update = function(){ const r = x0.apply(this, arguments); try{ if (UISTYLE === 'ios') uilApply(); }catch(e){} return r; }; }
try{ uilApply(); }catch(e){}
