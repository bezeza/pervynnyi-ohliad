/* ===== 0.9.3.121 · індикатор госпіталізації одним рядком (задача 20) =====
   Над списком критеріїв — скільки критеріїв зараз відмічено (aria-pressed).
   autoRules лишається як є: він і далі підказує критерії за даними.
   Якщо лікар зняв підказку (dataset.off), у рахунок вона не входить —
   інакше червоний рядок лишався «(1)», хоча жоден ургентний критерій не відмічено.
   Малює після applyAuto, коли кнопки вже синхронізовані з правилами.
   Клік розгортає або згортає списки критеріїв. У текст документа нічого не додає.
   Слова «амбулаторно» і рекомендацій тут немає — рішення за лікарем.
*/
(function(){
  const KEY = '711-hosp';
  const pressed = f => f && f.chips ? f.chips.filter(c=>c.getAttribute('aria-pressed') === 'true').length : 0;
  function paint(){
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
    const specN = pressed(spec);
    const genN = pressed(gen);
    const open = b.getAttribute('aria-expanded') === 'true';
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
    b.setAttribute('aria-expanded', open ? 'true' : 'false');
  }
  if (typeof applyAuto === 'function'){
    const orig = applyAuto;
    applyAuto = function(){
      const r = orig.apply(this, arguments);
      try { paint(); } catch(e){ if (typeof poErr === 'function') poErr(e, KEY); }
      return r;
    };
  }
  try { paint(); } catch(e){ if (typeof poErr === 'function') poErr(e, KEY); }
})();
