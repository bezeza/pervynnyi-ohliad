/* 0.9.3.134 — вкладки документів у шапці не «застрягають» над формою: після епікризу (ширша шапка) вони переїжджали
   в рядок над формою й не поверталися — навігація стрибала між документами. Перевіряємо місце після кожного перемикання й зміни розміру. */
{
  const again = () => { try{ if (typeof SHELL !== 'undefined' && SHELL.placeDocs) requestAnimationFrame(()=>SHELL.placeDocs()); }catch(e){} };
  const sw0 = switchDoc; switchDoc = function(){ const r = sw0.apply(this, arguments); again(); return r; };
  let t = 0; window.addEventListener('resize', ()=>{ clearTimeout(t); t = setTimeout(again, 150); });
}
