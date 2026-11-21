/* ===== 0.9.3.155 — «🏥 Відділення сьогодні»: огляд пацієнтів для завідувача (лише читання; задача 17, огляд відділення) =====
   Рядки — ті самі пацієнти й прапорці, що в «Сьогодні» (todayFlags): діагноз, день госпіталізації, виписка (сьогодні / дата),
   останній щоденник, що потребує уваги. Нічого не рахується понад наявні дані й не вигадується; змін у даних немає. */
function deptRows(){
  const st = loadStore(), week = Date.now() - 30 * 864e5, today = todayISO(), rows = [];
  for (const id in st){
    const p = st[id]; if (!(p.updated > week)) continue;
    const f = todayFlags(p); if (!f || f.amb) continue;
    const S = p.snap || {}, F0 = S.f || {}, d2 = F0.e_per_per_2 || '', ds = (S.diaries || []).map(d=>String(d.dt || '').split('T')[0]).filter(Boolean).sort();
    rows.push({id, name:p.name, dx:f.dx, day:f.day, d2, dis:d2 && d2 === today ? 'сьогодні' : d2 && d2 > today ? fmtS(d2) : '', lastD:ds.length ? ds[ds.length - 1] : '', flags:f.flags});
  }
  rows.sort((a, b)=>(b.dis === 'сьогодні') - (a.dis === 'сьогодні') || b.flags.filter(x=>x.c === 'bad').length - a.flags.filter(x=>x.c === 'bad').length || b.flags.length - a.flags.length || String(a.name).localeCompare(String(b.name), 'uk'));
  return rows;
}
function deptDialog(){
  const old = document.getElementById('deptBox'); if (old) old.remove();
  const back = document.activeElement, close = () => { box.remove(); try{ if (back && back.focus) back.focus(); }catch(e){} };
  const rows = deptRows(), need = rows.filter(r=>r.flags.length).length, out = rows.filter(r=>r.dis === 'сьогодні').length;
  const body = !rows.length ? h('p', {class:'chips-hint'}, 'Тут з’являться пацієнти, які зараз лікуються в стаціонарі (збережені за останні 30 днів, без виписаних).')
    : h('div', {}, h('p', {class:'chips-hint'}, `Лікується: ${rows.length}; виписка сьогодні: ${out}; потребують уваги: ${need}.`),
      h('div', {class:'bf-tbl'}, h('table', {class:'bf-t dept-t'},
        h('thead', {}, h('tr', {}, ...['Пацієнт', 'Діагноз', 'День', 'Виписка', 'Щоденник', 'Увага', ''].map(x=>h('th', {}, x)))),
        h('tbody', {}, ...rows.map(r=>h('tr', {class:r.dis === 'сьогодні' ? 'dept-out' : ''},
          h('td', {}, h('b', {}, r.name)), h('td', {}, r.dx || ''), h('td', {}, r.day ? String(r.day) : ''), h('td', {}, r.dis),
          h('td', {}, r.lastD ? fmtS(r.lastD) : '—'),
          h('td', {class:'tflags'}, ...(r.flags.length ? r.flags.map(x=>h('span', {class:'badge ' + x.c, title:x.title || ''}, x.t)) : [h('span', {class:'badge ok'}, 'усе зроблено')])),
          h('td', {}, r.id === PID ? h('span', {class:'badge ok'}, 'відкрито') : h('button', {type:'button', class:'btn dept-open', onclick:()=>{ close(); openPatient(r.id); }}, 'Відкрити'))))))));
  const box = h('div', {id:'deptBox', class:'modal', role:'dialog', 'aria-modal':'true', 'aria-labelledby':'deptT'},
    h('div', {class:'mcard bf-m'}, h('div', {class:'ph'}, h('h2', {id:'deptT'}, 'Відділення сьогодні'), h('button', {type:'button', class:'btn', onclick:close}, 'Закрити ✕')), body));
  box.addEventListener('click', e=>{ if (e.target === box) close(); });
  box.addEventListener('keydown', e=>{ if (e.key === 'Escape'){ e.stopPropagation(); close(); } });
  document.body.append(box); const c = box.querySelector('button'); if (c) c.focus();
}
try{
  document.querySelectorAll('.more-dd .mmenu').forEach(menu=>{
    const cb = menu.querySelector('.casebtn'); if (!cb || menu.querySelector('.deptbtn')) return;
    cb.after(h('button', {type:'button', class:'more deptbtn', role:'menuitem', title:'Хто лікується, який день, кому виписка, що потребує уваги', onclick:()=>{ const dd = menu.closest('details'); if (dd) dd.open = false; deptDialog(); }}, '🏥 Відділення сьогодні'));
  });
}catch(e){}
