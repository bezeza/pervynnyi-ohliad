/* ===== 0.9.3.119 · текст поруч із набором (обговорення з лікарем 11.11.2026) =====
   1) Картка «У тексті огляду» внизу розділу: абзац саме цього розділу, оновлюється під час друку
      (дії «після» запускаються після паузи — 596). Видно, коли панель «Текст» закрита; «Увесь текст» відкриває панель.
      Можна згорнути (po.txtnear = '0').
   2) «Вигляд» → «Текст»: «Колонкою» (як 0.9.3.114) або «Плаваючим вікном» — перетягується за заголовок,
      розмір — за правий нижній кут; місце й розмір запам’ятовуються (po.txtfloat). Лише ПК (≥ 1280 px для колонки).
   Розумна клавіатура тепер працює й у віконці правки з тексту (684, .qe). Стилі — кінець styles.css (0.9.3.119). */
const TN = {on:true, cards:new Map(), float:false, pos:null};
try{ TN.on = localStorage.getItem('po.txtnear') !== '0'; TN.float = localStorage.getItem('po.txtfloat') === '1';
  TN.pos = JSON.parse(localStorage.getItem('po.txtpos') || 'null'); }catch(e){}
function tnCard(t){
  let c = TN.cards.get(t.id); if (c) return c;
  const body = h('div', {class:'tn-body', 'aria-live':'off'});
  const fold = h('button', {type:'button', class:'tn-fold', 'aria-expanded':'true', title:'Згорнути / розгорнути', onclick:()=>{ TN.on = !TN.on; try{ localStorage.setItem('po.txtnear', TN.on ? '1' : '0'); }catch(e){} tnSync(); }});
  c = h('section', {class:'tn-card', 'aria-label':'У тексті огляду'},
    h('div', {class:'tn-head'}, h('span', {class:'tn-t'}, 'У тексті огляду'), h('span', {class:'tn-sp'}),
      h('button', {type:'button', class:'tn-all', onclick:()=>{ const b = document.getElementById('txtBtn'); if (b) b.click(); }}, 'Увесь текст'), fold), body);
  c.body = body; c.fold = fold; t.panel.append(c); TN.cards.set(t.id, c); return c;
}
function tnSync(){
  const open = document.body.classList.contains('v2-txt-open');
  TABS.forEach(t=>{
    if (!t.panel || t.panel.hidden || TOOL_TABS.includes(t.id) || !SECTIONS.some(s=>s.id === t.id)){ const c = TN.cards.get(t.id); if (c) c.hidden = true; return; }
    const src = document.querySelector('#out [data-sec="' + t.id + '"]'), txt = src ? src.textContent.trim() : '';
    const c = tnCard(t); c.hidden = open || !txt || !UIV2;
    if (c.hidden) return;
    c.classList.toggle('fold', !TN.on); c.fold.setAttribute('aria-expanded', TN.on ? 'true' : 'false'); c.fold.textContent = TN.on ? '▾' : '▸';
    if (TN.on && c.body.textContent !== txt) c.body.textContent = txt;
  });
}
onUpdate('705-text-near', tnSync);
/* плаваюче вікно */
function tnFloatApply(){
  const box = document.getElementById('outBox'); if (!box) return;
  document.body.classList.toggle('txt-float', TN.float);
  if (!TN.float){ ['left', 'top', 'width', 'height'].forEach(k=>box.style.removeProperty(k)); return; }
  const W = window.innerWidth, H = window.innerHeight, p = TN.pos || {w:480, h:Math.round(H * .55)};
  const w = Math.max(320, Math.min(p.w, W - 16)), hh = Math.max(220, Math.min(p.h, H - 16));
  const l = p.l === undefined ? W - w - 16 : Math.max(8, Math.min(p.l, W - w - 8)), tp = p.t === undefined ? H - hh - 64 : Math.max(8, Math.min(p.t, H - hh - 8));
  Object.assign(box.style, {left:l + 'px', top:tp + 'px', width:w + 'px', height:hh + 'px'});
}
function tnFloatSave(){ const box = document.getElementById('outBox'); if (!box || !TN.float) return; const r = box.getBoundingClientRect();
  TN.pos = {l:Math.round(r.left), t:Math.round(r.top), w:Math.round(r.width), h:Math.round(r.height)}; try{ localStorage.setItem('po.txtpos', JSON.stringify(TN.pos)); }catch(e){} }
function tnFloatSet(on){ TN.float = !!on; try{ localStorage.setItem('po.txtfloat', on ? '1' : '0'); }catch(e){} tnFloatApply(); try{ renderViewCtl(); }catch(e){} }
{ const box = document.getElementById('outBox'), head = box && box.querySelector(':scope > .oh');
  if (head){
    let d = null;
    head.addEventListener('pointerdown', e=>{ if (!TN.float || e.target.closest('button, a, input, select')) return; const r = box.getBoundingClientRect(); d = {x:e.clientX - r.left, y:e.clientY - r.top}; head.setPointerCapture(e.pointerId); document.body.classList.add('v2-resizing'); e.preventDefault(); });
    head.addEventListener('pointermove', e=>{ if (!d) return; box.style.left = Math.max(0, Math.min(e.clientX - d.x, window.innerWidth - 80)) + 'px'; box.style.top = Math.max(0, Math.min(e.clientY - d.y, window.innerHeight - 40)) + 'px'; });
    const end = ()=>{ if (!d) return; d = null; document.body.classList.remove('v2-resizing'); tnFloatSave(); };
    head.addEventListener('pointerup', end); head.addEventListener('pointercancel', end);
  }
  if (box && typeof ResizeObserver === 'function'){ let t = 0; new ResizeObserver(()=>{ if (!TN.float) return; clearTimeout(t); t = setTimeout(tnFloatSave, 300); }).observe(box); }
  window.addEventListener('resize', ()=>{ if (TN.float) tnFloatApply(); });
}
{ const x0 = viewCtl; viewCtl = function(){
  const box = x0.apply(this, arguments);
  try{ box.append(h('div', {class:'vrow'}, h('span', {class:'vl'}, 'Текст'), h('div', {class:'vseg', role:'group', 'aria-label':'Як показувати панель «Текст»'},
    ...[[false, 'Колонкою', 'Справа, форма звужується'], [true, 'Плаваючим вікном', 'Перетягується за заголовок, розмір — за кут']].map(([on, l, t])=>
      h('button', {type:'button', 'aria-pressed':TN.float === on ? 'true' : 'false', title:t, onclick:()=>tnFloatSet(on)}, l))))); }catch(e){ poErr(e, 'текст: меню «Вигляд»'); }
  return box; }; }
tnFloatApply(); try{ renderViewCtl(); }catch(e){}
