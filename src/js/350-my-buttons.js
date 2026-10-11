/* ===== Свої кнопки-фрази (як у С.О.П.О.Р.): кнопка вставляє свій текст у текстове поле вкладки ===== */
function myBtnTargets(s){ return s.fields.filter(f=>f.type === 'text' && !f.noOut); }
function myBtnInsert(b){
  const s = SECTIONS.find(x=>x.id === b.sec); if (!s) return; const f = s.fields.find(x=>x.id === b.field) || myBtnTargets(s).slice(-1)[0]; if (!f || !f.el) return;
  const cur = f.el.value.trim(); f.el.value = (cur ? cur + (/[.!?]$/.test(cur) ? ' ' : (f.sep || ' ')) : '') + b.text; f.el.dispatchEvent(new Event('input')); update();
}
function renderMyBtns(){
  SECTIONS.forEach(s=>{
    if (!s.myBox) return; const list = (CUSTOM.btns || []).filter(b=>b.sec === s.id);
    s.myBox.innerHTML = ''; s.myBox.hidden = !list.length && !s.myForm;
    if (s.myForm) s.myBox.append(s.myForm);
    if (!list.length) return;
    const row = h('div', {class:'chips'});
    list.forEach(b=>{
      const x = h('button', {type:'button', class:'chip-x', title:'Видалити кнопку', 'aria-label':'Видалити кнопку ' + b.label}, '×');
      x.addEventListener('click', ()=>{ if (!x.dataset.arm){ x.dataset.arm = '1'; x.textContent = 'точно?'; setTimeout(()=>{ delete x.dataset.arm; x.textContent = '×'; }, 3000); return; } CUSTOM.btns = CUSTOM.btns.filter(y=>y !== b); saveCustom(); renderMyBtns(); });
      row.append(h('span', {class:'chip mytpl mybtn', title:b.text}, h('button', {type:'button', class:'chip-in', onclick:()=>myBtnInsert(b)}, '＋ ' + b.label), x));
    });
    s.myBox.append(h('div', {class:'lbl'}, 'Мої кнопки'), row);
  });
}
function myBtnForm(s){
  if (s.myForm){ s.myForm = null; renderMyBtns(); return; }
  const T = myBtnTargets(s);
  const lab = h('input', {placeholder:'напр., Набряк гомілок', 'aria-label':'Напис на кнопці'});
  const txt = h('textarea', {rows:3, placeholder:'Текст, який вставить кнопка. Для роду: [набряклий|набрякла]', 'aria-label':'Текст для вставки'});
  const fs = h('select', {'aria-label':'Куди вставляти'}); T.forEach(f=>fs.append(h('option', {value:f.id}, f.label.replace(/\s*\(.*$/, '')))); fs.value = T.slice(-1)[0].id;
  const save = () => { const l = lab.value.trim(), t = txt.value.trim(); if (!l || !t){ toast('Впишіть напис і текст кнопки'); return; }
    CUSTOM.btns = CUSTOM.btns || []; CUSTOM.btns.push({sec:s.id, field:fs.value, label:l, text:t}); saveCustom(); s.myForm = null; renderMyBtns(); toast('Кнопку «' + l + '» додано'); };
  s.myForm = h('div', {class:'pt myform'}, h('h3', {}, 'Своя кнопка для вкладки «' + s.title + '»'),
    h('div', {class:'grid'}, h('div', {class:'f'}, h('label', {}, 'Напис на кнопці'), lab), h('div', {class:'f'}, h('label', {}, 'Куди вставляти'), fs), h('div', {class:'f wide'}, h('label', {}, 'Текст'), txt)),
    h('div', {class:'acts2', style:'margin-top:8px'}, h('button', {type:'button', class:'btn primary', onclick:save}, 'Зберегти кнопку'), h('button', {type:'button', class:'more', onclick:()=>{ s.myForm = null; renderMyBtns(); }}, 'Скасувати')),
    h('p', {class:'chips-hint', style:'margin-top:6px'}, 'Кнопки зберігаються у ваших шаблонах (і в папці даних), передаються колегам через «Мої шаблони» → «Зберегти шаблони у файл».'));
  renderMyBtns(); lab.focus();
}
