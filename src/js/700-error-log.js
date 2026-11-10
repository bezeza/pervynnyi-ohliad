/* ===== 0.9.3.108 · журнал помилок (аудит 11.2026) =====
   Раніше внутрішні помилки ніде не було видно: лікар бачив лише «кнопка не спрацювала».
   Перехоплення — у head.html (працює ще до запуску програми); тут — перегляд у «Налаштування» → «Журнал помилок»,
   копіювання для автора й одне коротке повідомлення за сеанс. Журнал лише на цьому пристрої, у папку даних не потрапляє.
   poErr(e, де) — для нових catch замість порожнього «catch(e){}»: помилка не зупиняє роботу, але записується. */
const ERRLOG_K = 'po.errlog';
function errLogRead(){ try{ const a = JSON.parse(localStorage.getItem(ERRLOG_K) || '[]'); return Array.isArray(a) ? a : []; }catch(e){ return []; } }
function poErr(e, where){ try{ window.poErrAdd && window.poErrAdd(e && e.message || e, where, e && e.stack); }catch(x){} }
function errLogText(){
  const a = errLogRead();
  return [`«Первинний огляд» ${VERSION}${STAGE ? ' ' + STAGE : ''} · ${navigator.userAgent}`, ...a.map(x=>
    `${fmtErrT(x.t)}${x.n > 1 ? ' (×' + x.n + ')' : ''}${x.v && x.v !== VERSION ? ' [v' + x.v + ']' : ''} — ${x.m}${x.w ? ' · ' + x.w : ''}${x.s ? '\n  ' + x.s.replace(/\n/g, '\n  ') : ''}`)].join('\n');
}
function fmtErrT(t){ const d = new Date(t), p = n=>String(n).padStart(2, '0'); return isNaN(d) ? '—' : `${p(d.getDate())}.${p(d.getMonth() + 1)}.${d.getFullYear()} ${p(d.getHours())}:${p(d.getMinutes())}`; }
let ERRLOG_BOX = null;
function errLogRender(){
  if (!ERRLOG_BOX) return;
  const a = errLogRead(); ERRLOG_BOX.textContent = '';
  if (!a.length){ ERRLOG_BOX.append(h('p', {class:'hint'}, 'Помилок не записано.')); return; }
  ERRLOG_BOX.append(h('ul', {class:'vlist errlog'}, ...a.slice(0, 10).map(x=>h('li', {}, h('b', {}, fmtErrT(x.t) + (x.n > 1 ? ' ×' + x.n : '')), ' — ' + x.m))),
    a.length > 10 ? h('p', {class:'hint'}, `і ще ${a.length - 10} — усі потраплять у скопійований текст`) : '');
}
/* одне повідомлення за сеанс, не під час запуску; далі — лише запис у журнал */
window.poErrNotify = function(){
  if (window.poErrNotify.shown) return; let boot = true; try{ boot = PO_BOOT; }catch(e){} if (boot) return;
  window.poErrNotify.shown = true;
  setTimeout(()=>{ try{ toast('Сталася внутрішня помилка програми — її записано («Налаштування» → «Журнал помилок»). Введене не втрачено.', 6000); errLogRender(); }catch(e){} }, 0);
};
try{ if (SETTINGS_EL){
  ERRLOG_BOX = h('div', {});
  const sec = h('details', {class:'setsec', id:'errLogSec'}, h('summary', {}, 'Журнал помилок'), h('div', {class:'grid'}, h('div', {class:'f wide'},
    h('p', {class:'hint'}, 'Внутрішні помилки програми. Якщо щось не спрацювало — скопіюйте текст і надішліть автору. Перед надсиланням перегляньте текст: це технічні повідомлення, даних пацієнтів у них зазвичай немає.'),
    ERRLOG_BOX,
    h('div', {class:'errlog-acts'},
      h('button', {type:'button', class:'btn', onclick:()=>{ const t = errLogText(); (navigator.clipboard ? navigator.clipboard.writeText(t) : Promise.reject()).then(()=>toast('Журнал помилок скопійовано'), ()=>prompt('Скопіюйте:', t)); }}, 'Копіювати для автора'),
      h('button', {type:'button', class:'btn', onclick:()=>{ try{ localStorage.removeItem(ERRLOG_K); }catch(e){} errLogRender(); toast('Журнал помилок очищено'); }}, 'Очистити')))));
  sec.addEventListener('toggle', ()=>{ if (sec.open) errLogRender(); });
  errLogRender();
  const about = SETTINGS_EL.querySelector(':scope > details.about'); if (about) about.before(sec); else SETTINGS_EL.append(sec);
} }catch(e){ poErr(e, 'журнал помилок: налаштування'); }
