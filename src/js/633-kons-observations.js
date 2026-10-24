/* 0.9.3.47 · Обстеження в консультативному висновку — окремий добір із журналу */
let KONSOBS = [];

function konsObsLines(){
  const selected = new Set(KONSOBS.map(String));
  return RES.filter(r=>selected.has(String(r.id)))
    .map(r=>`${cap(r.t)} (${fmtS(r.d)}): ${r.v}`.replace(/[.\s]*$/, '.'));
}

function renderKonsObs(){
  const f = F('e_obs.konslog'), list = f && f.konsList;
  if (!list) return;
  list.innerHTML = '';
  if (!RES.length){ list.append(h('p', {class:'chips-hint'}, 'Журнал порожній. Спочатку внесіть обстеження у форму журналу вище.')); return; }
  RES.forEach(r=>{
    const date = fmtS(r.d), title = cap(r.t), label = `${date} · ${title}`;
    const cb = h('input', {type:'checkbox', 'aria-label':'Включити у висновок: ' + label});
    cb.checked = KONSOBS.includes(+r.id);
    cb.addEventListener('change', ()=>{
      const selected = new Set(KONSOBS.map(Number));
      if (cb.checked) selected.add(+r.id); else selected.delete(+r.id);
      KONSOBS = [...selected].filter(Number.isFinite);
      update(); savePatient(true);
    });
    list.append(h('label', {class:'prow'}, cb,
      h('span', {class:'pn'}, h('b', {}, label), h('span', {}, r.v))));
  });
}

/* Результати для висновку окремі від спільного поля e_obs.obs. */
{
  const s = SECTIONS.find(x=>x.id === 'e_obs');
  const all = ['epi','kons','etap','per','napr','gosp','konc'];
  const ordinary = F('e_obs.obs');
  ordinary.docs = all.filter(x=>x !== 'kons');
  ordinary.wrapEl.dataset.docs = ordinary.docs.join(' ');
  ordinary.wrapEl.hidden = !ordinary.docs.includes(DOC);

  const log = {id:'konslog', type:'auto', docs:['kons'], label:'Обстеження з журналу для висновку', tpl:'{v}', br:true, fn:()=>konsObsLines().join('\n')};
  const own = {id:'konsown', type:'text', rows:4, wide:true, docs:['kons'], label:'Своє (результати поза журналом)', placeholder:'Впишіть результати, яких немає в журналі обстежень', tpl:'{v}', sep:'\n', br:true};
  s.fields.push(log, own);
  const grid = s.panel && s.panel.querySelector(':scope > .grid');
  if (grid){
    const logWrap = buildField(s, log);
    log.konsList = h('div', {class:'plist', 'aria-label':'Обстеження з журналу'});
    logWrap.append(
      h('p', {class:'chips-hint'}, 'Джерело — «Журнал обстежень за час лікування» вище. Позначені записи й поле «Своє» потраплять у консультативний висновок.'),
      h('div', {class:'lbl'}, 'Позначте, які результати включити у висновок:'),
      log.konsList,
      h('button', {type:'button', class:'btn', onclick:()=>{
        const input = s.panel.querySelector('.res-t');
        if (!input){ toast('Форма журналу обстежень недоступна'); return; }
        input.scrollIntoView({behavior:'smooth', block:'center'}); input.focus();
        toast('Додайте результат у журнал, потім позначте його для висновку');
      }}, '+ Внести нове обстеження'));
    grid.append(logWrap, buildField(s, own));
  }
  renderKonsObs();
}

/* Чекбокси й власне поле входять до звичайного знімка пацієнта. */
{
  const snap0 = snap;
  snap = function(){ const state = snap0.apply(this, arguments); state.konsObs = KONSOBS.slice(); return state; };
  const restore0 = restore;
  restore = function(S){
    KONSOBS = Array.isArray(S && S.konsObs) ? [...new Set(S.konsObs.map(Number).filter(Number.isFinite))] : [];
    return restore0.apply(this, arguments);
  };
  const renderRes0 = renderRes;
  renderRes = function(){ const result = renderRes0.apply(this, arguments); renderKonsObs(); return result; };
  const clearAll0 = clearAll;
  clearAll = function(forRestore){
    if (!forRestore) KONSOBS = [];
    const result = clearAll0.apply(this, arguments);
    renderKonsObs();
    return result;
  };
  const clearSection0 = clearSection;
  clearSection = function(section){
    const result = clearSection0.apply(this, arguments);
    if (section && section.id === 'e_obs' && DOC === 'kons'){ KONSOBS = []; renderKonsObs(); }
    return result;
  };
}
