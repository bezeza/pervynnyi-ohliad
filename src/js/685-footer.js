/* ===== 0.9.3.95 — рядок унизу сторінки: автор і зв’язок, версія, «що нового», код і ліцензія, де дані =====
   Видно в обох виглядах; у друк і файли не потрапляє. */
function footWhatsNew(){
  try{ goTab('set'); }catch(e){}
  setTimeout(()=>{ const d = [...document.querySelectorAll('details.about')].find(x=>/Про програму/.test(x.querySelector('summary') ? x.querySelector('summary').textContent : ''));
    if (d){ d.open = true; try{ d.scrollIntoView({block:'start', behavior:'smooth'}); }catch(e){ d.scrollIntoView(); } } }, 60);
}
{ const main = document.querySelector('main.wrap');
  if (main && !document.querySelector('.pofoot')){
    const ext = (href, t, title) => h('a', {href, target:'_blank', rel:'noopener', title:title || ''}, t);
    const f = h('footer', {class:'pofoot', 'aria-label':'Про програму'},
      h('span', {}, 'Зроблено лікарем для лікарів · ', ext('https://t.me/bezeza', 'Telegram @bezeza', 'Питання, побажання, помилки — пишіть у Telegram')),
      h('span', {}, 'Версія ' + VERSION + (STAGE ? ' ' + STAGE : '') + ' від ' + VDATE + ' · ', h('button', {type:'button', class:'more', onclick:footWhatsNew}, 'що нового')),
      h('span', {}, ext('https://github.com/bezeza/pervynnyi-ohliad', 'Відкритий код', 'Код програми на GitHub'), ' · ліцензія AGPL-3.0'),
      h('span', {class:'pofoot-priv'}, 'Дані пацієнтів зберігаються лише на цьому пристрої; програма нічого не надсилає'));
    main.after(f);
  } }
