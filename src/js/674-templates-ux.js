/* ===== Шаблони: список із пошуком, одна дія «Застосувати», збереження з документа =====
   Свої хвороби й варіанти — у «Мої шаблони»: пошук, «Застосувати», «Перейменувати», видалення лише після підтвердження.
   «Зберегти як шаблон» — у меню «⋯» розділу і біля пошуку хвороб (огляд) або в щоденнику. */
function tplPrompt(title, label, ok, onOk, value){
  const old = document.getElementById('tplAsk'); if (old) old.remove();
  const inp = h('input', {type:'text', value:value || '', 'aria-label':label, placeholder:label});
  const yes = h('button', {type:'button', class:'btn primary'}, ok || 'Зберегти');
  const no = h('button', {type:'button', class:'btn'}, 'Скасувати');
  const box = h('div', {id:'tplAsk', class:'modal', role:'dialog', 'aria-modal':'true', 'aria-label':title},
    h('div', {class:'mcard'},
      h('h2', {style:'margin:0 0 8px;font-size:18px'}, title),
      h('div', {class:'f'}, h('label', {}, label), inp),
      h('div', {class:'acts2', style:'margin-top:12px'}, yes, no)));
  const close = () => box.remove();
  const go = () => { const v = inp.value.trim(); if (!v){ toast('Введіть назву'); inp.focus(); return; } close(); onOk(v); };
  no.addEventListener('click', close);
  yes.addEventListener('click', go);
  inp.addEventListener('keydown', e=>{ if (e.key === 'Enter'){ e.preventDefault(); go(); } });
  box.addEventListener('click', e=>{ if (e.target === box) close(); });
  box.addEventListener('keydown', e=>{ if (e.key === 'Escape'){ e.stopPropagation(); close(); } });
  document.body.append(box); setTimeout(()=>{ inp.focus(); inp.select(); }, 0);
}
function tplSaveDialog(){
  if (DOC === 'shch'){
    tplPrompt('Зберегти щоденник як шаблон', 'Назва шаблону', 'Зберегти', name=>{ diaryTplSave(name); });
    return;
  }
  if (DOC !== 'ohl'){ toast('Шаблон огляду зберігається з первинного огляду. Відкрийте «Огляд» або збережіть щоденник у «Щоденнику».', 4000); return; }
  tplPrompt('Зберегти огляд як шаблон', 'Назва шаблону', 'Зберегти', name=>{ saveExamTemplate(name, 'my'); });
}
function tplApply(p){
  if (!p) return;
  if (DOC !== 'ohl') switchDoc('ohl');
  const i = PRESETS.indexOf(p), card = HV.cards && i >= 0 ? HV.cards[i] : null;
  if (card) card.click(); else applyPreset(p);
}
function tplRename(p){
  tplPrompt('Перейменувати шаблон', 'Нова назва', 'Зберегти', name=>{
    if (name === p.name) return;
    if (CUSTOM.presets.some(x=>x !== p && x.name === name)){ toast('Шаблон з такою назвою вже є'); return; }
    p.name = name; saveCustom();
    const i = PRESETS.indexOf(p), c = HV.cards && HV.cards[i];
    if (c){ const b = c.querySelector('b'); if (b) b.textContent = name; }
    try{ renderHvTips(); }catch(e){}
    renderTplLists();
    try{ if (typeof SHELL !== 'undefined' && SHELL.sync) SHELL.sync(); }catch(e){}
    toast('Шаблон перейменовано: «' + name + '»');
  }, p.name);
}
function tplEnsureFind(id, listId, label){
  if (document.getElementById(id)) return;
  const list = document.getElementById(listId); if (!list) return;
  const q = h('input', {type:'search', id, class:'tpl-find', placeholder:label, 'aria-label':label});
  q.addEventListener('input', tplFilterLists);
  list.before(q);
}
function tplFilterLists(){
  const run = (id, box) => {
    if (!box) return;
    const q = ((document.getElementById(id) || {}).value || '').trim().toLowerCase();
    const rows = [...box.querySelectorAll('.prow')];
    let n = 0;
    rows.forEach(r=>{ const ok = !q || r.textContent.toLowerCase().includes(q); r.hidden = !ok; if (ok) n++; });
    let empty = box.querySelector('.tpl-none');
    if (q && rows.length && !n){
      if (!empty){ empty = h('p', {class:'chips-hint tpl-none'}, 'Нічого не знайдено.'); box.append(empty); }
      empty.hidden = false;
    } else if (empty) empty.hidden = true;
  };
  run('tplOptQ', document.getElementById('tplOpts'));
  run('tplPresetQ', document.getElementById('tplPresets'));
}
function tplDecorateLists(){
  tplEnsureFind('tplOptQ', 'tplOpts', 'Пошук своїх варіантів');
  tplEnsureFind('tplPresetQ', 'tplPresets', 'Пошук своїх шаблонів');
  document.querySelectorAll('#tplOpts .prow').forEach(row=>{
    if (row.querySelector('.tpl-acts')) return;
    const key = row.dataset.key, text = row.dataset.text || (row.querySelector('b') && row.querySelector('b').textContent) || '';
    const del = row.querySelector('button');
    const acts = h('div', {class:'tpl-acts'});
    const kill = h('button', {type:'button', class:'more'}, 'Видалити');
    kill.addEventListener('click', ()=>tplConfirm('Видалити варіант «' + text + '»? Він зникне зі списку цього поля.', 'Видалити', ()=>{
      CUSTOM.opts[key] = (CUSTOM.opts[key] || []).filter(x=>x !== text);
      if (!CUSTOM.opts[key].length) delete CUSTOM.opts[key];
      saveCustom(); removeOptionLive(key, text); renderTplLists(); toast('Видалено');
    }));
    acts.append(kill);
    if (del) del.replaceWith(acts); else row.append(acts);
  });
  document.querySelectorAll('#tplPresets .prow').forEach(row=>{
    if (row.querySelector('.tpl-apply')) return;
    const key = row.dataset.key;
    const p = CUSTOM.presets.find(x=>x.key === key) || PRESETS.find(x=>x.key === key);
    const del = [...row.querySelectorAll('button')].pop();
    const acts = h('div', {class:'tpl-acts'});
    const on = !!(p && curKey && p.key === curKey);
    const apply = h('button', {type:'button', class:'btn primary tpl-apply', 'aria-pressed':on ? 'true' : 'false', title:on ? 'Цей шаблон уже застосовано' : 'Застосувати шаблон до огляду'}, on ? 'Застосовано' : 'Застосувати');
    apply.addEventListener('click', ()=>tplApply(p));
    const ren = h('button', {type:'button', class:'more'}, 'Перейменувати');
    ren.addEventListener('click', ()=>{ if (p) tplRename(p); });
    const kill = h('button', {type:'button', class:'more'}, 'Видалити');
    kill.addEventListener('click', ()=>tplConfirm('Видалити шаблон «' + (p && p.name || '') + '»? Його не буде в списку.', 'Видалити', ()=>{
      const obj = CUSTOM.presets.find(x=>x.key === key) || p;
      CUSTOM.presets = CUSTOM.presets.filter(x=>x !== obj && x.key !== key); saveCustom();
      const i = PRESETS.indexOf(obj); if (i >= 0){ PRESETS.splice(i, 1); const c = HV.cards.splice(i, 1)[0]; if (c) c.remove(); }
      renderTplLists(); toast('Шаблон видалено');
    }));
    acts.append(apply, ren, kill);
    if (del) del.replaceWith(acts); else row.append(acts);
  });
  tplFilterLists();
}
{ const lists0 = renderTplLists;
  renderTplLists = function(){ const r = lists0.apply(this, arguments); try{ tplDecorateLists(); }catch(e){} return r; };
  try{ renderTplLists(); }catch(e){} }
{ const ap0 = applyPreset;
  applyPreset = function(){ const r = ap0.apply(this, arguments); clearTimeout(tplApply._t); tplApply._t = setTimeout(()=>{ try{ if (CUSTOM.presets.length) renderTplLists(); }catch(e){} }, 0); return r; }; }
{ const d0 = diaryTplSave;
  diaryTplSave = function(name){
    if (!diaryTplSave.force && CUSTOM.diary.some(x=>x.name === name)){
      tplConfirm('Шаблон щоденника «' + name + '» вже є. Замінити?', 'Замінити', ()=>{ diaryTplSave.force = true; try{ d0(name); } finally { diaryTplSave.force = false; } });
      return false;
    }
    return d0.apply(this, arguments);
  }; }
{ const r0 = renderDtpl;
  renderDtpl = function(){
    const r = r0.apply(this, arguments);
    document.querySelectorAll('.dtpl-my .mytpl').forEach(span=>{
      const inn = span.querySelector('.chip-in'); if (!inn) return;
      const name = inn.textContent.trim();
      inn.title = 'Застосувати шаблон «' + name + '»';
      const x = span.querySelector('.chip-x'); if (!x) return;
      const n = h('button', {type:'button', class:'more', title:'Видалити шаблон «' + name + '»', 'aria-label':'Видалити шаблон ' + name}, 'Видалити');
      n.addEventListener('click', e=>{
        e.stopPropagation();
        const t = CUSTOM.diary.find(d=>d.name === name); if (!t) return;
        tplConfirm('Видалити шаблон щоденника «' + name + '»?', 'Видалити', ()=>{
          CUSTOM.diary = CUSTOM.diary.filter(y=>y !== t); saveCustom(); renderDtpl(); toast('Шаблон видалено');
        });
      });
      x.replaceWith(n);
    });
    document.querySelectorAll('details.dsave summary').forEach(s=>{ s.textContent = 'Зберегти як шаблон'; });
    return r;
  };
  try{ renderDtpl(); }catch(e){} }
document.querySelectorAll('.more-dd .mmenu').forEach(menu=>{
  if (menu.querySelector('.tpl-save-doc')) return;
  const b = h('button', {type:'button', class:'more tpl-save-doc', role:'menuitem', title:'Зберегти заповнений огляд або щоденник як власний шаблон', onclick:()=>{
    const dd = menu.closest('details'); if (dd) dd.open = false; tplSaveDialog();
  }}, 'Зберегти як шаблон');
  menu.prepend(b);
});
{ const hs = document.querySelector('.hvsearch');
  if (hs && !hs.querySelector('.tpl-save-doc')) hs.append(h('button', {type:'button', class:'btn tpl-save-doc', title:'Зберегти поточний огляд як шаблон', onclick:()=>tplSaveDialog()}, 'Зберегти як шаблон')); }
