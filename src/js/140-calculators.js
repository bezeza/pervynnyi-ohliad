/* ================= КАЛЬКУЛЯТОРИ ================= */
const PT = [ // спільні дані пацієнта
  {k:'age', l:'Вік, років', ok:[16,110], from:['meta_age']},
  {k:'wt',  l:'Вага, кг', ok:[25,300], from:['zah_hw_1']},
  {k:'cr',  l:'Креатинін, мкмоль/л', ok:[20,2000]},
  {k:'ur',  l:'Сечовина, ммоль/л', ok:[1,80]},
  {k:'hb',  l:'Гемоглобін, г/л', ok:[30,220]},
  {k:'t',   l:'Температура, °C', ok:[33,43], from:['zah_temp_0','d_obj_t_0']},
  {k:'rr',  l:'ЧД, за хв', ok:[4,70], from:['dyh_chd_0','d_obj_chd_0']},
  {k:'spo', l:'SpO2, %', ok:[50,100], from:['dyh_chd_1','d_obj_chd_1']},
  {k:'sbp', l:'САТ, мм рт. ст.', ok:[40,300], from:['ssc_ad_0','d_obj_ad_0']},
  {k:'dbp', l:'ДАТ, мм рт. ст.', ok:[20,180], from:['ssc_ad_1','d_obj_ad_1']},
  {k:'hr',  l:'ЧСС, уд./хв', ok:[20,250], from:['ssc_chss_0','ssc_ps_0','d_obj_chss_0']}
];
const srcIds = p => DOC === 'shch' ? [...(p.from || [])].sort((a,b)=>(b.startsWith('d_') ? 1 : 0) - (a.startsWith('d_') ? 1 : 0)) : (p.from || []);
const pv = k => {
  const e = document.getElementById('pt_' + k); if (!e) return NaN;
  if (e.value.trim() !== '') return num(e.value);
  const p = PT.find(x=>x.k===k);   // якщо в калькуляторі порожньо — беремо з огляду
  for (const id of srcIds(p)){ const src = document.getElementById(id); if (src && src.value.trim()) return num(src.value); }
  return NaN;
};
const has = x => !isNaN(x);
const r1 = x => dec(Math.round(x * 10) / 10);
const missing = (keys) => keys.filter(k=>!has(pv(k))).map(k=>PT.find(p=>p.k===k).l.split(',')[0].toLowerCase());

const CALCS = [
{ id:'ckd', title:'ШКФ (CKD-EPI 2021)', desc:'Швидкість клубочкової фільтрації за креатиніном. Потрібні вік, стать, креатинін.',
  run(){
    const m = missing(['age','cr']); if (m.length) return {msg:'Введіть: ' + m.join(', ')};
    if (!sex) return {msg:'Оберіть стать вгорі сторінки'};
    const f = sex === 'f', scr = pv('cr') / 88.4, k = f ? 0.7 : 0.9, a = f ? -0.241 : -0.302;
    const e = Math.round(142 * (Math.min(scr/k, 1) ** a) * (Math.max(scr/k, 1) ** (-1.2)) * (0.9938 ** pv('age')) * (f ? 1.012 : 1));
    const st = e>=90?'G1':e>=60?'G2':e>=45?'G3a':e>=30?'G3b':e>=15?'G4':'G5';
    const tx = {G1:'нормальна або підвищена',G2:'незначно знижена',G3a:'помірно знижена',G3b:'суттєво знижена',G4:'різко знижена',G5:'ниркова недостатність'}[st];
    return {score:e + ' мл/хв', lvl:e>=60?'ok':e>=30?'warn':'bad', text:`Стадія ${st}: ${tx}. Значення ШКФ має сенс для стадіювання ХХН лише при стабільному креатиніні.`,
      line:`ШКФ (CKD-EPI 2021) ${e} мл/хв/1,73 м² (${st})`};
  }},
{ id:'cg', title:'Кліренс креатиніну (Кокрофт–Голт)', desc:'Для корекції доз препаратів (антикоагулянти, антибіотики). Потрібні вік, вага, стать, креатинін.',
  run(){
    const m = missing(['age','wt','cr']); if (m.length) return {msg:'Введіть: ' + m.join(', ')};
    if (!sex) return {msg:'Оберіть стать вгорі сторінки'};
    const c = Math.round((140 - pv('age')) * pv('wt') / (72 * pv('cr') / 88.4) * (sex === 'f' ? 0.85 : 1));
    return {score:c + ' мл/хв', lvl:c>=60?'ok':c>=30?'warn':'bad',
      text:c<15?'Нижче 15 мл/хв: більшість препаратів потребує відміни або спеціального дозування.':c<30?'15–29 мл/хв: обов’язкова корекція доз багатьох препаратів.':c<60?'30–59 мл/хв: перевірте потребу в корекції доз.':'Корекція доз за функцією нирок зазвичай не потрібна.',
      line:`Кліренс креатиніну (Кокрофт–Голт) ${c} мл/хв`};
  }},
{ id:'cha', title:'CHA₂DS₂-VA (фібриляція передсердь)', desc:'Ризик інсульту при ФП, без урахування статі (ESC 2024). Вік береться з даних пацієнта.',
  items:[['chf','Серцева недостатність або ФВ ЛШ ≤ 40%',1],['htn','Артеріальна гіпертензія',1],['dm','Цукровий діабет',1],
         ['str','Інсульт, ТІА або тромбоемболія в анамнезі',2],['vas','Судинне захворювання (ІМ, атеросклероз периферичних артерій, бляшки аорти)',1]],
  run(c){
    if (!has(pv('age'))) return {msg:'Введіть вік'};
    const a = pv('age'), s = c.sum() + (a >= 75 ? 2 : a >= 65 ? 1 : 0);
    return {score:s + ' б.', lvl:s===0?'ok':s===1?'warn':'bad',
      text:s===0?'Антикоагулянти не показані.':s===1?'Слід розглянути пероральні антикоагулянти.':'Рекомендовані пероральні антикоагулянти (за відсутності протипоказань).',
      line:`CHA2DS2-VA ${s} б.`};
  }},
{ id:'hb', title:'HAS-BLED (ризик кровотечі)', desc:'Ризик великої кровотечі на антикоагулянтах. Вік > 65 береться з даних пацієнта.',
  items:[['h','Неконтрольована АГ (САТ > 160 мм рт. ст.)',1],['ren','Порушення функції нирок (діаліз, трансплантація, креатинін > 200 мкмоль/л)',1],
         ['liv','Порушення функції печінки (цироз, білірубін > 2 норм, АЛТ/АСТ > 3 норм)',1],['st','Інсульт в анамнезі',1],
         ['bl','Кровотеча в анамнезі або схильність до кровотеч',1],['inr','Лабільне МНВ (на варфарині)',1],
         ['dr','Антиагреганти або НПЗП',1],['alc','Алкоголь ≥ 8 доз на тиждень',1]],
  run(c){
    if (!has(pv('age'))) return {msg:'Введіть вік'};
    const s = c.sum() + (pv('age') > 65 ? 1 : 0);
    return {score:s + ' б.', lvl:s>=3?'bad':s===2?'warn':'ok',
      text:s>=3?'Високий ризик кровотечі: усуньте модифіковані фактори, частіший контроль. Сам по собі не є причиною відмовитись від антикоагулянтів.':'Низький або помірний ризик кровотечі.',
      line:`HAS-BLED ${s} б.`};
  }},
{ id:'curb', title:'CURB-65 (пневмонія)', desc:'Тяжкість негоспітальної пневмонії. Показники беруться з даних пацієнта.',
  items:[['conf','Порушення свідомості (сплутаність)',1]],
  run(c){
    const m = missing(['age','ur','rr','sbp','dbp']); if (m.length) return {msg:'Введіть: ' + m.join(', ')};
    const s = c.sum() + (pv('ur') > 7 ? 1 : 0) + (pv('rr') >= 30 ? 1 : 0) + (pv('sbp') < 90 || pv('dbp') <= 60 ? 1 : 0) + (pv('age') >= 65 ? 1 : 0);
    return {score:s + ' б.', lvl:s<=1?'ok':s===2?'warn':'bad',
      text:s<=1?'Низький ризик летальності: можливе амбулаторне лікування.':s===2?'Помірний ризик: показана госпіталізація.':'Тяжка пневмонія: розгляньте госпіталізацію у ВАІТ.',
      line:`CURB-65 ${s} б.`};
  }},
{ id:'news', title:'NEWS2 (раннє попередження погіршення)', desc:'Для моніторингу стану у відділенні. Показники беруться з даних пацієнта.',
  items:[['o2','Отримує кисень',2]],
  sel:[['avpu','Свідомість',[['Ясна',0],['Нова сплутаність / реагує на голос / на біль / не реагує',3]]]],
  run(c){
    const m = missing(['rr','spo','sbp','hr','t']); if (m.length) return {msg:'Введіть: ' + m.join(', ')};
    const avpu = c.selv('avpu'); if (avpu === null) return {msg:'Оберіть рівень свідомості'};
    const rr=pv('rr'), sp=pv('spo'), sb=pv('sbp'), hr=pv('hr'), t=pv('t');
    const p = [
      rr<=8?3:rr<=11?1:rr<=20?0:rr<=24?2:3,
      sp<=91?3:sp<=93?2:sp<=95?1:0,
      sb<=90?3:sb<=100?2:sb<=110?1:sb<=219?0:3,
      hr<=40?3:hr<=50?1:hr<=90?0:hr<=110?1:hr<=130?2:3,
      t<=35?3:t<=36?1:t<=38?0:t<=39?1:2,
      avpu, c.sum()];
    const s = p.reduce((a,b)=>a+b,0), three = p.some(x=>x===3);
    return {score:s + ' б.', lvl:s>=7?'bad':s>=5||three?'warn':'ok',
      text:s>=7?'Високий ризик: екстрений огляд, розгляньте переведення у ВАІТ, постійний моніторинг.':s>=5?'Середній ризик: невідкладний огляд лікарем, моніторинг щогодини.':three?'Один параметр 3 бали: невідкладний огляд лікарем.':s>=1?'Низький ризик: моніторинг кожні 4–6 годин.':'Моніторинг кожні 12 годин.',
      line:`NEWS2 ${s} б.`};
  }},
{ id:'gcs', title:'Шкала коми Глазго', desc:'Оцінка рівня свідомості.',
  sel:[['e','Відкривання очей',[['Спонтанне',4],['На звернення',3],['На біль',2],['Відсутнє',1]]],
       ['v','Мовна реакція',[['Орієнтована',5],['Сплутана',4],['Окремі слова',3],['Незрозумілі звуки',2],['Відсутня',1]]],
       ['m','Рухова реакція',[['Виконує команди',6],['Локалізує біль',5],['Відсмикує кінцівку на біль',4],['Патологічне згинання',3],['Патологічне розгинання',2],['Відсутня',1]]]],
  run(c){
    const e=c.selv('e'), v=c.selv('v'), m=c.selv('m'); if (e===null||v===null||m===null) return {msg:'Оберіть усі три показники'};
    const s = e+v+m;
    const tx = s===15?'Свідомість ясна':s>=13?'Помірне оглушення':s>=11?'Глибоке оглушення':s>=8?'Сопор':s>=6?'Помірна кома':s>=4?'Глибока кома':'Позамежна кома';
    return {score:s + ' б.', lvl:s===15?'ok':s>=13?'warn':'bad', text:tx + '.', line:`Шкала коми Глазго ${s} б. (E${e}V${v}M${m}), ${tx.toLowerCase()}`};
  }},
{ id:'wells', title:'Wells (тромбоз глибоких вен)', desc:'Клінічна ймовірність ТГВ нижніх кінцівок.',
  items:[['ca','Активний онкологічний процес',1],['par','Параліч, парез або гіпсова іммобілізація ноги',1],['bed','Ліжковий режим > 3 діб або велика операція протягом 12 тижнів',1],
         ['tend','Локальна болючість по ходу глибоких вен',1],['leg','Набряк усієї ноги',1],['calf','Окружність гомілки більша на ≥ 3 см, ніж на здоровій нозі',1],
         ['pit','Набряк з ямкою на ураженій нозі',1],['col','Колатеральні поверхневі (не варикозні) вени',1],['prev','ТГВ в анамнезі',1],
         ['alt','Альтернативний діагноз так само або більш імовірний',-2]],
  run(c){
    const s = c.sum();
    return {score:s + ' б.', lvl:s>=2?'bad':'ok',
      text:s>=2?'ТГВ імовірний: показане УЗД вен нижніх кінцівок.':'ТГВ малоймовірний: визначте D-димер; негативний результат дозволяє виключити ТГВ.',
      line:`Шкала Wells для ТГВ ${s} б. (${s>=2?'ТГВ імовірний':'ТГВ малоймовірний'})`};
  }},
{ id:'gbs', title:'Глазго–Блетчфорд (кровотеча з верхніх відділів ШКТ)', desc:'Потреба у втручанні при кровотечі. Сечовина, Hb, САТ, ЧСС — з даних пацієнта.',
  items:[['mel','Мелена',1],['syn','Синкопе',2],['liv','Захворювання печінки',2],['hf','Серцева недостатність',2]],
  run(c){
    const m = missing(['ur','hb','sbp','hr']); if (m.length) return {msg:'Введіть: ' + m.join(', ')};
    if (!sex) return {msg:'Оберіть стать вгорі сторінки'};
    const u=pv('ur'), hb=pv('hb'), sb=pv('sbp');
    let s = c.sum();
    s += u>=25?6:u>=10?4:u>=8?3:u>=6.5?2:0;
    s += sex==='m' ? (hb<100?6:hb<120?3:hb<130?1:0) : (hb<100?6:hb<120?1:0);
    s += sb<90?3:sb<100?2:sb<110?1:0;
    s += pv('hr')>=100?1:0;
    return {score:s + ' б.', lvl:s<=1?'ok':s<7?'warn':'bad',
      text:s<=1?'Низький ризик: можливе амбулаторне ведення.':s<7?'Показана госпіталізація та ФГДС.':'Високий ризик потреби в гемотрансфузії або ендоскопічному гемостазі.',
      line:`Шкала Глазго–Блетчфорд ${s} б.`};
  }}
];

function buildCalcPanel(){
  const wrap = h('div', {});
  wrap.append(h('p', {class:'lead'}, 'Дані пацієнта вводяться один раз і використовуються в усіх шкалах. Показники з огляду (t°, ЧД, SpO2, АТ, ЧСС, вага) підставляються самі. Кнопка «Додати в текст» записує результат у розділ діагнозу.'));
  const pt = h('div', {class:'pt'});
  const sync = h('button', {type:'button', class:'btn', onclick:()=>{ syncFromForm(true); update(); toast('Показники взято з огляду'); }}, 'Оновити з огляду');
  pt.append(h('h3', {}, 'Дані пацієнта', sync));
  const g2 = h('div', {class:'ptg'});
  PT.forEach(p=>{
    const id = 'pt_' + p.k;
    const inp = h('input', {id, inputmode:'decimal', oninput:()=>{
      const x = num(inp.value); inp.classList.toggle('bad', inp.value.trim() !== '' && (isNaN(x) || x < p.ok[0] || x > p.ok[1])); update(); }});
    g2.append(h('div', {class:'f'}, h('label', {for:id}, p.l), inp));
  });
  pt.append(g2, h('p', {class:'note', style:'margin-top:8px'}, 'Стать — з перемикача «Чоловік / Жінка» вгорі.'));
  wrap.append(pt);
  const list = h('div', {class:'calcs'});
  CALCS.forEach(c=>{
    const badge = h('span', {class:'badge'}, '—');
    const body = h('div', {class:'cb'}, h('p', {class:'desc'}, c.desc));
    c.boxes = (c.items||[]).map(([k,l,pts])=>{
      const cb = h('input', {type:'checkbox', id:`c_${c.id}_${k}`, onchange:update});
      body.append(h('label', {class:'chk', for:cb.id}, cb, h('span', {}, `${l} (${pts > 0 ? '+' : ''}${pts})`)));
      return [cb, pts];
    });
    c.sels = {};
    (c.sel||[]).forEach(([k,l,opts])=>{
      const id = `c_${c.id}_${k}`;
      const s = h('select', {id, onchange:update}, h('option', {value:''}, '— оберіть —'));
      opts.forEach(([ol,pts])=>s.append(h('option', {value:pts}, `${ol} (${pts})`)));
      c.sels[k] = s;
      body.append(h('div', {class:'f'}, h('label', {for:id}, l), s));
    });
    c.sum = () => c.boxes.reduce((a,[cb,pts])=>a + (cb.checked ? pts : 0), 0);
    c.selv = k => c.sels[k].value === '' ? null : +c.sels[k].value;
    const txt = h('p', {});
    const add = h('button', {type:'button', class:'btn primary', onclick:()=>{
      const r = c.run(c); if (!r.line) { toast(r.msg); return; }
      const f = DOC === 'shch' ? F('d_lik.obs') : F('dx.kal'); const old = f.el.value.trim();
      const ln = end(r.line);
      f.el.value = old ? end(old) + ' ' + ln : ln;
      update(); toast(DOC === 'shch' ? 'Додано в щоденник (результати обстежень)' : 'Додано в розділ діагнозу');
    }}, 'Додати в текст');
    body.append(h('div', {class:'cres'}, txt, add));
    c.badge = badge; c.txt = txt; c.add = add;
    list.append(h('details', {class:'calc', id:'calc_' + c.id}, h('summary', {}, h('span', {}, c.title), h('span', {class:'sm'}, badge)), body));
  });
  wrap.append(list);
  return wrap;
}

function runCalcs(){
  for (const c of CALCS){
    if (!c.badge) continue;
    const r = c.run(c); c.last = r;
    if (r.msg){ c.badge.textContent = '—'; c.badge.className = 'badge'; c.txt.textContent = r.msg; c.add.disabled = true; }
    else { c.badge.textContent = r.score; c.badge.className = 'badge ' + r.lvl; c.txt.textContent = r.text; c.add.disabled = false; }
  }
}

function syncFromForm(force){
  PT.forEach(p=>{
    if (!p.from) return;
    const e = document.getElementById('pt_' + p.k); if (!e || (!force && e.value.trim())) return;
    for (const id of srcIds(p)){ const src = document.getElementById(id); if (src && src.value.trim()){ e.value = src.value.trim(); return; } }
  });
}


