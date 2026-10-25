/* ===== 0.9.3.57 — телефон: документ угорі, варіанти внизу (розділений екран з межею, яку тягнете пальцем) =====
   Коли відкрито віконце правки (бланк — «Вносити на бланку»; щоденник на бланку; клік по фразі в тексті),
   на телефоні воно стає нижньою частиною екрана, а документ лишається видимим над ним і стискається під неї.
   Межу між ними можна тягнути (висота запам’ятовується). Наступний рядок — просто натиснути його в документі
   або «Далі ›» — панель лишається на місці, змінюються лише варіанти. */
const PHS = { h:0.45, drag:null };
try{ const v = +localStorage.getItem('po.phsplit'); if (v >= 0.2 && v <= 0.85) PHS.h = v; }catch(e){}
const PHS_SEL = '.pe-box, .diary-inline-editor, .qe';
function phsApply(){
  const on = isPhone() && !!document.querySelector(PHS_SEL);
  document.body.classList.toggle('ph-split', on);
  document.documentElement.style.setProperty('--phs', Math.round(PHS.h * window.innerHeight) + 'px');
  if (!on) return;
  { const p = document.querySelector('#outBox[data-ov="paper"] #paper') || document.querySelector('#outBox #out'); if (p) document.documentElement.style.setProperty('--phtop', Math.max(0, Math.round(p.getBoundingClientRect().top)) + 'px'); }
  document.querySelectorAll(PHS_SEL).forEach(box=>{
    if (box.querySelector(':scope > .phs-grip')) return;
    const g = h('div', {class:'phs-grip', role:'separator', 'aria-orientation':'horizontal', 'aria-label':'Межа між документом і варіантами — тягніть, щоб змінити розмір', tabindex:'0'}, h('span', {}));
    g.addEventListener('pointerdown', e=>{ e.preventDefault(); g.setPointerCapture(e.pointerId); PHS.drag = {y:e.clientY, h:PHS.h}; document.body.classList.add('phs-dragging'); });
    g.addEventListener('pointermove', e=>{ if (!PHS.drag) return; PHS.h = Math.min(0.85, Math.max(0.2, PHS.drag.h + (PHS.drag.y - e.clientY) / window.innerHeight)); phsApply(); });
    const end = () => { if (!PHS.drag) return; PHS.drag = null; document.body.classList.remove('phs-dragging'); try{ localStorage.setItem('po.phsplit', PHS.h.toFixed(3)); }catch(e){} phsKeep(); };
    g.addEventListener('pointerup', end); g.addEventListener('pointercancel', end);
    g.addEventListener('keydown', e=>{ if (e.key === 'ArrowUp' || e.key === 'ArrowDown'){ e.preventDefault(); PHS.h = Math.min(0.85, Math.max(0.2, PHS.h + (e.key === 'ArrowUp' ? 0.05 : -0.05))); phsApply(); try{ localStorage.setItem('po.phsplit', PHS.h.toFixed(3)); }catch(x){} } });
    box.prepend(g);
  });
}
/* рядок, який правимо, — видно над панеллю */
function phsKeep(){
  if (!isPhone()) return;
  const box = document.querySelector(PHS_SEL); if (!box) return;
  const row = document.querySelector('#paper .pe-active, #paper .diary-edit-active') || (typeof QE !== 'undefined' && QE.f && QE.f.wrapEl ? null : null);
  const sc = document.getElementById('paper'); if (!row || !sc) return;
  const top = box.getBoundingClientRect().top, r = row.getBoundingClientRect(), pr = sc.getBoundingClientRect();
  if (r.bottom > top - 8) sc.scrollTop += r.bottom - top + 24; else if (r.top < pr.top + 8) sc.scrollTop -= pr.top + 8 - r.top;
}
new MutationObserver(()=>{ try{ phsApply(); requestAnimationFrame(phsKeep); }catch(e){} }).observe(document.body, {childList:true});
addEventListener('resize', ()=>{ try{ phsApply(); }catch(e){} });
phsApply();
