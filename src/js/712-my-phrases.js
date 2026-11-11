/* ===== 0.9.3.122 · «Мої фрази» (задача 22) =====
   Короткі фрази лікаря: назва + текст. Вставка в поточне поле або в курсор #out.
   Сховище — лише localStorage, ключ po.myphrases, try/catch. Експорт/імпорт JSON.
   Пакети фраз (po.packs) — це чужі шаблони з підписом автора, не список для курсора.
   «Мої кнопки» прив’язані до одного розділу і живуть у po.custom. Тут окремий ключ.
   Клавіші Alt+Shift+1…9. Alt+1…9 уже відкривають розділи і в браузері конфліктують.
   У сховище потрапляє лише те, що лікар вписав у цьому діалозі.
*/
const MP_KEY = 'po.myphrases';
const MP_MAX = 200;
let mpLast = null;

function mpLoad(){
  try {
    const raw = localStorage.getItem(MP_KEY);
    const a = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(a)) return [];
    const out = [];
    for (const x of a){
      if (!x || typeof x.name !== 'string' || typeof x.text !== 'string') continue;
      const name = x.name.trim().slice(0, 80), text = x.text.trim().slice(0, 2000);
      if (!name || !text) continue;
      out.push({name, text});
      if (out.length >= MP_MAX) break;
    }
    return out;
  } catch (e) { return []; }
}
function mpSave(list){
  try {
    localStorage.setItem(MP_KEY, JSON.stringify(list.map(p => ({name: p.name, text: p.text}))));
    return true;
  } catch (e) {
    if (typeof toast === 'function') toast('Не вдалося зберегти «Мої фрази»');
    return false;
  }
}
function mpIsField(el){
  return !!(el && el.matches && (el.tagName === 'TEXTAREA' || (el.tagName === 'INPUT' && (el.type === 'text' || el.type === ''))));
}
function mpInsertOut(text){
  const out = document.getElementById('out'); if (!out) return false;
  const phrase = typeof g === 'function' ? g(text) : text;
  out.focus();
  const sel = getSelection();
  let placed = false;
  if (sel && sel.rangeCount && out.contains(sel.anchorNode)){
    const r = sel.getRangeAt(0);
    r.deleteContents();
    const n = document.createTextNode(phrase);
    r.insertNode(n);
    r.setStartAfter(n); r.collapse(true);
    sel.removeAllRanges(); sel.addRange(r);
    placed = true;
  }
  if (!placed){
    let ok = false;
    try { ok = document.execCommand('insertText', false, phrase); } catch (e) {}
    if (!ok) out.append(document.createTextNode(phrase));
  }
  out.dispatchEvent(new Event('input', {bubbles: true}));
  return true;
}
function mpInsertField(el, text){
  const a = el.selectionStart, b = el.selectionEnd;
  if (a == null) el.value = (el.value ? el.value.replace(/\s*$/, ' ') : '') + text;
  else el.setRangeText(text, a, b, 'end');
  el.dispatchEvent(new Event('input', {bubbles: true}));
  el.focus();
  return true;
}
function mpInsert(text){
  const phrase = String(text || '');
  if (!phrase) return false;
  const ae = document.activeElement;
  if (mpIsField(ae)) return mpInsertField(ae, phrase);
  const sel = getSelection();
  const inOut = ae && ae.id === 'out' || (sel && sel.rangeCount && sel.anchorNode && document.getElementById('out') && document.getElementById('out').contains(sel.anchorNode));
  if (inOut) return mpInsertOut(phrase);
  if (mpIsField(mpLast)) return mpInsertField(mpLast, phrase);
  if (mpLast && mpLast.id === 'out') return mpInsertOut(phrase);
  if (typeof toast === 'function') toast('Поставте курсор у поле або в текст документа');
  return false;
}
function mpImportObj(o){
  if (!o || o.type !== 'po-my-phrases' || !Array.isArray(o.phrases)) return {ok: false, n: 0};
  const cur = mpLoad();
  let n = 0;
  for (const p of o.phrases){
    if (!p || typeof p.name !== 'string' || typeof p.text !== 'string') continue;
    const name = p.name.trim().slice(0, 80), text = p.text.trim().slice(0, 2000);
    if (!name || !text || cur.length >= MP_MAX) continue;
    if (cur.some(x => x.name === name && x.text === text)) continue;
    cur.push({name, text}); n++;
  }
  if (!mpSave(cur)) return {ok: false, n: 0};
  return {ok: true, n};
}
function mpExport(){
  const phrases = mpLoad().map(p => ({name: p.name, text: p.text}));
  downloadJSON({type: 'po-my-phrases', phrases}, 'moi-frazy.json');
}

let mpDlg = null;
function mpRender(box, list){
  box.innerHTML = '';
  if (!list.length){ box.append(h('p', {class: 'chips-hint'}, 'Немає збережених фраз')); return; }
  list.forEach((p, i) => {
    const del = h('button', {type: 'button', class: 'more', title: 'Видалити'}, 'Видалити');
    del.addEventListener('click', () => {
      if (!del.dataset.arm){ del.dataset.arm = '1'; del.textContent = 'Точно?'; setTimeout(() => { delete del.dataset.arm; del.textContent = 'Видалити'; }, 3000); return; }
      const next = mpLoad().filter((x, k) => k !== i);
      mpSave(next); mpRender(box, next);
    });
    const ins = h('button', {type: 'button', class: 'btn', onclick: () => { mpInsert(p.text); if (mpDlg) mpDlg.remove(); mpDlg = null; }}, 'Вставити');
    const key = i < 9 ? h('span', {class: 'mp-key'}, 'Alt+Shift+' + (i + 1)) : '';
    box.append(h('div', {class: 'mp-row'}, h('span', {class: 'mp-name', title: p.text}, p.name), key, ins, del));
  });
}
function mpOpen(){
  if (mpDlg){ mpDlg.remove(); mpDlg = null; }
  const listBox = h('div', {class: 'mp-list'});
  const name = h('input', {type: 'text', 'aria-label': 'Назва', placeholder: 'Назва', maxlength: '80'});
  const text = h('textarea', {rows: 3, 'aria-label': 'Текст фрази', placeholder: 'Текст фрази', maxlength: '2000'});
  const file = h('input', {type: 'file', accept: 'application/json,.json', hidden: ''});
  file.addEventListener('change', () => {
    const f = file.files && file.files[0]; if (!f) return;
    const rd = new FileReader();
    rd.onload = () => {
      let o = null; try { o = JSON.parse(rd.result); } catch (e) {}
      const r = mpImportObj(o);
      if (!r.ok){ toast('Файл не є списком «Мої фрази»'); return; }
      toast('Імпортовано фраз: ' + r.n);
      mpRender(listBox, mpLoad());
    };
    rd.readAsText(f);
    file.value = '';
  });
  const save = () => {
    const nm = name.value.trim(), tx = text.value.trim();
    if (!nm || !tx){ toast('Впишіть назву і текст'); return; }
    const list = mpLoad();
    if (list.length >= MP_MAX){ toast('Вже ' + MP_MAX + ' фраз — видаліть зайву'); return; }
    list.push({name: nm.slice(0, 80), text: tx.slice(0, 2000)});
    if (!mpSave(list)) return;
    name.value = ''; text.value = '';
    mpRender(listBox, list);
    toast('Фразу збережено');
  };
  mpDlg = h('div', {class: 'navsheet packsheet mp-dlg', role: 'dialog', 'aria-modal': 'true', 'aria-label': 'Мої фрази'},
    h('div', {class: 'nvbox'},
      h('div', {class: 'nshead'}, h('b', {}, 'Мої фрази'), h('button', {type: 'button', class: 'btn', onclick: () => { mpDlg.remove(); mpDlg = null; }}, 'Закрити')),
      h('p', {class: 'chips-hint'}, 'Alt+Shift+1…9 вставляє перші дев’ять. Сюди потрапляє лише те, що ви впишете, не дані пацієнта.'),
      listBox,
      h('div', {class: 'wgrid'}, h('label', {class: 'wl'}, 'Назва', name), h('label', {class: 'wl'}, 'Текст фрази', text)),
      h('div', {class: 'acts2', style: 'margin-top:8px'},
        h('button', {type: 'button', class: 'btn primary', onclick: save}, 'Зберегти'),
        h('button', {type: 'button', class: 'btn', onclick: mpExport}, 'Експорт JSON'),
        h('button', {type: 'button', class: 'btn', onclick: () => file.click()}, 'Імпорт JSON'),
        file)));
  document.body.append(mpDlg);
  mpRender(listBox, mpLoad());
  name.focus();
}
function mpMenus(){
  document.querySelectorAll('#panels .ph .acts2').forEach(a => {
    const menu = a.querySelector('.mmenu'); if (!menu || menu.querySelector('.mp-item')) return;
    const dd = a.querySelector('details.more-dd');
    const b = h('button', {type: 'button', class: 'more mp-item', role: 'menuitem'}, 'Мої фрази');
    b.addEventListener('click', () => { if (dd) dd.open = false; mpOpen(); });
    menu.append(b);
  });
}
document.addEventListener('focusin', e => {
  const t = e.target;
  if (t && (t.id === 'out' || mpIsField(t))) mpLast = t;
}, true);
document.addEventListener('keydown', e => {
  if (!e.altKey || !e.shiftKey || e.ctrlKey || e.metaKey || !/^Digit[1-9]$/.test(e.code)) return;
  if (e.target && e.target.closest && e.target.closest('.mp-dlg')) return;
  const list = mpLoad();
  const i = +e.code.slice(5) - 1;
  if (!list[i]) return;
  e.preventDefault();
  mpInsert(list[i].text);
}, true);
mpMenus();
