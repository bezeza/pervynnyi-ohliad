/* ===== 0.9.3.61 — телефон: дотик до тексту не відкриває клавіатуру =====
   Раніше на телефоні дотик до фрази в тексті документа ставив туди курсор — вискакувала клавіатура,
   і панель з варіантами внизу ставала зовсім малою. Тепер:
   • режим «Вибір» (за замовчуванням): дотик до фрази відкриває варіанти, клавіатура не з’являється;
   • кнопка «⌨» угорі тексту — «Правити вручну»: тоді звичайне редагування з клавіатурою; ще раз «⌨» — назад до вибору;
   • у панелях варіантів (текст, бланк, щоденник) поле не захоплює фокус саме — клавіатура лише якщо натиснули поле;
   • коли клавіатура все ж відкрита — панель піднімається над нею, а не ховається під неї. */
const PHK = { manual:false };
function phkApply(){
  const out = $('#out'); if (!out) return;
  const choose = isPhone() && !PHK.manual;
  if (choose) out.setAttribute('inputmode', 'none'); else out.removeAttribute('inputmode');
  PHK_BTN.hidden = !isPhone();
  PHK_BTN.setAttribute('aria-pressed', PHK.manual ? 'true' : 'false');
  PHK_BTN.title = PHK.manual ? 'Зараз: правка вручну (клавіатура). Натисніть — повернутись до вибору варіантів' : 'Правити текст вручну (з клавіатурою)';
  document.body.classList.toggle('phk-manual', isPhone() && PHK.manual);
}
const PHK_BTN = h('button', {type:'button', class:'btn phk-b', 'aria-label':'Правити текст вручну', onclick:()=>{
  PHK.manual = !PHK.manual;
  try{ OPG.qe = PHK.manual ? false : (localStorage.getItem('po.qedit') !== '0'); }catch(e){ OPG.qe = !PHK.manual; }
  try{ qeClose(); }catch(e){}
  phkApply();
  const out = $('#out');
  if (PHK.manual){ if (out){ out.focus(); } toast('Правка вручну: клавіатура. Повернутись до вибору — «⌨» ще раз', 3000); }
  else { if (document.activeElement) document.activeElement.blur(); toast('Вибір: дотик до фрази відкриває варіанти', 2200); }
}}, '⌨');
{ const fb = $('#fmtBtn'); if (fb) fb.before(PHK_BTN); }
/* панелі варіантів: не захоплювати фокус у поле (інакше клавіатура) */
function phkBlurIn(sel){
  if (!isPhone()) return;
  const a = document.activeElement, box = document.querySelector(sel);
  if (a && box && box.contains(a) && /^(INPUT|TEXTAREA)$/.test(a.tagName) && box.querySelector('.chip, .seg button, select, .pe-opt, button[aria-pressed]')) a.blur();
}
{ const x0 = qeOpen; qeOpen = function(){ const r = x0.apply(this, arguments); try{ phkBlurIn('.qe'); }catch(e){} return r; }; }
if (typeof peOpen === 'function'){ const x0 = peOpen; peOpen = function(){ const r = x0.apply(this, arguments); try{ setTimeout(()=>phkBlurIn('.pe-box'), 0); }catch(e){} return r; }; }
/* закрили текст — назад до вибору */
new MutationObserver(()=>{ const ob = $('#outBox'); if (ob && !ob.classList.contains('open') && PHK.manual){ PHK.manual = false; try{ OPG.qe = localStorage.getItem('po.qedit') !== '0'; }catch(e){ OPG.qe = true; } phkApply(); } }).observe($('#outBox'), {attributes:true, attributeFilter:['class']});
/* клавіатура відкрита — панель над нею */
if (window.visualViewport){
  const vv = window.visualViewport, fit = () => {
    const kb = Math.max(0, Math.round(window.innerHeight - vv.height - vv.offsetTop));
    document.documentElement.style.setProperty('--kb', kb + 'px');
    document.documentElement.style.setProperty('--vvh', Math.round(vv.height) + 'px');
    document.body.classList.toggle('phk-kb', isPhone() && kb > 80);
  };
  vv.addEventListener('resize', fit); vv.addEventListener('scroll', fit); fit();
}
if (window.matchMedia) matchMedia('(max-width:899px)').addEventListener('change', ()=>{ try{ phkApply(); }catch(e){} });
phkApply();
