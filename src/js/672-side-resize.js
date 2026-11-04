/* ===== 0.9.3.85 — бічне меню: ширина перетягуванням і режим «лише значки» =====
   • Праву межу бічного меню можна тягнути мишкою (або стрілками, коли межа у фокусі): 180–380 px.
   • Стягнули вужче за ~130 px — меню стає смужкою значків (назва розділу — при наведенні); «Згорнути зміст» — те саме.
   • Подвійний клік по межі — звичайна ширина. Ширина й режим зберігаються («Вигляд», файл налаштувань). */
const SIDE_ICONS = {meta:'👤', hv:'🩺', skarhy:'💬', morbi:'📈', qv:'📊', vitae:'📋', zah:'🧍', shk:'🖐', dyh:'🫁', ssc:'❤️', trav:'🍽', sech:'💧', nevr:'🧠', loc:'🩹', ctrl:'✅',
  scr:'🛡', dx:'🎯', hosp:'🏥', eln:'📄', d_main:'🙂', d_obj:'🔎', d_lik:'💊', e_per:'🛏', k_main:'🗣', e_obs:'🧪', e_lik:'💊', e_rek:'📝', z_main:'👥', c_main:'👥', c_end:'⚖️',
  t_main:'🛏', t_lik:'💊', n_main:'📨', n_end:'❓', gs_main:'🏥', p_main:'📃', v_main:'📄', g_main:'✍️', s066:'🗂', an_main:'😷', an_obj:'🫁', an_zak:'✅', an_prot:'📋', an_pun:'💉',
  rxt:'💊', calc:'🧮', tpl:'📑', set:'⚙️', help:'❔'};
const SIDE_MIN = 180, SIDE_MAX = 380, SIDE_RAIL = 130;
function sideIcons(){
  TABS.forEach(t=>{ const b = t.tab; if (!b) return; if (!b.dataset.ic) b.dataset.ic = SIDE_ICONS[t.id] || '•'; if (!b.title) b.title = t.title || t.short || ''; });
  const bl = document.getElementById('tab_blanks'); if (bl && !bl.dataset.ic) bl.dataset.ic = '🖨';
}
function sideWApply(){
  const R = document.documentElement, w = +VIEW.sideW || 0;
  if (w && !document.body.classList.contains('sidefold')) R.style.setProperty('--sidew', w + 'px'); else R.style.removeProperty('--sidew');
  document.body.classList.toggle('side-sized', !!w);
  const g = document.getElementById('sideGrip'); if (g) g.hidden = !(layoutNow() === 'B' && !isPhoneW());
}
function sideGrip(){
  const col = document.getElementById('sidecol'), sin = col && col.querySelector(':scope > .sidein'); if (!col || !sin || document.getElementById('sideGrip')) return;
  const g = h('div', {id:'sideGrip', class:'side-grip', role:'separator', tabindex:'0', 'aria-orientation':'vertical', 'aria-label':'Ширина бічного меню',
    title:'Тягніть, щоб змінити ширину меню; вузько — лише значки. Подвійний клік — як було'});
  sin.append(g);
  let x0 = 0, w0 = 0, drag = false;
  const cur = () => col.getBoundingClientRect().width;
  const set = (w, save) => {
    if (w < SIDE_RAIL){ if (!VIEW.sideFold){ VIEW.sideFold = true; renderSideFold(); } }
    else { if (VIEW.sideFold){ VIEW.sideFold = false; renderSideFold(); } VIEW.sideW = Math.round(Math.max(SIDE_MIN, Math.min(SIDE_MAX, w))); }
    sideWApply(); if (save){ saveView(); try{ SHELL.placeDocs(); }catch(e){} }
  };
  g.addEventListener('pointerdown', e=>{ if (e.button !== 0) return; e.preventDefault(); drag = true; x0 = e.clientX; w0 = cur(); g.setPointerCapture(e.pointerId); document.body.classList.add('side-dragging'); });
  g.addEventListener('pointermove', e=>{ if (!drag) return; set(w0 + (e.clientX - x0), false); });
  const end = e=>{ if (!drag) return; drag = false; document.body.classList.remove('side-dragging'); try{ g.releasePointerCapture(e.pointerId); }catch(x){} set(w0 + (e.clientX - x0), true); };
  g.addEventListener('pointerup', end); g.addEventListener('pointercancel', end);
  g.addEventListener('dblclick', ()=>{ VIEW.sideW = 0; VIEW.sideFold = false; saveView(); applyView(); toast('Бічне меню — звичайна ширина'); });
  g.addEventListener('keydown', e=>{ const d = e.key === 'ArrowLeft' ? -20 : e.key === 'ArrowRight' ? 20 : 0; if (!d) return; e.preventDefault(); set((VIEW.sideFold ? 60 : cur()) + d, true); });
}
{ const x0 = layoutTabs; layoutTabs = function(){ const r = x0.apply(this, arguments); try{ sideIcons(); }catch(e){} return r; }; }
{ const x0 = renderSideFold; renderSideFold = function(){ const r = x0.apply(this, arguments);
  try{ const b = SIDE_FOLD_BUTTON, l = b && b.querySelector('span'), f = document.body.classList.contains('sidefold');
    if (l) l.textContent = f ? '»' : '« Лише значки';
    if (b){ b.title = f ? 'Розгорнути меню — назви розділів, шаблон і прогрес' : 'Згорнути меню до значків'; b.setAttribute('aria-label', b.title); } sideWApply(); }catch(e){}
  return r; }; }
try{ sideGrip(); sideIcons(); renderSideFold(); }catch(e){}
