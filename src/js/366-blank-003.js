/* ===== Бланк закладу: медична карта стаціонарного хворого, форма № 003/о
   (наказ МОЗ України від 14.02.2012 № 110 у редакції наказу від 21.01.2016 № 29).
   Сторінки — як у друкованій карті: титульний лист (п. 1–21), «Первинний огляд лікаря» (п. 33–40),
   «43. Щоденник», «45. Епікриз» з даними обстеження (п. 46–53) і п. 54–57.
   Варіанти, які на бланку підкреслюють, підкреслено за даними тих самих полів, що й текст документа;
   чого немає в переліку — на рядку після нього. Порожні обов’язкові місця на екрані — жовті (у друк не йдуть). ===== */
let BLANK = false; try{ BLANK = localStorage.getItem('po.blank') === '1'; }catch(e){}
let BLP = {title:false, exam:true, all:false, e45:true, e54:true, a1:true, a2:true, a3:true}; try{ Object.assign(BLP, JSON.parse(localStorage.getItem('po.blankp') || '{}')); }catch(e){}
const blankOK = () => MODE === 'hosp' && ['ohl','shch','epi','f066','anes'].includes(DOC);
const blankOn = () => BLANK && blankOK();
let BGAP = false;   // підсвічувати порожні обов’язкові місця (лише на екрані)
const BV = k => { const f = F(k); return f ? g(val(f, true)) : ''; };
const BI = k => { const f = F(k); return f && f.el && f.el.value !== '' ? +f.el.value : -1; };
const BN = id => { const e = document.getElementById(id); return e ? e.value.trim() : ''; };
const bSet = (...a) => new Set(a.flat().filter(x=>x >= 0));
const bJoin = (...a) => a.flat().map(x=>String(x || '').trim().replace(/\.$/, '')).filter(Boolean).join('; ');
const bTpl = arr => arr.map((t,i)=>`{${i}|${t}}`).join(', ');
function bSec(id){ const s = SECTIONS.find(x=>x.id === id); if (!s) return ''; const keep = DOC; DOC = s.docs.includes(keep) ? keep : s.docs[0]; let t = null; try{ t = sectionText(s); } finally { DOC = keep; } return t ? g(t.body) : ''; }
/* «Ким направлений»: заклад і лікар; інакше — спосіб госпіталізації */
function bNapr(){ const z = BV('morbi.hospz').replace(/^\(|\)$/g, ''), d = BV('morbi.hospd'); if (z || d) return [z, d ? 'лікар ' + d : ''].filter(Boolean).join(', '); return BI('morbi.hosp') >= 0 ? BV('morbi.hosp').replace(/^(Госпіталізований|Госпіталізована) /, '') : ''; }
const bU3 = (on, t) => h('span', {class:'bl' + (on ? ' bsel' : '')}, t);
/* пункти «ОБСТЕЖЕННЯ» бланка 003/о ↔ план обстеження */
const B003OB = ['Загальний аналіз крові','Загальний аналіз сечі','RW','Глюкоза крові','Цукор крові','ЕКГ','Креатинін, сечовина','Проби печінки','Загальний білок','Залізо','Кальцій','ПТІ','ГГТП','Фібриноген','Гематокрит','Група крові, резус-фактор','Hbs Ag','СРБ','Холестерин, В-ЛП','УЗО ОЧП, нирок, ОМСС, щитоподібної залози','Ro-гр. ОГК','ФГДС','Кал на я/глист','Сеча на діастазу'];
const B003MAP = [[/^ЗАК$/,[1]],[/^ЗАС$/,[2]],[/^глюкоза крові$/,[4]],[/^ЕКГ$/,[6]],[/^біохімічний аналіз крові$/,[7,8,9]],[/^коагулограма$/,[12,14]],[/^група крові/,[16]],[/маркери вірусних гепатитів/,[17]],[/^С-реактивний білок$/,[18]],[/^ліпідограма$/,[19]],[/^УЗД (ОЧП|нирок)$/,[20]],[/^рентгенографія ОГК$/,[21]],[/^ФГДС$/,[22]]];
function bFill(v, req, wide){ v = String(v || '').trim(); return h('span', {class:'bf' + (v ? '' : ' empty') + (wide ? ' wide' : '') + (!v && req && BGAP ? ' bgap' : '')}, v || ' '); }
function bRow(...kids){ return h('div', {class:'brow'}, ...kids.map(k=>typeof k === 'string' ? h('span', {class:'bl'}, k.replace(/^ +| +$/g, m=>'\u00a0'.repeat(m.length))) : k)); }   /* пробіли між клітинками не злипаються */
/* дата клітинками ДД.ММ.РР і час «__ год __ хв» */
function bDate(iso, req){ const d = bD6(iso); return h('span', {class:'bnw'}, bCells(d.slice(0,2), 2, req), h('span', {class:'bdot'}, '.'), bCells(d.slice(2,4), 2, req), h('span', {class:'bdot'}, '.'), bCells(d.slice(4,6), 2, req)); }
function bTime(tm){ tm = tm || ''; return h('span', {class:'bnw'}, h('span', {class:'bl bsep'}, 'час\u00a0'), bCells(tm.slice(0,2), 2), h('span', {class:'bl'}, '\u00a0год\u00a0'), bCells(tm.slice(3,5), 2), h('span', {class:'bl'}, '\u00a0хв')); }
function bLines(v, n, req){ v = String(v || '').trim(); return h('div', {class:'blines' + (!v && req && BGAP ? ' bgap' : ''), style:`min-height:${(n || 1) * 1.55}em`}, v); }
function bOpts(label, tpl, on, extra, req){
  const row = h('div', {class:'brow'}); if (label) row.append(h('span', {class:'bl'}, label + ' '));
  tpl.split(/(\{\d+\|[^}]*\})/).forEach(p=>{ const m = p.match(/^\{(\d+)\|([^}]*)\}$/); if (m) row.append(h('span', {class:on.has(+m[1]) ? 'bu' : ''}, m[2])); else if (p) row.append(p); });
  row.append(' ', bFill(extra, req && !on.size));
  return row;
}
function bCells(s, n, req){ s = String(s || ''); const w = h('span', {class:'bcells' + (!s && req && BGAP ? ' bgap' : '')}); for (let i = 0; i < n; i++) w.append(h('span', {class:'bc'}, s[i] || ' ')); return w; }
function bBox(v, req){ return h('span', {class:'bbox' + (!v && req && BGAP ? ' bgap' : '')}, v ? String(v) : ' '); }
const bSmall = t => h('span', {class:'bs'}, t);
const bD6 = iso => iso ? iso.slice(8,10) + iso.slice(5,7) + iso.slice(2,4) : '';
function bPage(cls, ...kids){ return h('div', {class:'b003 ' + (cls || '')}, h('div', {class:'bframe'}, ...kids)); }
function bHead(){
  const H = formHeader(), left = H.left.filter(x=>!/^Код за ЄДРПОУ/.test(x));
  return h('div', {class:'bhead'},
    h('div', {class:'bhl'}, h('div', {class:'bs'}, 'Найменування міністерства, іншого органу виконавчої влади, підприємства, установи, організації, до сфери управління якого (якої) належить заклад охорони здоров’я'),
      mv('pidp') ? h('div', {class:'bc2'}, mv('pidp')) : h('div', {class:'bline'}),
      h('div', {class:'bs'}, 'Найменування та місцезнаходження (повна поштова адреса) закладу охорони здоров’я, де заповнюється форма'),
      mv('zoz') ? h('div', {class:'bzoz'}, mv('zoz')) : h('div', {class:'bc2 bb'}, left.filter(x=>x !== mv('pidp')).join(', ')),
      mv('zoz') && mv('adr') ? h('div', {class:'badr'}, mv('adr')) : null,
      h('div', {class:'bedr'}, 'Код за ЄДРПОУ ', bCells(mv('edrpou'), 8))),
    h('div', {class:'bhr'}, h('b', {}, 'МЕДИЧНА ДОКУМЕНТАЦІЯ'), h('div', {}, 'Форма первинної облікової документації'), h('b', {}, '№ 003/о'), h('b', {}, 'ЗАТВЕРДЖЕНО'),
      h('div', {}, 'Наказ МОЗ України'), h('div', {}, bCells('14022012', 8), ' № ', bCells('110', 3)),
      bSmall('(у редакції наказу Міністерства охорони здоров’я України від 21.01.2016 року № 29)')));
}

/* ---------- титульний лист (п. 1–21) ---------- */
function bTitle(){
  const P = F('e_per.per'), d1 = P.d1.value || (mv('dt') || '').split('T')[0], tm = (mv('dt') || '').split('T')[1] || '', d2 = P.d2.value;
  const days = bedDays(d1, d2);
  const vyd = BI('hosp.vyd'), alg = [BV('vitae.alerg').replace(/^Алергологічний анамнез /, ''), BV('vitae.alergx')].filter(Boolean).join(', ');
  const napr = bNapr();
  return bPage('btitle', bHead(),
    h('div', {class:'bt'}, 'МЕДИЧНА КАРТА СТАЦІОНАРНОГО ХВОРОГО № ', bFill(mv('card'), true)),
    bRow('1. Дата госпіталізації ', bDate(d1, true), bTime(tm)),
    bRow('2. Стать: ', h('span', {class:'bl' + (sex === 'm' ? ' bsel' : '')}, 'чоловіча – 1'), '; ', h('span', {class:'bl' + (sex === 'f' ? ' bsel' : '')}, 'жіноча – 2'), ' ', bBox(sex === 'm' ? 1 : sex === 'f' ? 2 : '', true)),
    bRow('3. Прізвище, ім’я, по батькові хворого ', (()=>{ const f = bFill(mv('pib'), true, true); f.classList.add('bpib'); return f; })()),
    bRow('4. Дата народження ', bDate(mv('dob'), true), '  5. Вік ', bFill(mv('age') ? mv('age') + ' р.' : '', true)),
    bRow('6. Документ, що посвідчує особу ', bFill(''), '  6.1. Номер документа ', bFill('')), bRow('6.2. Громадянство ', bFill(''), bSmall(' (код країни)')),
    bRow('7. Постійне місце проживання/перебування: ', h('span', {class:'bl' + (mv('addr_np_t') === 'м.' ? ' bsel' : '')}, 'місто – 1'), '; ', h('span', {class:'bl' + (mv('addr_np_t') === 'с.' ? ' bsel' : '')}, 'село – 2'), ' ', bBox(({'м.':1, 'с.':2})[mv('addr_np_t')] || ''), ' ', bFill(mv('addr'), false, true)), bRow('7.1. Поштовий індекс ', bFill(mv('addr_zip'))),
    bRow('8. Місце роботи, посада ', bFill(mv('work'), false, true)),
    bRow('9. Ким направлений хворий ', bFill(napr, false, true), ' ', bCells(BV('morbi.hospe').replace(/\D/g, ''), 8)),
    bRow('10. Діагноз при госпіталізації ', bFill(BV('dx.osn'), true, true), ' ', bCells(BV('dx.mkh').split(/[,;\s]+/)[0], 6, true)),
    bRow('11. Відділення при госпіталізації ', bCells(mv('vcode'), 3), ' ', bFill(mv('vidd')), '  12. Відділення при виписці ', bCells(mv('vcode'), 3)),
    bRow('13. Госпіталізація: ургентна – 1; планова – 2 ', bBox(vyd === 0 ? 1 : vyd === 1 ? 2 : '', true), '  14. Обстеження на ВІЛ-інфекцію ', bCells('', 6)),
    bRow('15. Група крові ', bFill(''), '  16. Резус-приналежність ', bFill(''), '  17. Реакція Васермана ', bCells('', 6)),
    bRow('18. Алергічні реакції, гіперчутливість чи непереносимість лікарського засобу ', bFill(alg, true, true)),
    bRow('19. Госпіталізація з приводу цього захворювання в цьому році: вперше – 1; повторно – 2 ', bBox('')),
    bRow('19.1. Повторна госпіталізація з приводу цього захворювання до 30 днів: так – 1; ні – 2 ', bBox('')),
    bRow('20. Дата виписки/смерті ', bDate(d2), bTime(''), '  21. Проведено ліжко-днів ', bFill(days === '' ? '' : String(days))));
}

/* ---------- первинний огляд лікаря (п. 33–40) ---------- */
function bExam(){
  const tbh = BI('vitae.tbh'), kol = BI('shk.kol'), svid = BI('zah.svid'), st = BI('zah.stan');
  const botk = tbh === 0 || tbh === 3 ? 'заперечує' : tbh === 1 ? 'вірусний гепатит В в анамнезі' : tbh === 2 ? 'вірусний гепатит С в анамнезі' : '';
  const tb = tbh === 3 ? 'перенесений туберкульоз' : tbh >= 0 ? 'заперечує' : '';
  const alg = [BV('vitae.alerg').replace(/^Алергологічний анамнез /, ''), BV('vitae.alergx')].filter(Boolean).join(', ');
  const vt = ['sup','oper','operx','gem','zv','spad','epid','vyizd','strah','inv','vx'].map(k=>{ const f = F('vitae.' + k), v = f ? val(f, true) : ''; return v ? g(cap((f.tpl || '{v}').replace('{v}', v))) : ''; }).filter(Boolean).map(end).join(' ');
  const hw = [cm(BN('zah_hw_0')), num(BN('zah_hw_1'))], bmi = hw[0] > 0 && hw[1] > 0 ? hw[1] / Math.pow(hw[0] / 100, 2) : NaN;
  const bmiCls = isNaN(bmi) ? '' : bmi < 18.5 ? 'недостатня маса тіла' : bmi < 25 ? 'нормальна маса тіла' : bmi < 30 ? 'надлишкова маса тіла' : bmi < 35 ? 'ожиріння I ступеня' : bmi < 40 ? 'ожиріння II ступеня' : 'ожиріння III ступеня';
  const hr = BV('dyh.hr'), perk = BI('dyh.perk'), ausk = BI('dyh.ausk'), side = s => (String(s).match(/(в нижніх відділах.*|справа|зліва|з обох боків)$/) || [''])[0];
  const psch = BI('ssc.psch'), rytm = BI('ssc.rytm'), ps = BN('ssc_ps_0') || BN('ssc_chss_0'), chss = num(BN('ssc_chss_0')), psn = num(BN('ssc_ps_0'));
  const ad = BN('ssc_ad_0') && BN('ssc_ad_1') ? BN('ssc_ad_0') + '/' + BN('ssc_ad_1') : '';
  const tony = BV('ssc.tony'), shum = BI('ssc.shum'), yaz = BV('trav.yaz'), zh = BV('trav.zhyv'), zd = BI('trav.zd'), sv = BI('sech.sv'), vyp = BI('trav.vyp');
  const nab = BI('shk.nab'), vena = BI('shk.vena'), lv = BI('shk.lv'), past = BI('sech.past'), och = BI('trav.och'), mezh = BI('ssc.mezh');
  const spo = BN('dyh_chd_1');
  const p1 = bPage('bexam',
    h('div', {class:'bt'}, 'ПЕРВИННИЙ ОГЛЯД ЛІКАРЯ'),
    bRow('Хворий ', bFill(mv('pib'), true, true), '  Дата, час: ', bFill(mv('dt') ? fmtD(mv('dt').split('T')[0]) + ' ' + (mv('dt').split('T')[1] || '') : '', true)),
    bRow('33. Скарги:'), bLines(bSec('skarhy'), 1, true),
    bRow('34. Anamnesis morbi:'), bLines(bSec('morbi'), 2, true),
    bRow('35. Anamnesis vitae: хв. Боткіна ', bFill(botk), ', туберкульоз ', bFill(tb)),
    bRow('Алергічні реакції: ', bFill(alg, true, true)),
    bRow('Перенесені захворювання: '), bLines(vt, 1),
    bRow('36. Об’єктивні дані:'),
    bOpts('Загальний стан:', bTpl(['задовільний','відносно задовільний','середньої тяжкості','тяжкий','дуже тяжкий','критичний']), bSet([0,2,3,4][st] ?? -1), '', true),
    bOpts('Свідомість:', bTpl(['ясна','сплутана','сопор','кома']), bSet([0,-1,2,3][svid] ?? -1), svid === 1 ? 'оглушення' : '', true),
    bOpts('Шкіра:', bTpl(['звичайного кольору','бліда','ціанотична','жовтянична','зелениста','акроціаноз']), bSet([[0],[1],[2],[1,5],[3],[],[]][kol] || []),
      bJoin(kol === 5 ? 'гіперемована' : kol === 6 ? 'землисто-сіра' : '', BV('shk.vol'), BI('shk.tur') >= 0 ? 'тургор ' + BV('shk.tur') : '', BV('shk.vys')), true),
    bOpts('Видимі слизові:', bTpl(['звичайного кольору','бліді','ціанотичні','іктеричні']), bSet([[0],[1],[2],[1],[3],[],[]][kol] || []), BV('shk.zev')),
    bRow('Варикозне розширення вен на ногах ', bFill(vena === 3 ? 'є' : vena === 0 ? 'немає' : vena > 0 ? BV('shk.vena') : ''), ', набряки ', bFill(nab === 0 ? 'немає' : nab > 0 ? BV('shk.nab') : '')),
    bOpts('Харчування:', bTpl(['достатнє','надлишкове','ожиріння','знижене','кахексія']),
      BI('zah.harch') >= 0 ? bSet([0,1,3][BI('zah.harch')], bmi >= 30 ? 2 : -1) : bSet(isNaN(bmi) ? -1 : bmi < 18.5 ? 3 : bmi < 25 ? 0 : bmi < 30 ? 1 : 2), BI('zah.stat') >= 0 ? 'статура ' + BV('zah.stat') : ''),
    bRow('Зріст ', bFill(hw[0] > 0 ? dec(hw[0]) : '', true), ' см, маса тіла ', bFill(hw[1] > 0 ? BN('zah_hw_1') : '', true), ' кг, ІМТ ', bFill(isNaN(bmi) ? '' : dec(bmi.toFixed(1)), true), ' кг/м² ', bFill(bmiCls)),
    bOpts('Периф. л/в:', bTpl(['не збільшені','збільшені']), bSet(lv === 0 ? 0 : lv > 0 ? 1 : -1), lv > 0 ? BV('shk.lv') : ''),
    bRow('Щитоподібна залоза: ', bFill(BV('shk.shch').replace(/^Щитоподібна залоза /, ''), false, true)),
    bRow('Молочні залози: ', bFill('', false, true)),
    bRow('Кістково-суглобова система: ', bFill('', false, true)),
    bOpts('Система органів дихання:', '{0|дихання через ніс}, {1|вільне}, {2|затруднене}, {3|виділення}', new Set(), bJoin(BV('dyh.gk'), spo ? 'SpO2 ' + spo + '%' : '')),
    bOpts('Перкуторно над легенями:', bTpl(['легеневий','вкорочений','тупий','коробочний звук']), bSet([0,3,1,1,1][perk] ?? -1), perk >= 2 ? side(BV('dyh.perk')) : '', true),
    bOpts('Аускультативно:', '{0|дихання везикулярне}, {1|ослаблене}, {2|гортанне}, {3|не вислуховується}', bSet([[0],[],[0,1],[1],[1],[1],[]][ausk] || []),
      ausk === 1 || ausk === 6 ? BV('dyh.ausk') : ausk >= 3 && ausk <= 5 ? side(BV('dyh.ausk')) : '', true),
    bOpts('Хрипи:', '{0|немає}, {1|сухі} ({2|свистячі}, {3|жужачі}), {4|вологі} ({5|дрібно-пузирчаті}, {6|велико-пузирчаті}), {7|крепітація}',
      bSet(/не вислуховуються/.test(hr) ? 0 : -1, /сухі/.test(hr) ? 1 : -1, /свистячі/.test(hr) ? 2 : -1, /вологі/.test(hr) ? 4 : -1, /дрібнопухирч/.test(hr) ? 5 : -1, /крепітац/.test(hr) ? 7 : -1),
      bJoin(/поодинокі/.test(hr) ? 'поодинокі' : '', /розсіяні/.test(hr) ? 'розсіяні' : '', side(hr)), true),
    bRow('Температура тіла: ', bFill(BN('zah_temp_0') ? BN('zah_temp_0') + ' °C' : '', true), ', ЧДР ', bFill(BN('dyh_chd_0'), true)),
    (()=>{ const r = bOpts('Серцево-судинна система: пульс', '', new Set(), '', false); r.lastChild.remove(); r.append(bFill(ps, true), ', ');
      const on = bSet([[0,5],[6],[6,7],[3],[2]][psch] || (rytm === 1 ? [6] : rytm === 0 ? [5] : []));
      '{0|задовільного наповнення}, {1|м’який}, {2|слабкий}, {3|напружений}, {4|нитковидний}, {5|ритмічний}, {6|аритмічний}, {7|дефіцит}'.split(/(\{\d+\|[^}]*\})/).forEach(p=>{ const m = p.match(/^\{(\d+)\|([^}]*)\}$/); if (m) r.append(h('span', {class:on.has(+m[1]) ? 'bu' : ''}, m[2])); else if (p) r.append(p); });
      r.append(' ', bFill(chss > psn ? String(chss - psn) : ''), ' за 1 хв.'); return r; })(),
    bRow('А/Т: права рука ', bFill(ad, true), ' мм рт. ст., ліва рука ', bFill(''), ' мм рт. ст.'),
    bOpts('Межі серця:', bTpl(['в нормі','розширені']), bSet(mezh === 0 ? 0 : mezh > 0 ? 1 : -1), mezh > 0 ? BV('ssc.mezh') : ''),
    bOpts('Тони серця:', '{0|ясні}, {1|ослаблені}, {2|шум}', bSet(/^ясні/.test(tony) ? 0 : -1, /приглушені|глухі/.test(tony) ? 1 : -1, shum > 0 ? 2 : -1),
      bJoin(/,/.test(tony) || /глухі|приглушені/.test(tony) ? tony : '', rytm > 0 ? BV('ssc.rytm') : '', shum > 0 ? BV('ssc.shum') : ''), true),
    bOpts('Система травлення: язик', '{0|вологий}, {1|сухий}, {2|чистий}, {3|обкладений} нальотом {4|білим}, {5|сірим}, {6|увесь}, {7|біля кореня}',
      bSet(/вологий/.test(yaz) ? 0 : -1, /сухий/.test(yaz) ? 1 : -1, /чистий/.test(yaz) ? 2 : -1, /обкладений/.test(yaz) ? 3 : -1, /білим/.test(yaz) ? 4 : -1), ''),
    bOpts('Живіт:', bTpl(['м’який','напружений','симетричний','здутий','приймає участь в акті дихання','безболісний','болісний']),
      bSet(/^м’який/.test(zh) ? 0 : -1, /напру/.test(zh) ? 1 : -1, zd > 0 ? 3 : -1, /неболючий/.test(zh) ? 5 : -1, /болючий/.test(zh) && !/неболючий/.test(zh) ? 6 : -1),
      bJoin((zh.match(/болючий (.+)$/) || ['',''])[1].replace(/^при пальпації$/, ''), zd === 3 ? 'асиметричний' : ''), true),
    bLines(['perist','symp','pech','sel','hryzha','rect'].map(k=>BV('trav.' + k) ? (k === 'symp' ? 'Позитивні симптоми: ' + BV('trav.symp') : BV('trav.' + k)) : '').filter(Boolean).map(end).join(' '), 1),
    bOpts('С-м подразнення очеревини:', bTpl(['немає','слабо позитивний','позитивний','сумнівний']), bSet(och === 0 ? 0 : och === 1 ? 2 : -1), och === 1 ? 'Щоткіна–Блюмберга' : ''),
    bOpts('С-м Пастернацького:', bTpl(['негативний','слабо позитивний','позитивний','сумнівний']), bSet(past === 0 ? 0 : past > 0 ? 2 : -1), past > 0 ? side(BV('sech.past')) : ''),
    bOpts('Сечовипускання:', bTpl(['вільне','затруднене','часте','болюче','безболісне']), bSet([[0,4],[1],[3],[2],[2]][sv] || []), bJoin(sv === 4 ? 'з ніктурією' : '', BI('sech.diur') > 0 ? BV('sech.diur') : '')),
    bOpts('Випорожнення:', '{0|норма}, {1|діарея}, {2|запор}; кал: {3|звичайного кольору}, {4|слиз}, {5|кров}', bSet([[0,3],[2],[1],[],[],[]][vyp] || []), [3,4,5].includes(vyp) ? BV('trav.vyp') : ''));
  /* сторінка 2: продовження, діагноз, обстеження, лікування, консультації, п. 37–40 */
  const cont = [bSec('nevr') ? 'Неврологічний статус: ' + bSec('nevr') : '', bSec('loc') ? 'Status localis: ' + bSec('loc') : '', BV('zah.dod'), BV('dyh.dod'), BV('ssc.dod'), BV('trav.dod')].filter(Boolean).map(end).join(' ');
  const dx = [BV('dx.osn') ? end(BV('dx.osn').replace(/\.$/, '') + (BV('dx.mkh') ? ' (' + BV('dx.mkh') + ')' : '')) : '', BV('dx.uskl') ? 'Ускладнення: ' + end(BV('dx.uskl')) : '', BV('dx.supd') ? 'Супутні: ' + end(BV('dx.supd')) : ''].filter(Boolean).join(' ');
  const plan = F('dx.plan').chips.map((c,i)=>c.getAttribute('aria-pressed') === 'true' ? O(F('dx.plan').opts[i]).t : null).filter(Boolean);
  const OB = ['Загальний аналіз крові','Загальний аналіз сечі','RW','Глюкоза крові','Цукор крові','ЕКГ','Креатинін, сечовина','Проби печінки','Загальний білок','Залізо','Кальцій','ПТІ','ГГТП','Фібриноген','Гематокрит','Група крові, резус-фактор','Hbs Ag','СРБ','Холестерин, В-ЛП','УЗО ОЧП, нирок, ОМСС, щитоподібної залози','Ro-гр. ОГК','ФГДС','Кал на я/глист','Сеча на діастазу'];
  const MAP = B003MAP; /* також для кліку по пункту */
  const MAP0 = [[/^ЗАК$/,[1]],[/^ЗАС$/,[2]],[/^глюкоза крові$/,[4]],[/^ЕКГ$/,[6]],[/^біохімічний аналіз крові$/,[7,8,9]],[/^коагулограма$/,[12,14]],[/^група крові/,[16]],[/маркери вірусних гепатитів/,[17]],[/^С-реактивний білок$/,[18]],[/^ліпідограма$/,[19]],[/^УЗД (ОЧП|нирок)$/,[20]],[/^рентгенографія ОГК$/,[21]],[/^ФГДС$/,[22]]];
  const on = new Set(), rest = [];
  plan.filter(t=>!/^консультація/.test(t)).forEach(t=>{ const m = MAP.find(([re])=>re.test(t)); if (m) m[1].forEach(n=>on.add(n)); else rest.push(t); });
  BV('dx.plano').split(/[;,]\s*/).map(x=>x.trim().toLowerCase()).filter(Boolean).forEach(x=>{ const i = OB.findIndex(o=>o.toLowerCase() === x); if (i >= 0) on.add(i + 1); else rest.push(x); });
  const kons = plan.filter(t=>/^консультація/.test(t)).map(t=>t.replace(/^консультація /, ''));
  const K4 = [['ОКУЛІСТА',/офтальмолог|окуліст/],['ХІРУРГА',/^хірурга$/],['НЕВРОЛОГА',/^невролога$/],['ЛОРа',/ЛОР/]];
  const kRest = kons.filter(k=>!K4.some(([,re])=>re.test(k)));
  const kd = it => typeof rxKind === 'function' ? rxKind(it) : 'drug', rx = RXF().filter(it=>!it.stop || it.stop >= todayISO());
  const reg = rx.filter(it=>kd(it) === 'reg').map(it=>rxLine(it)).join('; '), diet = rx.filter(it=>kd(it) === 'diet').map(it=>rxLine(it)).join('; ');
  const meds = rx.filter(it=>!['reg','diet'].includes(kd(it))).map((it,k)=>`${k+1}. ${rxLine(it)}.`).join('\n');
  const p2 = bPage('bexam2',
    bLines(cont, 3),
    bRow('На підставі вказаного:'), h('div', {class:'brow'}, h('b', {}, 'ДІАГНОЗ: ')), bLines(dx, 2, true),
    h('div', {class:'bcols'},
      h('div', {}, h('div', {class:'bt2'}, 'ОБСТЕЖЕННЯ:'), ...OB.map((t,i)=>h('div', {class:'bob bobk', 'data-ob':String(i + 1), title:'Натисніть — додати до плану обстеження або прибрати'}, h('span', {class:'bnum' + (on.has(i + 1) ? ' on' : '')}, String(i + 1)), '. ' + t)),
        h('div', {class:'bob'}, h('span', {class:'bnum' + (rest.length ? ' on' : '')}, '25'), '. ', bFill(rest.join(', '))),
        h('div', {class:'bt2'}, 'КОНСУЛЬТАЦІЯ'), ...K4.map(([t,re])=>h('div', {class:'bob'}, h('span', {class:kons.some(k=>re.test(k)) ? 'bu' : ''}, t))),
        kRest.length ? h('div', {class:'bob'}, bFill(kRest.join(', '))) : ''),
      h('div', {}, h('div', {class:'bt2 r'}, 'ЛІКУВАННЯ:'), bRow('РЕЖИМ ', bFill(reg), ' ДІЄТА ', bFill(diet)), bLines(meds, 8, true))),
    bRow('37. Огляд на коросту: ', bU3(BI('shk.kor') === 0, 'так – 1'), '; ', bU3(BI('shk.kor') === 1, 'ні – 2'), ' ', bBox(BI('shk.kor') >= 0 ? BI('shk.kor') + 1 : '', true)),
    bRow('38. Огляд на педикульоз: ', bU3(BI('shk.ped') === 0, 'так – 1'), '; ', bU3(BI('shk.ped') === 1, 'ні – 2'), ' ', bBox(BI('shk.ped') >= 0 ? BI('shk.ped') + 1 : '', true)),
    bRow('39. З режимом дня та забороною паління ознайомлений: ', bU3(BI('shk.rezh') === 0, 'так – 1'), '; ', bU3(BI('shk.rezh') === 1, 'ні – 2'), ' ', bBox(BI('shk.rezh') >= 0 ? BI('shk.rezh') + 1 : '', true), '   Дата ', bCells(BI('shk.rezh') >= 0 ? bD6((mv('dt') || '').split('T')[0]) : '', 6), ' Підпис хворого ', bFill('')),
    bRow('40. П.І.Б. лікаря ', bFill(mv('doc'), true), ' підпис ', bFill(''), ' реєстраційний номер ', bFill('')));
  return [p1, p2];
}

/* ---------- 43. Щоденник ---------- */
function bDv(f, key){ const fl = F(key); if (!fl) return ''; const id = key.replace('.', '_'); const v = f[id]; if (v === undefined || v === '') return '';
  return fl.type === 'sel' ? g(O(fl.opts[+v]).t) : g(String(v)); }
/* поле бланка, яке можна вписати на місці (лише поточний запис) */
function bFF(el, ids){ el.dataset.fld = ids; el.title = 'Натисніть, щоб вписати'; return el; }
/* пункт-вибір бланка (лімфовузли, язик, печінка…) — клік відкриває вибір варіанта (лише поточний запис) */
function bFS(el, key){ el.dataset.dsel = key; el.title = 'Натисніть, щоб вибрати'; return el; }
function bDiaryEntry(e){
  const f = e.f, v = k => bDv(f, k), n = id => (f[id] || '').trim();
  const what = n('d_main_zal') || n('d_main_skx').replace(/^на /, ''), how = f.d_main_sk && f.d_main_sk !== '0' ? v('d_main.sk').replace(/^Скарги /, '') : '';
  const sk = f.d_main_sk === '0' && !what ? 'активно не пред’являє' : what ? what + (how ? ' (' + how + ')' : '') : how;
  const dyn = (v('d_main.dyn').match(/з позитивною динамікою|покращився|погіршився|без суттєвої динаміки/) || [''])[0], son = f.d_main_son && f.d_main_son !== '0' ? v('d_main.son') : '';
  const o2 = n('d_obj_o2_0'), spo = n('d_obj_chd_1');
  const serce = v('d_obj.serce');
  const lik = [e.rx || '', n('d_lik_obs'), n('d_lik_kor') ? 'Корекція терапії: ' + n('d_lik_kor') : '', e.osn || n('d_lik_osn'), f.d_lik_plan ? v('d_lik.plan') : ''].filter(Boolean).map(end).join(' ');
  const dt = String(e.dt || '');
  return h('div', {class:'bdi' + (e.cur ? ' bcur' : '')},
    h('div', {class:'bdl'}, h('div', {}, 'Дата'), bFill(dt ? fmtD(dt.split('T')[0]) + (dt.split('T')[1] ? ' ' + dt.split('T')[1] : '') : '', true),
      h('div', {}, 'T – ', bFF(bFill(n('d_obj_t_0'), true), 'd_obj_t_0'), ' °C'), h('div', {}, 'Ps – ', bFF(bFill(n('d_obj_chss_0'), true), 'd_obj_chss_0'), ' /хв.'),
      h('div', {}, 'АТ – ', bFF(bFill(n('d_obj_ad_0') && n('d_obj_ad_1') ? n('d_obj_ad_0') + '/' + n('d_obj_ad_1') : '', true), 'd_obj_ad_0 d_obj_ad_1'), ' мм рт. ст.'), h('div', {}, 'ЧДР – ', bFF(bFill(n('d_obj_chd_0')), 'd_obj_chd_0 d_obj_chd_1'), ' /хв.')),
    h('div', {class:'bdr'},
      bRow('Скарги на: ', bFill(bJoin(sk, son), true, true)),
      bRow('Об’єктивно: загальний стан ', bFill([v('d_main.stan'), dyn ? (/^з /.test(dyn) ? dyn : 'стан ' + dyn) : ''].filter(Boolean).join(', '), true), ', свідомість не порушена.'),
      f.d_main_svid && f.d_main_svid !== '0' ? bRow('Свідомість: ', bFill(v('d_main.svid'))) : '',
      bRow('Реакція на огляд адекватна. Шкірні покриви та видимі слизові ', bFill(v('d_obj.shk').replace(/^Шкірні покриви /, ''), false, true)),
      bRow('Лімфатичні вузли ', bFS(bFill(v('d_obj.lv'), false, true), 'd_obj.lv')), bRow('Набряки ', bFill(f.d_obj_nab === '0' ? 'немає' : v('d_obj.nab'), false, true)),
      bRow('Дихання через ніс ', bFS(bFill(v('d_obj.nis'), false, true), 'd_obj.nis')), bRow('Перкуторно ', bFS(bFill(v('d_obj.perk'), false, true), 'd_obj.perk')),
      bRow('Аускультативно в легенях ', bFill(bJoin(v('d_obj.dyh'), spo ? 'SpO2 ' + spo + '%' + (o2 ? ' на кисні ' + o2 + ' л/хв' : '') : ''), true, true)),
      bRow('Діяльність серця ', bFill(/неправильний/.test(serce) ? 'аритмічна' : /правильний/.test(serce) ? 'ритмічна' : '', false, true)), bRow('Тони ', bFill(serce.replace(/, ритм.*$/, ''), false, true)),
      bRow('Язик ', bFS(bFill(v('d_obj.yaz'), false, true), 'd_obj.yaz')), bRow('Живіт м’який, при пальпації ', bFill(v('d_obj.zhyv').replace(/^м’який, ?/, ''), false, true)),
      bRow('рівномірно бере участь в акті дихання ', bFS(bFill(f.d_obj_grk === '0' ? 'так' : v('d_obj.grk'), false, true), 'd_obj.grk')), bRow('Печінка ', bFS(bFill(v('d_obj.pech'), false, true), 'd_obj.pech')),
      bRow('Випорожнення ', bFill(/регулярні/.test(v('d_obj.fiz')) ? 'регулярні' : /Рідкі/.test(v('d_obj.fiz')) ? 'рідкі' : /Затримка/.test(v('d_obj.fiz')) ? 'затримка' : ''), ' раз на добу, ', bFill(''), ' оформлене, ', bFill('')),
      bRow('С-м Пастернацького ', bFS(bFill(v('d_obj.pst')), 'd_obj.pst'), '. Сечовипускання ', bFS(bFill(v('d_obj.sech') || (f.d_obj_fiz === '1' ? 'діурез знижений' : ''), false, true), 'd_obj.sech'), '.'),
      bRow('Лікування'), bLines(lik, 3),
      bRow(h('i', {}, 'Лікар '), bFill(mv('doc'), true))));
}
function bDiary(){
  const cur = diaryFields(), dt = mv('dt') ? mv('dt') : '';
  const entries = (BLP.all ? DIARIES.map(d=>({dt:d.dt, f:(d.data && d.data.f) || {}})) : []);
  const curE = {cur:true, dt, f:cur.f, rx:(()=>{ const r = rxPart(); return r ? r.body : ''; })(), osn:g(val(F('d_lik.osn'), true) || '')};
  if (!entries.length || entries[entries.length - 1].dt !== dt) entries.push(curE); else entries[entries.length - 1] = curE;
  const pages = [];
  for (let i = 0; i < entries.length; i += 2) pages.push(bPage('bdiary', h('div', {class:'bt'}, '43. ЩОДЕННИК'), ...entries.slice(i, i + 2).map(bDiaryEntry)));
  return pages;
}

/* ---------- 45. Епікриз і п. 54–57 ---------- */
function bEpi(){
  const dead = F('e_per.vs') && F('e_per.vs').el.value === '1';
  const intro = [bSec('e_per'), BV('e_lik.dyn') ? end(cap(BV('e_lik.dyn'))) : '', BV('e_lik.vyp') ? 'При виписці: ' + end(BV('e_lik.vyp')) : ''].filter(Boolean).join(' ');
  const obs = bSec('e_obs').split('\n').map(x=>x.trim()).filter(Boolean);
  const T = [[46,'Загальний аналіз крові',/^(ЗАК|Загальний аналіз крові)/i],[47,'Загальний аналіз сечі',/^(ЗАС|Загальний аналіз сечі)/i],[48,'Печінкові проби',/^(Біохімічн|Печінков)/i],[49,'Копрограма',/^Копрограм/i],
    [50,'Аналіз крові на глюкозу',/^(Глюкоза|Аналіз крові на глюкозу)/i],[51,'Аналіз крові на амілазу',/^Амілаз/i],[52,'Аналіз сечі на глюкозу (з добової кількості)',/^Аналіз сечі на глюкозу/i],[53,'Аналіз сечі на діастазу',/діастаз/i]];
  const used = new Set();
  const rows = T.map(([n,t,re])=>{ const l = obs.filter(x=>re.test(x)); l.forEach(x=>used.add(x)); return bRow(`${n}. ${t} `, bFF(bFill(l.map(x=>x.replace(re, '').replace(/^[\s:(]*/, m=>m.includes('(') ? '(' : '')).join(' ').trim(), false, true), 'e_obs_z' + n)); });
  const other = obs.filter(x=>!used.has(x)).join('\n');
  const pages = [];
  if (BLP.e45) pages.push(bPage('bepi',
    bRow('Медична карта стаціонарного хворого № ', bFill(mv('card'), true), ' ', bFill(mv('pib'), true, true)), h('div', {class:'bs r'}, '(прізвище, ім’я, по батькові хворого)'),
    h('div', {class:'bt'}, '45. ЕПІКРИЗ (перевідний, ', h('span', {class:dead ? '' : 'bu'}, 'виписний'), ', ', h('span', {class:dead ? 'bu' : ''}, 'посмертний'), ') (підкреслити)'),
    bLines(intro, 14, true), h('div', {class:'bt2 c'}, 'Дані обстеження:'), ...rows, bLines(other, 3)));
  if (BLP.e54){
    const osn = BV('dx.osn'), code = BV('dx.mkh'), usk = BV('dx.uskl'), sup = BV('dx.supd');
    const dxRows = [[osn, code, true], ...usk.split(/;\s*/).filter(Boolean).map(t=>[t, '', false]), ...sup.split(/;\s*/).filter(Boolean).map(t=>[t, '', false])];
    while (dxRows.length < 7) dxRows.push(['', '', false]);
    const rezI = BI('e_lik.rez'), rez = dead ? 5 : rezI >= 0 ? [1,2,4,3][rezI] : '';
    const P = F('e_per.per');
    pages.push(bPage('bepi2', h('div', {class:'bt'}, '54. Діагноз заключний клінічний'),
      h('table', {class:'bdx'}, h('thead', {}, h('tr', {}, h('th', {}, 'Основний'), h('th', {}, 'Назва діагнозу'), h('th', {}, 'Код за МКХ-10'))),
        h('tbody', {}, ...dxRows.slice(0, 7).map(([t,c,m],i)=>h('tr', {}, h('td', {class:'c'}, bBox(m && t ? '✓' : '', i === 0)), h('td', {}, i === 0 ? bFill(t, true, true) : t || ' '), h('td', {}, bCells(String(c).split(/[,;\s]+/)[0], 6, i === 0)))))),
      bRow('Додаткові діагнози: ускладнення основного діагнозу – 1; супутнє захворювання – 2 ', bBox(usk ? 1 : ''), ' ', bBox(sup ? 2 : '')),
      bRow('Категорія резистентності: відсутня – 1; чутливий ТБ – 2; монорезистентний ТБ – 3; полірезистентний ТБ – 4; мультирезистентний ТБ – 5; туберкульоз із розширеною резистентністю – 6 ', bBox('')),
      bRow('55. Медичне лікування '), bLines(BV('e_lik.lik') || rxSummary(), 6, true),
      bRow('56. Лікувальні рекомендації та режим хворого '), bLines([bSec('e_rek'), BV('e_lik.eln') ? end(cap(BV('e_lik.eln'))) : ''].filter(Boolean).join('\n'), 6, true),
      bRow('57. Результат медичного лікування: виписаний(а) з: одужанням – 1; поліпшенням – 2; погіршенням – 3; без змін – 4; помер(ла) – 5; переведений(а) до іншого закладу охорони здоров’я – 6; здоровий(а) – 7 ', bBox(rez, true)),
      bLines('', 2),
      bRow('57.1. П.І.Б. лікаря ', bFill(mv('doc'), true), ' підпис ', bFill(''), ' реєстраційний номер ', bFill('')),
      bRow('57.2. П.І.Б. завідувача відділення ', bFill(mv('zav'), true), ' підпис ', bFill(''), ' реєстраційний номер ', bFill('')),
      bRow('Дата заповнення ', bDate(P.d2.value || todayISO(), true), bSmall(' (число, місяць, рік)'))));
  }
  return pages;
}

function blankPages(){
  if (DOC === 'ohl') return [...(BLP.title ? [bTitle()] : []), ...(BLP.exam ? bExam() : [])];
  if (DOC === 'shch') return bDiary();
  if (DOC === 'epi') return bEpi();
  if (DOC === 'f066') return b066();
  if (DOC === 'anes') return typeof b333 === 'function' ? b333() : [];
  return [];
}
/* перемикач «Текст / Бланк закладу» і вибір сторінок — над аркушем */
function blankBar(){
  const bar = h('div', {class:'blankbar'});
  if (!blankOK()) return bar;
  const seg = (on, t, fn) => h('button', {type:'button', 'aria-pressed':on ? 'true' : 'false', onclick:fn}, t);
  const setB = v => { BLANK = v; try{ localStorage.setItem('po.blank', v ? '1' : '0'); }catch(e){} renderPaper(); };
  const setP = (k, v) => { BLP[k] = v; try{ localStorage.setItem('po.blankp', JSON.stringify(BLP)); }catch(e){} renderPaper(); };
  bar.append(h('span', {class:'seg'}, seg(!BLANK, 'Текст документа', ()=>setB(false)), seg(BLANK, DOC === 'f066' ? 'Бланк 066/о' : DOC === 'anes' ? 'Бланк 003-3/о' : 'Бланк 003/о', ()=>setB(true))));
  if (BLANK){
    const ch = (k, t) => h('label', {class:'blk'}, (()=>{ const c = h('input', {type:'checkbox'}); c.checked = !!BLP[k]; c.addEventListener('change', ()=>setP(k, c.checked)); return c; })(), ' ' + t);
    if (DOC === 'ohl') bar.append(ch('title', 'титульний лист'), ch('exam', 'первинний огляд'));
    if (DOC === 'shch') bar.append(ch('all', 'усі записи журналу (інакше — лише поточний)'));
    if (DOC === 'epi') bar.append(ch('e45', '45. Епікриз'), ch('e54', '54–57. Діагноз, лікування, результат'));
    if (DOC === 'anes') bar.append(ch('a1', 'огляд'), ch('a2', 'листок знеболення'), ch('a3', 'протокол знеболення'));
  }
  return bar;
}
