/* 0.9.3.50 — введення даних для друкованих рядків, яких раніше не було у формі.
   Збереження використовує наявні поля пацієнта; внутрішнє підтвердження друку не є підписом. */
function addPaperField(sectionId, field){
  const s = SECTIONS.find(x=>x.id === sectionId); if (!s || s.fields.some(x=>x.id === field.id)) return;
  field.noOut = true;
  s.fields.push(field);
  const grid = s.panel && s.panel.querySelector('.grid');
  if (grid) grid.append(buildField(s, field));
}
addPaperField('zah', {id:'moloch', type:'text', rows:2, wide:true, docs:['ohl'], label:'Молочні залози (форма 003/о)', placeholder:'Внесіть фактичні дані огляду'});
addPaperField('zah', {id:'opora', type:'text', rows:2, wide:true, docs:['ohl'], label:'Кістково-суглобова система (форма 003/о)', placeholder:'Внесіть фактичні дані огляду'});
addPaperField('ssc', {id:'adl', type:'num', docs:['ohl'], label:'Артеріальний тиск — ліва рука (форма 003/о)', parts:[{ph:'120',u:'/'},{ph:'80',u:'мм рт. ст.'}]});
addPaperField('s066', {id:'dxnapr', type:'text', rows:2, wide:true, docs:['f066'], label:'Ред. 2012, п. 8: діагноз при направленні', placeholder:'Вкажіть діагноз із направлення'});
addPaperField('s066', {id:'dxhosp', type:'text', rows:2, wide:true, docs:['f066'], label:'Ред. 2016, п. 12: діагноз при госпіталізації', placeholder:'Вкажіть діагноз при госпіталізації'});
addPaperField('s066', {id:'dxhospcode', type:'line', docs:['f066'], label:'Ред. 2016, п. 12: код МКХ-10 діагнозу при госпіталізації'});
addPaperField('s066', {id:'gest', type:'text', rows:2, wide:true, docs:['f066'], label:'066/о: дані про вагітність або післяпологовий період (за потреби)', placeholder:'Тиждень вагітності; день післяпологового періоду; тиждень після пологів'});

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
  row.dataset.fld = keys.join(' '); // 599-links leaves these rows for the direct editor below.
  row.dataset.pfields = keys.join(' ');
  row.classList.add('pedit'); row.tabIndex = 0; row.setAttribute('role','button');
  row.setAttribute('aria-label', 'Редагувати в документі: ' + keys.map(k=>{ const f=F(k); return f && f.label || k; }).join(', '));
  row.title = 'Натисніть, щоб внести дані тут';
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

function paperFieldTargets(key){
  const f=F(key); if(!f) return [];
  if(f.inputs) return f.inputs.map((el,i)=>[el, f.label + (f.parts && f.parts[i] ? ', ' + f.parts[i].u : ' ' + (i+1))]);
  if(f.d1 || f.d2) return [[f.d1,f.label+' — від'],[f.d2,f.label+' — до']].filter(x=>x[0]);
  if(f.inp) return [[f.inp,f.label],[f.unit,f.label+' — одиниці']].filter(x=>x[0]);
  return f.el ? [[f.el,f.label]] : [];
}
function paperCloneInput(src, label){
  let el;
  if(src.tagName === 'SELECT'){
    el=h('select',{'aria-label':label},...Array.from(src.options).map(o=>h('option',{value:o.value},o.textContent))); el.value=src.value;
  }else if(src.tagName === 'TEXTAREA'){
    el=h('textarea',{rows:2,'aria-label':label,placeholder:src.placeholder||''}); el.value=src.value;
  }else{
    const type=['date','time','datetime-local','number'].includes(src.type) ? src.type : 'text';
    el=h('input',{type,inputmode:src.getAttribute('inputmode')||null,'aria-label':label,placeholder:src.placeholder||''}); el.value=src.value;
  }
  return el;
}
function openPaperFieldEditor(anchor, keys){
  document.querySelectorAll('.bqe').forEach(x=>x.remove());
  const inputs=keys.flatMap(paperFieldTargets).map(([src,label])=>[src,label,paperCloneInput(src,label)]);
  if(!inputs.length) return;
  const save=()=>{ inputs.forEach(([src,,edit])=>{ if(src.value!==edit.value){ src.value=edit.value; src.dispatchEvent(new Event(src.tagName==='SELECT'?'change':'input',{bubbles:true})); } }); pop.remove(); if(PAPER) renderPaper(); };
  const pop=h('div',{class:'bqe',role:'dialog','aria-label':'Внести дані в друкований бланк'},
    h('b',{},'Внести дані тут'),
    h('div',{class:'bqg'+(inputs.length===1?' one':'')},...inputs.map(([,label,edit])=>h('label',{},h('span',{},label),edit))),
    h('div',{class:'acts2'},h('button',{type:'button',class:'btn primary',onclick:save},'Зберегти'),h('button',{type:'button',class:'more',onclick:()=>pop.remove()},'Скасувати')));
  inputs.forEach(([, ,i])=>i.addEventListener('keydown',e=>{if(e.key==='Escape')pop.remove();else if(e.key==='Enter'&&i.tagName!=='TEXTAREA'){e.preventDefault();save();}}));
  const r=anchor.getBoundingClientRect(); document.body.append(pop);
  pop.style.top=Math.min(window.innerHeight-pop.offsetHeight-8,Math.max(8,r.bottom+6))+'px';
  pop.style.left=Math.min(window.innerWidth-pop.offsetWidth-8,Math.max(8,r.left-20))+'px';
  setTimeout(()=>{const f=inputs.find(([, ,i])=>!i.value)||inputs[0];f[2].focus();},20);
}
document.addEventListener('click',e=>{
  const row=e.target.closest&&e.target.closest('#paper .b003 [data-pfields]');
  if(row){ e.preventDefault(); openPaperFieldEditor(row,row.dataset.pfields.split(/\s+/)); return; }
  const pop=document.querySelector('.bqe'); if(pop&&!pop.contains(e.target)) pop.remove();
});
document.addEventListener('keydown',e=>{
  if((e.key==='Enter'||e.key===' ')&&e.target.matches('#paper .b003 [data-pfields]')){e.preventDefault();openPaperFieldEditor(e.target,e.target.dataset.pfields.split(/\s+/));}
});
