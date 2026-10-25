/* 0.9.3.41 — підказки формату та одиниці поряд із числом на телефоні. */
const MOBILE_INPUT_META = new Map();
let MOBILE_HELP_ID = 0;
SECTIONS.forEach(s=>s.fields.forEach(f=>{
  if (f.type !== 'num') return;
  const examples = f.parts.map(p=>p.ph).filter(p=>p && /\d/.test(p));
  const pressure = f.parts.length === 2 && f.parts[0].u === '/';
  const help = pressure ? 'Наприклад: ' + examples.join('/') + ' ' + f.parts[1].u :
    examples.length ? 'Наприклад: ' + f.parts.map(p=>[p.ph, p.u].filter(Boolean).join(' ')).join(' · ') : '';
  f.inputs.forEach((input,i)=>MOBILE_INPUT_META.set(input.id, {help, unit:f.parts[i].u}));
}));
PT.forEach(p=>MOBILE_INPUT_META.set('pt_' + p.k, {unit:p.l.split(', ').slice(1).join(', '), help:p.k === 't' ? 'Наприклад: 36,6 °C' : ''}));
CTRL.forEach(c=>(c.two ? [0,1] : [0]).forEach(i=>MOBILE_INPUT_META.set(`ctrl_${c.k}_${i}`, {
  ph:c.ph && c.ph[i], help:c.ph ? 'Наприклад: ' + c.ph.join(c.two ? '/' : '') + ' ' + c.u : ''
})));
function mobileInputHelp(input, host, message){
  if (!message || !host) return;
  let help = [...host.children].find(e=>e.classList.contains('mobile-input-help') && e.textContent === message);
  if (!help){ help = h('small', {class:'mobile-input-help', id:'mobile_help_' + (++MOBILE_HELP_ID)}, message); host.append(help); }
  const ids = (input.getAttribute('aria-describedby') || '').split(/\s+/).filter(Boolean);
  if (!ids.includes(help.id)) input.setAttribute('aria-describedby', [...ids, help.id].join(' '));
}
function mobileInputEnhance(input){
  if (!input.isConnected || input.dataset.mobileInput) return;
  input.dataset.mobileInput = '1';
  if (input.type === 'date' || input.type === 'datetime-local'){
    mobileInputHelp(input, input.parentElement, input.type === 'date' ? 'Дату оберіть у календарі: день, місяць і рік' : 'Дату оберіть у календарі · час: години й хвилини');
    return;
  }
  if (!input.inputMode) input.inputMode = 'decimal';
  input.spellcheck = false;
  const meta = MOBILE_INPUT_META.get(input.dataset.for || input.id);
  if (meta && meta.ph && !input.placeholder) input.placeholder = meta.ph;
  const row = input.closest('.nums, .cv');
  // Об'єднуємо лише сусіднє поле й одиницю; обробники та значення лишаються на самому input.
  if (row && input.parentElement === row){
    let unit = input.nextElementSibling;
    while (unit && unit.classList.contains('entry-status')) unit = unit.nextElementSibling;
    if (unit && unit.classList.contains('u')){
      const pair = h('span', {class:'mobile-number-pair'}); input.before(pair);
      while (pair.nextSibling){ const node = pair.nextSibling; pair.append(node); if (node === unit) break; }
    }
  } else if (meta && meta.unit && input.id.startsWith('pt_')){
    const pair = h('span', {class:'mobile-number-pair mobile-calculator-number'}); input.before(pair);
    pair.append(input, h('span', {class:'mobile-input-unit'}, meta.unit));
  }
  if (meta) mobileInputHelp(input, row || input.closest('.f') || input.parentElement, meta.help);
}
const MOBILE_INPUT_SELECTOR = 'input[type="date"], input[type="datetime-local"], input[type="number"], input[inputmode="decimal"], input[inputmode="numeric"]:not([type="password"])';
function mobileInputScan(root){
  if (root.matches && root.matches(MOBILE_INPUT_SELECTOR)) mobileInputEnhance(root);
  if (root.querySelectorAll) root.querySelectorAll(MOBILE_INPUT_SELECTOR).forEach(mobileInputEnhance);
}
mobileInputScan(document);
// Нові поля журналу, призначень і швидкої правки також отримують підказки.
new MutationObserver(records=>{
  const roots = new Set();
  records.forEach(record=>record.addedNodes.forEach(node=>{ if (node.nodeType === 1) roots.add(node); }));
  roots.forEach(mobileInputScan);
}).observe(document.body, {childList:true, subtree:true});
