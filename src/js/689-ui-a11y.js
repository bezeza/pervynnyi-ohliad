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
/* телефон: нижні смужки (текст розділу + вкладки) закривали низ сторінки — підвал з версією й контактами було не догортати.
   Відступ знизу тепер дорівнює їхній справжній висоті (з урахуванням вирізу екрана). */
function v2BotPad(){
  let top = window.innerHeight;
  ['.phtabs', '#liveBar'].forEach(s=>{ const e = document.querySelector(s); if (!e || !e.offsetHeight) return; const cs = getComputedStyle(e); if (cs.position !== 'fixed' || cs.display === 'none' || cs.visibility === 'hidden') return;
    const r = e.getBoundingClientRect(); if (r.bottom >= window.innerHeight - 2 || r.bottom >= top - 2) top = Math.min(top, r.top); });
  const v = Math.max(0, Math.round(window.innerHeight - top));
  document.documentElement.style.setProperty('--v2bot', v + 'px');
}
{ let q = 0; const later = () => { if (!q) q = requestAnimationFrame(()=>{ q = 0; try{ v2BotPad(); }catch(e){} }); };
  window.addEventListener('resize', later); try{ const ro = new ResizeObserver(later); ['#liveBar', '.phtabs'].forEach(s=>{ const e = document.querySelector(s); if (e) ro.observe(e); }); }catch(e){}
  const up0 = update; update = function(){ const r = up0.apply(this, arguments); later(); return r; }; later(); }
