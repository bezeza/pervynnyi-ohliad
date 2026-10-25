/* 0.9.3.42 — вставки й поля в окремому вікні. Оригінальні поля залишаються у формі. */
const POP_INSERT = {box:null, range:null, doc:null, pid:null, undo:null, textUndo:null};
function popInsertClose(focus){
  POP_INSERT.box?.remove(); POP_INSERT.box=null; POP_INSERT.undo=null;
  if (focus && POP.w && !POP.w.closed) POP.w.document.getElementById('pwAdd')?.focus();
}
function popInsertSections(){
  return SECTIONS.filter(s=>(!s.docs || s.docs.includes(DOC)) && (!s.only || s.only===MODE));
}
function popInsertFields(s){
  return s.fields.filter(f=>f.wrapEl && !['hdr','auto'].includes(f.type) && !f.noOut && !f.headOnly &&
    (!f.docs || f.docs.includes(DOC)) && (!f.only || f.only===MODE) && (!f.when || f.when()));
}
function popInsertChange(fn){
  POP_INSERT.textUndo=null;
  if (!POP_INSERT.undo){ undoPush('вставка або правка в окремому вікні'); POP_INSERT.undo=UNDO.at(-1); }
  fn(); renderPaper(); popSoon();
}
function popInsertControl(source, host, name){
  const d=host.ownerDocument, label=d.createElement('label'), input=d.createElement(source.tagName.toLowerCase());
  label.textContent=source.getAttribute('aria-label') || name || source.labels?.[0]?.textContent || 'Значення';
  for (const key of ['type','min','max','step','placeholder','inputmode']) if (source.hasAttribute(key)) input.setAttribute(key,source.getAttribute(key));
  if (source.tagName==='SELECT') input.innerHTML=source.innerHTML;
  if (source.tagName==='TEXTAREA') input.rows=3;
  input.value=source.value; input.dataset.popSource=source.id; input.disabled=source.disabled;
  input.addEventListener(source.tagName==='SELECT' || source.type==='checkbox'?'change':'input',()=>popInsertChange(()=>{
    source.value=input.value; source.dispatchEvent(new Event(source.tagName==='SELECT'?'change':'input',{bubbles:true}));
  }));
  label.append(input); host.append(label); return input;
}
function popInsertField(f, host){
  const d=host.ownerDocument;
  if (f.type==='multi'){
    const search=d.createElement('input'), list=d.createElement('div'); search.type='search'; search.placeholder='Знайти варіант'; search.setAttribute('aria-label','Пошук варіантів'); list.className='pw-choices';
    const draw=()=>{ list.replaceChildren(); f.chips.forEach((source,i)=>{
      const text=g(O(f.opts[i]).l); if (!text.toLowerCase().includes(search.value.toLowerCase())) return;
      const button=d.createElement('button'); button.type='button'; button.textContent=text; button.dataset.popChip=source.id; button.setAttribute('aria-pressed',source.getAttribute('aria-pressed'));
      button.onclick=()=>{ popInsertChange(()=>source.click()); draw(); }; list.append(button);
    }); };
    search.oninput=draw; host.append(search,list); draw();
  }
  const controls=f.inputs || [f.el,f.inp,f.unit,f.d1,f.d2].filter(Boolean);
  controls.forEach(source=>popInsertControl(source,host,f.label));
  const own=DIARY_INLINE_OWN.get(f); if (own) popInsertControl(own,host);
  if (f.quick?.length && f.el){
    const list=d.createElement('div'); list.className='pw-choices';
    f.quick.forEach(raw=>{ const button=d.createElement('button'); button.type='button'; button.textContent='+ '+g(raw);
      button.onclick=()=>{ popInsertChange(()=>{ f.el.value=[f.el.value.trim(),g(raw)].filter(Boolean).join(f.sep || '\n'); f.el.dispatchEvent(new Event('input',{bubbles:true})); }); popInsertSync(); }; list.append(button); }); host.append(list);
  }
}
function popInsertSync(){
  const box=POP_INSERT.box; if (!box) return;
  if (POP_INSERT.doc!==DOC || POP_INSERT.pid!==PID){ popInsertClose(); return; }
  box.querySelectorAll('[data-pop-source]').forEach(input=>{ const source=document.getElementById(input.dataset.popSource); if (source && box.ownerDocument.activeElement!==input) input.value=source.value; });
  box.querySelectorAll('[data-pop-chip]').forEach(button=>{ const source=document.getElementById(button.dataset.popChip); if (source) button.setAttribute('aria-pressed',source.getAttribute('aria-pressed')); });
  const note=box.querySelector('.pw-manual-note'); if (note) note.hidden=!dirty;
}
function popInsertText(value){
  const w=POP.w, d=w.document, tx=d.querySelector('.pw-text'); if (!tx || !value) return;
  const range=POP_INSERT.range;
  tx.focus(); const selection=w.getSelection();
  if (range && tx.contains(range.commonAncestorContainer)){ selection.removeAllRanges(); selection.addRange(range); }
  else { const end=d.createRange(); end.selectNodeContents(tx); end.collapse(false); selection.removeAllRanges(); selection.addRange(end); }
  POP_INSERT.textUndo={html:tx.innerHTML,doc:DOC,pid:PID,dirty};
  POP_INSERT.undo=null;
  // insertText зберігає вставку звичайним текстом і підтримує Ctrl+Z браузера.
  d.execCommand('insertText',false,value); tx.dispatchEvent(new w.Event('input',{bubbles:true}));
  POP_INSERT.textUndo.after=tx.innerHTML;
  if (selection.rangeCount) POP_INSERT.range=selection.getRangeAt(0).cloneRange();
}
function popInsertOpen(keys, anchor){
  const w=POP.w; if (!w || w.closed) return; popInsertClose();
  const d=w.document, box=d.createElement('section'); box.className='pw-insert'; box.setAttribute('role','dialog'); box.setAttribute('aria-label','Додати або змінити в документі');
  POP_INSERT.box=box; POP_INSERT.doc=DOC; POP_INSERT.pid=PID; POP_INSERT.mode=POP.mode;
  const head=d.createElement('div'), title=d.createElement('b'), close=d.createElement('button'); title.textContent='Додати або змінити'; close.type='button'; close.textContent='✕'; close.setAttribute('aria-label','Закрити'); close.onclick=()=>popInsertClose(true); head.className='pw-insert-head'; head.append(title,close); box.append(head);
  const undo=d.createElement('button'); undo.type='button'; undo.textContent='↶ Скасувати вставку / правку';
  undo.onclick=()=>{ if (POP_INSERT.undo && UNDO.at(-1)===POP_INSERT.undo && POP_INSERT.pid===PID){ undoLast(); POP_INSERT.undo=null; popRender(); popInsertSync(); }
    else if (POP_INSERT.textUndo?.doc===DOC && POP_INSERT.textUndo.pid===PID){ const tx=d.querySelector('.pw-text'); if (tx && tx.innerHTML===POP_INSERT.textUndo.after){
      const previous=POP_INSERT.textUndo; tx.innerHTML=previous.html; tx.dispatchEvent(new w.Event('input',{bubbles:true}));
      dirty=previous.dirty; CACHE[DOC]={html:previous.html,dirty}; manualTextStatus(); renderCheck(); autosave(); POP_INSERT.textUndo=null;
    } }
  }; box.append(undo);
  if (POP.mode==='text'){
    const text=d.createElement('textarea'), add=d.createElement('button'); text.rows=3; text.placeholder='Текст для вставки в позицію курсора'; text.setAttribute('aria-label',text.placeholder); add.type='button'; add.textContent='Вставити в текст'; add.onclick=()=>{ popInsertText(text.value); text.value=''; }; box.append(text,add);
  }
  const note=d.createElement('p'); note.className='pw-manual-note'; note.textContent='Є ручні зміни: поля збережуться у формі, але ручний текст автоматично не замінюється. Для вставки в нього скористайтеся режимом «Текст».'; note.hidden=!dirty; box.append(note);
  const section=d.createElement('select'), field=d.createElement('select'), host=d.createElement('div'); section.setAttribute('aria-label','Розділ документа'); field.setAttribute('aria-label','Поле документа');
  const sections=popInsertSections(); sections.forEach(s=>{ const option=d.createElement('option'); option.value=s.id; option.textContent=s.title || s.short; section.append(option); });
  const draw=()=>{ host.replaceChildren(); const s=sections.find(s=>s.id===section.value), f=s && popInsertFields(s).find(f=>f.id===field.value); if (f) popInsertField(f,host); };
  const choose=()=>{ field.replaceChildren(); const s=sections.find(s=>s.id===section.value); if (s) popInsertFields(s).forEach(f=>{ const option=d.createElement('option'); option.value=f.id; option.textContent=f.label; field.append(option); }); draw(); };
  section.onchange=choose; field.onchange=draw;
  box.append(section,field,host); d.body.append(box);
  const items=(keys || []).filter(Boolean), exact=items.map(key=>document.getElementById(key)).filter(Boolean);
  const key=items.find(key=>key.includes('.')), sid=key?.split('.')[0] || items.find(key=>sections.some(s=>s.id===key));
  if (sid && sections.some(s=>s.id===sid)) section.value=sid;
  choose();
  if (exact.length){ section.hidden=true; field.hidden=true; host.replaceChildren(); exact.forEach(source=>popInsertControl(source,host)); }
  else if (key){ const f=field.querySelector(`option[value="${key.split('.')[1]}"]`); if (f){ field.value=f.value; draw(); } }
  const rect=anchor?.getBoundingClientRect(), width=Math.min(480,w.innerWidth-16); box.style.width=width+'px';
  box.style.left=Math.max(8,Math.min(w.innerWidth-width-8,rect?.left || 8))+'px';
  box.style.top=Math.max(8,Math.min(rect?.bottom+6 || 68,w.innerHeight-Math.min(box.offsetHeight,w.innerHeight-16)-8))+'px';
  (host.querySelector('input,textarea,select,button') || box.querySelector('textarea,select,button'))?.focus({preventScroll:true});
}
function popInsertKeys(target){
  if (target.closest('.bdi:not(.bcur)')) return null;
  const diary=target.closest('[data-diary-key]'); if (diary) return DIARY_INLINE_GROUPS[diary.dataset.diaryKey];
  const attr=target.closest('[data-fld],[data-dsel],[data-an]');
  if (attr) return (attr.dataset.fld || attr.dataset.dsel || attr.dataset.an).split(' ');
  const sec=target.closest('[data-sec]'); if (sec) return [sec.dataset.sec];
  let row=target.closest('.brow,.bt2,.bt,.blines,.bdx,.bdl');
  for (let i=0; row && i<5; i++,row=row.previousElementSibling){ const hit=BMAP.find(([re])=>re.test(row.textContent.trim())); if (hit) return [hit[1].split('#')[0]]; }
  return [];
}
{ const x0=popInit; popInit=function(w){
  const result=x0.apply(this,arguments), d=w.document, bar=d.querySelector('.pw-bar');
  const add=d.createElement('button'); add.id='pwAdd'; add.type='button'; add.textContent='+ Додати'; add.setAttribute('aria-haspopup','dialog'); add.onclick=()=>popInsertOpen([],add); bar.append(add);
  d.addEventListener('selectionchange',()=>{ const tx=d.querySelector('.pw-text'), selection=w.getSelection(); if (tx && selection?.rangeCount && tx.contains(selection.getRangeAt(0).commonAncestorContainer)) POP_INSERT.range=selection.getRangeAt(0).cloneRange(); });
  d.addEventListener('keydown',e=>{
    if (e.key==='Escape' && POP_INSERT.box){ e.preventDefault(); popInsertClose(true); }
    if (POP.mode==='paper' && ['Enter',' '].includes(e.key) && e.target.closest('#pwBox [data-pop-edit]')){ e.preventDefault(); const keys=popInsertKeys(e.target); if (keys!==null) popInsertOpen(keys,e.target); }
  });
  d.getElementById('pwBox').addEventListener('click',e=>{
    if (POP.mode!=='paper') return; e.preventDefault(); e.stopImmediatePropagation();
    const keys=popInsertKeys(e.target); if (keys===null) return;
    popInsertOpen(keys,e.target);
  },true);
  return result;
}; }
{ const x0=popRender; popRender=function(){
  const w=POP.w, tx=w && !w.closed && w.document.querySelector('.pw-text');
  if (POP_INSERT.box && POP_INSERT.mode!==POP.mode) popInsertClose();
  // Не перебудовуємо contenteditable з незміненим текстом: курсор і Ctrl+Z лишаються на місці.
  if (POP.mode==='text' && tx && tx.innerHTML===$('#out').innerHTML && POP_INSERT.doc===DOC && POP_INSERT.pid===PID){ popInsertSync(); return; }
  const result=x0.apply(this,arguments); popInsertSync();
  if (w && !w.closed){
    const d=w.document, hint=d.getElementById('pwH'); if (hint) hint.textContent=POP.mode==='paper'?'клік по рядку — правка тут':'Ctrl+V або «+ Додати» в позицію курсора';
    if (POP.mode==='paper') d.querySelectorAll('#pwBox [data-diary-key],#pwBox [data-fld],#pwBox [data-dsel],#pwBox [data-an],#pwBox [data-sec]').forEach(node=>{
      if (node.closest('.bdi:not(.bcur)')) return;
      node.dataset.popEdit='1'; node.tabIndex=0; node.setAttribute('role','button'); node.setAttribute('aria-haspopup','dialog'); node.title='Додати або змінити тут';
    });
    if (POP.mode==='text' && !d.querySelector('.pw-text')){
      const tx=d.createElement('div'); tx.className='pw-text'; tx.contentEditable='true'; tx.setAttribute('role','textbox'); tx.setAttribute('aria-label','Текст документа'); tx.setAttribute('aria-multiline','true');
      tx.addEventListener('input',()=>{ POP.edit=Date.now(); const out=$('#out'); out.innerHTML=tx.innerHTML; out.dispatchEvent(new Event('input',{bubbles:true})); });
      tx.addEventListener('paste',e=>{ e.preventDefault(); d.execCommand('insertText',false,e.clipboardData.getData('text/plain')); });
      d.getElementById('pwBox').replaceChildren(tx);
    }
  }
  return result;
}; }
{ const x0=switchDoc; switchDoc=function(){ popInsertClose(); POP_INSERT.range=null; POP_INSERT.textUndo=null; return x0.apply(this,arguments); }; }
