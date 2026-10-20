/* ================= ЖУРНАЛ ЩОДЕННИКІВ ================= */
const DSEC = ['d_main','d_obj','d_lik'];
function diaryFields(){
  const f = {}, c = {};
  DSEC.forEach(id=>{ const P = SECTIONS.find(x=>x.id===id).panel;
    P.querySelectorAll('input[id], select[id], textarea[id]').forEach(e=>{ f[e.id] = e.value; });
    P.querySelectorAll('.chip[id][aria-pressed="true"]').forEach(b=>{ c[b.id] = 1; }); });
  return {f, c};
}
function saveDiary(){
  const t = itext($('#out')).trim(); if (!t){ toast('Щоденник порожній'); return; }
  const sm = diarySimilar();
  if (sm && sm.sim > 0.9 && !saveDiary.arm){ saveDiary.arm = true; setTimeout(()=>{ saveDiary.arm = false; }, 6000); toast('Запис майже такий самий, як попередній. Оновіть показники й динаміку або натисніть «Записати» ще раз', 6000); return; }
  saveDiary.arm = false;
  DIARIES.push({dt: mv('dt'), rec: mv('rec'), html: $('#out').innerHTML, data: diaryFields()});
  renderDiaries(); savePatient(true);
  toast(PID ? 'Запис додано в журнал пацієнта' : 'Запис додано в журнал. Вкажіть ПІБ, щоб журнал зберігся');
}
function likePrevious(){
  const last = DIARIES[DIARIES.length - 1]; if (!last){ toast('У журналі ще немає записів'); return; }
  DSEC.forEach(id=>{ SECTIONS.find(x=>x.id===id).fields.forEach(f=>{ if (f.type === 'sel'){ f.el.value = ''; } }); });
  for (const id in last.data.f){ if (id === 'd_main_den_0' || id === 'd_lik_osn') continue; const e = document.getElementById(id); if (e) e.value = last.data.f[id]; }
  DSEC.forEach(id=>SECTIONS.find(x=>x.id===id).fields.forEach(f=>{ if (f.type === 'sel') mark(f.el, f); }));
  setNow(); dirty = false; $('#banner').hidden = true; update();
  toast('Заповнено як попередній запис — змініть те, що змінилось');
}

/* ===== Шаблони щоденника: заповнення з первинного огляду ===== */
const DTPL = ['Без динаміки','Позитивна динаміка','Покращення, перед випискою','Погіршення'];
const dtplName = k => MODE === 'amb' && k === 2 ? 'Одужання, завершення лікування' : DTPL[k];
function setByText(key, text){ const f = F(key); const i = f.opts.findIndex(o=>O(o).t === text); if (i >= 0){ f.el.value = i; mark(f.el, f); return true; } return false; }
function diaryReset(){
  DSEC.forEach(id=>SECTIONS.find(x=>x.id===id).fields.forEach(f=>{
    if (f.type === 'sel'){ f.el.value = f.norm !== undefined ? f.norm : ''; mark(f.el, f); }
    if (f.type === 'text') f.el.value = '';
  }));
}
function diaryFromExam(k){
  const T = key => val(F(key), true), ix = key => F(key).el.value === '' ? -1 : +F(key).el.value;
  const abn = key => { const f = F(key); return f.el.value !== '' && f.norm !== undefined && +f.el.value !== f.norm; };
  diaryReset();
  setByText('d_main.dyn', ['Стан без суттєвої динаміки','Стан з позитивною динамікою','Стан покращився','Стан погіршився'][k]);
  let st = Math.min(Math.max(ix('zah.stan'), 0), 2);
  if (k === 1 && st === 2) st = 1; if (k === 2) st = 0; if (k === 3) st = Math.min(st + 1, 2);
  setByText('d_main.stan', ['задовільний','середньої тяжкості','тяжкий'][st]);
  const sk = T('skarhy.c');
  setByText('d_main.sk', sk ? ['Скарги ті самі','Скарги зменшились','Скарг активно не пред’являє','Скарги посилились'][k] : 'Скарг активно не пред’являє');
  if (sk && (k === 0 || k === 3)) F('d_main.skx').el.value = 'на ' + sk;
  if (sk && k === 1) F('d_main.zal').el.value = sk;   // приберіть ті, що минули
  const kol = T('shk.kol');
  setByText('d_obj.shk', /іктеричн/.test(kol) && k !== 2 ? 'Шкірні покриви іктеричні' : /ціаноз|ціанотичн/.test(kol) && k !== 2 ? 'Акроціаноз' : /бліді/.test(kol) && k !== 2 ? 'Шкірні покриви бліді' : 'Шкірні покриви звичайного кольору');
  const hr = T('dyh.hr'), wet = /вологі|крепітація/.test(hr), dry = /сухі/.test(hr);
  setByText('d_obj.dyh', k === 2 ? 'дихання везикулярне, хрипи не вислуховуються' : wet ? (k === 1 ? 'кількість хрипів зменшилась' : 'дихання ослаблене в нижніх відділах, вологі хрипи')
    : dry ? (k === 1 ? 'дихання жорстке, хрипів немає' : 'дихання жорстке, поодинокі сухі хрипи') : /жорстке/.test(T('dyh.ausk')) ? 'дихання жорстке, хрипів немає' : 'дихання везикулярне, хрипи не вислуховуються');
  const af = /неправильний/.test(T('ssc.rytm')) || /аритмічний/.test(T('ssc.psch'));
  setByText('d_obj.serce', af ? 'приглушені, ритм неправильний' : /приглушені|глухі/.test(T('ssc.tony')) ? 'приглушені, ритм правильний' : 'ясні, ритм правильний');
  const zh = T('trav.zhyv'), painful = !!zh && !/неболючий/.test(zh);
  setByText('d_obj.zhyv', !painful || k === 2 ? 'м’який, неболючий' : k === 1 ? 'м’який, болючість зменшилась' : k === 3 ? 'болючість при пальпації посилилась'
    : /^м’який, болючий в епігастрії/.test(zh) ? 'м’який, помірно болючий в епігастрії' : 'м’який, болючість при пальпації зберігається');
  setByText('d_obj.nab', !abn('shk.nab') || k === 2 ? 'Набряків немає' : ['Набряки без динаміки','Набряки зменшились','','Набряки наростають'][k]);
  if (['nevr.par','nevr.mova','nevr.obl','nevr.chut'].some(abn)) setByText('d_obj.nevr', ['Неврологічний статус без динаміки','Вогнищева симптоматика регресує','Вогнищева симптоматика регресує','Наростання вогнищевої симптоматики'][k]);
  if (/Рідкі/.test(T('trav.vyp')) && (k === 0 || k === 3)) setByText('d_obj.fiz', 'Рідкі випорожнення');
  if (MODE === 'amb') setByText('d_lik.plan', k === 2 ? 'Лікування завершено, подальше спостереження сімейного лікаря' : k === 3 ? 'Вирішується питання про госпіталізацію' : 'Повторний огляд через … днів');
  else setByText('d_lik.plan', k === 2 ? 'Планується виписка ….' : k === 3 ? 'Консультація … призначена' : 'Продовжує лікування за планом');
  if (k === 3) F('d_lik.kor').el.value = '…';
  diaryDone('Заповнено: «' + dtplName(k) + '» — з даних первинного огляду. Внесіть показники (t°, АТ, ЧСС) і змініть те, що інакше');
}
/* щоденник ще не заповнювали: усі поля порожні */
function diaryUntouched(){
  return DSEC.every(id=>SECTIONS.find(x=>x.id===id).fields.every(f=>f.type === 'sel' ? f.el.value === '' : f.type === 'num' ? f.inputs.every(i=>!i.value.trim()) : f.type === 'text' || f.type === 'line' ? !f.el.value.trim() : true));
}
/* у первинному огляді вже є об’єктивні дані */
function examFilled(){ return !!curKey || ['zah','dyh','ssc','trav'].some(id=>SECTIONS.find(x=>x.id===id).fields.some(f=>f.type === 'sel' && f.el.value !== '')); }
function diaryDone(msg){ setNow(); dirty = false; $('#banner').hidden = true; update(); toast(msg, 3500); }
function diaryTplSave(name){
  const v = {};
  DSEC.forEach(id=>SECTIONS.find(x=>x.id===id).fields.forEach(f=>{
    if (f.type === 'sel' && f.el.value !== '') v[id + '.' + f.id] = O(f.opts[+f.el.value]).t;
    if (f.type === 'text' && f.el.value.trim()) v[id + '.' + f.id] = f.el.value.trim();
  }));
  if (!Object.keys(v).length){ toast('Спершу заповніть щоденник, який хочете зберегти як шаблон'); return false; }
  CUSTOM.diary = CUSTOM.diary.filter(x=>x.name !== name); CUSTOM.diary.push({name, v}); saveCustom(); renderDtpl(); toast('Шаблон щоденника «' + name + '» збережено'); return true;
}
function diaryTplApply(t){
  diaryReset();
  for (const key in t.v){ const f = F(key); if (!f) continue; if (f.type === 'sel') setByText(key, t.v[key]); else if (f.el) f.el.value = t.v[key]; }
  diaryDone('Заповнено за шаблоном «' + t.name + '»');
}
function renderDtpl(){
  document.querySelectorAll('.dtpl-my').forEach(box=>{
    box.innerHTML = '';
    CUSTOM.diary.forEach(t=>{
      const x = h('button', {type:'button', class:'chip-x', title:'Видалити шаблон', 'aria-label':'Видалити шаблон ' + t.name}, '×');
      x.addEventListener('click', e=>{ e.stopPropagation(); if (!x.dataset.arm){ x.dataset.arm = '1'; x.textContent = 'точно?'; setTimeout(()=>{ delete x.dataset.arm; x.textContent = '×'; }, 3000); return; }
        CUSTOM.diary = CUSTOM.diary.filter(y=>y !== t); saveCustom(); renderDtpl(); });
      box.append(h('span', {class:'chip mytpl'}, h('button', {type:'button', class:'chip-in', onclick:()=>diaryTplApply(t)}, t.name), x));
    });
  });
}


/* ===== Підказки до щоденника: за днем перебування, динамікою і хворобою ===== */
const DHINT = {
  tdr:[[1,3,'Кровообіг і чутливість пальців, набряк, стан гіпсової пов’язки; біль за ВАШ.'],[7,12,'Контрольна рентгенографія на 7–10-й день — вторинне зміщення уламків.']],
  thip:[[1,99,'Біль, делірій, пролежні, ознаки ТГВ і ТЕЛА; діурез; Hb у динаміці.'],[1,3,'Оперативне лікування — бажано в перші 24–48 год; після операції — рання вертикалізація.']],
  tank:[[1,3,'Кровообіг і чутливість пальців стопи, набряк, стан гіпсової пов’язки; біль за ВАШ.'],[7,12,'Контрольна рентгенографія на 7–10-й день.']],
  tsprain:[[1,99,'Набряк, біль, обсяг рухів; поступове розширення навантаження.']],
  trib:[[1,99,'ЧД, SpO2, аускультація; ознаки пневмотораксу, гемотораксу, пневмонії; ефективність знеболення і дихальна гімнастика.']],
  tcmt:[[1,3,'Свідомість (шкала Глазго), зіниці, вогнищева симптоматика, головний біль, нудота; при погіршенні — невідкладно КТ.']],
  tspine:[[1,99,'Біль за ВАШ, сила і чутливість у нижніх кінцівках, функції тазових органів.']],
  tclav:[[1,99,'Шкіра над уламком, кровообіг і чутливість руки, стан косинкової пов’язки.']],
  twound:[[1,99,'Стан рани: набряк, гіперемія, виділення; t°; перев’язка.'],[10,14,'Зняття швів на кисті — зазвичай на 10–14-й день.']],
  tdisl:[[1,99,'Кровообіг і чутливість руки (пахвовий нерв), іммобілізація; біль.']],
  pneu:[[1,3,'Щодня: t°, ЧД, SpO2, ЧСС, аускультація; оцінка за CURB-65 / NEWS2 при погіршенні.'],[3,99,'Перехід на прийом per os, коли t° < 37,8 °C понад 48 год, ЧСС < 100, ЧД < 24, SpO2 > 90% і може ковтати.','h'],[1,3,'Амбулаторно: контроль на 2–3-й день лікування; SpO2 < 94%, ЧД ≥ 24 або погіршення — госпіталізація.','a'],[5,99,'Загальна тривалість антибіотика зазвичай 5–7 днів; рентген-контроль — не раніше ніж через 2–3 тижні при клінічному покращенні.']],
  covid:[[1,99,'SpO2, ЧД, потреба в кисні; дексаметазон — лише при потребі в кисні; D-димер у динаміці за показаннями.']],
  hf:[[1,99,'Щодня: маса тіла, діурез і водний баланс, набряки, хрипи; калій і креатинін на тлі діуретиків.'],[3,99,'Після стабілізації — титрування бета-блокатора, іАПФ/БРА/ARNI, АМР, іНЗКТГ-2.']],
  copd:[[1,99,'SpO2 (ціль 88–92%), ЧД, хрипи, участь допоміжних м’язів.'],[5,99,'Системні ГКС — 5 днів: відмітьте завершення курсу; спірографія — після стабілізації.']],
  asthma:[[1,99,'SpO2, ЧД, ЧСС, пікфлоуметрія (ранок/вечір), потреба в сальбутамолі.'],[4,99,'Перед випискою: базисна терапія ІГКС-формотеролом, перевірка техніки інгаляції, письмовий план дій.']],
  gh:[[1,99,'АТ двічі на день (ранок/вечір) і ЧСС; скарги на головний біль, біль у грудях, неврологічні симптоми.']],
  ihd:[[1,99,'Ангінозні напади (кількість, тривалість, потреба в нітрогліцерині), ЕКГ у динаміці.']],
  af:[[1,99,'ЧСС у спокої (ціль < 110/хв), ритм, ознаки СН; антикоагуляція — доза за кліренсом креатиніну.']],
  dm:[[1,99,'Глікемічний профіль, епізоди гіпоглікемії, корекція доз інсуліну.']], dpn:[[1,99,'Глікемічний профіль; вираженість болю, сон.']],
  stroke:[[1,99,'Неврологічний статус (NIHSS), свідомість, ковтання, АТ, глікемія, температура; профілактика пролежнів і ВТЕ.']],
  tia:[[1,99,'Неврологічний статус — чи не повторювались епізоди; АТ, ритм (пошук ФП).']],
  de:[[1,99,'Головний біль, запаморочення, АТ; когнітивні функції.']],
  rad:[[1,99,'Біль за ВАШ, симптоми натягу, сила і чутливість; червоні прапорці (тазові розлади, наростання парезу).']], cerv:[[1,99,'Біль за ВАШ, сила і чутливість у руці; ознаки мієлопатії.']],
  migr:[[1,99,'Інтенсивність болю, нудота, ефект знеболення; червоні прапорці.']], bell:[[1,99,'Ступінь парезу мімічних м’язів, захист ока; ГКС — дата завершення курсу.']],
  epi:[[1,99,'Чи були напади (кількість, тривалість), рівень свідомості, побічні дії протинападових препаратів.']],
  bppv:[[1,99,'Запаморочення при зміні положення, повторна проба Дікса–Холлпайка після маневру Еплі.']],
  app:[[1,99,'Живіт у динаміці, симптоми подразнення очеревини, t°, лейкоцити; рішення хірурга.']], chol:[[1,99,'Біль у правому підребер’ї, симптоми Ортнера/Мерфі, t°, білірубін, лейкоцити; рішення хірурга.']],
  panc:[[1,99,'Біль, блювання, діурез, гемодинаміка; амілаза/ліпаза, СРБ на 2-гу добу; раннє ентеральне харчування.']],
  gib:[[1,99,'Гемодинаміка, Hb у динаміці, мелена чи блювання; рішення щодо гемотрансфузії та повторної ФГДС.']],
  obstr:[[1,99,'Здуття, перистальтика, відходження газів і випорожнень; рішення хірурга.']], hern:[[1,99,'Стан після огляду хірурга або операції.']], perf:[[1,99,'Стан після огляду хірурга або операції.']],
  dvt:[[1,99,'Набряк і біль гомілки, ознаки ТЕЛА (задишка, біль у грудях, тахікардія).']],
  colic:[[1,99,'Біль, діурез, t°, відходження конкременту; креатинін.']], pyelo:[[1,99,'t°, біль у попереку, дизурія, діурез.'],[2,99,'Результат бакпосіву сечі — корекція антибіотика за чутливістю.']],
  food:[[1,99,'Ступінь дегідратації, діурез, частота випорожнень і блювання.']], hep:[[1,99,'Жовтяниця, білірубін, АЛТ, МНВ; ознаки енцефалопатії.']],
  ery:[[1,99,'Межі еритеми — порівняйте з обведеними при надходженні; t°.']], absc:[[1,99,'Стан рани після розкриття, виділення, t°.']],
  mening:[[1,99,'Свідомість (шкала Глазго), менінгеальні знаки, судоми, t°; дексаметазон — 4 дні.']],
  arvi:[[1,99,'t°, катаральні явища, ознаки ускладнень (пневмонія).']], flu:[[1,99,'t°, SpO2, ознаки пневмонії; осельтамівір — 5 днів.']],
  tons:[[1,99,'Нальоти, ковтання, t°; ознаки паратонзилярного абсцесу.']], mono:[[1,99,'Розмір печінки й селезінки, мигдалики, дихання; АЛТ.']],
  varic:[[1,99,'Нові елементи висипу (підсихання), t°, кашель і задишка (пневмонія).']], gastr:[[1,99,'Біль, диспепсія; результати ФГДС і тесту на H. pylori.']]
};
function stayDay(){
  const a = F('e_per.per').d1.value; if (!a) return 0;
  const n = Math.round((new Date(todayISO() + 'T00:00') - new Date(a + 'T00:00')) / 864e5) + 1;
  return n >= 1 && n < 400 ? n : 0;
}
function diaryHints(){
  const L = [];   // {t, ins?}
  const den = +((document.getElementById('d_main_den_0') || {}).value || 0);
  const dyn = F('d_main.dyn').el.value;
  const d = den || 0, K = curKey;
  const amb = MODE === 'amb';
  if (d === 1 && !amb) L.push({t:'Перший щоденник: стан після надходження, реакція на перші призначення, результати невідкладних обстежень.'});
  if (!amb) L.push(...stayHints());
  if (amb && !DIARIES.length) L.push({t:'Перший повторний огляд: динаміка після початку лікування, переносимість ліків, результати призначених аналізів.'});
  const ab = RX.filter(it=>isAB(it) && !it.stop);
  const due = ab.filter(it=>{ if (!it.start) return false; const k = Math.round((new Date(todayISO() + 'T00:00') - new Date(it.start + 'T00:00')) / 864e5); return k >= 2 && k <= 3; }).map(it=>it.drug);
  if (due.length) L.push({t:`Минуло 48–72 год від початку антибіотика (${due.join(', ')}): оцініть ефективність (t°, ЧД, SpO2, лейкоцити, СРБ) і запишіть рішення (наказ МОЗ № 1328).`,
    ins:`Через 48–72 год оцінено ефективність антибактеріальної терапії (${due.join(', ')}): …; терапію продовжено.`});
  const done = new Set(RES.map(r=>r.t)), planned = F('dx.plan').chips.map((c,i)=>c.getAttribute('aria-pressed') === 'true' ? O(F('dx.plan').opts[i]).t : null).filter(x=>x && !/^консультація/.test(x) && !done.has(x));
  if ((d >= 2 || amb) && planned.length) L.push({t:'Ще не внесено результати за планом: ' + planned.slice(0, 8).join(', ') + (planned.length > 8 ? '…' : '') + '. Додайте їх у «Журнал обстежень» (вкладка «Лікування»).'});
  (DHINT[K] || []).forEach(([a,b,t,m])=>{ if (m && m !== (amb ? 'a' : 'h')) return; if (!d || (d >= a && d <= b)) L.push({t}); });
  if (dyn === '3' && !amb) L.push({t:'Погіршення: опишіть, що саме змінилось; NEWS2 (вкладка «Шкали»); повідомте завідувача; перегляньте план і призначення; за потреби — консультація або переведення.', ins:'Про погіршення стану повідомлено завідувача відділення. …'});
  if ((dyn === '1' || dyn === '2') && val(F('skarhy.c'), true) && !F('d_main.zal').el.value.trim() && F('d_main.sk').el.value !== '0') L.push({t:'Стан покращився — відмітьте в полі «Скарги, що зберігаються», які скарги ще лишились.'});
  if (dyn === '2' && amb) L.push({t:'Покращення: оцініть, чи можна завершити лікування — контрольні аналізи, закриття ЕЛН, пам’ятка пацієнту з рекомендаціями («Інші документи» → «Пам’ятка пацієнту»).'});
  if (dyn === '2' && !amb) L.push({t:'Покращення: оцініть готовність до виписки — стабільні показники 24–48 год, перехід на прийом per os, контрольні обстеження; підготуйте виписний епікриз.'});
  if (d >= 7 && dyn === '0') L.push({t: amb ? 'Понад тиждень без динаміки: перегляньте діагноз і лікування; розгляньте консультацію спеціаліста або госпіталізацію («Інші документи»).' : 'Понад тиждень без динаміки: огляд завідувача («Інші документи» → «Огляд завідувача»), перегляд діагнозу й тактики.'});
  if (amb){ const es = F('eln.st').el.value, P = F('eln.per');
    if ((es === '1' || es === '2') && P.d1.value){ const n = Math.round((new Date(todayISO() + 'T00:00') - new Date(P.d1.value + 'T00:00')) / 864e5) + 1;
      L.push({t:`Лікарняний: ${n}-й день непрацездатності` + (P.d2.value ? `, відкрито по ${fmtD(P.d2.value)}` : '') + (dyn === '2' ? '. Стан покращився — вирішіть питання про закриття ЕЛН (вкладка «Лікарняний»).' : '. Не забудьте продовжити або закрити ЕЛН (вкладка «Лікарняний»); строки — за чинним порядком.')}); }
    if (dyn === '3') L.push({t:'Погіршення на амбулаторному етапі: оцініть критерії госпіталізації — документ «Направлення на госпіталізацію» підставить їх автоматично.'});
  }
  if (d && d % 10 === 0 && !amb) L.push({t:`${d}-й день: за потреби оформіть етапний епікриз («Інші документи» → «Етапний епікриз»).`});
  if (!d) L.push({t: amb ? 'Вкажіть дату першого звернення (вгорі, у блоці «Шаблон запису») — день лікування порахується сам.' : 'Вкажіть дату надходження (вгорі, у блоці «Шаблон запису») — день перебування порахується сам, і підказки стануть точнішими.'});
  return L;
}
/* скарги, що зберігаються: чипи зі скарг первинного огляду */
function remItems(v){ v = v.trim().replace(/\.$/, ''); if (!v) return []; return v.split(v.includes(';') ? /;\s*/ : /,\s*/).map(x=>x.trim()).filter(Boolean); }
function renderRemain(){
  const f = F('d_main.zal'); if (!f.rbox || DOC !== 'shch') return;
  const sk = F('skarhy.c'), list = sk.chips.map((c,i)=>c.getAttribute('aria-pressed') === 'true' ? {t:OTM(sk, i), o:+(c.dataset.ord || 0)} : null).filter(Boolean).sort((a,b)=>a.o - b.o).map(x=>x.t);
  const cur = remItems(f.el.value);
  f.rbox.innerHTML = '';
  if (!list.length){ f.rbox.append(h('span', {class:'chips-hint'}, 'У первинному огляді скарги не відмічено — впишіть вручну.')); return; }
  list.forEach(t=>{
    const on = cur.includes(t);
    f.rbox.append(h('button', {type:'button', class:'chip', 'aria-pressed':on ? 'true' : 'false', onclick:()=>{
      let items = remItems(f.el.value);
      if (items.includes(t)) items = items.filter(x=>x !== t); else { items.push(t); items.sort((a,b)=>list.indexOf(a) - list.indexOf(b)); }
      f.el.value = items.join(items.some(x=>x.includes(',')) ? '; ' : ', '); update();
    }}, t));
  });
  f.rbox.append(h('button', {type:'button', class:'chip q', onclick:()=>{ f.el.value = list.join(list.some(x=>x.includes(',')) ? '; ' : ', '); update(); }}, 'усі'),
    h('button', {type:'button', class:'chip q', onclick:()=>{ f.el.value = ''; update(); }}, 'жодної'));
}
function renderDHints(){
  const boxes = document.querySelectorAll('.dhints'); if (!boxes.length || DOC !== 'shch') return;
  document.querySelectorAll('.adm-l').forEach(e=>{ e.textContent = MODE === 'amb' ? 'Дата першого звернення' : 'Дата надходження'; });
  document.querySelectorAll('.adm-h').forEach(e=>{ e.textContent = MODE === 'amb' ? 'Від неї рахується день лікування.' : 'Від неї рахується день перебування; вона ж піде у виписний епікриз.'; });
  document.querySelectorAll('.dtpl-b').forEach(b=>{ b.textContent = dtplName(+b.dataset.k); });
  const L = diaryHints(), p = PRESETS.find(x=>x.key === curKey);
  boxes.forEach(box=>{
    box.innerHTML = '';
    box.append(h('b', {}, 'Що внести в щоденник' + (p ? ' · ' + p.name : '')));
    const ul = h('ul', {});
    L.forEach(x=>{
      const li = h('li', {}, x.t);
      if (x.ins){ const b = h('button', {type:'button', class:'more'}, ' + у корекцію лікування');
        b.addEventListener('click', ()=>{ const f = F('d_lik.kor'); f.el.value = (f.el.value.trim() ? f.el.value.trim() + ' ' : '') + x.ins; update(); toast('Додано в «Корекція лікування»'); });
        li.append(b); }
      ul.append(li);
    });
    box.append(ul);
  });
}

