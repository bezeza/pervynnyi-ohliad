/* ===== 0.9.3.74 — епікриз: «за власним бажанням» і динаміка аналізів =====
   • Результат «Виписується за власним бажанням» (у кінці списку — збережені картки не змінюються);
     у «Перевірці» — нагадування оформити письмову відмову пацієнта від подальшого лікування.
   • «Результати обстежень»: кнопка «± Динаміка аналізів з журналу» — для аналізів, зроблених двічі й більше,
     дописує рядок «Hb 112 → 124 г/л; лейк. 14,2 → 7,8 ×10⁹/л» (значення лише з журналу обстежень, нічого не додумується).
   Ліжко-дні й дата підпису вже беруться з періоду лікування (наказ МОЗ № 110). */
const EPI_OWN = 'Виписується за власним бажанням';
try{
  const f = F('e_lik.rez');
  if (f && !f.opts.some(o=>O(o).t === EPI_OWN)){
    f.opts.push(EPI_OWN); f.el.append(h('option', {value:String(f.opts.length - 1)}, EPI_OWN));
    const box = f.el.nextElementSibling; if (box && box.classList.contains('segbtns')){ box.remove(); f.el.classList.remove('seg-hidden'); f.seg = undefined; try{ segFor(f); }catch(e){} }
  }
}catch(e){}
const epiOwnWish = () => { try{ const f = F('e_lik.rez'); return f.el.value !== '' && O(f.opts[+f.el.value]).t === EPI_OWN; }catch(e){ return false; } };
{ const x0 = checkDoc; checkDoc = function(){ const L = x0.apply(this, arguments);
  try{ if (DOC === 'epi' && L && epiOwnWish() && itext($('#out')).trim()) L.push({m:'Виписка за власним бажанням: оформіть письмову відмову пацієнта від подальшого лікування й зазначте це в епікризі', tab:'e_lik', f:'e_lik.rez'}); }catch(e){}
  return L; }; }

/* ---------- динаміка аналізів з журналу ---------- */
function epiDynamics(){
  const out = [], byT = {};
  (RES || []).forEach(r=>{ if (LABS[r.t]) (byT[r.t] = byT[r.t] || []).push(r); });
  Object.keys(byT).forEach(t=>{
    const L = byT[t].slice().sort((a,b)=>String(a.d).localeCompare(String(b.d))); if (L.length < 2) return;
    const parts = [];
    LABS[t].forEach(p=>{
      const re = new RegExp('(?:^|[\\s,;(])' + p[0].replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\s*([\\d]+(?:[.,][\\d]+)?)', 'i');
      const vals = L.map(r=>{ const m = re.exec(' ' + r.v); return m ? m[1] : null; }).filter(Boolean);
      if (vals.length >= 2 && vals.some(v=>v !== vals[0])) parts.push(`${p[0]} ${vals.join(' → ')}${p[1] ? ' ' + p[1] : ''}`);
    });
    if (parts.length) out.push(`${cap(t)} (${L.map(r=>fmtS(r.d)).join(' → ')}): ${parts.join('; ')}.`);
  });
  return out.join('\n');
}
try{
  const S = SECTIONS.find(x=>x.id === 'e_obs'), f = F('e_obs.obs');
  if (S && S.panel && f && f.el && !S.panel.querySelector('.epidyn')){
    const b = h('button', {type:'button', class:'btn epidyn', title:'Дописати динаміку аналізів, зроблених двічі й більше (з журналу обстежень)', onclick:()=>{
      const t = epiDynamics(); if (!t){ toast('У журналі обстежень немає аналізів, зроблених двічі й більше'); return; }
      const cur = f.el.value.trim(); if (cur.includes(t)){ toast('Динаміку вже дописано'); return; }
      f.el.value = (cur ? cur + '\n' : '') + 'Динаміка: ' + t; f.el.dispatchEvent(new Event('input', {bubbles:true})); update(); toast('Динаміку аналізів дописано'); }}, '± Динаміка аналізів з журналу');
    (f.wrapEl || f.el.parentNode).append(h('div', {class:'acts2'}, b));
  }
}catch(e){}
