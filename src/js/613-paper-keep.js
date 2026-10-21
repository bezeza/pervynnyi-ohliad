/* ===== Аркуш «Перед друком» не стрибає на початок (0.9.3.27) =====
   Після кожної зміни зліва аркуш перебудовується. Тепер він лишається на тому самому місці, а якщо ви перед тим
   клацнули пункт на аркуші — показує саме цей пункт (з уже внесеним). ===== */
const PKEEP = {txt:'', t:0};
const pScroller = el => { for (let e = el; e && e !== document.body; e = e.parentElement){ const cs = getComputedStyle(e); if (/(auto|scroll)/.test(cs.overflowY) && e.scrollHeight > e.clientHeight + 2) return e; } return null; };
const PK_SEL = '.brow, .bt2, .bob, .bdl, .blines, [data-sec], .pr-body p, .pr-body div';
document.addEventListener('click', e=>{
  const t = e.target; if (!t.closest || !t.closest('#paper')) return;
  const row = t.closest(PK_SEL); if (!row) return;
  PKEEP.txt = row.textContent.replace(/\s+/g, ' ').trim().slice(0, 28); PKEEP.t = Date.now();
}, true);
{ const rp = renderPaper; renderPaper = function(){
    if (typeof PAPER !== 'undefined' && !PAPER) return rp.apply(this, arguments);   /* аркуш не показано — нічого не міряти */
    const pp = $('#paper'), sc = pp && !pp.hidden ? (pScroller(pp.querySelector('.sheet') || pp) || pp) : null;
    const top = sc ? sc.scrollTop : 0;
    const r = rp.apply(this, arguments);
    try{
      if (!pp || pp.hidden || !sc) return r;
      if (pp.querySelector('mark.chg, .flash')) return r;            // аркуш сам показав змінене
      const recent = PKEEP.txt && Date.now() - PKEEP.t < 10 * 60 * 1000;
      const key = PKEEP.txt.slice(0, 18);
      const hit = recent && key ? [...pp.querySelectorAll(PK_SEL)].find(x=>x.textContent.replace(/\s+/g, ' ').trim().startsWith(key)) : null;
      if (hit){ const a = hit.getBoundingClientRect(), b = sc.getBoundingClientRect(); sc.scrollTop += (a.top - b.top) - Math.max(40, (b.height - a.height) / 3); }
      else sc.scrollTop = top;
    }catch(e){}
    return r; }; }
/* змінили поле зліва → аркуш показує відповідний пункт (зворотний бік «клік по аркушу → поле») */
const PLEFT = {key:'', t:0, kons:false};
let FKMAP = null;
function fieldKeyOf(el){
  if (!FKMAP){ FKMAP = new Map(); SECTIONS.forEach(s=>s.fields.forEach(f=>{ if (f.wrapEl) FKMAP.set(f.wrapEl, s.id + '.' + f.id); })); }
  for (let e = el; e && e.id !== 'panels'; e = e.parentElement){ const k = FKMAP.get(e); if (k) return k; }
  const m = el.closest && el.closest('[id^="meta_"]'); return m ? m.id : '';
}
['input', 'change', 'click'].forEach(ev=>document.addEventListener(ev, e=>{
  if (!e.isTrusted) return; const t = e.target; if (!t.closest || !t.closest('#panels')) return;
  const k = fieldKeyOf(t); if (!k) return;
  PLEFT.key = k; PLEFT.t = Date.now(); PLEFT.kons = /^консультація/i.test((t.closest('.chip') || {}).textContent || '');
}, true));
function bmapRowFor(key, kons){
  if (typeof BMAP === 'undefined') return null;
  const sec = key.split(/[._]/)[0], cand = BMAP.filter(([, k])=>k === key || k.split('#')[0] === key);
  const L = kons ? BMAP.filter(([, k])=>/#Консультац/.test(k)) : cand.length ? cand : BMAP.filter(([, k])=>k === sec || k.split('.')[0] === sec);
  const rows = [...document.querySelectorAll('#paper ' + PK_SEL.split(', ').join(', #paper '))];
  for (const [re] of L){ const r = rows.find(x=>re.test(x.textContent.replace(/\s+/g, ' ').trim())); if (r) return r; }
  return null;
}
{ const rp = renderPaper; renderPaper = function(){
    const r = rp.apply(this, arguments);
    try{
      if (!PLEFT.key || Date.now() - PLEFT.t > 4000 || (typeof PAPER !== 'undefined' && !PAPER)) return r;
      const pp = $('#paper'); if (!pp || pp.hidden) return r;
      const row = bmapRowFor(PLEFT.key, PLEFT.kons); if (!row) return r;
      const sc = pScroller(row) || pp, a = row.getBoundingClientRect(), b = sc.getBoundingClientRect();
      if (a.top < b.top + 30 || a.bottom > b.bottom - 30) sc.scrollTop += (a.top - b.top) - Math.max(40, (b.height - a.height) / 3);
      PKEEP.txt = row.textContent.replace(/\s+/g, ' ').trim().slice(0, 28); PKEEP.t = Date.now();
    }catch(e){}
    return r; }; }
/* клік по пункту «ОБСТЕЖЕННЯ» на бланку 003/о — додати до плану або прибрати */
document.addEventListener('click', e=>{
  const row = e.target.closest && e.target.closest('#paper .bobk[data-ob]'); if (!row) return;
  e.stopPropagation(); e.preventDefault();
  const n = +row.dataset.ob, nm0 = B003OB[n - 1], name = /^[А-ЯІЇЄҐ][а-яіїєґ’]/.test(nm0) ? nm0[0].toLowerCase() + nm0.slice(1) : nm0, P = F('dx.plan'), PO = F('dx.plano');
  const idx = P.opts.map((o, i)=>[O(o).t, i]).filter(([t])=>B003MAP.some(([re, ns])=>ns.includes(n) && re.test(t))).map(([, i])=>i);
  const onIdx = idx.find(i=>P.chips[i].getAttribute('aria-pressed') === 'true');
  const list = (PO.el.value || '').split(/[;,]\s*/).map(x=>x.trim()).filter(Boolean), inList = list.findIndex(x=>x.toLowerCase() === name.toLowerCase());
  let msg;
  if (onIdx !== undefined){ P.chips[onIdx].click(); msg = 'Прибрано з плану: ' + O(P.opts[onIdx]).t; }
  else if (inList >= 0){ list.splice(inList, 1); PO.el.value = list.join('; '); update(); msg = 'Прибрано з плану: ' + name; }
  else if (idx.length){ P.chips[idx[0]].click(); msg = 'Додано до плану: ' + O(P.opts[idx[0]]).t + (B003MAP.find(([re])=>re.test(O(P.opts[idx[0]]).t))[1].length > 1 ? ' (позначає кілька пунктів бланка)' : ''); }
  else { list.push(name); PO.el.value = list.join('; '); update(); msg = 'Додано до плану: ' + name; }
  toast(msg, 2200);
}, true);
