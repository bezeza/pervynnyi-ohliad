/* ===== 0.9.3.109 · дрібниці інтерфейсу з аудиту 11.2026 =====
   Банер «Папка даних не підключена» на комп’ютері — один короткий рядок замість абзацу на пів бічної панелі;
   повний текст лишається в підказці (title) і на телефоні. Стилі — у кінці styles.css (0.9.3.109). */
{ const f0 = fsBanner; fsBanner = function(){
  const r = f0.apply(this, arguments);
  try{
    const b = document.getElementById('fsBanner'); if (!b || b.hidden) return r;
    const t = b.querySelector('.fsb-t'); if (!t) return r;
    b.classList.toggle('fsb-short', !FS.dir);
    if (!FS.dir) t.after(h('span', {class:'fsb-s', title:t.textContent}, 'Папку даних не підключено — пацієнти лише в цьому браузері'));
  }catch(e){ poErr(e, 'банер папки даних'); }
  return r;
}; }
try{ fsBanner(); }catch(e){}
