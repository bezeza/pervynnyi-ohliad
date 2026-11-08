/* ===== 0.9.3.95 — новий вигляд, етап 1 глобального оновлення інтерфейсу (макети: полотно «Первинний огляд — нові макети») =====
   На комп’ютері (від 900 px):
   • текст документа схований за кнопкою «Текст N» у шапці (N — кількість знаків) і відкривається панеллю справа; Esc закриває;
   • форма займає всю ширину, ліві розділи з кружками стану (заповнено — суцільний, ні — контур);
   • акцент — темно-синій #1D5B8A (у нічних темах — #3A7FBA, щоб білий текст на кнопках лишався читабельним).
   «Вигляд» → «Старий вигляд» повертає все як було (на час переходу). Телефон не змінюється.
   Друк, «Аркуш», бланки й файли Word/LibreOffice не змінюються. */
let UIV2 = lsGet('po.uiv2', '1') !== '0';
let TXTOPEN = false;
const v2Wide = () => window.matchMedia('(min-width: 900px)').matches;

const txtCnt = h('span', {class:'v2cnt', 'aria-hidden':'true'}, '0');
const txtBtn = h('button', {type:'button', class:'btn v2txt', id:'txtBtn', 'aria-expanded':'false', 'aria-controls':'outBox', title:'Текст документа: копіювати, перевірка, друк (Esc — закрити)'},
  h('span', {}, 'Текст'), txtCnt);
const txtClose = h('button', {type:'button', class:'btn v2close', 'aria-label':'Закрити панель тексту', title:'Закрити (Esc)'}, '✕');

function v2Count(){
  const o = $('#out'); let n = 0; try{ n = o ? itext(o).trim().length : 0; }catch(e){}
  txtCnt.textContent = n.toLocaleString('uk-UA');
  txtBtn.setAttribute('aria-label', 'Текст документа, ' + n + ' знаків');
}
/* панель — під шапкою, щоб кнопка «Текст» лишалась видимою */
function v2Top(){ const t = $('.top'); const b = t ? Math.round(t.getBoundingClientRect().bottom) : 0; document.documentElement.style.setProperty('--v2top', Math.max(12, b + 8) + 'px'); }
window.addEventListener('resize', ()=>{ if (TXTOPEN) v2Top(); });
window.addEventListener('scroll', ()=>{ if (TXTOPEN) v2Top(); }, {passive:true});
function txtOpen(on){
  TXTOPEN = !!on && UIV2;
  document.body.classList.toggle('v2-txt-open', TXTOPEN);
  txtBtn.setAttribute('aria-expanded', TXTOPEN ? 'true' : 'false');
  txtBtn.classList.toggle('primary', TXTOPEN);
  if (TXTOPEN){ v2Top(); v2Count(); const c = $('#copy'); setTimeout(()=>{ try{ (c || txtClose).focus({preventScroll:true}); }catch(e){} }, 30); }
}
function uiV2Apply(){
  document.documentElement.classList.toggle('ui-v2', UIV2);
  if (!UIV2) txtOpen(false);
  v2Count();
}
function uiV2Set(on){
  UIV2 = !!on; lsSet('po.uiv2', UIV2 ? '1' : '0'); uiV2Apply();
  try{ renderViewCtl(); }catch(e){}
  toast(UIV2 ? 'Новий вигляд' : 'Старий вигляд — як було до оновлення');
}

/* кнопка в шапці — перед «Вигляд»; кнопка закриття — у заголовку панелі тексту */
{ const vb = $('#viewBtn'), top = $('.top');
  if (vb && vb.parentElement) vb.before(txtBtn); else if (top) top.append(txtBtn);
  const oh = $('#outBox .oh'); if (oh) oh.append(txtClose); }
txtBtn.onclick = e => { e.stopPropagation(); txtOpen(!TXTOPEN); };
txtClose.onclick = () => { txtOpen(false); try{ txtBtn.focus(); }catch(e){} };
document.addEventListener('keydown', e=>{
  if (e.key !== 'Escape' || !TXTOPEN || !v2Wide()) return;
  if (document.querySelector('[role="dialog"]:not([hidden])') && !e.target.closest('#outBox')) return;   // спершу закриваються діалоги
  txtOpen(false); try{ txtBtn.focus(); }catch(x){}
});

/* лічильник знаків — за змінами тексту документа (без зміни update()) */
{ const o = $('#out'); let q = 0;
  if (o){ new MutationObserver(()=>{ if (q) return; q = requestAnimationFrame(()=>{ q = 0; v2Count(); }); }).observe(o, {childList:true, subtree:true, characterData:true}); } }

/* «Вигляд» → «Старий вигляд» */
{ const x0 = viewCtl; viewCtl = function(){
  const box = x0.apply(this, arguments);
  const row = h('div', {class:'vrow'}, h('span', {class:'vl'}, 'Старий вигляд'), h('div', {class:'vseg', role:'group', 'aria-label':'Старий вигляд на час переходу'},
    ...[[false, 'Вимкнено', 'Новий вигляд: текст за кнопкою «Текст», форма на всю ширину'], [true, 'Увімкнено', 'Як було до оновлення: текст документа завжди поруч із формою']].map(([old, l, t])=>
      h('button', {type:'button', 'aria-pressed':(!UIV2) === old ? 'true' : 'false', title:t, onclick:()=>uiV2Set(!old)}, l))));
  box.prepend(row); return box; }; }
/* інструменти (шкали, шаблони, налаштування, довідка) — без кружка стану */
try{ TABS.forEach(t=>{ if (t && t.tab && TOOL_TABS.includes(t.id)) t.tab.classList.add('v2tool'); }); }catch(e){}
try{ if (!FS_SET_KEYS.includes('po.uiv2')) FS_SET_KEYS.push('po.uiv2'); }catch(e){}
uiV2Apply();
try{ renderViewCtl(); }catch(e){}
