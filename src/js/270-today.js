/* ===== Пацієнти на сьогодні ===== */
function todayFlags(p){
  const S = p.snap || {}, F0 = S.f || {}, C = S.c || {}, today = todayISO(), amb = S.mode === 'amb';
  const flags = [];
  const d1 = F0.e_per_per_1, d2 = F0.e_per_per_2;
  if (!amb && d2 && d2 < today) return null;   // виписаний
  const day = d1 ? Math.round((new Date(today + 'T00:00') - new Date(d1 + 'T00:00')) / 864e5) + 1 : 0;
  const diaries = S.diaries || [];
  const lastD = diaries.length ? String(diaries[diaries.length - 1].dt || '').split('T')[0] : '';
  if (!amb && lastD !== today && !(d1 === today)) flags.push({t:'немає щоденника за сьогодні', c:'warn'});
  (S.rx || []).forEach(it=>{
    if (!isAB(it) || it.stop) return;
    if (it.rev && it.rev <= today) flags.push({t:`перегляд АБ: ${it.drug}`, c:'bad'});
    else if (it.start){ const k = Math.round((new Date(today + 'T00:00') - new Date(it.start + 'T00:00')) / 864e5); if (k >= 2 && k <= 3) flags.push({t:`48–72 год АБ: ${it.drug}`, c:'warn'}); }
  });
  const plan = F('dx.plan'), done = new Set((S.res || []).map(r=>r.t));
  const miss = plan.opts.map((o,i)=>C[`dx_plan_${i}`] && C[`dx_plan_${i}`].p ? O(o).t : null).filter(x=>x && !/^консультація/.test(x) && !done.has(x));
  if (miss.length) flags.push({t:`без результатів: ${miss.length}`, c:'', title:miss.join(', ')});
  if (amb && (F0.eln_st === '1' || F0.eln_st === '2') && F0.eln_per_2 && F0.eln_per_2 <= addDays(today, 1)) flags.push({t:`ЕЛН до ${fmtS(F0.eln_per_2)}`, c:'bad'});
  if (!amb && day >= 10 && day % 10 === 0) flags.push({t:'етапний епікриз', c:''});
  return {day, amb, flags, dx:(F0.dx_osn || '').split(/[.,]/)[0]};
}
function renderToday(){
  const bb = $('#bkBox'); if (bb){ bb.innerHTML = ''; const x = (FS.dir && FS.ok) ? null : backupBox(); if (x) bb.append(x); if (!bb.nextElementSibling || !bb.nextElementSibling.classList.contains('fsbox')) bb.after(h('div', {class:'fsbox', 'data-compact':'1'})); fsRender(); }
  const box = $('#today'); if (!box) return;
  const st = loadStore(), week = Date.now() - 30 * 864e5;
  const rows = Object.keys(st).filter(id=>st[id].updated > week).map(id=>({id, p:st[id], f:todayFlags(st[id])})).filter(x=>x.f);
  box.innerHTML = '';
  if (!rows.length){ box.append(h('p', {class:'chips-hint'}, 'Тут з’являться пацієнти, які зараз лікуються, і що для них потрібно зробити сьогодні.')); return; }
  rows.sort((a,b)=>b.f.flags.filter(x=>x.c === 'bad').length - a.f.flags.filter(x=>x.c === 'bad').length || b.f.flags.length - a.f.flags.length);
  const need = rows.filter(r=>r.f.flags.length).length;
  box.append(h('p', {class:'chips-hint'}, need ? `Потребують уваги: ${need} з ${rows.length}.` : `Усього ${rows.length}. Невідкладних справ немає.`));
  rows.slice(0, 40).forEach(({id, p, f})=>{
    box.append(h('div', {class:'prow trow' + (id === PID ? ' cur' : '')},
      h('div', {class:'pn'}, h('b', {}, p.name), h('span', {}, [f.dx, f.day ? (f.amb ? f.day + '-й день лікування' : f.day + '-й день') : ''].filter(Boolean).join(' · ')),
        h('span', {class:'tflags'}, ...(f.flags.length ? f.flags.map(x=>h('span', {class:'badge ' + x.c, title:x.title || ''}, x.t)) : [h('span', {class:'badge ok'}, 'усе зроблено')]))),
      id === PID ? h('span', {class:'badge ok'}, 'відкрито') : h('button', {type:'button', class:'btn', onclick:()=>openPatient(id)}, 'Відкрити')));
  });
}

