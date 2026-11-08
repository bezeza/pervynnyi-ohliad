/* ===== 0.9.3.95 — каркас: введення пацієнта (PLAN-UI-0.10, «Введення пацієнта») — лише новий вигляд =====
   • Дата народження — цифрами з маскою дд.мм.рррр (крапки ставляться самі), а не системний вибір дати
     (у Chrome з англійською мовою він показував мм/дд/рррр). Програма й далі зберігає дату в полі meta_dob.
   • Вік — текстом, а не порожнім полем вводу.
   • Імпорт — одна кнопка «Імпорт ▾» замість трьох («⇩ З МІС», закладка, «Імпорт з H24»).
   Стать з по батькові й курсор у ПІБ після «Новий пацієнт» уже були (як у плані) — не змінювались.
   «Старий вигляд» — як було. */
const V2P = {};
const v2pFmt = iso => { const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso || ''); return m ? m[3] + '.' + m[2] + '.' + m[1] : ''; };
function v2pDob(){
  const d = document.getElementById('meta_dob'); if (!d || V2P.t) return;
  const t = h('input', {type:'text', id:'meta_dob_t', class:'v2dob', inputmode:'numeric', autocomplete:'off', maxlength:'10', placeholder:'дд.мм.рррр',
    'aria-label':'Дата народження, дд.мм.рррр', title:'Цифрами: 12031962 — крапки поставляться самі'});
  t.addEventListener('input', ()=>{
    const dg = t.value.replace(/\D/g, '').slice(0, 8);
    const f = dg.length > 4 ? dg.slice(0, 2) + '.' + dg.slice(2, 4) + '.' + dg.slice(4) : dg.length > 2 ? dg.slice(0, 2) + '.' + dg.slice(2) : dg;
    if (t.value !== f){ const end = t.selectionStart === t.value.length; t.value = f; if (end) t.setSelectionRange(f.length, f.length); }
    let iso = '', bad = false;
    if (dg.length === 8){
      const dd = +dg.slice(0, 2), mm = +dg.slice(2, 4), yy = +dg.slice(4), D = new Date(yy, mm - 1, dd);
      bad = !(D.getFullYear() === yy && D.getMonth() === mm - 1 && D.getDate() === dd) || yy < 1900 || D > new Date();
      if (!bad) iso = dg.slice(4) + '-' + dg.slice(2, 4) + '-' + dg.slice(0, 2);
    }
    t.classList.toggle('bad', bad); t.setAttribute('aria-invalid', bad ? 'true' : 'false');
    if (dg.length === 8 || !dg.length){ if (d.value !== iso){ d.value = iso; d.dispatchEvent(new Event('input', {bubbles:true})); d.dispatchEvent(new Event('change', {bubbles:true})); } }
  });
  d.before(t); V2P.t = t; v2pSync();
}
/* поле з маскою йде за справжнім полем дати (відкриття пацієнта, очищення, імпорт) */
function v2pSync(){ const d = document.getElementById('meta_dob'), t = V2P.t; if (!d || !t || document.activeElement === t) return;
  if (t.classList.contains('bad') && !d.value) return; /* неправильну дату лишаємо на екрані, щоб лікар її виправив */ const v = v2pFmt(d.value); if (t.value !== v){ t.value = v; t.classList.remove('bad'); } }
{ const u0 = update; update = function(){ const r = u0.apply(this, arguments); try{ v2pSync(); }catch(e){} return r; }; }

/* «Імпорт ▾»: одне меню; пункти викликають ті самі кнопки, що й раніше */
function v2pImportMenu(anchor){
  document.querySelectorAll('.v2imp-pop').forEach(p=>p.remove());
  const mis = document.querySelector('#misIn > button:not([data-h24-import])'), bm = document.querySelector('#misIn > a');
  const close = () => { pop.remove(); anchor.setAttribute('aria-expanded', 'false'); document.removeEventListener('click', out, true); };
  const item = (t, s, fn) => h('button', {type:'button', class:'v2imp-i', onclick:()=>{ close(); fn(); }}, h('b', {}, t), h('span', {}, s));
  const pop = h('div', {class:'v2imp-pop', role:'menu', 'aria-label':'Імпорт пацієнта'},
    mis ? item('З МІС', 'ПІБ, стать і дата народження — з буфера після закладки', ()=>mis.click()) : '',
    typeof h24ImportOpen === 'function' ? item('З Health24', 'Дані з кнопки «→ в Первинний огляд» у МІС; спершу покаже, що заповниться', ()=>h24ImportOpen()) : '');
  if (bm){ const c = bm.cloneNode(true); c.classList.add('v2imp-bm'); c.onclick = e=>{ e.preventDefault(); toast('Перетягніть цю кнопку на панель закладок (Ctrl+Shift+B — показати панель)', 4000); };
    pop.append(h('div', {class:'v2imp-note'}, 'Закладка для МІС — один раз перетягніть на панель закладок:'), c); }
  document.body.append(pop);
  const r = anchor.getBoundingClientRect(); pop.style.top = Math.round(r.bottom + 6) + 'px'; pop.style.left = Math.round(Math.min(r.left, window.innerWidth - 360)) + 'px';
  anchor.setAttribute('aria-expanded', 'true');
  const out = e=>{ if (!pop.contains(e.target) && e.target !== anchor) close(); };
  setTimeout(()=>document.addEventListener('click', out, true), 0);
  pop.addEventListener('keydown', e=>{ if (e.key === 'Escape'){ close(); anchor.focus(); } });
  const f = pop.querySelector('button'); if (f) f.focus();
}
function v2pImportBtn(){ const b = h('button', {type:'button', class:'btn v2imp', 'aria-haspopup':'menu', 'aria-expanded':'false'}, 'Імпорт ▾'); b.onclick = e=>{ e.stopPropagation(); v2pImportMenu(b); }; return b; }
function v2pPlace(){
  const mis = document.getElementById('misIn'); if (mis && !mis.querySelector('.v2imp')) mis.prepend(v2pImportBtn());
  document.querySelectorAll('.ust-acts').forEach(a=>{ if (!a.querySelector('.v2imp')) a.append(v2pImportBtn()); });
}
{ const s0 = stBuild; stBuild = function(){ const r = s0.apply(this, arguments); try{ v2pPlace(); }catch(e){} return r; }; }
v2pDob(); v2pPlace(); setTimeout(v2pPlace, 450);   // кнопка H24 з’являється із затримкою (674)
{ const l = document.querySelector('label[for="meta_dob"]');
  const a0 = uiV2Apply; uiV2Apply = function(){ const r = a0.apply(this, arguments); if (l) l.htmlFor = UIV2 ? 'meta_dob_t' : 'meta_dob'; v2pSync(); return r; };
  if (l && UIV2) l.htmlFor = 'meta_dob_t'; }
