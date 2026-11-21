/* ===== 0.9.3.156 — «💊 Лист на сьогодні»: призначення на сьогодні по пацієнтах відділення (для медсестри; задача 17) =====
   Лише дані листка призначень: що, доза, шлях, кратність, час, дні — для кожного стаціонарного пацієнта (ті самі, що в «Відділення сьогодні»).
   Показується те, що активне сьогодні: початок ≤ сьогодні ≤ кінець, не скасоване, не «за показаннями» (rxHeld). Нічого не вигадується:
   графіка вимірювань і NEWS2 тут немає — це медичні правила, їх визначає лікар. Лише читання; друк — окремим аркушем. */
function nurseRows(){
  const st = loadStore(), week = Date.now() - 30 * 864e5, today = todayISO(), rows = [];
  for (const id in st){
    const p = st[id]; if (!(p.updated > week)) continue;
    const f = todayFlags(p); if (!f || f.amb) continue;
    const act = ((p.snap || {}).rx || []).filter(it=>String(it.drug || '').trim() && !it.stop && !rxHeld(it) && it.start && it.start <= today && (!rxEnd(it) || rxEnd(it) >= today));
    if (!act.length) continue;
    const inj = it => /в\/в|в\/м|п\/ш/.test(it.route || '');
    act.sort((a, b)=>inj(b) - inj(a) || String(a.hours || '').localeCompare(String(b.hours || '')));
    rows.push({id, name:p.name, day:f.day, items:act.map(it=>({inj:inj(it), t:rxLine(it, false)}))});
  }
  rows.sort((a, b)=>String(a.name).localeCompare(String(b.name), 'uk'));
  return rows;
}
function nursePrint(rows){
  if (printBlocked()) return;
  const P = $('#print'); P.innerHTML = '';
  const H = formHeader();
  P.append(h('div', {class:'pr-top'}, h('div', {}, ...H.left.slice(0, 2).flatMap((l, k)=>k ? [h('br'), l] : [l])), h('div', {class:'r'}, fmtD(todayISO()))),
    h('h2', {class:'pr-title'}, 'Лист призначень на ' + fmtD(todayISO())),
    h('div', {class:'pr-free'}, ...rows.flatMap(r=>[h('p', {}, h('b', {}, r.name + (r.day ? ' — ' + r.day + '-й день' : ''))), h('ul', {}, ...r.items.map(i=>h('li', {}, i.t)))])));
  window.print();
}
function nurseDialog(){
  const old = document.getElementById('nurseBox'); if (old) old.remove();
  const back = document.activeElement, close = () => { box.remove(); try{ if (back && back.focus) back.focus(); }catch(e){} };
  const rows = nurseRows(), n = rows.reduce((a, r)=>a + r.items.length, 0);
  const body = !rows.length ? h('p', {class:'chips-hint'}, 'Немає активних призначень на сьогодні у стаціонарних пацієнтів (збережених за останні 30 днів).')
    : h('div', {}, h('p', {class:'chips-hint'}, `Пацієнтів: ${rows.length}; призначень на сьогодні: ${n}. Умовні («за показаннями») та скасовані не показано. Графіка вимірювань тут немає — призначає лікар.`),
      ...rows.map(r=>h('div', {class:'pt nurse-p'}, h('h3', {}, r.name, r.day ? h('span', {class:'chips-hint'}, ' · ' + r.day + '-й день') : ''),
        h('ul', {class:'nurse-l'}, ...r.items.map(i=>h('li', {class:i.inj ? 'nurse-inj' : ''}, i.t))))));
  const box = h('div', {id:'nurseBox', class:'modal', role:'dialog', 'aria-modal':'true', 'aria-labelledby':'nurseT'},
    h('div', {class:'mcard bf-m'}, h('div', {class:'ph'}, h('h2', {id:'nurseT'}, 'Лист на сьогодні'), h('button', {type:'button', class:'btn', onclick:close}, 'Закрити ✕')), body,
      rows.length ? h('div', {class:'acts2'}, h('button', {type:'button', class:'btn nurse-print', onclick:()=>nursePrint(rows)}, '🖨 Друк')) : ''));
  box.addEventListener('click', e=>{ if (e.target === box) close(); });
  box.addEventListener('keydown', e=>{ if (e.key === 'Escape'){ e.stopPropagation(); close(); } });
  document.body.append(box); const c = box.querySelector('button'); if (c) c.focus();
}
try{
  document.querySelectorAll('.more-dd .mmenu').forEach(menu=>{
    const db = menu.querySelector('.deptbtn'); if (!db || menu.querySelector('.nursebtn')) return;
    db.after(h('button', {type:'button', class:'more nursebtn', role:'menuitem', title:'Призначення на сьогодні по пацієнтах відділення — з листків призначень', onclick:()=>{ const dd = menu.closest('details'); if (dd) dd.open = false; nurseDialog(); }}, '💊 Лист на сьогодні'));
  });
}catch(e){}
