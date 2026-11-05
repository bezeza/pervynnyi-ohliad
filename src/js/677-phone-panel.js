/* ===== 0.9.3.91 — панель варіантів на телефоні =====
   1. Межа «документ / варіанти» (648) після відпускання стає в одне з трьох положень:
      третина, половина або майже весь екран. Подвійний дотик по межі — майже весь екран і назад.
   2. Телефон боком (невисокий екран): документ ліворуч, варіанти праворуч на всю висоту.
      На широкому телефоні (понад 899 px, де форма й аркуш стоять поруч) — варіанти ліворуч, поверх форми.
   3. Віконце «Вносити на бланку»: кнопка «Норма» — норма в розділі одним дотиком,
      якщо в цьому рядку є пункти з нормою; «↶ Скасувати» у віконці її повертає. */
const PHP_SNAP = [0.33, 0.5, 0.85];
const PHPN = { prev:0.5, down:null, lastTap:0 };
const phpLandMQ = window.matchMedia ? matchMedia('(orientation:landscape) and (max-height:540px)') : null;
function phpLand(){ return !!(phpLandMQ && phpLandMQ.matches); }
function phpSave(){ try{ localStorage.setItem('po.phsplit', PHS.h.toFixed(3)); }catch(e){} }
function phpSnap(){
  let best = PHP_SNAP[0]; PHP_SNAP.forEach(v=>{ if (Math.abs(v - PHS.h) < Math.abs(best - PHS.h)) best = v; });
  PHS.h = best; phsApply(); phpSave(); try{ phsKeep(); }catch(e){}
}
function phpToggleFull(){
  if (PHS.h >= 0.8){ PHS.h = PHPN.prev >= 0.8 ? 0.5 : PHPN.prev; } else { PHPN.prev = PHS.h; PHS.h = 0.85; }
  phsApply(); phpSave(); try{ phsKeep(); }catch(e){}
}
function phpWireGrip(g){
  if (!g || g._php) return; g._php = 1;
  g.title = 'Тягніть межу або торкніться двічі — на весь екран і назад';
  g.addEventListener('pointerdown', e=>{ PHPN.down = {y:e.clientY, t:Date.now()}; });
  const end = e=>{
    const d = PHPN.down; PHPN.down = null; if (!d) return;
    const moved = Math.abs((e.clientY || d.y) - d.y) > 8;
    if (moved){ PHPN.lastTap = 0; phpSnap(); return; }
    const now = Date.now();
    if (now - PHPN.lastTap < 350){ PHPN.lastTap = 0; phpToggleFull(); } else PHPN.lastTap = now;
  };
  g.addEventListener('pointerup', end); g.addEventListener('pointercancel', ()=>{ PHPN.down = null; });
  g.addEventListener('dblclick', e=>{ e.preventDefault(); if (!PHPN.lastTap) return; PHPN.lastTap = 0; phpToggleFull(); });
}
{ const x0 = phsApply; phsApply = function(){
  const r = x0.apply(this, arguments);
  try{
    const open = !!document.querySelector(PHS_SEL), land = phpLand() && open;
    document.body.classList.toggle('ph-land', land);
    document.body.classList.toggle('ph-land-wide', land && !isPhone());
    if (land){ const p = document.querySelector('#outBox[data-ov="paper"] #paper') || document.querySelector('#outBox #out');
      if (p) document.documentElement.style.setProperty('--phtop', Math.max(0, Math.round(p.getBoundingClientRect().top)) + 'px'); }
    document.querySelectorAll(PHS_SEL + ' > .phs-grip').forEach(phpWireGrip);
  }catch(e){}
  return r;
}; }
try{ if (phpLandMQ) phpLandMQ.addEventListener('change', ()=>{ try{ phsApply(); phsKeep(); }catch(e){} }); }catch(e){}

/* ---- «Норма» у віконці бланка ---- */
function phpNormSecs(items){
  const out = [];
  (items || []).forEach(it=>{ const f = it.f; if (!f || f.type !== 'sel' || f.norm === undefined) return;
    const s = SECTIONS.find(x=>x.fields.includes(f)); if (s && !out.includes(s)) out.push(s); });
  return out.slice(0, 2);
}
{ const x0 = peOpen; peOpen = function(w, row){
  const r = x0.apply(this, arguments);
  try{
    if (r && PE.box){
      const secs = phpNormSecs(peItems(peRowKeys(row) || [])), acts = PE.box.querySelector('.pe-acts'), undoB = acts && acts.querySelector('.pe-undo');
      secs.forEach(s=>{
        const d = PE.box.ownerDocument;
        const b = peEl(d, 'button', {type:'button', class:'pe-btn pe-norm', title:'Норма в усьому розділі «' + (s.title || s.short) + '»', onclick:()=>{
          applyNorm(s); PE.undo = UNDO.at(-1); if (typeof POP_INSERT !== 'undefined') POP_INSERT.undo = PE.undo;
          try{ update(); }catch(e){} peAfter(); }}, secs.length > 1 ? 'Норма: ' + (s.short || s.title) : 'Норма');
        if (undoB) undoB.before(b); else if (acts) acts.append(b);
      });
    }
  }catch(e){}
  return r;
}; }
/* боком панель займає всю висоту — рядок, який правимо, тримаємо у верхній третині видимого аркуша */
{ const x0 = phsKeep; phsKeep = function(){
  if (!document.body.classList.contains('ph-land') || document.body.classList.contains('ph-land-wide')) return x0.apply(this, arguments);
  const row = document.querySelector('#paper .pe-active, #paper .diary-edit-active'), sc = document.getElementById('paper');
  if (!row || !sc) return;
  const r = row.getBoundingClientRect(), pr = sc.getBoundingClientRect();
  if (r.top < pr.top + 8 || r.bottom > pr.bottom - 8) sc.scrollTop += r.top - pr.top - Math.max(8, pr.height / 3);
}; }
/* лише при відкритті й «Далі ›», щоб не заважати гортати аркуш пальцем */
{ const x0 = peOpen; peOpen = function(){ const r = x0.apply(this, arguments); try{ if (r && document.body.classList.contains('ph-land')) requestAnimationFrame(()=>{ try{ phsKeep(); }catch(e){} }); }catch(e){} return r; }; }
