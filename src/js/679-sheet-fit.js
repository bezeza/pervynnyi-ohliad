/* ===== 0.9.3.94 — масштаб аркуша А4 у «Перед друком» підлаштовується під панель =====
   Раніше масштаб рахувався лише при зміні розміру вікна браузера (window.resize) і не більше 100 %.
   Тож коли перетягували межу форми й тексту, бокове меню чи віконце, аркуш лишався в старому масштабі.
   Тепер:
   • ResizeObserver стежить за самою панеллю аркуша — масштаб змінюється одразу, без перебудови сторінки;
   • вибір як у Word: «По ширині» (за замовчуванням; може бути й більше 100 %), «Весь аркуш», «100 %» (поточний відсоток — у підказці кнопки);
     вибір запам’ятовується (Налаштування.json).
   Телефон (до 899 px) — як було: свій масштаб двома пальцями (645-phone-preview.js). Друк не змінюється. */
const SFIT_MODES = {width:'По ширині', page:'Весь аркуш', one:'100 %'};
const SFIT_ORDER = ['width', 'page', 'one'];
let SFIT = lsGet('po.sheetfit', 'width'); if (!SFIT_MODES[SFIT]) SFIT = 'width';
const SFIT_A4 = {w:793.7, h:1122.5};   // 210 × 297 мм у CSS-пікселях
const sfitPhone = () => typeof phIs === 'function' && phIs();

function sfitZoom(){
  const p = document.getElementById('paper'), sh = p && p.querySelector('.sheet.blankmode');
  if (!sh || p.hidden || sfitPhone()) return null;
  sh.classList.toggle('sfit-w', SFIT === 'width');
  const cs = getComputedStyle(p), padX = (parseFloat(cs.paddingLeft) || 0) + (parseFloat(cs.paddingRight) || 0), padY = (parseFloat(cs.paddingTop) || 0) + (parseFloat(cs.paddingBottom) || 0);
  const w = p.clientWidth - padX - 4, hh = p.clientHeight - padY - 4;
  if (w <= 0) return null;
  let z = 1;
  if (SFIT === 'width') z = w / SFIT_A4.w;
  else if (SFIT === 'page') z = Math.min(w / SFIT_A4.w, hh > 100 ? hh / SFIT_A4.h : 1);
  z = Math.max(0.25, Math.min(2.5, z));
  const v = z.toFixed(3);
  if (sh.style.getPropertyValue('--bz') !== v) sh.style.setProperty('--bz', v);
  p.querySelectorAll('.sfit-seg button').forEach(b=>{ b.title = b.dataset.t + (b.dataset.k === SFIT ? ' · зараз ' + Math.round(z * 100) + ' %' : ''); });
  return z;
}
function sfitSet(k){
  SFIT = SFIT_MODES[k] ? k : 'width'; lsSet('po.sheetfit', SFIT);
  const p = document.getElementById('paper');
  if (p) p.querySelectorAll('.sfit-seg button').forEach(b=>b.setAttribute('aria-pressed', b.dataset.k === SFIT ? 'true' : 'false'));
  sfitZoom();
}

/* після кожної перебудови аркуша — свій масштаб замість «не більше 100 %» */
{ const rp0 = renderPaper; renderPaper = function(){ const r = rp0.apply(this, arguments); try{ sfitZoom(); }catch(e){} return r; }; }

/* перемикач масштабу — у рядку «Аркуш А4» */
{ const bb0 = blankBar; blankBar = function(){
  const bar = bb0.apply(this, arguments);
  if (!bar || sfitPhone() || !BLANK || (typeof blankOK === 'function' && !blankOK())) return bar;
  const row = bar.querySelector('.bctl') || bar;
  row.append(h('span', {class:'bcl'}, 'Масштаб:'),
    h('span', {class:'seg sfit-seg', role:'group', 'aria-label':'Масштаб аркуша'},
      ...SFIT_ORDER.map(k=>{ const b = h('button', {type:'button', 'aria-pressed':SFIT === k ? 'true' : 'false', onclick:()=>sfitSet(k)}, SFIT_MODES[k]);
        b.dataset.k = k; b.dataset.t = {width:'Аркуш на всю ширину панелі — може бути більше 100 %', page:'Увесь аркуш видно без прокрутки', one:'Справжній розмір'}[k]; b.title = b.dataset.t; return b; })));
  return bar;
}; }

/* стеження за розміром панелі: межа форми й тексту, бокове меню, віконце, «Вигляд» */
{ const p = document.getElementById('paper');
  if (p && typeof ResizeObserver === 'function'){
    let q = 0;
    new ResizeObserver(()=>{ if (q) return; q = requestAnimationFrame(()=>{ q = 0; if (PAPER) sfitZoom(); }); }).observe(p);
  } }
try{ if (!FS_SET_KEYS.includes('po.sheetfit')) FS_SET_KEYS.push('po.sheetfit'); }catch(e){}
