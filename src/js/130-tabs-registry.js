let SETTINGS_EL = null;
const META = {id:'meta', title:'Пацієнт і лікар', short:'Запис', fields:[], special:'meta'};
const HV = {id:'hv', title:'За хворобою', fields:[], special:'hv'};
const CALC = {id:'calc', title:'Калькулятори', short:'Шкали', fields:[], special:'calc'};
SECTIONS.forEach(s=>{ s.docs = s.docs || ['ohl']; });
META.docs = ['ohl','shch','epi','kons','rx','zav','konc','etap','per','napr','dov','zgoda','gosp','pam','f066']; HV.docs = ['ohl']; CALC.docs = META.docs.slice();
const RXT = {id:'rxt', title:'Лист призначень', short:'Призначення', fields:[], special:'rx', docs:['ohl','shch','rx','epi','zav','konc','etap','per','napr','gosp','pam']};
const TPL = {id:'tpl', title:'Мої шаблони', short:'Мої шаблони', fields:[], special:'tpl', docs:['ohl','shch','epi','kons','rx','zav','konc','etap','per','napr','dov','zgoda','gosp','pam']};
const SET = {id:'set', title:'Налаштування', short:'Налаштування', fields:[], special:'set', docs:['ohl','shch','epi','kons','rx','zav','konc','etap','per','napr','dov','zgoda','gosp','pam']};
const QV = {id:'qv', title:'Показники і системи', short:'Показники', fields:[], special:'qv', docs:['ohl']};
const HELP = {id:'help', title:'Довідка', short:'Довідка', fields:[], special:'help', docs:['ohl','shch','epi','kons','rx','zav','konc','etap','per','napr','dov','zgoda','gosp','pam']};
const TABS = [META, HV, ...SECTIONS, RXT, CALC, TPL, SET, HELP];
TABS.splice(TABS.findIndex(t=>t.id === 'morbi') + 1, 0, QV);   // «Показники» для швидкого прийому — після анамнезу

function show(i){
  try{ setTimeout(renderTabNav, 0); }catch(e){}
  active = i;
  if (TABS[i] && TABS[i].id === 'dx') dxPanel();
  TABS.forEach((s,k)=>{ s.panel.hidden = k !== i; s.tab.setAttribute('aria-selected', k===i ? 'true':'false'); });
  TABS[i].tab.scrollIntoView({block:'nearest', inline:'center'});
  if (TABS[i] === CALC){ syncFromForm(false); update(); }
  if (TABS[i] === RXT){ runCalcs(); renderRx(); }
  if (TABS[i] === TPL) renderTplLists();
  const top = $('.form').getBoundingClientRect().top;
  if (top < 0) window.scrollBy({top: top - 8});
}

/* ===== Навігація по розділах: ‹ назва › на телефоні і «Далі →» внизу розділу ===== */
const TOOL_TABS = ['calc','tpl','set','help'];
function tabOrder(){ return [...document.querySelectorAll('#tabs .tab')].filter(t=>!t.hidden).map(t=>TABS.findIndex(x=>x.tab === t)).filter(i=>i >= 0); }
function tabGroupLabel(i){ const g = TABS[i].tab.closest('.tgrp'); const l = g && g.querySelector('.tgl'); return l ? l.textContent : ''; }
function goDone(){
  if (window.matchMedia && matchMedia('(max-width:899px)').matches){ $('#outBox').classList.add('open'); return; }
  $('#outBox').scrollIntoView({block:'start', behavior:'smooth'}); toast('Перевірте текст справа й натисніть «Копіювати» або «Друк»', 2500);
}
function renderTabNav(){
  const all = tabOrder(), cur = TABS[active]; if (!cur || !cur.panel) return;
  const isTool = TOOL_TABS.includes(cur.id), seq = isTool ? all : all.filter(i=>!TOOL_TABS.includes(TABS[i].id));
  const k = seq.indexOf(active), prev = k > 0 ? seq[k - 1] : -1, next = k >= 0 && k < seq.length - 1 ? seq[k + 1] : -1;
  const nm = i => TABS[i].short || TABS[i].title;
  const tn = $('#tabnav');
  if (tn){ tn.innerHTML = '';
    tn.append(h('button', {type:'button', class:'btn tn-arr', disabled:prev < 0 ? '' : null, 'aria-label':'Попередній розділ', onclick:()=>prev >= 0 && show(prev)}, '‹'),
      h('button', {type:'button', class:'btn tn-cur', 'aria-haspopup':'dialog', title:'Усі розділи', onclick:openNav},
        h('span', {class:'tn-g'}, tabGroupLabel(active)), h('b', {}, nm(active)), h('span', {class:'tn-n'}, k >= 0 ? `${k + 1}/${seq.length}` : ''), h('span', {class:'tn-dd', 'aria-hidden':'true'}, '▾')),
      h('button', {type:'button', class:'btn tn-arr', disabled:next < 0 ? '' : null, 'aria-label':'Наступний розділ', onclick:()=>next >= 0 && show(next)}, '›'));
  }
  let bar = cur.foot || cur.panel.querySelector(':scope > .nextbar');
  if (!bar){ bar = h('div', {class:'nextbar'}); cur.panel.append(bar); }
  TABS.forEach(t=>{ if (t.foot && t !== cur) t.foot.innerHTML = ''; }); bar.classList.add('nextbar'); bar.innerHTML = '';
  if (isTool) return;
  if (prev >= 0) bar.append(h('button', {type:'button', class:'btn nb-prev', onclick:()=>show(prev)}, '‹ ' + nm(prev)));
  bar.append(next >= 0 ? h('button', {type:'button', class:'btn primary nb-next', onclick:()=>show(next)}, 'Далі: ' + nm(next) + ' ›')
    : h('button', {type:'button', class:'btn primary nb-next', onclick:goDone}, 'Готово — до тексту документа ›'));
}
const F = key => { const [s,f] = key.split('.'); return SECTIONS.find(x=>x.id===s).fields.find(x=>x.id===f); };
const pick = (f, texts) => {
  f.chips.forEach(c=>{ c.setAttribute('aria-pressed','false'); delete c.dataset.ord; delete c.dataset.auto; delete c.dataset.off; }); detReset(f);
  texts.forEach(t=>{ const i = f.opts.findIndex(o=>O(o).t === t); if (i >= 0){ f.chips[i].setAttribute('aria-pressed','true'); f.chips[i].dataset.ord = ++ORD; } });
  refreshChips(f);
};

function makeCard(p){
  const b = h('button', {type:'button', class:'dcard', 'aria-pressed':'false'},
    h('b', {}, p.name), h('span', {class:'code'}, p.mkh || (p.custom ? 'мій шаблон' : '')), h('span', {}, (p.skarhy || []).slice(0,3).join(', ') + ((p.skarhy || []).length ? '…' : '')));
  b.dataset.g = p.group; b.addEventListener('click', ()=>applyPreset(p, b));
  HV.cardBox.append(b); return b;
}
function addCardLive(p){ HV.cards.push(makeCard(p)); HV.filter(); }
function renderHvTips(){
  rxVarRedraw();
  const b = $('#hvTips'); if (!b) return; b.innerHTML = '';
  const p = PRESETS.find(x=>x.key === curKey); if (!p || !p.tips){ b.hidden = true; return; }
  b.hidden = false;
  b.append(h('b', {}, 'Підказки: ' + p.name), h('ul', {}, ...p.tips.map(t=>h('li', {}, t))),
    h('p', {class:'chips-hint'}, rxFor(p).length ? (MODE === 'amb' ? 'Амбулаторна схема лікування — у вкладці «Призначення».' : 'Типова схема лікування — у вкладці «Призначення».') : MODE === 'amb' && RXA[p.key] ? 'Амбулаторної схеми немає: при цій хворобі показане лікування в стаціонарі (документ «Направлення на госпіталізацію»).' : ''));
}
/* Бік ураження: дзеркально міняє «справа/зліва» в усіх текстах заготовки.
   Для інсульту одночасно міняються і півкуля, і бік парезу; афазія при правопівкульному — на дизартрію. */
let SIDE = 'r';
const SIDE_W = [['справа','зліва'],['правої','лівої'],['правій','лівій'],['правих','лівих'],['праву','ліву'],['правого','лівого'],['правий','лівий'],['вправо','вліво'],['праве','ліве'],['права','ліва'],['правому','лівому'],['правою','лівою'],['правобічн','лівобічн'],['Правобічн','Лівобічн'],['D>S','S>D']];
const SIDE_RE = new RegExp('(?<![А-Яа-яІіЇїЄєҐґ’\'])(' + SIDE_W.flat().join('|') + ')', 'g');
const SIDE_MAP = Object.fromEntries(SIDE_W.flatMap(([a,b])=>[[a,b],[b,a]]));
const flip = t => typeof t === 'string' ? t.replace(SIDE_RE, m=>SIDE_MAP[m] || m) : Array.isArray(t) ? t.map(flip) : t;
function sidePreset(p){
  if (SIDE === 'b'){
    if (!p.sides || !p.both) return p;
    const q = Object.assign({}, p, p.both, {set:Object.assign({}, p.set)});
    for (const k in (p.both.set || {})){ if (p.both.set[k] === null) delete q.set[k]; else q.set[k] = p.both.set[k]; }
    if (p.both.det === undefined) q.det = p.det;
    return q;
  }
  if (!p.sides || SIDE === 'r') return p;
  const q = Object.assign({}, p, {skarhy:flip(p.skarhy), osn:flip(p.osn), uskl:flip(p.uskl), set:{}, det:{}});
  for (const k in p.set) q.set[k] = flip(p.set[k]);
  for (const k in (p.det || {})) q.det[k] = flip(p.det[k]);
  const fx = (t, a, b) => typeof t === 'string' ? t.split(a).join(b) : Array.isArray(t) ? t.map(x=>fx(x, a, b)) : t;
  (p.leftFix || []).forEach(([a,b])=>{ q.osn = fx(q.osn, a, b); for (const k in q.set) q.set[k] = fx(q.set[k], a, b); });
  return q;
}
/* анамнез хвороби за хворобою: [тривалість, одиниця (0 дні,1 тижні,2 місяці,3 роки), початок, причини, тривалість хвороби, лікування, додатково] (-1 — не заповнювати) */
const ANH = {
  pneu:[5,0,0,['переохолодженням'],0,3], gh:[10,3,-1,['психоемоційним стресом'],3,5], ihd:[3,3,2,['фізичним навантаженням'],1,4], hf:[5,3,2,[],3,5],
  gastr:[5,3,-1,['порушенням дієти'],1,3], copd:[10,3,-1,['переохолодженням'],2,2], dm:[5,3,-1,['порушенням дієти'],3,5], af:[2,3,0,[],1,4],
  asthma:[10,3,0,['перенесеною ГРВІ'],1,2], pyelo:[3,0,0,['переохолодженням'],0,0], stroke:[1,0,0,['підвищенням АТ'],0,0], tia:[1,0,0,['підвищенням АТ'],0,0],
  de:[3,3,1,[],1,5], rad:[7,0,0,['підйомом важкого'],1,2], dpn:[2,3,1,[],2,4], migr:[1,0,0,['психоемоційним стресом'],1,2], bell:[2,0,0,['переохолодженням'],0,0],
  epi:[1,0,0,['самовільною відміною препаратів'],1,5], cerv:[7,0,0,['фізичним навантаженням'],1,3], bppv:[3,0,0,[],0,3],
  app:[1,0,0,[],0,0], chol:[2,0,0,['порушенням дієти'],0,3], panc:[1,0,0,['вживанням алкоголю','порушенням дієти'],0,0], gib:[1,0,0,[],0,0],
  obstr:[2,0,0,[],0,0], hern:[1,0,0,['підйомом важкого'],0,0], dvt:[4,0,1,[],0,0], perf:[1,0,0,[],0,0], colic:[1,0,0,['фізичним навантаженням'],0,3], absc:[5,0,1,[],0,3],
  arvi:[3,0,0,['переохолодженням','контактом з хворим'],0,3], flu:[2,0,0,['контактом з хворим'],0,3], covid:[4,0,0,['контактом з хворим'],0,3],
  food:[1,0,0,['вживанням неякісної їжі'],0,3], tons:[2,0,0,['переохолодженням'],0,3], hep:[7,0,1,['контактом з хворим'],0,0], ery:[2,0,0,[],0,0],
  mening:[1,0,0,['перенесеною ГРВІ'],0,0], mono:[7,0,1,[],0,1], varic:[3,0,0,['контактом з хворим'],0,0],
  cyst:[2,0,0,['переохолодженням'],0,3], otit:[2,0,0,['перенесеною ГРВІ'],0,3], sinus:[10,0,1,['перенесеною ГРВІ'],0,3], bronch:[5,0,0,['перенесеною ГРВІ'],0,3],
  lbp:[5,0,0,['підйомом важкого'],0,3], anem:[3,2,1,[],0,0], hypot:[6,2,1,[],0,0], gerd:[6,2,1,['порушенням дієти'],0,3], urtic:[1,0,0,[],0,0],
  insom:[2,2,1,['психоемоційним стресом'],0,3], anx:[6,2,1,['психоемоційним стресом'],0,0],
  dyslip:[0,0,-1,[],-1,0,'Підвищений рівень холестерину виявлено під час обстеження.'], gout:[1,0,0,['вживанням алкоголю','порушенням дієти'],1,3],
  prof:[0,0,-1,[],-1,-1,'Звернення з метою профілактичного медичного огляду.']
};
const ANH_EMD = ['stroke','tia','app','chol','panc','gib','obstr','perf','hern','mening','epi','af','hf','copd','asthma','tcmt','thip','tspine','tdr','tclav','tdisl','trib'];
/* поле, заповнене заготовкою, переписується наступною заготовкою; змінене лікарем — ні */
function autoSet(f, v){
  if (!f) return;
  if (f.type === 'sel'){ const cur = f.el.value; if (cur !== '' && cur !== f.autoV) return; f.el.value = v < 0 || v == null ? '' : String(v); f.autoV = f.el.value; mark(f.el, f); return; }
  if (f.type === 'multi'){ const cur = f.chips.map((c,i)=>c.getAttribute('aria-pressed') === 'true' ? i : -1).filter(i=>i >= 0).join(); if (cur !== '' && cur !== f.autoV) return;
    pick(f, v || []); f.autoV = f.chips.map((c,i)=>c.getAttribute('aria-pressed') === 'true' ? i : -1).filter(i=>i >= 0).join(); return; }
  if (f.type === 'numsel'){ const cur = f.inp.value + '|' + f.unit.value; if (f.inp.value !== '' && cur !== f.autoV) return;
    f.inp.value = v && v[0] ? v[0] : ''; if (v) f.unit.value = v[1]; f.autoV = f.inp.value + '|' + f.unit.value; return; }
  if (f.type === 'text' || f.type === 'line'){ const cur = f.el.value; if (cur !== '' && cur !== f.autoV) return; f.el.value = v || ''; f.autoV = f.el.value; }
}
function anPreset(p){
  const a = ANH[p.key], tr = p.group === 'tr';
  if (!tr){
    autoSet(F('morbi.dur'), a && a[0] ? [a[0], a[1]] : null);
    autoSet(F('morbi.onset'), a ? a[2] : -1);
    autoSet(F('morbi.prych'), a ? a[3] : []);
    autoSet(F('morbi.hron'), a ? a[4] : -1);
    autoSet(F('morbi.likuv'), a ? a[5] : -1);
    autoSet(F('morbi.ax'), a && a[6] ? a[6] : '');
  }
  autoSet(F('morbi.hosp'), p.key && ANH_EMD.includes(p.key) ? 2 : p.hosp === 'p' ? 3 : 0);
  autoSet(F('morbi.zvern'), 0);
  if (!(p.skarhy || []).length) autoSet(F('skarhy.none'), 2); else autoSet(F('skarhy.none'), -1);
  // анамнез життя — типові «не обтяжено», лише в порожні поля
  SECTIONS.find(x=>x.id === 'vitae').fields.forEach(f=>{ if (f.type === 'sel' && f.norm !== undefined && f.el.value === ''){ f.el.value = f.norm; mark(f.el, f); } });
  { const t = F('vitae.tet'); if (tr && t && t.el.value === '') autoSet(t, 3); }
}
/* план: жінкам 15–50 р. з болем у животі — тест на вагітність (і гінеколог при болю внизу живота); консультацію фаху самого лікаря не призначаємо */
const ABD_F = {app:2, chol:1, panc:1, gib:1, obstr:2, hern:1, perf:2, colic:2, pyelo:2, cyst:1};
const FEM_PLAN = ['тест на вагітність (ХГЛ)','консультація гінеколога'];
function femPlan(key){ const a = parseInt(mv('age'), 10), k = ABD_F[key];
  return sex === 'f' && k && (isNaN(a) || (a >= 15 && a <= 50)) ? FEM_PLAN.slice(0, k) : []; }
function ownSpec(t){ const m = t.match(/^консультація (.+)$/), pos = (mv('pos') || '').toLowerCase(); if (!m || !pos) return false;
  return pos.includes(m[1].toLowerCase().replace(/[ая]$/, '')); }
function planAdjust(p){ pick(F('dx.plan'), [...(p.plan || []).filter(t=>!ownSpec(t)), ...femPlan(p.key)]); }
function sexPlan(){   // стать змінили вже після вибору хвороби
  if (!curKey || !ABD_F[curKey]) return; const f = F('dx.plan'), want = femPlan(curKey);
  FEM_PLAN.forEach(t=>{ const i = f.opts.findIndex(o=>O(o).t === t); if (i < 0) return; const c = f.chips[i], on = want.includes(t);
    if (on && c.getAttribute('aria-pressed') !== 'true'){ c.setAttribute('aria-pressed','true'); c.dataset.ord = ++ORD; }
    if (!on && c.getAttribute('aria-pressed') === 'true'){ c.setAttribute('aria-pressed','false'); delete c.dataset.ord; } });
  refreshChips(f); }
/* неврологічний статус одним рядком для хірургії та сімейної медицини, якщо заготовка його не описує */
function nevrShort(p){
  if (!['hir','fam'].includes(p.group) || Object.keys(p.set || {}).some(k=>k.startsWith('nevr.'))) return;
  const s = SECTIONS.find(x=>x.id === 'nevr'), b = s.fields.find(f=>f.bo); if (!b) return;
  s.fields.forEach(f=>{ if (f.type === 'sel' && !f.bo && f.norm !== undefined){ f.el.value = ''; mark(f.el, f); } });
  const i = b.opts.findIndex(o=>/Вогнищевої/.test(O(o).t)); b.el.value = i >= 0 ? i : 0; mark(b.el, b);
}
function applyPreset(p0, btn){
  const p = sidePreset(p0); dxPanel.sel = null; dxPanel.key = undefined;
  SECTIONS.filter(s=>s.objective && !DSEC.includes(s.id)).forEach(applyNorm);   // щоденник не чіпаємо: перший запис заповниться з огляду
  { const L = SECTIONS.find(x=>x.id === 'loc'); if (L) clearSection(L); }
  nevrShort(p0);
  pick(F('skarhy.c'), p.skarhy); detPick(F('skarhy.c'), p.det);
  for (const k in p.set){
    const f = F(k);
    if (!f){ console.warn('Немає поля', k); continue; }
    if (Array.isArray(p.set[k])){ pick(f, p.set[k]); continue; }
    if (f.type === 'line' || f.type === 'text'){ f.el.value = p.set[k]; continue; }
    const i = f.opts.findIndex(o=>O(o).t === p.set[k]);
    if (i < 0){ console.warn('Немає варіанту', k, p.set[k]); continue; }
    f.el.value = i; mark(f.el, f);
  }
  anPreset(p0);
  F('dx.osn').el.value = p.osn || '';
  F('dx.mkh').el.value = p.mkh || '';
  F('dx.uskl').el.value = p.uskl || '';
  planAdjust(p);
  icpcAuto(p);
  curKey = p.key || null;
  if (!RX.length || (RX_AUTO && rxSig() === RX_AUTO)){ RX.length = 0; rxFor(p0).forEach(r=>addRx({drug:r[0], dose:r[1], route:r[2], freq:r[3], days:r[4] || '', note:r[5]})); RX_AUTO = rxSig(); RX_VAR = 'Базова схема'; RX_PREV = null; }
  renderHvTips();
  { RXG = null; const rb = document.getElementById('rxSets'); if (rb && rb.draw) rb.draw(); }
  rxVarRedraw();
  if (MODE === 'hosp'){ const hv = F('hosp.vyd'); hv.el.value = p.hosp === 'p' && HOSPDEF !== 'e' ? 1 : 0; mark(hv.el, hv); }
  else { const va = F('hosp.vyda'); va.el.value = ''; va.autoSet = true; }
  { const sf = F('hosp.spec'); if (!sf.urgUser) sf.urg = false; }
  pick(F('hosp.spec'), []); pick(F('hosp.gen'), []);
  HV.cards.forEach((c,k)=>c.setAttribute('aria-pressed', c === btn || (PRESETS[k] && PRESETS[k].key === p0.key) ? 'true' : 'false'));
  update();
  const noBoth = SIDE === 'b' && p0.sides && !p0.both;
  toast(p.warn ? p.warn : 'Заповнено: ' + p.name + (noBoth ? ' — двобічного варіанта немає, заповнено справа' : ''), p.warn ? 5000 : noBoth ? 3500 : 1600);
  if (!mv('pib')){ show(TABS.indexOf(META)); const pi = document.getElementById('meta_pib'); if (pi){ pi.focus({preventScroll:false}); pi.scrollIntoView({block:'center'}); } toast((p.warn ? p.warn + ' · ' : 'Заповнено: ' + p.name + '. ') + 'Впишіть ПІБ пацієнта', p.warn ? 5000 : 2500); }
  else show(TABS.indexOf(SECTIONS[0]));
}

function toast(m, ms){ const t=$('#toast'); t.textContent=m; t.classList.add('on'); clearTimeout(toast.h); toast.h=setTimeout(()=>t.classList.remove('on'), ms||1600); }

function copy(){
  chkWarn();
  const el = $('#out'); const text = itext(el).replace(/\n{3,}/g, '\n\n').trim();
  if (!text){ toast('Текст порожній'); return; }
  const warn = [];
  if (text.includes('…')) warn.push('є незаповнені «…»');
  if (!sex && rawTokens && !dirty) warn.push('не вибрано стать');
  const done = ok => toast((ok ? 'Скопійовано' : 'Виділено, натисніть Ctrl+C') + (warn.length ? '. Увага: ' + warn.join(', ') : ''), warn.length ? 4000 : 1600);
  const fallback = ()=>{
    const ta = h('textarea', {readonly:'', style:'position:fixed;left:-9999px;top:0'});
    ta.value = text; document.body.append(ta); ta.focus(); ta.select();
    let ok = false; try{ ok = document.execCommand('copy'); }catch(e){}
    ta.remove();
    if (!ok){
      $('#outBox').classList.add('open');
      const r = document.createRange(); r.selectNodeContents(el);
      const sel = getSelection(); sel.removeAllRanges(); sel.addRange(r);
    }
    done(ok);
  };
  try{
    if (window.ClipboardItem && navigator.clipboard && navigator.clipboard.write){
      const html = '<div>' + el.innerHTML + '</div>';
      navigator.clipboard.write([new ClipboardItem({
        'text/html': new Blob([html], {type:'text/html'}),
        'text/plain': new Blob([text], {type:'text/plain'})
      })]).then(()=>done(true), fallback);
      return;
    }
  }catch(e){}
  fallback();
}
