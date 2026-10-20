/* ===== Безпечне автозаповнення (0.9.3.15): усе, що заповнила програма (заготовка хвороби, «Норма всюди», «За шаблоном»,
   щоденник за шаблоном, схема призначень), позначено «не переглянуто», доки лікар сам не змінить щось у розділі або не натисне
   «✓ Переглянуто». Непереглянуте — у «Перевірці» й на аркуші; перед друком і копіюванням — попередження.
   Перед масовим заповненням — що зміниться, і захист уже введених даних. ===== */
const AREV_I = h('input', {type:'hidden', id:'meta_autorev'});
{ const mp = META && META.panel; (mp || document.getElementById('panels')).append(AREV_I); }
const arevGet = () => { try{ return JSON.parse(AREV_I.value || '{}') || {}; }catch(e){ return {}; } };
const arevSet = o => { AREV_I.value = Object.keys(o).length ? JSON.stringify(o) : ''; };
let AGATE = lsGet('po.autogate', '1') !== '0';
const secOf = id => id === 'rxt' ? RXT : SECTIONS.find(x=>x.id === id);
const secTitle = id => { const s = secOf(id); return s ? (s.title || s.short || id) : id; };
function markAuto(ids, src){ if (RESTORING) return; const o = arevGet(); ids.forEach(id=>{ if (secOf(id)) o[id] = src; }); arevSet(o); drawAuto(); }
function unmarkAuto(id){ const o = arevGet(); if (!(id in o)) return; delete o[id]; arevSet(o); drawAuto(); try{ autosave(); }catch(e){} }
/* розділи, що стосуються поточного документа */
const autoForDoc = () => { const o = arevGet(); return Object.keys(o).filter(id=>{ const s = secOf(id); if (!s) return false; if (id === 'rxt') return ['ohl','shch','rx'].includes(DOC); return (s.docs || ['ohl']).includes(DOC); }); };
/* банер у розділі й позначка на вкладці */
const ABARS = {};
function autoBar(id){
  if (ABARS[id]) return ABARS[id]; const s = secOf(id); if (!s || !s.panel) return null;
  const b = h('div', {class:'autobar', hidden:''},
    h('span', {class:'ab-t'}), h('button', {type:'button', class:'btn ab-ok', onclick:()=>{ unmarkAuto(id); toast('«' + secTitle(id) + '» — переглянуто'); }}, '✓ Переглянуто'));
  const ph = s.panel.querySelector('.ph'); if (ph) ph.after(b); else s.panel.prepend(b);
  return ABARS[id] = b;
}
function drawAuto(){
  const o = arevGet();
  [...SECTIONS, RXT].forEach(s=>{ const on = s.id in o;
    if (s.tab){ s.tab.classList.toggle('autof', on); if (on) s.tab.title = 'Заповнено автоматично — не переглянуто'; else if (s.tab.title === 'Заповнено автоматично — не переглянуто') s.tab.title = ''; }
    const b = on ? autoBar(s.id) : ABARS[s.id];
    if (b){ b.hidden = !on; if (on) b.querySelector('.ab-t').textContent = `Заповнено автоматично (${o[s.id]}) — ви ще не переглянули. Перевірте, змініть те, що інакше, і підтвердьте.`; } });
}
/* лікар сам щось змінив у розділі — розділ переглянуто */
['input', 'change', 'click'].forEach(ev=>document.addEventListener(ev, e=>{
  if (!e.isTrusted) return; const t = e.target; if (!t.closest) return;
  if (t.closest('.autobar, .ph, .pencil, .tplsec, .nextbar')) return;
  const p = t.closest('.panel'); if (!p) return;
  const s = [...SECTIONS, RXT].find(x=>x.panel === p); if (!s) return;
  if (ev === 'click' && !t.closest('button, .chip, input, select, textarea, label')) return;
  if (s.id in arevGet()) unmarkAuto(s.id);
}, true));
/* хто заповнює автоматично */
const OBJ_OHL = () => SECTIONS.filter(s=>s.objective && !DSEC.includes(s.id) && (s.docs || ['ohl']).includes('ohl')).map(s=>s.id);
{ const ap = applyPreset; applyPreset = function(p){ const rx0 = RX.length; const r = ap.apply(this, arguments);
    try{ markAuto(['skarhy', 'morbi', 'dx', ...OBJ_OHL()], 'заготовка «' + (p && p.name || '') + '»'); if (RX.length && RX_AUTO && rxSig() === RX_AUTO) markAuto(['rxt'], 'схема хвороби «' + (p && p.name || '') + '»'); }catch(e){}
    return r; }; }
{ const n = $('#allNorm'), o = n.onclick; n.onclick = function(){ const r = o.apply(this, arguments); try{ markAuto(SECTIONS.filter(s=>s.objective && s.docs.includes(DOC)).map(s=>s.id), DOC === 'shch' ? '«Стабільно»' : '«Норма всюди»'); }catch(e){} return r; }; }
{ const ps = SHELL.presetSection; SHELL.presetSection = function(s){ const r = ps.apply(this, arguments); try{ const p = PRESETS.find(x=>x.key === curKey); markAuto([s.id], 'за шаблоном «' + (p ? p.name : '') + '»'); }catch(e){} return r; }; }
{ const w = (name, src) => { const f0 = eval(name); return function(){ const r = f0.apply(this, arguments); try{ markAuto(DSEC, typeof src === 'function' ? src.apply(null, arguments) : src); }catch(e){} return r; }; };
  diaryFromExam = w('diaryFromExam', k=>'щоденник «' + dtplName(k) + '»' + (examOwn() ? ' з первинного огляду' : ' за шаблоном хвороби'));
  diaryTplApply = w('diaryTplApply', t=>'мій шаблон «' + (t && t.name || '') + '»');
  likePrevious = w('likePrevious', 'як попередній запис'); }
/* «Перевірка» й аркуш */
{ const cd = checkDoc; checkDoc = function(){ const L = cd.apply(this, arguments);
    try{ const o = arevGet(); autoForDoc().forEach(id=>L.unshift({m:`«${secTitle(id)}» заповнено автоматично (${o[id]}) — не переглянуто`, tab:id})); }catch(e){}
    return L; }; }
/* перед друком, копіюванням і збереженням у файл — попередження */
let AGATE_OK = false;
function autoGate(go){
  const L = autoForDoc(); if (!AGATE || AGATE_OK || !L.length){ return true; }
  const o = arevGet();
  const dlg = h('div', {class:'navsheet packsheet agate', role:'dialog', 'aria-modal':'true', 'aria-label':'Непереглянуте автозаповнення'},
    h('div', {class:'nvbox'}, h('div', {class:'nshead'}, h('b', {}, `Не переглянуто: ${L.length} ${plural(L.length, ['розділ','розділи','розділів'])}`), h('button', {type:'button', class:'btn', onclick:()=>dlg.remove()}, 'Закрити ✕')),
      h('p', {}, 'Ці розділи заповнила програма, і ви їх ще не перевіряли. У документ піде текст огляду, якого, можливо, не було:'),
      h('ul', {class:'aglist'}, ...L.map(id=>h('li', {}, h('button', {type:'button', class:'more', onclick:()=>{ dlg.remove(); goTab(id); }}, secTitle(id)), ' — ' + o[id]))),
      h('div', {class:'acts2', style:'margin-top:12px'},
        h('button', {type:'button', class:'btn primary', onclick:()=>{ dlg.remove(); goTab(L[0]); }}, 'Переглянути'),
        h('button', {type:'button', class:'btn', onclick:()=>{ dlg.remove(); const o2 = arevGet(); L.forEach(id=>delete o2[id]); arevSet(o2); drawAuto(); autosave(); logAct && logAct('Підтверджено автозаповнене без перегляду', L.length + ' розділів'); AGATE_OK = true; try{ go(); } finally { AGATE_OK = false; } }}, 'Я перевірив — продовжити'))));
  document.body.append(dlg); dlg.querySelector('.btn.primary').focus();
  return false;
}
['#copy', '#copy2', '#printBtn', '#docxBtn', '#odtBtn'].forEach(sel=>{ const b = $(sel); if (!b) return;
  b.addEventListener('click', e=>{ if (!autoGate(()=>b.click())){ e.preventDefault(); e.stopImmediatePropagation(); } }, true); });
{ const c0 = copy; copy = function(){ if (!autoGate(()=>c0.apply(this, arguments))) return; return c0.apply(this, arguments); }; }
{ const p0 = doPrint; doPrint = function(){ if (!autoGate(()=>p0.apply(this, arguments))) return; return p0.apply(this, arguments); }; }

/* ---------- перед масовим заповненням: що зміниться, і захист уже введеного ---------- */
function secHasData(s){
  if (!s || !s.fields) return false;
  return s.fields.some(f=>{
    if ((f.docs && !f.docs.includes(DOC) && !f.docs.includes('ohl')) || (f.when && !f.when())) return false;
    if (f.type === 'sel') return !!f.el && f.el.value !== '' && !f.autoSet && !(f.def !== undefined && f.el.value === String(f.def));
    if (f.type === 'multi') return !!f.chips && f.chips.some(c=>c.getAttribute('aria-pressed') === 'true' && !c.dataset.auto);
    if (f.type === 'text' || f.type === 'line') return !!f.el && !!f.el.value.trim();
    if (f.inputs) return f.inputs.some(i=>i.value && i.value.trim());
    if (f.type === 'period') return !!(f.d1 && f.d1.value) || !!(f.d2 && f.d2.value);
    return false;
  });
}
function secSave(s){ const f = {}, c = {}; s.panel.querySelectorAll('input[id], select[id], textarea[id]').forEach(e=>{ if (e.type !== 'search' && e.type !== 'file') f[e.id] = e.type === 'checkbox' ? e.checked : e.value; });
  s.panel.querySelectorAll('.chip[id]').forEach(b=>{ c[b.id] = {p:b.getAttribute('aria-pressed') === 'true', o:b.dataset.ord}; }); return {f, c}; }
function secLoad(s, d){ for (const id in d.f){ const e = document.getElementById(id); if (!e) continue; if (e.type === 'checkbox') e.checked = d.f[id]; else e.value = d.f[id]; }
  for (const id in d.c){ const b = document.getElementById(id); if (!b) continue; b.setAttribute('aria-pressed', d.c[id].p ? 'true' : 'false'); if (d.c[id].o) b.dataset.ord = d.c[id].o; else delete b.dataset.ord; }
  s.fields.forEach(f=>{ if (f.type === 'sel' && f.el) mark(f.el, f); if (f.type === 'multi'){ refreshChips(f); try{ refreshDet(f); }catch(e){} } }); }
/* розділи з даними, які ввів лікар (не автозаповнені) */
const userSecs = ids => { const o = arevGet(); return ids.map(id=>SECTIONS.find(x=>x.id === id)).filter(s=>s && !(s.id in o) && secHasData(s)); };
function fillAsk(title, all, keep, run){
  if (!keep.length){ run(false); return; }
  const dlg = h('div', {class:'navsheet packsheet agate', role:'dialog', 'aria-modal':'true', 'aria-label':title},
    h('div', {class:'nvbox'}, h('div', {class:'nshead'}, h('b', {}, title), h('button', {type:'button', class:'btn', onclick:()=>dlg.remove()}, 'Скасувати ✕')),
      h('p', {}, 'Зміниться: ' + all.map(s=>s.short || s.title).join(', ') + '.'),
      h('p', {}, h('b', {}, 'Там уже є ваші дані: '), keep.map(s=>s.short || s.title).join(', ') + '.'),
      h('div', {class:'acts2', style:'margin-top:12px'},
        h('button', {type:'button', class:'btn primary', onclick:()=>{ dlg.remove(); run(true); }}, 'Заповнити лише порожні — ваші дані лишити'),
        h('button', {type:'button', class:'btn', onclick:()=>{ dlg.remove(); run(false); }}, 'Перезаписати все'),
        h('button', {type:'button', class:'more', onclick:()=>dlg.remove()}, 'Скасувати')),
      h('p', {class:'chips-hint'}, 'Будь-яку дію можна скасувати: Ctrl+Z або «↶ Скасувати».')));
  document.body.append(dlg); dlg.querySelector('.btn.primary').focus();
}
{ const ap = applyPreset; applyPreset = function(p, btn){
    const ids = ['skarhy', 'morbi', 'dx', ...OBJ_OHL()], all = ids.map(id=>SECTIONS.find(x=>x.id === id)).filter(Boolean), keep = AGATE ? userSecs(ids) : [];
    const self = this, args = arguments;
    if (!keep.length) return ap.apply(self, args);
    fillAsk('Заповнити за хворобою «' + (p && p.name || '') + '»?', all, keep, protect=>{
      const saved = protect ? keep.map(s=>[s, secSave(s)]) : [];
      ap.apply(self, args);
      if (protect){ saved.forEach(([s, d])=>secLoad(s, d)); const o = arevGet(); keep.forEach(s=>delete o[s.id]); arevSet(o); drawAuto(); update(); toast('Заповнено порожні розділи; ваші дані лишились: ' + keep.map(s=>s.short || s.title).join(', '), 4000); }
    }); }; }
{ const n = $('#allNorm'), o = n.onclick; n.onclick = function(){
    const all = SECTIONS.filter(s=>s.objective && s.docs.includes(DOC)), keep = AGATE ? userSecs(all.map(s=>s.id)) : [], self = this, args = arguments;
    if (!keep.length) return o.apply(self, args);
    fillAsk(DOC === 'shch' ? '«Стабільно» у щоденнику?' : '«Норма всюди»?', all, keep, protect=>{
      const saved = protect ? keep.map(s=>[s, secSave(s)]) : [];
      o.apply(self, args);
      if (protect){ saved.forEach(([s, d])=>secLoad(s, d)); const ob = arevGet(); keep.forEach(s=>delete ob[s.id]); arevSet(ob); drawAuto(); update(); toast('Норму виставлено лише там, де було порожньо', 3000); }
    }); }; }
/* налаштування */
if (SETTINGS_EL){ const c = h('input', {type:'checkbox', id:'set_autogate'}); c.checked = AGATE; c.addEventListener('change', ()=>{ AGATE = c.checked; lsSet('po.autogate', AGATE ? '1' : '0'); });
  SETTINGS_EL.append(h('h3', {class:'sub'}, 'Безпечне автозаповнення'), h('label', {class:'blk'}, c, ' Попереджати перед друком і копіюванням про непереглянуте та питати перед перезаписом ваших даних'),
    h('p', {class:'chips-hint'}, 'Розділи, заповнені заготовкою, «Нормою всюди» чи шаблоном щоденника, позначено «не переглянуто», доки ви не зміните щось у розділі або не натиснете «✓ Переглянуто».')); }
{ const r0 = restore; restore = function(){ const r = r0.apply(this, arguments); try{ drawAuto(); }catch(e){} return r; }; }
{ const ca = clearAll; clearAll = function(){ const r = ca.apply(this, arguments); try{ arevSet({}); drawAuto(); }catch(e){} return r; }; }
drawAuto();
