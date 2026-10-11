/* ===== Набори призначень за спеціальністю: [препарат / призначення, доза, шлях, кратність, днів, примітка] ===== */
const RX_REZ = [['Режим палатний','','','',0,''],['Основний варіант стандартної дієти','','','',0,'або інший варіант дієти за станом']];
const RX_VTE = [['Еноксапарин','40 мг','п/ш','1 р/д',0,'профілактика ВТЕ за оцінкою ризику (Padua / Caprini); КК < 30 — 20 мг']];
const RX_GAST = [['Пантопразол','40 мг','per os','1 р/д',0,'при НПЗП, ГКС чи антикоагулянтах з факторами ризику кровотечі']];
const RX_PAIN = [['Парацетамол','1 г','per os','за потреби',0,'не більше 4 г/добу'],['Ібупрофен','400 мг','per os','3 р/д',5,'після їди; уникати при КК < 30']];
const RX_INF = [['Натрію хлорид 0,9%','500 мл','в/в крапельно','1 р/д',3,'під контролем діурезу й гемодинаміки']];
const RXSETS = {
  ter:[['Режим і дієта', RX_REZ], ['Моніторинг', [['Контроль АТ і ЧСС','','','2 р/д',0,''],['Пульсоксиметрія','','','2 р/д',0,''],['Контроль діурезу','','','щодня',0,'']]],
       ['Профілактика ВТЕ', RX_VTE], ['Гастропротекція', RX_GAST], ['Знеболення', RX_PAIN], ['Інфузійна терапія', RX_INF],
       ['Оксигенотерапія', [['Оксигенотерапія','','інгаляційно','постійно',0,'цільова SpO2 94–98%, при ХОЗЛ — 88–92%']]]],
  nevr:[['Режим і дієта', [['Режим ліжковий','','','',0,'у гострий період, далі — рання активізація'],...RX_REZ.slice(1)]],
       ['Скринінг дисфагії', [['Скринінг ковтання перед першим годуванням','','','одноразово',1,'при порушенні — нічого per os, консультація логопеда']]],
       ['Моніторинг', [['Контроль АТ і ЧСС','','','4 р/д',0,''],['Контроль глюкози крові','','','2 р/д',0,''],['Оцінка неврологічного статусу','','','2 р/д',0,'']]],
       ['Профілактика пролежнів', [['Зміна положення тіла','','','кожні 2 год',0,'протипролежневий матрац']]],
       ['Профілактика ВТЕ', RX_VTE], ['Знеболення', RX_PAIN]],
  hir:[['Голод до огляду хірурга', [['Нічого per os','','','',1,'до огляду хірурга'],['Холод на живіт','','місцево','',0,'за призначенням хірурга']]],
       ['Інфузійна терапія', [['Рінгера лактат','1000 мл','в/в крапельно','1 р/д',1,'під контролем діурезу']]],
       ['Знеболення', [['Кеторолак','30 мг','в/м','2 р/д',3,'не довше 5 днів; після огляду хірурга'],['Парацетамол','1 г','в/в крапельно','за потреби',0,'не більше 4 г/добу']]],
       ['Профілактика ВТЕ', RX_VTE],
       ['Антибіотикопрофілактика', [['Цефазолін','2 г','в/в','одноразово',1,'за 30–60 хв до розрізу']]]],
  inf:[['Режим і ізоляція', [['Режим палатний, ізоляція','','','',0,''],['Посилений питний режим','','per os','',0,'1,5–2 л/добу, якщо немає обмежень']]],
       ['Регідратація', [['Пероральна регідратаційна суміш','200 мл','per os','після кожного рідкого випорожнення',0,'']]],
       ['Жарознижувальні', [['Парацетамол','500 мг','per os','за потреби',0,'при t > 38,5 °C; не більше 4 г/добу']]],
       ['Інфузійна терапія', RX_INF], ['Профілактика ВТЕ', RX_VTE]],
  tr:[['Режим і догляд', [['Режим палатний','','','',0,''],['Підвищене положення кінцівки','','','',0,''],['Холод місцево','','місцево','по 15–20 хв',2,'перші 48 год']]],
       ['Іммобілізація', [['Гіпсова лонгета','','','',0,'контроль кровообігу й чутливості дистальніше'],['Контроль кровообігу і чутливості пальців','','','2 р/д',0,'']]],
       ['Знеболення', [['Кеторолак','30 мг','в/м','2 р/д',3,'не довше 5 днів'],['Парацетамол','1 г','per os','за потреби',0,'не більше 4 г/добу']]],
       ['Профілактика правця', [['Анатоксин правцевий (АП)','0,5 мл','в/м','одноразово',1,'залежно від щеплень']]],
       ['Профілактика ВТЕ', [['Еноксапарин','40 мг','п/ш','1 р/д',0,'при іммобілізації нижньої кінцівки чи переломі стегна — за оцінкою ризику']]],
       ['Перев’язки', [['Перев’язка','','','через день',0,'огляд рани, при потребі частіше']]]]
};
const RXG_L = {ter:'Терапія', nevr:'Неврологія', hir:'Хірургія', inf:'Інфекційні', tr:'Травматологія', my:'Мої набори'};
let RXG = null;
function rxAddSet(rows){
  const have = new Set(RX.map(it=>String(it.drug).toLowerCase())); let n = 0;
  rows.forEach(r=>{ if (have.has(String(r[0]).toLowerCase())) return; addRx({drug:r[0], dose:r[1], route:r[2], freq:r[3], days:r[4] || '', note:r[5]}); n++; });
  renderRx(); update(); toast(n ? `Додано: ${n}. Перевірте дози під пацієнта` : 'Ці призначення вже є в листі');
}
function rxSetsBox(){
  const box = h('div', {class:'pt rxsets', id:'rxSets'});
  const draw = () => {
    box.innerHTML = '';
    if (!RXG){ const p = PRESETS.find(x=>x.key === curKey); RXG = p && RXSETS[p.group] ? p.group : SPEC === 'tr' ? 'tr' : 'ter'; }
    const tabs = h('div', {class:'gtabs', role:'group', 'aria-label':'Спеціальність'});
    Object.keys(RXG_L).forEach(k=>tabs.append(h('button', {type:'button', class:'gtab', 'aria-pressed': k === RXG ? 'true' : 'false', onclick:()=>{ RXG = k; draw(); }}, RXG_L[k])));
    const chips = h('div', {class:'chips'});
    if (RXG === 'my'){
      (CUSTOM.rxsets || []).forEach((st, i)=>{
        const x = h('button', {type:'button', class:'chip-x', title:'Видалити набір', 'aria-label':'Видалити набір ' + st.name}, '×');
        x.addEventListener('click', ()=>{ if (!x.dataset.arm){ x.dataset.arm = '1'; x.textContent = 'точно?'; setTimeout(()=>{ delete x.dataset.arm; x.textContent = '×'; }, 3000); return; } CUSTOM.rxsets.splice(i, 1); saveCustom(); draw(); });
        chips.append(h('span', {class:'chip mytpl'}, h('button', {type:'button', class:'chip-in', onclick:()=>rxAddSet(st.rows)}, st.name + ' · ' + st.rows.length), x));
      });
      const nm = h('input', {placeholder:'Назва набору, напр., «Мій стандарт ГХ»', 'aria-label':'Назва набору', style:'flex:1 1 220px'});
      const save = h('button', {type:'button', class:'btn', onclick:()=>{
        if (!RX.length){ toast('Лист призначень порожній — спершу додайте препарати'); return; }
        const name = nm.value.trim() || 'Набір ' + ((CUSTOM.rxsets || []).length + 1);
        CUSTOM.rxsets = CUSTOM.rxsets || []; CUSTOM.rxsets.push({name, rows:RX.filter(it=>it.drug).map(it=>[it.drug, it.dose, it.route, it.freq, it.days || '', it.note || ''])});
        saveCustom(); toast('Збережено набір «' + name + '»'); draw(); }}, 'Зберегти поточний лист як набір');
      if (!(CUSTOM.rxsets || []).length) chips.append(h('p', {class:'chips-hint'}, 'Своїх наборів ще немає. Заповніть лист призначень і збережіть його як набір — він з’явиться тут.'));
      box.append(h('h3', {}, 'Набори призначень'), tabs, chips, h('div', {class:'res-form', style:'margin-top:8px'}, nm, save));
      return;
    }
    RXSETS[RXG].forEach(([name, rows])=>chips.append(h('button', {type:'button', class:'chip', title:rows.map(r=>[r[0], r[1]].filter(Boolean).join(' ')).join('; '), onclick:()=>rxAddSet(rows)}, '+ ' + name)));
    box.append(h('h3', {}, 'Набори призначень'), tabs, chips, h('p', {class:'chips-hint', style:'margin-top:6px'}, 'Натисніть набір — призначення додадуться в лист (без дублів). Дози типові для дорослих: перевірте під пацієнта. Свої набори — «Мої набори».'));
  };
  box.draw = draw; draw(); return box;
}
/* Інтерфейс листа призначень */
function rxPanel(){
  const wrap = h('div', {});
  wrap.append(
    h('datalist', {id:'drugList'}, ...Object.values(rxLib()).map(d=>h('option', {value:d.n}))),
    h('datalist', {id:'routeList'}, ...ROUTES.map(r=>h('option', {value:r}))),
    h('datalist', {id:'freqList'}, ...FREQS.map(r=>h('option', {value:r}))),
    h('div', {class:'pt rxvarbox', hidden:''}),
    h('div', {id:'rxWarn'}),
    h('div', {id:'rxList', class:'rxlist'}),
    h('div', {class:'acts2', style:'margin-top:10px'},
      h('button', {type:'button', class:'btn primary', onclick:()=>{ addRx({}); renderRx(); update(); const ins = $('#rxList').querySelectorAll('.rx-drug'); if (ins.length) ins[ins.length-1].focus(); }}, '+ Додати препарат'),
      h('button', {type:'button', class:'btn', id:'rxScheme', hidden:'', onclick:addScheme}, '+ Схема для обраної хвороби')),
    h('div', {class:'pt', id:'rxInfo'}),
    h('details', {class:'pt fold', id:'rxSetsFold'}, h('summary', {}, 'Набори за спеціальністю і мої набори'), rxSetsBox()),
    h('p', {class:'src'}, 'Дози — типові для дорослих, як орієнтир. Корекція за кліренсом креатиніну береться з калькулятора Кокрофта–Голта на вкладці «Шкали». Остаточне рішення — за інструкцією до препарату й клінічною ситуацією. Для антибіотиків програма формує обґрунтування за наказом МОЗ від 09.09.2026 № 1328.'));
  return wrap;
}
function addScheme(){
  const p = PRESETS.find(x=>x.key === curKey);
  if (!p){ toast('Спершу оберіть хворобу на вкладці «За хворобою»'); return; }
  if (!rxFor(p).length){ toast(MODE === 'amb' && RXA[p.key] ? 'Амбулаторної схеми немає: при цій хворобі показане лікування в стаціонарі' : 'Для цієї хвороби немає типової схеми'); return; }
  const have = new Set(RX.map(it=>it.drug.toLowerCase()));
  let n = 0;
  rxFor(p).forEach(r=>{ if (have.has(r[0].toLowerCase())) return; addRx({drug:r[0], dose:r[1], route:r[2], freq:r[3], days:r[4] || '', note:r[5]}); n++; });
  renderRx(); update(); toast(n ? `Додано препаратів: ${n}. Перевірте дози під пацієнта` : 'Схема вже в листі призначень');
}
function renderRx(){
  const info = $('#rxInfo'), list = $('#rxList'); if (!list) return;
  const k = crclVal(), p = PRESETS.find(x=>x.key === curKey);
  info.innerHTML = ''; const infoOpen = info.dataset.open === '1' || (!isNaN(k) && k < 60);
  const kk = h('details', {class:'fold', open:infoOpen ? '' : null, ontoggle:e=>{ info.dataset.open = e.target.open ? '1' : ''; }}, h('summary', {}, 'Нирки: кліренс креатиніну для корекції доз')); info.append(kk);
  const infoAppend = info.append.bind(info); info.append = (...a)=>kk.append(...a);
  info.append(h('h3', {}, 'Пацієнт', h('span', {class:'badge ' + (isNaN(k) ? 'warn' : k >= 60 ? 'ok' : k >= 30 ? 'warn' : 'bad'), title:'Кліренс креатиніну за Кокрофтом–Голтом — для корекції доз'}, isNaN(k) ? 'Кліренс креатиніну не розраховано' : 'Кліренс креатиніну ' + k + ' мл/хв')));
  if (isNaN(k)){
    const miss = ['age','wt','cr'].filter(x=>!has(pv(x)));
    info.append(h('p', {class:'chips-hint'}, 'Кліренс креатиніну (КК) потрібен, щоб програма підказувала, яким препаратам зменшити дозу при слабкій роботі нирок. ' +
      'Бракує: ' + [...miss.map(x=>({age:'вік', wt:'вага', cr:'креатинін'})[x]), ...(sex ? [] : ['стать (кнопки «Чоловік / Жінка» вгорі)'])].join(', ') + '. Впишіть тут:'));
    const row = h('div', {class:'res-form'});
    miss.forEach(x=>{
      const lab = {age:['Вік','років'], wt:['Вага','кг'], cr:['Креатинін','мкмоль/л']}[x];
      const inp = h('input', {inputmode:'decimal', placeholder:lab[0], 'aria-label':lab[0], style:'width:110px'});
      inp.addEventListener('change', ()=>{ const t = document.getElementById('pt_' + x); if (t){ t.value = inp.value; t.dispatchEvent(new Event('input')); } runCalcs(); renderRx(); update(); });
      row.append(h('span', {style:'display:inline-flex;align-items:center;gap:5px'}, inp, h('span', {class:'u'}, lab[1])));
    });
    if (miss.length) info.append(row);
  }
  info.append = infoAppend;
  const RW = rxWarnings(), rw = $('#rxWarn'); rw.innerHTML = '';
  if (RW.length) rw.append(h('div', {class:'warnbox rxw'}, h('b', {}, 'Перевірте поєднання та алергію'), h('ul', {}, ...RW.map(w=>h('li', {class:w.c}, w.t)))));
  if (p && p.tips) info.append(h('details', {class:'fold'}, h('summary', {}, 'Підказки: ' + p.name), h('div', {class:'tips'}, h('ul', {}, ...p.tips.map(t=>h('li', {}, t))))));
  list.innerHTML = '';
  if (!RX.length){ list.append(h('p', {class:'chips-hint'}, 'Призначень ще немає. Додайте препарат або схему для обраної хвороби.')); return; }
  RX.forEach(it=>{
    const set = (key, ev) => e => { it[key] = e.target.value; if (key === 'start' && isAB(it) && !it.revTouched) it.rev = addDays(it.start, 2); if (key === 'rev') it.revTouched = true; if (ev) renderRx(); update(); };
    const inp = (key, attrs, label, ev, cls) => h('div', {class:'f' + (cls ? ' ' + cls : '')}, h('label', {}, label), h('input', Object.assign({value:it[key] || '', oninput:set(key, false), onchange:ev ? set(key, true) : null}, attrs)));
    const pickDrug = v => { it.drug = v; it.lastPick = v; const ok = drugDefaults(it, v); renderRx(); update();
      if (ok){ const c = [...document.querySelectorAll('#rxList .rx')][RX.indexOf(it)]; const di = c && c.querySelector('.rx-dose'); if (di) di.focus(); toast('Підставлено стандартну дозу — змініть за потреби', 2000); } };
    const drug = h('input', {class:'rx-drug', list:'drugList', value:it.drug, placeholder:'Почніть вводити назву',
      oninput:e=>{ it.drug = e.target.value; if ((e.inputType === 'insertReplacementText' || e.inputType === undefined) && libInfo(e.target.value)) pickDrug(e.target.value); else update(); },
      onchange:e=>{ if (e.target.value !== it.lastPick){ it.lastPick = e.target.value; pickDrug(e.target.value); } }});
    const rm = h('button', {type:'button', class:'more'}, 'Видалити');
    rm.addEventListener('click', ()=>{ if (!rm.dataset.arm){ rm.dataset.arm = '1'; rm.textContent = 'Точно?'; setTimeout(()=>{ delete rm.dataset.arm; rm.textContent = 'Видалити'; }, 3000); return; } RX = RX.filter(x=>x !== it); renderRx(); update(); });
    const stop = h('button', {type:'button', class:'more', onclick:()=>{ it.stop = it.stop ? '' : todayISO(); renderRx(); update(); }}, it.stop ? 'Відновити' : 'Відмінити з ' + fmtS(todayISO()));
    const d = drugInfo(it.drug), warn = renalMsg(it), L = libInfo(it.drug);
    const card = h('div', {class:'rx' + (it.stop ? ' off' : '')},
      h('div', {class:'rx-g'},
        h('div', {class:'f rx-w rx-drug-f'}, h('label', {}, 'Препарат'), drug),
        inp('dose', {placeholder:'доза', class:'rx-dose', list:'dl_d_' + it.id}, 'Доза'),
        inp('route', {list:L && L.routes.length ? 'dl_r_' + it.id : 'routeList', placeholder:'шлях'}, 'Шлях', false, 'rx-w'),
        inp('freq', {list:L && L.freqs.length ? 'dl_f_' + it.id : 'freqList', placeholder:'кратність'}, 'Кратність'),
        h('datalist', {id:'dl_d_' + it.id}, ...(L ? L.doses : []).map(v=>h('option', {value:v}))),
        h('datalist', {id:'dl_r_' + it.id}, ...(L ? [...L.routes, ...ROUTES.filter(r=>!L.routes.includes(r))] : []).map(v=>h('option', {value:v}))),
        h('datalist', {id:'dl_f_' + it.id}, ...(L ? [...L.freqs, ...FREQS.filter(r=>!L.freqs.includes(r))] : []).map(v=>h('option', {value:v}))),
        inp('start', {type:'date'}, 'З дати', true, 'rx-w'),
        inp('days', {type:'number', min:'0', inputmode:'numeric', placeholder:'—'}, 'Днів', true),
        h('div', {class:'f rx-w4'}, h('label', {}, 'Примітка'), h('input', {value:it.note || '', oninput:set('note', false), placeholder:'напр., після їди'}))),
      warn ? h('p', {class:'rx-warn'}, '⚠ ' + warn) : '',
      d && d.ab ? h('div', {class:'rx-ab'},
        h('span', {class:'badge ' + (d.ab === 'A' ? 'ok' : d.ab === 'W' ? 'warn' : 'bad')}, 'AWaRe: ' + AWARE[d.ab]),
        h('div', {class:'rx-g'},
          h('div', {class:'f rx-w3'}, h('label', {}, 'Показання (діагноз або підозра)'), h('input', {value:it.ind || '', placeholder:val(F('dx.osn'), true) || 'напр., негоспітальна пневмонія', oninput:set('ind', false)})),
          h('div', {class:'f rx-w'}, h('label', {}, 'Бакпосів до початку'), (()=>{ const s = h('select', {onchange:set('cult', false)}, h('option', {value:''}, '— не вказано —'), ...['взято','не взято','не показаний'].map(o=>h('option', {}, o))); s.value = it.cult || ''; return s; })()),
          (()=>{ const x = inp('rev', {type:'date'}, 'Перегляд (48–72 год)'); x.classList.add('rx-w'); return x; })())) : '',
      h('div', {class:'acts2'}, stop, rm, rxEnd(it) ? h('span', {class:'chips-hint'}, 'до ' + fmtD(rxEnd(it))) : ''));
    list.append(card);
  });
}

PRESETS.forEach(p=>{ if (RXS[p.key]) p.rx = RXS[p.key]; if (TIPS[p.key]) p.tips = TIPS[p.key]; });


