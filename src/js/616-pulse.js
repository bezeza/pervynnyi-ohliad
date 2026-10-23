/* ===== ЧСС і пульс (0.9.3.30): при правильному ритмі — одне число («ЧСС = пульс …»); поле «Пульс» з’являється лише при
   аритмії (ритм неправильний / екстрасистолія або «аритмічний» у характері пульсу) — тоді в тексті ЧСС, пульс і дефіцит пульсу. ===== */
{ const C = F('ssc.chss'), Pf = F('ssc.ps'), PS = F('ssc.psch'), R = F('ssc.rytm');
  if (C && Pf && C.inputs && Pf.inputs){
    const arr = () => (R && R.el && ['1','2'].includes(R.el.value)) || (PS && PS.el && ['1','2'].includes(PS.el.value));
    const pv = () => Pf.inputs[0].value.trim(), cv = () => C.inputs[0].value.trim();
    C.fmt = v => { if (!v[0]) return ''; const p = pv().replace('.', ',');
      if (arr() && p && p !== v[0]){ const d = num(v[0]) - num(p); return `ЧСС ${v[0]} уд./хв, пульс ${p} уд./хв` + (d > 0 ? `, дефіцит пульсу ${d}` : ''); }
      return arr() ? `ЧСС ${v[0]} уд./хв` : `ЧСС = пульс ${v[0]} уд./хв`; };
    Pf.fmt = v => cv() ? '' : (v[0] ? `Пульс ${v[0]} уд./хв` : '');
    const lb = C.wrapEl && C.wrapEl.querySelector('label'); if (lb) lb.firstChild && (lb.firstChild.textContent = 'ЧСС (= пульс, якщо ритм правильний)');
    const pl = Pf.wrapEl && Pf.wrapEl.querySelector('label'); if (pl) pl.firstChild && (pl.firstChild.textContent = 'Пульс на променевій артерії (при аритмії)');
    const up = update; update = function(){ const r = up.apply(this, arguments);
      try{ if (Pf.wrapEl && Pf.wrapEl.dataset.only === undefined){ const show = arr() || (!!pv() && !cv()); Pf.wrapEl.hidden = !show || !(SECTIONS.find(x=>x.id === 'ssc').docs.includes(DOC)); } }catch(e){}
      return r; };
  } }
