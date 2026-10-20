/* ===== Вигляд (0.9.2): режим екрана (ноутбук / монітор), розташування А–Г, межа форма | текст, згортання тексту ===== */
const VIEW = Object.assign({screen:'auto', layout:'auto', split:null, fold:false}, (()=>{ try{ return JSON.parse(lsGet('po.view', '{}')) || {}; }catch(e){ return {}; } })());
if (lsGet('po.side', '0') === '1' && !lsGet('po.view', '')) VIEW.layout = 'B';   // 0.9.1: «бічна панель» → «Робоче місце»
const saveView = () => lsSet('po.view', JSON.stringify(VIEW));
const LAYS = {A:'Класичне', B:'Робоче місце', C:'Дзеркальне', D:'Один стовпчик'};
const LAY_HINT = {A:'вкладки згори, форма зліва, текст справа', B:'розділи збоку, форма посередині, текст справа', C:'текст зліва, форма справа', D:'форма на всю ширину, текст — стрічкою знизу і панеллю збоку'};
const LAY_ICON = {
  A:'<rect x="1" y="1" width="30" height="20" rx="2"/><path d="M3 4h14M3 7h14"/><rect x="19" y="4" width="10" height="15" rx="1"/>',
  B:'<rect x="1" y="1" width="30" height="20" rx="2"/><path d="M3 4v15M7 4h9M7 7h9"/><rect x="19" y="4" width="10" height="15" rx="1"/>',
  C:'<rect x="1" y="1" width="30" height="20" rx="2"/><rect x="3" y="4" width="10" height="15" rx="1"/><path d="M15 4h14M15 7h14"/>',
  D:'<rect x="1" y="1" width="30" height="20" rx="2"/><path d="M5 4h22M5 7h22M5 10h22"/><rect x="3" y="15" width="26" height="4" rx="1"/>'};
const isPhoneW = () => window.matchMedia && matchMedia('(max-width:899px)').matches;
const effW = () => window.innerWidth / (parseFloat(ZOOM) || 1);
const screenNow = () => VIEW.screen === 'auto' ? (effW() < 1500 ? 'laptop' : 'monitor') : VIEW.screen;
const layoutNow = () => isPhoneW() ? 'P' : LAYS[VIEW.layout] ? VIEW.layout : (screenNow() === 'monitor' || effW() >= 1200 ? 'B' : 'A');

/* межа між формою і текстом */
const wrapEl = $('main.wrap'), grip = h('div', {class:'vgrip', role:'separator', 'aria-orientation':'vertical', tabindex:'0', title:'Перетягніть, щоб змінити ширину. Подвійне клацання — як було', 'aria-label':'Межа між формою і текстом'});
$('#outBox').before(grip);
const foldStrip = h('button', {type:'button', class:'ofold', title:'Показати текст документа', onclick:()=>setFold(false)}, h('span', {}, 'Текст документа ◂'));
$('#outBox').append(foldStrip);
{ const oh = $('#outBox .oh .acts'); if (oh) oh.prepend(h('button', {type:'button', class:'btn ofbtn', title:'Згорнути текст документа в смужку — більше місця для форми', 'aria-label':'Згорнути текст', onclick:()=>setFold(true)}, '⇥')); }
function setFold(v){ VIEW.fold = !!v; saveView(); applyView(); }
function applySplit(){ wrapEl.style.setProperty('--sf', (VIEW.split || (layoutNow() === 'B' ? 1.4 : 1.25)) + 'fr'); }
(()=>{ let d = null;
  grip.addEventListener('pointerdown', e=>{ const L = layoutNow(); if (L === 'P' || L === 'D' || VIEW.fold) return; e.preventDefault(); grip.setPointerCapture(e.pointerId); d = {r:wrapEl.getBoundingClientRect(), mir:L === 'C'}; document.body.classList.add('resizing'); });
  grip.addEventListener('pointermove', e=>{ if (!d) return; const tot = d.r.width - 16, x = d.mir ? d.r.right - e.clientX : e.clientX - d.r.left; const fw = Math.max(320, Math.min(tot - 300, x - 8));
    VIEW.split = +(fw / (tot - fw)).toFixed(3); applySplit(); });
  const end = () => { if (!d) return; d = null; document.body.classList.remove('resizing'); saveView(); };
  grip.addEventListener('pointerup', end); grip.addEventListener('pointercancel', end);
  grip.addEventListener('dblclick', ()=>{ VIEW.split = null; saveView(); applySplit(); toast('Межа — як було'); });
  grip.addEventListener('keydown', e=>{ if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return; e.preventDefault(); const cur = VIEW.split || 1.25, dir = (e.key === 'ArrowRight' ? 1 : -1) * (layoutNow() === 'C' ? -1 : 1);
    VIEW.split = +Math.max(.5, Math.min(3, cur + dir * .1)).toFixed(2); applySplit(); saveView(); });
})();

function applyView(){
  const L = layoutNow(), S = screenNow(), ph = L === 'P', b = document.body, r = document.documentElement;
  ['A','B','C','D'].forEach(k=>b.classList.toggle('lay-' + k, L === k));
  r.classList.toggle('scr-laptop', !ph && S === 'laptop'); r.classList.toggle('scr-monitor', !ph && S === 'monitor');
  b.classList.toggle('outfold', !ph && L !== 'D' && !!VIEW.fold);
  if (L !== 'D' && !ph) $('#outBox').classList.remove('open');
  applySplit(); try{ renderLive(); }catch(e){} renderViewCtl();
}
/* керування: однаково в меню «Вигляд» і в Налаштуваннях */
function viewCtl(){
  const box = h('div', {class:'vctl'});
  const seg = (name, cur, items, fn) => h('div', {class:'vrow'}, h('span', {class:'vl'}, name), h('div', {class:'vseg', role:'group', 'aria-label':name},
    ...items.map(([k, l, t])=>h('button', {type:'button', 'aria-pressed':cur === k ? 'true' : 'false', title:t || '', onclick:()=>fn(k)}, l))));
  const sNow = screenNow();
  box.append(seg('Екран', VIEW.screen, [['auto', 'Авто', 'Визначається за шириною екрана: до 1500 px — ноутбук'], ['laptop', 'Ноутбук', 'Компактно: менші відступи, шапка в один рядок'], ['monitor', 'Монітор', 'Просторо: ширша робоча область, більший текст документа']],
    k=>{ VIEW.screen = k; saveView(); applyView(); toast(k === 'auto' ? `Екран визначається сам: зараз ${screenNow() === 'laptop' ? 'ноутбук' : 'монітор'}` : k === 'laptop' ? 'Екран: ноутбук — компактно' : 'Екран: монітор — просторо'); }));
  if (VIEW.screen === 'auto') box.append(h('p', {class:'chips-hint vnote'}, `Зараз: ${sNow === 'laptop' ? 'ноутбук' : 'монітор'} (${Math.round(effW())} px).`));
  const lay = h('div', {class:'vlays', role:'group', 'aria-label':'Розташування'});
  [['auto', 'Авто', 'на вузькому екрані (до 1200 px) — Класичне, ширше — Робоче місце']].concat(Object.keys(LAYS).map(k=>[k, LAYS[k], LAY_HINT[k]])).forEach(([k, l, t])=>{
    const ic = h('span', {class:'vic', 'aria-hidden':'true'}); ic.innerHTML = k === 'auto' ? '<svg viewBox="0 0 32 22"><rect x="1" y="1" width="30" height="20" rx="2"/><path d="M9 15l7-8 7 8"/></svg>' : `<svg viewBox="0 0 32 22">${LAY_ICON[k]}</svg>`;
    lay.append(h('button', {type:'button', 'aria-pressed':VIEW.layout === k ? 'true' : 'false', title:t, onclick:()=>{ VIEW.layout = k; saveView(); applyView(); toast('Розташування: ' + (k === 'auto' ? 'авто — ' + LAYS[layoutNow()] : LAYS[k])); }}, ic, h('b', {}, l), h('small', {}, t))); });
  box.append(h('div', {class:'vrow col'}, h('span', {class:'vl'}, 'Розташування'), lay));
  const zl = h('b', {class:'vz'}, Math.round((parseFloat(ZOOM) || 1) * 100) + ' %');
  const zs = d => { const L = [0.9, 1, 1.1, 1.2, 1.3, 1.4, 1.5]; let i = L.indexOf(parseFloat(ZOOM) || 1); if (i < 0) i = 1; i = Math.max(0, Math.min(L.length - 1, i + d)); ZOOM = String(L[i]);
    lsSet('po.zoom', ZOOM); applyZoom(); const z = $('#set_zoom'); if (z) z.value = ZOOM; applyView(); };
  box.append(h('div', {class:'vrow'}, h('span', {class:'vl'}, 'Масштаб'), h('div', {class:'vseg'}, h('button', {type:'button', 'aria-label':'Менше', onclick:()=>zs(-1)}, '−'), zl, h('button', {type:'button', 'aria-label':'Більше', onclick:()=>zs(1)}, '+'))));
  box.append(h('div', {class:'vrow'}, h('span', {class:'vl'}, 'Текст документа'), h('div', {class:'vseg'},
    h('button', {type:'button', 'aria-pressed':VIEW.fold ? 'true' : 'false', onclick:()=>setFold(!VIEW.fold), title:'Згорнути текст у вузьку смужку (не в «Одному стовпчику»)'}, VIEW.fold ? 'Згорнуто' : 'Згорнути'),
    h('button', {type:'button', onclick:()=>{ VIEW.split = null; saveView(); applySplit(); toast('Межа — як було'); }, title:'Повернути ширину форми й тексту'}, 'Межа — як було'))));
  box.append(h('p', {class:'chips-hint vnote'}, 'Межу між формою і текстом можна перетягнути мишкою. На телефоні вигляд завжди один.'));
  return box;
}
const viewBtn = h('button', {type:'button', class:'btn', id:'viewBtn', 'aria-haspopup':'dialog', 'aria-expanded':'false', title:'Вигляд: ноутбук / монітор, розташування, масштаб'}, h('span', {'aria-hidden':'true'}, '▦'), h('span', {class:'vbt'}, ' Вигляд'));
const viewPop = h('div', {class:'viewpop', role:'dialog', 'aria-label':'Вигляд', hidden:''});
{ const tb = $('#themeBtn'); tb.after(viewBtn); document.body.append(viewPop); }
function renderViewCtl(){
  if (!viewPop.hidden){ viewPop.innerHTML = ''; viewPop.append(h('div', {class:'vph'}, h('b', {}, 'Вигляд'), h('button', {type:'button', class:'btn sm', onclick:closeViewPop}, '✕')), viewCtl()); }
  const vs = $('#viewSet'); if (vs){ vs.innerHTML = ''; vs.append(viewCtl()); }
}
function placeViewPop(){ const r = viewBtn.getBoundingClientRect(); viewPop.style.top = Math.round(r.bottom + 6) + 'px'; viewPop.style.right = Math.max(8, Math.round(window.innerWidth - r.right)) + 'px'; }
function openViewPop(){ viewPop.hidden = false; viewBtn.setAttribute('aria-expanded', 'true'); renderViewCtl(); placeViewPop(); }
function closeViewPop(){ viewPop.hidden = true; viewBtn.setAttribute('aria-expanded', 'false'); }
viewBtn.onclick = e => { e.stopPropagation(); viewPop.hidden ? openViewPop() : closeViewPop(); };
document.addEventListener('click', e=>{ if (!viewPop.hidden && !viewPop.contains(e.target) && e.target !== viewBtn && !viewBtn.contains(e.target)) closeViewPop(); });
document.addEventListener('keydown', e=>{
  if (e.key !== 'Escape') return;
  if (!viewPop.hidden){ closeViewPop(); viewBtn.focus(); return; }
  if (layoutNow() === 'D' && $('#outBox').classList.contains('open')) $('#outBox').classList.remove('open');
});
let vT = 0; window.addEventListener('resize', ()=>{ clearTimeout(vT); vT = setTimeout(()=>{ applyView(); if (!viewPop.hidden) placeViewPop(); }, 120); });
{ const az = applyZoom; applyZoom = function(){ const r = az.apply(this, arguments); try{ applyView(); }catch(e){} return r; }; }
{ const z = $('#set_zoom'); if (z) z.addEventListener('change', ()=>setTimeout(applyView, 0)); }
{ const si1 = searchItems; searchItems = function(){ const L = si1(); L.push({k:'Дія', t:'Вигляд: ноутбук / монітор, розташування, масштаб', s:'', go:openViewPop});
    Object.keys(LAYS).forEach(k=>L.push({k:'Вигляд', t:'Розташування: ' + LAYS[k], s:LAY_HINT[k], go:()=>{ VIEW.layout = k; saveView(); applyView(); }})); return L; }; }
applyView();
