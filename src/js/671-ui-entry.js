/* ===== 0.9.3.84 — стиль «Apple»: менше на екрані при вході =====
   • Екран входу «Пацієнти»: поки пацієнта не відкрито й нічого не внесено — лише пошук, «Сьогодні», список пацієнтів
     і одна кнопка «＋ Новий пацієнт» (а також «⇩ З МІС»). Форма — після вибору пацієнта або «＋ Новий пацієнт».
     Перенесення телефон ⇄ комп’ютер і файли — під «Перенесення й файли ▾».
   • «Норма в усіх системах», «Швидкий огляд», «Документ з огляду» — лише в розділах огляду; рядок дій — завжди під рукою.
   • Бічна панель: без «Новий пацієнт» двічі, без «не обрано» й «0 з 13», кружечки — лише в заповнених розділах.
   • Шапка: «Стаціонар / Амбулаторно» — у меню «Профіль»; тема — у «Вигляді»; «Вигляд» — з підписом.
   «Класичний» стиль — як було. ===== */
const UST = {dismissed:false, built:false};
const NONEXAM = ['meta', 'hv', 'calc', 'tpl', 'set', 'help'];
const stOnS = () => typeof UISTYLE !== 'undefined' && UISTYLE === 'ios';
function stEmpty(){
  try{ return !mv('pib') && !mv('card') && !itext($('#out')).trim() && !(DIARIES || []).length && !(RX || []).length; }catch(e){ return false; }
}
function stMeta(){ const t = TABS.find(x=>x.id === 'meta'); return t && t.panel; }
function stBuild(){
  if (UST.built) return; const P = stMeta(); if (!P) return;
  const wrap = [...P.children].find(c=>c.tagName === 'DIV' && !c.classList.contains('ph') && c.querySelector('#meta_pib')); if (!wrap) return;
  const list = [...wrap.children].find(c=>c.querySelector && c.querySelector('#plist')); if (!list) return;
  P.classList.add('ust-panel');
  [...wrap.children].forEach(c=>{ if (c !== list) c.classList.add('ust-form'); });
  list.classList.add('ust-list');
  const ptBox = document.getElementById('plist') && document.getElementById('plist').closest('.pt');
  if (ptBox) [...ptBox.children].forEach(c=>{ if (c.classList.contains('acts2') || c.classList.contains('note')) c.classList.add('ust-more'); });
  const mis = document.querySelector('#misIn button');
  const more = h('button', {type:'button', class:'more ust-mtg', 'aria-expanded':'false', onclick:()=>{ const o = !list.classList.contains('ust-mopen'); list.classList.toggle('ust-mopen', o); more.setAttribute('aria-expanded', o ? 'true' : 'false'); more.textContent = o ? 'Сховати перенесення й файли ▴' : 'Перенесення телефон ⇄ комп’ютер і файли ▾'; }}, 'Перенесення телефон ⇄ комп’ютер і файли ▾');
  const head = h('div', {class:'ust-head'},
    h('h2', {}, 'Пацієнти'),
    h('div', {class:'ust-acts'},
      h('button', {type:'button', class:'btn primary ust-new', onclick:stNew}, '＋ Новий пацієнт'),
      mis ? h('button', {type:'button', class:'btn ust-mis', title:'Перенести дані пацієнта з МІС через буфер обміну', onclick:()=>mis.click()}, '⇩ З МІС') : ''),
    h('p', {class:'chips-hint ust-hint'}, 'Знайдіть пацієнта в списку або почніть нового. Форма огляду відкриється після вибору.'));
  list.prepend(head);
  if (ptBox) ptBox.append(more);
  UST.built = true;
}
function stNew(){
  UST.dismissed = true; stApply();
  const i = TABS.findIndex(t=>t.id === 'meta'); try{ if (i >= 0) show(i); }catch(e){}
  setTimeout(()=>{ const e = document.getElementById('meta_pib'); if (e){ e.focus(); try{ e.scrollIntoView({block:'center'}); }catch(x){} } }, 30);
}
function stApply(){
  const R = document.documentElement, on = stOnS();
  if (on) stBuild();
  const empty = on && stEmpty();
  const start = empty && !UST.dismissed;
  const was = R.classList.contains('ui-start');
  R.classList.toggle('ui-start', start);
  R.classList.toggle('ust-empty', empty);
  if (start && !was){ try{ window.scrollTo({top:0}); }catch(e){} }
  if (start) stSel();
  if (!start && was && !empty) UST.dismissed = false;   /* пацієнта відкрито — наступний порожній знову почнеться зі списку */
  try{ const sp = document.querySelector('#sidecard .sprog'), t = sp && sp.querySelector('.sp1'); if (sp) sp.classList.toggle('ust-zero', !!t && /(^|\D)0 з \d/.test(t.textContent)); }catch(e){}
}
function exApply(){
  const id = (TABS[active] || {}).id;
  document.documentElement.classList.toggle('ui-nonexam', stOnS() && NONEXAM.includes(id));
}
/* новий пацієнт з будь-якої кнопки — одразу форма */
['newPatient'].forEach(nm=>{ const f = window[nm]; if (typeof f === 'function') window[nm] = function(){ UST.dismissed = true; const r = f.apply(this, arguments); try{ stApply(); }catch(e){} return r; }; });
{ const x0 = show; show = function(i){ const ev = window.event; if (ev && ev.isTrusted && TABS[i] && TABS[i].id !== 'meta') UST.dismissed = true; const r = x0.apply(this, arguments); try{ stApply(); exApply(); }catch(e){} return r; }; }
function stSel(){ if (!document.documentElement.classList.contains('ui-start')) return; const i = TABS.findIndex(t=>t.id === 'meta'); if (i < 0) return; TABS.forEach((t, k)=>t.tab.setAttribute('aria-selected', k === i ? 'true' : 'false')); }
{ const x0 = opSpy; opSpy = function(){ if (document.documentElement.classList.contains('ui-start')){ OPG.raf = 0; stSel(); return; } const r = x0.apply(this, arguments); try{ exApply(); }catch(e){} return r; }; }
{ const x0 = update; update = function(){ const r = x0.apply(this, arguments); try{ stApply(); }catch(e){} return r; }; }
{ const x0 = uiStyleApply; uiStyleApply = function(){ const r = x0.apply(this, arguments); try{ stApply(); exApply(); hdrApply(); }catch(e){} return r; }; }
/* бічний зміст: при вході підсвічено те, що видно (раніше — «Скарги», хоча на екрані «Пацієнт і запис») */
function spySync(){ try{ const m = stMeta(); if (document.body.classList.contains('onepage') && m && m.getBoundingClientRect().height > 0){ OPG.lock = 0; opSpy(); } }catch(e){} }
/* шапка: режим — у меню «Профіль», тема — у «Вигляді» */
function modeName(){ return MODE === 'amb' ? 'Амбулаторно' : 'Стаціонар'; }
function hdrApply(){
  const b = document.getElementById('profBtn'); if (!b) return;
  let m = b.querySelector('.pmode');
  const pl = b.querySelector('.pl');
  if (stOnS()){ if (!m){ m = h('span', {class:'pmode'}); b.append(m); } m.textContent = ' · ' + modeName() + ' ▾'; if (pl) pl.textContent = pl.textContent.replace(/\s*▾\s*$/, ''); }
  else if (m) m.remove();
}
{ const x0 = renderProfBtn; renderProfBtn = function(){ const r = x0.apply(this, arguments); try{ hdrApply(); }catch(e){} return r; }; }
{ const x0 = applyMode; applyMode = function(){ const r = x0.apply(this, arguments); try{ hdrApply(); }catch(e){} return r; }; }
function profPop(){
  const old = document.getElementById('profPop'); if (old){ old.remove(); return; }
  const b = document.getElementById('profBtn'), seg = document.getElementById('modeSeg');
  const box = h('div', {id:'profPop', class:'viewpop profpop', role:'dialog', 'aria-label':'Профіль і режим'});
  const close = () => { box.remove(); document.removeEventListener('pointerdown', out, true); };
  const out = e => { if (!box.contains(e.target) && e.target !== b && !b.contains(e.target)) close(); };
  if (seg && !(PROF && (PROF.w === 'hosp' || PROF.w === 'amb'))){
    box.append(h('div', {class:'vrow'}, h('span', {class:'vl'}, 'Режим'), h('div', {class:'vseg', role:'group', 'aria-label':'Режим'},
      ...[...seg.querySelectorAll('button')].map(src=>h('button', {type:'button', 'aria-pressed':src.dataset.mode === MODE ? 'true' : 'false', onclick:()=>{ src.click(); close(); }}, src.textContent.trim())))));
  }
  box.append(h('button', {type:'button', class:'btn', onclick:()=>{ close(); profileDialog(false); }}, '👤 Профіль: спеціальність і місце роботи…'));
  document.body.append(box);
  const r = b.getBoundingClientRect(); box.style.top = Math.round(r.bottom + 6) + 'px'; box.style.right = Math.max(8, Math.round(window.innerWidth - r.right)) + 'px';
  setTimeout(()=>document.addEventListener('pointerdown', out, true), 0);
}
{ const b = document.getElementById('profBtn'); if (b){ const o = b.onclick; b.onclick = e => { if (stOnS() && window.innerWidth >= 900){ e.preventDefault(); profPop(); } else if (o) o.call(b, e); }; } }
{ const x0 = viewCtl; viewCtl = function(){
  const box = x0.apply(this, arguments);
  if (stOnS() && typeof THEME_NAMES !== 'undefined'){
    const row = h('div', {class:'vrow'}, h('span', {class:'vl'}, 'Тема'), h('div', {class:'vseg', role:'group', 'aria-label':'Тема кольорів'},
      ...[['auto','Авто'],['day','День'],['warm','Папір'],['night','Ніч'],['grey','Кабінет']].map(([k, l])=>h('button', {type:'button', 'aria-pressed':THEME === k ? 'true' : 'false', onclick:()=>{ themeSet(k); try{ renderViewCtl(); }catch(e){} }}, l))));
    const first = box.querySelector('.vrow'); if (first) first.after(row); else box.prepend(row);
  }
  return box; }; }
try{ stApply(); exApply(); hdrApply(); }catch(e){}
try{ requestAnimationFrame(()=>{ spySync(); try{ SHELL.placeDocs(); }catch(e){} stApply(); exApply(); }); }catch(e){}
