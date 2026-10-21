/* ===== Профілі (0.9.3): спеціальність × місце роботи → свої хвороби першими, свої системи розгорнуті, решта — рядком «б/о» ===== */
const PROFS = {
  ter:  {n:'Терапевт', ic:'🩺', d:'терапія, кардіологія, гастро', spec:'ter', g:['ter'], open:['zah','dyh','ssc','trav','sech']},
  hir:  {n:'Хірург', ic:'🔪', d:'гостра й планова хірургія, амбулаторні операції', spec:'ter', g:['hir','tr'], open:['zah','trav'], loc:true, docs:['zgoda']},
  tr:   {n:'Травматолог', ic:'🦴', d:'травми, Status localis, гіпс', spec:'tr', g:['tr','hir'], open:['zah']},
  nevr: {n:'Невролог', ic:'🧠', d:'інсульт, радикулопатії, шкали', spec:'ter', g:['nevr'], open:['zah','nevr']},
  inf:  {n:'Інфекціоніст', ic:'🦠', d:'ГРВІ, кишкові, епіданамнез', spec:'ter', g:['inf'], open:['zah','shk','dyh','trav']},
  fam:  {n:'Сімейний лікар', ic:'🏠', d:'ICPC-2, скринінги, ЕЛН', spec:'fam', g:['fam','ter','inf'], open:['zah','shk','dyh','ssc','trav','sech','nevr'], work:'amb'},
  pulm: {n:'Пульмонолог', ic:'🫁', d:'ХОЗЛ, астма, пневмонія', spec:'ter', g:['ter'], open:['zah','dyh','ssc'], first:['pneu','copd','asthma','bronch'], tag:'частина — у плані'},
  anest:{n:'Анестезіолог', ic:'💉', d:'передопераційний огляд (ф. 003-3/о), протокол знеболення', spec:'ter', g:['ter'], open:['zah','dyh','ssc'], docs:['anes']}
};
const WORKS = {hosp:['Стаціонар','огляд при надходженні, щоденники, епікризи, критерії госпіталізації'], amb:['Поліклініка / кабінет','прийом, ЕЛН, направлення, амбулаторні маніпуляції'], both:['І там, і там','перемикач «Стаціонар / Амбулаторно» лишається в шапці']};
const SYS_IDS = ['zah','shk','dyh','ssc','trav','sech','nevr'];
const SYS_NAMES = {zah:'загальний стан', shk:'шкіра, зів, лімфовузли', dyh:'дихання', ssc:'серце', trav:'травлення', sech:'сечова', nevr:'неврологія'};
let PROF = null; try{ PROF = JSON.parse(lsGet('po.prof', 'null')); if (PROF && !PROFS[PROF.p]) PROF = null; }catch(e){ PROF = null; }
let SYSOPEN = lsGet('po.sysopen', '0') === '1';   // «Інші системи» розгорнуто
const DOC0 = {hosp:DOCLIST.hosp.slice(), amb:DOCLIST.amb.slice()}, MORE0 = {hosp:DOCMORE.hosp.slice(), amb:DOCMORE.amb.slice()}, SG0 = Object.assign({}, SPEC_GROUPS);
const profNow = () => PROF && PROFS[PROF.p];

/* вкладки: згорнути «чужі» системи в один рядок, сховати непотрібне */
const sysFoldBtn = h('button', {type:'button', class:'tab tfold', title:'Системи, яких немає у вашому профілі. У тексті — як заповнено («Норма всюди» ставить норму)'});
sysFoldBtn.onclick = () => { SYSOPEN = !SYSOPEN; lsSet('po.sysopen', SYSOPEN ? '1' : '0'); layoutTabs(); renderTabNav(); };
{ const lt0 = layoutTabs;
  layoutTabs = function(){
    const P = profNow(); let folded = 0;
    TABS.forEach(t=>{ if (t._pf){ t.tab.hidden = false; t._pf = false; } });   // повернути сховане профілем; далі — заново
    if (P){
      const L = SECTIONS.find(x=>x.id === 'loc');
      if (L && L.tab){ if (P.loc && L.docs.includes(DOC) && !(quickHide() && !QT.includes('loc'))){ if (L.tab.hidden){ L.tab.hidden = false; L._pl = true; } } L.tab.firstChild.textContent = P.loc ? 'St. localis' : (L.short || 'Травма'); }
      TABS.forEach(t=>{
        if (!t.tab || t.tab.hidden) return;
        if (SYS_IDS.includes(t.id) && !P.open.includes(t.id)){ folded++; if (!SYSOPEN){ t.tab.hidden = true; t._pf = true; } }
        if ((t.id === 'scr' || t.id === 'ctrl') && PROF.p !== 'fam'){ t.tab.hidden = true; t._pf = true; }
      });
    }
    const r = lt0.apply(this, arguments);
    sysFoldBtn.remove();
    if (P && folded){
      sysFoldBtn.textContent = SYSOPEN ? 'Згорнути інші ▴' : `Інші системи · б/о ▸`;
      sysFoldBtn.setAttribute('aria-expanded', SYSOPEN ? 'true' : 'false');
      const z = TABS.find(t=>t.id === 'zah'); const grp = z && z.tab.closest('.tgrp');
      const lastExam = grp ? [...grp.querySelectorAll('.tab')].filter(x=>!x.hidden).pop() : null;
      if (lastExam) lastExam.after(sysFoldBtn);
    }
    return r;
  }; }

function applyProfile(quiet){
  const P = profNow();
  // група хвороб і базова «спеціальність» програми
  Object.keys(SG0).forEach(k=>{ SPEC_GROUPS[k] = SG0[k].slice(); });
  if (P){
    if (SPEC !== P.spec){ SPEC = P.spec; lsSet('po.spec', SPEC); const ss = $('#set_spec'); if (ss) ss.value = SPEC; }
    SPEC_GROUPS[SPEC] = P.g.slice(); curGroup = P.g[0];
    const w = PROF.w || P.work || 'both';
    if (w !== 'both' && MODE !== w){ MODE = w; lsSet('po.mode', MODE); applyMode(); }
    $('#modeSeg').hidden = w !== 'both';
  } else $('#modeSeg').hidden = false;
  // документи на видному місці
  ['hosp','amb'].forEach(m=>{ DOCLIST[m] = DOC0[m].slice(); DOCMORE[m] = MORE0[m].slice();
    ((P && P.docs) || []).forEach(k=>{ const i = DOCMORE[m].findIndex(d=>d[0] === k); if (i >= 0){ DOCLIST[m].push([k, k === 'zgoda' ? 'Згода' : k === 'anes' ? 'Анестезіолог' : DOCMORE[m][i][1]]); DOCMORE[m].splice(i, 1); } }); });
  // порядок карток: «свої» першими
  if (HV.cardBox && HV.cards){ const first = (P && P.first) || []; const idx = c => { const k = PRESETS[HV.cards.indexOf(c)].key, f = first.indexOf(k); return f >= 0 ? f - 1000 : HV.cards.indexOf(c); };
    [...HV.cards].sort((a,b)=>idx(a) - idx(b)).forEach(c=>HV.cardBox.append(c)); }
  if (HV.filter) HV.filter();
  applyDoc(true); syncLoc(true);
  renderProfBtn();
  if (!quiet && P) toast(`Профіль: ${P.n.toLowerCase()} · ${WORKS[PROF.w || 'both'][0].toLowerCase()}`, 2200);
}

/* кнопка профілю в шапці */
const profBtn = h('button', {type:'button', class:'btn profbtn', id:'profBtn', title:'Профіль: спеціальність і місце роботи', onclick:()=>profileDialog(false)});
$('#modeSeg').before(profBtn);
function renderProfBtn(){
  const P = profNow(); profBtn.innerHTML = '';
  if (!P){ profBtn.append(h('span', {'aria-hidden':'true'}, '👤'), h('span', {class:'pl'}, ' Профіль ▾')); return; }
  const w = PROF.w || P.work || 'both';
  profBtn.append(h('span', {'aria-hidden':'true'}, P.ic), h('span', {class:'pl'}, ' ' + P.n), h('span', {class:'pw'}, ' · ' + {hosp:'стаціонар', amb:'поліклініка', both:'стаціонар + поліклініка'}[w]), h('span', {class:'pl'}, ' ▾'));
}

/* майстер профілю */
function profileDialog(first){
  if (document.querySelector('.profdlg')) return;
  let p = PROF ? PROF.p : null, w = PROF ? (PROF.w || 'both') : 'both';
  const cards = h('div', {class:'pgrid'}), works = h('div', {class:'pwork'}), prev = h('div', {class:'pprev'});
  const draw = () => {
    cards.innerHTML = ''; works.innerHTML = '';
    Object.keys(PROFS).forEach(k=>{ const P = PROFS[k];
      cards.append(h('button', {type:'button', class:'pcard', 'aria-pressed':p === k ? 'true' : 'false', onclick:()=>{ p = k; if (P.work) w = P.work; draw(); }},
        h('span', {class:'pic', 'aria-hidden':'true'}, P.ic), h('b', {}, P.n), h('span', {}, P.d), P.tag ? h('span', {class:'ptag'}, P.tag) : '')); });
    Object.keys(WORKS).forEach(k=>works.append(h('button', {type:'button', class:'pcard', 'aria-pressed':w === k ? 'true' : 'false', onclick:()=>{ w = k; draw(); }}, h('b', {}, WORKS[k][0]), h('span', {}, WORKS[k][1]))));
    prev.innerHTML = '';
    const P = p && PROFS[p];
    if (!P){ prev.append(h('h4', {}, 'Що зміниться'), h('p', {class:'chips-hint'}, 'Оберіть спеціальність — тут з’явиться, що буде на видному місці, а що згорнеться.')); return; }
    const gname = k => (GROUPS.find(x=>x[0] === k) || [k, k])[1];
    const fold = SYS_IDS.filter(s=>!P.open.includes(s)).map(s=>SYS_NAMES[s]);
    const li = (c, t) => h('li', {}, h('span', {class:'pm ' + c}, c === 'y' ? '✓' : c === 'f' ? '≡' : '—'), h('span', {}, t));
    prev.append(h('h4', {}, 'Що ви побачите — ' + P.n.toLowerCase()),
      h('div', {class:'pk'}, 'Хвороби першими'), h('ul', {}, li('y', P.g.map(gname).join(', ') + (P.first ? ' (ХОЗЛ, астма, пневмонія — на початку)' : '')), li('n', 'решта — в «Інші профілі»')),
      h('div', {class:'pk'}, 'Огляд'), h('ul', {}, li('y', 'розгорнуто: ' + P.open.map(s=>SYS_NAMES[s]).join(', ') + (P.loc ? ', Status localis' : '')), fold.length ? li('f', 'одним рядком «Інші системи · б/о»: ' + fold.join(', ')) : li('y', 'усі системи розгорнуті')),
      h('div', {class:'pk'}, 'Документи'), h('ul', {}, li('y', 'огляд · щоденник · призначення · ' + (w === 'amb' ? 'консультація' : 'епікриз') + (P.docs ? ' · згода' : '')), li('n', 'решта — в «Інші документи»')),
      p !== 'fam' ? h('div', {}, h('div', {class:'pk'}, 'Сховано'), h('ul', {}, li('n', 'профілактика і скринінги, контроль хронічних хвороб'))) : '',
      h('p', {class:'pnote'}, 'Нічого не видаляється: сховане відкривається одним клацанням, пошук Ctrl+K знаходить усе.'));
  };
  const close = () => { dlg.remove(); lsSet('po.profask', '1'); };
  const done = () => { if (!p){ toast('Оберіть спеціальність'); return; } PROF = {p, w}; lsSet('po.prof', JSON.stringify(PROF)); close(); applyProfile(false); if (first) show(TABS.indexOf(HV)); };
  const skip = () => { PROF = null; try{ localStorage.removeItem('po.prof'); }catch(e){} close(); applyProfile(true); toast('Показується все — профіль можна обрати кнопкою в шапці', 3000); };
  const dlg = h('div', {class:'navsheet packsheet profdlg', role:'dialog', 'aria-modal':'true', 'aria-label':'Профіль'},
    h('div', {class:'nvbox pbox'},
      h('div', {class:'pmain'},
        h('h3', {}, first ? 'Налаштуймо програму під вашу роботу' : 'Профіль'),
        h('p', {class:'chips-hint'}, 'Два питання — і зайве сховається. Змінити можна будь-коли: кнопка профілю в шапці або «Налаштування».'),
        h('div', {class:'pstep'}, '1 · Ваша спеціальність'), cards,
        h('div', {class:'pstep'}, '2 · Де працюєте'), works,
        h('div', {class:'pfoot'}, h('button', {type:'button', class:'btn', onclick:skip}, PROF ? 'Без профілю — показувати все' : 'Пропустити — показувати все'), h('button', {type:'button', class:'btn primary', onclick:done}, 'Готово →'))),
      prev));
  dlg.addEventListener('click', e=>{ if (e.target === dlg && !first) close(); });
  document.addEventListener('keydown', function k(e){ if (e.key === 'Escape' && document.body.contains(dlg)){ close(); document.removeEventListener('keydown', k); } });
  document.body.append(dlg); draw();
}
/* Налаштування: профіль замість старого списку */
{ const ss = $('#set_spec'), f = ss && ss.closest('.f');
  if (f){ f.hidden = true; const hint = f.parentElement && f.parentElement.nextElementSibling; if (hint && hint.matches('p.chips-hint')){}
    f.after(h('div', {class:'f wide'}, h('label', {}, 'Профіль'), h('div', {class:'acts2'}, h('button', {type:'button', class:'btn', onclick:()=>profileDialog(false)}, 'Змінити профіль…')),
      h('p', {class:'chips-hint', style:'margin-top:6px'}, 'Спеціальність і місце роботи: свої хвороби першими, свої системи розгорнуті, решта — одним рядком «б/о».'))); } }
/* перший запуск: після знайомства; наявним користувачам — один раз */
{ const w0 = welcomeDialog; welcomeDialog = function(force){ const r = w0.apply(this, arguments);
    const dl = document.querySelector('.welcome');
    if (dl) dl.querySelectorAll('.wgrid > .wl').forEach(x=>{ if (/Профіль роботи|Працюю переважно/.test(x.textContent)) x.remove(); });
    if (dl && !force){ const ob = new MutationObserver(()=>{ if (!document.body.contains(dl)){ ob.disconnect(); if (!PROF && lsGet('po.profask', '') !== '1') setTimeout(()=>profileDialog(true), 250); } }); ob.observe(document.body, {childList:true}); }
    return r; }; }
setTimeout(()=>{ if (!PROF && lsGet('po.profask', '') !== '1' && !document.querySelector('.welcome') && lsGet('po.welcome', '') === '1') profileDialog(true); }, 700);
/* пошук Ctrl+K знаходить і згорнуті системи */
{ const si2 = searchItems; searchItems = function(){ const L = si2();
    if (profNow()) TABS.filter(t=>t._pf && SYS_IDS.includes(t.id)).forEach(t=>L.push({k:'Розділ', t:t.title, s:'згорнуто', go:()=>{ SYSOPEN = true; lsSet('po.sysopen', '1'); layoutTabs(); show(TABS.indexOf(t)); }}));
    L.push({k:'Дія', t:'Профіль: спеціальність і місце роботи', s:'', go:()=>profileDialog(false)}); return L; }; }
applyProfile(true);
