/* ===== Нирки (0.9.3): корекція доз — ширший перелік, ШКФ коли немає ваги, нагадування про креатинін ===== */
/* Пороги — за інструкціями (SmPC) і довідниками з корекції доз; у програмі — як нагадування, остаточно — за інструкцією препарату. */
const RENAL_EXTRA = {
  'валацикловір':[{lt:10, m:'500 мг кожні 24 год (оперізувальний герпес)'}, {lt:30, m:'1 г кожні 24 год'}, {lt:50, m:'1 г кожні 12 год'}],
  'ампіцилін':[{lt:10, m:'кожні 12–24 год'}, {lt:50, m:'кожні 6–12 год'}],
  'цефалексин':[{lt:15, m:'250 мг кожні 24 год'}, {lt:30, m:'250 мг кожні 8–12 год'}],
  'цефіксим':[{lt:20, m:'200 мг 1 р/д'}],
  'фосфоміцин':[{lt:10, m:'протипоказаний'}],
  'тетрациклін':[{lt:50, m:'уникати — доксициклін не потребує корекції дози'}],
  'тизанідин':[{lt:25, m:'почати з 2 мг 1 р/д, нарощувати повільно'}],
  'морфін':[{lt:30, m:'зменшити дозу й подовжити інтервал — накопичуються активні метаболіти'}],
  'дулоксетин':[{lt:30, m:'протипоказаний'}],
  'зопіклон':[{lt:30, m:'почати з 3,75 мг'}],
  'сакубітрил/валсартан':[{lt:30, m:'почати з 24/26 мг 2 р/д'}],
  'семаглутид':[{lt:15, m:'не рекомендований'}],
  'магнію сульфат':[{lt:30, m:'ризик гіпермагніємії — зменшити дозу, контроль магнію'}],
  'алопуринол':[{lt:30, m:'почати з 50 мг/добу, нарощувати повільно під контролем'}],
  'бісопролол':[{lt:20, m:'не більше 10 мг/добу'}],
  'інсулін гларгін':[{lt:30, m:'потреба в інсуліні зменшується — ризик гіпоглікемії, частіший контроль глюкози'}],
  'інсулін короткої дії':[{lt:30, m:'потреба в інсуліні зменшується — ризик гіпоглікемії, частіший контроль глюкози'}]
};
function egfrVal(){ const c = CALCS.find(x=>x.id === 'ckd'); return c && c.last && !c.last.msg ? parseInt(c.last.score) : NaN; }
/* функція нирок: кліренс (Кокрофт–Голт), а якщо немає ваги — ШКФ (CKD-EPI) */
function renalNow(){ const k = crclVal(); if (!isNaN(k)) return {v:k, l:'КК'}; const e = egfrVal(); if (!isNaN(e)) return {v:e, l:'ШКФ'}; return null; }
const renalRules = name => { const d = drugInfo(name); if (d && d.renal) return d.renal; return RENAL_EXTRA[String(name || '').trim().toLowerCase()] || null; };
renalMsg = function(it){
  const R = renalRules(it.drug), k = renalNow(); if (!R || !k) return '';
  const r = R.slice().sort((a,b)=>a.lt - b.lt).find(x=>k.v < x.lt);
  return r ? `${k.l} ${k.v} мл/хв: ${r.m} (перевірте за інструкцією)` : '';
};
/* перевірка перед підписом: є препарати з нирковою корекцією, а креатиніну немає */
{ const c0 = checkDoc;
  checkDoc = function(){
    const L = c0.apply(this, arguments);
    if (!itext($('#out')).trim() || !['ohl','shch','rx','epi'].includes(DOC)) return L;
    const d = todayISO(), need = RX.filter(it=>!it.stop || it.stop > d).filter(it=>renalRules(it.drug)).map(it=>it.drug);
    if (need.length && !renalNow()) L.push({m:`Немає креатиніну — дози за функцією нирок не перевірено (${need.slice(0, 3).join(', ')}${need.length > 3 ? '…' : ''})`, tab:'rxt'});
    return L;
  }; }
/* стрічка «Призначено»: короткий підсумок по нирках */
{ const rs0 = renderRxStrip;
  renderRxStrip = function(){
    const r = rs0.apply(this, arguments), s = $('#rxStrip'); if (!s || s.hidden) return r;
    const k = renalNow(), hits = RX.filter(it=>!it.stop && renalMsg(it)).map(it=>it.drug);
    if (hits.length) s.append(h('span', {class:'rxs-g rxs-renal'}, ` · ⚠ Нирки (${k.l} ${k.v}): перевірте дозу — ${hits.join(', ')}`));
    return r;
  }; }
