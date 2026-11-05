/* ===== 0.9.3.90 — плаваючі віконця на аркуші =====
   1. «Вносити на бланку» (636) і «Бачу — редагую» (675): віконце перетягується за заголовок,
      розмір змінюється за правий нижній кут. Місце й розмір запам’ятовуються окремо для кожного лікаря
      (за ПІБ лікаря на цьому ПК). Подвійний клік по заголовку — повернути віконце на стандартне місце.
      На телефоні (до 899 px) — як було: нижня панель.
   2. «Бачу — редагую»: текстові поля з готовими фразами (молочні залози, кістково-суглобова система тощо)
      показують ці фрази як варіанти; повторний клік прибирає фразу.
   3. «Бачу — редагую»: фраза в блоці одного розділу не відкриває поле іншого розділу
      (раніше, наприклад, «5 днів» у листі призначень відкривало анамнез, слова скарг — скарги). */

/* ---- 2–3. варіанти фраз і прив’язка до свого розділу ---- */
{ const o0 = seOpts; seOpts = function(f){
  const r = o0.apply(this, arguments);
  if (r.length || !f || f.type !== 'text' || !f.el || !f.quick || !f.quick.length) return r;
  const sep = f.sep || '\n', parts = String(f.el.value || '').split(sep).map(x=>x.trim()).filter(Boolean);
  return f.quick.map(q=>{ const t = g(q); return {label:t, quickT:t, on:parts.includes(t)}; });
}; }
{ const p0 = sePick; sePick = function(f, o){
  if (!o || o.quickT == null) return p0.apply(this, arguments);
  const pop = SE_POP, own = pop && pop.querySelector('.see-own input');
  const sep = f.sep || '\n', parts = String(f.el.value || '').split(sep).map(x=>x.trim()).filter(Boolean);
  /* фраза з «…» — у «Свій варіант», щоб дописати місце чи суглоб */
  if (/…/.test(o.quickT) && own){
    own.value = parts.concat(o.quickT).join(sep); own.focus();
    const k = own.value.lastIndexOf('…'); try{ own.setSelectionRange(k, k + 1); }catch(e){}
    return;
  }
  if (!SE_UNDO){ undoPush('фраза: ' + (f.label || '')); SE_UNDO = UNDO[UNDO.length - 1]; }
  const i = parts.indexOf(o.quickT); if (i >= 0) parts.splice(i, 1); else parts.push(o.quickT);
  f.el.value = parts.join(sep); f.el.dispatchEvent(new Event('input', {bubbles:true}));
  sePaint();
}; }
{ const m0 = seMark; seMark = function(root){
  const r = m0.apply(this, arguments);
  try{ if (root) root.querySelectorAll('[data-sec] span.se[data-se]').forEach(sp=>{
    const blk = sp.closest('[data-sec]'), sec = String(sp.dataset.se).split('.')[0];
    if (blk && sec !== blk.dataset.sec){ const p = sp.parentNode; sp.replaceWith(document.createTextNode(sp.textContent)); if (p) p.normalize(); }
  }); }catch(e){}
  return r;
}; }

/* ---- 1. перетягування, розмір, збереження під лікаря ---- */
const FW_KEY = 'po.floatwin';
try{ if (!FS_SET_KEYS.includes(FW_KEY)) FS_SET_KEYS.push(FW_KEY); }catch(e){}
function fwDoc(){ try{ const e = document.getElementById('meta_doc'); return (e && e.value.trim()) || '—'; }catch(e){ return '—'; } }
function fwAll(){ try{ const a = JSON.parse(localStorage.getItem(FW_KEY) || '{}'); return a && typeof a === 'object' ? a : {}; }catch(e){ return {}; } }
function fwGet(kind){ const a = fwAll()[fwDoc()]; return (a && a[kind]) || null; }
function fwSet(kind, geo){
  const a = fwAll(), d = fwDoc(); a[d] = Object.assign({}, a[d]);
  if (geo) a[d][kind] = geo; else delete a[d][kind];
  try{ localStorage.setItem(FW_KEY, JSON.stringify(a)); }catch(e){}
}
function fwPhone(w){ try{ return w.matchMedia('(max-width:899px)').matches; }catch(e){ return false; } }
function fwApply(box, kind, w){
  w = w || window;
  const geo = fwPhone(w) ? null : fwGet(kind);
  if (!geo){ if (box.classList.contains('fw-on')){ box.classList.remove('fw-on'); box.style.height = ''; } return false; }
  const vw = w.innerWidth, vh = w.innerHeight;
  const width = Math.max(260, Math.min(geo.w || box.offsetWidth || 340, vw - 16));
  box.classList.add('fw-on');
  box.style.width = width + 'px';
  if (geo.h) box.style.height = Math.max(160, Math.min(geo.h, vh - 16)) + 'px'; else box.style.height = '';
  const bh = Math.min(box.getBoundingClientRect().height || 200, vh - 16);
  box.style.left = Math.max(8, Math.min(vw - width - 8, geo.x)) + 'px';
  box.style.top = Math.max(8, Math.min(vh - bh - 8, geo.y)) + 'px';
  return true;
}
function fwReset(box, kind){
  fwSet(kind, null); box.classList.remove('fw-on'); box.style.height = '';
  try{ if (kind === 'pe') pePlace(); else if (box._anchor) sePlace(box, box._anchor); }catch(e){}
}
function fwWire(box, kind, w){
  if (!box || box._fw) return; box._fw = 1;
  const d = box.ownerDocument, head = box.querySelector(kind === 'pe' ? '.pe-head' : '.see-h');
  const grip = d.createElement('div'); grip.className = 'fw-grip'; grip.title = 'Потягніть, щоб змінити розмір віконця'; grip.setAttribute('aria-hidden', 'true');
  box.append(grip);
  if (head){ head.classList.add('fw-drag'); head.title = 'Перетягніть, щоб перемістити віконце. Подвійний клік — на стандартне місце'; }
  const start = (e, mode)=>{
    if (fwPhone(w) || (e.button !== undefined && e.button > 0)) return;
    if (mode === 'move' && e.target.closest && e.target.closest('button, input, select, textarea, a')) return;
    e.preventDefault();
    const r = box.getBoundingClientRect(), x0 = e.clientX, y0 = e.clientY;
    box.classList.add('fw-on', 'fw-busy');
    const mv = ev=>{
      const dx = ev.clientX - x0, dy = ev.clientY - y0, vw = w.innerWidth, vh = w.innerHeight;
      if (mode === 'move'){
        box.style.left = Math.max(8, Math.min(vw - r.width - 8, r.left + dx)) + 'px';
        box.style.top = Math.max(8, Math.min(vh - 48, r.top + dy)) + 'px';
      } else {
        box.style.width = Math.max(260, Math.min(vw - r.left - 8, r.width + dx)) + 'px';
        box.style.height = Math.max(160, Math.min(vh - r.top - 8, r.height + dy)) + 'px';
      }
    };
    const up = ()=>{
      d.removeEventListener('pointermove', mv); d.removeEventListener('pointerup', up); d.removeEventListener('pointercancel', up);
      box.classList.remove('fw-busy');
      const b = box.getBoundingClientRect(), prev = fwGet(kind) || {};
      fwSet(kind, {x:Math.round(b.left), y:Math.round(b.top), w:Math.round(b.width), h:mode === 'size' ? Math.round(b.height) : (prev.h || 0)});
    };
    d.addEventListener('pointermove', mv); d.addEventListener('pointerup', up); d.addEventListener('pointercancel', up);
  };
  if (head){
    head.addEventListener('pointerdown', e=>start(e, 'move'));
    head.addEventListener('dblclick', e=>{ if (e.target.closest && e.target.closest('button, input')) return; fwReset(box, kind); });
  }
  grip.addEventListener('pointerdown', e=>start(e, 'size'));
}
{ const x0 = pePlace; pePlace = function(){
  const r = x0.apply(this, arguments);
  try{ if (PE.box && PE.w && !PE.w.closed){ fwWire(PE.box, 'pe', PE.w); fwApply(PE.box, 'pe', PE.w); } }catch(e){}
  return r;
}; }
{ const x0 = sePlace; sePlace = function(pop){
  const r = x0.apply(this, arguments);
  try{ if (pop){ fwWire(pop, 'see', window); fwApply(pop, 'see', window); } }catch(e){}
  return r;
}; }
