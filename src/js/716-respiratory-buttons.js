/* ===== 0.9.3.135 — «Хрипи» кнопками, коротка норма без дубльованих варіантів =====
   Основний список хрипів показує шість найуживаніших варіантів кнопками.
   Рідші варіанти залишаються в наявному «+ ще»; значення й індекси поля не змінюються.
   У полі короткої норми три синонімічні варіанти згорнуті до одного основного,
   а два альтернативні доступні під «+ ще». Збережені значення пацієнтів сумісні. */

{
  const f = F('dyh.hr');
  if (f && f.type === 'sel' && f.el && !f.seg && typeof segFor === 'function') {
    const opts = f.opts;
    try { f.opts = opts.slice(0, 6); segFor(f); }
    finally { f.opts = opts; }
    const box = f.el.nextElementSibling;
    if (box && box.classList.contains('segbtns')) {
      f.currentLabel = h('div', {class:'selfull resp-current', hidden:''});
      box.after(f.currentLabel);
    }
    /* У «+ ще» залишаються лише чотири варіанти, які не вмістилися в короткі кнопки. */
    if (typeof alsoRender === 'function') {
      const a0 = alsoRender;
      alsoRender = function(field){
        const r = a0.apply(this, arguments);
        if (field !== f || !field.alsoBox) return r;
        const prim = field.el.value === '' ? -1 : +field.el.value;
        const indices = field.opts.map((_, i)=>i).filter(i=>i !== prim && i !== field.norm);
        [...field.alsoBox.children].forEach((button, i)=>{ button.hidden = indices[i] < 6; });
        if (field.currentLabel) {
          const long = prim >= 6;
          field.currentLabel.hidden = !long;
          field.currentLabel.textContent = long ? O(field.opts[prim]).l : '';
        }
        return r;
      };
      alsoRender(f);
    }
  }
}

/* Коротка норма: один видимий варіант, дві рівнозначні редакції — у «+ ще».
   У DOM і в збережених даних лишаються всі три початкові індекси. */
{
  const f = F('dyh.bo');
  if (f && f.type === 'sel' && f.el && f.opts.length === 3) {
    const old = f.el.nextElementSibling;
    if (old && old.classList.contains('segbtns')) old.remove();
    const ui = h('div', {class:'resp-bo'});
    const primary = h('button', {type:'button', class:'chip sg resp-bo-primary', 'aria-pressed':'false'});
    const more = h('button', {type:'button', class:'more resp-bo-more', 'aria-expanded':'false'}, '+ ще');
    const choices = h('div', {class:'chips resp-bo-choices', role:'group', 'aria-label':'Інші формулювання норми', hidden:''});
    const sync = () => {
      const selected = f.el.value === '' ? -1 : +f.el.value;
      const shown = selected < 0 ? 0 : selected;
      primary.textContent = O(f.opts[shown]).l;
      primary.setAttribute('aria-pressed', selected >= 0 ? 'true' : 'false');
      choices.textContent = '';
      f.opts.forEach((option, i)=>{
        if (i === shown) return;
        choices.append(h('button', {type:'button', class:'chip', 'aria-pressed':'false', onclick:()=>{
          f.el.value = String(i);
          f.el.dispatchEvent(new Event('change', {bubbles:true}));
          choices.hidden = true; more.setAttribute('aria-expanded','false');
          update();
        }}, O(option).l));
      });
    };
    primary.addEventListener('click', ()=>{
      f.el.value = f.el.value === '0' ? '' : '0';
      f.el.dispatchEvent(new Event('change', {bubbles:true}));
      update();
    });
    more.addEventListener('click', ()=>{
      choices.hidden = !choices.hidden;
      more.setAttribute('aria-expanded', choices.hidden ? 'false' : 'true');
    });
    f.el.after(ui);
    ui.append(primary, more, choices);
    f.el.addEventListener('change', sync);
    f.seg = sync;
    sync();
  }
}
