/* ===== Форма № 003-3/о «Передопераційний огляд анестезіологом та протокол загального знеболення»
   (наказ МОЗ України від 14.02.2012 № 110) — 0.9.3.28. Три аркуші: огляд (A4), листок знеболення (A4 альбомний,
   заповнюється від руки під час наркозу), протокол знеболення з протоколом пункції (A4).
   Вибране — «●», решта — «○». Що вже є в огляді систем, підставляється само. ===== */
const AI_ = k => BI(k);                       /* індекс вибраного варіанта, -1 — не вибрано */
const AT_ = k => { const f = F(k); return f && f.el ? String(f.el.value || '').trim() : ''; };
const AN_ = (k, i) => { const f = F(k); return f && f.inputs && f.inputs[i] ? f.inputs[i].value.trim().replace('.', ',') : ''; };
const AM_ = k => { const f = F(k); return f && f.chips ? f.chips.map(c=>c.getAttribute('aria-pressed') === 'true') : []; };
const bO = (on, t) => h('span', {class:'bo' + (on ? ' on' : '')}, (on ? '●' : '○') + ' ' + t);
const bOL = (opts, on) => h('div', {class:'bol'}, ...opts.map((t, i)=>h('div', {}, bO(on(i), t))));
const bCl = (fld, title, ...kids) => h('div', {class:'bcl', 'data-an':fld || null}, title ? h('div', {class:'bclt'}, title) : null, ...kids);
/* таблиця «так / ні» або «зліва / справа» */
function bYN(cols, rows){ return h('table', {class:'byn'}, h('tr', {}, h('th', {}, ''), ...cols.map(c=>h('th', {}, c))), ...rows.map(([l, on])=>h('tr', {}, h('td', {}, l), ...cols.map((c, i)=>h('td', {class:'c'}, on(i) ? '●' : '○'))))); }
const anesDoc = () => AT_('an_zak.anest') || mv('doc') || '';
const bmiNow = () => { const hh = cm(AN_('zah.hw', 0)), w = num(AN_('zah.hw', 1)); return hh > 0 && w > 0 ? w / ((hh / 100) ** 2) : 0; };
function b333Head(){
  const hd = bHead();
  hd.querySelectorAll('b').forEach(b=>{ if (/№ 003\/о/.test(b.textContent)) b.textContent = '№ 003-3/о'; });
  hd.querySelectorAll('.bs').forEach(x=>{ if (/у редакції наказу/.test(x.textContent)) x.remove(); });
  return hd;
}
const bDT = (iso, tm) => h('span', {class:'bnw'}, bDate(iso, true), ' ', bTime(tm));
const dtNow = () => { const v = mv('dt') || ''; return [v.split('T')[0] || todayISO(), v.split('T')[1] || '']; };
/* ---------- аркуш 1: передопераційний огляд ---------- */
function b333a(){
  const [d, tm] = dtNow();
  const tip = AI_('an_main.tip'), gem = AI_('vitae.gem'), zv = AI_('vitae.zv');
  const alg = [BV('vitae.alerg'), BV('vitae.alergx')].filter(Boolean).join(', ');
  const narc = [BV('an_main.nark'), BV('an_main.narkx')].filter(Boolean).join(': ');
  const ops = [BV('vitae.oper') && AI_('vitae.oper') !== 0 ? BV('vitae.oper') : '', BV('vitae.operx')].filter(Boolean).join('; ');
  const yn = (v, yesIdx, noIdx) => i => i === 0 ? yesIdx.includes(v) : noIdx.includes(v);
  const hw = [AN_('zah.hw', 0), AN_('zah.hw', 1)], bmi = bmiNow();
  const stan = AI_('zah.stan'), stat = AI_('zah.stat'), kol = AI_('shk.kol'), nab = AI_('shk.nab'), vena = AI_('shk.vena');
  const varI = AI_('an_obj.var') >= 0 ? AI_('an_obj.var') : vena === 3 ? 1 : vena === 0 ? 0 : -1;
  const trfI = AI_('an_obj.trf') >= 0 ? AI_('an_obj.trf') : [1,2,4].includes(vena) ? 1 : vena === 0 ? 0 : -1;
  const def = AI_('an_obj.def'), prot = AM_('an_obj.prot'), zub = AI_('an_obj.zub'), mal = AI_('an_obj.mal'), sheya = AI_('an_obj.sheya');
  const hr = AI_('dyh.hr'), ausk = AI_('dyh.ausk'), tony = AI_('ssc.tony'), shum = AI_('ssc.shum'), psch = AI_('ssc.psch'), rytm = AI_('ssc.rytm');
  const yaz = AI_('trav.yaz'), nis = AI_('an_obj.nis'), nisv = AI_('an_obj.nisv'), zhyv = AI_('trav.zhyv'), zd = AI_('trav.zd'), nyr = AI_('an_obj.nyr');
  const np = AI_('an_obj.np'), perist = AI_('trav.perist'), pech = AI_('trav.pech'), sv = AI_('sech.sv'), past = AI_('sech.past'), vyp = AI_('trav.vyp');
  const ps = AN_('ssc.ps', 0) || AN_('ssc.chss', 0);
  const hrLoc = hr >= 3 ? BV('dyh.hr').replace(/^.*?(в нижніх відділах.*|справа|зліва|з обох боків.*)$/, '$1') : '';
  const pechSm = pech === 1 || pech === 2 ? '2' : pech === 3 ? '3–4' : pech === 4 ? '> 5' : '';
  const lung = (row, side) => { if (ausk < 0) return false;   /* side 0 — зліва, 1 — справа */
    const both = {0:0, 1:1, 2:2, 6:1}[ausk]; if (both !== undefined) return row === both;
    if (ausk === 5) return row === 2;
    if (ausk === 3) return side === 1 ? row === 2 : row === 0;
    if (ausk === 4) return side === 0 ? row === 2 : row === 0;
    return false; };
  const vg = AI_('an_zak.vg'), vr = AI_('an_zak.vr');
  /* загальна: 0 наркоз, 1 інгаляційний, 2 спонт., 3 ШВЛ, 4 внутрішньовенний, 5 спонт., 6 ШВЛ, 7 в/м, 8 аналгоседація, 9 комбінована */
  const gOn = new Set(vg < 0 ? [] : vg === 0 ? [0,1,2] : vg === 1 ? [0,1,3] : vg === 2 ? [0,4,5] : vg === 3 ? [0,4,6] : vg === 4 ? [0,7] : vg === 5 ? [8] : [9]);
  /* регіональна: 0 місцева, 1 провідникова, 2 стовбурова, 3 плексусна, 4 нейроаксіальна, 5 епідуральна, 6 субарахноїдальна, 7 комбінована */
  const rOn = new Set(vr < 0 ? [] : vr <= 3 ? [vr] : vr === 4 ? [4,5] : vr === 5 ? [4,6] : [7]);
  const asa = AI_('an_zak.asa'), urg = AI_('an_zak.e') === 0;
  const G = ['наркоз','  інгаляційний','    зі спонтанним диханням','    з ШВЛ','  внутрішньовенний','    зі спонтанним диханням','    з ШВЛ','  внутрішньом’язовий','аналгоседація','комбінована загальна анестезія'];
  const R = ['місцева','провідникова','стовбурова','плексусна','нейроаксіальна','  епідуральна','  субарахноїдальна','комбінована регіональна анестезія'];
  return bPage('b333 b333a', b333Head(),
    h('div', {class:'bt'}, 'ПЕРЕДОПЕРАЦІЙНИЙ ОГЛЯД АНЕСТЕЗІОЛОГОМ ТА ПРОТОКОЛ ЗАГАЛЬНОГО ЗНЕБОЛЕННЯ'),
    h('div', {class:'brow c'}, 'від ', bDT(d, tm)),
    h('div', {class:'brow', 'data-an':'meta_pib'}, bSmall('Прізвище, ім’я, по батькові хворого (вік) '), (()=>{ const f = bFill(mv('pib') + (mv('age') ? ' (' + mv('age') + ' р.)' : ''), true, true); f.classList.add('bpib'); return f; })(), '  ', bSmall('Медична карта стаціонарного хворого № '), bFill(mv('card'), true)),
    h('div', {class:'brow', 'data-an':'ssc.ad'}, 'АТ ', bFill(AN_('ssc.ad', 0) && AN_('ssc.ad', 1) ? AN_('ssc.ad', 0) + '/' + AN_('ssc.ad', 1) : '', true), ' мм рт. ст.  Частота пульсу ', bFill(ps, true), ' уд. за 1 хв  Частота дихання ', bFill(AN_('dyh.chd', 0), true), ' разів за 1 хв  Штанге ', bFill(AN_('an_main.proby', 0)), ' сек.  Саабразе ', bFill(AN_('an_main.proby', 1)), ' сек.'),
    h('div', {class:'brow', 'data-an':'an_main.tip'}, 'Хворий(а) готується до ', bU(tip === 0, 'планового'), ' (', bU(tip === 1, 'термінового'), ') оперативного лікування з приводу ', bFill(BV('an_main.pr'), true, true)),
    h('div', {class:'brow', 'data-an':'skarhy.c'}, 'Скарги під час огляду ', bFill(bSec('skarhy').replace(/^Скарги:\s*/, ''), false, true)),
    h('div', {class:'brow', 'data-an':'vitae.sup'}, 'Дані анамнезу: попередні захворювання (які, коли) ', bFill([BV('vitae.sup'), BV('vitae.tbh')].filter(Boolean).join('; '), false, true)),
    h('div', {class:'brow', 'data-an':'an_main.chr'}, 'Хронічні захворювання (які, давність, дата останнього загострення, фаза) ', bFill(BV('an_main.chr'), false, true)),
    h('div', {class:'brow', 'data-an':'vitae.operx'}, 'Перенесені операції, наркози (назва, коли, ускладнення) ', bFill([ops, narc].filter(Boolean).join('; '), false, true)),
    h('div', {class:'brow', 'data-an':'vitae.alerg'}, 'Алергологічний анамнез ', bFill(alg, true, true)),
    h('div', {class:'b333yn'},
      bCl('vitae.gem', 'Переливання крові та її компонентів:', bO(gem === 1, 'так'), ' ', bO(gem === 0, 'ні')),
      bCl('an_main.trr', 'Реакції:', bO(AI_('an_main.trr') === 1, 'була'), ' ', bO(AI_('an_main.trr') === 0, 'не було')),
      bCl('an_main.kort', 'Кортикостероїди:', bO(AI_('an_main.kort') === 1, 'так' + (AT_('an_main.kortd') ? ' (' + AT_('an_main.kortd') + ')' : ' (доза)')), ' ', bO(AI_('an_main.kort') === 0, 'ні')),
      bCl('vitae.zv', 'Паління:', bO([1,3].includes(zv), 'так'), ' ', bO([0,2,4].includes(zv), 'ні')),
      bCl('vitae.zv', 'Алкоголь:', bO([2,3].includes(zv), 'так'), ' ', bO([0,1,4].includes(zv), 'ні')),
      bCl('an_main.nar', 'Наркоманія:', bO(AI_('an_main.nar') === 1, 'так'), ' ', bO(AI_('an_main.nar') === 0, 'ні'))),
    h('div', {class:'bt2 c'}, 'ОБ’ЄКТИВНИЙ СТАТУС'),
    h('div', {class:'b333g'},
      bCl('zah.stan', 'Загальний стан:', bOL(['задовільний','відносно задовільний','середньої тяжкості','тяжкий','дуже тяжкий','критичний'], i=>({0:0, 1:2, 2:3, 3:4})[stan] === i)),
      bCl('zah.stat', 'Будова тіла:', bOL(['нормостенічна','астенічна','гіперстенічна'], i=>({0:0, 1:2, 2:1})[stat] === i), h('div', {class:'bclt'}, 'ІМТ ', bFill(bmi ? dec(bmi.toFixed(1)) : ''))),
      bCl('shk.kol', 'Шкіра:', bOL(['звичайного кольору','бліда','ціанотична','жовтянична'], i=>({0:[0], 1:[1], 2:[2], 3:[1,2], 4:[3]})[kol]?.includes(i))),
      bCl('shk.kol', 'Слизові:', bOL(['рожеві','бліді','іктеричні'], i=>({0:[0], 1:[1], 3:[1], 4:[2]})[kol]?.includes(i))),
      bCl('an_obj.var', 'Варикозне розширення вен:', bO(varI === 1, 'так'), ' ', bO(varI === 0, 'ні'), h('div', {class:'bclt'}, 'Ознаки тромбофлебіту:'), bO(trfI === 1, 'так'), ' ', bO(trfI === 0, 'ні')),
      bCl('an_obj.sheya', 'Шия:', bOL(['звичайна','коротка','довга'], i=>sheya === i)),
      bCl('zah.hw', 'Маса тіла, зріст:', h('div', {}, bFill(hw[1]), ' кг'), h('div', {}, bFill(hw[0]), ' см')),
      bCl('zah.hw', 'Ожиріння:', bOL(['ІМТ 27–29 — I ст.','ІМТ 30–34 — II ст.','ІМТ 35–40 — III ст.','ІМТ вище 40 — IV ст.'], i=>bmi >= 27 && (bmi < 30 ? 0 : bmi < 35 ? 1 : bmi <= 40 ? 2 : 3) === i)),
      bCl('an_obj.def', '', bYN(['є','немає'], [['Деформації', i=>i === 0 ? [1,3].includes(def) : [0,2].includes(def)], ['Рубці', i=>i === 0 ? [2,3].includes(def) : [0,1].includes(def)], ['Набряки', i=>nab < 0 ? false : i === 0 ? nab > 0 : nab === 0]])),
      bCl('an_obj.zub', 'Рот:', h('div', {}, 'зуби сановані: ', bO(zub === 0, 'так'), ' ', bO(zub > 0, 'ні')), h('div', {}, 'протези: ', bO(prot[0], 'ні'), ' ', bO(prot[1], 'верхні'), ' ', bO(prot[2], 'нижні'), ' ', bO(prot[4], 'справа'), ' ', bO(prot[5], 'зліва'))),
      bCl('an_obj.mal', 'Клас за Маллампаті:', h('div', {}, ...['I','II','III','IV'].map((t, i)=>[bO(mal === i, t), ' ']).flat())),
      bCl('dyh.hr', 'Хрипи:', bOL(['ні','сухі','дрібнопухирчасті','середньопухирчасті','великопухирчасті'], i=>hr < 0 ? false : i === 0 ? hr === 0 : i === 1 ? [1,2,9].includes(hr) : i === 2 ? [3,4,5].includes(hr) : false), h('div', {}, 'Локалізація: ', bFill(hrLoc || ([6,7,8].includes(hr) ? BV('dyh.hr') : '')))),
      bCl('ssc.tony', 'Тони серця:', bOL(['гучні','приглушені','глухі','чисті','шум'], i=>i === 0 ? [0,4,5].includes(tony) : i === 1 ? [1,3].includes(tony) : i === 2 ? tony === 2 : i === 3 ? shum === 0 : shum > 0)),
      bCl('ssc.psch', 'Пульс:', bOL(['м’який','напружений','слабкий','ниткоподібний','не визначається'], i=>i === 1 ? psch === 3 : i === 2 ? psch === 4 : i === 0 ? [0,1,2].includes(psch) : false),
        bYN(['так','ні'], [['Порушення ритму', i=>rytm < 0 ? false : i === 0 ? [1,2].includes(rytm) : rytm === 0], ['Дефіцит', i=>psch < 0 ? false : i === 0 ? psch === 2 : psch !== 2]]), h('div', {}, bFill(ps), ' уд. за 1 хв')),
      bCl('trav.yaz', 'Язик:', bOL(['з нальотом','вологий','сухий'], i=>i === 0 ? [1,2,3].includes(yaz) : i === 1 ? [0,1].includes(yaz) : [2,3,4].includes(yaz))),
      bCl('an_obj.nis', 'Ніс:', bYN(['зліва','справа'], [['дихання вільне', i=>nis === 0 || (nis === 1 && i === 0) || (nis === 2 && i === 1)], ['утруднене', i=>nis === 3 || (nis === 1 && i === 1) || (nis === 2 && i === 0)]]),
        h('div', {class:'bclt'}, 'Виділення'), bOL(['немає','слизові','слизово-гнійні','гнійні'], i=>AI_('an_obj.nisv') === i)),
      bCl('dyh.ausk', 'Легені:', bYN(['зліва','справа'], [['везикулярне', i=>lung(0, i)], ['жорстке', i=>lung(1, i)], ['ослаблене', i=>lung(2, i)]]),
        bO([0,1,6].includes(ausk), 'проводиться над усіма полями'), h('div', {}, bO([2,3,4,5].includes(ausk), 'не проводиться (ослаблене) в зоні: '), bFill([3,4,5].includes(ausk) ? BV('dyh.ausk').replace(/^Аускультативно дихання ослаблене /, '') : ''))),
      bCl('trav.zhyv', 'Живіт:', bYN(['так','ні'], [['м’який', i=>zhyv < 0 ? false : (zhyv <= 5) === (i === 0)], ['напружений', i=>zhyv < 0 ? false : [8,9].includes(zhyv) === (i === 0)], ['симетричний', i=>zd < 0 ? false : (zd !== 3) === (i === 0)], ['здутий', i=>zd < 0 ? false : [1,2,3].includes(zd) === (i === 0)], ['бере участь у диханні', i=>false]])),
      bCl('an_obj.nyr', 'Нирки пальпуються:', bYN(['так','ні'], [['зліва', i=>nyr < 0 ? false : [2,3].includes(nyr) === (i === 0)], ['справа', i=>nyr < 0 ? false : [1,3].includes(nyr) === (i === 0)]])),
      bCl('an_obj.np', 'Нервово-психічний статус:', h('div', {}, 'особливості: ', bO(np === 0, 'немає'), ' ', bO(np === 1, 'є')), bFill(AT_('an_obj.npx'))),
      bCl('an_obj.ekg', 'На ЕКГ:', h('div', {class:'bclv'}, AT_('an_obj.ekg'))),
      bCl('trav.perist', 'Кишкові шуми прослуховуються:', bO(perist >= 0 && perist !== 4, 'так'), ' ', bO(perist === 4, 'ні')),
      bCl('trav.pech', 'Печінка пальпується:', bO(pech > 0 && pech < 5, 'так'), ' ', bO(pech === 0, 'ні'), h('div', {}, bFill(pechSm), ' см з-під краю реберної дуги')),
      bCl('sech.sv', 'Сечовиділення:', bOL(['вільне','утруднене'], i=>i === 0 ? sv === 0 : [1,2].includes(sv))),
      bCl('sech.past', 'Симптом Пастернацького:', bYN(['зліва','справа'], [['негативний', i=>past === 0 || (past === 1 && i === 0) || (past === 2 && i === 1)], ['позитивний', i=>past === 3 || (past === 1 && i === 1) || (past === 2 && i === 0)]])),
      bCl('trav.vyp', 'Стул:', bOL(['норма','діарея','запори'], i=>({0:0, 1:2, 2:1})[vyp] === i))),
    h('div', {class:'bt2 c'}, 'ВИСНОВОК'),
    h('div', {class:'b333z'},
      bCl('an_zak.asa', 'Ступінь операційно-наркозного ризику за ASA:', h('div', {class:'basa'}, ...['I','II','III','IV','V','VI'].map((t, i)=>bO(asa === i, t))), h('div', {}, bO(urg, 'Е (ургентне втручання)'))),
      h('div', {},
        h('div', {class:'brow', 'data-an':'an_main.oper'}, 'Планується оперативне втручання: ', bFill(BV('an_main.oper'), true, true)),
        h('div', {class:'brow', 'data-an':'an_zak.vg'}, 'Планується анестезія:'),
        h('div', {class:'b333v', 'data-an':'an_zak.vg'}, h('div', {}, h('b', {}, 'загальна'), bOL(G, i=>gOn.has(i))), h('div', {'data-an':'an_zak.vr'}, h('b', {}, 'регіональна'), bOL(R, i=>rOn.has(i)))))),
    h('div', {class:'brow', 'data-an':'an_zak.vte'}, 'Профілактика тромбоемболічних ускладнень: ', bFill(AT_('an_zak.vte'), false, true)),
    h('div', {class:'brow', 'data-an':'an_zak.ran'}, 'Профілактика ранових ускладнень: ', bFill(AT_('an_zak.ran'), false, true)),
    h('div', {class:'brow', 'data-an':'an_zak.pm40'}, 'Премедикація за 40 хвилин до операції: ', bFill(AT_('an_zak.pm40'), false, true)),
    h('div', {class:'brow', 'data-an':'an_zak.pmst'}, 'Премедикація на столі: ', bFill(AT_('an_zak.pmst'), false, true)),
    h('div', {class:'brow', 'data-an':'an_zak.anest'}, 'Лікар-анестезіолог: ', bFill(anesDoc(), true), bSmall(' (прізвище)'), '   підпис ____________'));
}
/* ---------- аркуш 2: листок знеболення (альбомний; заповнюється від руки) ---------- */
function b333b(){
  const T = 48;   /* 4 години по 5 хвилин */
  const tc = (n, cls) => Array.from({length:n}, (_, i)=>h('td', {class:(cls || '') + (i % 12 === 0 ? ' bh' : '')}, ''));
  const row = (l, cls) => h('tr', {class:cls || ''}, h('th', {colspan:'2'}, l), ...tc(T));
  const scale = [];
  for (let v = 240; v >= 10; v -= 10) scale.push(h('tr', {class:'bsc'}, v === 240 ? h('th', {rowspan:'24', class:'bleg'}, h('div', {}, 'Умовні позначення:'), h('div', {}, 'х — спонтанне дихання'), h('div', {}, '// — допоміжне дихання'), h('div', {}, 'П — потовиділення'), h('div', {}, 'Ц — ціаноз'), h('div', {}, 'С — сльозотеча'), h('div', {}, 'СЛ — слинотеча'), h('div', {style:'margin-top:6px'}, 'АТ: ∨ сист., ∧ діаст.; пульс — •')) : null, h('th', {class:'bv'}, String(v)), ...tc(T)));
  const drug = (n, t) => [h('tr', {}, h('th', {colspan:'2', class:'bsub'}, t), ...tc(T)), ...Array.from({length:n}, ()=>h('tr', {}, h('td', {colspan:'2'}, ''), ...tc(T)))];
  return bPage('b333 b333l',
    h('div', {class:'bs r'}, 'Продовження форми № 003-3/о'),
    h('div', {class:'brow'}, h('b', {}, 'Листок знеболення'), '   ', bSmall('Пацієнт '), bFill(mv('pib'), true), '  ', bSmall('Медична карта № '), bFill(mv('card')), '  ', bSmall('Дата '), bFill(fmtD(dtNow()[0]))),
    h('table', {class:'bgrid'},
      h('tr', {}, h('th', {colspan:'2'}, 'Час'), ...Array.from({length:T}, (_, i)=>h('th', {class:'bt5' + (i % 12 === 0 ? ' bh' : '')}, i % 12 === 0 ? '' : ''))),
      ...scale,
      row('Дихання'), row('Інгаляційний анестетик, л/хв'), row('Кисень, л/хв'), row('Сатурація кисню, %'), row('Діурез, мл'), row('Крововтрата, мл'), row('Етапи операції', 'btall'),
      ...drug(4, 'Препарати для знеболення'),
      ...drug(0, 'ІНФУЗІЇ'), row('Розчин Рінгера'), row('Розчин глюкози 5%'), row('Поляризуюча суміш'), row(''), row('Разом'),
      h('tr', {}, h('th', {colspan:'2', class:'bsub'}, 'Еритроцитна маса: група ___ резус ___ кількість ___ мл'), ...tc(T))),
    h('div', {class:'bt2'}, 'Медикація під час знеболювання'),
    h('table', {class:'btab b333m'}, h('tr', {}, ...Array.from({length:5}, ()=>[h('th', {}, 'Код'), h('th', {}, 'Назва препарату'), h('th', {}, 'Кільк.')]).flat()),
      ...Array.from({length:3}, ()=>h('tr', {}, ...Array.from({length:15}, ()=>h('td', {}, ''))))),
    h('div', {class:'brow b333sig'}, 'Медсестра-анестезист ', bFill(AT_('an_prot.ms')), '        Завідувач відділення ', bFill(mv('zav'))));
}
/* ---------- аркуш 3: протокол знеболення і протокол пункції ---------- */
function b333c(){
  const [d] = dtNow(), P = k => AI_('an_prot.' + k);
  const dur = k => [AN_('an_prot.' + k, 0), AN_('an_prot.' + k, 1)];
  const ta = dur('tan'), to = dur('top'), dsh = P('dsh');
  const pun = ['prost','riv','osn','gol'].some(k=>{ const f = F('an_pun.' + k); return f && f.el && f.el.value !== ''; });
  const pv = k => AT_('an_pun.' + k), pi = k => AI_('an_pun.' + k);
  const opt = (k, i, t) => bO(P(k) === i, t);
  return bPage('b333 b333c',
    h('div', {class:'bs r'}, 'Продовження форми № 003-3/о'),
    h('div', {class:'bt'}, 'ПРОТОКОЛ ЗНЕБОЛЕННЯ № ', bFill(AT_('an_prot.nom')), ' від ', bDate(d, true)),
    h('div', {class:'brow'}, bSmall('Прізвище, ім’я, по батькові хворого (вік) '), (()=>{ const f = bFill(mv('pib') + (mv('age') ? ' (' + mv('age') + ' р.)' : ''), true, true); f.classList.add('bpib'); return f; })(), '  ', bSmall('Медична карта стаціонарного хворого № '), bFill(mv('card'))),
    h('table', {class:'btab b333t'},
      h('tr', {}, h('td', {'data-an':'an_prot.xir'}, 'Хірург ', bFill(AT_('an_prot.xir'))), h('td', {'data-an':'an_prot.asis'}, 'Асистенти ', bFill(AT_('an_prot.asis'))), h('td', {'data-an':'an_prot.tan'}, 'Загальна тривалість анестезії ', bFill(ta[0]), ' год. ', bFill(ta[1]), ' хв.')),
      h('tr', {}, h('td', {'data-an':'an_zak.anest'}, 'Анестезіолог ', bFill(anesDoc())), h('td', {'data-an':'an_prot.ms'}, 'Медсестра-анестезист ', bFill(AT_('an_prot.ms'))), h('td', {'data-an':'an_prot.top'}, 'Загальна тривалість операції ', bFill(to[0]), ' год. ', bFill(to[1]), ' хв.'))),
    h('div', {class:'b333g b333g3'},
      bCl('an_prot.dost', 'Хворий(а) доставлений(а) до операційної:', bOL(['лежачи','сидячи','пішки'], i=>P('dost') === i), h('div', {}, bFill(AT_('an_prot.dostt')), ' год. хв.')),
      bCl('an_prot.psy', 'Психоемоційний стан:', bOL(['спокій','напруження','тривога','страх'], i=>P('psy') === i)),
      bCl('an_prot.bez', 'Загальний стан та об’єктивні дані без змін відносно первинного огляду:', bO(P('bez') === 0, 'так'), ' ', bO(P('bez') === 1, 'ні')),
      bCl('an_prot.son', 'Сон настав на ' + (AN_('an_prot.son', 0) || '____') + ' хвилині:', bOL(['без збудження','з незначним м’язовим напруженням','зі значним м’язовим напруженням','рухове збудження','мовне збудження'], i=>P('sonh') === i)),
      bCl('an_prot.preox', 'Преоксигенація:', bO(P('preox') === 0, 'так'), ' ', bO(P('preox') === 1, 'ні')),
      bCl('an_prot.rel', 'Релаксація під час індукції анестезії, препарат, доза, мг:', h('div', {class:'bclv'}, AT_('an_prot.rel'))),
      bCl('an_prot.golova', 'Розміщення голови:', bOL(['класичне','поліпшене'], i=>P('golova') === i), h('div', {class:'bclt'}, 'Манжетка:'), bO(P('mansh') === 0, 'є'), ' ', bO(P('mansh') === 1, 'ні')),
      bCl('an_prot.tamp', 'Тампонада ротоглотки проводилась:', bO(P('tamp') === 0, 'так'), ' ', bO(P('tamp') === 1, 'ні')),
      bCl('an_prot.int', 'Інтубація трахеї трубкою № ' + (dsh === 0 ? AN_('an_prot.int', 0) || '___' : '___'), h('div', {}, bFill(dsh === 0 ? AN_('an_prot.int', 1) : ''), ' спроби'), h('div', {}, 'Тривалість ', bFill(dsh === 0 ? AN_('an_prot.int', 2) : ''), ' секунд'), h('div', {}, 'Встановлення ларингомаски № ', bFill(dsh === 1 ? AT_('an_prot.lm') : '')))),
    h('div', {class:'b333g b333g3'},
      bCl('an_prot.vent', 'ШВЛ* апаратом ' + (AT_('an_prot.shvl') || '________'), h('div', {}, 'Режим ', bFill(AT_('an_prot.rezh'))), h('div', {}, 'ДО**, мл ', bFill(AN_('an_prot.vent', 1))), h('div', {}, 'ХОД***, л ', bFill(AN_('an_prot.vent', 2))), h('div', {}, 'ПТКВ**** ', bFill(AN_('an_prot.vent', 3)))),
      bCl('an_prot.vent', 'FiO₂ ' + (AN_('an_prot.vent', 0) || '____'), h('div', {}, 'Потік інгаляційного анестетика, л/хв ', bFill(AN_('an_prot.potik', 0))), h('div', {}, 'Тиск в системі апарат–легені (мм рт. ст.): вдих ', bFill(AN_('an_prot.tysk', 0)), ' видих ', bFill(AN_('an_prot.tysk', 1)))),
      bCl('an_prot.kontur', 'Підігрів суміші проводився ' + (AN_('an_prot.pidigr', 0) || '___') + ' °С', h('div', {class:'bclt'}, 'Зволоження суміші проводилось:'), bO(P('zvol') === 0, 'так'), ' ', bO(P('zvol') === 1, 'ні'), h('div', {class:'bclt'}, 'Контур:'), bOL(['закритий','напівзакритий','напіввідкритий','відкритий'], i=>P('kontur') === i))),
    h('div', {class:'brow', 'data-an':'an_prot.relop'}, 'Релаксація під час операції підтримувалась ', bFill(AT_('an_prot.relop'), false, true)),
    h('div', {class:'b333g b333g3'},
      bCl('an_prot.preb', 'Перебіг наркозу:', bOL(['нормальний','ускладнений'], i=>P('preb') === i), h('div', {class:'bclv'}, AT_('an_prot.prebx'))),
      bCl('an_prot.gem', '', bYN(['так','ні'], [['Гемодинаміка стабільна', i=>P('gem') === i], ['Пульс ритмічний', i=>P('puls') === i]])),
      bCl('an_prot.bal', 'Крововтрата, інфузія, діурез:', h('div', {}, bFill(AN_('an_prot.bal', 0)), ' мл / ', bFill(AN_('an_prot.bal', 1)), ' мл / ', bFill(AN_('an_prot.bal', 2)), ' мл')),
      bCl('an_prot.vyh', 'Вихід з наркозу:', bOL(['нормальний','ускладнений'], i=>P('vyh') === i)),
      bCl('an_prot.refl', 'Рефлекси відновилися:', bOL(['повністю','частково','не відновилися'], i=>P('refl') === i)),
      bCl('an_prot.svid', 'Свідомість відновилася:', bOL(['повністю','частково','елементарний контакт','ні'], i=>P('svid') === i)),
      bCl('an_prot.dyh', 'Самостійне дихання:', bOL(['адекватне','неадекватне','глибоке','поверхневе','відсутнє'], i=>P('dyh') === i)),
      bCl('an_prot.shvlp', 'Проводиться ШВЛ:', bOL(['примусова','допоміжна'], i=>P('shvlp') === i), h('div', {class:'bclt'}, 'Екстубація трахеї:'), bO(P('ekst') === 0, 'так'), ' ', bO(P('ekst') === 1, 'ні')),
      bCl('an_prot.per', 'Хворий(а) переведений(а):', h('div', {}, bFill(P('per') >= 0 ? BV('an_prot.per').replace(/^(Переведений|Переведена|Переведений\/Переведена) до /, '').replace(/ під наглядом медперсоналу$/, '') : 'до палати відділення')), h('div', {}, 'під наглядом медперсоналу; нагляд прийняв о ', bFill(AT_('an_prot.nahl'))))),
    AT_('an_prot.dod') ? h('div', {class:'brow', 'data-an':'an_prot.dod'}, bFill(AT_('an_prot.dod'), false, true)) : null,
    h('div', {class:'brow'}, 'Анестезіолог ', bFill(anesDoc(), true), '  підпис ____________'),
    h('div', {class:'bt2 c', 'data-an':'an_pun.prost'}, 'Протокол пункції/катетеризації субарахноїдального/епідурального простору'),
    h('div', {class:'brow', 'data-an':'an_pun.pdt'}, 'Дата: ', bFill(pun ? fmtD(d) : ''), '   Час: ', bFill(pun ? pv('pdt') : '')),
    h('div', {class:'brow', 'data-an':'an_pun.pol'}, 'Пацієнту в положенні ', bU(pi('pol') === 0, 'сидячи'), '/', bU(pi('pol') === 1, 'лежачи'), ' в асептичних умовах після триразової обробки шкіри розчином антисептика, під місцевою анестезією ', bFill(AN_('an_pun.lid', 0)), ' % розчином лідокаїну ', bFill(AN_('an_pun.lid', 1)), ' мл, на рівні ', bFill(pv('riv')), ' голкою G ', bFill(pv('gol')), ' виконана ', bU(pi('dii') === 0, 'пункція'), '/', bU(pi('dii') === 1, 'катетеризація'), ' ', bU(pi('prost') === 0, 'субарахноїдального'), '/', bU(pi('prost') === 1, 'епідурального'), ' простору.'),
    h('div', {class:'brow', 'data-an':'an_pun.test'}, 'Тест-доза ', bFill(pv('test'), false, true), ' основна доза ', bFill(pv('osn'), false, true)),
    h('div', {class:'brow', 'data-an':'an_pun.rozv'}, 'Анестезія розвинулась на ', bFill(AN_('an_pun.rozv', 0)), ' хвилині. Зона сенсорного блоку відповідає рівню ', bFill(pv('blok')), '.'),
    h('div', {class:'brow', 'data-an':'an_pun.ef'}, 'Ефективність анестезії ', bFill(pi('ef') >= 0 ? BV('an_pun.ef') : ''), '. Асептична пов’язка ', bFill(pi('pov') >= 0 ? BV('an_pun.pov') : ''), bSmall(' (так/ні)')),
    h('div', {class:'brow'}, 'Анестезіолог ', bFill(pun ? anesDoc() : '')),
    h('div', {class:'bs b333fn'}, '*ШВЛ — штучна вентиляція легень; **ДО — дихальний об’єм; ***ХОД — хвилинний об’єм дихання; ****ПТКВ — позитивний тиск у кінці видиху; FiO₂ — фракція кисню у дихальній суміші.'),
    h('div', {class:'bs b333fn'}, 'При нестандартному перебігу анестезії обов’язково зробити додатковий запис у «Медичній карті стаціонарного хворого».'));
}
function b333(){ const p = []; if (BLP.a1 !== false) p.push(b333a()); if (BLP.a2 !== false) p.push(b333b()); if (BLP.a3 !== false) p.push(b333c()); return p.length ? p : [b333a()]; }
/* текст протоколу пункції для документа */
function punText(){
  const pv = k => AT_('an_pun.' + k), pi = k => AI_('an_pun.' + k), lid = [AN_('an_pun.lid', 0), AN_('an_pun.lid', 1)];
  if (pi('prost') < 0 && !pv('riv') && !pv('osn')) return '';
  const x = v => v || '…';
  let t = (mv('dt') ? 'Дата: ' + fmtD(String(mv('dt')).split('T')[0]) + (pv('pdt') ? ', час: ' + pv('pdt') : '') + '. ' : '')
    + `[Пацієнту|Пацієнтці] в положенні ${pi('pol') === 1 ? 'лежачи на боці' : pi('pol') === 0 ? 'сидячи' : '…'} в асептичних умовах після триразової обробки шкіри розчином антисептика, під місцевою анестезією ${x(lid[0])}% розчином лідокаїну ${x(lid[1])} мл, на рівні ${x(pv('riv'))} голкою ${pv('gol') ? 'G ' + pv('gol') : '…'} виконана ${pi('dii') === 1 ? 'катетеризація' : 'пункція'} ${pi('prost') === 1 ? 'епідурального' : pi('prost') === 0 ? 'субарахноїдального' : '…'} простору.`;
  if (pv('test')) t += ` Тест-доза: ${pv('test')}.`;
  t += ` Основна доза: ${x(pv('osn'))}.`;
  if (AN_('an_pun.rozv', 0)) t += ` Анестезія розвинулась на ${AN_('an_pun.rozv', 0)} хвилині.`;
  if (pv('blok')) t += ` Зона сенсорного блоку відповідає рівню ${pv('blok')}.`;
  if (pi('ef') >= 0) t += ` Ефективність анестезії ${BV('an_pun.ef')}.`;
  if (pi('pov') >= 0) t += pi('pov') === 0 ? ' Накладено асептичну пов’язку.' : ' Асептична пов’язка не накладалась.';
  return t;
}
/* підказки анестезіолога (не друкуються) */
function anesHints(){
  const out = [], mal = AI_('an_obj.mal'), bmi = bmiNow();
  const hard = [mal >= 2 ? 'Маллампаті ' + ['I','II','III','IV'][mal] : '', AI_('an_obj.sheya') === 1 ? 'коротка шия' : '', AI_('an_obj.shmob') === 1 ? 'обмежене розгинання шиї' : '', AI_('an_obj.rot') === 1 ? 'обмежене відкривання рота' : '', AI_('an_obj.tmd') === 1 ? 'тиреоментальна відстань < 6 см' : '', bmi >= 35 ? 'ІМТ ' + dec(bmi.toFixed(1)) : ''].filter(Boolean);
  if (hard.length) out.push('Можливі труднощі із забезпеченням прохідності дихальних шляхів (' + hard.join(', ') + '): підготуйте відеоларингоскоп, ларингеальну маску, буж.');
  if (AI_('an_main.mh') === 1) out.push('Злоякісна гіпертермія в родині: уникати сукцинілхоліну й інгаляційних анестетиків, мати дантролен.');
  if (AI_('an_main.golod') >= 1) out.push('Ризик аспірації: індукція з прийомом Селліка / швидка послідовна індукція.');
  if (AI_('an_main.kort') === 1) out.push('Тривалий прийом кортикостероїдів: розгляньте стресову дозу гідрокортизону.');
  if (bmi >= 30) out.push('Ожиріння: перевірте ризик обструктивного апное сну (STOP-BANG).');
  return out.join('\n');
}
/* назви, форма, шапка */
Object.defineProperty(DOCTITLES, 'anes', {get:()=>MODE === 'amb' ? 'КОНСУЛЬТАЦІЙНИЙ ВИСНОВОК АНЕСТЕЗІОЛОГА' : 'ПЕРЕДОПЕРАЦІЙНИЙ ОГЛЯД АНЕСТЕЗІОЛОГОМ', configurable:true, enumerable:true});
FORMS['003-3/о'] = 'Передопераційний огляд анестезіологом та протокол загального знеболення';
{ const fc = formCode; formCode = function(){ return DOC === 'anes' ? (MODE === 'amb' ? '028/о' : '003-3/о') : fc.apply(this, arguments); };
  const dt = docTitle; docTitle = function(){ return DOC === 'anes' ? (MODE === 'amb' ? 'Консультація анестезіолога' : 'Огляд анестезіолога (ф. 003-3/о)') : dt.apply(this, arguments); };
  const fh = formHeader; formHeader = function(){ const r = fh.apply(this, arguments); if (DOC === 'anes') r.card = FORMS[formCode()] + ' (мед. карта № ' + (mv('card') || '______') + ')' + (mv('vidd') ? ' · ' + mv('vidd') : ''); return r; }; }
{ const up = update; update = function(){ const r = up.apply(this, arguments);
    try{ const f = F('an_obj.hint'); if (f && f.abox){ const t = DOC === 'anes' ? anesHints() : ''; f.abox.textContent = t || 'Підказок немає.'; if (f.wrapEl) f.wrapEl.classList.toggle('anhint', !!t); } }catch(e){}
    return r; }; }
/* клік по клітинці бланка — до поля */
document.addEventListener('click', e=>{
  const c = e.target.closest && e.target.closest('#paper .b333 [data-an]'); if (!c) return;
  e.stopPropagation(); e.preventDefault();
  const fld = c.dataset.an;
  if (DOC === 'anes' && /^(skarhy|vitae|zah|shk|dyh|ssc|trav|sech)/.test(fld)) toast('Це поле спільне з первинним оглядом', 1600);
  if (/^an_/.test(fld)) goTab(fld.split('.')[0], /\./.test(fld) ? fld : null); else bGo(fld);
}, true);
