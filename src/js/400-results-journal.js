/* ===== Журнал обстежень за час лікування ===== */
let RES = [], RESN = 0;
function resTests(){ return [...new Set([...Object.keys(TESTS), ...F('dx.plan').opts.map(o=>O(o).t)])].filter(x=>!/^консультація/.test(x)); }
function resTpl(x){ const l = TESTS[x]; if (!l) return '…'; const m = l.match(/^[^:]*?\(…\):\s*/); return m ? l.slice(m[0].length) : l; }
function resLines(mode){
  const today = todayISO();
  let list = RES;
  if (mode === 'diary'){
    const last = DIARIES.length ? String(DIARIES[DIARIES.length - 1].dt || '').split('T')[0] : '';
    const from = last && last < today ? last : addDays(today, -1);
    list = RES.filter(r=>r.d > from && r.d <= today);
  }
  return list.map(r=>`${cap(r.t)} (${fmtS(r.d)}): ${r.v}`.replace(/[.\s]*$/, '.'));
}
function resBlock(){
  const date = h('input', {type:'date', class:'res-d', 'aria-label':'Дата обстеження'});
  const test = h('select', {class:'res-t', 'aria-label':'Обстеження'}, h('option', {value:''}, '— оберіть обстеження —'), ...resTests().map(x=>h('option', {value:x}, x)));
  const txt = h('textarea', {class:'res-v', rows:2, placeholder:'Результат (після вибору обстеження з’явиться шаблон)', 'aria-label':'Результат'});
  const lg = h('div', {class:'labgrid', hidden:''});
  let labIns = [];
  const compose = ()=>{ txt.value = labCompose(test.value, labIns.map(x=>x.value.trim() === '' ? NaN : num(x.value))); };
  test.addEventListener('change', ()=>{
    lg.innerHTML = ''; labIns = [];
    if (!test.value){ lg.hidden = true; return; }
    if (LABS[test.value]){
      lg.hidden = false;
      LABS[test.value].forEach(p=>{ const r = labRange(p); const inp = h('input', {inputmode:'decimal', 'aria-label':p[0], oninput:compose}); labIns.push(inp);
        lg.append(h('div', {class:'lab'}, h('div', {class:'lbl'}, p[0], h('span', {class:'chips-hint'}, ' ' + rngTxt(r) + (p[1] ? ' ' + p[1] : ''))), inp)); });
      txt.value = ''; labIns[0].focus(); return;
    }
    lg.hidden = true; txt.value = resTpl(test.value); txt.focus(); const k = txt.value.indexOf('…'); if (k >= 0) txt.setSelectionRange(k, k + 1);
  });
  const add = h('button', {type:'button', class:'btn primary'}, 'Додати результат');
  add.addEventListener('click', ()=>{
    const v = txt.value.trim(); if (!v){ toast('Впишіть результат'); return; }
    const dd = date.value || todayISO();
    if (LABS[test.value] && labIns.length) labApply(test.value, labIns.map(x=>x.value.trim() === '' ? NaN : num(x.value)), dd);
    RES.push({id:++RESN, d:dd, t:test.value || 'обстеження', v});
    lg.hidden = true; lg.innerHTML = ''; labIns = [];
    RES.sort((a,b)=>a.d < b.d ? -1 : a.d > b.d ? 1 : a.id - b.id);
    test.value = ''; txt.value = ''; renderRes(); savePatient(true); update(); toast('Результат додано в журнал обстежень');
  });
  const box = h('div', {class:'pt resbox'},
    h('h3', {}, 'Журнал обстежень за час лікування'),
    h('p', {class:'chips-hint'}, 'Вносьте результати, щойно вони надходять. Для аналізів крові досить ввести числа — програма сама запише рядок і позначить відхилення ↑↓, а креатинін піде в розрахунок кліренсу. У щоденник підставляються нові результати, в епікризи — усі.'),
    h('div', {class:'res-form'}, date, test), lg, txt,
    h('div', {class:'acts2', style:'margin-top:6px'}, add),
    h('div', {class:'plist reslist'}));
  date.addEventListener('change', ()=>{ date.dataset.user = '1'; });
  return box;
}
function renderRes(){
  document.querySelectorAll('.res-d').forEach(d=>{ if (!d.dataset.user) d.value = todayISO(); });
  document.querySelectorAll('.reslist').forEach(box=>{
    box.innerHTML = '';
    if (!RES.length){ box.append(h('p', {class:'chips-hint'}, 'Результатів ще немає.')); return; }
    RES.forEach(r=>{
      const del = h('button', {type:'button', class:'more'}, 'Видалити');
      del.addEventListener('click', ()=>{ if (!del.dataset.arm){ del.dataset.arm = '1'; del.textContent = 'Точно?'; setTimeout(()=>{ delete del.dataset.arm; del.textContent = 'Видалити'; }, 3000); return; }
        RES = RES.filter(x=>x !== r); renderRes(); savePatient(true); update(); });
      box.append(h('div', {class:'prow'}, h('div', {class:'pn'}, h('b', {}, fmtS(r.d) + ' · ' + cap(r.t)), h('span', {}, r.v)), del));
    });
  });
}
function renderDiaries(){
  const box = $('#dlist'); if (!box) return;
  box.innerHTML = '';
  if (!DIARIES.length){ box.append(h('p', {class:'chips-hint'}, 'Записів ще немає. Заповніть щоденник і натисніть «Записати в журнал».')); return; }
  DIARIES.slice().reverse().forEach((d, k)=>{
    const idx = DIARIES.length - 1 - k;
    const tmp = document.createElement('div'); tmp.innerHTML = d.html;
    const del = h('button', {type:'button', class:'more'}, 'Видалити');
    del.addEventListener('click', ()=>{ if (!del.dataset.arm){ del.dataset.arm = '1'; del.textContent = 'Точно?'; setTimeout(()=>{ delete del.dataset.arm; del.textContent = 'Видалити'; }, 3000); return; } DIARIES.splice(idx, 1); renderDiaries(); savePatient(true); });
    box.append(h('div', {class:'prow'},
      h('div', {class:'pn'}, h('b', {}, fmtDT(d.dt) || 'без дати'), h('span', {}, itext(tmp).replace(/\s+/g, ' ').slice(0, 110) + '…')),
      h('button', {type:'button', class:'btn', onclick:()=>{ $('#out').innerHTML = d.html; dirty = true; $('#banner').hidden = true; toast('Показано запис від ' + (fmtDT(d.dt) || '—') + '. Його можна скопіювати або надрукувати'); }}, 'Показати'),
      del));
  });
}
function diaryBlock(){
  const nm = h('input', {placeholder:'Назва, напр. «Пневмонія, 3-й день»', 'aria-label':'Назва шаблону щоденника'});
  const saveT = ()=>{ const n = nm.value.trim(); if (!n){ toast('Впишіть назву шаблону'); nm.focus(); return; } if (diaryTplSave(n)) nm.value = ''; };
  nm.addEventListener('keydown', e=>{ if (e.key === 'Enter'){ e.preventDefault(); saveT(); } });
  const adm = h('input', {type:'date', class:'adm-d', 'aria-label':'Дата надходження'});
  adm.addEventListener('change', ()=>{ F('e_per.per').d1.value = adm.value; const di = document.getElementById('d_main_den_0'); if (di) delete di.dataset.user; update(); });
  const tbar = h('div', {class:'pt dtpl'},
    h('div', {class:'res-form'}, h('span', {class:'lbl adm-l', style:'margin:0'}, 'Дата надходження'), adm, h('span', {class:'chips-hint adm-h'}, 'Від неї рахується день перебування; вона ж піде у виписний епікриз.')),
    h('h3', {}, 'Шаблон запису'),
    h('p', {class:'chips-hint'}, 'Заповнює щоденник за даними первинного огляду (стан, хрипи, ритм, живіт, набряки, неврологія) і журналу обстежень.'),
    h('div', {class:'chips'}, ...DTPL.map((n,k)=>h('button', {type:'button', class:'chip q dtpl-b', 'data-k':k, onclick:()=>diaryFromExam(k)}, n))),
    h('div', {class:'chips dtpl-my', style:'margin-top:6px'}),
    h('details', {class:'dsave'}, h('summary', {}, 'Зберегти поточний запис як мій шаблон'),
      h('div', {class:'res-form'}, nm, h('button', {type:'button', class:'btn', onclick:saveT}, 'Зберегти'))));
  setTimeout(renderDtpl, 0);
  return h('div', {}, tbar, h('div', {class:'pt'},
    h('h3', {}, 'Журнал записів',
      h('span', {class:'acts2'},
        h('button', {type:'button', class:'btn', onclick:likePrevious}, 'Як попередній'),
        h('button', {type:'button', class:'btn primary', onclick:saveDiary}, 'Записати в журнал'))),
    h('div', {id:'dlist', class:'plist'})));
}


