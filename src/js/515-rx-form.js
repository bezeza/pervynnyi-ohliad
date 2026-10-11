/* ===== Листок лікарських призначень (форма № 003-4/о): друк таблиці для медсестри =====
   Як паперовий бланк: «Режим», для кожного призначення — рядки «Лікар» і «Сестра», стовпці — дні.
   У рядку «Лікар» програма ставить «+» у дні призначення і «—» у день відміни; рядок «Сестра» — для відміток від руки. */
const F0034_DAYS = 16, F0034_BLANK = 3;
const isRegimen = it => /^(режим|дієта|стіл)/i.test(String(it.drug || '').trim());
function rxDayMark(it, d){
  if (!it.start || d < it.start) return '';
  const stop = it.stop, end = it.days && +it.days > 0 ? addDays(it.start, +it.days - 1) : '';
  if (stop) return d < stop ? '+' : d === stop ? '—' : '';
  if (end) return d <= end ? '+' : d === addDays(end, 1) ? '—' : '';
  const now = new Date(), real = `${now.getFullYear()}-${pad(now.getMonth()+1)}-${pad(now.getDate())}`;
  return d <= (real > todayISO() ? real : todayISO()) ? '+' : '';   // без тривалості — «+» до сьогодні, далі лікар відмічає щодня
}
function f0034Sheets(start, n){
  const K = it => rxKind(it), items = [...RXF().filter(it=>K(it) === 'drug'), ...RXF().filter(it=>K(it) === 'man')],
    reg = RXF().filter(it=>['reg','diet'].includes(K(it))).map(it=>[it.drug, it.note].filter(Boolean).join(', ')).join('; ');
  const first = start || [...RXF().map(it=>it.start).filter(Boolean)].sort()[0] || todayISO();
  const last = RXF().reduce((m, it)=>{ const e = it.stop || rxEnd(it) || todayISO(); return e > m ? e : m; }, first);
  const total = Math.max(1, Math.round((new Date(last + 'T00:00') - new Date(first + 'T00:00')) / 864e5) + 2);
  const pages = Math.max(1, Math.ceil(total / n)), H = formHeader(), sheets = [];
  const alerg = (()=>{ try{ return val(F('vitae.alerg'), true) || ''; }catch(e){ return ''; } })();
  for (let pg = 0; pg < pages; pg++){
    const days = Array.from({length:n}, (_, k)=>addDays(first, pg * n + k));
    const td = (t, a) => h('td', a || {}, t || '');
    const tb = h('tbody');
    const row2 = (name, rowsMarks, cls) => {
      const r1 = h('tr', {class:'f-l'}, h('td', {class:'f-name', rowspan:'2'}, ...name), td('Лікар', {class:'f-who'}), ...days.map((d, k)=>td(rowsMarks ? rowsMarks(d) : '', {class:'f-d'})));
      const r2 = h('tr', {class:'f-s'}, td('Сестра', {class:'f-who'}), ...days.map(()=>td('', {class:'f-d'})));
      if (cls){ r1.classList.add(cls); r2.classList.add(cls); }
      tb.append(r1, r2);
    };
    tb.append(h('tr', {class:'f-reg'}, h('td', {class:'f-name'}, h('b', {}, 'Режим '), reg), td('', {class:'f-who'}), ...days.map(()=>td('', {class:'f-d'}))));
    items.forEach(it=>{
      const main = [it.drug, it.dose].filter(Boolean).join(' '), sub = [it.route, it.freq].filter(Boolean).join(' ');
      row2([it.src ? h('span', {class:'f-src'}, it.src === 'pat' ? SRCAB.pat : SRCAB.dep) : '', h('b', {}, main), sub ? h('span', {}, ' ' + sub) : '',
        it.hours ? h('div', {class:'f-note'}, it.hours) : '', it.note ? h('div', {class:'f-note'}, it.note) : ''], d=>rxDayMark(it, d));
    });
    for (let k = 0; k < Math.max(F0034_BLANK, 11 - items.length); k++) row2([''], null, 'f-blank');   // аркуш заповнений, як паперовий бланк
    tb.append(h('tr', {class:'f-sig'}, h('td', {class:'f-name'}, 'Підписи'), td('Лікар', {class:'f-who'}), ...days.map(()=>td('', {class:'f-d'}))),
      h('tr', {class:'f-sig'}, td(''), td('Сестра', {class:'f-who'}), ...days.map(()=>td('', {class:'f-d'}))));
    const head = h('thead', {}, h('tr', {}, h('th', {class:'f-name', rowspan:'2'}, 'Призначення'), h('th', {class:'f-who', rowspan:'2'}, 'Викон.'), h('th', {colspan:String(n)}, 'Відмітки про призначення та виконання')),
      h('tr', {}, ...days.map(d=>h('th', {class:'f-d'}, d.slice(8, 10) + '/' + d.slice(5, 7)))));
    sheets.push(h('div', {class:'f0034'},
      h('div', {class:'f-top'}, h('div', {}, ...H.left.slice(0, 2).flatMap((l,k)=>k ? [h('br'), l] : [l])),
        h('div', {class:'f-form'}, 'МЕДИЧНА ДОКУМЕНТАЦІЯ', h('br'), h('b', {}, 'ФОРМА № 003-4/о'), h('br'), 'Затверджена наказом МОЗ України', h('br'), '26.07.99 р. № 184')),
      h('div', {class:'f-title'}, 'ЛИСТОК ЛІКАРСЬКИХ ПРИЗНАЧЕНЬ' + (pages > 1 ? ` (аркуш ${pg + 1} з ${pages})` : '')),
      h('div', {class:'f-pat'}, '№ ' + (mv('card') || '______') + '   Прізвище, ім’я, по батькові хворого: ', h('b', {}, mv('pib') || '______________________________'),
        mv('dob') ? ', ' + fmtD(mv('dob')) + ' р. н.' + (mv('age') ? ' (' + mv('age') + ' р.)' : '') : '', '   Палата № _____'),
      alerg && !/не обтяжен/i.test(alerg) ? h('div', {class:'f-alerg'}, 'АЛЕРГІЯ: ' + alerg) : '',
      h('table', {class:'f-t'}, head, tb)));
  }
  return sheets;
}
function f0034Print(){
  if (!RXF().length){ toast('Лист призначень порожній — спершу додайте препарати'); return; }
  if (printBlocked()) return;
  const P = $('#print'); P.innerHTML = ''; f0034Sheets(null, F0034_DAYS).forEach(s=>P.append(s)); P.append(f0034Back());
  toast('Друк: лицьовий бік і зворот (альбомна орієнтація). На двосторонньому принтері — один аркуш', 3500); window.print();
}
function f0034Preview(){
  if (!RXF().length){ toast('Лист призначень порожній — спершу додайте препарати'); return; }
  const box = h('div', {class:'f0034-prev'}); f0034Sheets(null, F0034_DAYS).forEach(s=>box.append(s)); box.append(f0034Back());
  const dlg = h('div', {class:'navsheet packsheet f0034-dlg', role:'dialog', 'aria-label':'Листок лікарських призначень'},
    h('div', {class:'nvbox'}, h('div', {class:'nshead'}, h('b', {}, 'Листок лікарських призначень (ф. 003-4/о)'), h('button', {type:'button', class:'btn', onclick:()=>dlg.remove()}, 'Закрити ✕')),
      h('p', {class:'chips-hint'}, '«+» у рядку «Лікар» — дні призначення, «—» — день відміни. Рядок «Сестра» медсестра заповнює від руки. Порожні рядки — для призначень від руки.'),
      box, h('div', {class:'acts2', style:'margin-top:10px'}, h('button', {type:'button', class:'btn primary', onclick:()=>{ dlg.remove(); f0034Print(); }}, '🖨 Друкувати'))));
  dlg.addEventListener('click', e=>{ if (e.target === dlg) dlg.remove(); });
  document.body.append(dlg);
}

/* Зворот бланка: обстеження (перелік як на бланку + дати з плану), дієта, фізіотерапія, психотерапія, місцеве лікування */
const F0034_OBS = [
  ['Загальноклінічні та біохімічні', 3, [['Загальний аналіз крові',['ЗАК']],['Аналіз крові (ШЗЕ, лейкоцити, гемоглобін)',[]],['Аналіз крові на глюкозу',['глюкоза крові']],['Аналіз сечі на діастазу',[]],
    ['Коагулограма, тривалість кровотечі, згортання крові',['коагулограма']],['Електроліти крові',['біохімічний аналіз крові']],['Печінкові проби',['біохімічний аналіз крові']],['Аналіз крові на білкові фракції',[]],
    ['Аналіз крові на сечовину, залишковий азот, креатинін',['біохімічний аналіз крові']],['Група крові, резус-фактор',['група крові та резус-фактор']],['Загальний аналіз сечі',['ЗАС']],
    ['Сеча на глюкозу (з добової кількості)',[]],['Аналіз сечі на жовчні пігменти',[]],['Проби сечі за Зимницьким',[]],['Проби сечі за Нечипоренко',[]],['Копрограма',[]],
    ['Об’єм добової крововтрати з калом',[]],['Аналіз калу на приховану кров',['аналіз калу на приховану кров']],['Кал на яйця глистів, найпростіших',[]]]],
  ['Зондові', 3, [['Шлункова секреція з гістаміном, пентагастрином, алкоголем',[]],['Дуоденальне зондування (БДЗ)',[]],['Дослідження панкреатичної секреції',[]]]],
  ['Ендоскопічні', 2, [['Езофагогастродуоденоскопія',['ФГДС']],['Колоноскопія',['колоноскопія']],['Сигмоскопія',[]],['Ректороманоскопія',[]],['Р Х П Г',[]]]],
  ['Рентгенологічні', 2, [['Рентгенографія органів грудної клітини, флюорографія',['рентгенографія ОГК','флюорографія ОГК','флюорографія']],['Рентгеноскопія шлунка та 12-палої кишки',[]],['Іригоскопія',[]],
    ['Холецистографія (інфузійно, перорально)',[]],['Оглядовий знімок черевної порожнини',['оглядова рентгенографія ОЧП']]]],
  ['Ультразвукові', 2, [['Печінки, селезінки, жовчного міхура',['УЗД ОЧП']],['та протоків, підшлункової залози,',[]],['кишечника, нирок, сечевого міхура,',['УЗД нирок']],['матки і придатків, лімфовузлів черевної порожнини',[]]]],
  ['Мікробіологічні', 2, [['Аналіз крові на реакції Відаля та Провачека',[]],['Зскрібання з язика, зіву',['мазок із зіву на флору та BL']],['Мікрофлора калу',['бактеріологічне дослідження калу']],['Аналіз калу на дизентерійну групу',[]]]],
  ['Функціональні', 2, [['Електрокардіограма',['ЕКГ']],['Реоенцефалограма',[]]]],
  ['Імунологічні', 2, [['Серологічні реакції на сифіліс',[]],['Аналіз крові на австралійський антиген',['маркери вірусних гепатитів']],['Аналіз крові на ВІЛ-інфекцію',['тест на ВІЛ і гепатит С']],['Інші TORCH-інфекції',[]]]]];
function f0034Back(){
  const cg = n => h('colgroup', {}, h('col', {}), ...Array.from({length:n}, ()=>h('col', {style:'width:9mm'})));
  const plan = planSel(), used = new Set();
  const datesFor = names => { const L = []; names.forEach(n=>{ if (plan.includes(n)){ used.add(n); planDates(n).forEach(d=>{ const t = planDLabel(d); if (!L.includes(t)) L.push(t); }); } }); return L; };
  const cells = (n, ds) => Array.from({length:n}, (_, k)=>h('td', {class:'b-d'}, ds[k] || ''));
  const col = groups => { const tb = h('tbody'); groups.forEach(([g, n, rows])=>{ tb.append(h('tr', {}, h('th', {colspan:String(n + 1), class:'b-g'}, g)));
    rows.forEach(([name, keys])=>tb.append(h('tr', {}, h('td', {class:'b-n'}, name), ...cells(n, datesFor(keys))))); }); return tb; };
  const left = col(F0034_OBS.slice(0, 2)), right = col(F0034_OBS.slice(2));
  const extra = plan.filter(n=>!used.has(n));   // чого немає на бланку — у порожні рядки
  for (let k = 0; k < Math.max(4, extra.length); k++){ const n = extra[k]; left.append(h('tr', {}, h('td', {class:'b-n'}, n || ''), ...cells(3, n ? planDates(n).map(planDLabel) : []))); }
  const K = it => rxKind(it), diets = RXF().filter(it=>K(it) === 'diet'), phys = RXF().filter(it=>K(it) === 'phys'), loc = RXF().filter(it=>K(it) === 'loc');
  const dd = x => x ? fmtS(x) : '';
  const dietT = h('table', {class:'b-t'}, h('colgroup', {}, ...[0,1].flatMap(()=>[h('col', {}), h('col', {style:'width:13mm'}), h('col', {style:'width:13mm'})])), h('thead', {}, h('tr', {}, ...['Дієта, схема додаткового харчування','Дата призначення','Дата відміни','Дієта, схема додаткового харчування','Дата призначення','Дата відміни'].map(t=>h('th', {}, t)))),
    h('tbody', {}, ...Array.from({length:6}, (_, r)=>h('tr', {}, ...[diets[r], diets[r + 6]].flatMap(it=>[h('td', {class:'b-n'}, it ? it.drug : ''), h('td', {class:'b-d'}, it ? dd(it.start) : ''), h('td', {class:'b-d'}, it ? dd(it.stop || rxEnd(it)) : '')])))));
  const procT = (title, L, n) => h('table', {class:'b-t'}, h('colgroup', {}, h('col', {}), h('col', {style:'width:16mm'}), h('col', {style:'width:18mm'})), h('thead', {}, h('tr', {}, h('th', {colspan:'3', class:'b-g'}, title)), h('tr', {}, h('th', {}, 'Найменування процедури'), h('th', {}, 'Дата призначення'), h('th', {}, 'Підпис'))),
    h('tbody', {}, ...Array.from({length:Math.max(n, L.length)}, (_, r)=>{ const it = L[r]; return h('tr', {}, h('td', {class:'b-n'}, it ? [it.drug, it.freq, it.days ? it.days + ' дн.' : ''].filter(Boolean).join(', ') : ''), h('td', {class:'b-d'}, it ? dd(it.start) : ''), h('td', {class:'b-d'}, '')); })));
  const locT = h('table', {class:'b-t'}, h('colgroup', {}, h('col', {style:'width:14mm'}), h('col', {}), h('col', {style:'width:24mm'}), h('col', {style:'width:24mm'})), h('thead', {}, h('tr', {}, h('th', {colspan:'4', class:'b-g'}, 'Місцеве лікування')), h('tr', {}, ...['Код процедури','Найменування процедури','Дата призначення і підпис','Дата відміни і підпис'].map(t=>h('th', {}, t)))),
    h('tbody', {}, ...Array.from({length:Math.max(4, loc.length)}, (_, r)=>{ const it = loc[r]; return h('tr', {}, h('td', {class:'b-d'}, ''), h('td', {class:'b-n'}, it ? [it.drug, it.freq].filter(Boolean).join(', ') : ''), h('td', {class:'b-d'}, it ? dd(it.start) : ''), h('td', {class:'b-d'}, it ? dd(it.stop) : '')); })));
  return h('div', {class:'f0034 f0034b'},
    h('div', {class:'b-wrap'},
      h('div', {class:'b-l'}, h('div', {class:'b-h'}, 'ОБСТЕЖЕННЯ'), h('div', {class:'b-cols'},
        h('table', {class:'b-t'}, cg(3), h('thead', {}, h('tr', {}, h('th', {}, 'Найменування'), h('th', {colspan:'3'}, 'Дата призначення'))), left),
        h('table', {class:'b-t'}, cg(2), h('thead', {}, h('tr', {}, h('th', {}, 'Найменування'), h('th', {colspan:'2'}, 'Дата призначення'))), right))),
      h('div', {class:'b-r'}, h('div', {class:'b-h'}, 'ДІЄТИЧНЕ ХАРЧУВАННЯ'), dietT, procT('Фізіотерапевтичні процедури', phys, 6), procT('Психотерапевтичні процедури', [], 4), locT)));
}
