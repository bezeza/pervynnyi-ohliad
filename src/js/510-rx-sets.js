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
    { const p = PRESETS.find(x=>x.key === curKey), own = p && RXSETS[p.group] ? [p.group] : (SPEC_GROUPS[SPEC] || ['ter']).filter(k=>RXSETS[k]);
      Object.keys(RXG_L).forEach(k=>{ const vis = box.dataset.all === '1' || own.includes(k) || k === 'my' || k === RXG;
        if (vis) tabs.append(h('button', {type:'button', class:'gtab', 'aria-pressed': k === RXG ? 'true' : 'false', onclick:()=>{ RXG = k; draw(); }}, RXG_L[k])); });
      tabs.append(h('button', {type:'button', class:'gtab gmore', onclick:()=>{ box.dataset.all = box.dataset.all === '1' ? '' : '1'; draw(); }}, box.dataset.all === '1' ? 'Менше ▴' : 'Інші ▾')); }
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
/* Стрічка «Призначено» і підказки процедур / дієти за хворобою */
function renderRxStrip(){
  const b = $('#rxStrip'); if (!b) return; const t = todayISO();
  const act = RXF().filter(it=>!(it.stop && it.stop <= t) && !(rxEnd(it) && rxEnd(it) < t));
  b.hidden = !act.length; if (!act.length) return;
  const one = it => [it.drug, it.dose, it.route, it.freq].filter(Boolean).join(' ');
  const g = k => act.filter(it=>k.includes(rxKind(it)));
  b.innerHTML = '';
  b.append(h('b', {}, `Призначено (${act.length}): `), g(['drug']).map(one).join('; ') || '—',
    g(['reg','diet']).length ? h('span', {class:'rxs-g'}, ' · Режим, дієта: ' + g(['reg','diet']).map(it=>it.drug).join('; ')) : '',
    g(['man','phys','loc']).length ? h('span', {class:'rxs-g'}, ' · Процедури: ' + g(['man','phys','loc']).map(it=>it.drug).join('; ')) : '');
}
function renderRxSuggest(){
  const b = $('#rxSuggest'); if (!b) return; b.innerHTML = '';
  const dl = $('#rxAddList'); if (dl && !dl.childElementCount) dl.append(...Object.values(rxLib()).map(d=>h('option', {value:d.n})), ...PROCS.map(p=>h('option', {value:p[0]}, RXKINDS[p[1]])), ...DIETS.map(x=>h('option', {value:x}, 'Дієта')));
  if (!curKey) return;
  const have = new Set(RX.map(it=>String(it.drug).toLowerCase()));
  const pr = (PROC_FOR[curKey] || []).filter(n=>!have.has(n.toLowerCase())), dt = DIET_FOR[curKey], hasDiet = RX.some(it=>rxKind(it) === 'diet');
  if (!pr.length && (!dt || hasDiet)) return;
  b.append(h('div', {class:'chips rxsug'}, h('span', {class:'chips-hint'}, 'Часто при цій хворобі:'),
    ...pr.map(n=>h('button', {type:'button', class:'chip', onclick:()=>{ const it = addItemByName(n); it._open = false; renderRx(); update(); }}, '+ ' + n)),
    dt && !hasDiet ? h('button', {type:'button', class:'chip', onclick:()=>{ const it = addItemByName(dt); it._open = false; renderRx(); update(); }}, '+ ' + dt) : ''));
}
/* Інтерфейс листа призначень */
function rxPanel(){
  const wrap = h('div', {});
  wrap.append(
    h('datalist', {id:'drugList'}, ...Object.values(rxLib()).map(d=>h('option', {value:d.n}))),
    h('datalist', {id:'routeList'}, ...ROUTES.map(r=>h('option', {value:r}))),
    h('datalist', {id:'freqList'}, ...FREQS.map(r=>h('option', {value:r}))),
    h('div', {class:'rxstrip', id:'rxStrip', hidden:''}),
    h('div', {class:'pt rxvarbox', hidden:''}),
    h('div', {id:'rxWarn'}),
    h('datalist', {id:'rxAddList'}),
    h('div', {class:'rxadd'}, (()=>{ const a = h('input', {id:'rxAdd', list:'rxAddList', placeholder:'+ Додати препарат, процедуру або дієту…', 'aria-label':'Додати призначення', autocomplete:'off'});
        const go = () => { const v = a.value.trim(); if (!v) return; addItemByName(v); a.value = ''; renderRx(); update(); };
        a.addEventListener('input', e=>{ if ((e.inputType === 'insertReplacementText' || e.inputType === undefined) && document.querySelector(`#rxAddList option[value="${CSS.escape(a.value)}"]`)) go(); });
        a.addEventListener('keydown', e=>{ if (e.key === 'Enter'){ e.preventDefault(); go(); } });
        return a; })(),
      h('button', {type:'button', class:'btn', onclick:()=>{ const a = $('#rxAdd'); if (a.value.trim()){ addItemByName(a.value); a.value = ''; } else { const it = addRx({}); it._open = true; } renderRx(); update(); const ins = $('#rxList').querySelectorAll('.rx-drug'); if (ins.length) ins[ins.length-1].focus(); }}, '＋ Додати')),
    h('div', {id:'rxSuggest'}),
    h('div', {id:'rxList', class:'rxlist'}),
    h('div', {class:'acts2', style:'margin-top:10px'},
      h('button', {type:'button', class:'btn', onclick:()=>{ const it = addRx({}); it._open = true; renderRx(); update(); const ins = $('#rxList').querySelectorAll('.rx-drug'); if (ins.length) ins[ins.length-1].focus(); }}, '+ Порожній рядок'),
      h('button', {type:'button', class:'btn', id:'rxScheme', hidden:'', onclick:addScheme}, '+ Схема для обраної хвороби'),
      h('button', {type:'button', class:'btn', title:'Таблиця для медсестри, як паперовий бланк: дні, рядки «Лікар / Сестра»', onclick:f0034Preview}, '🖨 Листок призначень (ф. 003-4/о)')),
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
  renderRxStrip(); renderRxSuggest();
  list.innerHTML = '';
  if (!RX.length){ list.append(h('p', {class:'chips-hint'}, 'Призначень ще немає. Оберіть схему вище, наберіть назву в полі «+ Додати…» або візьміть набір за спеціальністю внизу.')); return; }
  const today = todayISO();
  RX.forEach(it=>{
    const kind = rxKind(it), isDrug = kind === 'drug', simple = kind === 'reg' || kind === 'diet';
    const set = (key, ev) => e => { it[key] = e.target.value; if (key === 'start' && isAB(it) && !it.revTouched) it.rev = addDays(it.start, 2); if (key === 'rev') it.revTouched = true; if (ev) renderRx(); update(); renderRxStrip(); };
    const inp = (key, attrs, label, ev, cls) => h('div', {class:'f' + (cls ? ' ' + cls : '')}, h('label', {}, label), h('input', Object.assign({value:it[key] || '', oninput:set(key, false), onchange:ev ? set(key, true) : null}, attrs)));
    const pickDrug = v => { it.drug = v; it.lastPick = v; const p = PROC_MAP[String(v).trim().toLowerCase()];
      if (p){ it.kind = p[1]; if (!it.freq) it.freq = p[2]; if (!it.note) it.note = p[3]; it.dose = ''; it.route = ''; renderRx(); update(); return; }
      if (DIETS.includes(String(v).trim())){ it.kind = 'diet'; renderRx(); update(); return; }
      const ok = drugDefaults(it, v); renderRx(); update();
      if (ok){ const c = document.querySelector(`#rxList .rx[data-id="${it.id}"] .rx-dose`); if (c) c.focus(); toast('Підставлено стандартну дозу — змініть за потреби', 2000); } };
    const drug = h('input', {class:'rx-drug', list:'rxAddList', value:it.drug, placeholder:'Почніть вводити назву',
      oninput:e=>{ it.drug = e.target.value; if ((e.inputType === 'insertReplacementText' || e.inputType === undefined) && (libInfo(e.target.value) || PROC_MAP[e.target.value.trim().toLowerCase()])) pickDrug(e.target.value); else { update(); renderRxStrip(); } },
      onchange:e=>{ if (e.target.value !== it.lastPick){ it.lastPick = e.target.value; pickDrug(e.target.value); } }});
    const rm = h('button', {type:'button', class:'more'}, 'Видалити');
    rm.addEventListener('click', ()=>{ if (!rm.dataset.arm){ rm.dataset.arm = '1'; rm.textContent = 'Точно?'; setTimeout(()=>{ delete rm.dataset.arm; rm.textContent = 'Видалити'; }, 3000); return; } RX = RX.filter(x=>x !== it); renderRx(); update(); });
    const stop = h('button', {type:'button', class:'btn', onclick:()=>{ it.stop = it.stop ? '' : today; it._open = false; renderRx(); update(); toast(it.stop ? 'Відмінено з ' + fmtS(today) : 'Відновлено', 1600); }}, it.stop ? 'Відновити' : 'Відмінити з ' + fmtS(today));
    const chg = isDrug && !it.stop ? h('button', {type:'button', class:'btn', title:'Стара доза закривається сьогоднішньою датою, нова починається з сьогодні', onclick:()=>{ const n = rxChangeDose(it); renderRx(); update(); const c = document.querySelector(`#rxList .rx[data-id="${n.id}"] .rx-dose`); if (c){ c.focus(); c.select(); } toast('Нова доза — з ' + fmtS(today) + '. Вкажіть її', 2500); }}, 'Змінити дозу з ' + fmtS(today)) : '';
    const d = drugInfo(it.drug), warn = renalMsg(it), L = libInfo(it.drug);
    // одиниці дози: кнопка замінює одиницю після числа
    const UNITS = ['мг','г','мкг','мл','ОД','МО','%','крап.','таб.','капс.','інгал.','впорск.'];
    const curU = (String(it.dose || '').match(/^\s*[\d.,/–-]+\s*(.+)$/) || [])[1] || '';
    const units = isDrug ? h('select', {class:'rx-unit', 'aria-label':'Одиниця дози', title:'Одиниця дози', onchange:e=>{ const u = e.target.value; if (!u) return; const m = String(it.dose || '').match(/^\s*([\d.,/–-]+)/); it.dose = (m ? m[1] : (it.dose || '').trim()) + ' ' + u; renderRx(); update(); const c = document.querySelector(`#rxList .rx[data-id="${it.id}"] .rx-dose`); if (c) c.focus(); }},
      h('option', {value:''}, UNITS.includes(curU) ? curU : 'од.'), ...UNITS.filter(u=>u !== curU).map(u=>h('option', {value:u}, u))) : '';
    const srcSel = h('select', {onchange:set('src', false)}, ...Object.entries(SRC_L).map(([k,l])=>h('option', {value:k}, l))); srcSel.value = it.src || '';
    const kindSel = h('select', {onchange:e=>{ it.kind = e.target.value; renderRx(); update(); }}, ...Object.entries(RXKINDS).map(([k,l])=>h('option', {value:k}, l))); kindSel.value = kind;
    const end = rxEnd(it), status = it.stop ? 'відмінено ' + fmtS(it.stop) : end ? 'до ' + fmtS(end) : '';
    const sum = h('button', {type:'button', class:'rxsum', 'aria-expanded':it._open ? 'true' : 'false', onclick:()=>{ it._open = !it._open; renderRx(); }},
      h('span', {class:'rxk', title:RXKINDS[kind]}, RXK_ICON[kind]),
      h('span', {class:'rxt'}, h('b', {}, it.drug || 'Новий рядок'), [it.dose, it.route, it.freq].filter(Boolean).length ? ' ' + [it.dose, it.route, it.freq].filter(Boolean).join(' ') : '', it.hours ? ' · о ' + it.hours : ''),
      h('span', {class:'rxm'}, it.days ? it.days + ' дн. · ' : '', 'з ' + fmtS(it.start), status ? ' · ' + status : '', it.src ? h('span', {class:'badge'}, it.src === 'pat' ? SRCAB.pat : SRCAB.dep) : '', warn ? h('span', {class:'badge bad', title:warn}, 'нирки') : ''),
      h('span', {class:'rxdd', 'aria-hidden':'true'}, it._open ? '▴' : '▾'));
    const body = h('div', {class:'rxbody', hidden:it._open ? null : ''},
      h('div', {class:'rx-g'},
        h('div', {class:'f rx-w rx-drug-f'}, h('label', {}, isDrug ? 'Препарат' : RXKINDS[kind]), drug),
        simple ? '' : h('div', {class:'f rx-dosef'}, h('label', {}, 'Доза'), h('div', {class:'rx-dosew'}, h('input', {value:it.dose || '', class:'rx-dose', list:'dl_d_' + it.id, placeholder:isDrug ? 'доза' : '—', oninput:set('dose', false)}), units || '')),   /* одиниця — поруч із дозою */
        simple || !isDrug ? '' : inp('route', {list:L && L.routes.length ? 'dl_r_' + it.id : 'routeList', placeholder:'шлях'}, 'Шлях', false, 'rx-w'),
        simple ? '' : inp('freq', {list:L && L.freqs.length ? 'dl_f_' + it.id : 'freqList', placeholder:'кратність'}, 'Кратність'),
        simple ? '' : inp('hours', {placeholder:'напр., 8:00, 20:00'}, 'Години (необов’язково)'),
        h('datalist', {id:'dl_d_' + it.id}, ...(L ? L.doses : []).map(v=>h('option', {value:v}))),
        h('datalist', {id:'dl_r_' + it.id}, ...(L ? [...L.routes, ...ROUTES.filter(r=>!L.routes.includes(r))] : []).map(v=>h('option', {value:v}))),
        h('datalist', {id:'dl_f_' + it.id}, ...(L ? [...L.freqs, ...FREQS.filter(r=>!L.freqs.includes(r))] : []).map(v=>h('option', {value:v}))),
        inp('start', {type:'date'}, 'З дати', true, 'rx-w'),
        inp('days', {type:'number', min:'0', inputmode:'numeric', placeholder:'—'}, 'Днів', true),
        isDrug ? h('div', {class:'f'}, h('label', {}, 'Звідки'), srcSel) : '',
        h('div', {class:'f'}, h('label', {}, 'Тип'), kindSel),
        h('div', {class:'f rx-w4'}, h('label', {}, 'Примітка'), h('input', {value:it.note || '', oninput:set('note', false), placeholder:'напр., після їди'}))),
      warn ? h('p', {class:'rx-warn'}, '⚠ ' + warn) : '',
      d && d.ab ? h('div', {class:'rx-ab'},
        h('span', {class:'badge ' + (d.ab === 'A' ? 'ok' : d.ab === 'W' ? 'warn' : 'bad')}, 'AWaRe: ' + AWARE[d.ab]),
        h('div', {class:'rx-g'},
          h('div', {class:'f rx-w3'}, h('label', {}, 'Показання (діагноз або підозра)'), h('input', {value:it.ind || '', placeholder:val(F('dx.osn'), true) || 'напр., негоспітальна пневмонія', oninput:set('ind', false)})),
          h('div', {class:'f rx-w'}, h('label', {}, 'Бакпосів до початку'), (()=>{ const s = h('select', {onchange:set('cult', false)}, h('option', {value:''}, '— не вказано —'), ...['взято','не взято','не показаний'].map(o=>h('option', {}, o))); s.value = it.cult || ''; return s; })()),
          (()=>{ const x = inp('rev', {type:'date'}, 'Перегляд (48–72 год)'); x.classList.add('rx-w'); return x; })())) : '',
      h('div', {class:'acts2'}, chg, stop, rm));
    list.append(h('div', {class:'rx rxc' + (it.stop ? ' off' : '') + (it._open ? ' open' : ''), 'data-id':String(it.id), 'data-kind':kind}, sum, body));
  });
}

PRESETS.forEach(p=>{ if (RXS[p.key]) p.rx = RXS[p.key]; if (TIPS[p.key]) p.tips = TIPS[p.key]; });


