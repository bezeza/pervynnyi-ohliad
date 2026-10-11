/* ===== План обстеження: на коли (дати, повтори) і «виконано» з результатом =====
   Дати зберігаються в прихованому полі #dx_pland (JSON {назва: [дати | 'вип']}) — так вони йдуть у збереження пацієнта. */
const admDate = () => { try{ return (F('e_per.per').d1.value) || (mv('dt') || '').split('T')[0] || todayISO(); }catch(e){ return todayISO(); } };
function planDGet(){ const e = document.getElementById('dx_pland'); try{ return JSON.parse(e && e.value || '{}') || {}; }catch(x){ return {}; } }
function planDSet(o){ const e = document.getElementById('dx_pland'); if (e){ e.value = JSON.stringify(o); } }
function planSel(){ try{ const f = F('dx.plan'); return f.chips.map((c,i)=>c.getAttribute('aria-pressed') === 'true' ? {i, t:O(f.opts[i]).t, o:+(c.dataset.ord || 0)} : null).filter(Boolean).sort((a,b)=>a.o - b.o).map(x=>x.t); }catch(e){ return []; } }
function planDates(name){ const o = planDGet(); return (o[name] && o[name].length) ? o[name] : [admDate()]; }
const planDLabel = d => d === 'вип' ? 'перед вип.' : fmtS(d);
function planDone(name){ return RES.filter(r=>r.t === name).map(r=>r.d); }
function planDBlock(){
  return h('div', {class:'pt plandbox'}, h('h3', {}, 'Обстеження: на коли і виконання'),
    h('p', {class:'chips-hint'}, 'Перша дата — день надходження. Додайте контроль кнопками; «✓» — внести результат (піде в журнал обстежень, щоденник і виписку). Дати друкуються на звороті листка призначень.'),
    h('input', {type:'hidden', id:'dx_pland', value:'{}'}), h('div', {id:'planDList'}));
}
function renderPlanD(){
  const box = document.getElementById('planDList'); if (!box) return;
  { const pb = box.closest('.f') || box.closest('.plandbox'), pf = F('dx.plan'), host = pf && pf.chips && pf.chips[0] && pf.chips[0].closest('.f');
    if (pb && host && host.nextElementSibling !== pb) host.after(pb); }   // одразу під «Планом обстеження»
  const sel = planSel(); box.innerHTML = '';
  box.closest('.plandbox').hidden = !sel.length;
  const o = planDGet();
  sel.forEach(name=>{
    const ds = planDates(name), done = planDone(name);
    const setDs = arr => { const x = planDGet(); x[name] = arr; planDSet(x); renderPlanD(); update(); };
    const add = d => { const arr = ds.slice(); if (!arr.includes(d)) arr.push(d); arr.sort((a,b)=>a === 'вип' ? 1 : b === 'вип' ? -1 : a < b ? -1 : 1); setDs(arr); };
    const res = h('div', {class:'pd-res', hidden:''});
    const row = h('div', {class:'pdrow'},
      h('div', {class:'pd-d'}, h('b', {class:'pd-n'}, name), done.length ? h('span', {class:'badge ok'}, '✓ ' + done.map(fmtS).join(', ')) : '', ...ds.map(d=>h('span', {class:'chip s on'}, planDLabel(d), ds.length > 1 ? h('button', {type:'button', class:'pd-x', 'aria-label':'Прибрати дату', onclick:()=>setDs(ds.filter(x=>x !== d))}, '×') : '')),
        (()=>{ const more = h('span', {class:'pd-more', hidden:''},
            h('button', {type:'button', class:'chip s', onclick:()=>add(todayISO())}, 'сьогодні'),
            h('button', {type:'button', class:'chip s', onclick:()=>add(addDays(todayISO(), 1))}, 'завтра'),
            h('button', {type:'button', class:'chip s', onclick:()=>add(addDays(ds.filter(x=>x !== 'вип').slice(-1)[0] || todayISO(), 3))}, 'через 3 дні'),
            h('button', {type:'button', class:'chip s', onclick:()=>add('вип')}, 'перед випискою'));
          return h('span', {class:'pd-add'}, h('button', {type:'button', class:'chip s', title:'Додати дату (контроль)', onclick:()=>{ more.hidden = !more.hidden; }}, '+ дата'), more); })(),
        h('button', {type:'button', class:'chip s ok', title:'Внести результат', onclick:()=>{ res.hidden = !res.hidden; if (!res.hidden && !res.childElementCount){
          const dd = h('input', {type:'date', value:todayISO(), 'aria-label':'Дата'}), tx = h('textarea', {rows:2, 'aria-label':'Результат'}); tx.value = typeof resTpl === 'function' ? resTpl(name) : '';
          res.append(h('div', {class:'res-form'}, dd), tx, h('button', {type:'button', class:'btn primary', onclick:()=>{ const v = tx.value.trim(); if (!v){ toast('Впишіть результат'); return; }
            RES.push({id:++RESN, d:dd.value || todayISO(), t:name, v}); RES.sort((a,b)=>a.d < b.d ? -1 : a.d > b.d ? 1 : a.id - b.id); renderRes(); renderPlanD(); update(); try{ savePatient(true); }catch(e){} toast('Результат додано в журнал обстежень'); }}, 'Зберегти результат')); tx.focus(); } }}, '✓')),
      res);
    box.append(row);
  });
}
