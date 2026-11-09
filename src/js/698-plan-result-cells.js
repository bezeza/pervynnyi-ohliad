/* 0.9.3.103 — план обстеження: «✓ Внести результат» відкриває клітинки журналу обстежень
   (Hb, ер., лейк. … з нормою, ↑↓ і попереднім значенням) замість одного рядка з «…».
   Дата форми — найближча запланована дата аналізу, що вже настала (або сьогодні).
   Для консультацій і того, чого немає в каталозі, лишається попередній рядок. Наявний код плану не змінено. */
function planResultDate(name){
  const t = todayISO(), ds = (typeof planDates === 'function' ? planDates(name) : []).filter(d=>d !== 'вип' && d <= t).sort();
  const done = typeof planDone === 'function' ? planDone(name) : [];
  const open = ds.filter(d=>!done.includes(d));
  return open.length ? open[open.length - 1] : t;
}
document.addEventListener('click', e=>{
  const b = e.target.closest && e.target.closest('#planDList button[title="Внести результат"]'); if (!b) return;
  const row = b.closest('.pdrow'), n = row && row.querySelector('.pd-n'), name = n ? n.textContent.trim() : '';
  if (!name || typeof labDef !== 'function' || !labDef(name) || typeof labsOpen !== 'function') return;
  e.preventDefault(); e.stopImmediatePropagation();
  const dlg = labsOpen({test:name});
  const d = dlg && dlg.querySelector('.ljed input[type=date]');
  if (d){ d.value = planResultDate(name); d.dispatchEvent(new Event('change')); }
}, true);
