/* ===== Рядок пацієнта (0.9.3.2): стать і «Новий» — поруч із пацієнтом; «Норма всюди» — над вкладками; шапка в один рядок ===== */
{ const bar = $('#ptbar'), sx = $('#sexSeg'), nw = $('#clearAll'), nrm = $('#allNorm'), qb = $('#quickBtn');
  const line = h('div', {id:'ptline'}); bar.before(line); line.append(bar, sx, nw);
  sx.setAttribute('aria-label', 'Стать пацієнта');
  sx.querySelectorAll('button').forEach(b=>{ const t = b.textContent.trim(); b.title = t; b.innerHTML = ''; b.append(h('span', {class:'hide-m'}, t), h('span', {class:'show-m'}, t.charAt(0))); });
  nw.innerHTML = ''; nw.append(h('span', {'aria-hidden':'true'}, '＋'), h('span', {class:'nwl'}, ' Новий')); nw.title = 'Новий пацієнт (поточний збережеться)';
  if (nrm && qb) qb.before(nrm);
  // рядок видно завжди: без пацієнта — підказка
  const rp0 = renderPtBar;
  renderPtBar = function(){
    rp0.apply(this, arguments);
    if (bar.hidden){ bar.hidden = false; const p1 = bar.querySelector('.pt1'), p2 = bar.querySelector('.pt2');
      p1.innerHTML = ''; p1.append(h('span', {class:'warn', style:'display:inline'}, 'Новий пацієнт'), ' — оберіть стать і впишіть ПІБ'); p2.textContent = 'Натисніть тут — список пацієнтів'; }
    document.documentElement.style.setProperty('--pth', (window.innerWidth < 900 ? line.offsetHeight : 0) + 'px');
  };
  renderPtBar();
}
