/* ===== 0.9.3.151 — «📅 Справа»: хронологія госпіталізації по днях (лише читання; задача 17, крок 4) =====
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
  const rows = []; let sev = false;   /* тяжкий стан / погіршення / SpO2 < 92% в останньому щоденнику — на вихідних щоденник теж потрібен */
  for (let d = d1, k = 0; d <= d2 && k < 400; d = addDays(d, 1), k++){
    const wd = new Date(d + 'T00:00').getDay(), weekend0 = (wd === 0 || wd === 6) && d !== d1 && d !== P.d2.value;
    const dia = DIARIES.filter(x=>String(x.dt || '').split('T')[0] === d);
    if (dia.length){ const lf = (dia[dia.length - 1].data && dia[dia.length - 1].data.f) || {}, sp = parseFloat(String(lf.d_obj_chd_1 || '').replace(',', '.'));
      sev = lf.d_main_stan === '2' || lf.d_main_dyn === '3' || (sp > 0 && sp < 92); }
    const weekend = weekend0 && !sev;
    const rx = RX.filter(it=>it.start && it.start <= d && (!rxEnd(it) || rxEnd(it) >= d)).length;
    const res = RES.filter(r=>r.d === d).length;
    const ev = []; if (d === d1) ev.push('надходження'); if (P.d2.value && d === P.d2.value) ev.push('виписка');
    RX.forEach(it=>{ if (isAB(it) && it.rev === d && !it.stop) ev.push('перегляд АБ: ' + it.drug); });
    rows.push({d, weekend, wd, diaries:dia.length, diary:dia.length ? dia[dia.length - 1] : null, vitals:dia.length ? caseVitals(dia[dia.length - 1].data && dia[dia.length - 1].data.f) : [], rx, res, ev, today:d === today});
  }
  return {rows, d1, d2, open};
}
/* показує збережений щоденник у документі (так само, як «Показати» в журналі щоденників) */
function caseShowDiary(d){
  if (!d) return;
  try{ if (DOC !== 'shch') switchDoc('shch'); }catch(e){}
  $('#out').innerHTML = d.html; dirty = true; try{ $('#banner').hidden = true; }catch(e){}
  toast('Показано запис від ' + (fmtDT(d.dt) || '—') + '. Його можна скопіювати або надрукувати');
}
/* «Епікриз зі справи»: перехід до епікриза + «Зібрати виписку» (epiAuto заповнює лише порожні поля) + попередження про робочі дні без щоденника */
function caseMissingDiaries(today){
  today = today || caseRealToday();
  return caseRows(today).rows.filter(r=>!r.weekend && !r.diaries && r.d <= today).map(r=>r.d);
}
function caseEpicrisis(){
  const miss = caseMissingDiaries();
  const keep = toast;
  try{ toast = function(){}; if (DOC !== 'epi') switchDoc('epi'); epiAuto(); } finally { toast = keep; }
  toast('Епікриз зібрано зі справи: заповнено порожні поля (дати, анамнез, динаміка, результати, рекомендації). Перевірте текст і внесіть «…».' + (miss.length ? ` Увага: немає щоденників за ${miss.length} ${plural(miss.length, ['робочий день','робочі дні','робочих днів'])} (${miss.slice(0, 4).map(fmtS).join(', ')}${miss.length > 4 ? '…' : ''}) — «Дописати історію».` : ''), 7000);
  return miss.length;
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
          h('td', {}, r.diaries ? h('button', {type:'button', class:'more case-open', title:'Показати щоденник за цей день', 'aria-label':'Показати щоденник за ' + fmtD(r.d), onclick:()=>{ close(); caseShowDiary(r.diary); }}, '✓ ' + (r.diaries > 1 ? r.diaries + ' ' : '') + 'відкрити') : (r.weekend ? 'вихідний' : (r.d <= caseRealToday() ? '—' : ''))),
          h('td', {}, r.vitals.map(v=>v[0] + ' ' + v[1]).join(' · ')),
          h('td', {}, r.rx ? String(r.rx) : ''), h('td', {}, r.res ? String(r.res) : ''), h('td', {}, r.ev.join('; '))))))));
  }
  const sib = caseSiblings(), cand = caseCandidates();
  const link = h('div', {class:'case-link'});
  if (CASE.person) link.append(h('p', {class:'chips-hint'}, `Госпіталізація №${CASE.n || 1}` + (sib.length ? '; інші: ' : '.')), ...sib.map(x=>h('button', {type:'button', class:'btn case-sib', onclick:()=>{ close(); openPatient(x.id); }}, `№${x.n}` + (x.d1 ? ' · ' + fmtD(x.d1) : ''))));
  cand.forEach(x=>link.append(h('p', {class:'chips-hint'}, 'Є запис із таким самим ПІБ і датою народження' + (x.d1 ? ' (надходження ' + fmtD(x.d1) + ')' : '') + '. '), h('button', {type:'button', class:'btn case-cand', onclick:()=>{ if (caseLink(x.id)){ close(); caseDialog(); toast('Записи зв’язано як госпіталізації однієї людини'); } }}, 'Це та сама людина — зв’язати')));
  const box = h('div', {id:'caseBox', class:'modal', role:'dialog', 'aria-modal':'true', 'aria-labelledby':'caseT'},
    h('div', {class:'mcard bf-m'},
      h('div', {class:'ph'}, h('h2', {id:'caseT'}, 'Справа: хронологія'), h('button', {type:'button', class:'btn', onclick:close}, 'Закрити ✕')),
      link, body,
      h('div', {class:'acts2'},
        h('button', {type:'button', class:'btn case-new', onclick:()=>{ if (caseNewAdmission()) close(); }, title:'Новий запис тієї ж людини: переноситься лише ПІБ, дата народження й стать'}, '＋ Нова госпіталізація'),
        h('button', {type:'button', class:'btn', onclick:()=>{ close(); bfDialog(); }}, '📝 Дописати історію'),
        h('button', {type:'button', class:'btn case-epi', onclick:()=>{ close(); caseEpicrisis(); }, title:'Перейти до епікриза й заповнити порожні поля зі справи'}, '📄 Епікриз зі справи'),
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
