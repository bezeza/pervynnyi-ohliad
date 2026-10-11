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
  return d <= todayISO() ? '+' : '';
}
function f0034Sheets(start, n){
  const items = RXF().filter(it=>!isRegimen(it)), reg = RXF().filter(isRegimen).map(it=>[it.drug, it.note].filter(Boolean).join(', ')).join('; ');
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
      row2([h('b', {}, main), sub ? h('span', {}, ' ' + sub) : '', it.note ? h('div', {class:'f-note'}, it.note) : ''], d=>rxDayMark(it, d));
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
  const P = $('#print'); P.innerHTML = ''; f0034Sheets(null, F0034_DAYS).forEach(s=>P.append(s));
  toast('Друк: альбомна орієнтація, форма № 003-4/о', 2500); window.print();
}
function f0034Preview(){
  if (!RXF().length){ toast('Лист призначень порожній — спершу додайте препарати'); return; }
  const box = h('div', {class:'f0034-prev'}); f0034Sheets(null, F0034_DAYS).forEach(s=>box.append(s));
  const dlg = h('div', {class:'navsheet packsheet f0034-dlg', role:'dialog', 'aria-label':'Листок лікарських призначень'},
    h('div', {class:'nvbox'}, h('div', {class:'nshead'}, h('b', {}, 'Листок лікарських призначень (ф. 003-4/о)'), h('button', {type:'button', class:'btn', onclick:()=>dlg.remove()}, 'Закрити ✕')),
      h('p', {class:'chips-hint'}, '«+» у рядку «Лікар» — дні призначення, «—» — день відміни. Рядок «Сестра» медсестра заповнює від руки. Порожні рядки — для призначень від руки.'),
      box, h('div', {class:'acts2', style:'margin-top:10px'}, h('button', {type:'button', class:'btn primary', onclick:()=>{ dlg.remove(); f0034Print(); }}, '🖨 Друкувати'))));
  dlg.addEventListener('click', e=>{ if (e.target === dlg) dlg.remove(); });
  document.body.append(dlg);
}
