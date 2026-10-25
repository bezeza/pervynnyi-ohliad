/* ===== 0.9.3.60 — шаблон хвороби допомагає, а не примушує =====
   Лікар спершу опитує й оглядає, а діагноз ставить потім. Тому:
   • програма відкривається на «Скаргах», а не на «За хворобою»; шаблон — за бажанням;
   • якщо скарги, анамнез, огляд, діагноз чи лікування вже заповнені, шаблон не перезаписує їх мовчки:
     віконце «Що взяти з шаблону» з галочками; діагноз, план і лікування — увімкнено, а вже заповнене вами
     (скарги, анамнез, огляд) — вимкнено; ніщо не зміниться без вашого вибору;
   • під скаргами — ненав’язлива підказка «Схоже на: … — заповнити за шаблоном?» (за збігом скарг). */
const ST_CAT = [
  {k:'skarhy', l:'Скарги', secs:()=>['skarhy']},
  {k:'morbi', l:'Анамнез хвороби (типовий)', secs:()=>['morbi']},
  {k:'exam', l:'Огляд: зміни в системах', secs:()=>OBJ_OHL()},
  {k:'dx', l:'Діагноз і код МКХ-10', secs:()=>['dx']},
  {k:'plan', l:'План обстеження', plan:true},
  {k:'rx', l:'Лікування (типова схема)', rx:true}
];
const stPlanSave = () => { const f = F('dx.plan'); return f.chips.map(c=>({p:c.getAttribute('aria-pressed') === 'true', o:c.dataset.ord})); };
const stPlanLoad = d => { const f = F('dx.plan'); f.chips.forEach((c, i)=>{ const x = d[i]; if (!x) return; c.setAttribute('aria-pressed', x.p ? 'true' : 'false'); if (x.o) c.dataset.ord = x.o; else delete c.dataset.ord; }); refreshChips(f); };
const stPlanHas = () => F('dx.plan').chips.some(c=>c.getAttribute('aria-pressed') === 'true');
/* що в пацієнта вже заповнив сам лікар (автозаповнене шаблоном чи «Нормою» — не рахується) */
function stOwn(){
  const own = [];
  ST_CAT.forEach(c=>{
    if (c.rx){ if (RX.length && !(RX_AUTO && rxSig() === RX_AUTO)) own.push(c.k); return; }
    if (c.plan){ if (stPlanHas() && !curKey) own.push(c.k); return; }
    if (userSecs(c.secs()).length) own.push(c.k);
  });
  return own;
}
let ST_BUSY = false;
{ const x0 = applyPreset;
  applyPreset = function(p0, btn){
    if (ST_BUSY || RESTORING || DOC !== 'ohl' || !AGATE || (curKey && p0 && curKey === p0.key)) return x0.apply(this, arguments);
    const own = stOwn();
    if (!own.length) return x0.apply(this, arguments);
    const self = this;
    stDialog(p0, own, sel => {
      const skip = ST_CAT.filter(c=>!sel.includes(c.k));
      const saved = skip.filter(c=>c.secs).flatMap(c=>c.secs().map(id=>SECTIONS.find(x=>x.id === id)).filter(Boolean).map(s=>[s, secSave(s)]));
      const plan0 = stPlanSave(), rx0 = JSON.parse(JSON.stringify(RX)), rxa0 = RX_AUTO, rxv0 = RX_VAR;
      ST_BUSY = true; const ag = AGATE; AGATE = false;
      try{ x0.call(self, p0, btn); } finally { AGATE = ag; ST_BUSY = false; }
      const plan1 = stPlanSave();
      saved.forEach(([s, d])=>secLoad(s, d));
      stPlanLoad(sel.includes('plan') ? plan1 : plan0);
      if (!sel.includes('rx')){ RX.length = 0; rx0.forEach(r=>RX.push(r)); RX_AUTO = rxa0; RX_VAR = rxv0; try{ rxVarRedraw(); }catch(e){} }
      { const o = arevGet(); saved.forEach(([s])=>delete o[s.id]); arevSet(o); }
      try{ drawAuto(); }catch(e){} update();
      const t = ST_CAT.filter(c=>sel.includes(c.k)).map(c=>c.l.split(/ \(|,| і /)[0].toLowerCase());
      toast('З шаблону «' + p0.name + '» взято: ' + t.join(', ') + '. Ваші записи лишились.', 3500);
      if (mv('pib')) show(TABS.indexOf(TABS.find(x=>x.id === (sel.includes('dx') ? 'dx' : sel[0] === 'exam' ? 'zah' : 'skarhy'))));
    });
  };
}
function stDialog(p0, own, go){
  const sh = h('div', {class:'navsheet actsheet stsheet', role:'dialog', 'aria-modal':'true', 'aria-label':'Що взяти з шаблону'});
  const close = () => { sh.remove(); document.body.style.overflow = ''; };
  const boxes = ST_CAT.map(c=>{
    const mine = own.includes(c.k), on = !mine || ['dx','plan','rx'].includes(c.k);
    const cb = h('input', {type:'checkbox', id:'st_' + c.k}); cb.checked = on;
    return {c, cb, row:h('label', {class:'st-row', for:'st_' + c.k}, cb, h('span', {}, h('b', {}, c.l),
      h('small', {}, mine ? (['dx','plan','rx'].includes(c.k) ? 'у вас уже є — шаблон замінить' : 'заповнено вами — залишиться ваше') : 'заповнить шаблон')))};
  });
  sh.append(
    h('div', {class:'nshead'}, h('b', {}, 'Що взяти з шаблону'), h('button', {type:'button', class:'btn', onclick:close}, 'Скасувати')),
    h('p', {class:'st-lead'}, '«' + p0.name + '»' + (p0.mkh ? ' (' + p0.mkh + ')' : '') + '. Позначене — заповниться з шаблону; решта лишиться як є.'),
    h('div', {class:'st-list'}, ...boxes.map(b=>b.row)),
    h('div', {class:'st-foot'}, h('button', {type:'button', class:'btn primary', onclick:()=>{ const sel = boxes.filter(b=>b.cb.checked).map(b=>b.c.k); close(); if (sel.length) go(sel); }}, 'Взяти позначене')));
  sh.addEventListener('click', e=>{ if (e.target === sh) close(); });
  sh.addEventListener('keydown', e=>{ if (e.key === 'Escape') close(); });
  document.body.append(sh); document.body.style.overflow = 'hidden';
  const f = sh.querySelector('.st-foot .btn'); if (f) f.focus();
}
/* підказка під скаргами: «Схоже на: …» */
function stGuess(){
  const f = F('skarhy.c'); if (!f) return [];
  const mine = f.chips.map((c, i)=>c.getAttribute('aria-pressed') === 'true' ? O(f.opts[i]).t : null).filter(Boolean);
  if (mine.length < 2) return [];
  const vis = new Set((HV.cards || []).map((c, k)=>c.hidden || c.style.display === 'none' ? -1 : k));
  return PRESETS.map((p, k)=>{ const s = p.skarhy || []; const hit = mine.filter(t=>s.includes(t)).length;
      return {p, k, hit, sc:hit + (s[0] && mine.includes(s[0]) ? 0.5 : 0) + (vis.has(k) ? 0.3 : 0)}; })
    .filter(x=>x.p.name && x.hit >= 2).sort((a, b)=>b.sc - a.sc).slice(0, 3);
}
const ST_HINT = h('div', {class:'st-hint', hidden:''});
function stHintRender(){
  const t = TABS.find(x=>x.id === 'skarhy'); if (!t || !t.panel) return;
  const f = F('skarhy.c'), box = f && f.chips && f.chips[0] && f.chips[0].closest('.f');
  if (box && ST_HINT.previousElementSibling !== box) box.after(ST_HINT);
  const G = DOC === 'ohl' && !curKey ? stGuess() : [];
  ST_HINT.hidden = !G.length; ST_HINT.replaceChildren();
  if (!G.length) return;
  ST_HINT.append(h('span', {class:'st-hl'}, 'Схоже на:'),
    ...G.map(g=>h('button', {type:'button', class:'btn st-g', title:'Заповнити за шаблоном «' + g.p.name + '» — ви оберете, що взяти', onclick:()=>{ const c = HV.cards && HV.cards[g.k]; if (c) c.click(); else applyPreset(g.p); }}, g.p.name)),
    h('span', {class:'st-hn'}, '— за бажанням: шаблон підставить діагноз, план і лікування'));
}
{ let tm = 0; const x0 = update; update = function(){ const r = x0.apply(this, arguments); clearTimeout(tm); tm = setTimeout(()=>{ try{ stHintRender(); }catch(e){} }, 250); return r; }; }
/* «За хворобою» — м’якше: за бажанням */
{ const lead = HV.panel && HV.panel.querySelector('p.lead');
  if (lead) lead.textContent = 'За бажанням. Спершу опитайте й огляньте пацієнта — тоді шаблон допоможе з діагнозом, планом обстеження й лікуванням. Якщо щось уже заповнено, програма спитає, що взяти з шаблону; ваші записи без вашого вибору не зміняться.'; }
stHintRender();
