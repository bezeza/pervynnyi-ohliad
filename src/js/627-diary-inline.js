/* 0.9.3.40 — поточний щоденник: поле відкривається біля рядка бланка. */
const DIARY_INLINE = {box:null, key:null, undo:null, frame:0, manual:false};
const DIARY_INLINE_GROUPS = {
  date:['meta_dt'], temp:['d_obj.t'], pulse:['d_obj.chss'], pressure:['d_obj.ad'], breath:['d_obj.chd'],
  complaints:['d_main.sk','d_main.zal','d_main.skx','d_main.son'],
  general:['d_main.stan','d_main.dyn','d_main.svid'], skin:['d_obj.shk'], nodes:['d_obj.lv'], edema:['d_obj.nab'],
  nose:['d_obj.nis'], percussion:['d_obj.perk'], lungs:['d_obj.dyh','d_obj.chd','d_obj.o2'],
  heart:['d_obj.serce'], tongue:['d_obj.yaz'], abdomen:['d_obj.zhyv'], chest:['d_obj.grk'], liver:['d_obj.pech'],
  stool:['d_obj.fiz'], urinary:['d_obj.pst','d_obj.sech'], treatment:['d_lik.per','d_lik.obs','d_lik.kor','d_lik.osn','d_lik.plan'], doctor:['meta_doc']
};
const DIARY_INLINE_OWN = new Map();
// Додаткові відповіді — звичайні поля форми: наявні snap/restore/diaryFields бачать їх без зміни формату сховища.
DSEC.forEach(sid=>SECTIONS.find(s=>s.id===sid).fields.forEach(f=>{
  if (f.type !== 'sel') return;
  const own = h('textarea', {id:`${sid}_${f.id}_own`, rows:'2', hidden:'', 'aria-label':'Своє формулювання: ' + f.label,
    placeholder:'Своїми словами', oninput:()=>{ if (own.value.trim()) f.el.value = ''; mark(f.el,f); if (f.seg) f.seg(); update(); }});
  f.wrapEl.append(own); DIARY_INLINE_OWN.set(f, own);
  f.el.addEventListener('change', ()=>{ if (!RESTORING){ own.value = ''; own.hidden = true; } }, true);
}));
// Перший restoreLast міг виконатися до підключення цього модуля.
if (PID){ try{ const fields=loadStore()[PID]?.snap?.f || {}; DIARY_INLINE_OWN.forEach(own=>{ own.value=fields[own.id] || ''; }); }catch(e){} }
{ const x0 = val; val = function(f){ const own=DIARY_INLINE_OWN.get(f); return own && own.value.trim() ? own.value.trim() : x0.apply(this,arguments); }; }
{ const x0 = bDv; bDv = function(fields,key){ const own=fields[key.replace('.','_') + '_own']; return own && own.trim() ? g(own.trim()) : x0.apply(this,arguments); }; }
{ const x0 = dHasData; dHasData = function(f){ const own=DIARY_INLINE_OWN.get(f); return !!(own && own.value.trim()) || x0.apply(this,arguments); }; }
{ const x0 = entryFieldState; entryFieldState = function(f){ const own=DIARY_INLINE_OWN.get(f); return own && own.value.trim() ? 'filled' : x0.apply(this,arguments); }; }
function diaryInlineClearOwn(section){
  DIARY_INLINE_OWN.forEach((own,f)=>{ if (!section || section.fields.includes(f)){ own.value=''; own.hidden=true; } });
}
{ const x0=clearAll; clearAll=function(){ diaryInlineClose(); diaryInlineClearOwn(); return x0.apply(this,arguments); }; }
{ const x0=diaryReset; diaryReset=function(){ diaryInlineClose(); diaryInlineClearOwn(); return x0.apply(this,arguments); }; }
{ const x0=clearSection; clearSection=undoable(s=>'очищення розділу «'+s.title+'»',function(s){ diaryInlineClearOwn(s); return x0.apply(this,arguments); }); }
{ const x0=applyNorm; applyNorm=undoable(s=>'«Норма» у розділі «'+s.title+'»',function(s){ diaryInlineClearOwn(s); return x0.apply(this,arguments); }); }
function diaryInlineMark(node,key){
  if (!node) return; node.dataset.diaryKey=key; node.setAttribute('role','button'); node.tabIndex=0;
  node.title='Редагувати цей пункт тут'; node.setAttribute('aria-haspopup','dialog');
  const empty=node.matches('.bf.empty') ? node : node.querySelector('.bf.empty');
  if (empty) empty.dataset.diaryHint=['date','temp','pulse','pressure','breath'].includes(key) ? '+ вписати' : '+ вибрати';
}
{ const x0=bDiaryEntry; bDiaryEntry=function(e){
  const root=x0.apply(this,arguments);
  // Записи старого формату не перебудовуємо; нові впізнаємо за полями власних відповідей, навіть порожніми.
  if (!e.cur && !Object.keys(e.f).some(key=>key.endsWith('_own'))) return root;
  const read=key=>bDv(e.f,key), own=key=>e.f[key.replace('.','_')+'_own'] || '';
  const rows=[...root.querySelectorAll('.bdr>.brow')];
  const map=[[/^Скарги/,'complaints'],[/^Об’єктивно|^Свідомість/,'general'],[/^Реакція/,'skin'],[/^Лімфатичні/,'nodes'],[/^Набряки/,'edema'],[/^Дихання через/,'nose'],[/^Перкуторно/,'percussion'],[/^Аускультативно/,'lungs'],[/^Діяльність серця|^Тони/,'heart'],[/^Язик/,'tongue'],[/^Живіт/,'abdomen'],[/^рівномірно/,'chest'],[/^Печінка/,'liver'],[/^Випорожнення/,'stool'],[/^С-м Пастернацького/,'urinary'],[/^Лікування/,'treatment'],[/^Лікар/,'doctor']];
  rows.forEach(row=>{ const item=map.find(([re])=>re.test(row.textContent.trim())); if (item && e.cur) diaryInlineMark(row,item[1]); });
  const general=rows.find(row=>/^Об’єктивно/.test(row.textContent.trim()));
  if (general){
    // Вибрана свідомість має відображатися без зашитого «не порушена» в тому ж рядку.
    general.replaceChildren(h('span',{class:'bl'},'Об’єктивно: загальний стан '),bFill([read('d_main.stan'),read('d_main.dyn'),read('d_main.svid')].filter(Boolean).join(', '),true));
    rows.filter(row=>/^Свідомість/.test(row.textContent.trim())).forEach(row=>row.remove());
  }
  const abdomen=rows.find(row=>/^Живіт/.test(row.textContent.trim()));
  if (abdomen) abdomen.replaceChildren(h('span',{class:'bl'},'Живіт '),bFill(read('d_obj.zhyv'),false,true));
  const skin=rows.find(row=>/^Реакція/.test(row.textContent.trim()));
  if (skin) skin.replaceChildren(h('span',{class:'bl'},'Шкіра '),bFill(read('d_obj.shk').replace(/^Шкірні покриви /,''),false,true));
  const chest=rows.find(row=>/^рівномірно/.test(row.textContent.trim()));
  if (chest) chest.replaceChildren(h('span',{class:'bl'},'Грудна клітка '),bFill(read('d_obj.grk'),false,true));
  const complaints=rows.find(row=>/^Скарги/.test(row.textContent.trim()));
  if (complaints && (own('d_main.sk') || own('d_main.son'))){
    complaints.replaceChildren(h('span',{class:'bl'},'Скарги: '),bFill([read('d_main.sk'),e.f.d_main_zal || e.f.d_main_skx,read('d_main.son')].filter(Boolean).join('; '),true,true));
  }
  const stool=rows.find(row=>/^Випорожнення/.test(row.textContent.trim()));
  if (stool) stool.replaceChildren(h('span',{class:'bl'},'Фізіологічні відправлення: '),bFill(read('d_obj.fiz'),false,true));
  const treatment=root.querySelector('.bdr>.blines');
  if (treatment){
    const content=[e.rx || '',read('d_lik.per'),e.f.d_lik_obs || '',e.f.d_lik_kor ? 'Корекція терапії: '+e.f.d_lik_kor : '',e.osn || e.f.d_lik_osn || '',read('d_lik.plan')].filter(Boolean).map(end).join(' ');
    treatment.textContent=content; if (e.cur) diaryInlineMark(treatment,'treatment');
  }
  const left=root.querySelector('.bdl'); if (left && e.cur){
    diaryInlineMark(left.querySelector(':scope>.bf'),'date');
    left.querySelectorAll('[data-fld]').forEach(el=>{
      const id=el.dataset.fld.split(' ')[0], key=id.includes('_ad_')?'pressure':id.includes('_chss_')?'pulse':id.includes('_chd_')?'breath':'temp'; diaryInlineMark(el,key);
    });
  }
  root.querySelectorAll('[data-diary-key]').forEach(el=>diaryInlineMark(el,el.dataset.diaryKey));
  return root;
}; }
function diaryInlineAnchor(key){ return document.querySelector(`#paper .bdi.bcur [data-diary-key="${key}"]`); }
function diaryInlineClose(focus){
  const key=DIARY_INLINE.key; if (DIARY_INLINE.box) DIARY_INLINE.box.remove();
  DIARY_INLINE.box=null; DIARY_INLINE.key=null; DIARY_INLINE.undo=null;
  document.querySelectorAll('#paper .diary-edit-active').forEach(el=>el.classList.remove('diary-edit-active'));
  if (focus){ const anchor=diaryInlineAnchor(key); if (anchor) anchor.focus({preventScroll:true}); }
}
function diaryInlinePosition(){
  const box=DIARY_INLINE.box, anchor=diaryInlineAnchor(DIARY_INLINE.key); if (!box) return;
  if (!anchor || DOC!=='shch' || !PAPER){ diaryInlineClose(); return; }
  const rect=anchor.getBoundingClientRect(), viewport=window.visualViewport;
  const bottom=viewport ? viewport.offsetTop+viewport.height : window.innerHeight;
  const width=Math.min(560,window.innerWidth-16); box.style.width=width+'px';
  box.style.left=Math.max(8,Math.min(window.innerWidth-width-8,rect.left))+'px';
  const height=box.getBoundingClientRect().height;
  const top=rect.bottom+6+height<=bottom-8 ? rect.bottom+6 : rect.top-height-6>=8 ? rect.top-height-6 : Math.max(8,bottom-height-8);
  box.style.top=top+'px';
}
function diaryInlineChange(fn){
  if (!DIARY_INLINE.undo){ undoPush('правка пункту щоденника'); DIARY_INLINE.undo=UNDO[UNDO.length-1]; }
  fn(); renderPaper(); diaryInlineSync();
}
function diaryInlineControl(source){
  const input=source.tagName==='TEXTAREA' ? h('textarea',{rows:'3'}) : h('input',{type:source.type || 'text',inputmode:source.inputMode || null,placeholder:source.placeholder || ''});
  input.value=source.value; input.dataset.diarySource=source.id;
  input.setAttribute('aria-label',source.getAttribute('aria-label') || source.closest('.f')?.querySelector('label,.lbl')?.textContent || 'Значення');
  input.addEventListener('input',()=>diaryInlineChange(()=>{ source.value=input.value; source.dispatchEvent(new Event(source.tagName==='SELECT'?'change':'input',{bubbles:true})); }));
  return input;
}
function diaryInlineComplaints(host){
  const search=h('input',{type:'search',placeholder:'Знайти скаргу','aria-label':'Пошук скарги'}), list=h('div',{class:'chips diary-complaints'});
  const draw=()=>{
    const f=F('d_main.zal'), current=remItems(f.el.value), q=search.value.trim().toLowerCase(), source=F('skarhy.c');
    const all=[...new Set([...current,...source.opts.map(o=>O(o).t)])];
    list.replaceChildren();
    all.filter(t=>!q || t.toLowerCase().includes(q)).slice(0,24).forEach(text=>list.append(h('button',{type:'button',class:'chip','aria-pressed':current.includes(text)?'true':'false',onclick:()=>diaryInlineChange(()=>{
      let values=remItems(f.el.value); values=values.includes(text)?values.filter(x=>x!==text):[...values,text];
      f.el.value=values.join(values.some(x=>x.includes(','))?'; ':', '); f.el.dispatchEvent(new Event('input',{bubbles:true})); draw();
    })},g(text))));
    if (!list.children.length) list.append(h('span',{class:'chips-hint'},'Не знайдено — впишіть своїми словами нижче.'));
  };
  search.addEventListener('input',draw); host.append(search,list); draw();
}
function diaryInlineField(key){
  const f=key.includes('.')?F(key):null, section=h('div',{class:'diary-editor-field'});
  const label=f ? f.label : key==='meta_dt'?'Дата й час запису':'Лікар';
  section.append(h('div',{class:'lbl'},label));
  if (!f){ const source=document.getElementById(key); if (source) section.append(diaryInlineControl(source)); return section; }
  if (f.type==='sel'){
    const choices=h('div',{class:'chips',role:'group','aria-label':label});
    [['','Не вказано'],...f.opts.map((o,i)=>[String(i),g(O(o).l)])].forEach(([value,text])=>choices.append(h('button',{type:'button',class:'chip', 'data-diary-select':key,'data-value':value,onclick:()=>diaryInlineChange(()=>{
      f.el.value=value; f.el.dispatchEvent(new Event('change',{bubbles:true}));
    })},text)));
    section.append(choices);
    const own=DIARY_INLINE_OWN.get(f);
    if (own){
      const area=h('div',{class:'diary-own'}), input=diaryInlineControl(own);
      area.hidden=!own.value.trim(); area.append(input);
      const button=h('button',{type:'button',class:'more',onclick:()=>{ area.hidden=!area.hidden; button.setAttribute('aria-expanded',area.hidden?'false':'true'); if (!area.hidden) input.focus(); diaryInlinePosition(); }},'Своє…');
      button.setAttribute('aria-expanded',area.hidden?'false':'true'); section.append(button,area);
    }
  } else if (f.type==='num'){
    const row=h('div',{class:'nums'});
    f.inputs.forEach((source,i)=>row.append(h('span',{class:'diary-number'},diaryInlineControl(source),h('span',{class:'u'},f.parts[i].u)))); section.append(row);
  } else if (f.el){
    if (key==='d_main.zal') diaryInlineComplaints(section);
    section.append(diaryInlineControl(f.el));
  }
  return section;
}
function diaryInlineSync(){
  diaryInlineModeSync();
  DIARY_INLINE_OWN.forEach(own=>{ own.hidden=!own.value.trim(); });
  const box=DIARY_INLINE.box; if (!box) return;
  box.querySelectorAll('[data-diary-select]').forEach(button=>{
    const f=F(button.dataset.diarySelect), own=DIARY_INLINE_OWN.get(f);
    button.setAttribute('aria-pressed',(!own?.value.trim() && f.el.value===button.dataset.value)?'true':'false');
  });
  box.querySelectorAll('[data-diary-source]').forEach(input=>{
    const source=document.getElementById(input.dataset.diarySource);
    if (source && document.activeElement!==input) input.value=source.value;
  });
  const undo=box.querySelector('.diary-undo'); if (undo) undo.disabled=!DIARY_INLINE.undo || UNDO[UNDO.length-1]!==DIARY_INLINE.undo;
  document.querySelectorAll('#paper .bcur [data-diary-key]').forEach(el=>el.classList.toggle('diary-edit-active',el.dataset.diaryKey===DIARY_INLINE.key));
  diaryInlinePosition();
}
function diaryInlineNavigate(direction){
  const keys=[...new Set([...document.querySelectorAll('#paper .bdi.bcur [data-diary-key]')].map(el=>el.dataset.diaryKey))];
  const index=keys.indexOf(DIARY_INLINE.key), next=keys[index+direction];
  if (next) diaryInlineOpen(next); else diaryInlineClose(true);
}
function diaryInlineOpen(key){
  if (DOC!=='shch' || !PAPER || !diaryInlineAnchor(key)) return;
  if (DIARY_INLINE.box && DIARY_INLINE.key===key) return;
  qeClose(); diaryInlineClose(); DIARY_INLINE.key=key;
  const fields=DIARY_INLINE_GROUPS[key]; if (!fields) return;
  const title='Правка пункту щоденника';
  const box=h('section',{class:'diary-inline-editor',role:'dialog','aria-label':title},
    h('div',{class:'diary-editor-head'},h('b',{},title),h('button',{type:'button',class:'btn','aria-label':'Закрити редактор',onclick:()=>diaryInlineClose(true)},'✕')),
    h('div',{class:'diary-editor-body'},...fields.map(diaryInlineField)),
    h('div',{class:'diary-editor-actions'},
      h('button',{type:'button',class:'btn',onclick:()=>diaryInlineNavigate(-1)},'‹ Попередній'),
      h('button',{type:'button',class:'btn diary-undo',disabled:'',onclick:()=>{ if (UNDO[UNDO.length-1]!==DIARY_INLINE.undo) return; const current=DIARY_INLINE.key; diaryInlineClose(); undoLast(); renderPaper(); diaryInlineOpen(current); }},'Скасувати зміну'),
      h('button',{type:'button',class:'btn primary',onclick:()=>diaryInlineNavigate(1)},'Далі ›')));
  DIARY_INLINE.box=box; document.body.append(box); diaryInlineSync();
  box.addEventListener('keydown',e=>{
    if (e.key==='Escape'){ e.preventDefault(); e.stopPropagation(); diaryInlineClose(true); }
    else if (e.key==='Enter' && e.target.tagName==='INPUT' && !['search','date','datetime-local'].includes(e.target.type)){ e.preventDefault(); diaryInlineNavigate(1); }
    else if (e.key==='Tab' && e.target.matches('input:not([type=search]),textarea')){
      const inputs=[...box.querySelectorAll('input:not([type=search]),textarea')].filter(input=>!input.closest('[hidden]'));
      if ((!e.shiftKey && e.target===inputs[inputs.length-1]) || (e.shiftKey && e.target===inputs[0])){ e.preventDefault(); diaryInlineNavigate(e.shiftKey?-1:1); }
    }
  });
  const first=box.querySelector('input:not([type=search]),textarea:not([hidden]),button[data-diary-select]');
  if (first && !first.closest('[hidden]')) first.focus({preventScroll:true});
}
document.addEventListener('click',e=>{
  const target=e.target.closest && e.target.closest('#paper .bdi.bcur [data-diary-key]');
  if (target){ e.preventDefault(); e.stopImmediatePropagation(); diaryInlineOpen(target.dataset.diaryKey); }
},true);
document.addEventListener('keydown',e=>{
  const target=e.target.closest && e.target.closest('#paper .bdi.bcur [data-diary-key]');
  if (target && (e.key==='Enter' || e.key===' ')){ e.preventDefault(); diaryInlineOpen(target.dataset.diaryKey); }
});
document.addEventListener('pointerdown',e=>{
  if (DIARY_INLINE.box && !DIARY_INLINE.box.contains(e.target) && !e.target.closest('#paper .bcur [data-diary-key]')) diaryInlineClose();
},true);
// Старий обробник data-dsel зареєстрований раніше; спрямовуємо його в той самий редактор.
{ const x0=qeOpen; qeOpen=function(f,sid,anchor){
  const target=anchor?.closest('#paper .bdi.bcur [data-diary-key]');
  if (target) return diaryInlineOpen(target.dataset.diaryKey);
  return x0.apply(this,arguments);
}; }
{ const x0=renderPaper; renderPaper=function(){ const r=x0.apply(this,arguments); diaryInlineSync(); return r; }; }
{ const x0=update; update=function(){ const r=x0.apply(this,arguments); diaryInlineSync(); return r; }; }
{ const x0=switchDoc; switchDoc=function(next){ if (next!==DOC) DIARY_INLINE.manual=false; diaryInlineClose(); return x0.apply(this,arguments); }; }
{ const x0=restore; restore=function(){ DIARY_INLINE.manual=false; diaryInlineClose(); return x0.apply(this,arguments); }; }
window.addEventListener('scroll',()=>{ if (!DIARY_INLINE.box || DIARY_INLINE.frame) return; DIARY_INLINE.frame=requestAnimationFrame(()=>{ DIARY_INLINE.frame=0; diaryInlinePosition(); }); },true);
window.addEventListener('resize',diaryInlinePosition);
if (window.visualViewport) window.visualViewport.addEventListener('resize',diaryInlinePosition);
const DIARY_MODE_BUTTON=h('button',{type:'button',class:'btn',id:'diaryManualMode','aria-pressed':'false',onclick:()=>{
  diaryInlineClose();qeClose();DIARY_INLINE.manual=!DIARY_INLINE.manual;
  SHELL.setOV(DIARY_INLINE.manual?'text':'paper');diaryInlineModeSync();
  if (DIARY_INLINE.manual) document.getElementById('out').focus({preventScroll:true});
}},'Правити текст вручну');
const DIARY_MODE_NOTE=h('span',{});
const DIARY_MODE_LINE=h('div',{class:'diary-edit-controls'},DIARY_MODE_NOTE,DIARY_MODE_BUTTON);
document.getElementById('out').before(DIARY_MODE_LINE);
function diaryInlineModeSync(){
  DIARY_MODE_LINE.hidden=DOC!=='shch';
  DIARY_MODE_BUTTON.textContent=DIARY_INLINE.manual?'До бланка':'Правити текст вручну';
  DIARY_MODE_BUTTON.setAttribute('aria-pressed',DIARY_INLINE.manual?'true':'false');
  DIARY_MODE_NOTE.textContent=DIARY_INLINE.manual?'Вільне редагування тексту. Для полів поверніться до бланка.':'Натисніть рядок на бланку — вибір відкриється поруч.';
}
document.getElementById('out').addEventListener('click',e=>{
  if (DOC==='shch' && DIARY_INLINE.manual) e.stopImmediatePropagation();
},true);
update();
