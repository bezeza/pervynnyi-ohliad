/* 0.9.3.53 · Обстеження в консультативному висновку — вибір із журналу та відновлення */
let KONSOBS = [];

function konsObsFromSnapshot(S){
  if (S && Object.prototype.hasOwnProperty.call(S,'konsObs')){
    return Array.isArray(S.konsObs) ? [...new Set(S.konsObs.map(Number).filter(Number.isFinite))] : [];
  }
  return RES.map(r=>Number(r.id)).filter(Number.isFinite);
}

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

/* Пояснення та список додаються до полів, оголошених до першого відновлення пацієнта. */
{
  const log = F('e_obs.konslog');
  if (log && log.wrapEl){
    log.fn = ()=>konsObsLines().join('\n');
    log.konsList = h('div', {class:'plist', 'aria-label':'Обстеження з журналу'});
    log.wrapEl.append(
      h('p', {class:'chips-hint'}, 'Джерело — «Журнал обстежень за час лікування» вище. Позначені записи й поле «Своє» потраплять у консультативний висновок.'),
      h('div', {class:'lbl'}, 'Позначте, які результати включити у висновок:'),
      log.konsList,
      h('button', {type:'button', class:'btn', onclick:()=>{
        const s = SECTIONS.find(x=>x.id === 'e_obs'), input = s && s.panel && s.panel.querySelector('.res-t');
        if (!input){ toast('Форма журналу обстежень недоступна'); return; }
        input.scrollIntoView({behavior:'smooth', block:'center'}); input.focus();
        toast('Додайте результат у журнал, потім позначте його для висновку');
      }}, '+ Внести нове обстеження'));
  }
  renderKonsObs();
}

/* Нові знімки зберігають вибір; старі знімки без konsObs лишають попередню поведінку. */
{
  const snap0 = snap;
  snap = function(){ const state = snap0.apply(this, arguments); state.konsObs = KONSOBS.slice(); return state; };
  const restore0 = restore;
  restore = function(S){
    const result = restore0.apply(this, arguments);
    KONSOBS = konsObsFromSnapshot(S);
    renderKonsObs(); update();
    return result;
  };
  const renderRes0 = renderRes;
  renderRes = function(){ const result = renderRes0.apply(this, arguments); renderKonsObs(); return result; };
  const clearAll0 = clearAll;
  clearAll = function(forRestore){
    if (!forRestore) KONSOBS = [];
    const result = clearAll0.apply(this, arguments);
    renderKonsObs(); update();
    return result;
  };
  const clearSection0 = clearSection;
  clearSection = function(section){
    const result = clearSection0.apply(this, arguments);
    if (section && section.id === 'e_obs' && DOC === 'kons'){ KONSOBS = []; renderKonsObs(); update(); }
    return result;
  };
}

/* restoreLast() міг запуститися до цього модуля: відновлюємо стан уже відкритого пацієнта. */
if (PID){
  try{ KONSOBS = konsObsFromSnapshot(loadStore()[PID]?.snap); }catch(e){ KONSOBS = []; }
}
renderKonsObs(); update();
