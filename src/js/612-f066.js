/* ===== Форма № 066/о «Карта хворого, який вибув із стаціонару» (наказ МОЗ № 110 від 14.02.2012) — 0.9.3.24 =====
   Бланк на два аркуші A4. Усе, що вже є в записі пацієнта, підставляється само; решта — вкладка «066/о».
   Ці ж дані заповнюють порожні пункти титульного аркуша 003/о (ВІЛ, RW, група крові, резус, п. 19, 19.1). ===== */
const S66 = k => { const f = F('s066.' + k); return f ? (f.type === 'sel' ? (f.el.value === '' ? -1 : +f.el.value) : f.el.value.trim()) : ''; };
const S66T = k => { const f = F('s066.' + k); return f && f.el.value !== '' ? g(val(f, true)) : ''; };
const isoDMY = iso => iso ? iso.slice(8,10) + '.' + iso.slice(5,7) + '.' + iso.slice(0,4) : '';
/* останній запис журналу обстежень за назвою (регулярний вираз) */
function resLast(re){ const L = (typeof RES !== 'undefined' ? RES : []).filter(r=>re.test(r.t)).sort((a,b)=>a.d < b.d ? 1 : -1); return L[0] || null; }
const d66 = {
  rw: () => S66('rw') || (resLast(/^RW$/) || {}).d || '',
  vil: () => S66('vil') || (resLast(/^ВІЛ$/) || {}).d || '',
  onko: () => S66('onko'),
  flg: () => S66('flg') || (resLast(/флюорограф/i) || {}).d || '',
  krov: () => S66('krov') || String(((resLast(/група крові/i) || {}).vals || [])[0] || '').trim(),
  rh: () => S66('rh') || String(((resLast(/група крові/i) || {}).vals || [])[1] || '').trim()
};
/* п. 12: строки від початку захворювання — з вибору або з «Вважає себе хворим протягом» */
function sr66(){
  const v = S66('sr'); if (v >= 0) return v + 1;
  const f = F('morbi.dur'); if (!f || !f.inp) return '';
  const n = num(f.inp.value), u = +(f.unit && f.unit.value || 0);
  if (isNaN(n)) return '';
  return u > 0 || n >= 2 ? 3 : '';   // ≥ 2 днів — точно пізніше 24 год; 1 день — уточніть вручну
}
/* п. 14: результат — з вибору або з епікризу */
function rez66(){
  const v = S66('rez'); if (v >= 0) return v + 1;
  const r = F('e_lik.rez'); if (!r || r.el.value === '') return '';
  return [1, 2, 4, 3][+r.el.value] || '';
}
const dead66 = () => rez66() === 5;
function b066Head(){
  const hd = bHead();
  hd.querySelectorAll('b').forEach(b=>{ if (/№ 003\/о/.test(b.textContent)) b.textContent = '№ 066/о'; });
  hd.querySelectorAll('.bs').forEach(x=>{ if (/у редакції наказу/.test(x.textContent)) x.remove(); });
  return hd;
}
const bU = (on, t) => h('span', {class:'bl' + (on ? ' bsel' : '')}, t);
/* процедури й операції: 7 колонок (ред. 2016) або коротко 5 (дата; назва; хірург; анестезія; ускладнення) */
function ops66(){ return String(S66('ops') || '').split('\n').map(x=>x.trim()).filter(Boolean).map(x=>{ const p = x.split(';').map(y=>y.trim());
  return p.length >= 7 ? {dt:p[0], code:p[1], name:p[2], spec:p[3], an:p[4], anes:p[5], comp:p.slice(6).join('; ')} : {dt:p[0] || '', code:'', name:p[1] || '', spec:p[2] || '', an:p[3] || '', anes:'', comp:p.slice(4).join('; ')}; }); }
let F066ED = lsGet('po.f066ed', '2012');
function b066(){ return F066ED === '2016' ? b066v16() : b066v12(); }
function b066v12(){
  const P = F('e_per.per'), d1 = P.d1.value || (mv('dt') || '').split('T')[0], tm = (mv('dt') || '').split('T')[1] || '', d2 = P.d2.value, days = bedDays(d1, d2);
  const vyd = BI('hosp.vyd'), urg = vyd === 0 ? 1 : vyd === 1 ? 2 : '';
  const napr = bNapr();
  const zt = mv('addr_np_t'), zh = zt === 'м.' ? 1 : zt === 'с.' ? 2 : '';
  const sr = sr66(), rz = rez66(), vp = S66('vp'), pil = S66('pil');
  const dx = {osn:BV('dx.osn'), mkh:BV('dx.mkh'), uskl:BV('dx.uskl'), sup:BV('dx.supd')};
  const p1 = bPage('b066 b066a', b066Head(),
    h('div', {class:'bt'}, 'Карта хворого, який вибув із стаціонару, № ', bFill(mv('card'), true)),
    bRow('1. Дата госпіталізації ', bDate(d1, true), bTime(tm), '  Номер медичної карти стаціонарного хворого ', bFill(mv('card'))),
    bRow('2. Прізвище, ім’я, по батькові хворого ', (()=>{ const f = bFill(mv('pib'), true, true); f.classList.add('bpib'); return f; })()),
    bRow('3. Стать: ', bU(sex === 'm', 'чоловіча – 1'), '; ', bU(sex === 'f', 'жіноча – 2'), ' ', bBox(sex === 'm' ? 1 : sex === 'f' ? 2 : '', true), '  4. Дата народження ', bDate(mv('dob'), true)),
    bRow('5. Вік (повних років) ', bFill(mv('age'), true), '  5.1. Житель: ', bU(zh === 1, 'міський – 1'), ', ', bU(zh === 2, 'сільський – 2'), ' ', bBox(zh)),
    bRow('5.2. Місце роботи (посада) ', bFill(mv('work'), false, true)),
    bRow('6. Місце проживання: ', bFill(mv('addr'), false, true)), h('div', {class:'bs r'}, '(область, район, населений пункт, вулиця, будинок, квартира)'),
    bRow('7. Ким направлений (заклад охорони здоров’я) ', bFill(napr, false, true), ' ', bCells(BV('morbi.hospe').replace(/\D/g, ''), 8)),
    bRow('8. Діагноз при направленні ', bFill('', false, true)),
    bRow('9. Відділення госпіталізації ', bFill(mv('vidd')), ' ', bCells(S66('vcode') || mv('vcode'), 3), '  10. Профіль ліжок ', bFill(S66('prof'), true)),
    bRow('11. Госпіталізація екстрена – 1, планова – 2 ', bBox(urg, true)),
    bRow('12. Строки госпіталізації (до 6 годин – 1; 7–24 год. – 2; пізніше 24 год. – 3) ', bBox(sr, true)),
    bRow('13. Госпіталізація з приводу даного захворювання в даному році вперше – 1, повторно – 2 ', bBox(vp >= 0 ? vp + 1 : '', true)),
    bRow('14. Результат лікування: ', ...['виписаний(а) з одужанням – 1', 'поліпшенням – 2', 'погіршенням – 3', 'без змін – 4', 'помер(ла) – 5', 'переведений(а) в інший лікувальний заклад – 6', 'здоровий(а) – 7']
      .flatMap((t, i)=>[i ? ', ' : '', bU(rz === i + 1, t)]), ' ', bSmall('(підкреслити) '), bBox(rz, true)),
    bRow('15. Дата виписки, смерті: ', bDate(d2, true), bTime('')),
    bRow('16. Проведено ліжко-днів ', bFill(days === '' ? '' : String(days), true)),
    bRow('17. Діагноз стаціонару (у разі травми — вказати її вид)'),
    h('table', {class:'btab b066dx'},
      h('thead', {}, h('tr', {}, h('th', {}, ''), h('th', {}, 'Основний'), h('th', {}, 'Код за МКХ-10'), h('th', {}, 'Ускладнення'), h('th', {}, 'Супутні захворювання'))),
      h('tbody', {},
        h('tr', {}, h('th', {class:'bv'}, '17а клінічний заключний'), h('td', {}, dx.osn), h('td', {class:'c'}, dx.mkh), h('td', {}, dx.uskl), h('td', {}, dx.sup)),
        h('tr', {}, h('th', {class:'bv'}, '17б патолого-анатомічний'), h('td', {colspan:'4'}, dead66() ? S66T('pat').replace(/^Патологоанатомічний діагноз:\s*/, '') : '')))));
  const ops = ops66().map(o=>[o.dt, [o.name, o.code ? '(' + o.code + ')' : ''].filter(Boolean).join(' '), o.spec, o.an, o.comp]);
  const opRows = [...ops, ...Array(Math.max(0, 5 - ops.length)).fill([])].slice(0, Math.max(5, ops.length));
  const dRow = (k, l) => h('div', {class:'b066d'}, h('span', {class:'bbox'}, ' '), h('span', {class:'bl'}, l + ') '), bFill(dead66() ? S66(k) : '', false, true));
  const p2 = bPage('b066 b066b',
    h('div', {class:'bs r'}, 'Продовження форми № 066/о'),
    bRow('18. У випадку смерті (з пункту 11 лікарського свідоцтва про смерть № ', bFill(dead66() ? S66('svid') : ''), ')'),
    dRow('da', 'I. а'), h('div', {class:'bs c'}, '(безпосередня причина смерті)'), dRow('db', 'б'), dRow('dv', 'в'), dRow('dg', 'г'),
    bRow('Приблизний час між початком захворювання і смертю ', bFill(dead66() ? S66('dt') : '')),
    h('div', {class:'bs'}, '(б, в, г — захворювання та патологічні стани, що зумовили безпосередню причину смерті; основна причина смерті вказується в останню чергу)'),
    bRow('II. Інші суттєві стани, які сприяли смерті ', bFill(dead66() ? S66('dII') : '', false, true)),
    bRow('У разі смерті жінок під час вагітності або після пологів у період до одного року зазначити тиждень вагітності ____, день післяпологового періоду ____, тиждень після пологів ____.'),
    bRow('19. Хірургічні операції'),
    h('table', {class:'btab b066op'},
      h('thead', {}, h('tr', {}, ...['Номер з/п', 'Дата, час', 'Назва операції та код згідно з класифікатором оперативних втручань', 'Хірург (прізвище, ім’я, по батькові)', 'Вид анестезії', 'Ускладнення при проведенні оперативного втручання'].map(t=>h('th', {}, t)))),
      h('tbody', {}, ...opRows.map((r, i)=>h('tr', {}, h('td', {class:'c'}, r.length ? String(i + 1) : ''), ...[0,1,2,3,4].map(k=>h('td', {}, r[k] || '')))))),
    bRow('20. Обстежений на RW ', bDate(d66.rw()), '  онкологічний профілактичний огляд ', bDate(d66.onko())),
    bRow('на ВІЛ-інфекцію ', bDate(d66.vil()), '  флюорографічний профілактичний огляд ', bDate(d66.flg())),
    bRow('21. ', ...['Інвалід війни – 1', 'учасник війни – 2', 'учасник бойових дій – 3', 'особа, яка постраждала внаслідок Чорнобильської катастрофи, – 4', 'інші пільгові категорії – 5'].flatMap((t, i)=>[i ? '; ' : '', bU(pil === i, t)]), ' ', bBox(pil >= 0 ? pil + 1 : '')),
    bRow('(категорія ', bFill(S66('pilk')), ' посвідчення: серія, № ', bFill(S66('pild')), ').'),
    h('div', {class:'b066sig'}, bRow('Лікуючий лікар ', bFill(mv('doc'), true), bSmall(' (прізвище, підпис)')),
      bRow('Дата «', bFill(d2 ? d2.slice(8,10) : ''), '» ', bFill(d2 ? ['січня','лютого','березня','квітня','травня','червня','липня','серпня','вересня','жовтня','листопада','грудня'][+d2.slice(5,7) - 1] : ''), ' ', bFill(d2 ? d2.slice(0,4) : ''), ' року.')));
  return [p1, p2];
}
/* назви документа */
Object.defineProperty(DOCTITLES, 'f066', {get:()=>F066ED === '2016' ? 'КАРТА ПАЦІЄНТА, ЯКИЙ ВИБУВ ІЗ СТАЦІОНАРУ' : 'КАРТА ХВОРОГО, ЯКИЙ ВИБУВ ІЗ СТАЦІОНАРУ', configurable:true, enumerable:true});
{ const fc = formCode; formCode = function(){ return DOC === 'f066' ? '066/о' : fc.apply(this, arguments); };
  const dt = docTitle; docTitle = function(){ return DOC === 'f066' ? 'Карта вибулого (ф. 066/о)' : dt.apply(this, arguments); }; }
/* п. 18 і 17б — лише коли «помер»; підказки з журналу обстежень */
{ const up = update; update = function(){ const r = up.apply(this, arguments);
    try{ const s = SECTIONS.find(x=>x.id === 's066'); if (s){ const dd = dead66();
        s.fields.forEach(f=>{ if (f.dead && f.wrapEl) f.wrapEl.hidden = !dd; });
        [['rw', d66.rw], ['vil', d66.vil], ['flg', d66.flg]].forEach(([k, fn])=>{ const f = F('s066.' + k); if (f && f.el && !f.el.value){ const v = fn(); f.el.title = v ? 'З журналу обстежень: ' + isoDMY(v) : ''; f.wrapEl && f.wrapEl.classList.toggle('fromres', !!v); } });
        const pf = F('s066.prof'); if (pf && pf.el && !pf.el.value){ const sp = lsGet('po.prof066', ''); if (sp) pf.el.placeholder = sp + ' (як минулого разу)'; } } }catch(e){}
    return r; }; }
/* профіль ліжок — запам'ятовується для наступних пацієнтів */
{ const pf = F('s066.prof'); if (pf && pf.el) pf.el.addEventListener('change', ()=>{ if (pf.el.value.trim()) lsSet('po.prof066', pf.el.value.trim()); }); }
/* титул 003/о: порожні пункти — із цих даних */
{ const bt = bTitle; bTitle = function(){ const pg = bt.apply(this, arguments);
    try{ const rows = [...pg.querySelectorAll('.brow')];
      const put = (re, nth, el) => { const r = rows.find(x=>re.test(x.textContent)); if (!r) return; const c = r.querySelectorAll('.bcells, .bbox, .bf')[nth]; if (c && el) c.replaceWith(el); };
      if (d66.vil()) put(/14\. Обстеження на ВІЛ/, 1, bCells(bD6(d66.vil()), 6));
      if (d66.krov()) put(/15\. Група крові/, 0, bFill(d66.krov()));
      if (d66.rh()) put(/15\. Група крові/, 1, bFill(d66.rh()));
      if (d66.rw()) put(/17\. Реакція Васермана/, 2, bCells(bD6(d66.rw()), 6));
      const vp = S66('vp'); if (vp >= 0) put(/^19\. Госпіталізація/, 0, bBox(vp + 1));
      const p30 = S66('p30'); if (p30 >= 0) put(/^19\.1\./, 0, bBox(p30 + 1));
    }catch(e){}
    return pg; }; }

/* підказки «який лікар» і «який заклад» — з попередніх пацієнтів */
{ const dl = (k) => { const id = 'dl_' + k, d = document.getElementById(id) || h('datalist', {id}); if (!d.parentNode) document.body.append(d); return d; };
  [['hospd','morbi_hospd'], ['hospz','morbi_hospz'], ['hospe','morbi_hospe']].forEach(([k])=>{ const f = F('morbi.' + k); if (!f || !f.el) return; const d = dl('morbi_' + k); f.el.setAttribute('list', d.id);
    f.el.addEventListener('focus', ()=>{ const st = loadStore(), seen = new Set(); Object.values(st).forEach(p=>{ const v = String((p.snap && p.snap.f || {})[f.el.id] || '').trim(); if (v) seen.add(v); }); d.innerHTML = ''; [...seen].sort().slice(0, 60).forEach(v=>d.append(h('option', {value:v}))); }); }); }

/* ---------- редакція 2016 року (наказ МОЗ № 29 від 21.01.2016): «Карта пацієнта, який вибув із стаціонару» ---------- */
function b066v16(){
  const P = F('e_per.per'), d1 = P.d1.value || (mv('dt') || '').split('T')[0], tm = (mv('dt') || '').split('T')[1] || '', d2 = P.d2.value, days = bedDays(d1, d2);
  const vyd = BI('hosp.vyd'), urg = vyd === 0 ? 1 : vyd === 1 ? 2 : '';
  const zt = mv('addr_np_t'), zh = zt === 'м.' ? 1 : zt === 'с.' ? 2 : '';
  const sr = sr66(), rz = rez66(), vp = S66('vp'), p30 = S66('p30'), pil = S66('pil'), tr = S66('trav'), tb = S66('tbres');
  const vc = S66('vcode') || mv('vcode'), dead = dead66();
  const hd = b066Head(); hd.querySelectorAll('.bhr div').forEach(x=>{ if (/^Наказ МОЗ України$/.test(x.textContent.trim())) x.after(bSmall('(у редакції наказу Міністерства охорони здоров’я України від 21.01.2016 № 29)')); });
  const dxRows = [[BV('dx.osn'), BV('dx.mkh'), 'основний'], ...BV('dx.uskl').split(/;\s*/).filter(Boolean).map(t=>[t, '', '1']), ...BV('dx.supd').split(/;\s*/).filter(Boolean).map(t=>[t, '', '2'])];
  while (dxRows.length < 8) dxRows.push(['', '', '']);
  const p1 = bPage('b066 b066a b066n', hd,
    h('div', {class:'bt'}, 'КАРТА ПАЦІЄНТА, ЯКИЙ ВИБУВ ІЗ СТАЦІОНАРУ, № ', bFill(mv('card'), true)),
    bRow('1. Дата госпіталізації ', bDate(d1, true), bTime(tm)),
    bRow('2. Прізвище, ім’я, по батькові пацієнта ', (()=>{ const f = bFill(mv('pib'), true, true); f.classList.add('bpib'); return f; })()),
    bRow('3. Стать: ', bU(sex === 'm', 'чоловіча – 1'), '; ', bU(sex === 'f', 'жіноча – 2'), ' ', bBox(sex === 'm' ? 1 : sex === 'f' ? 2 : '', true), '  4. Дата народження ', bDate(mv('dob'), true)),
    bRow('5. Вік (кількість повних років) ', bFill(mv('age'), true), '  6. Громадянство (код країни) ', bCells(S66('grom').replace(/\D/g, ''), 3)),
    bRow('7. Документ, що посвідчує особу ', bFill(S66('docid').split(',')[0] || ''), '  7.1. Номер документа ', bFill((S66('docid').split(',').slice(1).join(',') || '').trim())),
    bRow('8. Постійне місце проживання/перебування: ', bU(zh === 1, 'місто – 1'), '; ', bU(zh === 2, 'село – 2'), ' ', bBox(zh), ' ', bFill(mv('addr'), false, true)),
    h('div', {class:'bs r'}, '(область, район, населений пункт, вулиця, будинок, квартира)'),
    bRow('9. Поштовий індекс ', bCells(mv('addr_zip'), 5), '  10. Місце роботи, посада ', bFill(mv('work'), false, true)),
    bRow('11. Ким направлений пацієнт ', bFill(bNapr(), false, true), ' ', bCells(BV('morbi.hospe').replace(/\D/g, ''), 8)),
    bRow('12. Діагноз при госпіталізації ', bFill('', false, true), ' ', bCells('', 6)),
    bRow('13. Відділення госпіталізації ', bCells(vc, 2), '  14. Відділення виписки (профіль ліжок) ', bCells(vc, 2), ' ', bFill(S66('prof'))),
    bRow('15. Госпіталізація: ургентна – 1; планова – 2 ', bBox(urg, true), '  16. Строк госпіталізації: до 6 годин – 1; 7–24 години – 2; більше 24 годин – 3 ', bBox(sr, true)),
    bRow('17. Госпіталізація з приводу цього захворювання в цьому році: вперше – 1; повторно – 2 ', bBox(vp >= 0 ? vp + 1 : '', true)),
    bRow('17.1. Повторна госпіталізація з приводу цього захворювання до 30 днів: так – 1; ні – 2 ', bBox(p30 >= 0 ? p30 + 1 : '')),
    bRow('18. Результат лікування: ', ...['виписаний(а) з одужанням – 1', 'поліпшенням – 2', 'погіршенням – 3', 'без змін – 4', 'помер(ла) – 5', 'переведений(а) до іншого закладу охорони здоров’я – 6', 'здоровий(а) – 7'].flatMap((t, i)=>[i ? '; ' : '', bU(rz === i + 1, t)]), ' ', bBox(rz, true)),
    bRow('19. Дата виписки/смерті ', bDate(d2, true), bTime(''), '  20. Проведено ліжко-днів ', bFill(days === '' ? '' : String(days), true)),
    bRow('21. Діагноз заключний клінічний (у випадку травми: ', bU(tr === 0, 'виробнича – 1'), '; ', bU(tr === 1, 'невиробнича – 2'), ') ', bBox(tr >= 0 ? tr + 1 : '')),
    h('table', {class:'btab b066dx2'}, h('thead', {}, h('tr', {}, h('th', {}, 'Назва діагнозу'), h('th', {}, 'Код за МКХ-10'), h('th', {}, 'ускладнення основного діагнозу – 1; супутнє захворювання – 2'))),
      h('tbody', {}, ...dxRows.map(r=>h('tr', {}, h('td', {}, r[2] === 'основний' && r[0] ? 'Основний: ' + r[0] : r[0]), h('td', {class:'c'}, r[1]), h('td', {class:'c'}, r[2] === 'основний' ? '' : r[2]))))),
    bRow('21.1. Категорія резистентності: ', ...['відсутня – 1', 'чутливий ТБ – 2', 'монорезистентний ТБ – 3', 'полірезистентний ТБ – 4', 'мультирезистентний ТБ – 5', 'туберкульоз із розширеною резистентністю – 6'].flatMap((t, i)=>[i ? '; ' : '', bU(tb === i, t)]), ' ', bBox(tb >= 0 ? tb + 1 : '')));
  const ops = ops66(), opRows = [...ops, ...Array(Math.max(0, 5 - ops.length)).fill(null)];
  const anCode = t => /відсут|без анест/i.test(t) ? '1' : /місц/i.test(t) ? '2' : /загальн|наркоз|ендотрах|внутрішньовен/i.test(t) ? '3' : t ? '4' : '';
  const dRow = (k, l) => h('div', {class:'b066d'}, h('span', {class:'bl'}, l + ') '), bFill(dead ? S66(k) : '', false, true));
  const p2 = bPage('b066 b066b b066n',
    h('div', {class:'bs r'}, 'Продовження форми № 066/о'),
    bRow('22. У випадку смерті пацієнта:'),
    bRow('22.1. Патологоанатомічний діагноз'),
    h('table', {class:'btab'}, h('thead', {}, h('tr', {}, ...['Основний', 'Код за МКХ-10', 'Ускладнення основного діагнозу', 'Супутні захворювання'].map(t=>h('th', {}, t)))),
      h('tbody', {}, h('tr', {}, h('td', {colspan:'4', style:'height:3em'}, dead ? S66T('pat').replace(/^Патологоанатомічний діагноз:\s*/, '') : '')))),
    bRow('22.2. Із пункту 11 лікарського свідоцтва про смерть № ', bFill(dead ? S66('svid') : '')),
    dRow('da', 'I. а'), dRow('db', 'б'), dRow('dv', 'в'), dRow('dg', 'г'),
    bRow('Приблизний час між початком захворювання і смертю ', bFill(dead ? S66('dt') : '')),
    bRow('II. Інші суттєві стани (конкуруючі, поєднані, фонові — підкреслити) ', bFill(dead ? S66('dII') : '', false, true)),
    bRow('Для жінок, які померли під час вагітності або після пологів (до 1 року): тиждень вагітності ____, день післяпологового періоду ____, тиждень після пологів ____.'),
    bRow('23. Медичні процедури та хірургічні операції'),
    h('table', {class:'btab b066op2'},
      h('thead', {}, h('tr', {}, ...['Дата (число, місяць, рік)', 'Час (години, хвилини)', 'Код процедури / хірургічної операції', 'Назва процедури / хірургічної операції', 'Спеціаліст (ПІБ, реєстраційний номер)', 'Вид анестезії (відсутня – 1; місцева – 2; загальна – 3; інша – 4)', 'Анестезіолог (ПІБ, реєстраційний номер)', 'Ускладнення (код за МКХ-10)'].map(t=>h('th', {}, t)))),
      h('tbody', {}, ...opRows.map(o=>{ const dt = o ? o.dt.split(/\s+/) : []; return h('tr', {}, ...(o ? [dt[0] || '', dt.slice(1).join(' '), o.code, o.name, o.spec, anCode(o.an), o.anes, o.comp] : ['', '', '', '', '', '', '', '']).map(v=>h('td', {}, v))); }))),
    bRow('24. Обстеження на RW ', bDate(d66.rw()), '  25. Онкологічний профілактичний медичний огляд ', bDate(d66.onko())),
    bRow('26. Обстеження на ВІЛ-інфекцію ', bDate(d66.vil()), '  27. Обстеження органів грудної порожнини ', bDate(d66.flg())),
    bRow('28. Пільгова категорія: ', ...['інвалід війни – 1', 'учасник війни – 2', 'учасник бойових дій – 3', 'особа, яка постраждала внаслідок Чорнобильської катастрофи, – 4', 'інша пільгова категорія – 5'].flatMap((t, i)=>[i ? '; ' : '', bU(pil === i, t)]), ' ', bBox(pil >= 0 ? pil + 1 : '')),
    bRow('(категорія ', bFill(S66('pilk')), ' посвідчення: серія, № ', bFill(S66('pild')), ')'),
    h('div', {class:'b066sig'}, bRow('Лікуючий лікар ', bFill(mv('doc'), true), bSmall(' (прізвище, ім’я, по батькові) '), ' підпис ____________  реєстраційний номер ', bFill(mv('docreg'))),
      bRow('Дата ', bDate(d2))));
  return [p1, p2];
}
/* перемикач редакції над бланком */
{ const bb = blankBar; blankBar = function(){ const bar = bb.apply(this, arguments);
    if (DOC === 'f066' && BLANK){ const s = h('span', {class:'seg'}, ...[['2012', 'Ред. 2012 («Карта хворого…»)'], ['2016', 'Ред. 2016 («Карта пацієнта…», чинна)']].map(([k, t])=>h('button', {type:'button', 'aria-pressed':F066ED === k ? 'true' : 'false', onclick:()=>{ F066ED = k; lsSet('po.f066ed', k); renderPaper(); }}, t)));
      bar.append(s); }
    return bar; }; }
