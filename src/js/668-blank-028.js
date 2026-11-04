/* ===== 0.9.3.81 — бланк 028/о «Консультаційний висновок спеціаліста» (наказ МОЗ № 110 від 14.02.2012), як у закладі =====
   «Перед друком» → «Бланк 028/о» на документі «Консультація» (стаціонар і амбулаторно): той самий бланк, заповнений з форми.
   «🖨 Порожні бланки» → «Консультаційний висновок 028/о» — порожній, лише шапка закладу. */
function b028Head(){
  const hd = bHead();
  hd.querySelectorAll('b').forEach(b=>{ if (/№ 003\/о/.test(b.textContent)) b.textContent = '№ 028/о'; });
  hd.querySelectorAll('.bs').forEach(x=>{ if (/у редакції наказу/.test(x.textContent)) x.remove(); });
  /* у бланку закладу дата й номер наказу в шапці — порожні клітинки */
  const cells = hd.querySelectorAll('.bhr .bcells'); if (cells[0]) cells[0].replaceWith(bCells('', 8)); if (cells[1]) cells[1].replaceWith(bCells('', 4));
  return hd;
}
function b028(empty){
  const P = {};
  if (!empty) try{ kons028Parts().forEach((p, i)=>{ const v = String(p.body || '').trim(); P[i + 1] = /^_{5,}$/.test(v) ? '' : v; }); }catch(e){}
  const v = i => empty ? '' : (P[i] || '');
  const dob = empty ? '' : mv('dob'), d = /^(\d{4})-(\d\d)-(\d\d)/.exec(dob || '');
  const dt = empty ? '' : (mv('dt') || '').split('T')[0], m = /^(\d{4})-(\d\d)-(\d\d)/.exec(dt || '');
  const MON = ['січня','лютого','березня','квітня','травня','червня','липня','серпня','вересня','жовтня','листопада','грудня'];
  const dateLine = m ? `«${m[3]}» ${MON[+m[2] - 1]} ${m[1]} року` : '«___» ____________ 20___ року';
  const page = bPage('b028', b028Head(),
    h('div', {class:'bt b028t'}, 'Консультаційний висновок спеціаліста'),
    bRow('1. Найменування закладу охорони здоров’я, який направив пацієнта на консультацію ', bFill(v(1), !empty, true)),
    bLines(empty ? '' : '', 1),
    bRow('2. Прізвище, ім’я, по батькові пацієнта ', bFill(v(2), !empty, true)),
    bLines('', 1),
    h('div', {class:'brow b028dob'}, h('span', {class:'bl'}, '3. Дата народження '), h('span', {class:'bnw'}, bCells(d ? d[3] : '', 2, !empty), h('span', {class:'bdot'}, '.'), bCells(d ? d[2] : '', 2, !empty), h('span', {class:'bdot'}, '.'), bCells(d ? d[1] : '', 4, !empty))),
    h('div', {class:'bs b028s'}, '(число, місяць, рік)'),
    bRow('4. Спеціальність, прізвище, ім’я, по батькові лікаря-консультанта ', bFill(v(4), !empty, true)),
    bRow('5. Результати лабораторного дослідження ', bFill('', false, true)), bLines(v(5), 2),
    bRow('6. Результати функціонального, рентгенологічного та інших спеціальних досліджень:'), bLines(v(6), 2),
    bRow('7. Висновок спеціаліста (встановлений діагноз)'), bLines(v(7), 2, !empty),
    bRow('8. Рекомендації:'), bLines(v(8), 2, !empty),
    h('div', {class:'b028f'},
      h('div', {class:'b028d'}, dateLine), h('div', {class:'b028mp'}, 'М.П.')),
    h('div', {class:'b028sg'},
      h('div', {}, h('span', {}, 'Лікар-консультант'), h('span', {class:'b028n'}, h('span', {class:'b028l'}, empty ? '' : mv('doc')), h('span', {class:'bs'}, '(П.І.Б.) (підпис)'))),
      h('div', {}, h('span', {}, 'Завідувач поліклініки або стаціонарного відділення'), h('span', {class:'b028n'}, h('span', {class:'b028l'}, empty ? '' : mv('zav')), h('span', {class:'bs'}, '(П.І.Б.) (підпис)')))));
  page.prepend(h('div', {class:'b028appr'}, h('b', {}, 'ЗАТВЕРДЖЕНО'), h('div', {}, 'Наказ Міністерства охорони здоров’я України'), h('div', {}, '14 лютого 2012 року № 110')));
  return [page];
}
/* порожній бланк — у «🖨 Порожні бланки» (шапка закладу з «Налаштувань», даних пацієнта немає) */
try{ if (!FBLANKS.some(b=>b.k === 'k028')){
  const e = {k:'k028', t:'Консультаційний висновок спеціаліста — форма 028/о', cls:'fbk fbk-028'};
  Object.defineProperty(e, 'html', {enumerable:true, get(){ try{ return b028(true).map(p=>p.outerHTML).join(''); }catch(x){ return ''; } }});
  FBLANKS.push(e); } }catch(e){}
/* «Вносити на бланку»: клік по пункту бланка 028/о — віконце з полями цього пункту */
try{ PE_ROWS.unshift(
  [/^1\. Найменування закладу охорони здоров’я, який направив/, ['k_main.napr']],
  [/^2\. Прізвище, ім’я, по батькові пацієнта/, ['meta_pib']],
  [/^3\. Дата народження/, ['meta_dob']],
  [/^4\. Спеціальність, прізвище/, ['meta_doc','meta_pos']],
  [/^5\. Результати лабораторного дослідження|^6\. Результати функціонального/, ['e_obs']],
  [/^7\. Висновок спеціаліста/, ['k_main.mety','k_main.obj','dx.osn','dx.mkh']],
  [/^8\. Рекомендації/, ['e_rek']]); }catch(e){}
