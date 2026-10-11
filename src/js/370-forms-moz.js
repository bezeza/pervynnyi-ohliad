/* ===== Виписка за формою № 027/о: пункти бланка (наказ МОЗ від 14.02.2012 № 110) ===== */
function epi027(){ const f = F('e_per.vyg'); return !!(f && f.el && f.el.value === '0'); }
function epi027Parts(){
  const sec = id => SECTIONS.find(x=>x.id === id), body = id => { const t = sectionText(sec(id)); return t ? t.body : ''; }, full = id => { const t = sectionText(sec(id)); return t ? (t.head ? t.head + t.sep : '') + t.body : ''; };
  const P = F('e_per.per'), d1 = P.d1.value, d2 = P.d2.value, fd = v => v ? fmtD(v) : '__________';
  const dob = mv('dob');
  let dzah = F('e_per.dzah').el.value;
  if (!dzah){ const md = F('morbi.dur'); const n = md && md.inp ? parseInt(md.inp.value, 10) : NaN, u = md && md.unit ? +md.unit.value : 0, base = d1 || (mv('dt') || '').split('T')[0];
    if (n > 0 && base && (u === 0 || u === 1)){ const d = new Date(base + 'T12:00'); d.setDate(d.getDate() - n * (u === 1 ? 7 : 1)); dzah = d.toISOString().slice(0, 10); } }
  const elnT = val(F('e_lik.eln'), true), elnS = elnT ? end(cap(elnT).replace(/\.$/, '')).replace(/….$/, '…') : '';
  let lik = body('e_lik'); if (elnS) lik = lik.replace(' ' + elnS, '').replace(elnS, '').trim();
  const items = [
    ['У', val(F('e_per.kudy'), true) || '______________________________ (найменування і місцезнаходження закладу охорони здоров’я, куди направляється виписка)'],
    ['1. Прізвище, ім’я, по батькові хворого:', mv('pib') || '______________________________'],
    ['2. Дата народження:', dob ? fmtD(dob) : '__________'],
    ['3. Місце проживання хворого:', mv('addr') || 'область ________, район ________, місто (село) ________, вулиця ________, будинок ____, кв. ____'],
    ['4. Місце роботи (посада):', mv('work') || '______________________________'],
    ['5. Дати:', `а) в амбулаторно-поліклінічному закладі: захворювання — ${fd(dzah)}; направлення в стаціонар — ${fd(F('e_per.dnapr').el.value)}; б) у стаціонарі: надходження — ${fd(d1)}; ${F('e_per.vs').el.value === '1' ? 'смерті' : 'виписки'} — ${fd(d2)}.`],
    ['6. Повний діагноз (основне захворювання, супутні захворювання та ускладнення):', body('dx') || '______________________________', '\n'],
    ['7. Короткий анамнез, діагностичні дослідження, перебіг хвороби, проведене лікування, стан при направленні, при виписці:', [body('e_per'), full('e_obs'), lik].filter(Boolean).join('\n') || '______________________________', '\n'],
    ['8. Лікувальні і трудові рекомендації:', [body('e_rek'), elnS].filter(Boolean).join('\n') || '______________________________', '\n']
  ];
  return items.map(([head, b, sep])=>({head, body:b, sep: sep || ' ', title:head}));
}

/* ===== Епікриз у медичну карту (форма № 003/о, с. 8–9) ===== */
function epi003(){ const f = F('e_per.vyg'); return !!(f && f.el && f.el.value === '2'); }
function epi003Parts(){
  const sec = id => SECTIONS.find(x=>x.id === id), body = id => { const t = sectionText(sec(id)); return t ? t.body : ''; };
  const V = k => val(F(k), true);
  const lik = V('e_lik.lik') || rxSummary(), dyn = V('e_lik.dyn'), vyp = V('e_lik.vyp');
  const intro = [body('e_per'), dyn ? end(cap(dyn)) : '', vyp ? 'При виписці: ' + end(vyp) : ''].filter(Boolean).join(' ');
  const eln = V('e_lik.eln'), rezI = F('e_lik.rez').el.value, dead = F('e_per.vs') && F('e_per.vs').el.value === '1';
  const eff = dead ? 'помер (5)' : rezI !== '' ? ['виписаний з одужанням (1)','виписаний з поліпшенням (2)','виписаний без змін (4)','виписаний з погіршенням (3)'][+rezI] : '';
  return [
    {head:'', body:intro || '______________________________', sep:''},
    {head:'Дані обстеження:', body:body('e_obs') || '______________________________', sep:'\n'},
    {head:'За результатами проведеного обстеження встановлено клінічний діагноз:', body:body('dx') || '______________________________', sep:'\n'},
    {head:'Лікування:', body:lik ? end(lik) : '______________________________', sep:' '},
    {head:'Лікувальні та трудові рекомендації:', body:[body('e_rek'), eln ? end(cap(eln)) : ''].filter(Boolean).join('\n') || '______________________________', sep:'\n'},
    eff ? {head:'Ефективність лікування:', body:end(eff), sep:' '} : null
  ].filter(Boolean);
}
/* ===== Консультаційний висновок спеціаліста (форма № 028/о) ===== */
const LABRE = /^(ЗАК|ЗАС|Загальний аналіз|Біохімічн|Глюкоза|HbA1c|Ліпідограма|Амілаза|Коагулограма|D-димер|С-реактивн|СРБ|ТТГ|Аналіз|Бакпосів|Бактеріолог|Маркери|Група крові|Тропонін|Прокальцитонін|Сеча|Кал|Мазок|Експрес-тест)/i;
function kons028Parts(){
  const sec = id => SECTIONS.find(x=>x.id === id), body = id => { const t = sectionText(sec(id)); return t ? t.body : ''; };
  const obs = body('e_obs').split('\n').map(x=>x.trim()).filter(Boolean);
  const lab = obs.filter(l=>LABRE.test(l)), oth = obs.filter(l=>!LABRE.test(l));
  const dob = mv('dob'), cons = [mv('pos') || 'Лікар', mv('doc')].filter(Boolean).join(' ');
  const kv = (k, t) => { const v = val(F(k), true); return v ? end(cap(t.replace('{v}', v))) : ''; };
  const exam = [kv('k_main.mety', 'Мета консультації: {v}'), kv('k_main.sk', 'Скарги {v}'), kv('k_main.anam', '{v}'), kv('k_main.obj', 'Об’єктивно: {v}')].filter(Boolean).join(' ');
  const B = '______________________________';
  return [
    {head:'1. Найменування закладу охорони здоров’я, який направив пацієнта на консультацію:', body:val(F('k_main.napr'), true) || B, sep:' '},
    {head:'2. Прізвище, ім’я, по батькові пацієнта:', body:mv('pib') || B, sep:' '},
    {head:'3. Дата народження:', body:dob ? fmtD(dob) : '__________', sep:' '},
    {head:'4. Спеціальність, прізвище, ім’я, по батькові лікаря-консультанта:', body:cons || B, sep:' '},
    {head:'5. Результати лабораторного дослідження:', body:lab.join('\n') || B, sep:'\n'},
    {head:'6. Результати функціонального, рентгенологічного та інших спеціальних досліджень:', body:oth.join('\n') || B, sep:'\n'},
    {head:'7. Висновок спеціаліста (встановлений діагноз):', body:[exam, body('dx')].filter(Boolean).join('\n') || B, sep:'\n'},
    {head:'8. Рекомендації:', body:[body('e_rek'), MODE === 'amb' ? body('eln') : ''].filter(Boolean).join('\n') || B, sep:'\n'}
  ];
}

