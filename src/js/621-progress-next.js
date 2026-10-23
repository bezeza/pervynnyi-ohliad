/* 0.9.3.36 — наступна важлива ділянка та необов’язкові доповнення. */
function progressRequired(){
  const missing = [];
  if (!mv('pib')) missing.push({m:'Не вказано ПІБ пацієнта', tab:'meta', f:'meta_pib'});
  if (!mv('dt')) missing.push({m:'Не вказано дату огляду', tab:'meta', f:'meta_dt'});
  const visible = tabOrder().map(i=>TABS[i].id);
  checkDoc().filter(x=>x.tab && visible.includes(x.tab)).forEach(x=>{
    if (!missing.some(y=>y.tab === x.tab && y.f === x.f)) missing.push(x);
  });
  return missing;
}
function progressJump(item){
  const proxy = item.f && document.querySelector(`#qvVit input[data-for="${item.f}"]`);
  if (proxy && quickOn()){ show(TABS.indexOf(QV)); proxy.focus(); return; }
  goTab(item.tab, item.f);
}
function progressRender(){
  const host = document.querySelector('#sidecard .sprog'); if (!host) return;
  const old = host.querySelector('.progress-next'); if (old) old.remove();
  const issues = progressRequired();
  const box = h('div', {class:'progress-next', id:'progressNext'});
  if (issues.length){
    box.append(h('small', {}, 'Потрібно перевірити перед завершенням'),
      h('button', {type:'button', class:'more', onclick:()=>progressJump(issues[0])}, issues[0].m));
  } else {
    const sequence = tabOrder().map(i=>TABS[i]).filter(t=>t !== META && t !== HV && !TOOL_TABS.includes(t.id));
    const i = sequence.indexOf(TABS[active]);
    const next = [...sequence.slice(i + 1), ...sequence.slice(0, i + 1)].find(t=>!t.tab.classList.contains('filled'));
    box.append(h('small', {}, 'Решта розділів — за потреби'));
    if (next) box.append(h('button', {type:'button', class:'more', onclick:()=>goTab(next.id)}, 'Далі: ' + (next.short || next.title)));
  }
  host.append(box);
}
function progressOptional(){
  SECTIONS.forEach(s=>{
    const detailed = s.fields.some(f=>!f.bo && !f.noOut && ['sel','line','text'].includes(f.type) && f.el && f.el.value.trim() !== '');
    s.fields.forEach(f=>{
      if (!f.entryStatus) return;
      const optional = /додатково|своїми словами|уточнен/i.test(f.label || '') || f.bo && detailed;
      f.entryStatus.hidden = optional && entryFieldState(f) === 'empty';
      if (optional) f.entryStatus.title = 'Необов’язкове доповнення';
    });
  });
}
{ const x0 = entryRender; entryRender = function(){ const r = x0.apply(this, arguments); progressOptional(); return r; }; }
{ const x0 = update; update = function(){ const r = x0.apply(this, arguments); progressRender(); return r; }; }
{ const x0 = show; show = function(){ const r = x0.apply(this, arguments); progressRender(); return r; }; }
progressOptional(); progressRender();
