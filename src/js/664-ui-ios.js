/* ===== 0.9.3.77 — стиль інтерфейсу «Apple»: на комп’ютері — як macOS, на телефоні й планшеті (сенсорний режим) — як iOS =====
   Окремо від теми кольорів (авто / день / ніч…): стиль міняє форму — сірий фон, білі картки з заокругленням,
   поля без рамок на сірій підкладці, перемикачі-«пігулки», кнопки з тонованим тлом, системний синій.
   Працює в денній і нічній темах. Теми «Теплий папір» і «Кабінет» лишають свої кольори, форма — iOS.
   Вибір: «Вигляд» → «Стиль»: iOS / Класичний (зберігається в «Налаштуваннях», файл Налаштування.json).
   Друк, «Аркуш», бланки й файли Word/LibreOffice не змінюються. */
const UI_STYLES = {ios:'Apple (macOS / iOS)', classic:'Класичний'};
let UISTYLE = lsGet('po.uistyle', 'ios'); if (!UI_STYLES[UISTYLE]) UISTYLE = 'ios';
function uiStyleApply(){
  const on = UISTYLE === 'ios';
  document.documentElement.classList.toggle('ui-ios', on);
  try{ if (POP.w && !POP.w.closed) POP.w.document.documentElement.classList.toggle('ui-ios', on); }catch(e){}
  { const m = document.querySelector('meta[name="theme-color"]'); if (m && on) m.setAttribute('content', matchMedia('(prefers-color-scheme: dark)').matches ? '#000000' : '#F2F2F7'); }
}
function uiStyleSet(k){ UISTYLE = UI_STYLES[k] ? k : 'ios'; lsSet('po.uistyle', UISTYLE); uiStyleApply(); try{ renderViewCtl(); }catch(e){} toast('Стиль інтерфейсу: ' + UI_STYLES[UISTYLE]); }
{ const x0 = viewCtl; viewCtl = function(){
  const box = x0.apply(this, arguments);
  const row = h('div', {class:'vrow'}, h('span', {class:'vl'}, 'Стиль'), h('div', {class:'vseg', role:'group', 'aria-label':'Стиль інтерфейсу'},
    ...[['ios', 'Apple', 'Лаконічний: на комп’ютері — як macOS (щільно, під мишку), на телефоні й планшеті — як iOS (під палець)'], ['classic', 'Класичний', 'Як було: рамки, темна шапка']].map(([k, l, t])=>
      h('button', {type:'button', 'aria-pressed':UISTYLE === k ? 'true' : 'false', title:t, onclick:()=>uiStyleSet(k)}, l))));
  box.prepend(row); return box; }; }
{ const x0 = popInit; popInit = function(w){ const r = x0.apply(this, arguments); try{ w.document.documentElement.classList.toggle('ui-ios', UISTYLE === 'ios'); }catch(e){} return r; }; }
try{ if (!FS_SET_KEYS.includes('po.uistyle')) FS_SET_KEYS.push('po.uistyle'); }catch(e){}
uiStyleApply();
try{ renderViewCtl(); }catch(e){}
