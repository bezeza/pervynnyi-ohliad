/* ================= ПАЦІЄНТ, ЛІКАР, ДРУК ================= */
const DOC_KEYS = ['zoz','vidd','doc','pos','zav','nach','golov','pidp','adr','edrpou','tel','email'];   // запам'ятовуються в цьому браузері (лише дані лікаря)
const RECS = ['Первинний огляд лікуючого лікаря','Огляд лікаря приймального відділення','Огляд чергового лікаря','Спільний огляд із завідувачем відділення','Спільний огляд із заступником головного лікаря з медичної роботи','Спільний огляд із завідувачем відділення та заступником головного лікаря з медичної роботи'];
const RECS_A = ['Первинний огляд','Первинний огляд вдома','Огляд за зверненням'];
const POS = ['Лікар-терапевт','Лікар-кардіолог','Лікар-ендокринолог','Лікар-гастроентеролог','Лікар-пульмонолог','Лікар-ревматолог','Лікар-нефролог','Лікар-геріатр','Лікар-фізичної та реабілітаційної медицини','Лікар приймального відділення','Черговий лікар','Лікар-невролог','Лікар-хірург','Лікар-інфекціоніст','Лікар загальної практики – сімейний лікар','Лікар-інтерн','Завідувач відділення'];
const mv = id => { const e = document.getElementById('meta_' + id); return e ? e.value.trim() : ''; };
const pad = n => String(n).padStart(2,'0');
function setNow(){ const d = new Date(), e = document.getElementById('meta_dt'); if (e) e.value = `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`; }
function fmtDT(v){ if (!v) return ''; const [d,t] = v.split('T'); const [y,m,dd] = d.split('-'); return `${dd}.${m}.${y}` + (t ? `, ${t}` : ''); }
function fmtD(v){ if (!v) return ''; const [y,m,d] = v.split('-'); return `${d}.${m}.${y}`; }
function calcAge(){
  const b = mv('dob'), dt = mv('dt'), e = document.getElementById('meta_age'); if (!e) return;
  if (!b){ e.value = ''; return; }
  const B = new Date(b + 'T00:00'), D = dt ? new Date(dt) : new Date();
  let a = D.getFullYear() - B.getFullYear(); if (D.getMonth() < B.getMonth() || (D.getMonth() === B.getMonth() && D.getDate() < B.getDate())) a--;
  e.value = a >= 0 && a < 130 ? a : '';
}
function saveDoc(){ try{ const o = {}; DOC_KEYS.forEach(k=>o[k] = mv(k)); localStorage.setItem('po.doc', JSON.stringify(o)); }catch(e){} }
function loadDoc(){ try{ const o = JSON.parse(localStorage.getItem('po.doc') || '{}'); DOC_KEYS.forEach(k=>{ const e = document.getElementById('meta_' + k); if (e && o[k]) e.value = o[k]; }); }catch(e){} }

function buildMetaPanel(){
  const wrap = h('div', {});
  const inp = (id, label, attrs = {}) => { const e = h('input', Object.assign({id:'meta_' + id, oninput:()=>{ if (id === 'edrpou') e.classList.toggle('bad', !!e.value && !/^\d{8}$/.test(e.value)); if (id === 'email') e.classList.toggle('bad', !!e.value && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(e.value)); if (DOC_KEYS.includes(id)) saveDoc(); calcAge(); update(); }}, attrs));
    return h('div', {class:'f' + (attrs.wide ? ' wide' : '')}, h('label', {for:'meta_' + id}, label), e); };
  const sel = (id, label, opts) => { const e = h('select', {id:'meta_' + id, onchange:()=>{ if (DOC_KEYS.includes(id)) saveDoc(); update(); }}); opts.forEach(o=>e.append(h('option', {}, o)));
    return h('div', {class:'f'}, h('label', {for:'meta_' + id}, label), e); };
  const gP = h('div', {class:'grid'},
    inp('pib', 'ПІБ пацієнта', {autocomplete:'off'}),
    inp('dob', 'Дата народження', {type:'date'}),
    inp('age', 'Вік (рахується сам)', {readonly:'', tabindex:'-1'}),
    inp('card', '№ медичної карти', {inputmode:'numeric', autocomplete:'off'}),
    inp('addr', 'Місце проживання (для виписки 027/о)', {autocomplete:'off', placeholder:'необов’язково', wide:true}),
    inp('work', 'Місце роботи, рід занять', {autocomplete:'off', placeholder:'необов’язково', wide:true}));
  const dt = h('input', {id:'meta_dt', type:'datetime-local', oninput:()=>{ calcAge(); update(); }});
  const gR = h('div', {class:'grid'},
    sel('rec', 'Вид запису', RECS),
    h('div', {class:'f'}, h('label', {for:'meta_dt'}, 'Дата і час огляду'), h('div', {class:'nums'}, dt, h('button', {type:'button', class:'btn', onclick:()=>{ setNow(); calcAge(); update(); }}, 'Зараз'))));
  const gD = h('div', {class:'grid'},
    inp('doc', 'Лікар (ПІБ)', {placeholder:'Прізвище І. Б.'}),
    h('div', {class:'f'}, h('label', {for:'meta_pos'}, 'Посада (оберіть або впишіть свою)'),
      h('input', {id:'meta_pos', list:'posList', placeholder:'Лікар-терапевт', autocomplete:'off', oninput:()=>{ saveDoc(); update(); }}),
      h('datalist', {id:'posList'}, ...POS.map(o=>h('option', {value:o})))),
    inp('zav', 'Завідувач відділення (для підпису)', {placeholder:'необов’язково'}),
    inp('nach', 'Заступник головного лікаря з медичної роботи', {placeholder:'для спільних оглядів і консиліумів'}),
    inp('golov', 'Головний лікар (директор)', {placeholder:'необов’язково'}),
    inp('vidd', 'Відділення', {placeholder:'Терапевтичне відділення № 2'}),
    );
  wrap.append(h('h3', {class:'sub', style:'margin-top:0'}, 'Пацієнт'), gP, h('h3', {class:'sub'}, 'Запис'), gR,
    h('p', {class:'chips-hint', style:'margin:8px 0 14px'}, 'Лікар, відділення й дані закладу — на вкладці «Налаштування».'), patientsBlock());
  const gZ = h('div', {class:'grid'},
      inp('pidp', 'Підпорядкування', {placeholder:'напр., Міністерство охорони здоров’я України', wide:true}),
      inp('zoz', 'Повна назва закладу', {placeholder:'КНП «…» … міської ради', wide:true}),
      inp('adr', 'Адреса закладу', {placeholder:'індекс, місто, вулиця, будинок', wide:true}),
      inp('edrpou', 'Код за ЄДРПОУ', {inputmode:'numeric', maxlength:'8', placeholder:'8 цифр'}),
      inp('tel', 'Телефон', {type:'tel', placeholder:'+380 …'}),
      inp('email', 'Електронна пошта', {type:'email', placeholder:'likarnia@…'}));
  const sw = h('div', {});
  sw.append(h('p', {class:'lead'}, 'Ці дані вносяться один раз: вони запам’ятовуються в цьому браузері, не залежать від пацієнта й ідуть у шапку та підписи всіх документів.'),
    h('h3', {class:'sub'}, 'Лікар і відділення'), gD, h('h3', {class:'sub'}, 'Заклад (для шапки документів)'), gZ,
    h('div', {class:'f wide', style:'margin-top:8px'}, h('label', {}, 'Логотип закладу (для шапки й друку, PNG/JPG до 400 КБ)'), h('div', {class:'zlogobox acts2'})),
    h('h3', {class:'sub'}, 'Спеціальність'),
    h('div', {class:'grid'}, h('div', {class:'f wide'}, h('label', {for:'set_spec'}, 'Профіль роботи'),
      (()=>{ const e = h('select', {id:'set_spec'}, h('option', {value:'ter'}, 'Терапія, неврологія, хірургія, інфекційні (вкладка «Травма» — лише для травм)'), h('option', {value:'tr'}, 'Травматологія (вкладка «Травма» і поля травми завжди видимі)'), h('option', {value:'fam'}, 'Сімейний лікар (амбулаторний режим, коди ICPC-2)'));
        e.value = SPEC; e.addEventListener('change', ()=>{ SPEC = e.value; try{ localStorage.setItem('po.spec', SPEC); }catch(x){} if ((SPEC === 'tr' || SPEC === 'fam') && HV.filter){ curGroup = SPEC; HV.filter(); } if (SPEC === 'fam' && MODE !== 'amb'){ MODE = 'amb'; try{ localStorage.setItem('po.mode', MODE); }catch(x){} applyMode(); } syncLoc(true); update(); toast(SPEC === 'tr' ? 'Профіль: травматологія — вкладка «Травма» і заготовки травм' : SPEC === 'fam' ? 'Профіль: сімейний лікар — амбулаторний режим, коди ICPC-2' : 'Профіль: загальний'); }); return e; })(),
      h('p', {class:'chips-hint', style:'margin-top:6px'}, 'Для травматології вкладка «Травма» (Status localis), обставини травми, щеплення проти правця і місцевий статус у щоденнику показуються завжди, а у «При хворобі» першими відкриваються травматологічні заготовки.'))),
    h('h3', {class:'sub'}, 'Оформлення документів'),
    h('div', {class:'grid'}, h('div', {class:'f wide'}, h('label', {for:'set_f110'}, 'Документи'),
      (()=>{ const e = h('select', {id:'set_f110'}, h('option', {value:'1'}, 'За бланками наказу МОЗ № 110: пункти форм 027/о, 028/о, 003/о'), h('option', {value:'0'}, 'Довільне оформлення'));
        e.value = F110 ? '1' : '0'; e.addEventListener('change', ()=>{ F110 = e.value === '1'; try{ localStorage.setItem('po.f110', e.value); }catch(x){} update(); toast(F110 ? 'Документи — за бланками наказу МОЗ № 110' : 'Довільне оформлення документів'); }); return e; })(),
      h('p', {class:'chips-hint', style:'margin-top:6px'}, 'За бланками: діагноз — «а) основний, б) ускладнення основного, в) супутній»; консультація — пункти 1–8 форми № 028/о; виписка — форма № 027/о або епікриз форми № 003/о (обирається у вкладці «Перебування»).'))),
    h('h3', {class:'sub'}, 'Довідники кодів'),
    h('p', {class:'chips-hint'}, 'Вбудовано: МКХ-10 (ВООЗ) — найуживаніші коди, і ICPC-2. Для кодування за національними класифікаторами завантажте офіційні таблиці НК 025:2021 і НК 026:2021, збережені як CSV (UTF-8): код в одному стовпці, назва — в іншому. Дані лишаються на цьому пристрої.'),
    h('div', {class:'dictbox'}),
    h('h3', {class:'sub'}, 'Госпіталізація'),
    h('div', {class:'grid'}, h('div', {class:'f wide'}, h('label', {for:'set_hospdef'}, 'Вид госпіталізації при виборі хвороби'),
      (()=>{ const e = h('select', {id:'set_hospdef'}, h('option', {value:'preset'}, 'Як у заготовці (планова для ГХ, ІХС, діабету тощо)'), h('option', {value:'e'}, 'Завжди екстрена (ургентне відділення)'));
        e.value = HOSPDEF; e.addEventListener('change', ()=>{ HOSPDEF = e.value; try{ localStorage.setItem('po.hospdef', HOSPDEF); }catch(x){} toast(HOSPDEF === 'e' ? 'Тепер при виборі хвороби ставиться екстрена госпіталізація з ургентним критерієм' : 'Вид госпіталізації — як у заготовці'); }); return e; })(),
      h('p', {class:'chips-hint', style:'margin-top:6px'}, 'Для екстреної госпіталізації програма підставляє типовий ургентний критерій хвороби з позначкою «з шаблону — перевірте». Якщо його немає — розгортає список ургентних ознак (розд. III): відмітьте наявні або внесіть показники.'))),
    h('h3', {class:'sub'}, 'Папка даних на комп’ютері'),
    h('div', {class:'fsbox'}),
    h('h3', {class:'sub'}, 'Дані пацієнтів'),
    h('p', {class:'chips-hint storebox'}),
    h('div', {class:'acts2'}, h('button', {type:'button', class:'btn', onclick:exportAll}, 'Резервна копія: зберегти всіх у файл'),
      h('button', {type:'button', class:'btn', onclick:()=>{ const f = document.querySelector('#panels input[type=file][accept^=".json"]'); if (f) f.click(); }}, 'Відкрити пацієнтів з файлу')),
    h('p', {class:'chips-hint', style:'margin-top:6px'}, 'Пацієнти зберігаються лише в цьому браузері. Робіть копію щотижня; файл переносить пацієнтів на інший комп’ютер чи телефон.'));
  SETTINGS_EL = sw;
  sw.append(h('details', {class:'about'}, h('summary', {}, `Про програму · версія ${VERSION}${STAGE ? ' ' + STAGE : ''} від ${VDATE} · автор: ${AUTHOR}`),
    h('p', {class:'chips-hint'}, 'Ліцензія GNU AGPL-3.0 · код: github.com/bezeza/pervynnyi-ohliad'), h('p', {class:'chips-hint'}, 'Генератор медичної документації для стаціонару й амбулаторного прийому. Працює без інтернету; дані пацієнтів зберігаються лише в цьому браузері. Програма готує текст — остаточне рішення та підпис за лікарем.'),
    h('ul', {class:'vlist'}, ...CHANGELOG.map(([v, d, t])=>h('li', {}, h('b', {}, v), ' · ' + d + ' — ' + t)))));
  return wrap;
}


const ALLDOCS = ['ohl','shch','rx','epi','kons','zav','konc','etap','per','napr','dov','zgoda','gosp','pam'];
const DOCTITLES = {konc:'ПРОТОКОЛ КОНСИЛІУМУ', epi:'ВИПИСНИЙ ЕПІКРИЗ', kons:'КОНСУЛЬТАЦІЙНИЙ ВИСНОВОК', rx:'ЛИСТ ЛІКАРСЬКИХ ПРИЗНАЧЕНЬ', etap:'ЕТАПНИЙ ЕПІКРИЗ', per:'ПЕРЕКАЗНИЙ ЕПІКРИЗ',
  napr:'НАПРАВЛЕННЯ НА КОНСУЛЬТАЦІЮ', gosp:'НАПРАВЛЕННЯ НА ГОСПІТАЛІЗАЦІЮ', pam:'ПАМ’ЯТКА ПАЦІЄНТУ', dov:'ДОВІДКА', zgoda:'ІНФОРМОВАНА ДОБРОВІЛЬНА ЗГОДА ПАЦІЄНТА НА ПРОВЕДЕННЯ ДІАГНОСТИКИ ТА ЛІКУВАННЯ'};
function lc1(t){ return /^[А-ЯІЇЄҐA-Z][а-яіїєґa-z’']/.test(t) ? t.charAt(0).toLowerCase() + t.slice(1) : t; }
function dovText(){
  const pib = mv('pib'); if (!pib) return '';
  const tip = +F('v_main.tip').el.value || 0, P = F('v_main.per'), a = P.d1.value, b = P.d2.value;
  const where = mv('zoz') ? ` у ${mv('zoz')}` + (mv('vidd') ? ` (${mv('vidd')})` : '') : (mv('vidd') ? ` (${mv('vidd')})` : '');
  let t = `[Пацієнт|Пацієнтка] ${pib}` + (mv('dob') ? `, ${fmtD(mv('dob'))} р. н.,` : ',') + ' дійсно ';
  if (tip === 2) t += '[звертався|зверталася] за медичною допомогою' + where + (a ? ` ${fmtD(a)}` : ' …');
  else {
    t += (tip === 0 ? '[перебував|перебувала] на стаціонарному лікуванні' : '[перебував|перебувала] на амбулаторному лікуванні') + where;
    t += a ? ` з ${fmtD(a)}` + (b ? ` по ${fmtD(b)}` : ' по теперішній час') : ' з … по …';
    if (a && b && tip === 0){ const n = Math.round((new Date(b) - new Date(a)) / 864e5); if (n >= 0) t += ` (${n} ${plural(n, ['ліжко-день','ліжко-дні','ліжко-днів'])})`; }
  }
  if (F('v_main.dz').el.value === '1'){ const o = val(F('dx.osn'), true); t += o ? ` з діагнозом: ${lc1(o)}` + (val(F('dx.mkh'), true) ? ` (${val(F('dx.mkh'), true)})` : '') : ' з діагнозом: …'; }
  t += `. Довідка видана для пред’явлення ${mv2('v_main_kudy') || 'за місцем вимоги'}.`;
  return t;
}
function mv2(id){ const e = document.getElementById(id); return e ? e.value.trim() : ''; }
function zgodaText(){
  const pib = mv('pib') || '_______________________', pred = mv2('g_main_pred');
  const f = F('g_main.vtr'), list = f.chips.map((c,i)=>c.getAttribute('aria-pressed') === 'true' ? O(f.opts[i]).t : null).filter(Boolean);
  const vx = mv2('g_main_vx'); if (vx) list.push(vx);
  const o = val(F('dx.osn'), true);
  let t = pred ? `Я, ${pred}, законний представник пацієнта ${pib}` + (mv('dob') ? `, ${fmtD(mv('dob'))} р. н.,` : ',') + ' отримав(-ла)' : `Я, ${pib}` + (mv('dob') ? `, ${fmtD(mv('dob'))} р. н.,` : ',') + ' [отримав|отримала]';
  t += ` від лікаря у доступній формі інформацію про стан ${pred ? 'здоров’я пацієнта' : 'свого здоров’я'}` + (o ? `, діагноз (${lc1(o)})` : '') +
    ', мету, характер, очікувані результати та можливі ризики запропонованих медичних втручань' + (list.length ? ', а саме: ' + list.join('; ') : '') + '. ';
  t += 'Мені роз’яснено альтернативні методи обстеження й лікування та можливі наслідки відмови від них. ' + (pred ? 'Я мав(-ла) можливість поставити запитання й отримав(-ла) вичерпні відповіді. ' : 'Я [мав|мала] можливість поставити запитання й [отримав|отримала] вичерпні відповіді. ');
  t += 'Даю добровільну згоду на проведення зазначених медичних втручань. Мені відомо, що я можу відкликати цю згоду в будь-який момент.';
  return t;
}

function metaLines(){
  const foot = [];
  if (DOCTITLES[DOC]){
    const f027 = DOC === 'epi' && epi027(), f003 = DOC === 'epi' && epi003(), f028 = DOC === 'kons' && F110;
    const MON = ['січня','лютого','березня','квітня','травня','червня','липня','серпня','вересня','жовтня','листопада','грудня'], ddate = v => { if (!v) return '«____» ______________ 20___ року'; const [y, m, d] = v.split('-'); return `«${d}» ${MON[+m - 1]} ${y} року`; };
    const head = f027 ? [{t:'ВИПИСКА', b:true, c:true}, {t:'із медичної карти амбулаторного (стаціонарного) хворого', b:true, c:true}]
      : f003 ? [{t:'Медична карта стаціонарного хворого № ' + (mv('card') || '______') + (mv('pib') ? ' — ' + mv('pib') : ''), b:false}, {t:'ЕПІКРИЗ (' + (F('e_per.vs').el.value === '1' ? 'посмертний' : 'виписний') + ')', b:true, c:true}]
      : f028 ? [{t:'КОНСУЛЬТАЦІЙНИЙ ВИСНОВОК СПЕЦІАЛІСТА', b:true, c:true}] : [{t: DOCTITLES[DOC], b:true, c:true}];
    const age = mv('age');
    if (DOC === 'zgoda' || DOC === 'dov'){
      const d = (mv('dt') || '').split('T')[0];
      if (DOC === 'zgoda'){ foot.push((mv2('g_main_pred') ? 'Законний представник' : 'Пацієнт') + ' ______________ (підпис)'); }
      if (mv('doc')) foot.push(`${mv('pos') || 'Лікар'} ______________ ${mv('doc')}`);
      if (DOC === 'dov' && mv('zav')) foot.push(`Завідувач відділення ______________ ${mv('zav')}`);
      if (d) foot.push('Дата: ' + fmtD(d));
      if (DOC === 'dov') foot.push('М. П.');
      return {head, foot};
    }
    if (mv('pib') && !f027 && !f003 && !f028) head.push({t:'[Пацієнт|Пацієнтка]: ' + mv('pib') + (mv('dob') ? `, ${fmtD(mv('dob'))} р. н.` : '') + (age ? ` (${age} р.)` : '') + '.', b:false});
    if (mv('vidd') && !f027 && !f003 && !f028) head.push({t:(DOC === 'kons' ? 'Підрозділ: ' : 'Відділення: ') + mv('vidd') + '.', b:false});
    if (DOC === 'rx'){ const o = val(F('dx.osn'), true); if (o) head.push({t:'Діагноз: ' + o + (val(F('dx.mkh'), true) ? ' (' + val(F('dx.mkh'), true) + ')' : '') + '.', b:false}); }
    if (DOC === 'konc'){
      const dt0 = fmtDT(mv('dt')); if (dt0) head.push({t:'Дата і час проведення: ' + dt0 + '.', b:false});
      const K = koncMembers(); const sig = m => `${m.pos} ______________ ${m.name}`;
      if (K.hol) foot.push('Голова консиліуму:', sig(K.hol));
      if (K.mem.length) foot.push('Члени консиліуму:', ...K.mem.map(sig));
      return {head, foot};
    }
    if (f027){
      foot.push(ddate(F('e_per.per').d2.value || (mv('dt') || '').split('T')[0]));
      foot.push(`Лікуючий лікар ______________ ${mv('doc')}`);
      if (mv('zav')) foot.push(`Завідувач відділення ______________ ${mv('zav')}`);
      return {head, foot};
    }
    if (f003){
      foot.push(`Підпис лікаря ______________ ${mv('doc')}`, `Завідувач відділення ______________ ${mv('zav')}`, ddate(F('e_per.per').d2.value || (mv('dt') || '').split('T')[0]));
      return {head, foot};
    }
    if (f028){
      foot.push(ddate((mv('dt') || '').split('T')[0]) + '          М. П.', `Лікар-консультант ______________ ${mv('doc')}`, `Завідувач поліклініки або стаціонарного відділення ______________ ${mv('zav')}`);
      return {head, foot};
    }
    const d2 = (DOC === 'epi' && F('e_per.per').d2.value) || (DOC === 'etap' && F('t_main.pe').d2.value) || (DOC === 'per' && F('t_main.pp').d2.value) || (mv('dt') || '').split('T')[0];
    if (mv('doc')) foot.push(`${mv('pos') || 'Лікар'} ______________ ${mv('doc')}`);
    if (mv('zav')) foot.push(`Завідувач відділення ______________ ${mv('zav')}`);
    if (d2) foot.push('Дата: ' + fmtD(d2));
    return {head, foot};
  }
  const dt = fmtDT(mv('dt')), zp = DOC === 'zav' ? zavParts() : null, rec = zp ? zp.title : mv('rec');
  const h1 = [dt, rec].filter(Boolean).join('. ');
  const head = h1 ? [{t:end(h1), b:true}] : [];
  if (DOC === 'zav'){
    if (zp.list.length){ zp.list.forEach(u=>foot.push(`${u.pos} ______________ ${u.name}`)); return {head, foot}; }
    if (mv('zav')) foot.push(`Завідувач відділення ______________ ${mv('zav')}`); if (mv('doc')) foot.push(`Лікуючий лікар ______________ ${mv('doc')}`); return {head, foot}; }
  if (mv('doc')) foot.push(`${mv('pos') || 'Лікар'} ______________ ${mv('doc')}`);
  if (mv('zav')) foot.push(`Завідувач відділення ______________ ${mv('zav')}`);
  if (/заступником головного лікаря/.test(rec)) foot.push(`Заступник головного лікаря з медичної роботи ______________ ${mv('nach')}`);
  return {head, foot};
}
/* Спільний огляд: хто оглядає → назва запису й підписи */
function zavParts(){
  const f = F('z_main.uch'); const on = f && f.chips ? f.chips.map((c,i)=>c.getAttribute('aria-pressed') === 'true' ? i : -1).filter(i=>i >= 0) : [];
  if (!on.length) return {title: mv('rec'), list: []};
  const sel = UCH.filter((u,i)=>on.includes(i));
  const extra = (val(F('z_main.uchx'), true) || '').split(/[,;]\s*/).map(x=>x.trim()).filter(Boolean);
  const gen = sel.map(u=>u[2]);
  const t = (sel.length === 1 && !extra.length) ? 'Огляд ' + gen[0] : 'Спільний огляд ' + (gen.length > 1 ? gen.slice(0, -1).join(', ') + ' та ' + gen[gen.length - 1] : gen[0] || '');
  const list = sel.map(u=>({pos:u[3], name: u[0] === 'cher' ? '' : mv(u[0])}));
  extra.forEach(x=>list.push({pos:x.charAt(0).toUpperCase() + x.slice(1), name:''}));
  return {title: t + (extra.length ? ' за участю: ' + extra.join(', ') : ''), list};
}
/* Консиліум: голова і члени з «Налаштувань» */
function koncMembers(){
  const byName = n => UCH.find(u=>u[1] === n);
  const hf = F('c_main.hol'); if (!hf || !hf.el) return {hol:null, mem:[]};
  const hu = hf.el.value !== '' ? byName(hf.opts[+hf.el.value]) : null;
  const person = u => ({pos:u[3], name: u[0] === 'cher' ? '' : mv(u[0]), t:u[1]});
  const f = F('c_main.chl');
  const mem = f.chips.map((c,i)=>c.getAttribute('aria-pressed') === 'true' ? byName(f.opts[i]) : null).filter(u=>u && u !== hu).map(person);
  (val(F('c_main.chlx'), true) || '').split('\n').map(x=>x.trim()).filter(Boolean).forEach(x=>mem.push({pos:x, name:'', t:x, raw:true}));
  return {hol: hu ? person(hu) : null, mem};
}
function koncSklad(){
  const K = koncMembers(); if (!K.hol && !K.mem.length) return '';
  const who = m => m.raw ? lc1(m.t) : m.t + (m.name ? ' ' + m.name : '');
  return 'Склад консиліуму: ' + (K.hol ? 'голова — ' + who(K.hol) : '') + (K.mem.length ? (K.hol ? '; члени — ' : 'члени — ') + K.mem.map(who).join(', ') : '');
}


/* Шапка за наказом МОЗ № 110 від 14.02.2012: зліва заклад, справа номер форми */
const FORMS = {
  '003/о':'Медична карта стаціонарного хворого', '025/о':'Медична карта амбулаторного хворого',
  '027/о':'Виписка із медичної карти амбулаторного (стаціонарного) хворого', '028/о':'Консультаційний висновок спеціаліста', '003-6/о':'Інформована добровільна згода пацієнта'};
function formCode(){ return DOC === 'epi' ? '027/о' : DOC === 'kons' ? '028/о' : DOC === 'zgoda' ? '003-6/о' : ['dov','napr','gosp','pam'].includes(DOC) ? '' : MODE === 'amb' ? '025/о' : '003/о'; }
function formHeader(){
  const code = formCode();
  const cont = [mv('tel') ? 'тел. ' + mv('tel') : '', mv('email') ? 'e-mail: ' + mv('email') : ''].filter(Boolean).join(', ');
  const left = [mv('pidp'), mv('zoz') || 'Найменування закладу охорони здоров’я', mv('adr'), cont, 'Код за ЄДРПОУ ' + (mv('edrpou') || '__________')].filter(Boolean);
  const right = code ? ['МЕДИЧНА ДОКУМЕНТАЦІЯ', 'Форма первинної облікової документації № ' + code, 'ЗАТВЕРДЖЕНО', 'Наказ МОЗ України 14.02.2012 № 110'] : [''];
  const card = !code ? (mv('card') ? 'Медична карта № ' + mv('card') : '') : (['027/о','028/о','003-6/о'].includes(code) ? FORMS[code] + ' (мед. карта № ' + (mv('card') || '______') + ')' : FORMS[code] + ' № ' + (mv('card') || '________'))
    + (mv('vidd') && !['dov','zgoda'].includes(DOC) ? ' · ' + mv('vidd') : '');
  const pat = !['epi','kons','rx','etap','per','napr','dov','zgoda','pam'].includes(DOC) ? (sex === 'f' ? 'Пацієнтка: ' : 'Пацієнт: ') + (mv('pib') || '_______________________________') + (mv('dob') ? ', ' + fmtD(mv('dob')) + ' р. н.' : '') + (mv('age') ? ' (' + mv('age') + ' р.)' : '') : '';
  return {left, right, card: ((DOC === 'epi' && typeof epi027 === 'function' && (epi027() || epi003())) || (DOC === 'kons' && F110)) ? '' : card, pat};
}

function chkWarn(){ const n = renderCheck(); if (n) setTimeout(()=>toast(`Перевірка: зауважень ${n} — перелік над текстом`, 3500), 1700); }
function doPrint(){
  chkWarn();
  const out = $('#out');
  if (!itext(out).trim()){ toast('Текст порожній'); return; }
  let framed = false; try{ framed = window.top !== window.self; }catch(e){ framed = true; }
  if (framed){ toast('В онлайн-версії друк заблоковано. Натисніть «Word», щоб зберегти документ, або відкрийте збережений файл pervynnyi-ohliad.html.', 6000); return; }
  const P = $('#print'); fillSheet(P);
  toast('Щоб отримати PDF, у вікні друку виберіть «Зберегти як PDF»', 3500);
  window.print();
}


