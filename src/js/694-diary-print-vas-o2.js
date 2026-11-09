/* 0.9.3.99 — бланк щоденника (003/о): ВАШ і спосіб подачі кисню. Наявну bDiaryEntry не змінено — лише обгортка.
   Без нових полів рядки не додаються, і друк збігається з попередньою версією (порожній і старі записи). */
{
  const bDiaryEntry0 = bDiaryEntry;
  bDiaryEntry = function(e){
    const el = bDiaryEntry0.apply(this, arguments);
    try{ diaryPrintExtras(el, e); }catch(err){ console.warn(err); }
    return el;
  };
}
function diaryPrintExtras(el, e){
  const f = (e && e.f) || {}, n = id => (f[id] || '').trim();
  const vash = n('d_main_vash_0'), src = String(f.d_obj_o2src || ''), dev = String(f.d_obj_o2dev || '');
  const o2 = n('d_obj_o2_0'), spo = n('d_obj_chd_1');
  const rows = [...el.querySelectorAll('.brow')];
  const rowOf = t => rows.find(r => r.firstElementChild && r.firstElementChild.textContent.trim().startsWith(t));
  if (vash !== ''){ const skr = rowOf('Скарги на'); if (skr) skr.after(bRow('Біль за ВАШ: ', bFill(vash, true), '/10')); }
  if (spo || src !== ''){   // 0.9.3.100: SpO₂ у форматі «SpO₂ 94 %» (рішення лікаря)
    const span = (rowOf('Аускультативно в легенях') || {}).lastElementChild;
    if (span){
      const spoLine = [spo ? 'SpO₂ ' + spo + ' %' : '', diaryOxygenText(src, dev, o2)].filter(Boolean).join(' ');
      span.replaceWith(bFill(bJoin(bDv(f, 'd_obj.dyh'), spoLine), true, true));
    }
  }
}
