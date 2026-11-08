/* ===== 0.9.3.95 — каркас: клавіші й пошук (PLAN-UI-0.10, «Каркас ПК») =====
   • Ctrl+K знаходить і пацієнтів (ПІБ, № карти, діагноз), а не лише розділи, поля, хвороби й дії.
   • Новий пацієнт — Alt+N. Ctrl+N у Chrome зарезервовано під нове вікно (сторінка його не отримує),
     тому Ctrl+N спрацює лише там, де браузер його пропускає (встановлена програма).
   • Ctrl+Enter, як і раніше, копіює текст; у новому вигляді на комп’ютері ще й показує панель «Текст»,
     щоб було видно, що скопійовано. Esc закриває.
   Старт на останньому пацієнті вже є (restoreLast, 540): екран «Пацієнти» — лише коли пацієнта ще немає. */
{ const si0 = searchItems; searchItems = function(){
  const L = si0.apply(this, arguments);
  try{
    const st = loadStore();
    Object.keys(st).sort((a, b)=>(st[b].updated || 0) - (st[a].updated || 0)).forEach(id=>{
      const p = st[id]; if (!p || !p.name) return;
      const dx = p.snap && p.snap.f ? String(p.snap.f.dx_osn || '').split('\n')[0].slice(0, 60) : '';
      L.push({k:'Пацієнт', t:p.name, s:[p.card ? '№ ' + p.card : '', dx].filter(Boolean).join(' · '), go:()=>{ if (id !== PID) openPatient(id); }});
    });
    const np = L.find(x=>x.k === 'Дія' && x.t === 'Новий пацієнт'); if (np) np.s = 'Alt+N';
  }catch(e){}
  return L;
}; }
document.addEventListener('keydown', e=>{
  const mod = e.ctrlKey || e.metaKey;
  /* новий пацієнт: Alt+N (у будь-якій розкладці — за фізичною клавішею) або Ctrl+N, якщо браузер пропустить */
  if (e.code === 'KeyN' && !e.shiftKey && ((e.altKey && !mod) || (mod && !e.altKey))){
    if (document.querySelector('.cmdk, .switcher')) return;
    e.preventDefault(); try{ newPatient(); }catch(x){}
    return;
  }
  /* Ctrl+Enter: копіювання робить 548; тут — лише показати панель у новому вигляді */
  if (mod && e.key === 'Enter' && typeof UIV2 !== 'undefined' && UIV2 && typeof v2Wide === 'function' && v2Wide()){
    if (document.querySelector('.cmdk')) return;
    setTimeout(()=>{ try{ txtOpen(true); }catch(x){} }, 0);
  }
});
{ const tb = document.getElementById('txtBtn'); if (tb) tb.title = 'Текст документа: перевірка, друк, копіювання. Ctrl+Enter — скопіювати й показати, Esc — закрити'; }
