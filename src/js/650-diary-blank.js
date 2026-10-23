/* ===== Щоденник: пункти бланка 003/о, що були лише порожніми рядками (0.9.3.36) =====
   Лімфатичні вузли, дихання через ніс, грудна клітка, перкусія, язик, печінка, симптом Пастернацького —
   тепер поля щоденника («Інші пункти щоденника»). На бланку клік по рядку відкриває вибір варіанта. */
document.addEventListener('click', e=>{
  const g = e.target.closest && e.target.closest('#paper .bdi.bcur [data-dsel]'); if (!g) return;
  e.preventDefault(); e.stopImmediatePropagation();
  const key = g.dataset.dsel, f = F(key); if (!f) return;
  qeOpen(f, key.split('.')[0], g);
}, true);
/* поле, винесене у віконце швидкої правки, теж зберігається в запис щоденника */
{ const df0 = diaryFields; diaryFields = function(){ const r = df0.apply(this, arguments);
  try{ if (QE.box && QE.f && QE.f.wrapEl && QE.f.wrapEl.closest('.qe')){
    QE.f.wrapEl.querySelectorAll('input[id], select[id], textarea[id]').forEach(e=>{ r.f[e.id] = e.value; });
    QE.f.wrapEl.querySelectorAll('.chip[id][aria-pressed="true"]').forEach(b=>{ r.c[b.id] = 1; }); } }catch(e){}
  return r; }; }
/* після вибору у віконці — оновити бланк */
document.addEventListener('change', e=>{ if (PAPER && e.target.closest && e.target.closest('.qe')) setTimeout(()=>{ try{ renderPaper(); }catch(x){} }, 0); });
/* вибраний варіант у полі без «норми» (лімфовузли, перкусія, неврологічно…) — це дані: поле не ховається профілем щоденника і йде в текст */
{ const dh0 = dHasData; dHasData = function(f){ if (f && f.type === 'sel' && f.norm === undefined && f.el && f.el.value !== '') return true; return dh0.apply(this, arguments); }; }
