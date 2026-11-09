/* 0.9.3.102 — швидкодія (план 18).
   labsCol(): картка «Обстеження» в шапці пацієнта не перезаписується, якщо текст уже той самий
      (виклик з renderPtBar і з update() за одне оновлення — другий тепер майже безкоштовний). */
{
  const labsCol0 = labsCol;
  labsCol = function(){
    const v = document.querySelector('#ptline .pcols .pcol.labs .pval');
    if (v){ const n = RES.length, t = n ? `${n} ${plural(n, ['запис','записи','записів'])}` : 'вписати'; if (v.textContent === t) return; }
    return labsCol0.apply(this, arguments);
  };
}
