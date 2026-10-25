/* ===== 0.9.3.56 — тема «Кабінет»: нейтральна сіра, як у Skiagrama (не чорна й не біла) =====
   Перемикач теми: авто → день → теплий папір → ніч → кабінет. Тема «Кабінет» = темна схема (усі правила темної теми діють)
   з власною сірою палітрою (data-tone="grey"). Аркуш на екрані — приглушений; друк не змінюється. */
const THEME_NAMES = {auto:'авто', day:'день', warm:'теплий папір', night:'ніч', grey:'кабінет'}, THEME_ICONS = {auto:'◐', day:'☀', warm:'☼', night:'☾', grey:'◑'};
{ const x0 = applyTheme; applyTheme = function(){
  const grey = THEME === 'grey', warm = THEME === 'warm', keep = THEME; if (grey) THEME = 'night'; if (warm) THEME = 'day';
  try{ x0.apply(this, arguments); } finally { THEME = keep; }
  const r = document.documentElement, tone = grey ? 'grey' : warm ? 'warm' : ''; if (tone) r.setAttribute('data-tone', tone); else r.removeAttribute('data-tone');
  const b = $('#themeBtn'); if (b){ b.innerHTML = '<span class="hide-m">Тема: ' + THEME_NAMES[THEME] + '</span><span class="show-m" aria-hidden="true">' + THEME_ICONS[THEME] + '</span>'; b.title = 'Тема: ' + THEME_NAMES[THEME] + ' (натисніть, щоб змінити)'; }
  const s = document.getElementById('set_theme'); if (s) s.value = THEME;
  try{ if (POP.w && !POP.w.closed){ const d = POP.w.document.documentElement; d.setAttribute('data-theme', r.getAttribute('data-theme') || ''); if (!r.getAttribute('data-theme')) d.removeAttribute('data-theme'); if (tone) d.setAttribute('data-tone', tone); else d.removeAttribute('data-tone'); } }catch(e){}
}; }
function themeSet(t){ THEME = THEME_NAMES[t] ? t : 'auto'; try{ localStorage.setItem('po.theme', THEME); }catch(e){} applyTheme(); toast({auto:'Тема як у системі', day:'Денна тема', warm:'Денна тема «Теплий папір»', night:'Нічна тема', grey:'Тема «Кабінет» — нейтральна сіра'}[THEME]); }
{ const b = $('#themeBtn'); if (b) b.onclick = ()=>themeSet({auto:'day', day:'warm', warm:'night', night:'grey', grey:'auto'}[THEME] || 'auto'); }
{ const x0 = popInit; popInit = function(w){ const r = x0.apply(this, arguments); try{ const t = document.documentElement.getAttribute('data-tone'); if (t) w.document.documentElement.setAttribute('data-tone', t); }catch(e){} return r; }; }
if (SETTINGS_EL){
  const s = h('select', {id:'set_theme'}, ...Object.entries({auto:'Як у системі', day:'День — світла', warm:'День — теплий папір (м’якше для довгого читання)', night:'Ніч — темна', grey:'Кабінет — нейтральна сіра (як у Skiagrama)'}).map(([v, t])=>h('option', {value:v}, t)));
  s.value = THEME; s.addEventListener('change', ()=>themeSet(s.value));
  const fh = [...SETTINGS_EL.querySelectorAll('h3.sub')].find(x=>x.textContent === 'Шрифти');
  const grid = h('div', {class:'grid'}, h('div', {class:'f'}, h('label', {for:'set_theme'}, 'Тема кольорів'), s));
  if (fh) fh.before(h('h3', {class:'sub'}, 'Тема'), grid); else SETTINGS_EL.append(h('h3', {class:'sub'}, 'Тема'), grid);
  try{ setRegroup(); }catch(e){}
}
applyTheme();
