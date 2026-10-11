/* ===== Резервна копія: нагадування ===== */
function backupInfo(){
  let t = 0; try{ t = +localStorage.getItem('po.backup') || 0; }catch(e){}
  const st = loadStore(), ids = Object.keys(st), changed = ids.filter(id=>st[id].updated > t).length;
  const days = t ? Math.floor((Date.now() - t) / 864e5) : null;
  return {t, n:ids.length, changed, days, due: ids.length > 0 && (!t || days >= 7 || changed >= 10)};
}
function backupBox(){
  const b = backupInfo(); if (!b.n) return null;
  const when = b.t ? new Date(b.t).toLocaleDateString('uk-UA') : 'ще не робилась';
  return h('div', {class:b.due ? 'warnbox bk' : 'bkok'},
    h('span', {}, b.due ? `Резервна копія: ${when}` + (b.t ? `, змінено пацієнтів після неї: ${b.changed}` : '') + '. Дані зберігаються лише в цьому браузері — збережіть копію у файл.' : `Резервна копія: ${when}.`),
    b.due ? h('button', {type:'button', class:'btn primary', onclick:exportAll}, 'Зберегти всіх у файл') : null);
}
function importFile(file){
  const rd = new FileReader();
  rd.onload = ()=>{
    try{
      const o = JSON.parse(rd.result);
      if (!o || o.type !== 'po-patients' || typeof o.items !== 'object') throw 0;
      const st = loadStore(); let n = 0;
      for (const id in o.items){ const it = o.items[id]; if (it && it.snap && it.snap.f){ st[id] = it; n++; } }
      if (!saveStore(st)) throw 1;
      renderPatients(); toast('Імпортовано пацієнтів: ' + n);
    }catch(e){ toast('Це не файл пацієнтів цієї програми або він пошкоджений', 5000); }
  };
  rd.readAsText(file);
}

