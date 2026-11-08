/* ===== 0.10, вади з плану: підписи полів для екранного читача =====
   Поле без підпису (напр., «Пошук за ПІБ або № карти») отримує aria-label з підказки в полі. */
function v2a11yLabels(root){
  (root || document).querySelectorAll('input:not([type=hidden]):not([type=checkbox]):not([type=radio]):not([aria-label]):not([aria-labelledby]), textarea:not([aria-label]):not([aria-labelledby])').forEach(e=>{
    if (e.title || e.closest('label') || (e.id && document.querySelector('label[for="' + CSS.escape(e.id) + '"]'))) return;
    const t = (e.placeholder || '').replace(/[.…]+$/, '').trim(); if (t) e.setAttribute('aria-label', t);
  });
}
try{ v2a11yLabels(); }catch(e){}
{ const rp0 = renderPatients; renderPatients = function(){ const r = rp0.apply(this, arguments); try{ v2a11yLabels(); }catch(e){} return r; }; }
