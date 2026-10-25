/* ===== 0.9.3.56 — тема «Кабінет»: нейтральна сіра, як у Skiagrama (не чорна й не біла) =====
   Перемикач теми: авто → день → ніч → кабінет. Тема «Кабінет» = темна схема (усі правила темної теми діють)
   з власною сірою палітрою (data-tone="grey"). Аркуш на екрані — приглушений; друк не змінюється. */
const THEME_NAMES = {auto:'авто', day:'день', night:'ніч', grey:'кабінет'}, THEME_ICONS = {auto:'◐', day:'☀', night:'☾', grey:'◑'};
{ const x0 = applyTheme; applyTheme = function(){
  const grey = THEME === 'grey', keep = THEME; if (grey) THEME = 'night';
  try{ x0.apply(this, arguments); } finally { THEME = keep; }
  const r = document.documentElement; if (grey) r.setAttribute('data-tone', 'grey'); else r.removeAttribute('data-tone');
  const b = $('#themeBtn'); if (b){ b.innerHTML = '<span class="hide-m">Тема: ' + THEME_NAMES[THEME] + '</span><span class="show-m" aria-hidden="true">' + THEME_ICONS[THEME] + '</span>'; b.title = 'Тема: ' + THEME_NAMES[THEME] + ' (натисніть, щоб змінити)'; }
  const s = document.getElementById('set_theme'); if (s) s.value = THEME;
  try{ if (POP.w && !POP.w.closed){ const d = POP.w.document.documentElement; d.setAttribute('data-theme', r.getAttribute('data-theme') || ''); if (!r.getAttribute('data-theme')) d.removeAttribute('data-theme'); if (grey) d.setAttribute('data-tone', 'grey'); else d.removeAttribute('data-tone'); } }catch(e){}
}; }
function themeSet(t){ THEME = THEME_NAMES[t] ? t : 'auto'; try{ localStorage.setItem('po.theme', THEME); }catch(e){} applyTheme(); toast({auto:'Тема як у системі', day:'Денна тема', night:'Нічна тема', grey:'Тема «Кабінет» — нейтральна сіра'}[THEME]); }
{ const b = $('#themeBtn'); if (b) b.onclick = ()=>themeSet({auto:'day', day:'night', night:'grey', grey:'auto'}[THEME] || 'auto'); }
{ const x0 = popInit; popInit = function(w){ const r = x0.apply(this, arguments); try{ if (document.documentElement.getAttribute('data-tone') === 'grey') w.document.documentElement.setAttribute('data-tone', 'grey'); }catch(e){} return r; }; }
if (SETTINGS_EL){
  const s = h('select', {id:'set_theme'}, ...Object.entries({auto:'Як у системі', day:'День — світла', night:'Ніч — темна', grey:'Кабінет — нейтральна сіра (як у Skiagrama)'}).map(([v, t])=>h('option', {value:v}, t)));
  s.value = THEME; s.addEventListener('change', ()=>themeSet(s.value));
  const fh = [...SETTINGS_EL.querySelectorAll('h3.sub')].find(x=>x.textContent === 'Шрифти');
  const grid = h('div', {class:'grid'}, h('div', {class:'f'}, h('label', {for:'set_theme'}, 'Тема кольорів'), s));
  if (fh) fh.before(h('h3', {class:'sub'}, 'Тема'), grid); else SETTINGS_EL.append(h('h3', {class:'sub'}, 'Тема'), grid);
  try{ setRegroup(); }catch(e){}
}
applyTheme();
