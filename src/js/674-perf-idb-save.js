/* 0.9.3.87 — адресний запис одного пацієнта в IndexedDB.
   Не змінює формат запису; idbPutVal лишається точкою шифрування PIN. */
{
  const savePatient0 = savePatient;
  savePatient = function(silent){
    if (!IDB.ok || !IDB.db || !IDB.cache || (typeof pinBlocked === 'function' && pinBlocked()))
      return savePatient0.apply(this, arguments);

    const name = patientName();
    if (!name && !PID){
      if (!silent) toast('Вкажіть ПІБ пацієнта на вкладці «Запис»');
      return false;
    }
    if (!PID) PID = 'p' + Date.now();

    const record = {
      name: name || 'Без імені',
      card: mv('card'),
      dob: mv('dob'),
      updated: Date.now(),
      snap: snap()
    };

    // IDB.cache — внутрішній кеш; оновлюємо лише один запис без копіювання всієї бази.
    IDB.cache[PID] = record;
    let ok = true;
    try{
      IDB.w[PID] = record.updated;
      const tx = IDB.db.transaction('patients', 'readwrite');
      idbPutVal(tx.objectStore('patients'), PID, record);
      tx.onerror = () => toast('Не вдалося зберегти пацієнта в сховище браузера: ' + (tx.error && tx.error.message || ''), 6000);
    }catch(e){
      toast('Помилка сховища: ' + (e && e.message || e), 6000);
      ok = false;
    }
    if (ok && typeof fsSchedule === 'function') fsSchedule(false);
    if (!silent) toast(ok ? 'Пацієнта збережено' : 'Не вдалося зберегти: браузер заборонив сховище або воно переповнене', ok ? 1600 : 5000);
    renderPatients();
    markSaved(ok);
    return ok;
  };
}
