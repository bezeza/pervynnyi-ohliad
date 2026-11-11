/* ===== 0.9.3.121 · індикатор госпіталізації одним рядком (задача 20) =====
   Над списком критеріїв — один підсумок з результату autoRules().
   Логіку autoRules не змінює: лише обгортає і читає spec / gen.
   Клік розгортає або згортає списки критеріїв. У текст документа нічого не додає.
   Слова «амбулаторно» і рекомендацій тут немає — рішення за лікарем.
*/
(function(){
  const KEY = '711-hosp';
  function paint(r){
    const spec = (typeof F === 'function') && F('hosp.spec');
    const gen = (typeof F === 'function') && F('hosp.gen');
    if (!spec || !spec.wrapEl || !spec.cbox) return;
    let b = spec.wrapEl.querySelector('.hosp-ind');
    if (!b){
      b = h('button', {type:'button', class:'hosp-ind grey', 'aria-expanded':'false'});
      b.addEventListener('click', () => {
        const open = b.getAttribute('aria-expanded') !== 'true';
        b.setAttribute('aria-expanded', open ? 'true' : 'false');
        [spec, gen].forEach(f => { if (f && f.wrapEl) f.wrapEl.classList.toggle('hosp-fold', !open); });
      });
      spec.cbox.before(b);
      spec.wrapEl.classList.add('hosp-fold');
      if (gen && gen.wrapEl) gen.wrapEl.classList.add('hosp-fold');
    }
    const specN = r && r.spec && typeof r.spec.size === 'number' ? r.spec.size : 0;
    const genN = r && r.gen && typeof r.gen.size === 'number' ? r.gen.size : 0;
    if (specN){
      b.textContent = 'Є критерії ургентної госпіталізації (' + specN + ')';
      b.className = 'hosp-ind bad';
    } else if (genN){
      b.textContent = 'Є загальні критерії (' + genN + ')';
      b.className = 'hosp-ind warn';
    } else {
      b.textContent = 'Критеріїв за введеними даними не знайдено';
      b.className = 'hosp-ind grey';
    }
  }
  if (typeof autoRules === 'function'){
    const orig = autoRules;
    autoRules = function(){
      const r = orig.apply(this, arguments);
      try { paint(r); } catch(e){ if (typeof poErr === 'function') poErr(e, KEY); }
      return r;
    };
    try { autoRules(); } catch(e){ if (typeof poErr === 'function') poErr(e, KEY); }
  }
})();
