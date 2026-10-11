/* ===== Зручність введення: живий текст унизу, кнопки замість коротких списків, «хворіє протягом», скарги ===== */
/* 1. Стрічка з текстом поточного розділу (телефон). Налаштування: стрічка / кнопка «Текст огляду» */
let LIVE = 'bar'; try{ LIVE = localStorage.getItem('po.live') || 'bar'; }catch(e){}
const liveBar = h('div', {class:'livebar', id:'liveBar', role:'button', tabindex:'0', 'aria-label':'Текст поточного розділу — натисніть, щоб відкрити весь документ'});
document.body.append(liveBar);
liveBar.addEventListener('click', e=>{ if (e.target.closest('.lv-x')) return; $('#outBox').classList.add('open'); });
function liveText(){
  const t = TABS[active]; if (!t) return '';
  try{
    if (SECTIONS.includes(t)){ const p = sectionText(t); if (!p || !p.body) return ''; return g((p.head ? p.head + ' ' : '') + p.body); }
    if (t === RXT){ const p = rxPart(); return p ? g((p.head ? p.head + ' ' : '') + p.body.replace(/\n/g, ' ')) : ''; }
  }catch(e){}
  return '';
}
function renderLive(){
  const mob = window.matchMedia && matchMedia('(max-width:899px)').matches, on = mob && LIVE === 'bar';
  document.body.classList.toggle('live-on', on); const tb = $('#toText'); if (tb) tb.hidden = on;
  liveBar.hidden = !on; if (!on) return;
  const txt = liveText(), all = itext($('#out')).trim();
  liveBar.innerHTML = '';
  liveBar.append(h('span', {class:'lv-t'}, txt || (all ? 'У цьому розділі ще нічого не відмічено. Натисніть, щоб побачити весь документ.' : 'Тут з’явиться текст розділу, щойно почнете відмічати.')),
    h('span', {class:'lv-o', 'aria-hidden':'true'}, '▴ весь текст'));
}
/* 2. Короткі списки (до 5 варіантів) — кнопками; список лишається прихованим, тож усе інше працює як раніше */
function segFor(f){
  if (f.type !== 'sel' || f.headOnly || !f.el || f.seg || f.opts.length > 5 || f.opts.length < 2) return;
  if (f.opts.some(o=>String(O(o).l).length > 34)) return;
  const box = h('div', {class:'segbtns', role:'group', 'aria-label':f.label || ''});
  const sync = () => { [...box.children].forEach((b,i)=>{ b.setAttribute('aria-pressed', f.el.value === String(i) ? 'true' : 'false'); b.textContent = f.el.options[i + (f.el.options[0] && f.el.options[0].value === '' ? 1 : 0)].textContent; }); };
  f.opts.forEach((o,i)=>box.append(h('button', {type:'button', class:'chip sg', onclick:()=>{ f.el.value = f.el.value === String(i) ? '' : String(i); f.el.dispatchEvent(new Event('change', {bubbles:true})); sync(); }})));
  f.el.classList.add('seg-hidden'); f.el.after(box); f.seg = sync; f.el.addEventListener('change', sync); sync();
}
SECTIONS.forEach(s=>s.fields.forEach(segFor));
{ const m0 = mark; mark = function(sel, f){ m0(sel, f); if (f && f.seg) f.seg(); }; }
/* 3. «Хворіє протягом» — кнопками */
{ const f = F('morbi.dur'); if (f && f.inp){
  const set = (n, u) => { f.inp.value = n; f.unit.value = u; f.inp.dispatchEvent(new Event('input', {bubbles:true})); update(); };
  f.inp.closest('.f').append(h('div', {class:'chips durq'}, ...[['1 день',1,0],['2 дні',2,0],['3 дні',3,0],['5 днів',5,0],['тиждень',1,1],['2 тижні',2,1],['місяць',1,2],['рік',1,3]].map(([l,n,u])=>h('button', {type:'button', class:'chip s', onclick:()=>set(n, u)}, l))));
} }
/* 4. Скарги: номер черговості на відмічених і «+ Додати» з пошуку */
function renderOrderMarks(){
  SECTIONS.forEach(s=>s.fields.forEach(f=>{ if (f.type !== 'multi' || !f.search || !f.chips) return;
    const on = f.chips.map((c,i)=>c.getAttribute('aria-pressed') === 'true' ? {c, o:+(c.dataset.ord || 0)} : null).filter(Boolean).sort((a,b)=>a.o - b.o);
    f.chips.forEach(c=>c.removeAttribute('data-n')); if (on.length > 1) on.forEach((x,k)=>x.c.setAttribute('data-n', String(k + 1)));
    if (f.q){ const q = f.q.value.trim(); let b = f.q.nextElementSibling && f.q.nextElementSibling.classList.contains('qadd') ? f.q.nextElementSibling : null;
      const exact = q && f.opts.some(o=>O(o).t.toLowerCase() === q.toLowerCase());
      if (q.length >= 3 && !exact){ if (!b){ b = h('button', {type:'button', class:'btn qadd'}); f.q.after(b); }
        b.textContent = '+ Додати «' + q + '»'; b.onclick = ()=>{ const key = s.id + '.' + f.id; addOptionLive(key, q); try{ CUSTOM.opts = CUSTOM.opts || {}; (CUSTOM.opts[key] = CUSTOM.opts[key] || []).includes(q) || CUSTOM.opts[key].push(q); saveCustom(); }catch(e){}
          const i = f.opts.findIndex(o=>O(o).t === q); if (i >= 0 && f.chips[i].getAttribute('aria-pressed') !== 'true') f.chips[i].click(); f.q.value = ''; refreshChips(f); b.remove(); update(); toast('Додано і відмічено. Варіант збережено в «Моїх шаблонах»', 2500); }; }
      else if (b) b.remove(); }
  }));
}
SECTIONS.forEach(s=>s.fields.forEach(f=>{ if (f.q) f.q.addEventListener('input', renderOrderMarks); }));
/* 5. «Збережено ✓ hh:mm» у смужці пацієнта */
{ const ms0 = markSaved; markSaved = function(ok){ ms0(ok); const b = $('#ptbar .pt1'); if (!b) return; let s = b.parentElement.querySelector('.pt-saved'); if (!s){ s = h('span', {class:'pt-saved'}); b.parentElement.append(s); }
  s.textContent = ok ? '✓ ' + new Date().toLocaleTimeString('uk-UA', {hour:'2-digit', minute:'2-digit'}) : '⚠ не збережено'; s.classList.toggle('bad', !ok); }; }
/* підключення до оновлення форми */
window.addEventListener('resize', renderLive);
{ const s0 = show; show = function(i){ const r = s0(i); try{ renderLive(); }catch(e){} return r; }; }
renderLive();
/* налаштування */
if (SETTINGS_EL){ const sl = h('select', {id:'set_live'}, h('option', {value:'bar'}, 'Стрічка внизу з текстом поточного розділу'), h('option', {value:'btn'}, 'Окрема кнопка «Текст огляду»'));
  sl.value = LIVE; sl.addEventListener('change', ()=>{ LIVE = sl.value; try{ localStorage.setItem('po.live', LIVE); }catch(e){} renderLive(); });
  SETTINGS_EL.append(h('h3', {class:'sub'}, 'Текст документа на телефоні'), h('div', {class:'grid'}, h('div', {class:'f wide'}, h('label', {for:'set_live'}, 'Як показувати'), sl))); }
