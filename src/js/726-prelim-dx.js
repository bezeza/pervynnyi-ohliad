/* ===== 0.9.3.169 — «Попередній діагноз» до підтвердження (інструкція до ф. 003/о) =====
   У шаблоні хвороби задано, чим діагноз підтверджується: p.dxConfirm = [{n:'назва', re:/…/}] — достатньо ОДНОГО з методів
   (альтернативи: КТ або МРТ). Поки в «Результатах» немає жодного з них — заголовок «Попередній діагноз:» + у дужках «потребує підтвердження: …»;
   щойно результат внесено — автоматично «Клінічний діагноз:». Ручний вибір «Вид діагнозу» лікарем має пріоритет над автоматикою
   (запам’ятовується в записі пацієнта). В епікризі — «Заключний клінічний діагноз»; якщо підтвердження так і не внесено — лишається «Попередній» і
   з’являється зауваження в «Перевірці», тихо не підміняється. Обґрунтування госпіталізації при попередньому діагнозі — «з метою верифікації діагнозу та лікування».
   Які діагнози потребують підтвердження і чим — лише в даних шаблонів нижче (загальна логіка їх не знає). */
const DXCONFIRM = {
  pe:     [{n:'КТ-ангіопульмонографія', re:/ангіопульмон|КТ-АПГ/i}],
  stroke: [{n:'КТ головного мозку', re:/^КТ головного мозку/i}, {n:'МРТ головного мозку', re:/^МРТ головного мозку/i}],
  gib:    [{n:'ФГДС', re:/ФГДС|гастроскоп/i}],
  mening: [{n:'люмбальна пункція', re:/люмбальн|спинномозков|ліквор/i}],
  pneu:   [{n:'рентгенографія ОГК', re:/рентген.*ОГК|ОГК.*рентген|КТ ОГК/i}]
};
try{ PRESETS.forEach(p=>{ if (!p.dxConfirm && DXCONFIRM[p.key]) p.dxConfirm = DXCONFIRM[p.key]; }); }catch(e){}
let VYD_AUTO = false, DX_RESTORING = false;
function vydEl(){ try{ return F('dx.vyd').el; }catch(e){ return null; } }
function dxPending(){
  const p = (typeof PRESETS !== 'undefined' && curKey) ? PRESETS.find(x=>x.key === curKey) : null, c = p && p.dxConfirm;
  if (!c || !c.length) return null;
  /* «підтверджено» — лише коли лікар позначив результат «Підтверджує діагноз»; сам факт внесення результату (навіть негативного) діагноз не змінює */
  const hit = RES.filter(r=>c.some(i=>i.re.test(String(r.t || ''))));
  return {done:hit.some(r=>r.c === 'y'), negative:hit.some(r=>r.c === 'n'), unmarked:hit.some(r=>!r.c), names:c.map(i=>i.n)};
}
function dxMatches(t){ const p = (typeof PRESETS !== 'undefined' && curKey) ? PRESETS.find(x=>x.key === curKey) : null; return !!(p && p.dxConfirm && p.dxConfirm.some(i=>i.re.test(String(t || '')))); }
function vydManual(){ const e = vydEl(); return !!(e && e.dataset.man === '1'); }
/* вид діагнозу: 0 — попередній, 1 — клінічний; ручний вибір сильніший за автоматику */
function dxPrelim(){
  const e = vydEl(); if (!e) return false;
  if (vydManual()) return e.value === '0';
  const pd = dxPending(); return pd ? !pd.done : false;
}
function dxNote(){ const pd = dxPending(); return pd && !pd.done ? ' — потребує підтвердження: ' + pd.names.join(', ') : ''; }
function vydSync(){
  const e = vydEl(), pd = dxPending(); if (!e || !pd || vydManual() || DX_RESTORING) return;
  const want = pd.done ? '1' : '0'; if (e.value !== want){ VYD_AUTO = true; e.value = want; VYD_AUTO = false; }
}
document.addEventListener('change', ev=>{ try{ const e = vydEl(); if (e && ev.target === e && !VYD_AUTO) e.dataset.man = '1'; }catch(x){} }, true);
{ const st0 = sectionText; sectionText = function(s){
    if (s && s.id === 'dx' && DOC === 'ohl') vydSync();
    const r = st0.apply(this, arguments); if (!r || !s) return r;
    try{
      if (s.id === 'dx' && (DOC === 'ohl' || DOC === 'epi')){
        const pre = DOC === 'ohl' ? dxPrelim() : (vydManual() ? vydEl().value === '0' : (dxPending() ? !dxPending().done : false));
        if (pre){
          if (DOC === 'epi') r.head = 'Попередній діагноз:';
          const note = dxNote(); if (note) r.body = r.body.replace(/^([^\n]*?)\.?(?=\n|$)/, (m, a)=>a + note + '.');
        }
      }
      if (s.id === 'hosp' && DOC === 'ohl' && MODE === 'hosp' && dxPrelim() && dxPending())
        r.body = r.body.replace(/(госпіталізац[а-яіїєґ]*) відповідно до Стандарту/, '$1 з метою верифікації діагнозу та лікування відповідно до Стандарту');
    }catch(x){}
    return r; }; }
{ const cd = checkDoc; checkDoc = function(){ const L = cd.apply(this, arguments);
    try{ const pd = dxPending();
      if (pd && pd.negative && !pd.done) L.unshift({m:'Обстеження не підтвердило діагноз (' + pd.names.join(', ') + ') — діагноз лишається попереднім: перегляньте діагноз', tab:'dx', f:'dx.osn'});
      else if (pd && pd.unmarked && !pd.done) L.push({m:'Результат обстеження внесено, але не позначено «Підтверджує / Не підтверджує діагноз» — діагноз лишається попереднім', tab:'dx', f:'dx.osn'});
      if (DOC === 'epi' && pd && !pd.done && !(vydManual() && vydEl().value !== '0')) L.unshift({m:'Діагноз лишається попереднім: не внесено підтверджуючого обстеження (' + pd.names.join(', ') + '). Внесіть результат у «Результати» або змініть вид діагнозу в первинному огляді', tab:'dx'});
      if (DOC === 'ohl' && pd && !pd.done && dxPrelim()) L.push({m:'Попередній діагноз — потребує підтвердження: ' + pd.names.join(', '), tab:'dx', f:'dx.osn'});
    }catch(x){}
    return L; }; }
{ const s0 = snap; snap = function(){ const r = s0.apply(this, arguments); try{ if (r && typeof r === 'object' && vydManual()) r.vm = 1; }catch(x){} return r; }; }
/* ручний вибір відновлюємо ДО відновлення полів і не синхронізуємо автоматично під час відновлення (раніше «Клінічний» підставлявся до того, як вертався ручний вибір) */
{ const r0 = restore; restore = function(S){ let r; try{ const e = vydEl(); if (e){ if (S && S.vm) e.dataset.man = '1'; else delete e.dataset.man; } }catch(x){} DX_RESTORING = true; try{ r = r0.apply(this, arguments); } finally { DX_RESTORING = false; } try{ const e = vydEl(); if (e){ if (S && S.vm) e.dataset.man = '1'; else delete e.dataset.man; } }catch(x){} return r; }; }
{ const a0 = applyPreset; applyPreset = function(){ const e = vydEl(); if (e) delete e.dataset.man; return a0.apply(this, arguments); }; }
{ const c0 = clearAll; clearAll = function(){ const e = vydEl(); if (e) delete e.dataset.man; return c0.apply(this, arguments); }; }
