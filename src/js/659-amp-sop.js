/* ===== 0.9.3.71 — СОП закладу з протимікробної терапії (№ 212–215): Додатки 1–5 =====
   Локальні СОП КНП «Оржицька лікарня»: обґрунтування призначення (Додаток 1), преавторизація групи резерву (Додаток 2),
   протокол консиліуму (Додаток 3), бланк замовлення ПЛЗ (Додаток 4), ретроспективний аудит (Додаток 5).
   • Вмикач «СОП закладу: протимікробна терапія» — у «Налаштуваннях»: за замовчуванням увімкнено лише для закладу
     з кодом ЄДРПОУ 01999448 (з налаштувань закладу); в інших закладах — вимкнено, можна ввімкнути вручну.
   • Листок призначень: біля протимікробного препарату — вид (АБ / АФ / ПВ / ПП) і кнопки друку Додатків, заповнених
     даними пацієнта (огляд або щоденник, журнал обстежень, КК, призначення). Чого немає — лишається лінія для ручки.
   • «🖨 Порожні бланки» — ті самі Додатки порожніми.
   Медичні пороги тут не задаються; текст бланків — як у затверджених Додатках (виправлено «бактеріологічної» → «бактеріальної»). */

/*AMP-TPL-START*/
const ampE = s => String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const ampV = (x, cls) => `<span class="av${cls ? ' ' + cls : ''}">${ampE(x)}</span>`;
const ampOpt = (list, i) => list.map((t, k) => k === i ? `<span class="au">${t}</span>` : t).join('/');
const ampBox = on => `<span class="abx">${on ? '✓' : ''}</span>`;
const AMP_KINDS = ['антибактеріальних', 'антифунгальних', 'противірусних', 'протипаразитарних'];
const AMP_ETIO = ['бактеріальної', 'вірусної', 'паразитарної', 'грибкової'];
function ampD1(v){
  v = v || {};
  const ki = ['ab','af','av','ap'].indexOf(v.kind), ei = ['ab','av','ap','af'].indexOf(v.kind);
  return `<div class="ampf d1"><div class="ah"><span></span><span>Додаток 1</span></div>
<h2>Обґрунтування призначення</h2>
<p class="asub">${ampOpt(AMP_KINDS, ki)} лікарських засобів <span class="sm">(необхідне підкреслити)</span></p>
<table class="kv"><tr><td>П.І.Б пацієнта</td><td>${ampE(v.pib)}</td></tr><tr><td>№ історії хвороби, відділення</td><td>${ampE([v.card, v.vidd].filter(Boolean).join(', '))}</td></tr><tr><td>Діагноз</td><td>${ampE(v.dx)}</td></tr></table>
<p>Враховуючи загальний стан хворого(ї): ${ampOpt(['середньої важкості','важкий'], v.stan)} <span class="sm">(потрібне підкреслити)</span>, ${ampOpt(['встановлене','з високою ймовірністю підозрюване'], -1)} захворювання ${ampOpt(AMP_ETIO, ei)} етіології <span class="sm">(потрібне підкреслити)</span>.</p>
<p class="b">Дані клінічного обстеження:</p>
<div class="ar">t тіла ${ampV(v.t)} °C, АТ ${ampV(v.ad)} мм рт. ст., ЧД ${ampV(v.chd)} /хв, Пульс ${ampV(v.ps)} /хв, SpO₂ (кисень) ${ampV(v.spo2)} %${v.o2 ? ' на кисні ' + ampE(v.o2) + ' л/хв' : ''}</div>
<div class="ar">Рентгенографія ОГК ${ampV(v.rtg, 'g')}</div>
<div class="ar">Прокальцитонін ${ampV(v.pct)} нг/мл; СРБ ${ampV(v.crp)} мг/л;</div>
<div class="ar">Абсолютна кількість лейкоцитів (WBC) ${ampV(v.wbc)} ×10⁹/л; Відносна кількість нейтрофілів ${ampV(v.neu)} %;</div>
<div class="ar">Кліренс креатиніну (КК) ${ampV(v.kk)} мл/хв;</div>
<div class="ar"><b>Мікробіологічний статус.</b> Результат бак-посіву, взятого в день 0: ${ampV(v.cult, 'g')}</div>
<div class="ar">Виявлено збудники, титр КУО/мл: ${ampV(v.bug, 'g')}</div>
<div class="ar">та згідно протоколів лікування призначено: назва лікарського засобу (МНН) ${ampV(v.mnn, 'g')};</div>
<div class="ar">доза ${ampV(v.dose)}; лікарська форма ${ampV(v.form)}; шлях введення ${ampV(v.route)}; кратність ${ampV(v.freq)};</div>
<div class="ar">початок лікування ${ampV(v.start)} ${ampV(v.time)} год; передбачувана тривалість ${ampV(v.days)} діб;</div>
<div class="ar">Перегляд через: ${ampV(v.revH)} год (48, 72), дата перегляду ${ampV(v.rev)}</div>
<div class="ar">Група AWaRe: ${ampOpt(['доступу (A)','спостереження (B)','резерву (C)'], v.grp)} <span class="sm">(для антибактеріальних; підкреслити)</span></div>
<div class="ar">Лікуючий лікар (ПІБ): ${ampV(v.doc, 'g')}</div>
<div class="ar">Підпис: ${ampV('', 'w30')}</div></div>`;
}
function ampD2(v){
  v = v || {};
  const rows = (L, n, cols) => { const a = (L || []).slice(0, n); while (a.length < n) a.push({}); return a.map(r=>'<tr>' + cols.map(c=>`<td>${ampE(r[c])}</td>`).join('') + '</tr>').join(''); };
  return `<div class="ampf d2"><div class="ah"><h2>Форма преавторизації антибактеріальних препаратів групи резерву.</h2><span>Додаток 2</span></div>
<table><tr><td colspan="3"><b>Інформація про пацієнта</b> Дата<sup>1</sup>: ${ampV(v.date)}</td></tr>
<tr><td>Прізвище, ім’я та по батькові (за наявності)<sup>2</sup> ${ampE(v.pib)}</td><td>Вік<sup>3</sup>: ${ampE(v.age)}</td><td>Стать<sup>4</sup>: Ч ${ampBox(v.sex === 'm')} Ж ${ampBox(v.sex === 'f')}</td></tr>
<tr><td>Відділення<sup>5</sup> ${ampE(v.vidd)}</td><td>Палата<sup>6</sup> ${ampE(v.pal)}</td><td>Алергія на АМП<sup>7</sup>: ${ampE(v.alerg)}</td></tr>
<tr><td colspan="3"><b>Показання до антимікробної терапії<sup>8</sup></b> ${ampE(v.ind)}</td></tr></table>
<p class="b">Запит щодо дозволу на застосування антимікробних препаратів групи резерву</p>
<table class="grid"><tr><th>Антибактеріальний препарат<sup>9</sup></th><th>Доза і тривалість призначення<sup>10</sup></th><th>Шлях введення<sup>11</sup></th><th>Кратність введення на добу</th><th>Причина призначення<sup>12</sup></th></tr>${rows(v.req, 3, ['drug','dd','route','freq','why'])}</table>
<p>Чи наявні результати мікробіологічного дослідження з визначенням чутливості? Так ${ampBox(v.micro === 'y')} Ні ${ampBox(v.micro === 'n')} Якщо так, вкажіть деталі<sup>13</sup>:</p>
<table class="grid"><tr><th>Дата:</th><th>Біологічний зразок</th><th>Ідентифікований патоген і результати чутливості</th></tr>${rows(v.mic, 2, ['d','spec','res'])}</table>
<p>Чи отримував пацієнт антимікробний препарат(и) до цього? Так ${ampBox(v.prevYN === 'y')} Ні ${ampBox(v.prevYN === 'n')} Якщо так, деталізуйте нижче<sup>14</sup>:</p>
<table class="grid"><tr><th>Антибіотик(и)</th><th>Доза і тривалість призначення</th><th>Шлях введення</th><th>Кратність введення на добу</th><th>Причина відміни</th></tr>${rows(v.prev, 4, ['drug','dd','route','freq','why'])}</table>
<div class="ar">Прізвище, ім’я та по батькові (за наявності) лікаря/контактний номер<sup>15</sup>: ${ampV(v.doc, 'g')}</div>
<table><tr><td colspan="2"><b>Коментар клінічного провізора<sup>16</sup></b><div class="ln"></div><div class="ln"></div></td></tr>
<tr><td colspan="2"><b>Схвалення</b></td></tr><tr><td>${ampBox(false)} СХВАЛЕНО</td><td>${ampBox(false)} НЕ СХВАЛЕНО</td></tr>
<tr><td colspan="2">Примітки<sup>17</sup>:<div class="ln"></div>Прізвище, ім’я та по батькові (за наявності)/підпис клінічного провізора<sup>18</sup>: ${ampV('', 'w50')} / ${ampV('', 'w30')} Дата<sup>19</sup>: ${ampV('')}</td></tr></table></div>`;
}
function ampD3(v){
  v = v || {};
  return `<div class="ampf d3"><div class="ah"><h2>Протокол консиліуму лікарів</h2><span>Додаток 3</span></div>
<div class="ar">${ampV('')} / ${ampV('', 'w30')} «${ampV('', 'w8')}» ${ampV('', 'w30')} 20${ampV('', 'w8')} року щодо призначення ПЛЗ групи резерву в порядку оскарження рішення ВІК від «${ampV('', 'w8')}» ${ampV('', 'w30')} 20${ampV('', 'w8')} року час: ${ampV('', 'w8')} : ${ampV('', 'w8')}</div>
<div class="ar">КЛІНІЧНИЙ ВИПАДОК: Відділення ${ampV(v.vidd, 'g')}</div>
<div class="ar">Пацієнт (ПІБ): ${ampV(v.pib, 'g')}</div>
<div class="ar">Вік: ${ampV(v.age)} років № медичної карти (історії): ${ampV(v.card, 'g')}</div>
<p class="b">СКЛАД КОНСИЛІУМУ:</p>
<div class="ar">Голова консиліуму (посада, ПІБ): ${ampV('', 'g')}</div>
<div class="ar">Лікуючий лікар (ПІБ): ${ampV(v.doc, 'g')}</div>
<div class="ar">Члени консиліуму (завідуючий відділенням, залучені спеціалісти):</div>
<div class="ar">1. ${ampV(v.zav, 'g')}</div><div class="ar">2. ${ampV('', 'g')}</div><div class="ln"></div>
<p class="b">ПОРЯДОК ДЕННИЙ:</p>
<div class="ar">Розгляд обґрунтованості призначення ПЛЗ групи резерву МНН: ${ampV(v.mnn, 'g')}</div>
<div class="ar">у зв’язку з відмовою лікаря-пульмонолога (координатора з адміністрування АМП) ВІК від «${ampV('', 'w8')}» ${ampV('', 'w30')} 20${ampV('', 'w8')} року.</div>
<p class="b">ОБҐРУНТУВАННЯ ЛІКУЮЧОГО ЛІКАРЯ ТА ЧЛЕНІВ КОНСИЛІУМУ:</p>
<div class="ar">1. Клінічний стан пацієнта на момент огляду: тяжкий / вкрай тяжкий <span class="sm">(необхідне підкреслити)</span> обумовлений ${ampV('', 'g')}</div><div class="ln"></div>
<div class="ar">2. Попередня АБТ (вказати препарати, дози, тривалість) ${ampV(v.prev, 'g')}</div>
<div class="ar">яка виявилася неефективною, що підтверджується (клінічно, лабораторно): ${ampV('', 'g')}</div>
<div class="ar">3. Аргументи проти альтернативної схеми, запропонованої лікарем-пульмонологом (координатором з адміністрування АМП) ВІК:</div>
<div class="ar">${ampBox(false)} Наявність високого ризику резистентності мікроорганізмів (MDRO) за даними локального мікробіологічного моніторингу відділення.</div>
<div class="ar">${ampBox(false)} Клінічна неефективність аналогів нижчої терапевтичної категорії.</div>
<div class="ar">${ampBox(false)} Протипоказання / алергічні реакції у пацієнта, а саме: ${ampV('', 'g')}</div>
<div class="ar">${ampBox(false)} Загроза життю пацієнта (критичний перебіг інфекції, септичний шок).</div>
<p class="b">РІШЕННЯ КОНСИЛІУМУ:</p>
<div class="ar">1. Враховуючи клінічні особливості перебігу захворювання та пряму загрозу життю пацієнта через неефективність попереднього лікування, призначити ПЛЗ групи резерву: МНН препарату: ${ampV(v.mnn)} Разова доза: ${ampV(v.dose)} Кратність: ${ampV(v.freq)} Шлях введення: ${ampV(v.route)} Очікувана тривалість курсу до перегляду (48–72 год): ${ampV('')}</div>
<div class="ar">2. Зобов’язати відділення медичного постачання негайно відпустити зазначений препарат за цим Протоколом під особисту клінічну відповідальність лікуючого лікаря.</div>
<p class="b">ПІДПИСИ ЧЛЕНІВ КОНСИЛІУМУ:</p>
<div class="ar">Голова консиліуму: ${ampV('', 'w30')} / ${ampV('', 'g')}</div>
<div class="ar">Лікуючий лікар: ${ampV('', 'w30')} / ${ampV(v.doc, 'g')}</div>
<div class="ar">Члени консиліуму: ${ampV('', 'w30')} / ${ampV('', 'g')}</div>
<div class="ar">${ampV('', 'w30')} / ${ampV('', 'g')}</div></div>`;
}
function ampD4one(v){
  v = v || {};
  return `<div class="d4b"><div class="ah"><h2>Бланк замовлення на отримання ПЛЗ на складі у головної медичної сестри</h2><span>Додаток 4</span></div>
<div class="ar">Дата «${ampV(v.dd, 'w8')}» ${ampV(v.mm, 'w30')} ${ampV(v.yy, 'w12')} р.</div>
<div class="ar">Відділення ${ampV(v.vidd, 'g')}</div>
<div class="ar">№ «Медичної карти стаціонарного хворого» ${ampV(v.card, 'g')}</div>
<div class="ar">Причина призначення ПЛЗ ${ampV(v.why, 'g')}</div>
<div class="ar">Посилання на джерело призначення ПЛЗ ${ampV(v.src, 'g')}</div>
<div class="ar">Назва ПЛЗ ${ampV(v.mnn, 'g')}</div>
<div class="ar">Доза чи концентрація основної діючої речовини ${ampV(v.dose, 'g')}</div>
<div class="ar">Лікарська форма ПЛЗ ${ampV(v.form, 'g')}</div>
<div class="ar">Кількість одиниць лікарської форми ${ampV(v.qty, 'g')}</div>
<div class="ar">Шлях уведення ПЛЗ ${ampV(v.route, 'g')}</div>
<div class="ar">Передбачувана тривалість АБТ (години, дні, місяці) ${ampV(v.dur, 'g')}</div>
<div class="ar">Дата наступного перегляду призначення ПЛЗ ${ampV(v.rev, 'g')}</div>
<div class="ar">медична сестра відділення ${ampV('', 'g')}</div><div class="sm r">(звання, прізвище, ініціали, підпис)</div>
<div class="ar">лікуючий лікар ${ampV(v.doc, 'g')}</div><div class="sm r">(звання, прізвище, ініціали, підпис)</div></div>`;
}
function ampD4(list){ const a = (list && list.length ? list : [{}, {}]); return `<div class="ampf d4">${a.map(ampD4one).join('<div class="cut"></div>')}</div>`; }
function ampD5(v){
  v = v || {};
  const ab = (v.ab || []).slice(0, 4); while (ab.length < 4) ab.push({});
  const yn = n => `Так ${ampBox(false)}<br>Ні ${ampBox(false)}`;
  return `<div class="ampf d5"><div class="ah"><h2>Форма для проведення ретроспективного аудиту відповідності призначення антимікробних препаратів</h2><span>Додаток 5</span></div>
<table class="grid"><tr><th colspan="3">I. Інформація про пацієнта<sup>1</sup></th></tr>
<tr><td>Дата поступлення: ${ampE(v.postup)}</td><td>Відділення: ${ampE(v.vidd)}</td><td>№ медичної карти: ${ampE(v.card)}</td></tr>
<tr><td>Прізвище, ім’я та по батькові (за наявності): ${ampE(v.pib)}</td><td>Вік: ${ampE(v.age)}</td><td>Стать: Ч ${ampBox(v.sex === 'm')} Ж ${ampBox(v.sex === 'f')}</td></tr></table>
<table class="grid"><tr><th colspan="5">Призначення антибіотиків<sup>2</sup></th></tr><tr><th>Антибіотик</th><th>Доза</th><th>Шлях введення</th><th>Кратність введення на добу</th><th>Дата початку терапії</th></tr>
${ab.map(r=>`<tr><td>${ampE(r.drug)}</td><td>${ampE(r.dose)}</td><td>${ampE(r.route)}</td><td>${ampE(r.freq)}</td><td>${ampE(r.start)}</td></tr>`).join('')}</table>
<table class="grid"><tr><th colspan="5">II. Показання для антибіотикотерапії<sup>3</sup></th></tr>
<tr><td>Профілактика ${ampBox(false)}</td><td>Інфекція сечовивідних шляхів ${ampBox(false)}</td><td>Пневмонія ${ampBox(false)}</td><td>Інфекція ШКТ ${ampBox(false)}</td><td>Інфекція кровотоку ${ampBox(false)}</td></tr>
<tr><td>Інфекція ЦНС ${ampBox(false)}</td><td>Шкірна інфекція ${ampBox(false)}</td><td>Інфекція кісток ${ampBox(false)}</td><td colspan="2">Інше:</td></tr></table>
<table class="grid"><tr><th colspan="3">III. Первинний аналіз антибіотикотерапії</th></tr>
<tr><td>Чи задокументоване показання для призначення антибіотика?<sup>4</sup><br>${yn()}</td><td>Чи призначено антибіотик відповідно до національних чи локальних настанов?<sup>5</sup><br>Так ${ampBox(false)}<br>Ні ${ampBox(false)} Чому ні? Коментар →</td><td>Коментарі<sup>6</sup></td></tr>
<tr><td>Чи коректна доза?<sup>7</sup><br>${yn()}</td><td>Чи коректний шлях введення?<sup>8</sup><br>${yn()}</td><td>Чи коректна тривалість лікування?<sup>9</sup><br>${yn()}</td></tr></table>
<table class="grid"><tr><th colspan="5">IV. Аналіз антибіотикотерапії через 48 годин</th></tr>
<tr><td colspan="5">1. Чи була переглянута антибіотикотерапія?<sup>10</sup> Так ${ampBox(false)} Ні ${ampBox(false)} Якщо так, які дії?</td></tr>
<tr><td>Ескалація ${ampBox(false)}</td><td>Продовження ${ampBox(false)}</td><td>Деескалація ${ampBox(false)}</td><td>Припинення ${ampBox(false)}</td><td>Зміна в/в на per os ${ampBox(false)}</td></tr>
<tr><td colspan="5">2. Чому антибіотикотерапію було продовжено?<sup>11</sup></td></tr>
<tr><td colspan="2">Наявність клінічних ознак інфекції ${ampBox(false)}</td><td>Підтвердження інфекції ${ampBox(false)}</td><td colspan="2">Інше (коментар):</td></tr>
<tr><td colspan="2">3. Чи здійснено забір матеріалу для мікробіологічного дослідження?<sup>12</sup><br>${ampBox(false)} Дата:<br>${ampBox(false)} Ні</td><td>4. Чи отримано результати мікробіологічного дослідження?<sup>13</sup><br>${ampBox(false)} Дата:<br>${ampBox(false)} Ні</td><td colspan="2">5. Чи вплинули на вибір АМП результати мікробіологічного дослідження?<sup>14</sup><br>Коментар:</td></tr>
<tr><td colspan="5">Загальні коментарі/висновок<sup>15</sup>:<div class="ln"></div>Дата<sup>16</sup>: ${ampV('', 'w30')} Прізвище, ім’я та по батькові (за наявності)/Підпис<sup>17</sup> ${ampV('', 'w50')}</td></tr></table></div>`;
}
const AMP_BLANKS = [
  ['amp1', 'СОП: Додаток 1 — обґрунтування призначення ПЛЗ', ()=>ampD1()],
  ['amp2', 'СОП: Додаток 2 — преавторизація групи резерву', ()=>ampD2()],
  ['amp3', 'СОП: Додаток 3 — протокол консиліуму лікарів', ()=>ampD3()],
  ['amp4', 'СОП: Додаток 4 — бланк замовлення ПЛЗ (2 на аркуш)', ()=>ampD4()],
  ['amp5', 'СОП: Додаток 5 — ретроспективний аудит', ()=>ampD5()]
];
/*AMP-TPL-END*/

/* ---------- вмикач СОП ---------- */
const AMP_EDRPOU = '01999448';
function ampOn(){ const s = lsGet('po.ampsop', ''); if (s === '1') return true; if (s === '0') return false; return (mv('edrpou') || '').replace(/\D/g, '') === AMP_EDRPOU; }
try{ if (!FS_SET_KEYS.includes('po.ampsop')) FS_SET_KEYS.push('po.ampsop'); }catch(e){}

/* ---------- вид протимікробного препарату ---------- */
function ampKind(name){
  const n = String(name || '').toLowerCase(), d = drugInfo(name);
  if (/флуконазол|вориконазол|ітраконазол|позаконазол|ізавуконазол|кетоконазол|каспофунгін|мікафунгін|анідулафунгін|амфотерицин|ністатин|натаміцин|тербінафін/.test(n)) return 'af';
  if (/осельтамівір|занамівір|балоксавір|ацикловір|валацикловір|фамцикловір|ганцикловір|валганцикловір|ремдесивір|рибавірин|нірматрелвір|молнупіравір|тенофовір|ентекавір|софосбувір/.test(n)) return 'av';
  if (/альбендазол|мебендазол|празиквантел|пірантел|івермектин|левамізол|хлорохін|гідроксихлорохін|артеметер|мефлохін|атоваквон|ніфуртимокс|орнідазол|тинідазол/.test(n)) return 'ap';
  if (d && d.ab) return 'ab';
  return '';
}
const AMP_KL = {ab:'АБ', af:'АФ', av:'ПВ', ap:'ПП'}, AMP_KT = {ab:'антибактеріальний', af:'антифунгальний', av:'противірусний', ap:'протипаразитарний'};
const AMP_SOP = {ab:'СОП № 214', af:'СОП № 213', av:'СОП № 215', ap:'СОП № 212'};

/* ---------- дані для автозаповнення ---------- */
function ampFv(key, i){ try{ const f = F(key); const x = f && f.inputs && f.inputs[i || 0]; return x ? x.value.trim() : ''; }catch(e){ return ''; } }
function ampLastDiary(id){ try{ for (let k = DIARIES.length - 1; k >= 0; k--){ const f = (DIARIES[k].data && DIARIES[k].data.f) || {}; if (f[id] && String(f[id]).trim()) return String(f[id]).trim(); } }catch(e){} return ''; }
const ampFirst = (...a) => a.find(x=>x && String(x).trim()) || '';
function ampRes(re, tre){
  try{ const L = (RES || []).filter(r=>(tre && tre.test(r.t)) || re.test(r.v)).slice().sort((a,b)=>String(a.d).localeCompare(String(b.d))); return L.length ? L[L.length - 1] : null; }catch(e){ return null; }
}
function ampNum(r, re){ if (!r) return ''; const m = re.exec(r.v); return m ? m[1] : ''; }
function ampData(it){
  const kind = ampKind(it.drug), d = drugInfo(it.drug) || {};
  const ad = (a, b) => a && b ? a + '/' + b : '';
  const st = (()=>{ try{ const a = F('d_main.stan').el.value, b = F('zah.stan').el.value; const i = +(a !== '' ? a : b); return i === 1 ? 0 : i >= 2 ? 1 : -1; }catch(e){ return -1; } })();
  const zak = ampRes(/лейк/i, /^ЗАК$|загальний аналіз крові/i);
  const neuDirect = ampNum(zak, /нейтрофіл[а-яіїєґa-z]*\s*([\d.,]+)/i);
  const pya = ampNum(zak, /п\/я\s*([\d.,]+)/i), sya = ampNum(zak, /с\/я\s*([\d.,]+)/i);
  const neu = neuDirect || (pya && sya ? String(Math.round((parseFloat(pya.replace(',', '.')) + parseFloat(sya.replace(',', '.'))) * 10) / 10).replace('.', ',') : '');
  const crpR = ampRes(/СРБ|C-реактив|С-реактив/i, /С-реактивний білок/i), pctR = ampRes(/прокальцитонін|ПКТ|PCT/i, /прокальцитонін/i);
  const rtg = ampRes(/^$/, /рентген[а-яіїєґa-z]*\s*(ОГК|органів грудної)/i);
  const cultR = ampRes(/^$/, /посів|бактеріолог|бакпосів/i);
  const kk = (()=>{ try{ const k = crclVal(); return isNaN(k) ? '' : String(k); }catch(e){ return ''; } })();
  const revH = it.rev && it.start ? Math.round((new Date(it.rev + 'T00:00') - new Date(it.start + 'T00:00')) / 36e5) : '';
  return {kind, pib:mv('pib'), card:mv('card'), vidd:mv('vidd'), doc:mv('doc'), zav:mv('zav'), age:mv('age'),
    dx:[(()=>{ try{ return val(F('dx.osn'), true); }catch(e){ return ''; } })(), (()=>{ try{ const c = val(F('dx.mkh'), true); return c ? '(' + c + ')' : ''; }catch(e){ return ''; } })()].filter(Boolean).join(' '),
    stan:st,
    t:ampFirst(ampFv('d_obj.t'), ampLastDiary('d_obj_t_0'), ampFv('zah.temp')),
    ad:ampFirst(ad(ampFv('d_obj.ad', 0), ampFv('d_obj.ad', 1)), ad(ampLastDiary('d_obj_ad_0'), ampLastDiary('d_obj_ad_1')), ad(ampFv('ssc.ad', 0), ampFv('ssc.ad', 1))),
    chd:ampFirst(ampFv('d_obj.chd', 0), ampLastDiary('d_obj_chd_0'), ampFv('dyh.chd', 0)),
    spo2:ampFirst(ampFv('d_obj.chd', 1), ampLastDiary('d_obj_chd_1'), ampFv('dyh.chd', 1)),
    o2:ampFirst(ampFv('d_obj.o2', 0), ampLastDiary('d_obj_o2_0')),
    ps:ampFirst(ampFv('d_obj.chss'), ampLastDiary('d_obj_chss_0'), ampFv('ssc.ps'), ampFv('ssc.chss')),
    rtg:rtg ? fmtD(rtg.d) + ': ' + String(rtg.v).slice(0, 90) : '',
    pct:ampNum(pctR, /(?:прокальцитонін|ПКТ|PCT)\s*([\d.,]+)/i) || (pctR && /прокальцитонін/i.test(pctR.t) ? ampNum(pctR, /([\d.,]+)/) : ''),
    crp:ampNum(crpR, /СРБ\s*([\d.,]+)/i),
    wbc:ampNum(zak, /лейк[а-яіїєґa-z]*\.?\s*([\d.,]+)/i), neu, kk,
    cult:cultR ? fmtD(cultR.d) : (it.cult === 'взято' ? 'взято ' + fmtD(it.start) : it.cult || ''),
    bug:cultR ? String(cultR.v).slice(0, 110) : '',
    mnn:it.drug, dose:it.dose, form:'', route:it.route, freq:it.freq, start:fmtD(it.start), time:(String(it.hours || '').match(/\d{1,2}[:.]\d{2}/) || [''])[0],
    days:it.days || '', rev:it.rev ? fmtD(it.rev) : '', revH:revH && revH > 0 ? String(revH) : '',
    grp:{A:0, W:1, R:2}[d.ab] != null ? {A:0, W:1, R:2}[d.ab] : -1,
    ind:it.ind || '', alerg:(()=>{ try{ return val(F('vitae.alerg'), true); }catch(e){ return ''; } })(), sex:(typeof sex !== 'undefined' ? sex : '')};
}

/* ---------- друк ---------- */
function ampPrint(html, n){
  let framed = false; try{ framed = window.top !== window.self; }catch(e){ framed = true; }
  if (framed){ toast('В онлайн-версії друк заблоковано. Відкрийте програму окремою сторінкою або офлайн-файлом', 4000); return false; }
  const P = $('#print'); P.innerHTML = '';
  const d = document.createElement('div'); d.className = 'fbk fbk-amp'; d.innerHTML = html; P.append(d);
  toast((n || 'Документ') + ' заповнено даними пацієнта. Перевірте й допишіть ручкою те, чого немає', 3500);
  window.print(); return true;
}
const ampItem = id => RX.find(x=>String(x.id) === String(id));
function ampPrintD1(it){ return ampPrint(ampD1(ampData(it)), 'Додаток 1'); }
function ampD4Data(it){
  const v = ampData(it), t = todayISO().split('-');
  return {dd:t[2], mm:t[1], yy:t[0], vidd:v.vidd, card:v.card, why:'лікування' + (v.ind || v.dx ? ': ' + (v.ind || v.dx) : ''), src:AMP_SOP[v.kind] || '', mnn:it.drug, dose:it.dose, form:'', qty:'', route:it.route,
    dur:it.days ? it.days + ' дн.' : '', rev:v.rev, doc:v.doc};
}
function ampPrintD4(it){ return ampPrint(ampD4([ampD4Data(it)]), 'Додаток 4'); }
function ampPrintD2(it){
  const v = ampData(it), t = todayISO();
  const prev = RXF().filter(x=>x !== it && ampKind(x.drug) && (x.stop || (rxEnd(x) && rxEnd(x) < t))).map(x=>({drug:x.drug, dd:[x.dose, x.days ? x.days + ' дн.' : ''].filter(Boolean).join(', '), route:x.route, freq:x.freq, why:''}));
  const mic = (RES || []).filter(r=>/посів|бактеріолог|бакпосів/i.test(r.t)).map(r=>({d:fmtD(r.d), spec:'', res:String(r.v).slice(0, 120)}));
  return ampPrint(ampD2({date:fmtD(t), pib:v.pib, age:v.age, sex:v.sex, vidd:v.vidd, pal:'', alerg:v.alerg, ind:v.ind || v.dx,
    req:[{drug:it.drug, dd:[it.dose, it.days ? it.days + ' дн.' : ''].filter(Boolean).join(', '), route:it.route, freq:it.freq, why:v.ind || ''}],
    micro:mic.length ? 'y' : '', mic, prevYN:prev.length ? 'y' : '', prev, doc:v.doc}), 'Додаток 2');
}
function ampPrintD3(it){
  const v = ampData(it), t = todayISO();
  const prev = RXF().filter(x=>x !== it && ampKind(x.drug) === 'ab').map(x=>[x.drug, x.dose, x.days ? x.days + ' дн.' : ''].filter(Boolean).join(' ')).join('; ');
  return ampPrint(ampD3({vidd:v.vidd, pib:v.pib, age:v.age, card:v.card, doc:v.doc, zav:v.zav, mnn:it.drug, dose:it.dose, freq:it.freq, route:it.route, prev}), 'Додаток 3');
}

/* ---------- лист призначень: вид препарату й кнопки Додатків ---------- */
function ampDecorate(){
  if (!ampOn()) return;
  document.querySelectorAll('#rxList .rx[data-id]').forEach(row=>{
    const it = ampItem(row.dataset.id); if (!it) return; const kind = ampKind(it.drug); if (!kind) return;
    const sum = row.firstElementChild;
    if (sum && !sum.querySelector('.ampk')) sum.querySelector('.rxt') && sum.querySelector('.rxt').append(' ', h('span', {class:'badge ampk', title:AMP_KT[kind] + ' лікарський засіб — ' + AMP_SOP[kind]}, AMP_KL[kind]));
    const body = row.querySelector('.rxbody'); if (!body || body.querySelector('.amp-acts')) return;
    const grpR = (drugInfo(it.drug) || {}).ab === 'R';
    const b = (t, fn, title) => h('button', {type:'button', class:'btn', title, onclick:e=>{ e.preventDefault(); const x = ampItem(row.dataset.id); if (x) fn(x); }}, t);
    const box = h('div', {class:'amp-acts'}, h('span', {class:'chips-hint'}, AMP_SOP[kind] + ' закладу:'),
      b('🖨 Обґрунтування (Дод. 1)', ampPrintD1, 'Додаток 1, заповнений даними пацієнта'),
      b('🖨 Замовлення ПЛЗ (Дод. 4)', ampPrintD4, 'Бланк замовлення на отримання ПЛЗ, заповнений'),
      grpR ? b('🖨 Преавторизація (Дод. 2)', ampPrintD2, 'Група резерву: форма преавторизації, заповнена') : '',
      grpR ? b('🖨 Консиліум (Дод. 3)', ampPrintD3, 'Група резерву: протокол консиліуму (оскарження відмови ВІК)') : '');
    const acts = body.querySelector(':scope > .acts2'); if (acts) body.insertBefore(box, acts); else body.append(box);
  });
}
{ const x0 = renderRx; renderRx = function(){ const r = x0.apply(this, arguments); try{ ampDecorate(); }catch(e){} return r; }; }

/* ---------- порожні бланки: Додатки 1–5 (лише коли СОП увімкнено) ---------- */
function ampBlanksSync(){
  try{
    for (let i = FBLANKS.length - 1; i >= 0; i--) if (/^amp\d$/.test(FBLANKS[i].k)) FBLANKS.splice(i, 1);
    if (ampOn()) AMP_BLANKS.forEach(([k, t, f])=>FBLANKS.push({k, t, cls:'fbk fbk-amp', html:f()}));
  }catch(e){}
}
{ const x0 = blanksDialog; blanksDialog = function(){ ampBlanksSync(); return x0.apply(this, arguments); }; }
{ const x0 = printBlanks; printBlanks = function(){ ampBlanksSync(); return x0.apply(this, arguments); }; }

/* ---------- «Налаштування»: вмикач ---------- */
try{
  if (SETTINGS_EL && !document.getElementById('set_ampsop')){
    const cb = h('input', {type:'checkbox', id:'set_ampsop'}); cb.checked = ampOn();
    cb.addEventListener('change', ()=>{ lsSet('po.ampsop', cb.checked ? '1' : '0'); ampBlanksSync(); try{ renderRx(); }catch(e){} toast(cb.checked ? 'СОП закладу з протимікробної терапії увімкнено' : 'СОП закладу з протимікробної терапії вимкнено'); });
    SETTINGS_EL.append(h('h3', {class:'sub'}, 'СОП закладу'), h('div', {class:'grid'},
      h('div', {class:'f wide'}, h('label', {for:'set_ampsop', class:'chk'}, cb, ' СОП закладу: протимікробна терапія (№ 212–215, Додатки 1–5)'),
        h('p', {class:'chips-hint'}, 'Локальні правила КНП «Оржицька лікарня»: обґрунтування, замовлення, преавторизація, консиліум, аудит. Для закладу з кодом ЄДРПОУ ' + AMP_EDRPOU + ' вмикається само; в інших закладах — за бажанням, бо правила можуть відрізнятися.'))));
    try{ setRegroup(); }catch(e){}
  }
}catch(e){}
ampBlanksSync();
try{ renderRx(); }catch(e){}
