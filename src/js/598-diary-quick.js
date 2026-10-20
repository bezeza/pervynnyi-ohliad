/* ===== Щоденник під хворобу (0.9.4): джерело — первинний огляд або хвороба; немає ні того, ні того — форма питає хворобу.
   Під хворобу показуються потрібні пункти «Об’єктивно» (і специфічні: глікемія, маса й діурез, ПШВ), зайві ховаються,
   обов’язкові для щоденного контролю позначені «важливо». ===== */
const DPROF = (()=>{
  const base = ['t','ad','chss','dod','loc'];
  const P = {
    resp:{n:'дихальна система', s:['chd','o2','shk','dyh','serce','fiz']},
    card:{n:'серцево-судинна система', s:['chd','o2','shk','dyh','serce','nab','fiz']},
    endo:{n:'ендокринна система', s:['glik','chd','shk','dyh','serce','nab','fiz']},
    neur:{n:'нервова система', s:['chd','shk','serce','nevr','fiz']},
    abd:{n:'органи травлення', s:['chd','shk','serce','zhyv','fiz']},
    uro:{n:'сечовидільна система', s:['chd','shk','zhyv','nab','fiz']},
    skin:{n:'шкіра, м’які тканини', s:['chd','shk','fiz']},
    vasc:{n:'судини кінцівок', s:['chd','shk','dyh','serce','nab']},
    tr:{n:'травма', s:['chd','shk','fiz']}
  };
  const G = {resp:'pneu copd asthma covid flu arvi bronch sinus tons mono varic otit trib', card:'gh ihd hf af dyslip', endo:'dm hypot', neur:'stroke tia de rad cerv migr bell epi bppv dpn mening tcmt tspine lbp insom anx',
    abd:'gastr app chol panc gib obstr hern perf food hep gerd anem', uro:'pyelo colic cyst', skin:'ery absc twound urtic gout', vasc:'dvt', tr:'tdr thip tank tsprain tclav tdisl'};
  const KEY = {};
  for (const g in G) G[g].split(' ').forEach(k=>{ KEY[k] = g; });
  /* додатково й обов’язкове — за хворобою */
  const ADD = {asthma:['pef'], hf:['masa'], dpn:['glik'], copd:[], stroke:['nevr'], tia:['nevr']};
  const NEED = {pneu:['t','chd'], covid:['chd','o2'], copd:['chd'], asthma:['chd','pef'], flu:['t','chd'], hf:['masa','ad','nab'], gh:['ad'], ihd:['ad','chss'], af:['chss','ad'],
    dm:['glik'], dpn:['glik'], stroke:['ad','nevr'], tia:['ad','nevr'], tcmt:['nevr'], mening:['t','nevr'], app:['t','zhyv'], chol:['t','zhyv'], panc:['zhyv','ad'], gib:['ad','chss'],
    obstr:['zhyv','fiz'], perf:['zhyv'], food:['fiz','ad'], pyelo:['t','fiz'], colic:['fiz'], ery:['t'], absc:['t'], dvt:['nab'], hep:['shk']};
  return {base, P, KEY, ADD, NEED};
})();
let DSHOWALL = false;
function dprofOf(key){
  const g = key && DPROF.KEY[key]; if (!g) return null;
  const p = PRESETS.find(x=>x.key === key);
  return {key, g, name:p ? p.name : '', group:DPROF.P[g].n, show:new Set([...DPROF.base, ...DPROF.P[g].s, ...(DPROF.ADD[key] || [])]), need:new Set(DPROF.NEED[key] || [])};
}
/* поле має дані користувача — не ховаємо, щоб нічого не зникло з тексту */
function dHasData(f){
  if (f.type === 'num') return f.inputs.some(i=>i.value.trim());
  if (f.type === 'sel') return f.el.value !== '' && f.norm !== undefined && +f.el.value !== f.norm;
  if (f.type === 'text' || f.type === 'line') return !!f.el.value.trim();
  return false;
}
function applyDProfile(){
  const S = SECTIONS.find(x=>x.id === 'd_obj'); if (!S) return;
  const prAll = dprofOf(curKey), pr = DSHOWALL ? null : prAll, need = prAll ? prAll.need : new Set();
  const sig = (pr ? pr.key : '-') + (DSHOWALL ? '+' : '') + '|' + S.fields.map(f=>dHasData(f) ? 1 : 0).join('');
  S.fields.forEach(f=>{
    if (!f.wrapEl || f.loc) return;
    const show = f.dprof ? (!!prAll && prAll.show.has(f.id)) || dHasData(f) : !pr || pr.show.has(f.id) || dHasData(f);
    if (!('when0' in f)) f.when0 = f.when || null;
    f.dHide = !show;
    f.when = f.dHide ? ()=>false : f.when0 || undefined;
    if (!f.when) delete f.when;
    f.wrapEl.hidden = f.dHide;
    f.wrapEl.classList.toggle('dneed', need.has(f.id));
  });
  if (applyDProfile.sig !== sig){ applyDProfile.sig = sig; drawDSrc(); }
}

/* ---- блок «Швидкий запис» над шаблонами щоденника ---- */
let DSRC = null, DPICK = false;
const DTOP = ['pneu','copd','asthma','hf','gh','ihd','af','dm','stroke','pyelo','gastr','covid'];
function pickDiaryDisease(key){
  const p = PRESETS.find(x=>x.key === key); if (!p) return;
  curKey = key; DPICK = false; DSHOWALL = false;
  if (!F('dx.osn').el.value.trim()){ F('dx.osn').el.value = p.osn || ''; F('dx.mkh').el.value = p.mkh || ''; }
  if (HV.cards) HV.cards.forEach((c,k)=>c.setAttribute('aria-pressed', PRESETS[k] && PRESETS[k].key === key ? 'true' : 'false'));
  try{ renderHvTips(); }catch(e){}
  applyDProfile.sig = null;
  if (diaryUntouched()) diaryFromExam(0); else { update(); toast('Щоденник підлаштовано під «' + p.name + '»', 2500); }
}
function drawDSrc(){
  if (!DSRC) return;
  const pr = dprofOf(curKey), p = curKey && PRESETS.find(x=>x.key === curKey), ex = examOwn();
  DSRC.innerHTML = '';
  const row = h('div', {class:'dsrc-r'});
  if (p && !DPICK){
    row.append(h('span', {class:'dsrc-l'}, 'Щоденник під хворобу'), h('b', {}, p.name),
      h('span', {class:'chips-hint'}, ex ? 'дані — з первинного огляду' : 'дані — з еталонного шаблону хвороби'),
      h('button', {type:'button', class:'more', onclick:()=>{ DPICK = true; drawDSrc(); }}, 'Змінити'));
    DSRC.append(row);
    if (pr){
      const all = SECTIONS.find(x=>x.id === 'd_obj').fields.filter(f=>f.wrapEl && !f.loc && !f.dprof), hid = all.filter(f=>f.dHide).map(f=>f.label.toLowerCase());
      const nd = [...pr.need].map(id=>F('d_obj.' + id)).filter(Boolean).map(f=>f.label.split(' (')[0].toLowerCase());
      DSRC.append(h('p', {class:'chips-hint dsrc-n'},
        nd.length ? h('span', {}, 'Щодня обов’язково: ', h('b', {}, nd.join(', ')), '. ') : '',
        DSHOWALL ? 'Показано всі пункти. ' : hid.length ? 'Сховано зайве: ' + hid.join(', ') + '. ' : '',
        h('button', {type:'button', class:'more', onclick:()=>{ DSHOWALL = !DSHOWALL; applyDProfile.sig = null; applyDProfile(); update(); }}, DSHOWALL ? 'Лише потрібне' : 'Показати всі пункти')));
    }
    return;
  }
  if (ex && !DPICK){
    row.append(h('span', {class:'dsrc-l'}, 'Щоденник'), h('b', {}, 'з первинного огляду'),
      h('button', {type:'button', class:'more', onclick:()=>{ DPICK = true; drawDSrc(); }}, 'Вказати хворобу — сховати зайве'));
    DSRC.append(row); return;
  }
  /* ні огляду, ні хвороби — питаємо */
  const q = h('input', {type:'search', placeholder:'Пошук хвороби: пневмонія, ХОЗЛ, J44…', 'aria-label':'Пошук хвороби для щоденника', list:'dsrcList'});
  const dl = h('datalist', {id:'dsrcList'}, ...PRESETS.filter(x=>x.key && !x.custom).map(x=>h('option', {value:x.name}, x.mkh || '')));
  const go = () => { const t = q.value.trim().toLowerCase(); if (!t) return; const p1 = PRESETS.find(x=>x.name.toLowerCase() === t) || PRESETS.find(x=>x.name.toLowerCase().includes(t) || (x.mkh || '').toLowerCase().startsWith(t));
    if (p1) pickDiaryDisease(p1.key); else toast('Не знайдено. Спробуйте іншу назву або код МКХ-10'); };
  q.addEventListener('change', go); q.addEventListener('keydown', e=>{ if (e.key === 'Enter'){ e.preventDefault(); go(); } });
  DSRC.append(h('div', {class:'dsrc-ask'},
    h('b', {}, p ? 'Інша хвороба для щоденника' : 'Для якої хвороби щоденник?'),
    h('p', {class:'chips-hint'}, ex ? 'Щоденник лишиться з даних огляду, а пункти «Об’єктивно» підлаштуються під хворобу.' : 'Первинний огляд не заповнено — щоденник заповниться за еталонним шаблоном хвороби, зайві пункти сховаються.'),
    h('div', {class:'chips'}, ...DTOP.map(k=>PRESETS.find(x=>x.key === k)).filter(Boolean).map(x=>h('button', {type:'button', class:'chip q', onclick:()=>pickDiaryDisease(x.key)}, x.name))),
    h('div', {class:'res-form', style:'margin-top:8px'}, q, dl, h('button', {type:'button', class:'btn', onclick:go}, 'Обрати')),
    DPICK ? h('button', {type:'button', class:'more', onclick:()=>{ DPICK = false; drawDSrc(); }}, 'Скасувати') : ''));
}
{
  const tb = SECTIONS.find(x=>x.id === 'd_main').panel.querySelector('.dtpl');
  DSRC = h('div', {class:'dsrc', id:'dsrc'});
  if (tb) tb.prepend(DSRC);
  /* обов’язкові пункти, які ще не внесені, — у підказках щоденника */
  const dh0 = diaryHints;
  diaryHints = function(){
    const L = dh0.apply(this, arguments), pr = dprofOf(curKey);
    if (pr && pr.need.size && DOC === 'shch'){
      const miss = [...pr.need].map(id=>F('d_obj.' + id)).filter(f=>f && !f.dHide && !(f.type === 'num' ? f.inputs.some(i=>i.value.trim()) : f.el.value !== '')).map(f=>f.label.split(' (')[0].toLowerCase());
      if (miss.length) L.unshift('«' + pr.name + '»: щодня внесіть — ' + miss.join(', ') + '.');
    }
    return L.filter(x=>x && (typeof x !== 'string' || x.trim()));
  };
  const up0 = update; update = function(){ try{ applyDProfile(); }catch(e){} return up0.apply(this, arguments); };
  /* перший щоденник без огляду й без хвороби — одразу питаємо хворобу */
  const sd0 = switchDoc; switchDoc = function(k){
    const r = sd0.apply(this, arguments);
    if (k === 'shch' && !DIARIES.length && diaryUntouched() && !examFilled()){ DPICK = false; drawDSrc(); toast('Оберіть хворобу — щоденник заповниться і підлаштується під неї', 3500);
      setTimeout(()=>{ const i = DSRC.querySelector('input'); if (i && !isPhoneW()) i.focus({preventScroll:true}); DSRC.scrollIntoView({block:'nearest'}); }, 60); }
    return r;
  };
  applyDProfile(); drawDSrc();
}
