/* 0.9.3.46 — виразні підписи для масових дій і швидке скасування. */
const DANGER_UNDO_MS = 8000;
const DANGER_CLEAR_LABEL = 'Очистити поточний документ';
const DANGER_CLEAR_TITLE = 'Очистити лише поточний документ. Дані пацієнта, призначення й журнали залишаться.';
const DANGER_NORM_LABEL = 'Норма в усіх системах огляду';
const DANGER_NEW_LABEL = 'Новий пацієнт (поточний збережено)';

function dangerLabelClearButton(btn){
  if (!btn) return;
  if (btn.dataset.arm){
    btn.setAttribute('aria-label', 'Підтвердити очищення поточного документа');
    btn.title = 'Натисніть ще раз, щоб очистити поточний документ';
    return;
  }
  if (btn.textContent.trim() !== DANGER_CLEAR_LABEL) btn.textContent = DANGER_CLEAR_LABEL;
  btn.setAttribute('aria-label', DANGER_CLEAR_LABEL);
  btn.title = DANGER_CLEAR_TITLE;
}

function dangerSyncStaticLabels(){
  const clearAll = $('#clearAll');
  if (clearAll){
    if (clearAll.dataset.dangerLabel !== '1'){
      clearAll.replaceChildren(
        h('span', {'aria-hidden':'true'}, '＋'),
        h('span', {class:'new-patient-label'}, ' Новий пацієнт'),
        h('span', {class:'hide-m'}, ' (поточний збережено)')
      );
      clearAll.dataset.dangerLabel = '1';
    }
    clearAll.setAttribute('aria-label', DANGER_NEW_LABEL);
    clearAll.title = DANGER_NEW_LABEL;
  }
  dangerLabelClearButton($('#clearDocBtn'));
  document.querySelectorAll('.more-dd .mmenu button').forEach(btn=>{
    if (/Очистити весь документ|Очистити поточний документ/.test(btn.textContent)) dangerLabelClearButton(btn);
  });
}

function dangerSyncNormLabel(){
  const btn = $('#allNorm');
  if (!btn) return;
  const diary = DOC === 'shch';
  const mobile = !!(window.matchMedia && matchMedia('(max-width:899px)').matches);
  const visible = diary ? 'Стабільно' : mobile ? 'Норма всюди' : DANGER_NORM_LABEL;
  if (btn.textContent !== visible) btn.textContent = visible;
  btn.setAttribute('aria-label', diary ? 'Позначити стан щоденника як стабільний' : DANGER_NORM_LABEL);
  btn.title = diary ? 'Типовий стабільний запис щоденника' : DANGER_NORM_LABEL;
}

function dangerShowUndo(message, returnFocus){
  const box = $('#toast');
  if (!box || !UNDO.length) return;
  clearTimeout(toast.h);
  const action = h('button', {
    type:'button',
    class:'btn primary',
    'aria-label':'Скасувати: ' + message,
    onclick:()=>{
      clearTimeout(toast.h);
      box.classList.remove('undo-toast', 'on');
      box.style.removeProperty('pointer-events');
      box.replaceChildren();
      undoLast();
      if (returnFocus && returnFocus.isConnected && typeof returnFocus.focus === 'function') returnFocus.focus();
    }
  }, 'Скасувати');
  box.replaceChildren(h('span', {}, message + ' '), action);
  box.classList.add('undo-toast', 'on');
  box.style.pointerEvents = 'auto';
  toast.h = setTimeout(()=>{
    if (!box.classList.contains('undo-toast')) return;
    box.classList.remove('undo-toast', 'on');
    box.style.removeProperty('pointer-events');
    box.replaceChildren();
    toast.h = null;
  }, DANGER_UNDO_MS);
}

/* Звичайні повідомлення не повинні залишати інтерактивний тост активним. */
{
  const toast0 = toast;
  toast = function(){
    const box = $('#toast');
    if (box){
      box.classList.remove('undo-toast');
      box.style.removeProperty('pointer-events');
    }
    return toast0.apply(this, arguments);
  };
}

/* Підпис «Норма» в 540-ui-build.js залежить від документа та ширини екрана. */
{
  const update0 = update;
  update = function(){
    const result = update0.apply(this, arguments);
    dangerSyncNormLabel();
    return result;
  };
}

/* Скасування відкривається лише після фактичного застосування масової дії. */
{
  const norm = $('#allNorm'), norm0 = norm && norm.onclick;
  if (norm && norm0) norm.onclick = function(){
    const previous = UNDO[UNDO.length - 1];
    const result = norm0.apply(this, arguments);
    if (UNDO[UNDO.length - 1] !== previous){
      dangerShowUndo(DOC === 'shch' ? 'Стан щоденника змінено' : 'Норму виставлено в усіх системах огляду', this);
    }
    return result;
  };
}
{
  const clear0 = clearDoc;
  clearDoc = function(btn){
    const confirmed = !!(btn && btn.dataset && btn.dataset.arm);
    const undoBefore = UNDO.slice(), redoBefore = REDO.slice();
    const previous = UNDO[UNDO.length - 1];
    const result = clear0.apply(this, arguments);
    if (!confirmed && btn && btn.dataset.arm){
      UNDO.splice(0, UNDO.length, ...undoBefore);
      REDO.splice(0, REDO.length, ...redoBefore);
      undoBtn();
    }
    if (btn){
      dangerLabelClearButton(btn);
      if (btn.dataset.arm){
        btn.setAttribute('aria-label', 'Підтвердити очищення поточного документа');
        btn.title = 'Натисніть ще раз, щоб очистити поточний документ';
        setTimeout(()=>dangerLabelClearButton(btn), 3600);
      }
    }
    if (confirmed && UNDO[UNDO.length - 1] !== previous){
      const summary = btn && btn.closest('details') && btn.closest('details').querySelector('summary');
      dangerShowUndo('Документ очищено', summary || $('#docMore'));
    }
    return result;
  };
}

dangerSyncStaticLabels();
dangerSyncNormLabel();
