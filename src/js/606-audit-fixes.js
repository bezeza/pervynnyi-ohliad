/* ===== Знахідки наскрізного аудиту сценарію лікаря (0.9.3.18) ===== */
/* «Записати в журнал» щоденника — завжди під рукою на панелі тексту, а не лише у вкладці «Запис» */
{ const acts = $('#outBox .oh .acts');
  if (acts){
    const b = h('button', {type:'button', class:'btn primary dsavebtn', id:'dSaveTop', hidden:true, title:'Записати поточний запис щоденника в журнал записів пацієнта', onclick:()=>saveDiary()}, '📓', h('span', {class:'hide-m'}, ' Записати в журнал'));
    acts.prepend(b);
    const mb = $('.mbar'), cp = $('#copy2'), mbd = h('button', {type:'button', class:'btn primary', id:'mbDSave', hidden:true, 'aria-label':'Записати в журнал щоденника', onclick:()=>saveDiary()}, '📓 Записати');
    if (mb && cp) cp.before(mbd);
    const sync = () => { const d = DOC === 'shch'; b.hidden = !d; mbd.hidden = !d; document.body.classList.toggle('doc-shch', d); };
    const sd = switchDoc; switchDoc = function(){ const r = sd.apply(this, arguments); sync(); return r; };
    sync();
  } }
/* Дата й час кожного документа зберігаються окремо: перемикання документів або повторне відкриття пацієнта
   більше не замінює дату первинного огляду (епікризу, консультації…) на «зараз». Щоденник — як і раніше: кожен запис — своя дата. */
let DOCDT = {}, DTKEEP = null;
{ const md = () => document.getElementById('meta_dt');
  const sn = setNow; setNow = function(){ if (DTKEEP){ const e = md(); if (e) e.value = DTKEEP; DTKEEP = null; return; } return sn.apply(this, arguments); };
  const sd = switchDoc; switchDoc = function(nd){
    const od = DOC, e = md();
    if (od === nd || !e) return sd.apply(this, arguments);
    if (od !== 'shch' && e.value) DOCDT[od] = e.value;
    DTKEEP = nd !== 'shch' && DOCDT[nd] || null;
    let r; try{ r = sd.apply(this, arguments); } finally { DTKEEP = null; }
    if (nd !== 'shch' && DOCDT[nd] && e.value !== DOCDT[nd]){ e.value = DOCDT[nd]; try{ calcAge(); }catch(x){} if (!dirty) update(); }
    return r;
  };
  const sp = snap; snap = function(){ const s = sp.apply(this, arguments); const e = md(); s.dts = Object.assign({}, DOCDT); if (e && e.value && DOC !== 'shch') s.dts[DOC] = e.value; return s; };
  const rs = restore; restore = function(S){ DOCDT = Object.assign({}, S && S.dts || {}); if (S && !S.dts && S.f && S.f.meta_dt && (S.doc || 'ohl') !== 'shch') DOCDT[S.doc || 'ohl'] = S.f.meta_dt; return rs.apply(this, arguments); };
  const ca = clearAll; clearAll = function(forRestore){ if (!forRestore) DOCDT = {}; return ca.apply(this, arguments); };
  /* дата, яку лікар змінив уручну, одразу запам'ятовується для цього документа */
  document.addEventListener('input', ev=>{ if (ev.target && ev.target.id === 'meta_dt' && DOC !== 'shch' && ev.target.value) DOCDT[DOC] = ev.target.value; }, true);
}
/* дата первинного огляду — для «Зібрати виписку» */
examDateISO = function(){ const v = DOC === 'ohl' ? (document.getElementById('meta_dt') || {}).value : DOCDT.ohl; return String(v || '').split('T')[0]; };
/* після відкриття пацієнта на іншому документі (епікриз, щоденник) — не лишати відкритою вкладку, якої в цьому документі немає */
{ const rl = restoreLast; restoreLast = function(){ const r = rl.apply(this, arguments); try{ if (TABS[active] && TABS[active].tab.hidden){ const k = TABS.findIndex(t=>!t.tab.hidden); if (k >= 0) show(k); } }catch(e){} return r; }; }
