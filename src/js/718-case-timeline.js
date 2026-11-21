/* ===== 0.9.3.150 — «📅 Справа»: хронологія госпіталізації по днях (лише читання; задача 17, крок 4) =====
   Рядок = календарний день від надходження до виписки (або до сьогодні). Вихідні позначені, щоденник на них не вимагається.
   Джерела: DIARIES (щоденники й показники), RX (активні призначення), RES (обстеження). Збереження не змінюється.
   Жоден показник не обов’язковий — порожні клітинки дозволені. Нічого не вигадується. Проєкт: docs/task-17-sprava-design.md */
function caseRealToday(){ const d = new Date(); return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`; }
function caseVitals(f){
  f = f || {}; const g = k => String(f[k] || '').trim(), o = [];
  if (g('d_obj_t_0')) o.push(['t°', g('d_obj_t_0')]);
  if (g('d_obj_ad_0') || g('d_obj_ad_1')) o.push(['АТ', g('d_obj_ad_0') + '/' + g('d_obj_ad_1')]);
  if (g('d_obj_chss_0')) o.push(['ЧСС', g('d_obj_chss_0')]);
  if (g('d_obj_chd_0')) o.push(['ЧД', g('d_obj_chd_0')]);
  if (g('d_obj_chd_1')) o.push(['SpO₂', g('d_obj_chd_1')]);
  return o;
}
/* пошук рядків хронології; today — для перевірок у тестах */
function caseRows(today){
  today = today || caseRealToday();
  const P = F('e_per.per'), d1 = P.d1.value; let d2 = P.d2.value;
  if (!d1) return {rows:[], d1:'', d2:'', open:false};
  const open = !d2 || d2 > today; if (open) d2 = today < d1 ? d1 : today;
  const rows = [];
  for (let d = d1, k = 0; d <= d2 && k < 400; d = addDays(d, 1), k++){
    const wd = new Date(d + 'T00:00').getDay(), weekend = (wd === 0 || wd === 6) && d !== d1 && d !== P.d2.value;
    const dia = DIARIES.filter(x=>String(x.dt || '').split('T')[0] === d);
    const rx = RX.filter(it=>it.start && it.start <= d && (!rxEnd(it) || rxEnd(it) >= d)).length;
    const res = RES.filter(r=>r.d === d).length;
    const ev = []; if (d === d1) ev.push('надходження'); if (P.d2.value && d === P.d2.value) ev.push('виписка');
    RX.forEach(it=>{ if (isAB(it) && it.rev === d && !it.stop) ev.push('перегляд АБ: ' + it.drug); });
    rows.push({d, weekend, wd, diaries:dia.length, vitals:dia.length ? caseVitals(dia[dia.length - 1].data && dia[dia.length - 1].data.f) : [], rx, res, ev, today:d === today});
  }
  return {rows, d1, d2, open};
}
function caseDialog(){
  const old = document.getElementById('caseBox'); if (old) old.remove();
  const back = document.activeElement, close = () => { box.remove(); try{ if (back && back.focus) back.focus(); }catch(e){} };
  const {rows, open} = caseRows();
  let body;
  if (!rows.length) body = h('p', {class:'chips-hint'}, 'Вкажіть дату надходження (поле «Період перебування у стаціонарі» в епікризі) — з’явиться хронологія.');
  else {
    const miss = rows.filter(r=>!r.weekend && !r.diaries && r.d <= caseRealToday()).length;
    body = h('div', {}, h('p', {class:'chips-hint'}, `Днів: ${rows.length}${open ? ' (госпіталізація триває)' : ''}; без щоденника в робочі дні: ${miss}. Вихідні — щоденник не вимагається.`),
      h('div', {class:'bf-tbl'}, h('table', {class:'bf-t case-t'},
        h('thead', {}, h('tr', {}, ...['Дата', 'Щоденник', 'Показники', 'Призначень', 'Обстежень', 'Події'].map(x=>h('th', {}, x)))),
        h('tbody', {}, ...rows.map(r=>h('tr', {class:(r.today ? 'case-today ' : '') + (r.weekend ? 'case-we' : ''), 'aria-current':r.today ? 'date' : null},
          h('td', {class:'bf-d'}, fmtS(r.d), ' ', h('span', {class:'chips-hint'}, bfWd(r.d))),
          h('td', {}, r.diaries ? '✓ ' + (r.diaries > 1 ? r.diaries : '') : (r.weekend ? 'вихідний' : (r.d <= caseRealToday() ? '—' : ''))),
          h('td', {}, r.vitals.map(v=>v[0] + ' ' + v[1]).join(' · ')),
          h('td', {}, r.rx ? String(r.rx) : ''), h('td', {}, r.res ? String(r.res) : ''), h('td', {}, r.ev.join('; '))))))));
  }
  const box = h('div', {id:'caseBox', class:'modal', role:'dialog', 'aria-modal':'true', 'aria-labelledby':'caseT'},
    h('div', {class:'mcard bf-m'},
      h('div', {class:'ph'}, h('h2', {id:'caseT'}, 'Справа: хронологія'), h('button', {type:'button', class:'btn', onclick:close}, 'Закрити ✕')),
      body,
      h('div', {class:'acts2'},
        h('button', {type:'button', class:'btn', onclick:()=>{ close(); bfDialog(); }}, '📝 Дописати історію'),
        h('button', {type:'button', class:'btn', onclick:()=>{ close(); packDialog(); }}, '🖨 Друк історії'))));
  box.addEventListener('click', e=>{ if (e.target === box) close(); });
  box.addEventListener('keydown', e=>{ if (e.key === 'Escape'){ e.stopPropagation(); close(); } });
  document.body.append(box);
  const c = box.querySelector('button'); if (c) c.focus();
}
try{
  document.querySelectorAll('.more-dd .mmenu').forEach(menu=>{
    const bf = menu.querySelector('.bfbtn'); if (!bf || menu.querySelector('.casebtn')) return;
    bf.before(h('button', {type:'button', class:'more casebtn', role:'menuitem', title:'Хронологія госпіталізації по днях: щоденники, показники, призначення, обстеження', onclick:()=>{ const dd = menu.closest('details'); if (dd) dd.open = false; caseDialog(); }}, '📅 Справа: хронологія'));
  });
}catch(e){}
