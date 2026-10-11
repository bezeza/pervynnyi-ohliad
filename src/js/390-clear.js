/* ===== Очищення ===== */
function clearSection(sc){
  if (sc && sc.id === 'dx'){ const pd = document.getElementById('dx_pland'); if (pd) pd.value = '{}'; }
  sc.fields.forEach(f=>{
    if (f.type === 'sel'){ f.el.value = f.def !== undefined ? f.def : ''; mark(f.el, f); f.autoSet = false; }
    else if (f.type === 'multi'){ f.chips.forEach(c=>{ c.setAttribute('aria-pressed','false'); delete c.dataset.ord; delete c.dataset.auto; delete c.dataset.off; delete c.dataset.tpl; }); detReset(f); refreshChips(f); }
    else if (f.type === 'period'){ f.d1.value = ''; f.d2.value = ''; }
    else if (f.type === 'num') f.inputs.forEach(i=>i.value = '');
    else if (f.type === 'numsel'){ f.inp.value = ''; f.unit.value = '0'; }
    else if (f.el && f.type !== 'auto' && f.type !== 'hdr') f.el.value = '';
  });
  if (sc.id === 'ctrl') document.querySelectorAll('[id^="ctrl_"]').forEach(e=>{ if (e.tagName === 'INPUT') e.value = ''; });
}
function clearDoc(btn){
  if (!btn.dataset.lbl) btn.dataset.lbl = btn.textContent;
  if (!btn.dataset.arm){ btn.dataset.arm = '1'; btn.textContent = 'Точно очистити весь документ?'; setTimeout(()=>{ delete btn.dataset.arm; btn.textContent = btn.dataset.lbl; }, 3500); return; }
  delete btn.dataset.arm; btn.textContent = btn.dataset.lbl;
  SECTIONS.filter(sc=>sc.docs.includes(DOC) && !(sc.only && sc.only !== MODE)).forEach(clearSection);
  if (DOC === 'ohl'){ curKey = null; if (HV.cards) HV.cards.forEach(c=>c.setAttribute('aria-pressed','false')); renderHvTips(); dxPanel.sel = null; }
  CACHE[DOC] = null; dirty = false; $('#banner').hidden = true; setNow(); update();
  toast('Поля документа очищено. Дані пацієнта, призначення й журнали збережено; для іншого пацієнта — «Новий пацієнт»', 5000);
}
