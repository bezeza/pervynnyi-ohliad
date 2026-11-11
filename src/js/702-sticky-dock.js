/* ===== 0.9.3.114 · закріплена шапка й панель «Текст» колонкою (зауваження лікаря 10.11.2026) =====
   ПК (≥ 900 px): шапка з документами, «Текст», «Друк» і профілем більше не прокручується; рядок «Норма / ↶ / Документ з огляду»
   і бічне меню стоять під нею (--v2hdr — висота шапки, міряє ResizeObserver).
   Широкий екран (≥ 1280 px): відкрита панель «Текст» — колонка справа, форма звужується, нічого не перекриває;
   ширину тягнуть за ліву межу панелі (360–900 px), вона запам’ятовується (po.txtw). Вужче — панель поверх, як і раніше.
   Стилі — у кінці styles.css (0.9.3.114). */
{
  const root = document.documentElement, KW = 'po.txtw';
  const hdr = document.querySelector('header.top'), box = document.getElementById('outBox');
  const clampW = w => Math.round(Math.max(360, Math.min(900, Math.min(w, window.innerWidth * 0.6))));
  const setW = w => root.style.setProperty('--v2txtw', clampW(w) + 'px');
  let w0 = 560; try{ w0 = +localStorage.getItem(KW) || 560; }catch(e){}
  setW(w0);
  if (hdr && typeof ResizeObserver === 'function')
    new ResizeObserver(()=>root.style.setProperty('--v2hdr', Math.round(hdr.getBoundingClientRect().height) + 'px')).observe(hdr);
  if (box){
    const grip = h('div', {class:'v2grip', role:'separator', 'aria-orientation':'vertical', 'aria-label':'Ширина панелі «Текст» (стрілки ← →)', tabindex:'0',
      title:'Потягніть, щоб змінити ширину панелі'});
    let drag = false;
    const save = ()=>{ try{ localStorage.setItem(KW, parseInt(getComputedStyle(root).getPropertyValue('--v2txtw'), 10) || 560); }catch(e){} };
    grip.addEventListener('pointerdown', e=>{ drag = true; grip.setPointerCapture(e.pointerId); document.body.classList.add('v2-resizing'); e.preventDefault(); });
    grip.addEventListener('pointermove', e=>{ if (drag) setW(window.innerWidth - e.clientX - 12); });
    const end = ()=>{ if (!drag) return; drag = false; document.body.classList.remove('v2-resizing'); save(); };
    grip.addEventListener('pointerup', end); grip.addEventListener('pointercancel', end);
    grip.addEventListener('keydown', e=>{ if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return; e.preventDefault();
      const cur = parseInt(getComputedStyle(root).getPropertyValue('--v2txtw'), 10) || 560; setW(cur + (e.key === 'ArrowLeft' ? 40 : -40)); save(); });
    grip.addEventListener('dblclick', ()=>{ setW(560); save(); });
    box.prepend(grip);
  }
  window.addEventListener('resize', ()=>{ try{ setW(parseInt(getComputedStyle(root).getPropertyValue('--v2txtw'), 10) || w0); }catch(e){} });
}
