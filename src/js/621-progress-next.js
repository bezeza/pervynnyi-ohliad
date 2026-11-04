/* 0.9.3.36 — наступна важлива ділянка та необов’язкові доповнення. */
const PO18_PROGRESS_CACHE = {doc:null, mode:null, issues:null, valid:false, hits:0, misses:0};
function progressInvalidate(){ PO18_PROGRESS_CACHE.valid = false; }
function progressRequired(force){
  if (!force && PO18_PROGRESS_CACHE.valid && PO18_PROGRESS_CACHE.doc === DOC && PO18_PROGRESS_CACHE.mode === MODE){
    PO18_PROGRESS_CACHE.hits++;
    return PO18_PROGRESS_CACHE.issues;
  }
  const missing = [];
  if (!mv('pib')) missing.push({m:'Не вказано ПІБ пацієнта', tab:'meta', f:'meta_pib'});
  if (!mv('dt')) missing.push({m:'Не вказано дату огляду', tab:'meta', f:'meta_dt'});
  const visible = new Set(TABS.filter(t=>t.tab && !t.tab.hidden).map(t=>t.id));
  checkDoc().filter(x=>x.tab && visible.has(x.tab)).forEach(x=>{
    if (!missing.some(y=>y.tab === x.tab && y.f === x.f)) missing.push(x);
  });
  PO18_PROGRESS_CACHE.doc = DOC;
  PO18_PROGRESS_CACHE.mode = MODE;
  PO18_PROGRESS_CACHE.issues = missing;
  PO18_PROGRESS_CACHE.valid = true;
  PO18_PROGRESS_CACHE.misses++;
  return missing;
}
function progressJump(item){
  const proxy = item.f && document.querySelector(`#qvVit input[data-for="${item.f}"]`);
  if (proxy && quickOn()){ show(TABS.indexOf(QV)); proxy.focus(); return; }
  goTab(item.tab, item.f);
}
function progressRender(force){
  const host = document.querySelector('#sidecard .sprog'); if (!host) return;
  const old = host.querySelector('.progress-next'); if (old) old.remove();
  const issues = progressRequired(!!force);
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
{ const x0 = update; update = function(){ const r = x0.apply(this, arguments); progressRender(true); return r; }; }
{ const x0 = show; show = function(){ const r = x0.apply(this, arguments); progressRender(TABS[active] === RXT); return r; }; }
{ const x0 = restore; restore = function(){ progressInvalidate(); const before = PO18_PROGRESS_CACHE.misses; const r = x0.apply(this, arguments); if (PO18_PROGRESS_CACHE.misses === before) progressRender(true); return r; }; }
{ const x0 = clearAll; clearAll = function(){ progressInvalidate(); return x0.apply(this, arguments); }; }
{ const x0 = applyDoc; applyDoc = function(){ progressInvalidate(); return x0.apply(this, arguments); }; }
document.addEventListener('input', e=>{ if (e.target && e.target.closest && e.target.closest('#panels')) progressInvalidate(); }, true);
document.addEventListener('change', e=>{ if (e.target && e.target.closest && e.target.closest('#panels')) progressInvalidate(); }, true);
progressOptional(); progressRender(true);
