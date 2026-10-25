/* 0.9.3.50 — зв’язування рядків бланків із заздалегідь визначеними полями форми.
   Поля оголошені у файлах розділів, щоб restoreLast бачив їх під час першого відновлення. */

function setPaperFill(el, value){
  if (!el) return;
  const v = String(value || '').trim(); el.textContent = v || '\u00a0'; el.classList.toggle('empty', !v);
}
function setPaperCells(el, value){
  if (!el) return;
  const v = String(value || '').replace(/\D/g, '');
  [...el.querySelectorAll('.bc')].forEach((c,i)=>c.textContent = v[i] || '\u00a0');
}
function setPaperCodeCells(el, value){
  if (!el) return;
  const v = String(value || '').toUpperCase().replace(/[^A-ZА-ЯІЇЄҐ0-9]/g, '');
  [...el.querySelectorAll('.bc')].forEach((c,i)=>c.textContent = v[i] || '\u00a0');
}
function paperRow(root, prefix){ return [...root.querySelectorAll('.brow')].find(r=>r.textContent.trim().startsWith(prefix)) || null; }
function paperEditable(row, keys){
  if (!row || !keys.length) return;
  row.dataset.fld = keys.join(' ');
  row.classList.add('pedit'); row.tabIndex = 0; row.setAttribute('role','button');
  row.setAttribute('aria-label', 'Відкрити поле форми: ' + keys.map(k=>{ const f=F(k); return f && f.label || k; }).join(', '));
  row.title = 'Натисніть, щоб перейти до поля у формі';
}

/* Під’єднати порожні рядки форми 003/о до окремих значень або до наявної 066/о. */
{
  const bTitle0 = bTitle;
  bTitle = function(){
    const page = bTitle0.apply(this, arguments);
    const doc = paperRow(page, '6. Документ, що посвідчує особу');
    const parts = String(S66('docid') || '').split(',');
    if (doc){ const fill=doc.querySelectorAll('.bf'); setPaperFill(fill[0], parts[0]); setPaperFill(fill[1], parts.slice(1).join(',').trim()); paperEditable(doc,['s066.docid']); }
    const citizen = paperRow(page, '6.2. Громадянство');
    if (citizen){ setPaperFill(citizen.querySelector('.bf'), String(S66('grom') || '').replace(/\D/g,'')); paperEditable(citizen,['s066.grom']); }
    const hiv = paperRow(page, '13. Госпіталізація:');
    if (hiv){ const cells=hiv.querySelectorAll('.bcells'); setPaperCells(cells[0], bD6(d66.vil())); paperEditable(hiv,['s066.vil']); }
    const blood = paperRow(page, '15. Група крові');
    if (blood){ const fill=blood.querySelectorAll('.bf'), cells=blood.querySelector('.bcells'); setPaperFill(fill[0],d66.krov()); setPaperFill(fill[1],d66.rh()); setPaperCells(cells,bD6(d66.rw())); paperEditable(blood,['s066.krov','s066.rh','s066.rw']); }
    const repeat = paperRow(page, '19. Госпіталізація з приводу');
    if (repeat){ const boxes=repeat.querySelectorAll('.bbox'), v=S66('vp'); boxes[0].textContent=v >= 0 ? String(v+1) : '\u00a0'; paperEditable(repeat,['s066.vp']); }
    const repeat30 = paperRow(page, '19.1. Повторна госпіталізація');
    if (repeat30){ const box=repeat30.querySelector('.bbox'), v=S66('p30'); if(box) box.textContent=v >= 0 ? String(v+1) : '\u00a0'; paperEditable(repeat30,['s066.p30']); }
    return page;
  };
  const bExam0 = bExam;
  bExam = function(){
    const pages = bExam0.apply(this, arguments), page=pages[0]; if (!page) return pages;
    const blood = paperRow(page, 'А/Т: права рука');
    if (blood){ const fills=blood.querySelectorAll('.bf'), f=F('ssc.adl'); setPaperFill(fills[1], f && f.inputs[0].value && f.inputs[1].value ? f.inputs[0].value+'/'+f.inputs[1].value : ''); paperEditable(blood,['ssc.adl']); }
    const breast = paperRow(page, 'Молочні залози:');
    if (breast){ setPaperFill(breast.querySelector('.bf'), F('zah.moloch').el.value); paperEditable(breast,['zah.moloch']); }
    const musculoskeletal = paperRow(page, 'Кістково-суглобова система:');
    if (musculoskeletal){ setPaperFill(musculoskeletal.querySelector('.bf'), F('zah.opora').el.value); paperEditable(musculoskeletal,['zah.opora']); }
    return pages;
  };
}

/* У формі 066/о поля лишаються окремими для кожної редакції бланка. */
{
  const b12 = b066v12;
  b066v12 = function(){
    const pages=b12.apply(this, arguments), row=paperRow(pages[0], '8. Діагноз при направленні');
    if (row){ setPaperFill(row.querySelector('.bf'), F('s066.dxnapr').el.value); paperEditable(row,['s066.dxnapr']); }
    const pregnancy=paperRow(pages[1], 'У разі смерті жінок під час вагітності');
    if (pregnancy){ const v=F('s066.gest').el.value.trim(); if(v){ pregnancy.replaceChildren(h('span',{class:'bl'},'У разі смерті жінок під час вагітності або після пологів у період до одного року: '), bFill(v,false,true)); } paperEditable(pregnancy,['s066.gest']); }
    return pages;
  };
  const b16 = b066v16;
  b066v16 = function(){
    const pages=b16.apply(this, arguments), row=paperRow(pages[0], '12. Діагноз при госпіталізації');
    if (row){ setPaperFill(row.querySelector('.bf'), F('s066.dxhosp').el.value); setPaperCodeCells(row.querySelector('.bcells'), F('s066.dxhospcode').el.value); paperEditable(row,['s066.dxhosp','s066.dxhospcode']); }
    const pregnancy=paperRow(pages[1], 'Для жінок, які померли під час вагітності');
    if (pregnancy){ const v=F('s066.gest').el.value.trim(); if(v){ pregnancy.replaceChildren(h('span',{class:'bl'},'Для жінок, які померли під час вагітності або після пологів (до 1 року): '), bFill(v,false,true)); } paperEditable(pregnancy,['s066.gest']); }
    return pages;
  };
}

function paperGoToField(row){
  const key=(row.dataset.fld || '').trim().split(/\s+/)[0], field=F(key);
  if (!field) return;
  const section=SECTIONS.find(item=>item.fields.includes(field));
  const targetDoc=(field.docs || section && section.docs || []).find(doc=>doc !== DOC);
  if (targetDoc){ switchDoc(targetDoc); setTimeout(()=>bGo(key),0); return; }
  bGo(key);
}
document.addEventListener('click',e=>{
  const row=e.target.closest&&e.target.closest('#paper .b003 .pedit[data-fld]');
  if(row){ e.preventDefault(); paperGoToField(row); }
});
document.addEventListener('keydown',e=>{
  const row=e.target.closest&&e.target.closest('#paper .b003 .pedit[data-fld]');
  if(row&&(e.key==='Enter'||e.key===' ')){e.preventDefault();paperGoToField(row);}
});
