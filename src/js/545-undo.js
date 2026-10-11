/* ===== Скасування дій: ↶ і Ctrl+Z (до 10 кроків) =====
   Перед діями, що переписують багато полів (вибір хвороби, «Норма», очищення, заміна схеми), зберігається знімок форми. */
const UNDO = [], UNDO_MAX = 10; let UNDO_DEPTH = 0;
function undoPush(label){
  try{ UNDO.push({label, s:JSON.parse(JSON.stringify(snap())), rxAuto:RX_AUTO, rxVar:RX_VAR, pid:PID}); }catch(e){ return; }
  if (UNDO.length > UNDO_MAX) UNDO.shift();
  undoBtn();
}
function undoable(label, fn){
  return function(...a){
    if (UNDO_DEPTH === 0 && !RESTORING) undoPush(typeof label === 'function' ? label(...a) : label);
    UNDO_DEPTH++; try{ return fn.apply(this, a); } finally { UNDO_DEPTH--; }
  };
}
function undoLast(){
  const u = UNDO.pop(); if (!u){ toast('Немає дій для скасування'); return; }
  if (u.pid !== PID){ toast('Скасування недоступне: відкрито іншого пацієнта'); UNDO.length = 0; undoBtn(); return; }
  restore(u.s); RX_AUTO = u.rxAuto; RX_VAR = u.rxVar; rxVarRedraw(); undoBtn();
  toast('Скасовано: ' + u.label, 2500);
}
function undoBtn(){
  const b = document.getElementById('undoBtn'); if (!b) return;
  const u = UNDO[UNDO.length - 1];
  b.disabled = !u; b.title = u ? 'Скасувати: ' + u.label + ' (Ctrl+Z)' : 'Немає дій для скасування';
}
applyPreset = undoable(p=>'вибір хвороби «' + (p && p.name || '') + '»', applyPreset);
applyNorm = undoable(s=>'«Норма» у розділі «' + (s && (s.short || s.title) || '') + '»', applyNorm);
clearSection = undoable(s=>'очищення розділу «' + (s && (s.short || s.title) || '') + '»', clearSection);
clearDoc = undoable(btn=>'очищення документа', clearDoc);
rxReplace = undoable((rows, name)=>'схема призначень «' + name + '»', rxReplace);
rxAddSet = undoable('додавання набору призначень', rxAddSet);
{ const n = $('#allNorm'), o = n.onclick; n.onclick = undoable(()=>DOC === 'shch' ? '«Стабільно»' : '«Норма всюди»', o); }
{ const db = document.querySelector('.docbar');
  if (db){ db.append(h('button', {type:'button', class:'btn', id:'undoBtn', disabled:'', 'aria-label':'Скасувати останню дію', onclick:undoLast}, '↶', h('span', {class:'hide-m'}, ' Скасувати'))); undoBtn(); } }
// новий пацієнт або відкриття іншого — історія скасувань не переноситься
['newPatient','openPatient'].forEach(nm=>{ const f = window[nm]; if (typeof f === 'function') window[nm] = function(...a){ const r = f.apply(this, a); UNDO.length = 0; undoBtn(); return r; }; });
$('#clearAll').onclick = newPatient;
document.addEventListener('keydown', e=>{
  if ((e.ctrlKey || e.metaKey) && !e.shiftKey && (e.key === 'z' || e.key === 'я' || e.code === 'KeyZ')){
    const t = e.target; if (t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName))) return;   // у полі — звичайне скасування браузера
    if (UNDO.length){ e.preventDefault(); undoLast(); }
  }
});
