/* ===== Зручність 2 (0.9.1): швидкість як у Skiagrama, пункти рецензії інтерфейсу, налаштування блоками, «?» біля розділу ===== */
const lsGet = (k, d) => { try{ const v = localStorage.getItem(k); return v == null ? d : v; }catch(e){ return d; } };
const lsSet = (k, v) => { try{ localStorage.setItem(k, v); }catch(e){} };

/* ---------- 1. Скорочення «.слово» + пробіл → фраза; пропуски «__» з переходом по Tab ---------- */
const ABBR_DEF = {
  'бо':'без особливостей',
  'взд':'дихання везикулярне, хрипів немає',
  'тсз':'тони серця ясні, ритм правильний',
  'жмн':'живіт м’який, неболючий при пальпації',
  'бд':'Стан без суттєвої динаміки.',
  'ад':'АТ __/__ мм рт. ст., ЧСС __ уд./хв'
};
let ABBR = ABBR_DEF; try{ const a = JSON.parse(lsGet('po.abbr', 'null')); if (a && typeof a === 'object') ABBR = a; }catch(e){}
const saveAbbr = () => lsSet('po.abbr', JSON.stringify(ABBR));
const isTextT = t => t && (t.id === 'out' || t.tagName === 'TEXTAREA' || (t.tagName === 'INPUT' && t.type === 'text'));
function abbrBefore(text){ const m = /(^|[\s(«"])\.([\p{L}\d-]{1,20})$/u.exec(text); if (!m) return null; const k = m[2].toLowerCase(); const ph = ABBR[k]; return ph ? {k, ph, len:k.length + 1} : null; }
function ceTextNodes(root){ const w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT); const a = []; let n; while ((n = w.nextNode())) a.push(n); return a; }
function ceCaret(root){ const s = getSelection(); if (!s.rangeCount) return 0; const r = s.getRangeAt(0); const pre = document.createRange(); pre.selectNodeContents(root); pre.setEnd(r.endContainer, r.endOffset); return pre.toString().length; }
function ceSelectGap(root, from){
  const nodes = ceTextNodes(root);
  const find = start => { let off = 0; for (const n of nodes){ const re = /_{2,}/g; re.lastIndex = Math.max(0, start - off); const m = re.exec(n.data);
      if (m){ const r = document.createRange(); r.setStart(n, m.index); r.setEnd(n, m.index + m[0].length); const s = getSelection(); s.removeAllRanges(); s.addRange(r); return true; } off += n.data.length; } return false; };
  return find(from) || find(0);
}
function inSelectGap(inp, from){ const v = inp.value; const re = /_{2,}/g; re.lastIndex = from; let m = re.exec(v); if (!m){ re.lastIndex = 0; m = re.exec(v); } if (!m) return false; inp.setSelectionRange(m.index, m.index + m[0].length); return true; }
function expandAbbr(t, suffix){
  if (t.id === 'out'){
    const s = getSelection(); if (!s.rangeCount || !s.isCollapsed) return false; const r = s.getRangeAt(0); const n = r.endContainer; if (n.nodeType !== 3) return false;
    const a = abbrBefore(n.data.slice(0, r.endOffset)); if (!a) return false;
    const start = ceCaret(t) - a.len; const sr = document.createRange(); sr.setStart(n, r.endOffset - a.len); sr.setEnd(n, r.endOffset); s.removeAllRanges(); s.addRange(sr);
    document.execCommand('insertText', false, a.ph + suffix);
    if (/_{2,}/.test(a.ph)) ceSelectGap(t, start);
    return true;
  }
  const p = t.selectionStart; if (p == null || p !== t.selectionEnd) return false; const a = abbrBefore(t.value.slice(0, p)); if (!a) return false;
  t.setSelectionRange(p - a.len, p);
  let ok = false; try{ ok = document.execCommand('insertText', false, a.ph + suffix); }catch(e){}
  if (!ok || t.value.slice(p - a.len, p - a.len + a.ph.length) !== a.ph){ t.setRangeText(a.ph + suffix, p - a.len, p, 'end'); t.dispatchEvent(new Event('input', {bubbles:true})); }
  if (/_{2,}/.test(a.ph)) inSelectGap(t, p - a.len);
  return true;
}
document.addEventListener('keydown', e=>{
  const t = e.target; if (!isTextT(t) || e.ctrlKey || e.metaKey || e.altKey || e.isComposing) return;
  if (e.key === ' ' || (e.key === 'Enter' && t.tagName !== 'INPUT')){ if (expandAbbr(t, e.key === ' ' ? ' ' : '')){ e.preventDefault(); e.stopPropagation(); } return; }
  if (e.key === 'Tab' && !e.shiftKey){
    if (t.id === 'out'){ if (/_{2,}/.test(t.textContent)){ e.preventDefault(); ceSelectGap(t, ceCaret(t)); } }
    else if (/_{2,}/.test(t.value)){ e.preventDefault(); inSelectGap(t, t.selectionEnd); }
  }
}, true);

/* ---------- 2. Подвійне клацання по «справа / зліва» (і похідних) міняє бік ---------- */
function flipWord(w){
  if (!w) return w; const cap = /^[А-ЯІЇЄҐ]/.test(w);
  const lw = cap ? w.charAt(0).toLowerCase() + w.slice(1) : w, r = flip(lw);
  return cap ? r.charAt(0).toUpperCase() + r.slice(1) : r;
}
document.addEventListener('dblclick', e=>{
  const t = e.target.closest ? (e.target.closest('#out') || (isTextT(e.target) ? e.target : null)) : null; if (!t) return;
  if (t.id === 'out'){
    if (!$('#paper').hidden) return;
    const s = getSelection(); if (!s.rangeCount) return; const w = s.toString(); if (!w || w.length > 30) return;
    const tw = w.replace(/\s+$/, ''), r = flipWord(tw); if (r === tw) return;
    document.execCommand('insertText', false, r + w.slice(tw.length)); toast(`${tw} → ${r} · Ctrl+Z — повернути`, 2500); return;
  }
  const a = t.selectionStart, b = t.selectionEnd; if (a == null || a === b) return;
  const w = t.value.slice(a, b), tw = w.replace(/\s+$/, ''), r = flipWord(tw); if (r === tw) return;
  t.setRangeText(r + w.slice(tw.length), a, b, 'select'); t.dispatchEvent(new Event('input', {bubbles:true})); toast(`${tw} → ${r}`, 1800);
});

/* ---------- 3. Стрілки по кнопках: ←→ — у межах групи, ↑↓ — до сусідньої групи ---------- */
document.addEventListener('keydown', e=>{
  if (e.ctrlKey || e.metaKey || e.altKey || !/^Arrow(Left|Right|Up|Down)$/.test(e.key)) return;
  const b = e.target; if (!b || b.tagName !== 'BUTTON' || !b.classList.contains('chip')) return;
  const grp = b.closest('.chips, .segbtns, .cbox') || b.parentElement; const panel = b.closest('.panel'); if (!grp || !panel) return;
  const vis = x => x.offsetParent !== null && !x.disabled;
  if (e.key === 'ArrowLeft' || e.key === 'ArrowRight'){ const bs = [...grp.querySelectorAll('button.chip')].filter(vis); const n = bs[bs.indexOf(b) + (e.key === 'ArrowRight' ? 1 : -1)]; if (n){ e.preventDefault(); n.focus(); } return; }
  const groups = []; panel.querySelectorAll('button.chip').forEach(c=>{ if (!vis(c)) return; const g2 = c.closest('.chips, .segbtns, .cbox') || c.parentElement; if (!groups.includes(g2)) groups.push(g2); });
  const ng = groups[groups.indexOf(grp) + (e.key === 'ArrowDown' ? 1 : -1)]; if (!ng) return;
  const f = [...ng.querySelectorAll('button.chip')].find(vis); if (f){ e.preventDefault(); f.focus(); }
});

/* ---------- 4. Alt+1…9 — перехід до розділу (у встановленій програмі; у браузері на Linux Alt+цифра може перемикати вкладки) ---------- */
document.addEventListener('keydown', e=>{
  if (!e.altKey || e.ctrlKey || e.metaKey || e.shiftKey || !/^Digit[1-9]$/.test(e.code)) return;
  const seq = tabOrder().filter(i=>!TOOL_TABS.includes(TABS[i].id)), i = seq[+e.code.slice(5) - 1];
  if (i != null){ e.preventDefault(); show(i); }
});

/* ---------- 5. Підсвічування щойно зміненого фрагмента в тексті документа ---------- */
function flashChanged(prev){
  if (RESTORING || !prev || !prev.length) return;
  const out = $('#out'), seen = new Set(prev), old = prev.filter(t=>t.trim());
  const ch = [...out.children].filter(e=>e.textContent.trim() && !seen.has(e.textContent));
  if (!ch.length || ch.length > 3) return;
  const left = old.filter(t=>![...out.children].some(e=>e.textContent === t));   // рядки, яких більше немає, — кандидати на «було»
  let first = null;
  ch.forEach(e=>{
    const now = e.textContent, was = bestPrev(now, left), seg = was ? wordDiff(was, now) : null;
    let m = null;
    if (seg && seg[1] > seg[0]) m = markRange(e, seg[0], seg[1]);
    if (m) first = first || m;
    else { e.classList.add('flash'); setTimeout(()=>e.classList.remove('flash'), 2600); first = first || e; }
  });
  if (first) scrollInto(out, first);
}
/* найсхожіший попередній рядок: найдовший спільний початок або кінець */
function bestPrev(now, cand){
  let best = null, sc = 0;
  cand.forEach(t=>{ let a = 0; while (a < t.length && a < now.length && t[a] === now[a]) a++;
    let b = 0; while (b < t.length - a && b < now.length - a && t[t.length - 1 - b] === now[now.length - 1 - b]) b++;
    if (a + b > sc){ sc = a + b; best = t; } });
  return sc >= 6 ? best : null;
}
/* межі нового фрагмента в символах «тепер», вирівняні до цілих слів */
function wordDiff(was, now){
  let a = 0; while (a < was.length && a < now.length && was[a] === now[a]) a++;
  let b = 0; while (b < was.length - a && b < now.length - a && was[was.length - 1 - b] === now[now.length - 1 - b]) b++;
  let s = a, e = now.length - b;
  while (s > 0 && /\S/.test(now[s - 1])) s--;
  while (e < now.length && /\S/.test(now[e])) e++;
  return [s, e];
}
/* обгорнути символи [s, e) рядка в тимчасову позначку */
function markRange(el, s, e){
  try{
    const tw = document.createTreeWalker(el, NodeFilter.SHOW_TEXT); let pos = 0, r = document.createRange(), st = false;
    while (tw.nextNode()){ const n = tw.currentNode, l = n.nodeValue.length;
      if (!st && s <= pos + l){ r.setStart(n, s - pos); st = true; }
      if (st && e <= pos + l){ r.setEnd(n, e - pos); break; }
      pos += l; }
    if (!st) return null;
    const m = document.createElement('mark'); m.className = 'chg'; m.append(r.extractContents()); r.insertNode(m);
    setTimeout(()=>{ if (m.parentNode){ m.replaceWith(...m.childNodes); el.normalize(); } }, 2800);
    return m;
  }catch(x){ return null; }
}
/* прокрутити лише панель тексту (не всю сторінку), щоб змінене було видно */
function scrollInto(box, el){
  if (!box || !el || box.hidden || box.scrollHeight <= box.clientHeight) return;
  const br = box.getBoundingClientRect(), er = el.getBoundingClientRect();
  if (er.top < br.top + 8 || er.bottom > br.bottom - 8) box.scrollTop += er.top - br.top - box.clientHeight / 3;
}

/* ---------- 6. Перевірка: лічильник на «Копіювати» і позначки на розділах ---------- */
{ const rc0 = renderCheck;
  renderCheck = function(){
    const n = rc0.apply(this, arguments) || 0, has = !!itext($('#out')).trim();
    ['#copy', '#copy2'].forEach(s=>{ const b = $(s); if (!b) return; let c = b.querySelector('.cbadge'); if (!c){ c = h('span', {class:'cbadge'}); b.append(c); }
      c.textContent = n; c.hidden = !(has && n); b.title = has && n ? `Перевірка перед підписом: зауважень ${n}` : ''; });
    let L = []; try{ L = has ? checkDoc() : []; }catch(e){}
    const by = {}; L.forEach(x=>{ if (x.tab) (by[x.tab] = by[x.tab] || []).push(x.m); });
    TABS.forEach(t=>{ if (!t.tab) return; const m = by[t.id]; t.tab.classList.toggle('cw', !!m); if (m) t.tab.title = 'Перевірка: ' + m.join('; '); else if (t.tab.title.startsWith('Перевірка: ')) t.tab.title = ''; });
    return n;
  }; }

/* ---------- 7. «Word» і «LibreOffice» → одна кнопка «Зберегти ▾» ---------- */
{ const dx = $('#docxBtn'), od = $('#odtBtn');
  if (dx && od){
    dx.hidden = true; od.hidden = true;
    const menu = h('div', {class:'savemenu', role:'menu', hidden:''},
      h('button', {type:'button', role:'menuitem', onclick:()=>{ menu.hidden = true; dx.click(); }}, h('b', {}, 'Word'), h('span', {}, '.docx — відкривається і в LibreOffice')),
      h('button', {type:'button', role:'menuitem', onclick:()=>{ menu.hidden = true; od.click(); }}, h('b', {}, 'LibreOffice'), h('span', {}, '.odt')),
      h('button', {type:'button', role:'menuitem', onclick:()=>{ menu.hidden = true; doPrint(); }}, h('b', {}, 'PDF'), h('span', {}, 'у вікні друку — «Зберегти як PDF»')));
    const sb = h('button', {type:'button', class:'btn', id:'saveBtn', 'aria-haspopup':'menu', 'aria-expanded':'false', title:'Зберегти документ у файл: Word, LibreOffice або PDF',
      onclick:e=>{ e.stopPropagation(); menu.hidden = !menu.hidden; sb.setAttribute('aria-expanded', menu.hidden ? 'false' : 'true'); }}, 'Зберегти ▾');
    const wrap = h('span', {class:'savewrap'}, sb, menu); od.after(wrap);
    document.addEventListener('click', e=>{ if (!menu.hidden && !wrap.contains(e.target)){ menu.hidden = true; sb.setAttribute('aria-expanded', 'false'); } });
    document.addEventListener('keydown', e=>{ if (e.key === 'Escape' && !menu.hidden){ menu.hidden = true; sb.focus(); } });
  } }

/* ---------- 8. «За хворобою»: пошук над картками і вигляд списком ---------- */
{ const gt = HV.panel && HV.panel.querySelector('.gtabs');
  if (gt && HV.cards){
    const norm = t => String(t || '').toLowerCase().replace(/[’ʼ']/g, '');
    const q = h('input', {type:'search', id:'hvq', placeholder:'Знайти хворобу: назва, код МКХ або скарга', 'aria-label':'Пошук хвороби'});
    const cnt = h('span', {class:'chips-hint'});
    let list = lsGet('po.hvlist', '0') === '1';
    const lb = h('button', {type:'button', class:'btn sm', 'aria-pressed':list ? 'true' : 'false', title:'Показати хвороби компактним списком'}, 'Списком');
    const applyList = () => { HV.cardBox.classList.toggle('dz-list', list); lb.setAttribute('aria-pressed', list ? 'true' : 'false'); };
    lb.onclick = () => { list = !list; lsSet('po.hvlist', list ? '1' : '0'); applyList(); };
    const run = () => {
      const words = norm(q.value.trim()).split(/\s+/).filter(Boolean);
      gt.classList.toggle('dim', !!words.length);
      if (!words.length){ cnt.textContent = ''; HV.filter(); return; }
      let n = 0;
      HV.cards.forEach((c, k)=>{ const p = PRESETS[k]; const x = norm([p.name, p.mkh, (p.skarhy || []).join(' '), (p.osn || '')].join(' ')); const ok = words.every(w=>x.includes(w)); c.hidden = !ok; if (ok) n++; });
      HV.emptyMy.hidden = true; cnt.textContent = n ? `знайдено: ${n}` : 'нічого не знайдено';
    };
    q.addEventListener('input', run);
    q.addEventListener('keydown', e=>{ if (e.key === 'Enter'){ const c = HV.cards.find(x=>!x.hidden); if (c){ e.preventDefault(); c.click(); } } else if (e.key === 'Escape'){ q.value = ''; run(); } });
    gt.addEventListener('click', e=>{ if (e.target.closest('.gtab[data-g]') && q.value){ q.value = ''; run(); } }, true);
    gt.before(h('div', {class:'hvsearch'}, q, lb, cnt));
    { const ld = HV.panel.querySelector('p.lead'); if (ld) ld.remove(); }   // пояснення — у «?» біля назви
    { const f0 = HV.filter; HV.filter = function(){ if (q.value.trim()) return run(); return f0.apply(this, arguments); }; }
    applyList();
  } }

/* ---------- 9. Телефон: закрити текст документа свайпом вниз ---------- */
{ const box = $('#outBox'); let y0 = null, dy = 0;
  box.addEventListener('touchstart', e=>{ if (!box.classList.contains('open') || e.touches.length !== 1) return;
    const top = e.target.closest('.oh') || box.scrollTop <= 0; if (!top || e.target.closest('#out:focus')) { y0 = null; return; } y0 = e.touches[0].clientY; dy = 0; }, {passive:true});
  box.addEventListener('touchmove', e=>{ if (y0 == null) return; dy = e.touches[0].clientY - y0; if (dy > 0 && box.scrollTop <= 0){ box.style.transform = `translateY(${Math.min(dy, 400)}px)`; box.style.transition = 'none'; } }, {passive:true});
  box.addEventListener('touchend', ()=>{ if (y0 == null) return; box.style.transition = ''; box.style.transform = ''; if (dy > 90 && box.scrollTop <= 0) box.classList.remove('open'); y0 = null; dy = 0; });
}

/* ---------- 10. Кошик: видалений пацієнт зберігається 30 днів, «Скасувати» одразу після видалення ---------- */
const TRASH_DAYS = 30;
if (!IDB.ok){ try{ TRASH = JSON.parse(lsGet('po.trash', '{}')) || {}; }catch(e){ TRASH = {}; } }
function trashPut(id, p){
  TRASH[id] = p;
  if (IDB.ok){ try{ const tx = IDB.db.transaction('patients', 'readwrite'); if (p) tx.objectStore('patients').put(p, 'trash:' + id); else tx.objectStore('patients').delete('trash:' + id); }catch(e){} }
  else { if (!p) delete TRASH[id]; try{ localStorage.setItem('po.trash', JSON.stringify(TRASH)); }catch(e){} }
  if (!p) delete TRASH[id];
}
function trashPurge(){ const lim = Date.now() - TRASH_DAYS * 864e5; Object.keys(TRASH).forEach(id=>{ if ((TRASH[id].deleted || 0) < lim) trashPut(id, null); }); renderTrashLink(); }
function restorePatient(id){
  const p = TRASH[id]; if (!p) return; const st = loadStore(); const q = Object.assign({}, p); delete q.deleted; q.updated = Date.now();
  st[id] = q; saveStore(st); trashPut(id, null); renderPatients(); renderTrashLink(); toast('Пацієнта відновлено: ' + (q.name || ''));
}
function snack(msg, btn, fn, ms){
  let s = $('#snack'); if (!s){ s = h('div', {id:'snack', class:'snack', role:'status'}); document.body.append(s); }
  s.innerHTML = ''; s.append(h('span', {}, msg), h('button', {type:'button', class:'btn sm', onclick:()=>{ s.classList.remove('on'); fn(); }}, btn));
  s.classList.add('on'); clearTimeout(snack.t); snack.t = setTimeout(()=>s.classList.remove('on'), ms || 7000);
}
delPatient = function(id){
  const st = loadStore(), p = st[id]; if (!p) return;
  trashPut(id, Object.assign({}, p, {deleted:Date.now()}));
  delete st[id]; saveStore(st); try{ fsDelete(id); }catch(e){}
  if (PID === id) PID = null;
  renderPatients(); renderTrashLink();
  snack(`Видалено: ${p.name || 'пацієнт'}. У кошику ${TRASH_DAYS} днів.`, 'Скасувати', ()=>restorePatient(id));
};
function renderTrashLink(){
  const box = $('#plist'); if (!box) return; let l = $('#trashLink');
  const n = Object.keys(TRASH).length;
  if (!l){ l = h('button', {type:'button', class:'more', id:'trashLink', onclick:trashDialog}); box.after(l); }
  l.hidden = !n; l.textContent = `Кошик (${n}) — видалені за ${TRASH_DAYS} днів`;
}
function trashDialog(){
  const close = () => dlg.remove(), list = h('div', {class:'swlist'});
  const draw = () => { list.innerHTML = ''; const ids = Object.keys(TRASH).sort((a,b)=>(TRASH[b].deleted || 0) - (TRASH[a].deleted || 0));
    if (!ids.length) list.append(h('p', {class:'chips-hint'}, 'Кошик порожній.'));
    ids.forEach(id=>{ const p = TRASH[id], d = new Date(p.deleted || 0), left = Math.max(0, TRASH_DAYS - Math.floor((Date.now() - (p.deleted || 0)) / 864e5));
      const del = h('button', {type:'button', class:'more'}, 'Видалити назавжди');
      del.onclick = () => { if (!del.dataset.arm){ del.dataset.arm = '1'; del.textContent = 'Точно назавжди?'; setTimeout(()=>{ delete del.dataset.arm; del.textContent = 'Видалити назавжди'; }, 3000); return; } trashPut(id, null); draw(); renderTrashLink(); };
      list.append(h('div', {class:'prow'}, h('div', {class:'pn'}, h('b', {}, p.name || 'Без імені'), h('span', {}, `видалено ${pad(d.getDate())}.${pad(d.getMonth() + 1)} · ще ${left} дн.`)),
        h('button', {type:'button', class:'btn', onclick:()=>{ restorePatient(id); draw(); }}, 'Відновити'), del)); }); };
  const dlg = h('div', {class:'navsheet packsheet', role:'dialog', 'aria-modal':'true', 'aria-label':'Кошик'}, h('div', {class:'nvbox'},
    h('div', {class:'nshead'}, h('b', {}, 'Кошик пацієнтів'), h('button', {type:'button', class:'btn', onclick:close}, 'Закрити ✕')),
    h('p', {class:'chips-hint'}, `Видалені пацієнти зберігаються тут ${TRASH_DAYS} днів, потім стираються.`), list));
  dlg.addEventListener('click', e=>{ if (e.target === dlg) close(); }); document.addEventListener('keydown', function k(e){ if (e.key === 'Escape'){ close(); document.removeEventListener('keydown', k); } });
  document.body.append(dlg); draw();
}
{ const rp0 = renderPatients; let purged = false;
  renderPatients = function(){ const r = rp0.apply(this, arguments); try{ if (!purged && (IDB.ok || !window.indexedDB)){ purged = true; trashPurge(); } renderTrashLink(); }catch(e){} return r; }; }

/* ---------- 11. «?» біля назви розділу — коротка довідка саме про нього ---------- */
const SEC_HELP = {
  meta:'ПІБ, дата народження й № карти — для шапки документа. Пацієнт зберігається сам, щойно введено ПІБ. Нижче — список «Сьогодні» і всі збережені пацієнти; видалений пацієнт 30 днів лежить у кошику.',
  hv:'Оберіть хворобу — заповняться скарги, анамнез, типові зміни в огляді, діагноз з кодом і план обстеження; решта систем — у норму. Шукайте за назвою, кодом МКХ або скаргою. Бік ураження перемикає «справа / зліва» в усіх текстах.',
  skarhy:'Натискайте скарги в тому порядку, в якому їх треба написати, — номер на кнопці показує черговість. Уточнення до скарги з’являються одразу під нею. Немає потрібної — впишіть у пошук і натисніть «+ Додати».',
  morbi:'«Хворіє протягом» — кнопками (1 день … рік). Пусте поле в документ не йде.',
  vitae:'«Норма у всіх системах» заповнює типовий анамнез життя; змініть лише те, що відрізняється.',
  zah:'Температура, зріст і вага (ІМТ рахується сам). Значення поза нормою підсвічуються.',
  dyh:'Якщо змін немає — оберіть один рядок «Без особливостей». Детальний опис нижче має пріоритет над ним.',
  ssc:'АТ, ЧСС і пульс поза нормою підсвічуються; ці ж значення підхоплюють шкали й критерії госпіталізації.',
  trav:'Позитивні симптоми — кнопками. Для гострої хірургічної патології почніть з вкладки «За хворобою».',
  nevr:'Для інсульту бік ураження задається на вкладці «За хворобою» — півкуля й бік парезу міняються разом.',
  dx:'Діагноз за пунктами: основний, ускладнення, супутній; код МКХ-10 підставляється з хвороби або з пошуку. План обстеження: «+ дата» — на коли призначено, «✓» — внести результат у журнал обстежень.',
  hosp:'Критерії госпіталізації за Стандартом. Частина з них ставиться сама з показників (SpO2, ЧД, АТ, ЧСС, t°) — з позначкою «перевірте». Немає жодного критерію — програма попередить.',
  rxt:'Схеми для обраної хвороби — з джерелом і рівнем доказовості. Препарат з пошуку додається зі стандартною дозою, шляхом і кратністю. Друк — бланк ф. 003-4/о з обох боків.',
  calc:'Шкали беруть дані з форми (вік, АТ, ЧСС, ЧД, SpO2, креатинін). Результат можна вставити в документ.',
  tpl:'Збережіть свою хворобу, кнопки-фрази чи набір призначень — вони з’являться поруч зі стандартними.',
  set:'Налаштування згорнуті блоками — розгорніть потрібний. Усе зберігається в цьому браузері й не залежить від пацієнта.',
  qv:'Швидкий прийом: лише показники й системи — «Б/о» одним натисканням, змінене — вписати.',
  loc:'Status localis для травми: ділянка, бік, рана, набряк, деформація, рухи.',
  shk:'Якщо змін немає — один рядок «без особливостей». Детальний опис має пріоритет.',
  sech:'Симптом Пастернацького й діурез; для пієлонефриту бік задається на вкладці «За хворобою».'
};
TABS.forEach(t=>{
  const tx = SEC_HELP[t.id]; if (!tx || !t.panel) return; const ph = t.panel.querySelector('.ph'); if (!ph) return;
  const box = h('p', {class:'sechelp', hidden:''}, tx);
  const b = h('button', {type:'button', class:'btn qhelp', 'aria-expanded':'false', 'aria-label':'Довідка про розділ', title:'Що тут і як працювати'}, '?');
  b.onclick = () => { box.hidden = !box.hidden; b.setAttribute('aria-expanded', box.hidden ? 'false' : 'true'); };
  const h2 = ph.querySelector('h2'); if (h2) h2.after(b); else ph.prepend(b);
  ph.append(box);
});

/* ---------- 12. Налаштування: масштаб 90–150 %, бічна панель, скорочення; усе — згортуваними блоками ---------- */
{ const z = $('#set_zoom');
  if (z){ z.innerHTML = ''; [['0.9','90 %'],['1','100 % — звичайний'],['1.1','110 %'],['1.2','120 %'],['1.3','130 %'],['1.4','140 %'],['1.5','150 %']].forEach(([v,l])=>z.append(h('option', {value:v}, l)));
    z.value = ZOOM; if (z.value !== ZOOM){ z.value = '1'; }
    const lab = z.closest('.f') && z.closest('.f').querySelector('label'); if (lab) lab.textContent = 'Масштаб усієї програми';
    const hd = [...SETTINGS_EL.querySelectorAll('h3.sub')].find(x=>x.textContent.startsWith('Розмір тексту')); if (hd) hd.textContent = 'Масштаб і розташування'; } }
if (SETTINGS_EL){
  const zb = $('#set_zoom'), grid = zb && zb.closest('.grid');
  const vs = h('div', {class:'viewset', id:'viewSet'}); if (grid) grid.after(vs); else SETTINGS_EL.append(vs);
  // мої скорочення
  const ab = h('div', {class:'abbrlist'});
  const k0 = h('input', {placeholder:'кт', 'aria-label':'Скорочення', style:'max-width:110px'}), v0 = h('input', {placeholder:'Фраза; «__» — місце для значення, перехід по Tab', 'aria-label':'Фраза'});
  const drawAbbr = () => { ab.innerHTML = ''; const keys = Object.keys(ABBR).sort((a,b)=>a.localeCompare(b, 'uk'));
    if (!keys.length) ab.append(h('p', {class:'chips-hint'}, 'Скорочень поки немає.'));
    keys.forEach(k=>{ const i = h('input', {'aria-label':'Фраза для .' + k}); i.value = ABBR[k]; i.addEventListener('input', ()=>{ ABBR[k] = i.value; saveAbbr(); });
      ab.append(h('div', {class:'abbr'}, h('code', {}, '.' + k), i, h('button', {type:'button', class:'btn sm', 'aria-label':'Видалити .' + k, onclick:()=>{ delete ABBR[k]; saveAbbr(); drawAbbr(); }}, '×'))); }); };
  const add = () => { const k = k0.value.trim().replace(/^\./, '').toLowerCase(), v = v0.value.trim();
    if (!/^[\p{L}\d-]{1,20}$/u.test(k)){ toast('Скорочення — одне слово без пробілів, напр. кт'); return; } if (!v){ toast('Напишіть фразу'); return; }
    ABBR[k] = v; saveAbbr(); k0.value = ''; v0.value = ''; drawAbbr(); toast(`Додано .${k}`); };
  v0.addEventListener('keydown', e=>{ if (e.key === 'Enter'){ e.preventDefault(); add(); } });
  SETTINGS_EL.append(h('h3', {class:'sub'}, 'Мої скорочення'),
    h('p', {class:'chips-hint'}, 'У будь-якому полі для тексту чи в тексті документа наберіть крапку і скорочення, потім пробіл: «.взд » → фраза. «__» у фразі — місце для значення: Tab переходить до наступного. Подвійне клацання по слову «справа» / «зліва» (та «правий», «лівої»…) міняє бік.'),
    ab, h('div', {class:'abbr add'}, k0, v0, h('button', {type:'button', class:'btn', onclick:add}, 'Додати')),
    h('div', {class:'acts2', style:'margin-top:6px'}, h('button', {type:'button', class:'more', onclick:()=>{ ABBR = Object.assign({}, ABBR_DEF, ABBR); saveAbbr(); drawAbbr(); toast('Повернуто стандартні скорочення'); }}, 'Додати стандартні скорочення')));
  drawAbbr();
  // згорнути налаштування блоками
  const kids = [...SETTINGS_EL.children]; let cur = null; const opened = new Set(JSON.parse(lsGet('po.setopen', '["Лікар і відділення"]') || '[]'));
  kids.forEach(k=>{
    if (k.matches('h3.sub')){
      const t = k.textContent.trim(); cur = h('details', {class:'setsec'}); const s = h('summary', {}, t); cur.append(s); k.replaceWith(cur);
      if (opened.has(t)) cur.open = true;
      cur.addEventListener('toggle', ()=>{ const o = new Set(JSON.parse(lsGet('po.setopen', '[]') || '[]')); const d = s.parentElement; if (d.open) o.add(t); else o.delete(t); lsSet('po.setopen', JSON.stringify([...o])); });
      return;
    }
    if (cur && !k.matches('details.about')) cur.append(k); else cur = null;
  });
  { const about = SETTINGS_EL.querySelector('details.about'); if (about) SETTINGS_EL.append(about); }
  // «Шукати в налаштуваннях» відкриває потрібний блок
  const sq = h('input', {type:'search', placeholder:'Знайти налаштування', 'aria-label':'Знайти налаштування', class:'setq'});
  sq.addEventListener('input', ()=>{ const w = sq.value.trim().toLowerCase(); SETTINGS_EL.querySelectorAll('details.setsec').forEach(d=>{ const hit = !w || d.textContent.toLowerCase().includes(w) || [...d.querySelectorAll('input,select,textarea')].some(x=>(x.placeholder || '').toLowerCase().includes(w)); d.hidden = !hit; if (w && hit) d.open = true; }); });
  const lead = SETTINGS_EL.querySelector('p.lead'); if (lead) lead.after(sq); else SETTINGS_EL.prepend(sq);
}

/* ---------- 13. Пам’ятка на 1 сторінку (друк) ---------- */
function memoHTML(){
  const ab = Object.keys(ABBR).slice(0, 8).map(k=>`<tr><td><code>.${esc(k)}</code></td><td>${esc(ABBR[k])}</td></tr>`).join('');
  return `<div class="memo"><h1>«Первинний огляд» — пам’ятка</h1><p class="ms">Версія ${esc(VERSION)} ${esc(STAGE || '')}. Працює без інтернету; пацієнти — лише на цьому пристрої.</p>
<div class="mcols"><section><h2>Порядок роботи</h2><ol><li>Стать → вкладка <b>«За хворобою»</b>: оберіть хворобу (пошук — назва, код, скарга).</li><li>Впишіть ПІБ — пацієнт зберігається сам.</li><li>Пройдіть розділи «Далі ›», змініть те, що відрізняється. «Норма всюди» — решта в норму.</li><li>Діагноз, план обстеження, призначення (схема для хвороби).</li><li>Перевірка перед підписом → <b>Копіювати</b> або <b>Друк</b>.</li></ol>
<h2>Документи</h2><p>Огляд · щоденник · призначення (ф. 003-4/о) · виписний, етапний, перевідний епікриз · консультація · направлення · довідка · згода · пам’ятка пацієнту.</p></section>
<section><h2>Клавіші</h2><table><tr><td>Ctrl+K</td><td>пошук будь-чого</td></tr><tr><td>Ctrl+Enter</td><td>копіювати текст</td></tr><tr><td>Ctrl+P</td><td>друк</td></tr><tr><td>Ctrl+Z</td><td>скасувати дію</td></tr><tr><td>Alt+1…9</td><td>перехід до розділу</td></tr><tr><td>← → ↑ ↓</td><td>по кнопках</td></tr><tr><td>Tab</td><td>наступний пропуск «__»</td></tr></table>
<h2>Швидкість</h2><p>Крапка + скорочення + пробіл → фраза. Подвійне клацання по «справа / зліва» міняє бік.</p><table>${ab}</table></section></div>
<h2>Дані</h2><p>Пацієнти — у сховищі браузера. Раз на тиждень: «Запис» → «Експорт усіх у файл» або папка даних (Налаштування). Видалений пацієнт 30 днів у кошику. Перенос між телефоном і ПК — зашифрованим файлом.</p>
<p class="ms">Програма готує текст; остаточне рішення та підпис — за лікарем.</p></div>`;
}
function memoPrint(){
  let framed = false; try{ framed = window.top !== window.self; }catch(e){ framed = true; }
  const P = $('#print'); P.innerHTML = memoHTML();
  if (framed){ toast('Друк тут заблоковано — відкрийте збережений файл програми', 4000); return; }
  window.print();
}
{ const hp = HELP.panel && HELP.panel.querySelector('.ph');
  if (hp){ const b = h('button', {type:'button', class:'btn sm', onclick:memoPrint, title:'Надрукувати пам’ятку для себе чи колег'}, 'Пам’ятка на 1 сторінку'); const m = hp.querySelector('.qhelp') || hp.querySelector('h2'); if (m) m.after(b); else hp.append(b); } }
{ const si0 = searchItems; searchItems = function(){ const L = si0(); L.push({k:'Дія', t:'Пам’ятка на 1 сторінку (друк)', s:'', go:memoPrint}, {k:'Дія', t:'Кошик пацієнтів', s:'', go:trashDialog}, {k:'Дія', t:'Мої скорочення', s:'', go:()=>{ show(TABS.indexOf(SET)); const d = [...document.querySelectorAll('details.setsec')].find(x=>x.querySelector('summary').textContent === 'Мої скорочення'); if (d){ d.open = true; d.scrollIntoView({block:'start'}); } }}); return L; }; }
