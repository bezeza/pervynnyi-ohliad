/* ===== Друк будь-якої вкладки і пакета документів ===== */
function printBlocked(){ let fr = false; try{ fr = window.top !== window.self; }catch(e){ fr = true; }
  if (fr) toast('В онлайн-версії друк заблоковано. Відкрийте збережений файл pervynnyi-ohliad.html або сайт програми.', 6000); return fr; }
function printClone(node){
  const c = node.cloneNode(true);
  const src = node.querySelectorAll('input,select,textarea'), dst = c.querySelectorAll('input,select,textarea');
  dst.forEach((e,i)=>{ const o = src[i]; let v = '';
    if (o.type === 'file' || o.type === 'search' || o.hidden) { e.remove(); return; }
    if (o.type === 'checkbox' || o.type === 'radio') v = o.checked ? '☑' : '☐';
    else if (o.tagName === 'SELECT') v = o.selectedIndex >= 0 && o.value !== '' ? o.options[o.selectedIndex].text : '—';
    else v = o.value || '—';
    const sp = document.createElement('span'); sp.className = 'pr-val'; sp.textContent = v; e.replaceWith(sp); });
  c.querySelectorAll('button:not(.chip):not(.dcard),[hidden],.mic,svg').forEach(e=>e.remove());
  c.querySelectorAll('.chip').forEach(e=>{ if (e.getAttribute('aria-pressed') !== 'true') e.remove(); else e.replaceWith(Object.assign(document.createElement('span'), {className:'pr-chip', textContent:'✓ ' + e.textContent})); });
  c.querySelectorAll('[id]').forEach(e=>e.removeAttribute('id'));
  return c;
}
function printNode(title, nodes){
  if (printBlocked()) return;
  const P = $('#print'); P.innerHTML = '';
  const H = formHeader(), who = [mv('pib'), mv('dob') ? fmtD(mv('dob')) + ' р. н.' : ''].filter(Boolean).join(', ');
  P.append(h('div', {class:'pr-top'}, h('div', {}, ...H.left.slice(0,2).flatMap((l,k)=>k ? [h('br'), l] : [l])), h('div', {class:'r'}, fmtD(todayISO()))),
    h('h2', {class:'pr-title'}, title), who && title !== 'Довідка' ? h('p', {class:'pr-pat'}, 'Пацієнт: ' + who) : '');
  const b = h('div', {class:'pr-free'}); [].concat(nodes).filter(Boolean).forEach(n=>b.append(printClone(n))); P.append(b);
  window.print();
}
function printDocs(list){
  if (printBlocked()) return;
  chkWarn();
  const keep = DOC, P = $('#print'), parts = [];
  list.forEach(k=>{ switchDoc(k); if (!itext($('#out')).trim()) return; const d = h('div', {class:'pr-doc'}); fillSheet(d); parts.push(d); });
  switchDoc(keep);
  if (!parts.length){ toast('Обрані документи порожні'); return; }
  P.innerHTML = ''; parts.forEach(d=>P.append(d));
  toast(parts.length > 1 ? `До друку: ${parts.length} документи(ів), кожен з нової сторінки` : 'Щоб отримати PDF, у вікні друку виберіть «Зберегти як PDF»', 3500);
  window.print();
}
function packDialog(){
  const all = [...DOCLIST[MODE], ...DOCMORE[MODE]];
  const box = h('div', {class:'pack'});
  const cbs = all.map(([k,l])=>{ const c = h('input', {type:'checkbox', value:k}); if (['ohl','rx','pam'].includes(k) || k === DOC) c.checked = true; box.append(h('label', {class:'chk'}, c, ' ' + l)); return c; });
  const dlg = h('div', {class:'navsheet packsheet', role:'dialog', 'aria-label':'Друк кількох документів'},
    h('div', {class:'nvbox'}, h('h3', {}, 'Друк кількох документів'), h('p', {class:'chips-hint'}, 'Кожен документ — з нової сторінки, з шапкою закладу. Порожні пропускаються.'), box,
      h('div', {class:'acts2'}, h('button', {type:'button', class:'btn primary', onclick:()=>{ const L = cbs.filter(c=>c.checked).map(c=>c.value); dlg.remove(); if (L.length) printDocs(L); }}, 'Друкувати'),
        h('button', {type:'button', class:'more', onclick:()=>dlg.remove()}, 'Скасувати'))));
  dlg.addEventListener('click', e=>{ if (e.target === dlg) dlg.remove(); });
  document.body.append(dlg);
}
const PRINT_TAB = {
  meta: s=>printNode('Пацієнти', [document.querySelector('#today') && document.querySelector('#today').closest('.pt'), document.querySelector('#plist')]),
  calc: s=>printNode('Медичні калькулятори', s.panel.querySelector('.ph').nextElementSibling),
  help: s=>printNode('Довідка', s.panel.querySelector('.ph').nextElementSibling),
  tpl: s=>printNode('Мої шаблони', s.panel.querySelector('.ph').nextElementSibling),
  set: s=>printNode('Налаштування', s.panel.querySelector('.ph').nextElementSibling),
  ctrl: s=>printNode('Контроль хронічних хвороб', s.panel.querySelector('.ctrlbox')),
  scr: s=>printNode('Профілактика і скринінги', [s.panel.querySelector('.ctrlbox'), s.panel.querySelector('.ph').nextElementSibling.querySelector('.chips')].filter(Boolean)),
  rxt: s=>printDocs(['rx'])
};
function addPrintBtns(){
  TABS.forEach(s=>{ const ph = s.panel && s.panel.querySelector('.ph'); if (!ph || ph.querySelector('.prbtn')) return;
    const b = h('button', {type:'button', class:'more prbtn', title:'Надрукувати цю вкладку (для розділів документа — весь поточний документ)', onclick:()=>(PRINT_TAB[s.id] || (()=>doPrint()))(s)}, '🖨 Друк');
    const box = ph.querySelector('.acts2') || ph; box.append(b);
    if (s.id === 'meta' || s.id === 'hv') box.append(h('button', {type:'button', class:'more', title:'Надрукувати кілька документів пацієнта одним завданням', onclick:packDialog}, '🖨 Кілька документів'));
  });
}

