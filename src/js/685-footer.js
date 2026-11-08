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
/* пасхалка: 7 клацань по версії внизу — «легені, що дихають» і подяка колезі. Нічого не змінює й не зберігає. */
function footEgg(){
  if (document.querySelector('.poegg')) return;
  let n = 0; try{ n = Object.keys(loadStore()).length; }catch(e){}
  const pl = k => k % 10 === 1 && k % 100 !== 11 ? 'пацієнт' : [2, 3, 4].includes(k % 10) && ![12, 13, 14].includes(k % 100) ? 'пацієнти' : 'пацієнтів';
  const ic = (typeof V2IC !== 'undefined' && V2IC.lungs) ? v2IcSvg('lungs') : h('span', {}, '🫁');
  const box = h('div', {class:'poegg', role:'dialog', 'aria-modal':'true', 'aria-label':'Пасхалка'},
    h('div', {class:'poegg-c'},
      h('div', {class:'poegg-l', 'aria-hidden':'true'}, ic),
      h('b', {}, 'Вдих… видих.'),
      h('p', {}, 'Дякую, колего, що пишете документацію тут, а не до опівночі від руки.'),
      h('p', {class:'chips-hint'}, n ? `У цьому браузері — ${n} ${pl(n)}. Бережіть себе між ними.` : 'Пацієнтів ще немає — гарного чергування.'),
      h('button', {type:'button', class:'btn primary', onclick:()=>box.remove()}, 'Повернутись до роботи')));
  box.addEventListener('click', e=>{ if (e.target === box) box.remove(); });
  box.addEventListener('keydown', e=>{ if (e.key === 'Escape') box.remove(); });
  document.body.append(box); box.querySelector('button').focus();
}
{ const v = document.querySelector('.pofoot > span:nth-child(2)'); let k = 0, t = 0;
  if (v) v.addEventListener('click', e=>{ if (e.target.closest('button')) return; clearTimeout(t); t = setTimeout(()=>{ k = 0; }, 1500); if (++k >= 7){ k = 0; footEgg(); } }); }
