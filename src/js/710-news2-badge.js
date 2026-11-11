/* ===== 0.9.3.120 · NEWS2 біля показників огляду (задача 19) =====
   Малий бейдж «NEWS2 · N» поруч із рядком «Показники одним рядком»
   (не в картці «У тексті огляду» з 705-text-near.js).
   Читає результат наявного калькулятора (CALCS id=news).
   Нових порогів і формулювань не вигадує — колір і текст лише з r.lvl / r.msg / r.text.
   У текст документа нічого не додає. Клік відкриває #calc_news.
   Підписка: onUpdate з 596-update-hooks.js.
*/
(function(){
  const KEY = '710-news2';
  function badgeFor(doc){
    const host = doc === 'ohl' ? 'zah' : 'd_obj';
    const s = (typeof SECTIONS !== 'undefined') && SECTIONS.find(x => x.id === host);
    if (!s || !s.vqEl) return null;
    let b = s.vqEl.querySelector('.news2-badge');
    if (!b){
      b = h('button', {type:'button', class:'news2-badge', title:'Відкрити калькулятор NEWS2'});
      b.addEventListener('click', () => {
        const det = document.getElementById('calc_news');
        if (det){ det.open = true; det.scrollIntoView({block:'nearest'}); }
        const tab = [...document.querySelectorAll('#tabs button')].find(x => /кальк|шкал/i.test(x.textContent || ''));
        if (tab && !tab.classList.contains('on')) tab.click();
      });
      const row = s.vqEl.querySelector('.vq-row');
      if (row) row.append(b);
    }
    return b;
  }
  function refresh(){
    const c = (typeof CALCS !== 'undefined') && CALCS.find(x => x.id === 'news');
    if (!c) return;
    const r = c.last || (typeof c.run === 'function' && c.run(c));
    ['ohl','shch'].forEach(doc => {
      const b = badgeFor(doc); if (!b) return;
      if (!r || r.msg){
        b.textContent = 'NEWS2 · —';
        b.className = 'news2-badge grey';
        b.title = (r && r.msg) || 'Недостатньо даних';
      } else {
        const score = String(r.score || '').replace(/\s*б\.?/, '');
        b.textContent = 'NEWS2 · ' + score;
        b.className = 'news2-badge ' + (r.lvl || 'ok');
        b.title = r.text || '';
      }
    });
  }
  if (typeof onUpdate === 'function') onUpdate(KEY, () => { try{ refresh(); }catch(e){ if (typeof poErr === 'function') poErr(e, KEY); } });
  setTimeout(refresh, 150);
})();
