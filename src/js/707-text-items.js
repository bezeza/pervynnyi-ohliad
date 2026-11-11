/* ===== 0.9.3.125 · пункти в тексті та вікна, що рухаються (обговорення з лікарем 11.11.2026) =====
   1) Клік по окремому пункту в тексті огляду (панель «Текст», плаваюче вікно, смуга «У тексті огляду»)
      одразу прибирає саме цей пункт — ЗАК, ЕКГ, «головний біль»… Унизу «Прибрано «…» · Скасувати» (8 с).
      Клік по назві або фразі поля («План обстеження:») відкриває віконце з усіма варіантами — додати.
      Лише для полів із кількома варіантами (кнопки-чіпи); якщо виділяють текст — нічого не робимо.
   2) Віконце правки з тексту (.qe) і віконце «Бачу — редагую» на бланку (.see-pop) перетягуються за заголовок
      будь-куди на екрані; місце запам’ятовується (po.qepos, po.sepos). Подвійний клік по заголовку — на старе місце.
   3) Смуга «У тексті огляду» (705): кнопка «⇱» відкріплює її — тоді тягнеться за заголовок угору/вниз/убік
      і змінює розмір за кут; «A− / A+» — розмір шрифту. Усе запам’ятовується (po.tnbox); «⇲» — назад донизу.
   Медичний текст не змінюється: прибирання пункту — це те саме натискання кнопки-чіпа у формі. Лише ПК (≥ 900 px). */
const TI = {mq:window.matchMedia ? window.matchMedia('(min-width:900px)') : {matches:true}};
const tiPc = () => !!TI.mq.matches;
function tiLoad(k){ try{ return JSON.parse(localStorage.getItem(k) || 'null'); }catch(e){ return null; } }
function tiSave(k, v){ try{ if (v === null) localStorage.removeItem(k); else localStorage.setItem(k, JSON.stringify(v)); }catch(e){} }

/* ---- 1. пункт під курсором ---- */
function tiOffset(div, e){
  let r = null; const doc = div.ownerDocument || document, win = doc.defaultView || window;
  try{ if (doc.caretRangeFromPoint) r = doc.caretRangeFromPoint(e.clientX, e.clientY);
    else if (doc.caretPositionFromPoint){ const p = doc.caretPositionFromPoint(e.clientX, e.clientY); if (p){ r = doc.createRange(); r.setStart(p.offsetNode, p.offset); } } }catch(x){}
  if (!r){ const s = win.getSelection(); if (s && s.rangeCount) r = s.getRangeAt(0); }
  if (!r || !div.contains(r.startContainer)) return -1;
  const pre = doc.createRange(); pre.selectNodeContents(div); pre.setEnd(r.startContainer, r.startOffset);
  return pre.toString().length;
}
/* який увімкнений чіп поля f стоїть у тексті line на позиції off */
function tiChipAt(f, line, off){
  if (!f || f.type !== 'multi' || !f.chips) return null;
  const L = line.toLowerCase(); let best = null;
  f.chips.forEach((c, i)=>{
    if (c.getAttribute('aria-pressed') !== 'true') return;
    let t = ''; try{ t = qeNorm(OTM(f, i)); }catch(e){} if (t.length < 2) return;
    let k = L.indexOf(t);
    while (k >= 0){
      const end = k + t.length, okL = k === 0 || !/[\p{L}\d]/u.test(L[k - 1]), okR = end >= L.length || !/[\p{L}\d]/u.test(L[end]);
      if (okL && okR && off >= k && off < end && (!best || t.length > best.n)) best = {i, n:t.length, t:O(f.opts[i]).l || t};
      k = L.indexOf(t, k + 1);
    }
  });
  return best;
}
function tiRemove(f, hit, doc){
  const c = f.chips[hit.i]; if (!c || c.getAttribute('aria-pressed') !== 'true') return false;
  const ord = c.dataset.ord; c.click();
  if (c.getAttribute('aria-pressed') === 'true') return false;
  const back = ()=>{ if (c.getAttribute('aria-pressed') === 'true') return; c.click(); if (ord){ c.dataset.ord = ord; try{ update(); }catch(e){} } };
  snack('Прибрано «' + hit.t + '»', 'Скасувати', back, 8000);
  if (doc && doc !== document) tiSnackIn(doc, 'Прибрано «' + hit.t + '»', back);
  return true;
}
/* те саме «Скасувати» у вікні на другому моніторі */
function tiSnackIn(doc, msg, fn){
  let s = doc.getElementById('tiSnack');
  if (!s){ s = doc.createElement('div'); s.id = 'tiSnack'; s.className = 'snack'; s.setAttribute('role', 'status'); doc.body.append(s); }
  s.textContent = ''; const sp = doc.createElement('span'); sp.textContent = msg; const b = doc.createElement('button'); b.type = 'button'; b.className = 'btn sm'; b.textContent = 'Скасувати';
  b.onclick = ()=>{ s.classList.remove('on'); fn(); }; s.append(sp, b); s.classList.add('on');
  clearTimeout(tiSnackIn.t); tiSnackIn.t = setTimeout(()=>s.classList.remove('on'), 8000);
}
function tiHit(e){
  if (!tiPc() || e.button || e.altKey || e.ctrlKey || e.metaKey || e.shiftKey) return null;
  if (typeof OPG === 'object' && !OPG.qe) return null;
  const t = e.target; if (!t || !t.closest) return null;
  let div = t.closest('#out [data-sec], .pw-text [data-sec]'), sid = div && div.dataset.sec, card = null, pop = !!(div && div.closest('.pw-text'));
  if (!div){ const b = t.closest('.tn-body .tn-ln'); card = b && b.closest('.tn-card'); if (!card) return null;
    div = b; sid = [...TN.cards].find(([, c])=>c === card); sid = sid && sid[0]; }
  if (!div || !sid) return null;
  const sel = (div.ownerDocument.defaultView || window).getSelection(); if (sel && sel.rangeCount && !sel.isCollapsed && div.contains(sel.anchorNode)) return null;
  const S = SECTIONS.find(x=>x.id === sid); if (!S) return null;
  const line = div.textContent, off = tiOffset(div, e); if (off < 0) return null;
  const f = qeField(S, line, off); if (!f && !pop) return null;   /* у другому вікні клік по назві розділу — до розділу */
  return {S, sid, f, line, off, div, card, pop};
}
function tiClick(e){
  let x = null; try{ x = tiHit(e); }catch(err){ poErr(err, 'текст: клік по пункту'); }
  if (!x) return;
  const hit = tiChipAt(x.f, x.line, x.off);
  if (hit){ e.preventDefault(); e.stopImmediatePropagation(); try{ qeClose(); }catch(er){} try{ tiRemove(x.f, hit, x.div.ownerDocument); }catch(er){ poErr(er, 'текст: прибрати пункт'); } return; }
  if (x.pop){   /* другий монітор: назва поля — форма в основному вікні відкривається саме на цьому полі */
    e.preventDefault(); e.stopImmediatePropagation();
    try{ if (x.f) goTab(x.sid, x.sid + '.' + x.f.id); else goTab(x.sid); window.focus(); }catch(er){ poErr(er, 'текст: перехід із другого вікна'); } return;
  }
  if (x.card){   /* смуга «У тексті огляду»: назва поля — віконце з варіантами поруч зі смугою */
    e.preventDefault(); e.stopImmediatePropagation();
    if (QE.f === x.f && QE.box) return;
    try{ qeOpen(x.f, x.sid, x.card); tiQeNear(x.card); }catch(er){ poErr(er, 'текст: віконце зі смуги'); }
  }
}
document.addEventListener('click', tiClick, true);
function tiQeNear(card){
  const b = QE.box; if (!b || b.dataset.moved) return;
  const r = card.getBoundingClientRect(), w = Math.min(560, Math.max(300, r.width));
  b.style.width = w + 'px'; b.style.left = Math.max(8, Math.min(window.innerWidth - w - 8, r.left)) + window.scrollX + 'px';
  const hh = b.offsetHeight, top = r.top - hh - 6 > 8 ? r.top - hh - 6 : Math.min(r.bottom + 6, window.innerHeight - hh - 8);
  b.style.top = Math.max(8, top) + window.scrollY + 'px';
}

/* ---- 2. перетягування віконець за заголовок ---- */
/* місце запам’ятовується від найближчого краю: після Ctrl + / − чи зміни розміру вікно лишається біля «свого» краю */
function tiAnch(r){ const W = window.innerWidth, H = window.innerHeight, p = {l:Math.round(r.left), t:Math.round(r.top)};
  const rr = Math.round(W - r.right), bb = Math.round(H - r.bottom); if (rr < p.l) p.r = rr; if (bb < p.t) p.b = bb; return p; }
function tiUnAnch(p, w, hh){ if (!p) return p; const q = Object.assign({}, p); if (p.r !== undefined) q.l = window.innerWidth - w - p.r; if (p.b !== undefined) q.t = window.innerHeight - hh - p.b; return q; }
function tiClampPos(p, w, hh){ return {l:Math.max(0, Math.min(p.l, window.innerWidth - Math.min(w, 120))), t:Math.max(0, Math.min(p.t, window.innerHeight - 40))}; }
function tiPlace(box, key){
  const p = tiLoad(key); if (!p || !tiPc()) return false;
  const r = box.getBoundingClientRect(), q = tiClampPos(tiUnAnch(p, r.width, r.height), r.width, r.height);
  box.style.position = 'fixed'; box.style.left = q.l + 'px'; box.style.top = q.t + 'px'; box.dataset.moved = '1'; return true;
}
function tiDrag(box, handle, key, onEnd, can){
  if (!box || !handle || handle.dataset.tiDrag) return; handle.dataset.tiDrag = '1'; handle.classList.add('ti-grab');
  let d = null;
  handle.addEventListener('pointerdown', e=>{
    if (!tiPc() || e.button || (can && !can()) || e.target.closest('button, a, input, select, textarea, [contenteditable="true"]')) return;
    const r = box.getBoundingClientRect(); d = {x:e.clientX - r.left, y:e.clientY - r.top};
    box.style.position = 'fixed'; box.style.left = r.left + 'px'; box.style.top = r.top + 'px'; box.style.right = 'auto'; box.style.bottom = 'auto';
    box.dataset.moved = '1'; try{ handle.setPointerCapture(e.pointerId); }catch(x){} document.body.classList.add('v2-resizing'); e.preventDefault();
  });
  handle.addEventListener('pointermove', e=>{ if (!d) return; const r = box.getBoundingClientRect(), q = tiClampPos({l:e.clientX - d.x, t:e.clientY - d.y}, r.width, r.height); box.style.left = q.l + 'px'; box.style.top = q.t + 'px'; });
  const end = ()=>{ if (!d) return; d = null; document.body.classList.remove('v2-resizing'); const r = box.getBoundingClientRect(); if (key) tiSave(key, tiAnch(r)); if (onEnd) onEnd(r); };
  handle.addEventListener('pointerup', end); handle.addEventListener('pointercancel', end);
}
{ const q0 = qeOpen; qeOpen = function(f, sid, anchor){
  const r = q0.apply(this, arguments);
  try{ const b = QE.box, hd = b && b.querySelector('.qe-h'); if (b && hd){ QE.anchor = anchor; tiPlace(b, 'po.qepos'); tiDrag(b, hd, 'po.qepos');
    hd.title = 'Перетягніть за заголовок · подвійний клік — на старе місце';
    hd.addEventListener('dblclick', e=>{ if (e.target.closest('button')) return; tiSave('po.qepos', null); const a = QE.anchor; if (a && a.isConnected) qeOpen(f, sid, a); }); } }catch(e){ poErr(e, 'текст: перетягування віконця'); }
  return r; }; }
{ const p0 = sePlace; sePlace = function(pop){ if (pop && pop.dataset.moved) return; return p0.apply(this, arguments); }; }
{ const s0 = seOpen; seOpen = function(){
  const r = s0.apply(this, arguments);
  try{ const p = SE_POP, hd = p && p.querySelector('.see-h'); if (p && hd){ tiPlace(p, 'po.sepos'); tiDrag(p, hd, 'po.sepos');
    hd.addEventListener('dblclick', e=>{ if (e.target.closest('button')) return; tiSave('po.sepos', null); delete p.dataset.moved; if (p._anchor) sePlace(p, p._anchor); }); } }catch(e){ poErr(e, 'бланк: перетягування віконця'); }
  return r; }; }

/* ---- 3. смуга «У тексті огляду»: відкріпити, рухати, розмір, шрифт ---- */
const TNX = Object.assign({free:false, fs:0}, tiLoad('po.tnbox') || {});
function tnxSave(){ tiSave('po.tnbox', TNX); }
function tnxFont(d){ TNX.fs = Math.max(11, Math.min(26, (TNX.fs || 15) + d)); tnxSave(); tnxApply(); }
function tnxApply(){
  document.documentElement.style.setProperty('--tnfs', TNX.fs ? TNX.fs + 'px' : '');
  if (!TNX.fs) document.documentElement.style.removeProperty('--tnfs');
  const W = window.innerWidth, H = window.innerHeight;
  TN.cards.forEach(c=>{
    c.classList.toggle('tn-free', TNX.free);
    if (c.pin){ c.pin.textContent = TNX.free ? '⇲' : '⇱'; c.pin.title = TNX.free ? 'Закріпити знову внизу розділу' : 'Відкріпити: перетягувати за заголовок, розмір — за кут'; c.pin.setAttribute('aria-pressed', TNX.free ? 'true' : 'false'); }
    if (!TNX.free){ ['left', 'top', 'width', 'height', 'position', 'right', 'bottom'].forEach(k=>c.style.removeProperty(k)); delete c.dataset.moved; return; }
    const w = Math.max(280, Math.min(TNX.w || 560, W - 16)), hh = Math.max(110, Math.min(TNX.h || 220, H - 16));
    const a = tiUnAnch(TNX, w, hh) || {};
    const l = a.l === undefined ? W - w - 24 : Math.max(0, Math.min(a.l, W - 120)), t = a.t === undefined ? H - hh - 24 : Math.max(0, Math.min(a.t, H - 40));
    Object.assign(c.style, {position:'fixed', left:l + 'px', top:t + 'px', width:w + 'px', height:hh + 'px'});
  });
}
function tnxDecorate(c){
  const head = c.querySelector('.tn-head'); if (!head || c.pin) return;
  const b = (txt, title, fn)=>h('button', {type:'button', class:'tn-b', title, 'aria-label':title, onclick:fn}, txt);
  c.pin = b('⇱', '', ()=>{
    if (!TNX.free){ const r = c.getBoundingClientRect(); TNX.free = true; TNX.l = Math.round(r.left); TNX.t = Math.max(8, Math.round(r.top - 80)); TNX.w = Math.min(640, Math.round(r.width)); TNX.h = Math.max(180, Math.round(r.height + 60)); }
    else TNX.free = false;
    tnxSave(); tnxApply(); });
  head.querySelector('.tn-all').before(b('A−', 'Менший шрифт', ()=>tnxFont(-1)), b('A+', 'Більший шрифт', ()=>tnxFont(1)), c.pin);
  tiDrag(c, head, null, r=>{ if (!TNX.free) return; const a = tiAnch(r); delete TNX.r; delete TNX.b; Object.assign(TNX, a); tnxSave(); TN.cards.forEach(x=>{ if (x !== c){ x.style.left = TNX.l + 'px'; x.style.top = TNX.t + 'px'; } }); }, ()=>TNX.free);
  if (typeof ResizeObserver === 'function'){ let tm = 0; new ResizeObserver(()=>{ if (!TNX.free || c.hidden || !c.offsetWidth) return; clearTimeout(tm); tm = setTimeout(()=>{ const r = c.getBoundingClientRect(); if (Math.abs(r.width - (TNX.w || 0)) < 2 && Math.abs(r.height - (TNX.h || 0)) < 2) return; TNX.w = Math.round(r.width); TNX.h = Math.round(r.height); delete TNX.r; delete TNX.b; Object.assign(TNX, tiAnch(r)); tnxSave(); TN.cards.forEach(x=>{ if (x !== c){ x.style.width = TNX.w + 'px'; x.style.height = TNX.h + 'px'; } }); }, 300); }).observe(c); }
}
{ const c0 = tnCard; tnCard = function(t){ const had = TN.cards.has(t.id), c = c0.apply(this, arguments); if (!had){ try{ tnxDecorate(c); tnxApply(); }catch(e){ poErr(e, 'текст: смуга'); } } return c; }; }
TN.cards.forEach(tnxDecorate); tnxApply();
window.addEventListener('resize', ()=>{ if (TNX.free) tnxApply();
  [QE.box, SE_POP].forEach(b=>{ if (!b || !b.dataset.moved) return; const r = b.getBoundingClientRect(), q = tiClampPos({l:r.left, t:r.top}, r.width, r.height); b.style.left = q.l + 'px'; b.style.top = q.t + 'px'; }); });
