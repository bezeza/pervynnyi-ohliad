/* ================= МОЇ ШАБЛОНИ ================= */
function saveCustom(){ try{ localStorage.setItem('po.custom', JSON.stringify(CUSTOM)); return true; }catch(e){ toast('Не вдалося зберегти шаблон: браузер заборонив сховище', 5000); return false; } }
function editableFields(){
  const r = [];
  SECTIONS.forEach(s=>s.fields.forEach(f=>{
    if (f.headOnly || f.type === 'hdr' || f.krit) return;
    if (f.type === 'sel' || f.type === 'multi' || (f.type === 'text' && f.quick)) r.push({key:s.id + '.' + f.id, s, f, label:`${s.title} → ${f.label.replace(/\s*\(.*?\)\s*$/,'')}` + (f.type === 'text' ? ' (готові фрази)' : '')});
  }));
  return r;
}
function addOptionLive(key, text){
  const [sid, fid] = key.split('.'); const sec = SECTIONS.find(x=>x.id===sid); const f = sec && sec.fields.find(x=>x.id===fid); if (!f) return false;
  if (f.type === 'sel'){ if (f.opts.some(o=>O(o).t === text)) return false; f.opts.push(text); f.el.append(h('option', {value:f.opts.length - 1}, g(text))); return true; }
  if (f.type === 'multi'){ if (f.opts.some(o=>O(o).t === text)) return false; f.opts.push(text); f.chips.push(makeChip(f, f.opts.length - 1)); refreshChips(f); return true; }
  if (f.type === 'text'){ if (f.quick.includes(text)) return false; f.quick.push(text); f.quickOrig.push(text); f.qchips.push(makeQuick(f, text)); return true; }
  return false;
}
function removeOptionLive(key, text){
  const [sid, fid] = key.split('.'); const sec = SECTIONS.find(x=>x.id===sid); const f = sec && sec.fields.find(x=>x.id===fid); if (!f) return;
  if (f.type === 'sel'){ const i = f.opts.findIndex(o=>O(o).t === text); const op = f.el.querySelector(`option[value="${i}"]`); if (op && f.el.value !== String(i)) op.remove(); }
  if (f.type === 'multi'){ const i = f.opts.findIndex(o=>O(o).t === text); const c = f.chips[i]; if (c && c.getAttribute('aria-pressed') !== 'true') c.remove(); }
  if (f.type === 'text'){ const i = f.quick.indexOf(text); if (i >= 0 && f.qchips[i]) f.qchips[i].remove(); }
}
function presetFromForm(name, group){
  const p = {key:'u' + Date.now(), group, name, custom:true, hosp:'e', set:{}, skarhy:[], plan:[], rx:[]};
  const pressed = f => f.chips.map((c,i)=>c.getAttribute('aria-pressed') === 'true' ? {t:O(f.opts[i]).t, o:+(c.dataset.ord || 0)} : null).filter(Boolean).sort((a,b)=>a.o - b.o).map(x=>x.t);
  p.skarhy = pressed(F('skarhy.c')); const dt = detCollect(F('skarhy.c')); if (Object.keys(dt).length) p.det = dt;
  SECTIONS.filter(s=>(s.objective || s.id === 'loc') && s.docs.includes('ohl')).forEach(s=>s.fields.forEach(f=>{
    if (s.id === 'loc' && (f.type === 'line' || f.type === 'text') && f.el.value.trim()) p.set[s.id + '.' + f.id] = f.el.value.trim();
    if (f.type === 'sel' && f.el.value !== '' && +f.el.value !== f.norm) p.set[s.id + '.' + f.id] = O(f.opts[+f.el.value]).t;
    if (f.type === 'multi'){ const v = pressed(f); if (v.length) p.set[s.id + '.' + f.id] = v; }
  }));
  p.osn = val(F('dx.osn'), true); p.mkh = val(F('dx.mkh'), true); p.uskl = val(F('dx.uskl'), true);
  p.plan = pressed(F('dx.plan'));
  p.rx = RX.map(it=>[it.drug, it.dose, it.route, it.freq, it.days || '', it.note || '']);
  if (MODE === 'hosp' && F('hosp.vyd').el.value === '1') p.hosp = 'p';
  return p;
}
function tplPanel(){
  const wrap = h('div', {});
  // 1. свої варіанти
  const fs = h('select', {id:'tplField'}); editableFields().forEach(x=>fs.append(h('option', {value:x.key}, x.label)));
  const ti = h('input', {id:'tplText', placeholder:'Текст варіанта так, як він має бути в документі'});
  const add = ()=>{
    const key = fs.value, t = ti.value.trim(); if (!t){ toast('Введіть текст варіанта'); return; }
    if (!addOptionLive(key, t)){ toast('Такий варіант уже є'); return; }
    (CUSTOM.opts[key] = CUSTOM.opts[key] || []).push(t); saveCustom(); ti.value = ''; renderTplLists(); toast('Додано. Варіант з’явився у списку');
  };
  ti.addEventListener('keydown', e=>{ if (e.key === 'Enter'){ e.preventDefault(); add(); } });
  wrap.append(h('div', {class:'pt'},
    h('h3', {}, 'Свій варіант у список'),
    h('p', {class:'chips-hint'}, 'Оберіть поле й впишіть формулювання — воно з’явиться серед варіантів цього поля, у скаргах чи серед готових фраз. Слова, що залежать від статі, можна писати так: [хворий|хвора].'),
    h('div', {class:'grid'}, h('div', {class:'f wide'}, h('label', {for:'tplField'}, 'Поле'), fs), h('div', {class:'f wide'}, h('label', {for:'tplText'}, 'Текст'), ti)),
    h('div', {class:'acts2', style:'margin-top:8px'}, h('button', {type:'button', class:'btn primary', onclick:add}, 'Додати')),
    h('div', {id:'tplOpts', class:'plist'})));
  // 2. своя хвороба
  const nm = h('input', {id:'tplName', placeholder:'напр., Позагоспітальна пневмонія, ускладнена плевритом'});
  const gr = h('select', {id:'tplGroup'}); GROUPS.forEach(([k,l])=>gr.append(h('option', {value:k}, l))); gr.value = 'my';
  wrap.append(h('div', {class:'pt'},
    h('h3', {}, 'Моя хвороба з поточного огляду'),
    h('p', {class:'chips-hint'}, 'Заповніть огляд так, як зазвичай буває при цій хворобі (скарги, зміни при огляді, діагноз, план, призначення), і збережіть як заготовку. Вона з’явиться на вкладці «За хворобою».'),
    h('div', {class:'grid'}, h('div', {class:'f wide'}, h('label', {for:'tplName'}, 'Назва'), nm), h('div', {class:'f'}, h('label', {for:'tplGroup'}, 'Профіль'), gr)),
    h('div', {class:'acts2', style:'margin-top:8px'}, h('button', {type:'button', class:'btn primary', onclick:()=>{
      const n = nm.value.trim(); if (!n){ toast('Введіть назву хвороби'); return; }
      const p = presetFromForm(n, gr.value);
      if (!p.skarhy.length && !p.osn){ toast('Спершу заповніть хоча б скарги або діагноз у первинному огляді'); return; }
      CUSTOM.presets.push(p); saveCustom(); PRESETS.push(p); addCardLive(p); nm.value = ''; renderTplLists();
      toast('Збережено: «' + n + '» у профілі «' + GROUPS.find(x=>x[0]===p.group)[1] + '»');
    }}, 'Зберегти як мою хворобу')),
    h('div', {id:'tplPresets', class:'plist'})));
  // 2б. змінити або сховати наявне
  const ef = h('select', {id:'ovrField'}); editableFields().forEach(x=>ef.append(h('option', {value:x.key}, x.label)));
  const eq = h('input', {type:'search', placeholder:'Пошук у варіантах…', 'aria-label':'Пошук у варіантах'});
  const elist = h('div', {id:'ovrList'}); let ovrAll = false;
  const drawOvr = ()=>{
    const key = ef.value, f = F(key), m = CUSTOM.ovr[key] || {}, hid = new Set(CUSTOM.hid[key] || []), q = eq.value.trim().toLowerCase();
    elist.innerHTML = '';
    const all = f.type === 'text' ? f.quickOrig : f.opts.map(o=>O(o).t);
    let n = 0;
    all.forEach(orig=>{
      const cur = m[orig] || orig; if (q && !cur.toLowerCase().includes(q) && !orig.toLowerCase().includes(q)) return;
      if (++n > (ovrAll || q ? 80 : 10)) return;
      const inp = h('input', {value:cur, 'aria-label':'Текст варіанта'});
      const save = ()=>{ const v = inp.value.trim(); if (v === (m[orig] || orig)) return; setOvr(key, orig, v); drawOvr(); toast(v && v !== orig ? 'Змінено' : 'Повернуто як було'); };
      inp.addEventListener('keydown', e=>{ if (e.key === 'Enter'){ e.preventDefault(); save(); } });
      inp.addEventListener('change', save);
      const hb = h('button', {type:'button', class:'more'}, hid.has(orig) ? 'Показати' : 'Сховати');
      hb.addEventListener('click', ()=>{ setHid(key, orig, !hid.has(orig)); drawOvr(); });
      const rb = h('button', {type:'button', class:'more', title:'Повернути початковий текст'}, '↺');
      rb.hidden = !m[orig]; rb.addEventListener('click', ()=>{ setOvr(key, orig, ''); drawOvr(); });
      elist.append(h('div', {class:'ovr-row' + (hid.has(orig) ? ' hid' : '')}, inp, h('span', {class:'tag'}, m[orig] ? 'змінено' : hid.has(orig) ? 'сховано' : ''), hb, rb));
    });
    const lim = ovrAll || q ? 80 : 10;
    if (n > lim) elist.append(h('div', {class:'acts2', style:'margin-top:6px'}, h('span', {class:'chips-hint'}, `Показано ${lim} з ${n}.`),
      !ovrAll && !q ? h('button', {type:'button', class:'more', onclick:()=>{ ovrAll = true; drawOvr(); }}, 'Показати більше') : h('span', {class:'chips-hint'}, 'Уточніть пошук.')));
    if (!n) elist.append(h('p', {class:'chips-hint'}, 'Нічого не знайдено.'));
  };
  ef.addEventListener('change', ()=>{ ovrAll = false; drawOvr(); }); eq.addEventListener('input', drawOvr);
  wrap.append(h('div', {class:'pt'},
    h('h3', {}, 'Змінити або сховати наявні варіанти'),
    h('p', {class:'chips-hint'}, 'Будь-яке готове формулювання програми можна переписати під себе або сховати те, чим не користуєтесь. Змінений текст піде в документи; заготовки хвороб працюватимуть як і раніше. Кнопка ↺ повертає як було.'),
    h('div', {class:'grid'}, h('div', {class:'f wide'}, h('label', {for:'ovrField'}, 'Поле'), ef), h('div', {class:'f wide'}, eq)),
    elist));
  setTimeout(drawOvr, 0);
  // 3. обмін
  const file = h('input', {type:'file', accept:'.json,application/json', hidden:'', onchange:e=>{ if (e.target.files[0]) importTpl(e.target.files[0]); e.target.value = ''; }});
  wrap.append(h('div', {class:'pt'},
    h('h3', {}, 'Обмін з колегами'),
    h('p', {class:'chips-hint'}, 'Збережіть свої шаблони у файл і передайте колезі. Колега відкриває файл тут же — шаблони додаються до його власних, нічого не стирається. Дані пацієнтів у файл шаблонів не потрапляють.'),
    h('div', {class:'acts2'},
      h('button', {type:'button', class:'btn', onclick:()=>{ if (!Object.keys(CUSTOM.opts).length && !CUSTOM.presets.length && !Object.keys(CUSTOM.ovr).length && !Object.keys(CUSTOM.hid).length && !CUSTOM.diary.length && !(CUSTOM.btns || []).length && !(CUSTOM.rxsets || []).length){ toast('Своїх шаблонів ще немає'); return; } downloadJSON({type:'po-templates', opts:CUSTOM.opts, presets:CUSTOM.presets, ovr:CUSTOM.ovr, hid:CUSTOM.hid, diary:CUSTOM.diary, btns:CUSTOM.btns || [], rxsets:CUSTOM.rxsets || []}, 'shablony.json'); }}, 'Зберегти шаблони у файл'),
      h('button', {type:'button', class:'btn', onclick:()=>file.click()}, 'Відкрити шаблони з файлу'), file)));
  return wrap;
}
function setOvr(key, orig, nt){
  const m = CUSTOM.ovr[key] = CUSTOM.ovr[key] || {};
  if (!nt || nt === orig) delete m[orig]; else m[orig] = nt;
  if (!Object.keys(m).length) delete CUSTOM.ovr[key];
  applyOvr(key); saveCustom(); update();
}
function setHid(key, orig, on){
  let a = (CUSTOM.hid[key] || []).filter(x=>x !== orig); if (on) a.push(orig);
  if (a.length) CUSTOM.hid[key] = a; else delete CUSTOM.hid[key];
  applyOvr(key); saveCustom(); update();
}
function applyOvr(key){
  let f; try{ f = F(key); }catch(e){ return; } if (!f) return;
  const m = CUSTOM.ovr[key] || {}, hid = new Set(CUSTOM.hid[key] || []);
  if (f.type === 'text'){
    if (!f.quickOrig) return;
    f.quickOrig.forEach((q,i)=>{ const nq = m[q] || q; if (f.quick[i] !== nq){ f.quick[i] = nq; const c = makeQuick(f, nq); f.qchips[i].replaceWith(c); f.qchips[i] = c; } f.qchips[i].hidden = hid.has(q); });
    return;
  }
  f.ovr = m; f.hidT = hid;
  if (f.type === 'sel') [...f.el.options].forEach(op=>{ if (op.value === '') return; const t = O(f.opts[+op.value]).t; op.hidden = op.disabled = hid.has(t) && f.el.value !== op.value; });
  if (f.type === 'multi') refreshChips(f);
  refreshLabels();
}
function applyOvrAll(){ new Set([...Object.keys(CUSTOM.ovr), ...Object.keys(CUSTOM.hid)]).forEach(applyOvr); }
function importTpl(file){
  const rd = new FileReader();
  rd.onload = ()=>{
    try{
      const o = JSON.parse(rd.result); if (!o || o.type !== 'po-templates') throw 0;
      let n = 0, m = 0;
      for (const key in (o.opts || {})) (o.opts[key] || []).forEach(t=>{ if (typeof t === 'string' && addOptionLive(key, t)){ (CUSTOM.opts[key] = CUSTOM.opts[key] || []).push(t); n++; } });
      (o.presets || []).forEach(p=>{ if (!p || !p.name || !p.key || PRESETS.some(x=>x.key === p.key)) return; p.custom = true; if (!GROUPS.some(g=>g[0] === p.group)) p.group = 'my'; CUSTOM.presets.push(p); PRESETS.push(p); addCardLive(p); m++; });
      let r = 0;
      for (const key in (o.ovr || {})){ const src = o.ovr[key]; if (!src || typeof src !== 'object') continue; CUSTOM.ovr[key] = Object.assign(CUSTOM.ovr[key] || {}, src); r++; }
      for (const key in (o.hid || {})){ if (Array.isArray(o.hid[key])) CUSTOM.hid[key] = [...new Set([...(CUSTOM.hid[key] || []), ...o.hid[key]])]; }
      (o.diary || []).forEach(t=>{ if (t && t.name && t.v && !CUSTOM.diary.some(x=>x.name === t.name)){ CUSTOM.diary.push(t); r++; } });
      (o.btns || []).forEach(b=>{ if (b && b.sec && b.label && b.text && !(CUSTOM.btns = CUSTOM.btns || []).some(x=>x.sec === b.sec && x.label === b.label)){ CUSTOM.btns.push(b); r++; } });
      (o.rxsets || []).forEach(b=>{ if (b && b.name && Array.isArray(b.rows) && !(CUSTOM.rxsets = CUSTOM.rxsets || []).some(x=>x.name === b.name)){ CUSTOM.rxsets.push(b); r++; } });
      renderMyBtns();
      applyOvrAll(); renderDtpl();
      saveCustom(); renderTplLists(); toast(`Додано варіантів: ${n}, хвороб: ${m}, змін і шаблонів щоденника: ${r}`);
    }catch(e){ toast('Це не файл шаблонів цієї програми або він пошкоджений', 5000); }
  };
  rd.readAsText(file);
}
function renderTplLists(){
  const a = $('#tplOpts'), b = $('#tplPresets'); if (!a) return;
  a.innerHTML = ''; b.innerHTML = '';
  const labels = Object.fromEntries(editableFields().map(x=>[x.key, x.label]));
  const keys = Object.keys(CUSTOM.opts).filter(k=>CUSTOM.opts[k].length);
  if (!keys.length) a.append(h('p', {class:'chips-hint'}, 'Своїх варіантів ще немає.'));
  keys.forEach(k=>CUSTOM.opts[k].forEach(t=>{
    const del = h('button', {type:'button', class:'more'}, 'Видалити');
    del.addEventListener('click', ()=>{ CUSTOM.opts[k] = CUSTOM.opts[k].filter(x=>x !== t); saveCustom(); removeOptionLive(k, t); renderTplLists(); toast('Видалено'); });
    a.append(h('div', {class:'prow'}, h('div', {class:'pn'}, h('b', {}, t), h('span', {}, labels[k] || k)), del));
  }));
  if (!CUSTOM.presets.length) b.append(h('p', {class:'chips-hint'}, 'Своїх хвороб ще немає.'));
  CUSTOM.presets.forEach(p=>{
    const del = h('button', {type:'button', class:'more'}, 'Видалити');
    del.addEventListener('click', ()=>{
      if (!del.dataset.arm){ del.dataset.arm = '1'; del.textContent = 'Точно?'; setTimeout(()=>{ delete del.dataset.arm; del.textContent = 'Видалити'; }, 3000); return; }
      CUSTOM.presets = CUSTOM.presets.filter(x=>x !== p); saveCustom();
      const k = PRESETS.indexOf(p); if (k >= 0){ PRESETS.splice(k, 1); const c = HV.cards.splice(k, 1)[0]; if (c) c.remove(); }
      renderTplLists(); toast('Видалено');
    });
    b.append(h('div', {class:'prow'}, h('div', {class:'pn'}, h('b', {}, p.name), h('span', {}, [GROUPS.find(x=>x[0]===p.group)?.[1], p.mkh, p.skarhy.slice(0,3).join(', ')].filter(Boolean).join(' · '))), del));
  });
}


