/* 0.9.3.39 — ручний текст не замінюється через зміну режиму чи розміру. */
function manualTextStatus(){
  const banner = document.getElementById('banner'); if (banner.hidden === dirty) banner.hidden = !dirty;
  let text = banner.querySelector('[data-manual-status]');
  if (!text){ text = banner.querySelector('span'); text.dataset.manualStatus = '1'; text.setAttribute('role','status'); }
  const message = 'Є ручні зміни. Автоматичне оновлення призупинено; заміна текстом із форми прибере ручні правки й форматування.';
  if (text.textContent !== message) text.textContent = message;
}
// Синхронізація після наявних обробників і відновлення кешу документа.
{ const x0 = update; update = function(){ const r = x0.apply(this, arguments); manualTextStatus(); return r; }; }
let MANUAL_SWITCHING = 0;
{ const x0 = switchDoc; switchDoc = function(){
  const previous = DOC; MANUAL_SWITCHING++; try{ return x0.apply(this, arguments); }
  finally { MANUAL_SWITCHING--; manualTextStatus(); if (!MANUAL_SWITCHING && dirty && previous !== DOC) renderCheck(); }
}; }
{ const x0 = restore; restore = function(){ const r = x0.apply(this, arguments); manualTextStatus(); if (dirty) renderCheck(); return r; }; }
{ const x0 = applyDoc; applyDoc = function(first){
  const keep = !MANUAL_SWITCHING && !RESTORING && dirty ? {doc:DOC, html:document.getElementById('out').innerHTML} : null;
  if (keep) CACHE[keep.doc] = {html:keep.html, dirty:true};
  const r = x0.apply(this, arguments);
  // false використовується й для швидкого режиму; новий тип має інший DOC.
  if ((keep && keep.doc === DOC) || (first && CACHE[DOC] && CACHE[DOC].dirty)){
    const saved = keep && keep.doc === DOC ? keep : CACHE[DOC];
    document.getElementById('out').innerHTML = saved.html; dirty = true;
    renderCheck();
  }
  manualTextStatus(); return r;
}; applyDoc.bound = x0.bound; }
document.getElementById('out').addEventListener('input', manualTextStatus);
document.querySelector('.fmt').addEventListener('click', ()=>{ manualTextStatus(); autosave(); });
document.getElementById('fsize').addEventListener('change', ()=>{ manualTextStatus(); autosave(); });
{ const button = document.getElementById('regen'), x0 = button.onclick; button.onclick = function(){
  if (dirty && !confirm('Замінити текст даними з форми? Ручні правки та форматування буде замінено. Дію можна скасувати.')) return;
  if (dirty) undoPush('оновлення тексту з форми');
  const r = x0.apply(this,arguments); manualTextStatus(); return r;
}; }
manualTextStatus();
