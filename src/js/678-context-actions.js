/* ===== 0.9.3.92 — контекстні дії поточного документа (Apple) =====
   Комп’ютер: окрема компактна панель під вибором документа.
   Телефон: ті самі потрібні дії в наявному меню «Документ і дії».
   Усі кнопки викликають наявні функції; Classic і медична логіка не змінюються. */

const CTX_DOC_NAMES = {
  ohl:'Первинний огляд',
  shch:()=>MODE === 'amb' ? 'Повторний огляд' : 'Щоденник',
  rx:'Листок призначень',
  epi:'Виписний епікриз'
};
const CTX_BAR = h('nav', {id:'docActions', class:'doc-actions', role:'toolbar', 'aria-orientation':'horizontal', 'aria-label':'Швидкі дії документа'});
const CTX_META = h('div', {class:'da-meta'});
const CTX_TITLE = h('span', {class:'da-kicker'}, 'Швидкі дії');
const CTX_DOC = h('span', {class:'da-document'});
const CTX_LIST = h('div', {class:'da-list'});
CTX_META.append(CTX_TITLE, CTX_DOC);
CTX_BAR.append(CTX_META, CTX_LIST);
{
  const anchor = document.querySelector('.form .docbar');
  if (anchor) anchor.after(CTX_BAR);
  else { const form = document.querySelector('.form'); if (form) form.prepend(CTX_BAR); }
}

function ctxApple(){ return typeof UISTYLE !== 'undefined' && UISTYLE === 'ios'; }
function ctxPhone(){ return !!(window.matchMedia && matchMedia('(max-width:899px)').matches); }
function ctxDocName(){
  const v = CTX_DOC_NAMES[DOC];
  return typeof v === 'function' ? v() : v || '';
}
function ctxOpenCheck(){
  if (ctxPhone()) $('#outBox').classList.add('open');
  if (typeof SHELL !== 'undefined' && SHELL && typeof SHELL.setOV === 'function') SHELL.setOV('chk');
  else { const c = $('#chk'); if (c){ c.open = true; if (typeof renderCheck === 'function') renderCheck(); } }
}
function ctxOpenPaper(){
  if (ctxPhone()) $('#outBox').classList.add('open');
  if (typeof SHELL !== 'undefined' && SHELL && typeof SHELL.setOV === 'function') SHELL.setOV('paper');
  else { const b = $('#paperBtn'); if (b && b.getAttribute('aria-pressed') !== 'true') b.click(); }
}
function ctxFocusRx(){
  goTab('rxt');
  setTimeout(()=>{ const x = $('#rxAdd'); if (x) x.focus(); }, 0);
}
function ctxPrintRx(){
  if (typeof f0034Print === 'function') f0034Print();
  else toast('Друк листка призначень недоступний');
}
function ctxBuildEpi(){
  goTab('e_per');
  if (typeof epiAuto === 'function') epiAuto();
}
function ctxActionItems(){
  const check = {id:'check', label:'Перевірка', run:ctxOpenCheck};
  if (DOC === 'ohl') return [
    {id:'disease', label:'За хворобою', run:()=>show(TABS.indexOf(HV))},
    {id:'quick', label:QUICK ? 'Повний огляд' : (MODE === 'amb' ? 'Швидкий прийом' : 'Швидкий огляд'), primary:true, run:()=>{ const b = $('#quickBtn'); if (b && !b.hidden) b.click(); }},
    check
  ];
  if (DOC === 'shch') return [
    {id:'diary-previous', label:'Без змін (як учора)', disabled:!DIARIES.length, run:()=>{ if (typeof diaryNoChange === 'function') diaryNoChange(); }},
    {id:'diary-save', label:'Записати в журнал', primary:true, run:()=>{ if (typeof saveDiary === 'function') saveDiary(); }},
    check
  ];
  if (DOC === 'rx') return [
    {id:'rx-add', label:'Додати препарат', primary:true, run:ctxFocusRx},
    {id:'rx-print', label:'Друк листка 003-4/о', run:ctxPrintRx},
    check
  ];
  if (DOC === 'epi') return [
    {id:'epi-build', label:'Зібрати виписку', primary:true, run:ctxBuildEpi},
    {id:'epi-field', label:'До періоду виписки', run:()=>goTab('e_per', 'e_per.per')},
    check
  ];
  return [];
}
function ctxMobileItems(){
  const all = ctxActionItems();
  if (DOC === 'ohl') return all.filter(x=>x.id === 'check').concat([{id:'paper', label:'Перед друком', run:ctxOpenPaper}]);
  return all;
}
function ctxMakeButton(item, onRun){
  return h('button', {
    type:'button',
    class:'btn' + (item.primary ? ' primary' : ''),
    'data-action':item.id,
    title:item.title || item.label,
    disabled:item.disabled ? '' : null,
    onclick:()=>{ if (!item.disabled){ if (onRun) onRun(item); else item.run(); } }
  }, item.label);
}
function ctxSync(){
  const items = ctxActionItems(), name = ctxDocName();
  const visible = ctxApple() && !ctxPhone() && !document.documentElement.classList.contains('ui-start') && items.length > 0;
  CTX_BAR.hidden = !visible;
  if (!visible) return;
  CTX_BAR.dataset.document = DOC;
  CTX_BAR.setAttribute('aria-label', 'Швидкі дії: ' + name);
  CTX_DOC.textContent = name;
  CTX_LIST.innerHTML = '';
  items.forEach(item=>CTX_LIST.append(ctxMakeButton(item)));
}
function ctxCloseSheet(sh){
  const close = sh.querySelector('.nshead button');
  if (close) close.click();
  else { sh.remove(); document.body.style.overflow = ''; }
}
function ctxAddMobile(){
  if (!ctxApple()) return;
  const sheets = document.querySelectorAll('.actsheet');
  const sh = sheets[sheets.length - 1];
  if (!sh || sh.dataset.ctxActions === '1') return;
  const items = ctxMobileItems();
  if (!items.length) return;
  const title = h('h3', {class:'as-h'}, 'Дії документа');
  const list = h('div', {class:'as-list da-mobile-list'});
  items.forEach(item=>list.append(ctxMakeButton(item, x=>{ ctxCloseSheet(sh); x.run(); })));
  const before = [...sh.querySelectorAll('.as-h')].find(x=>x.textContent.trim() === 'Заповнення');
  if (before) before.before(title, list); else sh.append(title, list);
  sh.dataset.ctxActions = '1';
}

/* Оновлюємо панель лише при зміні документа, стилю або стану щоденника. */
{ const x0 = switchDoc; switchDoc = function(){ const r = x0.apply(this, arguments); try{ ctxSync(); }catch(e){} return r; }; }
{ const x0 = applyDoc; applyDoc = function(){ const r = x0.apply(this, arguments); try{ ctxSync(); }catch(e){} return r; }; }
{ const x0 = uiStyleApply; uiStyleApply = function(){ const r = x0.apply(this, arguments); try{ ctxSync(); }catch(e){} return r; }; }
{ const x0 = stApply; stApply = function(){ const r = x0.apply(this, arguments); try{ ctxSync(); }catch(e){} return r; }; }
{ const x0 = saveDiary; saveDiary = function(){ const r = x0.apply(this, arguments); try{ ctxSync(); }catch(e){} return r; }; }
if (typeof openActs === 'function'){
  const x0 = openActs;
  openActs = function(){ const r = x0.apply(this, arguments); try{ ctxAddMobile(); }catch(e){} return r; };
}
ctxSync();
