/* ===== Менше переходів по вкладках (0.9.3.34) =====
   1) «Весь документ однією сторінкою»: розділи поточного документа йдуть підряд, бічний зміст підсвічує,
      де ви зараз, клік по ньому — прокрутка до розділу. Вкладками — перемикач у «Налаштуваннях».
   2) Порожнє поле з підстановкою (скарги, об’єктивно, анамнез…) показує сірим, що саме підтягнеться,
      і кнопку «Взяти й правити».
   3) Клік по фразі в тексті документа — маленьке вікно правки саме цього поля, без переходу на вкладку. */
const OPG = { on:true, qe:true, lock:0, raf:0 };
try{ OPG.on = localStorage.getItem('po.onepage') !== '0'; OPG.qe = localStorage.getItem('po.qedit') !== '0'; }catch(e){}
const OP_SKIP = ['hv', 'calc', 'tpl', 'set', 'help'];
function opSet(){ return tabOrder().filter(i=>TABS[i] && !OP_SKIP.includes(TABS[i].id)); }
function opScrollTo(el, off){ OPG.lock = Date.now(); const y = el.getBoundingClientRect().top + window.scrollY - (off || 70); window.scrollTo({top:Math.max(0, y)}); }
{ const s0 = show; show = function(i){
    try{ qeClose(); }catch(e){}
    const set = OPG.on ? opSet() : [], on = set.includes(i);
    document.body.classList.toggle('onepage', on);
    const r = s0.apply(this, arguments);
    if (on){
      set.forEach((k, n)=>{ const t = TABS[k]; t.panel.hidden = false; t.panel.style.order = n; });
      try{ if (set.some(k=>TABS[k].id === 'dx') && TABS[i].id !== 'dx') dxPanel(); }catch(e){}
      try{ if (set.some(k=>TABS[k] === RXT) && TABS[i] !== RXT) renderRx(); }catch(e){}
      if (!OPG.quiet) opScrollTo(TABS[i].panel);
    } else TABS.forEach(t=>{ t.panel.style.order = ''; });
    return r;
  }; }
{ const gf0 = goField; goField = function(){ OPG.lock = Date.now() + 600; return gf0.apply(this, arguments); }; }
function opSpy(){
  OPG.raf = 0;
  if (!document.body.classList.contains('onepage') || Date.now() - OPG.lock < 700) return;
  const set = opSet(); if (!set.length) return;
  let cur = set[0];
  const atEnd = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4;
  if (atEnd) cur = set[set.length - 1];
  else for (const k of set){ if (TABS[k].panel.getBoundingClientRect().top < Math.max(160, window.innerHeight * 0.4)) cur = k; }
  if (cur === active) return;
  active = cur;
  TABS.forEach((t, k)=>t.tab.setAttribute('aria-selected', k === cur ? 'true' : 'false'));
  try{ TABS[cur].tab.scrollIntoView({block:'nearest'}); }catch(e){}
  try{ renderTabNav(); renderLive(); }catch(e){}
}
window.addEventListener('scroll', ()=>{
  const wait = OPG.lock + 720 - Date.now();
  if (wait > 0){ clearTimeout(OPG.lt); OPG.lt = setTimeout(()=>{ if (!OPG.raf) OPG.raf = requestAnimationFrame(opSpy); }, wait); return; }
  if (!OPG.raf) OPG.raf = requestAnimationFrame(opSpy); }, {passive:true});
function opApply(){ OPG.quiet = true; try{ show(active); }finally{ OPG.quiet = false; } }

/* ---- 2. сірий підказ «що підтягнеться» ---- */
function ghostSync(){
  SECTIONS.forEach(s=>s.fields.forEach(f=>{
    if (!f.fallback || !(f.type === 'text' || f.type === 'line') || !f.el || !f.wrapEl) return;
    const vis = (!s.docs || s.docs.includes(DOC)) && (!s.only || s.only === MODE) && (!f.docs || f.docs.includes(DOC)) && (!f.only || f.only === MODE) && !(f.when && !f.when()) && !f.wrapEl.hidden;
    let fb = '';
    if (vis && !f.el.value.trim()){ try{ fb = g(String(f.fallback() || '')).trim(); }catch(e){ fb = ''; } }
    if (!fb){ if (f.ghost) f.ghost.hidden = true; return; }
    if (!f.ghost){
      const tx = h('div', {class:'ghost-t'});
      const bt = h('button', {type:'button', class:'btn ghost-b', title:'Перенести цей текст у поле, щоб поправити кілька слів', onclick:()=>{
        const v = f.ghost.dataset.v || ''; f.el.value = v; f.el.dispatchEvent(new Event('input', {bubbles:true})); f.el.focus(); try{ f.el.setSelectionRange(v.length, v.length); }catch(e){} update(); }}, '✎ Взяти й правити');
      f.ghost = h('div', {class:'ghost', 'aria-live':'polite'}, h('div', {class:'ghost-l'}, 'Підтягнеться автоматично:'), tx, bt);
      f.ghost.tx = tx; f.wrapEl.append(f.ghost);
    }
    f.ghost.dataset.v = fb; f.ghost.tx.textContent = fb; f.ghost.hidden = false;
  }));
}

/* ---- 3. правка поля кліком по фразі в тексті ---- */
const QE = { box:null, f:null, ph:null, hid:false };
const qeNorm = s => g(String(s || '')).toLowerCase().replace(/\s+/g, ' ').replace(/[.\s]+$/, '');
function qeField(S, line, off){
  const L = line.toLowerCase(); let best = null, near = null;
  for (const f of S.fields){
    if (f.type === 'hdr' || f.noOut || f.headOnly || !f.wrapEl) continue;
    if ((f.docs && !f.docs.includes(DOC)) || (f.only && f.only !== MODE)) continue;
    let v = ''; try{ v = val(f); }catch(e){} if (!v) continue;
    const cands = [f.type === 'num' ? v : (f.tpl || '{v}').replace('{v}', v), f.solo ? f.solo.replace('{v}', v) : '', v].map(qeNorm).filter(c=>c.length >= 2);
    for (const c of cands){
      let i = L.indexOf(c);
      while (i >= 0){
        if (off >= i && off <= i + c.length){ if (!best || c.length > best.n) best = {f, n:c.length}; }
        else if (i <= off && (!near || i > near.i)) near = {f, i};
        i = L.indexOf(c, i + 1);
      }
    }
  }
  return best ? best.f : near ? near.f : null;
}
function qeClose(){
  if (!QE.box) return;
  if (QE.ph && QE.f){ QE.ph.replaceWith(QE.f.wrapEl); QE.f.wrapEl.hidden = QE.hid; }
  QE.box.remove(); QE.box = null; QE.f = null; QE.ph = null;
}
function qeOpen(f, sid, anchor){
  qeClose();
  const w = f.wrapEl; QE.f = f; QE.hid = w.hidden; QE.ph = document.createComment('qe'); w.before(QE.ph); w.hidden = false;
  const key = sid + '.' + f.id, S = SECTIONS.find(x=>x.id === sid);
  const box = h('div', {class:'qe', role:'dialog', 'aria-label':'Швидка правка: ' + f.label},
    h('div', {class:'qe-h'}, h('span', {class:'qe-s'}, (S && (S.short || S.title)) || ''),
      h('button', {type:'button', class:'more', title:'Відкрити це поле у формі', onclick:()=>{ qeClose(); goTab(sid, key); }}, 'У формі ›'),
      h('button', {type:'button', class:'qe-x', 'aria-label':'Закрити', title:'Закрити (Esc)', onclick:qeClose}, '✕')),
    w);
  document.body.append(box); QE.box = box;
  const ob = ((anchor.closest && anchor.closest('#paper')) || $('#out')).getBoundingClientRect(), ar = anchor.getBoundingClientRect();
  const width = Math.min(560, Math.max(300, ob.width - 16));
  box.style.width = width + 'px';
  box.style.left = Math.max(8, Math.min(window.innerWidth - width - 8, ob.left + 8)) + window.scrollX + 'px';
  const below = ar.bottom + 6, hgt = box.offsetHeight;
  const top = below + hgt > window.innerHeight - 8 && ar.top - hgt - 6 > 8 ? ar.top - hgt - 6 : below;
  box.style.top = top + window.scrollY + 'px';
  const inp = w.querySelector('textarea, input:not([type=search])'); if (inp && (f.type === 'text' || f.type === 'line' || f.type === 'num')) inp.focus({preventScroll:true});
}
function qeHook(){
  const out = $('#out'); if (!out || out.dataset.qe) return; out.dataset.qe = '1';
  out.addEventListener('click', e=>{
    if (!OPG.qe || e.altKey) return;
    const sel = window.getSelection(); if (!sel || !sel.rangeCount || !sel.isCollapsed) return;
    const div = e.target.closest && e.target.closest('#out [data-sec]'); if (!div) return;
    const sid = div.dataset.sec, S = SECTIONS.find(x=>x.id === sid); if (!S) return;
    const r = sel.getRangeAt(0); if (!div.contains(r.startContainer)) return;
    const pre = document.createRange(); pre.selectNodeContents(div); pre.setEnd(r.startContainer, r.startOffset);
    const f = qeField(S, div.textContent, pre.toString().length); if (!f) return;
    if (QE.f === f && QE.box) return;
    qeOpen(f, sid, div);
  });
  out.addEventListener('keydown', ()=>qeClose());
}
document.addEventListener('mousedown', e=>{ if (QE.box && !QE.box.contains(e.target) && !(e.target.closest && e.target.closest('#out'))) qeClose(); }, true);
document.addEventListener('keydown', e=>{ if (e.key === 'Escape' && QE.box) qeClose(); });
{ const sd0 = switchDoc; switchDoc = function(){ qeClose(); return sd0.apply(this, arguments); }; }

{ const up = update; update = function(){ const r = up.apply(this, arguments); try{ ghostSync(); }catch(e){} return r; }; }

/* ---- налаштування ---- */
if (SETTINGS_EL){
  const op = h('select', {id:'set_onepage'}, h('option', {value:'1'}, 'Однією сторінкою — розділи підряд, зміст ліворуч'), h('option', {value:'0'}, 'Вкладками — по одному розділу'));
  op.value = OPG.on ? '1' : '0';
  op.addEventListener('change', ()=>{ OPG.on = op.value === '1'; try{ localStorage.setItem('po.onepage', op.value); }catch(e){} toast(OPG.on ? 'Розділи — однією сторінкою' : 'Розділи — вкладками'); });
  const qe = h('select', {id:'set_qedit'}, h('option', {value:'1'}, 'Відкриває швидку правку цього поля'), h('option', {value:'0'}, 'Лише ставить курсор (правка тексту вручну)'));
  qe.value = OPG.qe ? '1' : '0';
  qe.addEventListener('change', ()=>{ OPG.qe = qe.value === '1'; try{ localStorage.setItem('po.qedit', qe.value); }catch(e){} });
  SETTINGS_EL.append(h('h3', {class:'sub'}, 'Розділи й текст'), h('div', {class:'grid'},
    h('div', {class:'f'}, h('label', {for:'set_onepage'}, 'Розділи форми'), op),
    h('div', {class:'f'}, h('label', {for:'set_qedit'}, 'Клік по фразі в тексті документа'), qe)));
  try{ setRegroup(); }catch(e){}
}
try{ qeHook(); ghostSync(); if (OPG.on) opApply(); }catch(e){ console.warn('onepage', e); }
