/* ===== 0.9.3.58 — телефон: «Як працювати з пацієнтом» =====
   Лікар відкриває програму на телефоні і не розуміє, з чого почати. Тепер:
   • угорі вкладки «Пацієнт» — картка «Порядок роботи»: 6 кроків від ПІБ до «Копіювати», кожен — кнопка,
     що веде на потрібне місце; виконані кроки позначаються ✓, наступний підсвічено;
   • поки ПІБ не вписано — розгорнута, далі згорнута в рядок «крок N з 6 · далі: …»; прибрати — «Більше не показувати»; повернути — «⋯» → «❓ Як працювати з пацієнтом»;
   • шапка без пацієнта коротка: «Новий пацієнт» / «Список пацієнтів ▾» (без обрізаних підказок);
   • поруч із «⋯» видно, який документ заповнюєте (Огляд, Щоденник…). */
const PHST = { hide:false, open:null };
try{ PHST.hide = localStorage.getItem('po.phstart') === '0'; }catch(e){}
function phstGroupIdx(label){ try{ const g = phtGroups().find(x=>x.l === label); return g ? g.idx : []; }catch(e){ return []; } }
function phstFilled(label){ return phstGroupIdx(label).some(i=>TABS[i] && TABS[i].special !== 'hv' && TABS[i].tab.classList.contains('filled')); }
function phstGo(label, id){
  if (id){ const i = TABS.findIndex(t=>t.id === id); if (i >= 0){ $('#outBox').classList.remove('open'); show(i); window.scrollTo({top:0}); return; } }
  if (label === 'Текст'){ $('#outBox').classList.add('open'); return; }
  const idx = phstGroupIdx(label); if (idx.length){ $('#outBox').classList.remove('open'); show(idx[0]); window.scrollTo({top:0}); }
}
const hasHv0 = () => TABS.some(t=>t.special === 'hv' && t.tab && !t.tab.hidden);
function phstSteps(){
  const G = (()=>{ try{ return phtGroups().map(g=>g.l); }catch(e){ return []; } })();
  const S = [
    {k:'pt', i:'👤', t:'ПІБ і дата народження', d:'Розділ «Запис». Стать і вік визначаться самі.', done:!!mv('pib'), go:()=>{ const i = TABS.findIndex(t=>t.special === 'meta'); if (i >= 0){ $('#outBox').classList.remove('open'); show(i); window.scrollTo({top:0}); setTimeout(()=>{ const e = document.getElementById('meta_pib'); if (e && !e.value) e.focus(); }, 150); } else phstGo('Пацієнт'); }},
    G.includes('Анамнез') ? {k:'an', i:'💬', t:'Опитайте: скарги й анамнез', d:'Вкладка «Анамнез» унизу. Коли скарги вибрано — програма підкаже, на що схоже.', done:phstFilled('Анамнез'), go:()=>phstGo('Анамнез')} : null,
    G.includes('Огляд') ? {k:'og', i:'🩺', t:'Огляд', d:'Вкладка «Огляд»: змінюйте лише те, що не в нормі.', done:phstFilled('Огляд'), go:()=>phstGo('Огляд')} : null,
    G.includes('Висновок') ? {k:'vy', i:'📋', t:'Діагноз і план', d:'Вкладка «Висновок». Допомога — шаблон хвороби (за бажанням).', done:phstFilled('Висновок'), go:()=>phstGo('Висновок')} : null,
    {k:'tx', i:'📄', t:'Перевірте текст і скопіюйте', d:'Вкладка «Текст»: зауваження, «Копіювати» або «Друк».', done:false, go:()=>phstGo('Текст')}
  ].filter(Boolean);
  const n = S.findIndex(s=>!s.done); if (n >= 0) S[n].next = true;
  return S;
}
function phstCard(){
  const st = phstSteps(), nx = st.findIndex(s=>s.next), open = PHST.open != null ? PHST.open : !mv('pib') && !(TABS[active] && TABS[active].special === 'meta');
  const box = h('details', {class:'phstart', 'aria-label':'Порядок роботи з пацієнтом'}); if (open) box.open = true;
  
  box.append(h('summary', {class:'phst-h', onclick:()=>{ PHST.open = !box.open; }},
    h('b', {}, 'Порядок роботи'),
    h('span', {class:'phst-p'}, nx >= 0 ? `крок ${nx + 1} з ${st.length} · далі: ${st[nx].t}` : 'усе заповнено'),
    h('span', {class:'phst-dd', 'aria-hidden':'true'}, '▾')));
  const ol = h('ol', {class:'phst-l'});
  st.forEach((s, k)=>ol.append(h('li', {}, h('button', {type:'button', class:'phst-s' + (s.done ? ' done' : '') + (s.next ? ' next' : ''), onclick:s.go},
    h('span', {class:'phst-n', 'aria-hidden':'true'}, s.done ? '✓' : String(k + 1)),
    h('span', {class:'phst-t'}, h('b', {}, s.i + ' ' + s.t), h('span', {}, s.d)),
    s.done ? h('span', {class:'phst-ok'}, s.k === 'pt' ? 'є' : 'заповнено') : ''))));
  box.append(ol, hasHv0() ? h('button', {type:'button', class:'btn phst-tpl', onclick:()=>{ const i = TABS.findIndex(t=>t.special === 'hv'); if (i >= 0){ $('#outBox').classList.remove('open'); show(i); window.scrollTo({top:0}); } }}, '📋 Шаблон хвороби — за бажанням') : '', h('p', {class:'phst-f'}, 'Усе зберігається само. Інший пацієнт — натисніть шапку вгорі; новий — «＋ Новий пацієнт».'),
    h('button', {type:'button', class:'btn phst-x', onclick:()=>{ PHST.hide = true; try{ localStorage.setItem('po.phstart', '0'); }catch(e){} phstRender(); toast('Повернути: «⋯» → «Як працювати з пацієнтом»', 3000); }}, 'Більше не показувати'));
  return box;
}
function phstRender(){
  document.querySelectorAll('.phstart').forEach(x=>x.remove());
  if (PHST.hide || !isPhone() || typeof phtOn !== 'function' || !phtOn()) return;
  if (DOC === 'shch') return;
  const cur = TABS[active]; if (!cur || !cur.panel || TOOL_TABS.includes(cur.id)) return;
  let g = ''; try{ g = phtGroupOf(active); }catch(e){}
  if (g !== 'Пацієнт') return;
  cur.panel.prepend(phstCard());
}
{ const x0 = renderTabNav; renderTabNav = function(){ const r = x0.apply(this, arguments); try{ phstRender(); }catch(e){} return r; }; }
{ let t = 0; const x0 = update; update = function(){ const r = x0.apply(this, arguments); clearTimeout(t); t = setTimeout(()=>{ try{ if (document.querySelector('.phstart')) phstRender(); }catch(e){} }, 400); return r; }; }
/* у «⋯ Документ і дії» — повернути картку */
{ const x0 = openActs; openActs = function(){ const r = x0.apply(this, arguments);
  const lists = document.querySelectorAll('.actsheet .as-list'), l = lists[lists.length - 1];
  if (l) l.prepend(h('button', {type:'button', class:'btn', onclick:()=>{ const sh = document.querySelector('.actsheet'); if (sh) sh.remove(); document.body.style.overflow = '';
    PHST.hide = false; PHST.open = true; try{ localStorage.removeItem('po.phstart'); }catch(e){} phstGo('Пацієнт'); phstRender(); }}, '❓ Як працювати з пацієнтом'));
  return r; }; }
/* коротка шапка без пацієнта */
{ const x0 = renderPtBar; renderPtBar = function(){ const r = x0.apply(this, arguments);
  try{ if (isPhone()){ const bar = $('#ptbar'), p2 = bar && bar.querySelector('.pt2'), p1 = bar && bar.querySelector('.pt1');
    if (p2 && p2.textContent === 'Натисніть тут — список пацієнтів'){ p2.textContent = 'Список пацієнтів ▾'; p1.innerHTML = ''; p1.append(h('span', {class:'warn', style:'display:inline'}, 'Новий пацієнт')); } } }catch(e){}
  return r; }; }
try{ renderPtBar(); renderTabNav(); }catch(e){}
