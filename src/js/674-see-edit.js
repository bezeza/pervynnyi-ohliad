/* 0.9.3.87 — «Бачу — редагую».
   Будується на вже наявних qeField/qeOpen (клік по фразі в тексті, 619) і peClick (клік по рядку бланка, 636):
   віконце лишається біля самого слова і показує варіанти цього поля, а не всю форму й не весь рядок.
   Свій варіант для списку пишеться в приховане поле *_see і потрапляє в документ через val(). */
const SE_OWN = new Map();
let SE_LOCK = 0, SE_POP = null, SE_UNDO = null;
function seSec(f){ return SECTIONS.find(s=>s.fields.includes(f)); }
function seKey(f){ const s = seSec(f); return s ? s.id + '.' + f.id : ''; }
function seResolve(key){
  if (!key) return null;
  if (String(key).includes('.')){ const f = F(key); if (f && f.wrapEl) return {f}; }
  const el = document.getElementById(key);
  if (el && /^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName)){
    const lb = document.querySelector('label[for="' + key + '"]');
    return {src:el, label: lb ? lb.textContent.trim() : ''};
  }
  return null;
}
function seOwnBox(f){
  let t = SE_OWN.get(f); if (t) return t;
  const s = seSec(f); if (!s || !f.wrapEl) return null;
  t = h('textarea', {id:s.id + '_' + f.id + '_see', hidden:'', rows:'2', 'aria-label':'Свій варіант: ' + f.label});
  f.wrapEl.append(t); SE_OWN.set(f, t); return t;
}
{ const x0 = val; val = function(f){ const t = SE_OWN.get(f); if (t && String(t.value || '').trim()) return String(t.value).trim(); return x0.apply(this, arguments); }; }
SECTIONS.forEach(s=>s.fields.forEach(f=>{
  if (f.type === 'sel' && f.el) f.el.addEventListener('change', ()=>{ if (SE_LOCK || RESTORING) return; const t = SE_OWN.get(f); if (t && f.el.value !== '') t.value = ''; }, true);
}));
{ const r0 = restore; restore = function(S){
  try{
    if (S && S.f) for (const id in S.f) if (/_see$/.test(id) && S.f[id]){
      const m = id.match(/^([a-z0-9]+)_([a-z0-9]+)_see$/); const f = m && F(m[1] + '.' + m[2]); if (f) seOwnBox(f);
    }
  }catch(e){}
  return r0.apply(this, arguments);
}; }

function seOnDoc(f){
  const s = seSec(f); if (!s) return false;
  if (s.docs && !s.docs.includes(DOC)) return false;
  if (f.docs && !f.docs.includes(DOC)) return false;
  if (f.only && f.only !== MODE) return false;
  return true;
}
function seBits(f){
  if (!seOnDoc(f)) return [];
  const out = [];
  if (f.type === 'sel' && f.el && f.opts && f.el.value !== ''){ const o = O(f.opts[+f.el.value] || ''); out.push(g(o.t), g(o.l)); }
  else if (f.type === 'multi' && f.opts && f.chips) f.chips.forEach((c,i)=>{ if (c.getAttribute('aria-pressed') === 'true'){ const o = O(f.opts[i]); out.push(g(o.t), g(o.l)); } });
  else { let v = ''; try{ v = val(f); }catch(e){} v = v ? g(String(v)) : ''; if (v && v.length <= 80) out.push(v); }
  return out.filter(t=>t && t.length >= 4);
}
function seSplit(node, jobs){
  const text = node.nodeValue; if (!text) return;
  let best = null;
  for (const j of jobs){ const i = text.indexOf(j.t); if (i < 0) continue; if (!best || j.t.length > best.t.length || (j.t.length === best.t.length && i < best.i)) best = {t:j.t, id:j.id, i}; }
  if (!best) return;
  const frag = document.createDocumentFragment();
  if (best.i) frag.append(text.slice(0, best.i));
  const sp = document.createElement('span');
  sp.className = 'se'; sp.dataset.se = best.id; sp.tabIndex = 0; sp.setAttribute('role', 'button');
  sp.title = 'Змінити цей фрагмент'; sp.textContent = best.t; frag.append(sp);
  const rest = text.slice(best.i + best.t.length);
  const restNode = rest ? document.createTextNode(rest) : null;
  if (restNode) frag.append(restNode);
  node.replaceWith(frag);
  if (restNode) seSplit(restNode, jobs);
}
function seMark(root){
  if (!root) return;
  const jobs = [];
  SECTIONS.forEach(s=>s.fields.forEach(f=>{ if (f.type === 'hdr' || f.noOut || f.headOnly || !f.wrapEl) return; seBits(f).forEach(t=>jobs.push({t, id:s.id + '.' + f.id})); }));
  jobs.sort((a,b)=>b.t.length - a.t.length);
  const tw = document.createTreeWalker(root, NodeFilter.SHOW_TEXT), nodes = [];
  while (tw.nextNode()){ const n = tw.currentNode, p = n.parentElement; if (!n.nodeValue || !n.nodeValue.trim()) continue; if (p && p.closest('.se, .gap, .see-pop, script, style, .gapbar, .blankbar')) continue; nodes.push(n); }
  nodes.forEach(n=>seSplit(n, jobs));
  root.querySelectorAll('.bf[data-dsel]').forEach(el=>{
    const key = el.dataset.dsel;
    if (!seResolve(key)) return;
    if (el.closest('.brow, .bt, .bt2, .blines')) el.classList.add('se');
    if (!el.dataset.se) el.dataset.se = key;
    if (!el.hasAttribute('tabindex')) el.tabIndex = 0;
    if (!el.getAttribute('role')) el.setAttribute('role', 'button');
    if (!el.title) el.title = 'Змінити цей фрагмент';
    if (el.classList.contains('empty') || !el.textContent.replace(/\u00a0/g, '').trim()) el.classList.add('se-empty');
  });
}
{ const x0 = renderPaper; renderPaper = function(){ const r = x0.apply(this, arguments); try{ seMark(document.getElementById('paper')); }catch(e){} return r; }; }

function seClose(){ if (SE_POP){ SE_POP.remove(); SE_POP = null; } }
function sePlace(pop, anchor){
  const r = anchor.getBoundingClientRect();
  const w = Math.min(340, window.innerWidth - 16);
  pop.style.position = 'fixed';
  pop.style.width = w + 'px';
  let left = r.left;
  if (left + w > window.innerWidth - 8) left = Math.max(8, window.innerWidth - w - 8);
  pop.style.left = left + 'px';
  pop.style.top = '0px';
  const h = pop.offsetHeight;
  let top = r.bottom + 6;
  if (top + h > window.innerHeight - 8) top = Math.max(8, r.top - h - 6);
  pop.style.top = top + 'px';
}
function seOpts(f){
  if (f.type === 'sel' && f.el && f.opts) return [...f.el.options].filter(o=>o.value !== '').map(o=>({label:o.textContent.trim(), value:o.value, on:o.value === f.el.value}));
  if (f.type === 'multi' && f.chips) return f.chips.map((c,i)=>({label:g(O(f.opts[i]).l), chip:c, on:c.getAttribute('aria-pressed') === 'true'}));
  return [];
}
function sePick(f, o){
  if (!SE_UNDO){ undoPush('фраза: ' + (f.label || '')); SE_UNDO = UNDO[UNDO.length - 1]; }
  if (o.value != null && f.type === 'sel'){
    SE_LOCK++; const own = SE_OWN.get(f); if (own) own.value = '';
    f.el.value = o.value; f.el.dispatchEvent(new Event('change', {bubbles:true})); SE_LOCK--;
    seClose(); return;
  }
  if (o.chip){ o.chip.click(); sePaint(); }
}
function seApplyOwn(hit, text){
  const t = String(text || '').trim(); if (!t) return;
  if (!SE_UNDO){ undoPush('свій варіант: ' + ((hit.f && hit.f.label) || hit.label || '')); SE_UNDO = UNDO[UNDO.length - 1]; }
  if (hit.src){ hit.src.value = t; hit.src.dispatchEvent(new Event('input', {bubbles:true})); seClose(); return; }
  const f = hit.f;
  if (f.type === 'sel'){ const own = seOwnBox(f); if (!own) return; SE_LOCK++; own.value = t; f.el.value = ''; f.el.dispatchEvent(new Event('change', {bubbles:true})); SE_LOCK--; seClose(); return; }
  if (f.type === 'multi'){
    const free = seSec(f) && seSec(f).fields.find(x=>x !== f && x.el && (x.id === 'cx' || x.id === 'dod') && (x.type === 'text' || x.type === 'line'));
    if (free){ free.el.value = free.el.value.trim() ? free.el.value.trim() + ' ' + t : t; free.el.dispatchEvent(new Event('input', {bubbles:true})); }
    seClose(); return;
  }
  if (f.el){ f.el.value = t; f.el.dispatchEvent(new Event('input', {bubbles:true})); seClose(); }
}
function sePaint(){
  const pop = SE_POP; if (!pop || !pop._hit || !pop._hit.f) return;
  const f = pop._hit.f, opts = seOpts(f);
  pop.querySelectorAll('.see-opt').forEach(b=>{ const o = opts[b.dataset.i]; if (!o) return; b.classList.toggle('on', !!o.on); b.setAttribute('aria-selected', o.on ? 'true' : 'false'); });
  const u = pop.querySelector('.see-undo'); if (u) u.disabled = !SE_UNDO || UNDO[UNDO.length - 1] !== SE_UNDO;
}
function seOpen(hit, anchor){
  if (!hit || !anchor) return false;
  seClose(); try{ qeClose(); }catch(e){}
  SE_UNDO = null;
  const f = hit.f, label = (f && f.label) || hit.label || 'Правка';
  const pop = h('div', {class:'see-pop', role:'dialog', 'aria-label':'Змінити: ' + label});
  pop._hit = hit;
  const head = h('div', {class:'see-h'}, label, h('button', {type:'button', class:'see-undo', disabled:'', title:'Скасувати', onclick:()=>{ if (!SE_UNDO || UNDO[UNDO.length - 1] !== SE_UNDO) return; const a = anchor; seClose(); undoLast(); if (a.isConnected) seOpen(hit, a); }}, '↶'), h('button', {type:'button', 'aria-label':'Закрити', title:'Закрити (Esc)', onclick:seClose}, '✕'));
  pop.append(head);
  if (f && f.type === 'num' && f.inputs){
    const row = h('div', {class:'see-nums'});
    f.inputs.forEach(src=>{
      const i = h('input', {inputmode:'decimal', value:src.value, 'aria-label':src.getAttribute('aria-label') || f.label});
      i.addEventListener('input', ()=>{ if (!SE_UNDO){ undoPush('показник: ' + f.label); SE_UNDO = UNDO[UNDO.length - 1]; } src.value = i.value; src.dispatchEvent(new Event('input', {bubbles:true})); });
      row.append(i, h('span', {}, (src.nextElementSibling && src.nextElementSibling.textContent) || ''));
    });
    pop.append(row);
  } else if (f){
    const opts = seOpts(f);
    const many = opts.length > 12;
    let q = null;
    if (many){ q = h('input', {type:'search', class:'see-find', placeholder:'Знайти варіант', 'aria-label':'Знайти варіант'}); pop.append(q); }
    const list = h('div', {class:'see-list', role:'listbox'});
    opts.forEach((o,i)=>{
      const b = h('button', {type:'button', class:'see-opt' + (o.on ? ' on' : ''), role:'option', 'aria-selected':o.on ? 'true' : 'false', 'data-i':String(i)});
      b.textContent = o.label;
      b.addEventListener('click', ()=>sePick(f, o));
      list.append(b);
    });
    pop.append(list);
    if (q) q.addEventListener('input', ()=>{ const s = q.value.trim().toLowerCase(); list.querySelectorAll('.see-opt').forEach(b=>{ b.hidden = s && !b.textContent.toLowerCase().includes(s); }); });
  }
  const own = h('input', {type:'text', placeholder:'Свій варіант', 'aria-label':'Свій варіант'});
  const go = ()=>seApplyOwn(hit, own.value);
  own.addEventListener('keydown', e=>{ if (e.key === 'Enter'){ e.preventDefault(); go(); } });
  pop.append(h('div', {class:'see-own'}, own, h('button', {type:'button', onclick:go}, 'Замінити')));
  pop.addEventListener('keydown', e=>{
    const bs = [...pop.querySelectorAll('.see-opt')].filter(b=>!b.hidden);
    if (e.key === 'Escape'){ e.preventDefault(); e.stopPropagation(); seClose(); return; }
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp'){ e.preventDefault(); if (!bs.length) return;
      let i = bs.findIndex(b=>b === pop.ownerDocument.activeElement); i = e.key === 'ArrowDown' ? (i + 1) % bs.length : (i <= 0 ? bs.length - 1 : i - 1); bs[i].focus(); return; }
    if (e.key === 'Enter' && pop.ownerDocument.activeElement && pop.ownerDocument.activeElement.classList.contains('see-opt')){ e.preventDefault(); pop.ownerDocument.activeElement.click(); }
  });
  document.body.append(pop); SE_POP = pop; sePlace(pop, anchor); sePaint();
  const cur = pop.querySelector('.see-opt.on') || pop.querySelector('.see-opt') || pop.querySelector('input');
  if (cur) cur.focus({preventScroll:true});
  return true;
}
{ const x0 = peClick; peClick = function(w, e){
  const hit = e.target && e.target.closest && e.target.closest('span.se, .bf.se[data-dsel]');
  if (hit && hit.dataset.se && !hit.matches('.brow, .bt, .bt2, .blines, .bdx') && (w !== window || hit.closest('#paper, #out'))){
    const item = seResolve(hit.dataset.se);
    if (item){ e.preventDefault(); e.stopImmediatePropagation(); seOpen(item, hit); return; }
  }
  return x0.apply(this, arguments);
}; }
document.addEventListener('keydown', e=>{
  if (!SE_POP && (e.key === 'Enter' || e.key === ' ') && e.target && e.target.classList && e.target.classList.contains('se')){
    const item = seResolve(e.target.dataset.se); if (!item) return; e.preventDefault(); seOpen(item, e.target);
  }
}, true);
document.addEventListener('pointerdown', e=>{ if (!SE_POP) return; if (SE_POP.contains(e.target)) return; if (e.target.closest && e.target.closest('.se')) return; seClose(); }, true);
window.addEventListener('scroll', ()=>{ if (SE_POP && SE_POP._hit){ const a = document.querySelector('.se[data-se="' + (SE_POP._hit.f ? seKey(SE_POP._hit.f) : '') + '"]'); if (a) sePlace(SE_POP, a); } }, true);
{ const s0 = switchDoc; switchDoc = function(){ seClose(); return s0.apply(this, arguments); }; }
