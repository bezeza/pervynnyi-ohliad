/* ===== 0.9.3.118 · «+ ще»: кілька знахідок в одному полі об’єктивного огляду (зауваження лікаря 11.11.2026) =====
   Поле лишається з одним основним вибором (його читають бланк 003/о, щоденник, анестезіолог, критерії, шаблони),
   а «+ ще» додає другий і далі варіанти. Додаткові — у прихованому полі <id>_x («3,5»): зберігаються й відновлюються
   звичайним шляхом (170-patients-db), у текст ідуть через val() — «сухі розсіяні хрипи, вологі … справа».
   Норма в основному виборі («хрипи не вислуховуються») знімає додаткові. Очищення й шаблон хвороби — теж. */
const ALSO_KEYS = ['dyh.hr', 'dyh.ausk', 'dyh.perk', 'ssc.rytm', 'ssc.shum', 'ssc.tony', 'shk.vys', 'shk.lv', 'shk.vena', 'trav.zhyv', 'sech.sv', 'sech.secha'];
function alsoGet(f){ return f.alsoInp ? f.alsoInp.value.split(',').filter(x=>x !== '').map(Number).filter(i=>i >= 0 && i < f.opts.length) : []; }
function alsoSet(f, list){ if (f.alsoInp) f.alsoInp.value = [...new Set(list)].join(','); }
/* «м’який, болючий у правому підребер’ї» після «м’який, болючий в епігастрії» → «болючий у правому підребер’ї»;
   «Сеча каламутна» після «Сеча темна» → «каламутна»; з малої літери посеред речення (крім абревіатур) */
function alsoText(prim, t){
  const p1 = prim.split(', ')[0], t1 = t.split(', ');
  if (t1.length > 1 && t1[0].toLowerCase() === p1.toLowerCase()) t = t1.slice(1).join(', ');
  else { const pw = prim.split(' ')[0], tw = t.split(' '); if (tw.length > 1 && tw[0].toLowerCase() === pw.toLowerCase() && pw.length > 3) t = tw.slice(1).join(' '); }
  return /^[A-ZА-ЯІЇЄҐ]{2}/.test(t) ? t : t.charAt(0).toLowerCase() + t.slice(1);
}
{ const v0 = val; val = function(f, any){
  const r = v0.apply(this, arguments);
  if (!f || !f.alsoInp || f.type !== 'sel' || !r || f.el.value === '') return r;
  const prim = +f.el.value; if (f.norm !== undefined && prim === f.norm) return r;
  const ex = alsoGet(f).filter(i=>i !== prim && i !== f.norm); if (!ex.length) return r;
  return [r, ...ex.map(i=>alsoText(r, OT(f, f.opts[i])))].join(', ');
}; }
function alsoRender(f){
  const prim = f.el.value === '' ? -1 : +f.el.value, isNorm = f.norm !== undefined && prim === f.norm;
  let ex = alsoGet(f);
  if (isNorm && ex.length){ ex = []; alsoSet(f, ex); }
  const fx = ex.filter(i=>i !== prim); if (fx.length !== ex.length){ ex = fx; alsoSet(f, ex); }
  f.alsoBtn.hidden = prim < 0 || isNorm;
  f.alsoBtn.textContent = ex.length ? '+ ще (' + ex.length + ')' : '+ ще';
  f.alsoBtn.setAttribute('aria-expanded', f.alsoOpen ? 'true' : 'false');
  f.alsoBox.hidden = !f.alsoOpen || f.alsoBtn.hidden;
  if (f.alsoBox.hidden) return;
  f.alsoBox.textContent = '';
  f.opts.forEach((o, i)=>{ if (i === prim || i === f.norm) return;
    const on = ex.includes(i);
    f.alsoBox.append(h('button', {type:'button', class:'chip', 'aria-pressed':on ? 'true' : 'false', onclick:()=>{
      const cur = alsoGet(f); alsoSet(f, on ? cur.filter(x=>x !== i) : cur.concat([i])); alsoRender(f); update(); }}, O(o).l)); });
}
function alsoSync(){ ALSO_KEYS.forEach(k=>{ try{ const f = F(k); if (f && f.alsoBtn) alsoRender(f); }catch(e){} }); }
function alsoClear(){ ALSO_KEYS.forEach(k=>{ try{ const f = F(k); if (f && f.alsoInp){ f.alsoInp.value = ''; f.alsoOpen = false; } }catch(e){} }); }
ALSO_KEYS.forEach(k=>{ try{
  const f = F(k); if (!f || f.type !== 'sel' || !f.wrapEl || f.alsoInp) return;
  f.alsoInp = h('input', {type:'hidden', id:f.el.id + '_x', value:''});
  f.alsoBtn = h('button', {type:'button', class:'more also-btn', title:'Додати ще одну знахідку до цього поля', onclick:()=>{ f.alsoOpen = !f.alsoOpen; alsoRender(f); }}, '+ ще');
  f.alsoBox = h('div', {class:'chips also-box', role:'group', 'aria-label':f.label + ': ще знахідки'});
  f.wrapEl.append(f.alsoInp, f.alsoBtn, f.alsoBox);
  f.el.addEventListener('change', ()=>alsoRender(f));
  alsoRender(f);
}catch(e){ poErr(e, '«+ ще»: ' + k); } });
{ const c0 = clearAll; clearAll = function(){ alsoClear(); return c0.apply(this, arguments); }; }
{ const a0 = applyPreset; applyPreset = function(){ alsoClear(); return a0.apply(this, arguments); }; }
onUpdate('704-sel-also', alsoSync);
