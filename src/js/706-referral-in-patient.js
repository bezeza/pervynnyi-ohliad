/* ===== 0.9.3.124 · направлення — у вкладці «Пацієнт і лікар» (лікар 11.11.2026) =====
   «Як на карті стаціонарного хворого»: на титулі 003/о п. 9 «Ким направлений» іде одразу після п. 8 «Місце роботи».
   Тому поля «Госпіталізація», «Який лікар направив», «З якого закладу», «Код закладу за ЄДРПОУ», «№ електронного направлення»
   переносяться з «Анамнезу хвороби» в «Пацієнт і лікар» під «Місце роботи» (лише стаціонар).
   Це ті самі поля (morbi.*): ідентифікатори, збереження, текст (фраза в «Анамнезі хвороби»), бланки 003/о, 066/о, h24 — без змін. */
{
  const KEYS = ['hosp', 'hospd', 'hospz', 'hospe', 'hospn'];
  const work = document.getElementById('meta_work'), at = work && work.closest('.f');
  const fs = KEYS.map(k=>F('morbi.' + k)).filter(f=>f && f.wrapEl);
  if (at && fs.length === KEYS.length){
    const hd = h('h3', {class:'sub f wide ref-h', 'data-only':'hosp'}, 'Направлення (п. 9 ф. 003/о)');
    let after = at; [hd, ...fs.map(f=>f.wrapEl)].forEach(el=>{ after.after(el); after = el; });
    fs.forEach(f=>f.wrapEl.classList.add('ref-f'));
    onUpdate('706-referral', ()=>{ hd.hidden = MODE !== 'hosp'; });
    hd.hidden = MODE !== 'hosp';
  }
}
