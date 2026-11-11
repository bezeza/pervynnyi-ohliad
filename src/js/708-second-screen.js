/* ===== 0.9.3.126 · другий монітор і масштаб вікон (обговорення з лікарем 11.11.2026) =====
   Вікно «⧉» (618) вже вміло ставати на другий монітор і оновлюватися наживо. Тепер:
   1) У ньому, як і в основному тексті (707): клік по пункту прибирає його («Скасувати» — і там, і тут),
      клік по назві поля — форма в основному вікні відкривається на цьому полі. Alt+клік — поставити курсор і правити.
   2) Поки вікно відкрите, колонка «Текст» і смуга «У тексті огляду» в основному вікні ховаються — форма на всю ширину.
      Закрили вікно — усе як було.
   3) Перейшли на інший розділ форми — вікно саме прокручується до цього розділу й коротко його підсвічує.
   4) «⇔ По ширині» тепер залишається увімкненим: розгорнули чи звузили вікно — текст сам підлаштовується. «−/+» — вручну.
   5) «Вигляд» → «Текст»: третій варіант «На другому моніторі». «Розмір тексту: Сталий / Росте з вікном» —
      шрифт у плаваючому вікні й у відкріпленій смузі збільшується разом із їхнім розміром.
   6) Масштаб браузера (Ctrl + / −) і зміна розміру вікна: плаваюче вікно, віконця правки й смуга лишаються біля
      свого краю й не зменшуються самі (розмір не перезаписується, поки браузер змінює розмір). */
const TXG = {on:false, wr:0};
try{ TXG.on = localStorage.getItem('po.txtgrow') === '1'; POP.fit = localStorage.getItem('po.popfit') === '1'; }catch(e){}
window.addEventListener('resize', ()=>{ TXG.wr = Date.now(); }, true);
const txgBusy = () => Date.now() - TXG.wr < 700;

/* ---- 6. плаваюче вікно «Текст»: місце — від найближчого краю, розмір не «з’їдається» ---- */
{ const a0 = tnFloatApply; tnFloatApply = function(){
  const p = TN.pos;
  if (TN.float && p && (p.r !== undefined || p.b !== undefined)){
    const W = window.innerWidth, H = window.innerHeight, w = Math.max(320, Math.min(p.w || 480, W - 16)), hh = Math.max(220, Math.min(p.h || 400, H - 16));
    const q = tiUnAnch(p, w, hh); p.l = q.l; p.t = q.t; }
  return a0.apply(this, arguments); }; }
{ const s0 = tnFloatSave; tnFloatSave = function(){
  if (txgBusy()) return;
  s0.apply(this, arguments);
  const box = document.getElementById('outBox'); if (!box || !TN.float) return;
  const r = box.getBoundingClientRect(); TN.pos = Object.assign({w:Math.round(r.width), h:Math.round(r.height)}, tiAnch(r));
  try{ localStorage.setItem('po.txtpos', JSON.stringify(TN.pos)); }catch(e){} }; }

/* ---- 5. текст росте разом із вікном ---- */
function txgApply(){
  const out = document.getElementById('out'), box = document.getElementById('outBox');
  if (out){ if (TXG.on && TN.float && box && box.offsetWidth){ out.style.fontSize = Math.round(Math.max(14, Math.min(28, box.offsetWidth / 30))) + 'px'; out.dataset.txg = '1'; }
    else if (out.dataset.txg){ out.style.removeProperty('font-size'); delete out.dataset.txg; } }
  TN.cards.forEach(c=>{ const b = c.querySelector('.tn-body'); if (!b) return;
    if (TXG.on && TNX.free && !TNX.fs && c.offsetWidth){ b.style.fontSize = Math.round(Math.max(12, Math.min(26, c.offsetWidth / 36))) + 'px'; b.dataset.txg = '1'; }
    else if (b.dataset.txg){ b.style.removeProperty('font-size'); delete b.dataset.txg; } });
}
function txgSet(on){ TXG.on = !!on; if (on){ TNX.fs = 0; tnxSave(); tnxApply(); } try{ localStorage.setItem('po.txtgrow', on ? '1' : '0'); }catch(e){} txgApply(); try{ renderViewCtl(); }catch(e){} }
TXG.ro = typeof ResizeObserver === 'function' ? new ResizeObserver(()=>{ cancelAnimationFrame(TXG.raf); TXG.raf = requestAnimationFrame(txgApply); }) : null;
function txgWatch(){ if (!TXG.ro) return; const b = document.getElementById('outBox'); if (b) TXG.ro.observe(b); TN.cards.forEach(c=>TXG.ro.observe(c)); }
{ const f0 = tnxFont; tnxFont = function(){ const r = f0.apply(this, arguments); txgApply(); return r; }; }
{ const f0 = tnFloatSet; tnFloatSet = function(){ const r = f0.apply(this, arguments); txgApply(); return r; }; }
onUpdate('708-text-grow', ()=>{ txgWatch(); if (TXG.on) txgApply(); });

/* ---- 1–4. вікно на другому моніторі ---- */
const POPX = {timer:0, was:null, last:''};
function popOn(){ return !!(POP.w && !POP.w.closed); }
function popExt(on){
  if (on === document.body.classList.contains('pop-ext')) return;
  document.body.classList.toggle('pop-ext', on);
  try{
    if (on){ POPX.was = typeof TXTOPEN !== 'undefined' ? TXTOPEN : null; if (POPX.was) txtOpen(false);
      clearInterval(POPX.timer); POPX.timer = setInterval(()=>{ if (!popOn()){ popExt(false); popBtnSync(); } }, 1000); }
    else { clearInterval(POPX.timer); if (POPX.was) txtOpen(true); POPX.was = null; }
  }catch(e){ poErr(e, 'другий монітор: колонка'); }
  try{ renderViewCtl(); }catch(e){}
}
{ const o0 = popOpen; popOpen = async function(){ const r = await o0.apply(this, arguments); if (popOn()) popExt(true); return r; }; }
{ const i0 = popInit; popInit = function(w){
  const r = i0.apply(this, arguments);
  try{
    const d = w.document;
    d.addEventListener('click', e=>{ if (POP.mode === 'text') tiClick(e); }, true);
    const st = d.createElement('style');
    st.textContent = '.pw-text [data-sec].ti-here{background:var(--accent-soft,#e3edf8);border-radius:6px;transition:background 1.6s}.pw-text [data-sec]{transition:background 1.6s}' +
      '#tiSnack{position:fixed;left:50%;bottom:18px;transform:translateX(-50%);z-index:30}' +
      '.pw-bar button[data-z="fit"][aria-pressed="true"]{background:var(--accent-soft,#e3edf8);color:var(--accent,#1f5a8a);font-weight:600}';
    d.head.append(st);
    w.addEventListener('resize', ()=>{ if (!POP.fit) return; clearTimeout(POPX.rz); POPX.rz = setTimeout(()=>popZoom(1, true), 120); });
    w.addEventListener('pagehide', ()=>setTimeout(()=>{ if (!popOn()) popExt(false); }, 80));
  }catch(e){ poErr(e, 'другий монітор: вікно'); }
  return r; }; }
/* «⇔ По ширині» лишається увімкненим, поки не натиснули −/+/100% */
{ const z0 = popZoom; popZoom = function(z, fit){
  POP.fit = !!fit; try{ localStorage.setItem('po.popfit', POP.fit ? '1' : '0'); }catch(e){}
  const r = z0.apply(this, arguments);
  try{ const b = POP.w && POP.w.document.querySelector('.pw-bar button[data-z="fit"]'); if (b) b.setAttribute('aria-pressed', POP.fit ? 'true' : 'false'); }catch(e){}
  return r; }; }
{ const r0 = popRender; popRender = function(){
  const r = r0.apply(this, arguments);
  try{ if (!popOn()) return r; const d = POP.w.document;
    const hh = d.getElementById('pwH'); if (hh && POP.mode === 'text') hh.textContent = 'клік по пункту — прибрати · по назві поля — до поля у формі · Alt+клік — правити тут';
    if (POP.fit) popZoom(1, true); }catch(e){}
  return r; }; }
/* прокрутка до розділу, з яким працюють у формі */
function popFollow(){
  if (!popOn() || POP.mode !== 'text') return;
  const t = TABS[active], id = t && t.id; if (!id || id === POPX.last) return; POPX.last = id;
  const w = POP.w, el = w.document.querySelector('.pw-text [data-sec="' + id + '"]'); if (!el) return;
  const r = el.getBoundingClientRect(); if (r.top < 60 || r.top > w.innerHeight * .7) w.scrollTo({top:Math.max(0, w.scrollY + r.top - 80), behavior:'smooth'});
  w.document.querySelectorAll('.pw-text [data-sec="' + id + '"]').forEach(x=>{ x.classList.add('ti-here'); setTimeout(()=>x.classList.remove('ti-here'), 1400); });
}
{ const s0 = show; show = function(){ const r = s0.apply(this, arguments); try{ popFollow(); }catch(e){} return r; }; }

/* ---- «Вигляд» → «Текст»: третій варіант і розмір тексту ---- */
{ const x0 = viewCtl; viewCtl = function(){
  const box = x0.apply(this, arguments);
  try{
    const seg = box.querySelector('.vseg[aria-label="Як показувати панель «Текст»"]');
    if (seg){ const on = popOn();
      if (on) seg.querySelectorAll('button').forEach(b=>b.setAttribute('aria-pressed', 'false'));
      seg.append(h('button', {type:'button', 'aria-pressed':on ? 'true' : 'false', title:'Окреме вікно — перетягніть на другий монітор; оновлюється наживо', onclick:()=>{ if (on) POP.w.focus(); else popOpen(); }}, 'На другому моніторі')); }
    box.append(h('div', {class:'vrow'}, h('span', {class:'vl'}, 'Розмір тексту'), h('div', {class:'vseg', role:'group', 'aria-label':'Розмір тексту у вікнах'},
      ...[[false, 'Сталий', 'Як вибрано (Aa, A− / A+)'], [true, 'Росте з вікном', 'У плаваючому вікні й відкріпленій смузі шрифт більшає разом із вікном']].map(([on, l, t])=>
        h('button', {type:'button', 'aria-pressed':TXG.on === on ? 'true' : 'false', title:t, onclick:()=>txgSet(on)}, l)))));
  }catch(e){ poErr(e, 'другий монітор: меню «Вигляд»'); }
  return box; }; }
{ const b = document.getElementById('popBtn'); if (b) b.title = 'На другий монітор: окреме вікно з текстом або аркушем, оновлюється наживо. Поки воно відкрите, форма — на всю ширину.'; }
txgWatch(); txgApply(); try{ renderViewCtl(); }catch(e){}
