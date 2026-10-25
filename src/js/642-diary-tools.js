/* ===== 0.9.3.56 — щоденник: «Без змін (як учора)», «Порівняти з учора», пункти за хворобою =====
   Рішення лікаря (25.10.2026):
   1) «Без змін»: з попереднього запису копіюється опис огляду; показники (t, АТ, ЧСС, ЧД, SpO2, кисень, глікемія,
      маса й діурез, ПШВ) і скарги НЕ копіюються — порожні й підсвічені; скопійоване позначено «з учора»,
      доки його не змінено; перед «Записати в журнал» без показників — попередження (не блокує).
   2) «Порівняти з учора» лише пропонує фразу; межі змін: t 0,5 °C, SpO2 2 %, ЧД 4, ЧСС 10, сист. АТ 15;
      описові пункти — фактом «було → стало». Оцінку («позитивна динаміка») дає лікар.
   3) Базово: t, АТ, ЧСС, ЧД, легені, серце, живіт; SpO2 — у пульмонології, в інших — кнопкою «+ SpO2». */
const DT = { prev:new Set(), spo2:false, arm:0 };
const DT_VITALS = ['d_obj.t','d_obj.ad','d_obj.chss','d_obj.chd','d_obj.o2','d_obj.glik','d_obj.masa','d_obj.pef'];
const DT_CLEAR = ['d_main.sk','d_main.skx','d_main.zal','d_lik.obs','d_lik.kor'];
const DT_LIMITS = {t:0.5, spo2:2, chd:4, chss:10, ad:15};

/* ---- 3. пункти за хворобою (доповнення до наявних профілів 598) ---- */
['chd','dyh','serce','zhyv'].forEach(k=>{ if (!DPROF.base.includes(k)) DPROF.base.push(k); });
if (!DPROF.P.resp.s.includes('perk')) DPROF.P.resp.s.push('perk');
DPROF.KEY.bronx = DPROF.KEY.bronx || 'resp'; DPROF.KEY.pe = DPROF.KEY.pe || 'resp';
Object.entries({hf:['masa','nab','pech'], gh:['nevr'], pyelo:['pst','sech','masa'], pe:['nab']}).forEach(([k, a])=>{
  DPROF.ADD[k] = [...new Set([...(DPROF.ADD[k] || []), ...a])]; });
const dtNum = s => { const n = parseFloat(String(s || '').replace(',', '.')); return Number.isFinite(n) ? n : null; };
function dtSpo2Shown(){
  const f = F('d_obj.chd'); if (!f || !f.inputs[1]) return true;
  const pr = typeof dprofOf === 'function' ? dprofOf(curKey) : null;
  return !pr || DSHOWALL || pr.g === 'resp' || DT.spo2 || !!f.inputs[1].value.trim();
}
function dtSpo2Sync(){
  const f = F('d_obj.chd'); if (!f || !f.inputs[1]) return;
  const box = f.inputs[1].parentElement, on = dtSpo2Shown(); box.hidden = !on;
  let b = f.wrapEl.querySelector('.dt-spo2');
  if (!b){ b = h('button', {type:'button', class:'more dt-spo2', onclick:()=>{ DT.spo2 = true; dtSpo2Sync(); f.inputs[1].focus(); }}, '+ SpO2'); f.wrapEl.append(b); }
  b.hidden = on;
}
{ const x0 = applyDProfile; applyDProfile = function(){ const r = x0.apply(this, arguments); try{ dtSpo2Sync(); }catch(e){} return r; }; }

/* ---- 1. «Без змін (як учора)» ---- */
function dtKeyOf(el){
  for (const sid of DSEC){ const S = SECTIONS.find(s=>s.id === sid); for (const f of S.fields) if (f.wrapEl && f.wrapEl.contains(el)) return sid + '.' + f.id; }
  return null;
}
function dtMark(){
  DSEC.forEach(sid=>SECTIONS.find(s=>s.id === sid).fields.forEach(f=>{ if (f.wrapEl) f.wrapEl.classList.toggle('dprev', DT.prev.has(sid + '.' + f.id)); }));
}
function dtClearMarks(){ DT.prev.clear(); document.querySelectorAll('.dtoday').forEach(e=>e.classList.remove('dtoday')); dtMark(); }
function diaryNoChange(){
  const last = DIARIES[DIARIES.length - 1]; if (!last){ toast('У журналі ще немає записів — нема з чого копіювати'); return; }
  undoPush('«Без змін (як учора)»');
  likePrevious();
  DT_VITALS.forEach(k=>{ const f = F(k); if (f && f.inputs) f.inputs.forEach(i=>{ i.value = ''; }); });
  DT_CLEAR.forEach(k=>{ const f = F(k); if (!f || !f.el) return; f.el.value = ''; if (f.type === 'sel') mark(f.el, f); });
  { const f = F('d_main.dyn'), i = f && f.opts.findIndex(o=>/без суттєвої динаміки/i.test(O(o).t)); if (i >= 0){ f.el.value = String(i); mark(f.el, f); } }
  DT.prev.clear();
  ['d_main','d_obj','d_lik'].forEach(sid=>SECTIONS.find(s=>s.id === sid).fields.forEach(f=>{
    const k = sid + '.' + f.id; if (DT_VITALS.includes(k) || DT_CLEAR.includes(k) || k === 'd_main.dyn' || k === 'd_main.den') return;
    const has = f.type === 'sel' ? f.el.value !== '' : f.el && 'value' in f.el ? !!String(f.el.value).trim() : false;
    if (has) DT.prev.add(k);
  }));
  dtMark();
  ['d_obj.t','d_obj.ad','d_obj.chss','d_obj.chd'].forEach(k=>{ const f = F(k); if (f && f.wrapEl && !f.wrapEl.hidden) f.wrapEl.classList.add('dtoday'); });
  update(); try{ if (PAPER) renderPaper(); }catch(e){}
  toast('Опис огляду — як у попередньому записі (позначено «з учора»). Внесіть сьогоднішні показники й скарги.', 5000);
}
/* будь-яка правка поля знімає позначку «з учора» / «внесіть сьогоднішні» */
DSEC.forEach(sid=>{ const P = SECTIONS.find(s=>s.id === sid).panel; if (!P) return;
  ['input','change','click'].forEach(t=>P.addEventListener(t, e=>{ if (!e.isTrusted && t === 'click') return; const k = dtKeyOf(e.target); if (!k) return;
    let ch = false; if (DT.prev.delete(k)) ch = true; const f = F(k); if (f && f.wrapEl && f.wrapEl.classList.contains('dtoday') && t !== 'click'){ f.wrapEl.classList.remove('dtoday'); ch = true; }
    if (ch){ dtMark(); try{ if (PAPER) renderPaper(); }catch(x){} } }, true)); });
/* на бланку — позначка біля рядка поточного запису */
{ const x0 = bDiaryEntry; bDiaryEntry = function(e){ const root = x0.apply(this, arguments);
  if (e && e.cur && DT.prev.size && typeof DIARY_INLINE_GROUPS !== 'undefined')
    root.querySelectorAll('[data-diary-key]').forEach(n=>{ const g = DIARY_INLINE_GROUPS[n.dataset.diaryKey] || []; n.classList.toggle('dprev', g.some(k=>DT.prev.has(k))); });
  return root; }; }
/* попередження перед записом без показників (не блокує: повторне натискання — записати) */
function dtMissing(){
  const L = [['d_obj.t','температура'],['d_obj.ad','АТ'],['d_obj.chss','ЧСС'],['d_obj.chd','ЧД']];
  const out = L.filter(([k])=>{ const f = F(k); return f && f.wrapEl && !f.wrapEl.hidden && !f.inputs[0].value.trim(); }).map(([, n])=>n);
  const s = F('d_obj.chd'); if (s && s.inputs[1] && dtSpo2Shown() && (dprofOf(curKey) || {}).g === 'resp' && !s.inputs[1].value.trim()) out.push('SpO2');
  return out;
}
{ const x0 = saveDiary; saveDiary = function(){
  const miss = dtMissing();
  if (miss.length && Date.now() - DT.arm > 8000){ DT.arm = Date.now(); toast('Не внесено сьогоднішні показники: ' + miss.join(', ') + '. Натисніть «Записати в журнал» ще раз, щоб записати без них.', 8000); return; }
  DT.arm = 0; const n = DIARIES.length, r = x0.apply(this, arguments);
  if (DIARIES.length > n) dtClearMarks();
  return r; }; }
['clearAll','restore','diaryFromExam','diaryTplApply','diaryReset'].forEach(nm=>{ try{ const x0 = eval(nm); if (typeof x0 !== 'function') return;
  const fn = function(){ dtClearMarks(); DT.spo2 = false; return x0.apply(this, arguments); }; eval(nm + ' = fn'); }catch(e){} });
/* кнопка «Як попередній» → «Без змін (як учора)» */
document.querySelectorAll('button').forEach(b=>{ if (b.textContent.trim() === 'Як попередній'){ b.textContent = 'Без змін (як учора)'; b.title = 'Опис огляду — як у попередньому записі; показники й скарги — внести сьогоднішні'; b.onclick = ()=>diaryNoChange(); } });

/* ---- 2. «Порівняти з учора» ---- */
function dtOptText(f, v, own){ if (own && String(own).trim()) return g(String(own).trim()); const i = +v; return v === '' || v === undefined || !f.opts[i] ? '' : g(O(f.opts[i]).t); }
function diaryCompare(){
  const last = DIARIES[DIARIES.length - 1]; if (!last || !last.data) return {err:'У журналі ще немає попереднього запису'};
  const P = last.data.f || {}, cur = id => (document.getElementById(id) || {}).value || '';
  const parts = [], same = [];
  const fmt = n => String(n).replace('.', ',');
  const num = (id, lim, name, unit, verbs) => {
    const a = dtNum(P[id]), b = dtNum(cur(id)); if (a === null || b === null) return;
    if (Math.abs(b - a) >= lim) parts.push(`${name} ${b > a ? verbs[0] : verbs[1]} з ${fmt(a)} до ${fmt(b)}${unit}`); else same.push(name);
  };
  { const a = dtNum(P.d_obj_t_0), b = dtNum(cur('d_obj_t_0'));
    if (a !== null && b !== null){
      if (a >= 37.1 && b <= 37.0) parts.push(`температура нормалізувалась (${fmt(a)} → ${fmt(b)} °C)`);
      else if (Math.abs(b - a) >= DT_LIMITS.t) parts.push(`температура ${b > a ? 'підвищилась' : 'знизилась'} з ${fmt(a)} до ${fmt(b)} °C`);
      else same.push('температура'); } }
  num('d_obj_chd_1', DT_LIMITS.spo2, 'SpO2', ' %', ['зросла','знизилась']);
  num('d_obj_chd_0', DT_LIMITS.chd, 'ЧД', ' за хв', ['збільшилась','зменшилась']);
  num('d_obj_chss_0', DT_LIMITS.chss, 'ЧСС', ' уд/хв', ['збільшилась','зменшилась']);
  { const a = dtNum(P.d_obj_ad_0), b = dtNum(cur('d_obj_ad_0'));
    if (a !== null && b !== null){ if (Math.abs(b - a) >= DT_LIMITS.ad) parts.push(`АТ ${b > a ? 'підвищився' : 'знизився'} з ${P.d_obj_ad_0}/${P.d_obj_ad_1 || '…'} до ${cur('d_obj_ad_0')}/${cur('d_obj_ad_1') || '…'} мм рт. ст.`); else same.push('АТ'); } }
  const desc = [];
  ['d_main','d_obj'].forEach(sid=>SECTIONS.find(s=>s.id === sid).fields.forEach(f=>{
    if (f.type !== 'sel' || ['dyn','den'].includes(f.id) || (f.wrapEl && f.wrapEl.hidden)) return;
    const id = sid + '_' + f.id, was = dtOptText(f, P[id], P[id + '_own']), now = dtOptText(f, f.el.value, (document.getElementById(id + '_own') || {}).value);
    if (was && now && was !== now) desc.push(`${f.label.toLowerCase()}: було — ${was.replace(/[.\s]+$/, '')} → стало — ${now.replace(/[.\s]+$/, '')}`);
  }));
  let text = '';
  const end1 = t => /\.$/.test(t) ? t : t + '.';
  if (parts.length) text += end1('Порівняно з попереднім записом: ' + parts.join(', '));
  if (same.length && parts.length) text += ' ' + cap(same.join(', ')) + ' — без суттєвих змін.';
  if (!parts.length && same.length) text += 'Порівняно з попереднім записом показники (' + same.join(', ') + ') без суттєвих змін.';
  if (desc.length) text += (text ? ' ' : '') + cap(desc.join('; ')) + '.';
  return {text:text.trim(), parts, same, desc};
}
{ const f = F('d_main.dyn'); if (f && f.wrapEl){
  const out = h('div', {class:'dt-cmp', hidden:''});
  const btn = h('button', {type:'button', class:'more', onclick:()=>{
    const r = diaryCompare(); out.hidden = false; out.replaceChildren();
    if (r.err || !r.text){ out.append(h('p', {class:'chips-hint'}, r.err || 'Нічого порівняти: внесіть сьогоднішні показники або змініть пункти огляду.')); return; }
    out.append(h('p', {class:'dt-cmp-t'}, r.text), h('div', {class:'acts2'},
      h('button', {type:'button', class:'btn primary', onclick:()=>{ const d = F('d_obj.dod'); undoPush('динаміка в запис'); d.el.value = [d.el.value.trim(), r.text].filter(Boolean).join(' '); d.el.dispatchEvent(new Event('input', {bubbles:true})); out.hidden = true; toast('Додано в «Додатково» запису'); }}, 'Вставити в запис'),
      h('button', {type:'button', class:'more', onclick:()=>{ out.hidden = true; }}, 'Закрити')),
      h('p', {class:'chips-hint'}, 'Оцінку динаміки (покращення / погіршення) вибираєте ви в полі «Динаміка».'));
  }}, '↔ Порівняти з учора');
  f.wrapEl.append(btn, out);
} }
try{ applyDProfile(); }catch(e){}
